define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.session',
  'bms.visualization',
  'bms.observers',
  'bms.handlers',
  'bms.ws'
], function(angular, $, bms) {

  angular.module('bms.api', [
      'bms.modal',
      'bms.session',
      'bms.visualization',
      'bms.observers',
      'bms.handlers',
      'bms.ws'
    ])
    .factory('bmsApiService', ['ws', '$injector', '$q', 'trigger', 'bmsSessionService', 'bmsObserverService', 'bmsHandlerService', 'bmsVisualizationService', 'bmsModalService', 'bmsWsService',
      function(ws, $injector, $q, trigger, bmsSessionService, bmsObserverService, bmsHandlerService, bmsVisualizationService, bmsModalService, bmsWsService) {

        var addObserver = function(sessionId, viewId, type, data) {

          var defer = $q.defer();

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);
          view.addObserver(type, data)
            .then(
              function success(observer) {
                view.checkObserver(observer)
                  .then(
                    function success() {
                      defer.resolve(observer);
                    },
                    function error(err) {
                      bmsModalService.openErrorDialog(err);
                      defer.reject(err);
                    });
              },
              function error(err) {
                bmsModalService.openErrorDialog(err);
                defer.reject(err);
              });

          return defer.promise;

        };

        var addEvent = function(sessionId, viewId, type, data) {

          var defer = $q.defer();

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);
          view.addEvent(type, data)
            .then(
              function success(evt) {
                view.setupEvent(evt)
                  .then(
                    function success() {
                      defer.resolve(evt);
                    },
                    function error(err) {
                      bmsModalService.openErrorDialog(err);
                      defer.reject(err);
                    });
              },
              function error(err) {
                bmsModalService.openErrorDialog(err);
                defer.reject(err);
              });

          return defer.promise;

        };

        var on = function(sessionId, viewId, what, callback) {

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);
          var listener = view.addListener(what, callback);
          if (listener && what === "ModelInitialised") {
            // Init listener should be called only once
            listener.callback(view);
            listener.executed = true;
          }

        };

        var getModelData = function(sessionId, viewId, what, options) {
          var session = bmsSessionService.getSession(sessionId);
          return session.toolData.model[what];
        };

        var evalExtern = function(sessionId, viewId, options) {

          var defer = $q.defer();

          eval(sessionId, viewId, options)
            .then(function(result) {
              defer.resolve(result);
            }, function(err) {
              defer.reject(err);
            });

          return defer.promise;

        };

        var eval = function(sessionId, viewId, options) {

          var defer = $q.defer();

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);

          var nOptions = bms.normalize(angular.merge({
            formulas: [],
            translate: false,
            trigger: function() {},
            error: function() {}
          }, options), ["trigger", "error"]);

          var randomId = bms.uuid();
          var formulas = {};
          formulas[randomId] = {
            formulas: nOptions.formulas.map(function(f) {
              return {
                formula: f,
                options: {
                  translate: nOptions.translate
                }
              }
            })
          };

          bmsWsService.evaluateFormulas(
              sessionId,
              formulas
            )
            .then(
              function success(r) {

                var results = r[randomId];
                var fresults = [];
                angular.forEach(nOptions.formulas, function(formula) {
                  fresults.push(results[formula]);
                });

                if (nOptions.selector) {
                  nOptions.trigger(view.container.contents().find(nOptions.selector), fresults);
                } else {
                  nOptions.trigger(fresults);
                }

                defer.resolve(results);

              },
              function error(err) {
                bmsModalService.openErrorDialog(err);
                defer.reject(err);
              });

          return defer.promise;

        };

        var executeEvent = function(sessionId, viewId, name, options) {

          var defer = $q.defer();

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);

          var nOptions = bms.normalize(options, ["callback"], view.container);
          nOptions.traceId = view.toolOptions.traceId;
          bmsWsService.executeEvent(sessionId, name, nOptions)
            .then(
              function success(result) {
                if (nOptions.callback) nOptions.callback.call(this, result, view.container);
                defer.resolve(result);
              },
              function error(err) {
                bmsModalService.openErrorDialog(err);
                defer.reject(err);
              });

          return defer.promise;

        };

        return {
          eval: eval,
          evalExtern: evalExtern,
          addObserver: addObserver,
          addEvent: addEvent,
          executeEvent: executeEvent,
          getModelData: getModelData,
          on: on
        }

      }
    ]);

});

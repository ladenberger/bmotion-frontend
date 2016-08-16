define([
  'angular',
  'jquery',
  'bms.func',
  'tv4',
  'bms.modal',
  'bms.session',
  'bms.visualization',
  'bms.observers',
  'bms.handlers',
  'bms.ws',
  'bms.common'
], function(angular, $, bms, tv4) {

  angular.module('bms.api', [
      'bms.modal',
      'bms.session',
      'bms.visualization',
      'bms.observers',
      'bms.handlers',
      'bms.ws',
      'bms.common'
    ])
    .factory('bmsApiService', ['ws', '$injector', '$q', 'trigger', 'bmsSessionService', 'bmsObserverService', 'bmsHandlerService', 'bmsVisualizationService', 'bmsModalService', 'bmsWsService', 'bmsErrorService',
      function(ws, $injector, $q, trigger, bmsSessionService, bmsObserverService, bmsHandlerService, bmsVisualizationService, bmsModalService, bmsWsService, bmsErrorService) {

        var addObserver = function(sessionId, viewId, type, data) {

          var defer = $q.defer();

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);
          view.isInitialized().then(function() {
            view.addObserver(type, data)
              .then(
                function success(observer) {
                  view.checkObserver(observer)
                    .then(
                      function success() {
                        defer.resolve(observer);
                      },
                      function error(err) {
                        bmsErrorService.print(err);
                        //bmsModalService.openErrorDialog(err);
                        defer.reject(err);
                      });
                },
                function error(err) {
                  bmsErrorService.print(err);
                  //bmsModalService.openErrorDialog(err);
                  defer.reject(err);
                });
          });

          return defer.promise;

        };

        var addEvent = function(sessionId, viewId, type, data) {

          var defer = $q.defer();

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);
          view.isInitialized().then(function() {
            view.addEvent(type, data)
              .then(
                function success(evt) {
                  view.setupEvent(evt)
                    .then(
                      function success() {
                        defer.resolve(evt);
                      },
                      function error(err) {
                        bmsErrorService.print(err);
                        //bmsModalService.openErrorDialog(err);
                        defer.reject(err);
                      });
                },
                function error(err) {
                  bmsErrorService.print(err);
                  //bmsModalService.openErrorDialog(err);
                  defer.reject(err);
                });
          });

          return defer.promise;

        };

        var on = function(sessionId, viewId, what, callback) {
          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);
          var listener = view.addListener(what, callback);
          if (what === "ModelInitialised" && session.toolData.initialized) {
            view.triggerListeners("ModelInitialised");
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
          view.isInitialized().then(function() {
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
                  var ferrors = [];
                  angular.forEach(nOptions.formulas, function(formula) {
                    if (results[formula]['error']) {
                      ferrors.push(results[formula]['error']);
                    } else {
                      fresults.push(results[formula]['result']);
                    }
                  });
                  if (ferrors.length > 0) {
                    defer.reject(ferrors);
                  } else {
                    nOptions.trigger(fresults, view.container);
                    defer.resolve(results);
                  }

                },
                function error(err) {
                  bmsErrorService.print(err);
                  //bmsModalService.openErrorDialog(err);
                  defer.reject(err);
                });
          });

          return defer.promise;

        };

        var executeEvent = function(sessionId, viewId, options) {

          var defer = $q.defer();

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);

          var nOptions = bms.normalize(options, ["callback"], view.container);

          if (tv4.validate(nOptions, {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "predicate": {
                  "type": "string"
                }
              },
              "required": ["name"]
            })) {

            bmsWsService.executeEvent(sessionId, nOptions)
              .then(
                function success(result) {
                  if (nOptions.callback) nOptions.callback.call(this, result, view.container);
                  defer.resolve(result);
                },
                function error(err) {
                  bmsErrorService.print(err);
                  //bmsModalService.openErrorDialog(err);
                  defer.reject(err);
                });

          } else {

            var error = "Execute event handler has an invalid scheme: " + tv4.error.message;
            bmsErrorService.print(error);
            //bmsModalService.openErrorDialog(error);
            defer.reject(error);

          }

          return defer.promise;

        };

        var callMethod = function(sessionId, viewId, options) {

          var defer = $q.defer();

          var session = bmsSessionService.getSession(sessionId);
          var view = session.getView(viewId);

          if (tv4.validate(options, {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "args": {
                  "type": "array"
                }
              },
              "required": ["name"]
            })) {

            bmsWsService.callMethod(sessionId, options.name, options.args)
              .then(
                function success(result) {
                  if (options.callback) options.callback.call(this, result);
                  defer.resolve(result);
                },
                function error(err) {
                  bmsErrorService.print(err);
                  defer.reject(err);
                });

          } else {

            var error = "callMethod has an invalid scheme: " + tv4.error.message;
            bmsErrorService.print(error);
            //bmsModalService.openErrorDialog(error);
            defer.reject(error);

          }

          return defer.promise;

        };

        return {
          eval: eval,
          evalExtern: evalExtern,
          addObserver: addObserver,
          addEvent: addEvent,
          executeEvent: executeEvent,
          callMethod: callMethod,
          getModelData: getModelData,
          on: on
        }

      }
    ]);

});

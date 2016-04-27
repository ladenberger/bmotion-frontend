define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.session',
  'bms.visualization',
  'bms.observers',
  'bms.handlers'
], function(angular, $, bms) {

  angular.module('bms.api', ['bms.modal', 'bms.session', 'bms.visualization', 'bms.observers', 'bms.handlers'])
    .factory('bmsApiService', ['ws', '$injector', '$q', 'trigger', 'bmsSessionService', 'bmsObserverService', 'bmsHandlerService', 'bmsVisualizationService', 'bmsModalService',
      function(ws, $injector, $q, trigger, bmsSessionService, bmsObserverService, bmsHandlerService, bmsVisualizationService, bmsModalService) {

        var addObserver = function(visId, type, data, list) {

          var vis = bmsVisualizationService.getVisualization(visId);
          vis.addObserver(type, data, list)
            .then(function(observer) {
              vis.checkObserver(observer)
                .then(function() {}, function(err) {
                  bmsModalService.openErrorDialog(err);
                });
            }, function(err) {
              bmsModalService.openErrorDialog(err);
            });

          /*if (vis.stateId !== 'root' && vis.initialised && vis.lastOperation !== '$setup_constants') {
            var promises = [];
            for (var svg in vis.svg) {
              promises.push(vis.svg[svg]['defer'].promise);
            }
            $q.all(promises).then(function() {
              triggerObserver(visId, observer, vis.stateId, data.cause);
            });
          }*/

        };

        var addEvent = function(visId, type, data, list) {

          var vis = bmsVisualizationService.getVisualization(visId);
          var evt = vis.addEvent(type, data, list)
            .then(function(evt) {
              vis.setupEvent(evt)
                .then(function() {}, function(err) {
                  bmsModalService.openErrorDialog(err);
                });
            }, function(err) {
              bmsModalService.openErrorDialog(err);
            });

          /*var instance = $injector.get(type, "");
          var promises = [];
          for (var svg in vis.svg) {
            promises.push(vis.svg[svg]['defer'].promise);
          }
          $q.all(promises).then(function() {
            instance.setup(bmsSessionService.getSessionId(), visId, evt, vis.container, vis.traceId);
          });*/

        };

        var on = function(visId, what, callback) {
          var vis = bmsVisualizationService.getVisualization(visId);
          var listener = vis.addListener(what, callback);
          if (what === "ModelInitialised" && vis.initialised && listener) {
            // Init listener should be called only once
            listener.callback(vis);
            listener.executed = true;
          }
        };

        var getModelData = function(visId, what, options) {
          var vis = bmsVisualizationService.getVisualization(visId);
          return vis["model"][what];
        };

        var evalExtern = function(visId, options) {
          eval(visId, options)
            .then(function(result) {}, function(err) {
              bmsModalService.openErrorDialog(err);
            });
        };

        var eval = function(visId, options) {

          var defer = $q.defer();

          var vis = bmsVisualizationService.getVisualization(visId);

          var nOptions = bms.normalize(angular.merge({
            formulas: [],
            translate: false,
            trigger: function() {},
            error: function() {}
          }, options), ["trigger", "error"]);

          ws.emit('evaluateFormulas', {
            data: {
              id: bmsSessionService.getSessionId(),
              formulas: nOptions.formulas.map(function(f) {
                return {
                  formula: f,
                  translate: nOptions.translate
                }
              })
            }
          }, function(r) {

            var errors = [];
            var results = [];

            angular.forEach(nOptions.formulas, function(f) {
              if (r[f]['error']) {
                var errorMsg = r[f]['error'] + " ("
                if (nOptions.selector) {
                  errorMsg = errorMsg + "selector: " + nOptions.selector + ", ";
                }
                errorMsg = errorMsg + "formula: " + f + ")";
                errors.push(errorMsg);
              } else {
                results.push(r[f]['trans'] !== undefined ? r[f]['trans'] : r[f]['result']);
              }
            });

            if (errors.length === 0) {
              if (nOptions.selector) {
                nOptions.trigger(vis.container.contents().find(nOptions.selector), results);
              } else {
                nOptions.trigger(results);
              }
              defer.resolve(results);
            } else {
              nOptions.error(errors);
              defer.reject(errors);
            }

          });

          return defer.promise;

        };

        var executeEvent = function(visId, options) {
          var vis = bmsVisualizationService.getVisualization(visId);
          var nOptions = bms.normalize(options, ["callback"], vis.container);
          nOptions.traceId = vis.traceId;
          ws.emit("executeEvent", {
            sessionId: bmsSessionService.getSessionId(),
            name: nOptions.name,
            options: nOptions
          }, function(result) {
            if (nOptions.callback) nOptions.callback.call(this, result, vis.container);
          });
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

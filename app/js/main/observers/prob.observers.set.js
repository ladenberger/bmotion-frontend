/**
 * BMotionWeb for ProB Observer Set Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.visualization',
  'bms.socket',
  'bms.session'
], function(angular, $, bms) {

  return angular.module('prob.observers.set', ['bms.modal', 'bms.visualization', 'bms.socket', 'bms.session'])
    .factory('setObserver', ['ws', '$q', 'bmsModalService', 'bmsVisualizationService',
      function(ws, $q, bmsModalService, bmsVisualizationService) {
        'use strict';

        var observerService = {

          getDefaultOptions: function(options) {
            return angular.merge({
              set: "",
              cause: "AnimationChanged",
              convert: function(element) {
                return "#" + element;
              },
              actions: []
            }, options);
          },
          shouldBeChecked: function(observer, view) {
            var session = view.session;
            if (session.isBVisualization()) {
              if (typeof session.toolData.initialized === 'boolean' && session.toolData.initialized === false) {
                return false;
              } else if (session.toolData.model !== undefined) {
                var refinements = session.toolData.model.refinements;
                if (refinements) {
                  return observer.options.refinement ? bms.inArray(observer.options.refinement, refinements) : true;
                }
              }
            }
            return true;
          },
          getDiagramData: function(node, observer, view, element) {
            if (node.results) {
              return observerService.getFormulas(observer, view, element).map(function(fobj) {
                return node.results[observer.id][fobj.formula]['result'];
              });
            } else {
              return [];
            }
          },
          getFormulas: function(observer, view, element) {
            var normalized = bms.normalize(observer.options, ["true", "false"], element, view.container);
            return [{
              formula: normalized.set,
              options: {
                translate: true
              }
            }];
          },
          apply: function(observer, view, element, container, result) {

            var defer = $q.defer();

            container = container ? container : view.container.contents();

            var normalized = bms.normalize(observer.options, ["convert", "trigger"], element, container);

            if (element instanceof $) {

              var fvalues = {};

              if (Object.prototype.toString.call(result) === '[object Array]' && result.length > 0) {
                var convertedResult = result.map(function(element) {
                  return normalized.convert(element);
                });
                var setSelector = convertedResult.join(",");
                var setElements = element.find(setSelector);
                setElements.each(function(i, e) {
                  var ele = $(e);
                  angular.forEach(normalized.actions, function(action) {
                    var bmsid = view.getBmsIdForElement(ele);
                    if (fvalues[bmsid] === undefined) {
                      fvalues[bmsid] = {};
                    }
                    fvalues[bmsid][action.attr] = action.value;
                  });
                });
              }

              defer.resolve(fvalues);

            } else {
              bms.callFunction(normalized.trigger, 'set', setElements);
              defer.resolve({});
            }

            return defer.promise;

          },
          check: function(observer, view, element, results) {

            var defer = $q.defer();

            if (!results) {
              defer.reject("Results must be passed to set observer check function.");
            } else {

              var normalized = bms.normalize(observer.options, ["true", "false"], element, view.container);

              if (results[normalized.set]) {

                if (results[normalized.set]['error']) {
                  defer.reject(results[normalized.set]['error']);
                } else {
                  observerService.apply(observer, view, element, view.container, results[normalized.set]['result'])
                    .then(
                      function(values) {
                        defer.resolve(values);
                      },
                      function(error) {
                        defer.reject(error);
                      });
                }

              } else {
                defer.reject("Some error occurred in predicate check function.");
              }

            }

            return defer.promise;

          }


        };

        return observerService;

      }
    ]);

});

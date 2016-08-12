/**
 * BMotionWeb Observer Formula Module
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

  return angular.module('bms.observers.formula', ['bms.modal', 'bms.visualization', 'bms.socket', 'bms.session'])
    .factory('formulaObserver', ['ws', '$q', 'bmsModalService', 'bmsVisualizationService',
      function(ws, $q, bmsModalService, bmsVisualizationService) {
        'use strict';

        var observerService = {

          getDefaultOptions: function(options) {
            return angular.merge({
              formulas: [],
              cause: "AnimationChanged",
              translate: false,
              trigger: function() {}
            }, options);
          },
          shouldBeChecked: function(observer, view) {
            var session = view.session;
            if (session.isBVisualization()) {
              if (typeof session.toolData.initialized === 'boolean' && session.toolData.initialized === false) {
                return false;
              }
              if (session.toolData.model !== undefined) {
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
              return observerService.getFormulas(observer, view, element)
                .map(function(fobj) {
                  return node.results[observer.id][fobj.formula]['result'];
                });
            } else {
              return [];
            }
          },
          getFormulas: function(observer, view, element) {

            var normalized = bms.normalize(observer.options, ["trigger"], element, view.container);

            return bms.toList(normalized.formulas)
              .map(function(f) {
                return {
                  formula: f,
                  options: {
                    translate: normalized.translate
                  }
                }
              });

          },
          apply: function(observer, view, element, container, result) {

            var defer = $q.defer();

            if (element instanceof $) {
              var fvalues = {};
              var returnValue = bms.callElementFunction(observer.options.trigger, element, 'values', result);
              if (returnValue) {
                var bmsid = view.getBmsIdForElement(element);
                fvalues[bmsid] = returnValue;
              }
              defer.resolve(fvalues);
            } else {
              bms.callFunction(observer.options.trigger, 'values', result);
              defer.resolve({});
            }

            return defer.promise;

          },
          check: function(observer, view, element, results) {

            var defer = $q.defer();

            if (!results) {
              defer.reject("Results must be passed to formula observer check function.");
            } else {

              var normalized = bms.normalize(observer.options, ["trigger"], element, view.container);

              var fresults = [];
              var ferrors = [];
              // Iterate formulas and get result or error
              angular.forEach(normalized.formulas, function(formula) {
                if (results[formula]) {
                  if (results[formula]['result'] !== undefined) {
                    fresults.push(results[formula]['result']);
                  }
                  if (results[formula]['error'] !== undefined) {
                    ferrors.push(results[formula]['error']);
                  }
                }
              });

              if (ferrors.length > 0) {
                defer.reject(ferrors);
              } else if (normalized.formulas.length !== fresults.length) {
                defer.reject("Some error occurred in formula check function.");
              } else {
                observerService.apply(observer, view, element, view.container, fresults)
                  .then(
                    function(values) {
                      defer.resolve(values);
                    },
                    function(error) {
                      defer.reject(error);
                    });
              }

            }

            return defer.promise;

          }

        }

        return observerService;

      }
    ]);

});

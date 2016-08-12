/**
 * BMotionWeb for ProB Observer Predicate Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.visualization'
], function(angular, $, bms) {

  return angular.module('prob.observers.predicate', ['bms.modal', 'bms.visualization'])
    .factory('predicateObserver', ['ws', '$q', 'bmsVisualizationService',
      function(ws, $q, bmsVisualizationService) {
        'use strict';

        var observerService = {

          getDefaultOptions: function(options) {
            return angular.merge({
              predicate: "",
              true: function() {},
              false: function() {},
              cause: "AnimationChanged"
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
              return getFormulas(observer, view, element).map(function(fobj) {
                return node.results[getId()][fobj.formula]['result'];
              });
            } else {
              return [];
            }
          },
          getFormulas: function(observer, view, element) {
            var normalized = bms.normalize(observer.options, ["true", "false"], element, view.container);
            return bms.toList(normalized.formulas).map(function(f) {
              return {
                formula: normalized.predicate,
                options: {
                  translate: false
                }
              }
            });
          },
          apply: function(observer, view, element, container, result) {

            var defer = $q.defer();

            container = container ? container : view.container.contents();

            if (Object.prototype.toString.call(result) === '[object Array]') {
              result = result[0];
            }

            if (element instanceof $) {
              var fvalues = {};
              var returnValue;
              if (result === "TRUE") {
                returnValue = bms.callElementFunction(observer.options.true, element);
              } else if (result === "FALSE") {
                returnValue = bms.callElementFunction(observer.options.false, element);
              }
              if (returnValue) {
                var bmsid = view.getBmsIdForElement(element);
                fvalues[bmsid] = returnValue;
              }
              defer.resolve(fvalues);
            } else {
              if (result === "TRUE") {
                bms.callFunction(observer.options.true);
              } else if (result === "FALSE") {
                bms.callFunction(observer.options.false);
              }
              defer.resolve({});
            }

            return defer.promise;

          },
          check: function(observer, view, element, results) {

            var defer = $q.defer();

            if (!results) {
              defer.reject("Results must be passed to predicate predicate observer check function.");
            } else {

              var normalized = bms.normalize(observer.options, ["trigger"], element, view.container);

              if (results[normalized.predicate]) {

                if (results[normalized.predicate]['error']) {
                  defer.reject(results[normalized.predicate]['error']);
                } else {
                  observerService.apply(observer, view, element, view.container, results[normalized.predicate]['result'])
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

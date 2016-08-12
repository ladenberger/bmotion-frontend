/**
 * BMotionWeb Observer Method Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.visualization',
  'bms.ws'
], function(angular, $, bms) {

  return angular.module('bms.observers.method', ['bms.modal', 'bms.visualization'])
    .factory('methodObserver', ['ws', '$q', 'bmsVisualizationService', 'bmsWsService',
      function(ws, $q, bmsVisualizationService, bmsWsService) {
        'use strict';

        var observerService = {

          getDefaultOptions: function(options) {
            return angular.merge({
              name: "",
              args: [],
              callback: function() {},
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
          apply: function(observer, view, element, container) {

            var defer = $q.defer();

            container = container ? container : view.container.contents();

            var normalized = bms.normalize(observer.options, ['callback'], element, container);

            if (element instanceof $) {

              var fvalues = {};
              var promises = [];

              promises.push(function() {

                var d = $q.defer();

                bmsWsService.callMethod(view.session.id, normalized.name, normalized.args)
                  .then(function(res) {
                    var returnValue = normalized.callback.call(this, element, res);
                    var tvalue = {};
                    if (returnValue) {
                      var bmsid = view.getBmsIdForElement(element);
                      tvalue[bmsid] = returnValue;
                    }
                    d.resolve(tvalue);
                  }, function(err) {
                    d.reject(err);
                  });

                return d.promise;

              }());

              $q.all(promises)
                .then(function(data) {
                  angular.forEach(data, function(r) {
                    fvalues = angular.merge(r, fvalues);
                  });
                  defer.resolve(fvalues);
                }, function(errors) {
                  defer.reject(errors);
                });

            } else {
              defer.resolve({});
            }

            return defer.promise;

          },
          check: function(observer, view, element) {

            var defer = $q.defer();

            observerService.apply(observer, view, element, view.container)
              .then(
                function(values) {
                  defer.resolve(values);
                },
                function(error) {
                  defer.reject(error);
                });

            return defer.promise;

          }

        };

        return observerService;

      }
    ]);

});

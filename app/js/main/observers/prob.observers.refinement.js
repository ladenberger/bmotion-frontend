/**
 * BMotionWeb for ProB Observer Refinement Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.visualization'
], function(angular, $, bms) {

  return angular.module('prob.observers.refinement', ['bms.modal', 'bms.visualization'])
    .factory('refinementObserver', ['ws', '$q', 'bmsVisualizationService',
      function(ws, $q, bmsVisualizationService) {
        'use strict';

        var observerService = {

          getDefaultOptions: function(options) {
            return angular.merge({
              refinement: "",
              enable: function() {},
              disable: function() {}
            }, options);
          },
          apply: function(observer, view, element, container, isRefinement) {

            var defer = $q.defer();

            container = container ? container : view.container.contents();

            if (element instanceof $) {

              var fvalues = {};

              var rr;

              if (isRefinement) {
                rr = bms.callElementFunction(observer.options.enable, element);
              } else {
                rr = bms.callElementFunction(observer.options.disable, element);
              }
              if (rr) {
                var bmsid = view.getBmsIdForElement(element);
                fvalues[bmsid] = rr;
              }

              defer.resolve(fvalues);

            } else {

              if (isRefinement) {
                bms.callFunction(observer.options.enable);
              } else {
                bms.callFunction(observer.options.disable);
              }

              defer.resolve({});

            }

            return defer.promise;

          },
          check: function(observer, view, element) {

            //TODO: Check refinement observer only once!
            var self = this;
            var defer = $q.defer();
            var visRefinements = view.session.toolData['model']['refinements'];
            var normalized = bms.normalize(observer.options, ['enable', 'disable'], element, view.container);
            var isRefinement = bms.inArray(normalized.refinement, visRefinements);
            defer.resolve(this.apply(observer, view, element, view.container, isRefinement));
            return defer.promise;

          }

        };

        return observerService;

      }
    ]);

});

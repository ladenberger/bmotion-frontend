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

        var observer = function(view, options) {
          this.id = bms.uuid();
          this.view = view;
          this.options = this.getDefaultOptions(options);
        };

        observer.prototype.getDefaultOptions = function(options) {
          return angular.merge({
            refinement: "",
            enable: function() {},
            disable: function() {}
          }, options);
        };

        observer.prototype.apply = function(isRefinement) {

          var defer = $q.defer();

          var obj = {};

          if (isRefinement) {
            var self = this;
            var jcontainer = $(container);
            var el = container.find(this.options.selector);
            el.each(function(i, v) {
              var rr;
              var e = $(v);
              var ref = bms.callOrReturn(self.options.refinement, e, jcontainer);
              // TODO: Maybe an intersection of both arrays (visRefinements and observerRefinements) would be more efficient.
              if (bms.inArray(ref, visRefinements)) {
                rr = bms.callOrReturn(self.options.enable, e, jcontainer);
              } else {
                rr = bms.callOrReturn(self.options.disable, e, jcontainer);
              }
              if (rr) {
                var bmsid = bmsVisualizationService.getBmsIdForElement(e);
                obj[bmsid] = rr;
              }
            });

          }

          defer.resolve(obj);

          return defer.promise;

        };

        observer.prototype.check = function() {

          //TODO: Check refinement observer only once!
          var self = this;
          var defer = $q.defer();
          var visRefinements = self.view.session.toolData['model']['refinements'];
          defer.resolve(this.apply(bms.inArray(this.options.refinement, visRefinements)));
          return defer.promise;

        };

        return observer;

      }
    ]);

});

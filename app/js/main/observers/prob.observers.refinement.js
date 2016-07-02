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

          var self = this;
          var selector = self.options.selector;

          if (!selector && !self.options.element) {
            defer.reject("Please specify a selector or an element.");
          } else {
            var el = self.view.container.find(self.options.selector);
            var jcontainer = $(self.view.container);
            el.each(function(i, v) {
              var rr;
              var e = $(v);
              if (isRefinement) {
                rr = bms.callOrReturn(self.options.enable, e);
              } else {
                rr = bms.callOrReturn(self.options.disable, e);
              }
              if (rr) {
                var bmsid = self.view.getBmsIdForElement(e);
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

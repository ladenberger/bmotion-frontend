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

        observer.prototype.apply = function(isRefinement, _container_) {

          var defer = $q.defer();
          var self = this;
          var element;

          // Determine graphical element of observer
          if (self.options.element !== undefined) {
            element = self.options.element;
          } else if (self.options.selector !== undefined) {
            var container = _container_ ? _container_ : self.view.container.contents();
            element = container.find(self.options.selector);
          }

          if (element instanceof $) {
            var fvalues = {};
            var el = self.view.container.find(self.options.selector);
            var jcontainer = $(self.view.container);
            el.each(function(i, v) {
              var rr;
              var e = $(v);
              if (isRefinement) {
                rr = bms.callElementFunction(self.options.enable, e);
              } else {
                rr = bms.callElementFunction(self.options.disable, e);
              }
              if (rr) {
                var bmsid = self.view.getBmsIdForElement(e);
                fvalues[bmsid] = rr;
              }
            });
            defer.resolve(fvalues);
          } else {
            if (isRefinement) {
              bms.callFunction(self.options.enable);
            } else {
              bms.callFunction(self.options.disable);
            }
            defer.resolve({});
          }

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

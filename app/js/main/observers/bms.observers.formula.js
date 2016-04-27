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

        var observer = function(view, options) {
          this.id = bms.uuid();
          this.type = 'formulaObserver';
          this.view = view;
          this.options = this.getDefaultOptions(options);
        };

        observer.prototype.getDefaultOptions = function(options) {
          return angular.merge({
            formulas: [],
            cause: "AnimationChanged",
            translate: false,
            trigger: function() {}
          }, options);
        };

        observer.prototype.shouldBeChecked = function() {

          var self = this;

          var session = self.view.session;
          if (session.isBVisualization()) {
            var refinements = session.toolData.model.refinements;
            var isRefinement = self.options.refinement !== undefined ? bms.inArray(self.options.refinement, refinements) : true;
            var isInitialized = session.toolData.initialized ? session.toolData.initialized : false;
            return isRefinement && isInitialized;
          }

          return true;

        };

        observer.prototype.getId = function() {
          return this.id;
        };

        observer.prototype.getDiagramData = function(node) {
          var self = this;
          if(node.results) {
            return self.getFormulas().map(function(fobj) {
              return node.results[self.getId()][fobj.formula];
            });
          } else {
              return [];
          }
        };

        observer.prototype.getFormulas = function() {

          var self = this;

          return bms.toList(this.options.formulas).map(function(f) {

            return {
              formula: f,
              options: {
                translate: self.options.translate
              }
            }
          });

        };

        observer.prototype.apply = function(result, _container_) {

          var defer = $q.defer();

          var self = this;
          var selector = self.options.selector;
          if (selector) {
            var fvalues = {};
            var container = _container_ ? _container_ : self.view.container.contents();
            var element = container.find(selector);
            element.each(function() {
              var ele = $(this);
              var returnValue = bms.callElementFunction(self.options.trigger, ele, 'values', result);
              if (returnValue) {
                var bmsid = self.view.getBmsIdForElement(ele);
                fvalues[bmsid] = returnValue;
              }
            });
            defer.resolve(fvalues);
          } else {
            bms.callFunction(this.options.trigger, 'values', result);
            defer.resolve();
          }

          return defer.promise;

        };

        observer.prototype.check = function(results) {

          var defer = $q.defer();

          var fresults = [];
          angular.forEach(this.options.formulas, function(formula) {
            fresults.push(results[formula]);
          });

          this.apply(fresults).then(function(values) {
            defer.resolve(values);
          });

          return defer.promise;

        };

        return observer;

      }
    ]);

});

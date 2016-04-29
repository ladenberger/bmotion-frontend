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

        var observer = function(view, options) {
          this.id = bms.uuid();
          this.view = view;
          this.options = this.getDefaultOptions(options);
        };

        observer.prototype.getDefaultOptions = function(options) {
          return angular.merge({
            predicate: "",
            true: function() {},
            false: function() {},
            cause: "AnimationChanged"
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
          return [{
            formula: this.options.predicate,
            options: {
              translate: false
            }
          }];
        };

        observer.prototype.apply = function(data) {

          var defer = $q.defer();

          var self = this;

          var selector = self.options.selector;
          if (selector) {
            var fvalues = {};
            var result = data.result;
            var element = self.view.container.find(selector);
            var jcontainer = $(self.view.container);
            element.each(function() {
              var ele = $(this);
              var returnValue;
              //var normalized = bms.normalize(observer.data, [], ele);
              if (result[0] === "TRUE") {
                returnValue = bms.callOrReturn(self.options.true, ele, jcontainer);
              } else if (result[0] === "FALSE") {
                returnValue = bms.callOrReturn(self.options.false, ele, jcontainer);
              }
              if (returnValue) {
                var bmsid = self.view.getBmsIdForElement(ele);
                fvalues[bmsid] = returnValue;
              }
            });
            defer.resolve(fvalues);
          } else {
            if (result[0] === "TRUE") {
              bms.callFunction(this.options.true);
            } else if (result[0] === "FALSE") {
              bms.callFunction(this.options.false);
            }
            defer.resolve();
          }

          return defer.promise;

        };

        observer.prototype.check = function(results) {

          var defer = $q.defer();

          var self = this;

          self.apply({
            result: [results[self.options.predicate]]
          }).then(function(values) {
            defer.resolve(values);
          });

          return defer.promise;

        };

        return observer;

      }
    ]);

});

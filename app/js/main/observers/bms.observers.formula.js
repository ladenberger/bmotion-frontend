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
            var isRefinement = self.options.refinement ? bms.inArray(self.options.refinement, refinements) : true;
            //var isInitialized = session.toolData.initialized ? session.toolData.initialized : false;
            //return isRefinement && isInitialized;
            return isRefinement;
          }

          return true;

        };

        observer.prototype.getId = function() {
          return this.id;
        };

        observer.prototype.getDiagramData = function(node) {
          var self = this;
          if (node.results) {
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

          if (!selector && !self.options.element) {
            defer.reject("Please specify a selector or an element.");
          } else {
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
          }

          return defer.promise;

        };

        observer.prototype.check = function(results) {

          var defer = $q.defer();

          if (!results) {
            defer.reject("Results must be passed to formula observer check function.");
          } else {

            var fresults = [];
            var ferrors = [];
            // Iterate formulas and get result or error
            angular.forEach(this.options.formulas, function(formula) {
              if (results[formula]) {
                if (results[formula]['result']) {
                  fresults.push(results[formula]['result']);
                }
                if (results[formula]['error']) {
                  ferrors.push(results[formula]['error']);
                }
              }
            });

            if (ferrors.length > 0) {
              defer.reject(ferrors);
            }
            if (this.options.formulas.length !== fresults.length) {
              defer.reject("Some error occurred in formula check function.");
            } else {
              this.apply(fresults).then(
                function(values) {
                  defer.resolve(values);
                },
                function(error) {
                  defer.reject(error);
                });
            }

          }

          return defer.promise;

        };

        return observer;

      }
    ]);

});

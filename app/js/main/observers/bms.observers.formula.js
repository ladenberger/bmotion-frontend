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
            if (typeof session.toolData.initialized === 'boolean' && session.toolData.initialized === false) {
              return false;
            }
            if (session.toolData.model !== undefined) {
              var refinements = session.toolData.model.refinements;
              if (refinements) {
                return self.options.refinement ? bms.inArray(self.options.refinement, refinements) : true;
              }
            }
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
            bms.callFunction(self.options.trigger, 'values', result);
            defer.resolve({});
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
                if (results[formula]['result'] !== undefined) {
                  fresults.push(results[formula]['result']);
                }
                if (results[formula]['error']) {
                  ferrors.push(results[formula]['error']);
                }
              }
            });

            if (ferrors.length > 0) {
              defer.reject(ferrors);
            } else if (this.options.formulas.length !== fresults.length) {
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

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
            if (typeof session.toolData.initialized === 'boolean' && session.toolData.initialized === false) {
              return false;
            } else if (session.toolData.model !== undefined) {
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
              return node.results[self.getId()][fobj.formula]['result'];
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

        observer.prototype.apply = function(result, _container_) {

          var defer = $q.defer();
          var self = this;
          var element;

          if (Object.prototype.toString.call(result) === '[object Array]') {
            result = result[0];
          }

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
              var returnValue;
              //var normalized = bms.normalize(observer.data, [], ele);
              if (result === "TRUE") {
                returnValue = bms.callElementFunction(self.options.true, ele);
              } else if (result === "FALSE") {
                returnValue = bms.callElementFunction(self.options.false, ele);
              }
              if (returnValue) {
                var bmsid = self.view.getBmsIdForElement(ele);
                fvalues[bmsid] = returnValue;
              }
            });
            defer.resolve(fvalues);
          } else {
            if (result === "TRUE") {
              bms.callFunction(self.options.true);
            } else if (result === "FALSE") {
              bms.callFunction(self.options.false);
            }
            defer.resolve({});
          }

          return defer.promise;

        };

        observer.prototype.check = function(results) {

          var defer = $q.defer();
          var self = this;

          if (!results) {
            defer.reject("Results must be passed to predicate predicate observer check function.");
          } else {
            if (results[self.options.predicate]) {

              if (results[self.options.predicate]['error']) {
                defer.reject(results[self.options.predicate]['error']);
              } else {
                self.apply(results[self.options.predicate]['result'])
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

        };

        return observer;

      }
    ]);

});

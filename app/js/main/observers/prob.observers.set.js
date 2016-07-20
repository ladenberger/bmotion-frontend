/**
 * BMotionWeb for ProB Observer Set Module
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

  return angular.module('prob.observers.set', ['bms.modal', 'bms.visualization', 'bms.socket', 'bms.session'])
    .factory('setObserver', ['ws', '$q', 'bmsModalService', 'bmsVisualizationService',
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
            set: "",
            cause: "AnimationChanged",
            convert: function(element) {
              return "#" + element;
            },
            trigger: function(origin, set) {}
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
            formula: this.options.set,
            options: {
              translate: true
            }
          }];
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

            if (Object.prototype.toString.call(result) === '[object Array]' && result.length > 0) {
              var convertedResult = result.map(function(ele) {
                return self.options.convert(ele);
              });
              var setSelector = convertedResult.join(",");
              element.each(function() {
                var ele = $(this);
                var setElements = ele.find(setSelector);
                var returnValue = bms.callElementFunction(self.options.trigger, ele, 'set', setElements);
                if (returnValue) {
                  var bmsid = self.view.getBmsIdForElement(ele);
                  fvalues[bmsid] = returnValue;
                }
              });
            }

            defer.resolve(fvalues);

          } else {
            bms.callFunction(self.options.trigger, 'set', setElements);
            defer.resolve({});
          }

          return defer.promise;

        };

        observer.prototype.check = function(results) {

          var defer = $q.defer();
          var self = this;

          if (!results) {
            defer.reject("Results must be passed to set observer check function");
          } else {

            if (results[self.options.set]) {

              if (results[self.options.set]['error']) {
                defer.reject(results[self.options.set]['error']);
              } else {
                self.apply(results[self.options.set]['result'])
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

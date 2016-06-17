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
            trigger: function(origin, set) {
            }
          }, options);
        };

        observer.prototype.shouldBeChecked = function() {

          var self = this;

          var session = self.view.session;
          if (session.isBVisualization()) {
            var refinements = session.toolData.model.refinements;
            var isRefinement = self.options.refinement ? bms.inArray(self.options.refinement, refinements) : true;
            return isRefinement;
          }

          return true;

        };

        observer.prototype.getId = function() {
          return this.id;
        };

        observer.prototype.getDiagramData = function(node) {
          // TODO Implement me!
          return [];
        };

        observer.prototype.getFormulas = function() {
          return [{
            formula: this.options.set,
            options: {
              translate: true
            }
          }];
        };

        observer.prototype.apply = function(data, _container_) {

          var defer = $q.defer();
          var self = this;
          var selector = self.options.selector;
          var fvalues = {};
          var result = data.result[0];
          var container = _container_ ? _container_ : self.view.container.contents();

          var convertedResult = result.map(function(ele) {
            return self.options.convert(ele);
          });

          if (convertedResult.length > 0) {
            var setSelector = convertedResult.join(",");
            var element = container.find(selector);
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

          return defer.promise;

        };

        observer.prototype.check = function(results) {

          var defer = $q.defer();

          var self = this;

          self.apply({
            result: [results[self.options.set]]
          }).then(function(values) {
            defer.resolve(values);
          });

          return defer.promise;

        };

        return observer;

      }
    ]);

});

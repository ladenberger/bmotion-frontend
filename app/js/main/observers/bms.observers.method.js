/**
 * BMotionWeb Observer Method Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.visualization',
  'bms.ws'
], function(angular, $, bms) {

  return angular.module('bms.observers.method', ['bms.modal', 'bms.visualization'])
    .factory('methodObserver', ['ws', '$q', 'bmsVisualizationService', 'bmsWsService',
      function(ws, $q, bmsVisualizationService, bmsWsService) {
        'use strict';

        var observer = function(view, options) {
          this.id = bms.uuid();
          this.view = view;
          this.options = this.getDefaultOptions(options);
        };

        observer.prototype.getDefaultOptions = function(options) {
          return angular.merge({
            name: "",
            args: [],
            callback: function() {},
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

        observer.prototype.apply = function(_container_) {

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
            var promises = [];

            element.each(function() {
              var ele = $(this);
              var normalized = bms.normalize(self.options, ['callback'], ele);
              promises.push(function() {

                var d = $q.defer();

                bmsWsService.callMethod(self.view.session.id, normalized.name, normalized.args)
                  .then(function(res) {
                    var returnValue = normalized.callback.call(this, ele, res);
                    if (returnValue) {
                      var bmsid = self.view.getBmsIdForElement(ele);
                      var tvalue = {};
                      tvalue[bmsid] = returnValue;
                      d.resolve(tvalue);
                    }
                  }, function(err) {
                    d.reject(err);
                  });

                return d.promise;

              }())
            });

            $q.all(promises)
              .then(function(data) {
                angular.forEach(data, function(r) {
                  fvalues = angular.merge(r, fvalues);
                });
                defer.resolve(fvalues);
              }, function(errors) {
                defer.reject(errors);
              });

          } else {
            defer.resolve({});
          }

          return defer.promise;

        };

        observer.prototype.check = function() {

          var defer = $q.defer();
          var self = this;

          self.apply()
            .then(
              function(values) {
                defer.resolve(values);
              },
              function(error) {
                defer.reject(error);
              });

          return defer.promise;

        };

        return observer;

      }
    ]);

});

/**
 * BMotionWeb for ProB Observer Data Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal'
], function(angular, $, bms) {

  return angular.module('prob.observers.data', ['bms.modal'])
    .factory('observer-nextEvents', ['ws', '$q',
      function(ws, $q) {
        'use strict';

        var observer = function(view, options) {
          this.id = bms.uuid();
          this.view = view;
          this.options = this.getDefaultOptions(options);
        };

        observer.prototype.apply = function(data) {

          var defer = $q.defer();

          if (observer.data.trigger !== undefined) {

            var selector = this.options.selector;
            var self = this;
            if (selector) {
              var fvalues = {};
              var element = container.find(selector);
              element.each(function() {
                var ele = $(this);
                var returnValue = bms.callElementFunction(self.options.trigger, ele, 'events', data);
                if (returnValue) {
                  var bmsid = bmsVisualizationService.getBmsIdForElement(ele);
                  fvalues[bmsid] = returnValue;
                }
              });
              defer.resolve(fvalues);
            } else {
              bms.callFunction(this.options.trigger, 'events', data);
              defer.resolve();
            }

          } else {
            defer.resolve();
          }

          return defer.promise;

        };

        observer.prototype.check = function(sessionId) {

          var defer = $q.defer();
          ws.emit("observeNextEvents", {
            sessionId: sessionId
          }, function(data) {
            /**
             * { data:
             *    {
             *      events: [
             *       { name: <event name>, parameter: <parameter as list> },
             *       ...
             *      ]
             *    }
             * }
             */
            defer.resolve(this.apply(container, data));
            return defer.promise;

          });

        };

        return observer;

      }
    ])
    .factory('observer-history', ['ws', '$q',
      function(ws, $q) {
        'use strict';

        var observer = function(options) {
          this.options = this.getDefaultOptions(options);
        };

        observer.prototype.apply = function(data, container) {


          var defer = $q.defer();

          if (this.options.trigger !== undefined) {

            var selector = this.options.selector;
            var self = this;
            if (selector) {
              var fvalues = {};
              var element = container.find(selector);
              element.each(function() {
                var ele = $(this);
                var returnValue = bms.callElementFunction(self.options.trigger, ele, 'history', data);
                if (returnValue) {
                  var bmsid = bmsVisualizationService.getBmsIdForElement(ele);
                  fvalues[bmsid] = returnValue;
                }
              });
              defer.resolve(fvalues);
            } else {
              bms.callFunction(this.options.trigger, 'history', data);
              defer.resolve();
            }

          } else {
            defer.resolve();
          }

          return defer.promise;

        };

        observer.prototype.check = function(results, container) {

          var defer = $q.defer();
          ws.emit("observeHistory", {
            sessionId: sessionId
          }, function(data) {
            /**
             * { data:
             *    {
             *      events: [
             *       { name: <event name>, parameter: <parameter as list> },
             *       ...
             *      ]
             *    }
             * }
             */
            defer.resolve(historyObserver.apply(container, data));
            return defer.promise;
          });

        };

        return observer;

      }
    ]);

});

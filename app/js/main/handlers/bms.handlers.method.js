/**
 * BMotionWeb Execute Method Handler
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.ws',
  'bms.session',
  'bms.visualization',
  'bms.common'
], function(angular, $, bms) {

  return angular.module('bms.handlers.method', ['bms.modal', 'bms.ws', 'bms.session', 'bms.visualization', 'bms.common'])
    .factory('methodEvent', ['ws', '$q', 'bmsModalService', 'bmsVisualizationService', 'bmsWsService', 'bmsErrorService',
      function(ws, $q, bmsModalService, bmsVisualizationService, bmsWsService, bmsErrorService) {
        'use strict';

        var event = function(view, options) {
          this.id = bms.uuid();
          this.view = view;
          this.options = this.getDefaultOptions(options);
        };

        event.prototype.getDefaultOptions = function(options) {
          return angular.merge({
            name: "",
            args: [],
            callback: function() {},
            cause: "AnimationChanged"
          }, options);
        };

        event.prototype.getId = function() {
          return this.id;
        };

        event.prototype.shouldBeChecked = function() {
          var self = this;
          var session = self.view.session;
          if (session.isBVisualization()) {
            if (session.toolData.model !== undefined) {
              var refinements = session.toolData.model.refinements;
              if (refinements) {
                return self.options.refinement ? bms.inArray(self.options.refinement, refinements) : true;
              }
            }
          }
          return true;
        };

        event.prototype.setup = function() {

          var defer = $q.defer();

          var self = this;

          var element;

          // Determine graphical element of observer
          if (self.options.element !== undefined) {
            element = self.options.element;
          } else if (self.options.selector !== undefined) {
            var container = self.view.container.contents();
            element = container.find(self.options.selector);
          }

          if (element instanceof $) {

            element.each(function() {

              var ele = $(this);
              ele.css('cursor', 'pointer');
              ele.click(function(event) {

                var normalized = bms.normalize(self.options, ['callback'], ele);
                bmsWsService.callMethod(self.view.session.id, normalized.name, normalized.args)
                  .then(function(res) {
                    normalized.callback.call(this, ele, res);
                  }, function(err) {
                    bmsErrorService.print(err);
                  });

              });

            });

          } else {
            defer.reject("Please specify a selector or an element for execute method handler.");
          }

          defer.resolve();

          return defer.promise;

        };

        return event;

      }
    ]);

});

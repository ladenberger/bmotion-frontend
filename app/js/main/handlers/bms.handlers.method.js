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

        var handlerService = {

          getDefaultOptions: function(options) {
            return angular.merge({
              name: "",
              args: [],
              callback: function() {},
              cause: "AnimationChanged"
            }, options);
          },
          shouldBeChecked: function(handler, view) {
            var session = view.session;
            if (session.isBVisualization()) {
              if (session.toolData.model !== undefined) {
                var refinements = session.toolData.model.refinements;
                if (refinements) {
                  return handler.options.refinement ? bms.inArray(handler.options.refinement, refinements) : true;
                }
              }
            }
            return true;
          },
          setup: function(handler, view, element) {

            var defer = $q.defer();

            var element;

            if (element instanceof $) {

              element.css('cursor', 'pointer');
              element.click(function(event) {

                var normalized = bms.normalize(handler.options, ['callback'], element, view.container);

                bmsWsService.callMethod(view.session.id, normalized.name, normalized.args)
                  .then(function(res) {
                    normalized.callback.call(this, element, res);
                  }, function(err) {
                    bmsErrorService.print(err);
                  });

              });

            } else {
              defer.reject("Please specify a selector or an element for execute method handler.");
            }

            defer.resolve();

            return defer.promise;

          }

        };

        return handlerService;

      }
    ]);

});

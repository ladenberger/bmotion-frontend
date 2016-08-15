/**
 * BMotionWeb for ProB Execute Event Handler
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.ws',
  'prob.ws',
  'bms.session',
  'bms.visualization',
  'qtip'
], function(angular, $, bms) {

  return angular.module('prob.handlers.event', ['bms.modal', 'bms.ws', 'prob.ws', 'bms.session', 'bms.visualization'])
    .factory('executeEventEvent', ['ws', '$q', 'bmsModalService', 'bmsVisualizationService', 'bmsWsService', 'probWsService',
      function(ws, $q, bmsModalService, bmsVisualizationService, bmsWsService, probWsService) {
        'use strict';

        var handlerService = {

          getDefaultOptions: function(options) {

            var fOptions = angular.merge({
              events: [],
              label: function(origin, event, container) {
                var predicateStr = event.predicate ? '(' + event.predicate + ')' : '';
                return '<span>' + event.name + predicateStr + '</span>';
              },
              callback: function() {}
            }, options);

            if (options.name) {
              fOptions.events.push({
                name: options.name,
                predicate: options.predicate
              });
            }

            // TODO This is a workaround since angular.merge destroys the actual
            // element after merging - consequently we manually add this element
            fOptions.element = options.element;

            return fOptions;

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
          getTooltipContent: function(sessionId, handler, element, container, traceId, api) {

            var defer = $q.defer();

            var normalized = bms.normalize(handler.options, ["label", "callback"], element, container);

            probWsService.checkEvents(
                sessionId,
                traceId,
                normalized.events
              )
              .then(function(events) {

                // Build tooltip content
                var tt_container = $('<div class="qtiplinks" style="max-width:400px;"></div>');
                var tt_ul = $('<ul style="display:table-cell;"></ul>');
                angular.forEach(events, function(evt) {

                  var iconSpan = $('<span></span>')
                    .css("margin-right", "2px")
                    .addClass('glyphicon')
                    .addClass(evt.canExecute ? 'glyphicon-ok-circle' : 'glyphicon-remove-circle');

                  var labelSpan = $('<span>' + bms.convertFunction('origin,event,container', handler.options.label)(element, evt, container) + '</span>');
                  if (evt.canExecute) {
                    var callbackFunc = bms.convertFunction('origin,data,container', handler.options.callback);
                    labelSpan.click(function() {
                      bmsWsService.executeEvent(sessionId, {
                        traceId: traceId,
                        name: evt.name,
                        predicate: evt.predicate,
                        executor: element.attr("id") ? element.attr("id") : 'unknown'
                      }).then(function(result) {
                        callbackFunc(element, result, container);
                      }, function(err) {
                        bmsModalService.openErrorDialog(err);
                      }).finally(function() {
                        api.hide();
                      });
                    });
                  }

                  tt_ul.append($('<li></li>')
                    .addClass(evt.canExecute ? 'enabled' : 'disabled')
                    .addClass(evt.canExecute ? 'cursor-pointer' : 'cursor-default')
                    .append(iconSpan)
                    .append(labelSpan));

                });

                tt_container.append(tt_ul);

                defer.resolve(tt_container);

              }, function(err) {
                bmsModalService.openErrorDialog(err);
              });

            return defer.promise;

          },
          initTooltip: function(view, handler, element, container, traceId) {

            return element.qtip({
              content: {
                text: function(event, api) {
                  return handlerService.getTooltipContent(view.session.id, handler, element, container, traceId, api)
                    .then(function(tooltipElement) {
                      return tooltipElement;
                    }, function(err) {
                      bms.openErrorDialog(err);
                    });
                }
              },
              position: {
                my: 'bottom left',
                at: 'top right',
                effect: false
              },
              events: {
                show: function(event, api) {

                  var $el = $(api.elements.target[0]);
                  var dialog = view.iframe.closest(".ui-dialog");
                  if (dialog.length > 0) {
                    var leftOffset = dialog.offset().left;
                    var topOffset = dialog.offset().top;
                    $el.qtip('option', 'position.target', [0, 0]);
                    $el.qtip('option', 'position.adjust.x', $el.offset().left + leftOffset + 50);
                    $el.qtip('option', 'position.adjust.y', $el.offset().top + topOffset + 50);
                  } else {
                    $el.qtip('option', 'position.adjust.y', 50);
                  }

                  var qtipDisable = element.data('qtip-disable') ? element.data('qtip-disable') : false;
                  if (event['originalEvent']['type'] === "mouseover" && qtipDisable) {
                    event.preventDefault();
                  }

                }
              },
              show: {
                delay: 1200,
                event: 'mouseover'
              },
              hide: {
                fixed: true,
                delay: 400
              },
              style: {
                classes: 'qtip-light qtip-bootstrap'
              }
            });

          },
          setup: function(handler, view, element) {

            var defer = $q.defer();

            if (element instanceof $) {

              var traceId = view.toolOptions.traceId;
              var jcontainer = view.container;

              element.css('cursor', 'pointer');

              var tooltip = handlerService.initTooltip(view, handler, element, view.container, traceId);
              var api = tooltip.qtip('api');
              var callbackFunc = bms.convertFunction('origin,data,container', handler.options.callback);

              element.click(function(event) {

                var normalized = bms.normalize(handler.options, ["label", "callback"], element, view.container);

                // Get more information about event (e.g. enabled/disabled)
                probWsService.checkEvents(
                    view.session.id,
                    traceId,
                    normalized.events
                  )
                  .then(function(events) {

                    // Filter enabled events
                    var enabledEvents = events.filter(function(evt) {
                      return evt.canExecute;
                    });

                    // If only one events is enabled of the list of events, execute it ...
                    if (enabledEvents.length === 1) {

                      var name = enabledEvents[0].name; // Event name
                      var predicate = enabledEvents[0].predicate; // Event predicate

                      // Execute event with name and predicate
                      bmsWsService.executeEvent(view.session.id, {
                        traceId: traceId,
                        name: name,
                        predicate: predicate,
                        executor: element.attr("id") ? element.attr("id") : 'unknown'
                      }).then(function(data) {
                        // Data includes return values from classicalB operation (returnValues)
                        // and the new state id (stateId).
                        // Additionally set event name and predicate in callback data
                        data.name = name;
                        data.predicate = predicate;
                        // Call callback function with data
                        callbackFunc(element, data, jcontainer);
                      }, function(err) {
                        // If an error occurred while executing the event,
                        // open error dialog with error message
                        bmsModalService.openErrorDialog(err);
                      }).finally(function() {
                        // Finally hide tooltip
                        api.hide();
                      });

                    } else {
                      // ... else show a popup displaying the available events
                      api.show('click');
                    }

                    element.data('qtip-disable', true);

                  }, function(err) {
                    // If an error occurred while receiving
                    // additional information about events,
                    // open error dialog with error message
                    bmsModalService.openErrorDialog(err);
                  });

              }).mouseout(function() {
                element.data('qtip-disable', false);
              });

              defer.resolve();
            } else {
              defer.reject("Please specify a selector or an element for the interactive handler.");
            }

            return defer.promise;

          }

        };

        return handlerService;

      }
    ]);

});

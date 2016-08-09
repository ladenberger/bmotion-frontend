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

        var event = function(view, options) {
          this.id = bms.uuid();
          this.view = view;
          this.options = this.getDefaultOptions(options);
        };

        event.prototype.getDefaultOptions = function(options) {

          var self = this;

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

        event.prototype.getTooltipContent = function(sessionId, element, container, traceId, api) {

          var defer = $q.defer();

          var self = this;

          probWsService.checkEvents(
              sessionId,
              traceId,
              bms.normalize(self.options.events, [], element, container)
            )
            .then(function(events) {

              // Build tooltip content
              var tt_container = $('<div class="qtiplinks" style="max-width:250px;"></div>');
              var tt_ul = $('<ul style="display:table-cell;"></ul>');
              angular.forEach(events, function(evt) {

                var iconSpan = $('<span></span>')
                  .css("margin-right", "2px")
                  .addClass('glyphicon')
                  .addClass(evt.canExecute ? 'glyphicon-ok-circle' : 'glyphicon-remove-circle');

                var labelSpan = $('<span>' + bms.convertFunction('origin,event,container', self.options.label)(element, evt, container) + '</span>');
                if (evt.canExecute) {
                  var callbackFunc = bms.convertFunction('origin,data,container', self.options.callback);
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

        };


        event.prototype.initTooltip = function(sessionId, element, container, traceId) {

          var self = this;

          return element.qtip({
            content: {
              text: function(event, api) {
                return self.getTooltipContent(sessionId, element, container, traceId, api)
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
              effect: false,
              viewport: container
                /*,
                adjust: {
                  x: container.offset().left,
                  y: container.offset().top
                }*/
            },
            events: {
              show: function(event, api) {
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

        };

        event.prototype.setup = function() {

          var defer = $q.defer();

          var self = this;

          if (!self.options.selector && !self.options.element) {
            defer.reject("Please specify a selector or an element for execute event handler.");
          } else {

            var traceId = self.view.toolOptions.traceId;
            var jcontainer = self.view.container.contents();

            var jelements = self.options.element ? $(self.options.element) : self.view.container.contents().find(self.options.selector);

            jelements.each(function(i, ele) {

              var jele = $(ele);
              jele.css('cursor', 'pointer');

              var tooltip = self.initTooltip(self.view.session.id, jele, jcontainer, traceId);
              var api = tooltip.qtip('api');
              var callbackFunc = bms.convertFunction('origin,data,container', self.options.callback);

              jele.click(function(event) {

                // Get more information about event (e.g. enabled/disabled)
                probWsService.checkEvents(
                    self.view.session.id,
                    traceId,
                    bms.normalize(self.options.events, [], jele, jcontainer)
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
                      bmsWsService.executeEvent(self.view.session.id, {
                        traceId: traceId,
                        name: name,
                        predicate: predicate,
                        executor: jele.attr("id") ? jele.attr("id") : 'unknown'
                      }).then(function(data) {
                        // Data includes return values from classicalB operation (returnValues)
                        // and the new state id (stateId).
                        // Additionally set event name and predicate in callback data
                        data.name = name;
                        data.predicate = predicate;
                        // Call callback function with data
                        callbackFunc(jele, data, jcontainer);
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

                    jele.data('qtip-disable', true);

                  }, function(err) {
                    // If an error occurred while receiving
                    // additional information about events,
                    // open error dialog with error message
                    bmsModalService.openErrorDialog(err);
                  });

              }).mouseout(function() {
                jele.data('qtip-disable', false);
              });

            });

          }

          defer.resolve();

          return defer.promise;

        };

        return event;

      }
    ]);

});

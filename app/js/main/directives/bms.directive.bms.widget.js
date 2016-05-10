/**
 * BMotionWeb Directive BMS Widget module
 *
 */
define([
  'angular',
  'jquery',
  'bms.modal',
  'bms.api'
], function(angular, $) {

  return angular.module('bms.directive.bms.widget', [
      'bms.modal',
      'bms.api'
    ])
    .directive('bmsWidget', ['bmsVisualizationService', 'bmsApiService', 'bmsSessionService',
      function(bmsVisualizationService, bmsApiService, bmsSessionService) {
        'use strict';
        return {
          link: function($scope, element, attr) {
            var type = attr["bmsWidget"];
            switch (type) {
              case "iarea":
                $(element).css("opacity", 0.1);
                break;
              case "iradio":

                var jele = $(element);
                var offset = jele.offset();

                // Create new radio button
                var newInput = $('<input type="radio"/>');
                newInput
                  .attr("value", jele.attr("data-value"))
                  .attr("checked", jele.attr("data-checked") === "true" ? true : false)
                  .attr("class", jele.attr("class"))
                  .attr("id", jele.attr("id"))
                  .css("position", "absolute")
                  .css("left", offset.left - 5 + "px")
                  .css("top", offset.top - 3 + "px");

                var parent = $(jele.parent());
                if (parent.prop("tagName") === "g") {
                  newInput.attr("name", parent.attr("id"));
                }

                var bmsSessionInstance = bmsSessionService.getSession($scope.sessionId);
                var viewInstance = bmsSessionInstance.getView($scope.id);
                viewInstance.container.contents().find("body").append(newInput);
                jele.remove();

                break;
              case "icheckbox":

                var jele = $(element);
                var offset = jele.offset();
                // Create new radio button
                var newInput = $('<input type="checkbox"/>');
                newInput
                  .attr("value", jele.attr("data-value"))
                  .attr("class", jele.attr("class"))
                  .attr("id", jele.attr("id"))
                  .attr("checked", jele.attr("data-checked") === "true" ? true : false)
                  .css("position", "absolute")
                  .css("left", offset.left - 5 + "px")
                  .css("top", offset.top - 2 + "px");

                var parent = $(jele.parent());
                if (parent.prop("tagName") === "g") {
                  newInput.attr("name", parent.attr("id"));
                }

                var bmsSessionInstance = bmsSessionService.getSession($scope.sessionId);
                var viewInstance = bmsSessionInstance.getView($scope.id);
                viewInstance.container.contents().find("body").append(newInput);
                jele.remove();

                break;
              case "ibutton":

                var jele = $(element);
                var offset = jele.offset();

                var rect = jele.find("rect");
                // Create new radio button
                var newInput = $('<button>' + jele.attr('data-text') + '</button>');
                newInput
                  .attr("class", jele.attr("class"))
                  .attr("id", jele.attr("id"))
                  .css("position", "absolute")
                  .css("width", parseInt(rect.attr("width")) + "px")
                  .css("height", parseInt(rect.attr("height")) + "px")
                  .css("left", offset.left + "px")
                  .css("top", offset.top + "px");
                var bmsSessionInstance = bmsSessionService.getSession($scope.sessionId);
                var viewInstance = bmsSessionInstance.getView($scope.id);
                viewInstance.container.contents().find("body").append(newInput);
                jele.remove();

                break;
              case "iinput":
                var jele = $(element);
                var rect = jele.find("rect");
                var offset = jele.offset();
                var btype = jele.attr("data-btype");
                var newInput = $('<input type="text"/>');
                newInput
                  .attr("class", jele.attr("class"))
                  .attr("id", jele.attr("id"))
                  .attr("placeholder", jele.attr("data-placeholder"))
                  .css("position", "absolute")
                  .css("left", offset.left + "px")
                  .css("top", offset.top + "px")
                  .css("width", parseInt(rect.attr("width")) - 4 + "px")
                  .css("height", parseInt(rect.attr("height")) - 5 + "px");
                jele.remove();
                var bmsSessionInstance = bmsSessionService.getSession($scope.sessionId);
                var viewInstance = bmsSessionInstance.getView($scope.id);
                viewInstance.container.contents().find("body").append(newInput);
                newInput.qtip({
                  content: {
                    text: ''
                  },
                  position: {
                    my: 'bottom left',
                    at: 'top right',
                    effect: false,
                    viewport: $(window),
                    adjust: {
                      y: 45
                    }
                  },
                  show: {
                    event: false
                  },
                  hide: {
                    fixed: true,
                    delay: 2000
                  },
                  style: {
                    classes: 'qtip-red'
                  }
                });
                newInput.on('input', function() {
                  var input = $(this);
                  var data = input.val();
                  if (!btype) return;
                  bmsApiService.eval($scope.sessionId, {
                    formulas: ["bool(" + data + " : " + btype + ")"],
                    trigger: function(values) {
                      if (values[0] === 'FALSE') {
                        input.qtip('option', 'content.text', "Please enter a valid <strong>" + btype + "</strong>").qtip('show');
                      } else {
                        input.qtip('hide');
                      }
                    },
                    error: function(errors) {
                      input.qtip('option', 'content.text', "Please enter a valid <strong>" + btype + "</strong>").qtip('show');
                    }
                  });
                });
                break;
            }

          }
        };
      }
    ]);

});

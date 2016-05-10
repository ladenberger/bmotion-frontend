/**
 * BMotionWeb Directive Dialog Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'jquery-ui',
  'bms.visualization'
], function(angular, $, bms) {

  var module = angular.module('bms.directive.dialog', ['bms.visualization'])
    .directive('bmsDialog', ['bmsVisualizationService', '$timeout',
      function(bmsVisualizationService, $timeout) {
        return {
          scope: {
            type: '@',
            title: '@',
            state: '@',
            width: '@',
            height: '@'
          },
          controller: ['$scope', function($scope) {

            var self = this;

            self.listeners = {
              dragStart: [],
              dragStop: [],
              resize: [],
              resizeStart: [],
              resizeStop: [],
              open: [],
              close: []
            };

            self.state = $scope.state ? $scope.state : 'close';
            self.width = $scope.width ? $scope.width : 400;
            self.height = $scope.height ? $scope.height : 450;
            self.hidden = false;

            self.getType = function() {
              return $scope.type;
            };

            self.getTitle = function() {
              return $scope.title;
            };

            self.onEventListener = function(type, handler) {
              self.listeners[type].push(handler);
            };

            self.propagateEvent = function(type) {
              self.listeners[type].forEach(function(handler) {
                handler();
              });
            };

            self.isOpen = function() {
              return self.state === 'open' ? true : false;
            };

            self.getWidth = function() {
              return self.width;
            };

            self.getHeight = function() {
              return self.height;
            };

            self.open = function() {
              self.state = 'open';
            };

            self.fixSize = function(dialog, ox, oy) {
              var newwidth = dialog.parent().width() - ox;
              var newheight = dialog.parent().height() - oy;
              dialog.first().css("width", (newwidth) + "px").css("height", (newheight - 38) + "px");
            };

            $scope.$on('visualizationLoaded', function(evt, view) {
              var autoOpen = view.viewData.autoOpen;
              if (autoOpen && bms.inArray($scope.type, autoOpen)) {
                self.open();
              }
            });

            $scope.$on('openDialog_' + $scope.type, function() {
              self.state = 'open';
            });

            $scope.$on('closeDialog', function() {
              self.state = 'close';
            });

            $scope.$on('hideDialog', function() {
              if (self.state === 'open') {
                self.hidden = true;
                self.state = 'close';
              }
            });

            $scope.$on('showDialog', function() {
              if (self.state === 'close' && self.hidden) {
                self.hidden = false;
                self.state = 'open';
              }
            });

          }],
          link: function($scope, element, attrs, ctrl) {

            var d = $(element);

            $scope.$on('$destroy', function() {
              if (d.hasClass('ui-dialog-content')) {
                d.dialog("destroy");
              }
            });

            $scope.$watch(function() {
              return ctrl.state;
            }, function(newVal) {
              d.dialog(newVal);
            });

            d.first().css("overflow", "hidden");
            d.dialog({
              resizeStop: function() {
                ctrl.fixSize(d, 0, 0);
                ctrl.propagateEvent('resizeStop');
              },
              open: function() {
                ctrl.fixSize(d, 0, 0);
                ctrl.propagateEvent('open');
              },
              close: function() {
                $timeout(function() {
                  $scope.$apply(function() {
                    ctrl.state = 'close';
                  });
                });
                ctrl.propagateEvent('close');
              },
              autoOpen: ctrl.isOpen(),
              width: ctrl.getWidth(),
              height: ctrl.getHeight(),
              title: $scope.title
            });

          }
        }
      }
    ]);

});

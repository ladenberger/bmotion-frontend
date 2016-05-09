/**
 * BMotionWeb Online Directive
 *
 */
define([
    'angular',
    'bms.func',
    'bms.session',
    'bms.modal',
    'bms.directive'
  ],
  function(angular, bms) {

    return angular.module('bms.online.directive', [
        'bms.session',
        'bms.modal',
        'bms.directive'
      ])
      .directive('bmsOnlineVisualization', ['$compile', '$rootScope', 'bmsModalService', 'bmsSessionService',
        function($compile, $rootScope, bmsModalService, bmsSessionService) {
          return {
            template: '<div class="fullWidthHeight">' +
              '<div data-bms-visualization-view="{{viewId}}" data-bms-visualization-id="{{id}}" data-bms-session-id="{{sessionId}}" class="fullWidthHeight"></div>' +
              '<div>' +
              '<div class="navbar navbar-default navbar-fixed-bottom" role="navigation">' +
              '<div class="container-fluid">' +
              '<div class="navbar-header">' +
              '<a class="navbar-brand" href="">BMotionWeb</a>' +
              '</div>' +
              '<div class="collapse navbar-collapse">' +
              '<ul class="nav navbar-nav navbar-right" id="bmotion-navigation">' +
              '<li uib-dropdown>' +
              '<a href="" uib-dropdown-toggle>ProB<span class="caret"></span></a>' +
              '<ul class="uib-dropdown-menu" role="menu" aria-labelledby="single-button">' +
              '<li role="menuitem"><a href="" ng-click="openDialog(\'CurrentTrace\')">' +
              '<i class="glyphicon glyphicon-indent-left"></i> History</a></a></li>' +
              '<li role="menuitem"><a href="" ng-click="openDialog(\'Events\')">' +
              '<i class="glyphicon glyphicon-align-left"></i> Events</a></li>' +
              '<li role="menuitem"><a href="" ng-click="openDialog(\'StateInspector\')">' +
              '<i class="glyphicon glyphicon-list-alt"></i> State</a></li>' +
              '<li role="menuitem"><a href="" ng-click="openDialog(\'CurrentAnimations\')">' +
              '<i class="glyphicon glyphicon-th-list"></i> Animations</a></li>' +
              '<li role="menuitem"><a href="" ng-click="openDialog(\'ModelCheckingUI\')">' +
              '<i class="glyphicon glyphicon-ok"></i> Model Checking</a></li>' +
              '<li role="menuitem"><a href="" ng-click="openDialog(\'BConsole\')">' +
              '<i class="glyphicon glyphicon glyphicon-cog"></i> Console</a></li>' +
              '</ul>' +
              '</li>' +
              '</ul>' +
              '</div>' +
              '</div>' +
              '</div>' +
              '<div bms-dialog type="CurrentTrace" title="History"><div prob-view></div></div>' +
              '<div bms-dialog type="Events" title="Events"><div prob-view></div></div>' +
              '<div bms-dialog type="StateInspector" title="State"><div prob-view></div></div>' +
              '<div bms-dialog type="CurrentAnimations" title="Animations"><div prob-view></div></div>' +
              '<div bms-dialog type="BConsole" title="Console"><div prob-view></div></div>' +
              '<div bms-dialog type="ModelCheckingUI" title="ModelChecking"><div prob-view></div></div>' +
              //'<div ng-controller="bmsViewsCtrl as tabsCtrl">' +
              //'<div ng-repeat="view in tabsCtrl.views track by $index" bms-dialog state="open" width="{{view.width}}" height="{{view.height}}" title="View ({{view.id}})">' +
              //'<div data-bms-visualisation-session="{{vis.sessionId}}" data-bms-visualisation-view="{{view.id}}" data-bms-visualisation-file="{{vis.file}}" class="fullWidthHeight"></div>' +
              //'</div>' +
              //'</div>' +
              '</div>',
            replace: false,
            scope: {
              manifestPath: '@bmsOnlineVisualization'
            },
            controller: ['$scope', function($scope) {

              bmsModalService.loading("Initializing visualization ...");

              $scope.sessionId = bms.uuid(); // Session id
              $scope.session = bmsSessionService.getSession($scope.sessionId); // Get fresh session instance
              $scope.id = bms.uuid(); // Visualization
              $scope.view = $scope.session.getView($scope.id); // Get fresh view instance

              // Initialize session
              $scope.session.init($scope.manifestPath)
                .then(function(bmsSession) {
                  $scope.viewId = bmsSession.manifestData.views[0].id; // Set view id
                  bmsModalService.endLoading();
                }, function(err) {
                  bmsModalService.openErrorDialog(err);
                });

              // Navigation button actions ...
              $scope.openDialog = function(type) {
                $rootScope.$broadcast('openDialog_' + type);
              };

            }],
            link: function($scope, element, attrs) {
              element.attr('class', 'fullWidthHeight');
            }
          }
        }
      ]);

  });

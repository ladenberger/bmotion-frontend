/**
 * BMotionWeb Online Directive
 *
 */
define([
    'angular',
    'bms.func',
    'angular-route',
    'bms.session',
    'bms.modal',
    'bms.directive',
    'bms.view'
  ],
  function(angular, bms) {

    return angular.module('bms.online.directive', [
        'bms.session',
        'bms.modal',
        'bms.directive',
        'bms.view',
        'ngRoute'
      ])
      .directive('bmsOnlineVisualization', ['$compile', '$rootScope', '$location', '$route', 'bmsModalService', 'bmsSessionService', 'bmsViewService',
        function($compile, $rootScope, $location, $route, bmsModalService, bmsSessionService, bmsViewService) {
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
              '<li role="menuitem"><a href="" ng-click="openDialog(\'UserInteractions\')">' +
              '<i class="glyphicon glyphicon-indent-left"></i> User Interactions</a></a></li>' +
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
              '<div bms-dialog type="CurrentTrace" title="History"><div prob-view data-bms-session-id="{{sessionId}}"></div></div>' +
              '<div bms-dialog type="Events" title="Events"><div prob-view data-bms-session-id="{{sessionId}}"></div></div>' +
              '<div bms-dialog type="StateInspector" title="State"><div prob-view data-bms-session-id="{{sessionId}}"></div></div>' +
              '<div bms-dialog type="CurrentAnimations" title="Animations"><div prob-view data-bms-session-id="{{sessionId}}"></div></div>' +
              '<div bms-dialog type="BConsole" title="Console"><div prob-view data-bms-session-id="{{sessionId}}"></div></div>' +
              '<div bms-dialog type="ModelCheckingUI" title="ModelChecking"><div prob-view data-bms-session-id="{{sessionId}}"></div></div>' +
              '<div bms-dialog type="UserInteractions" title="User Interactions Log"><div bms-user-interaction data-bms-session-id="{{sessionId}}" class="userInteractionsView"></div></div>' +
              '<div ng-repeat="view in views track by $index" bms-dialog state="open" width="{{view.width}}" height="{{view.height}}" title="View ({{view.id}})">' +
              '<div data-bms-visualization-view="{{view.id}}" data-bms-session-id="{{sessionId}}" class="fullWidthHeight"></div>' +
              '</div>' +
              '</div>',
            replace: false,
            scope: {
              manifestPath: '@bmsOnlineVisualization'
            },
            controller: ['$scope',
              function($scope) {

                bmsModalService.loading("Initializing visualization ...");

                var initialize = function() {

                  var initFunc;

                  // Set session id
                  var urlSessionId = $location.$$path.replace("/", "");
                  if (urlSessionId.length > 0) {
                    $scope.sessionId = urlSessionId;
                    $scope.session = bmsSessionService.getSession($scope.sessionId);
                    initFunc = $scope.session.load();
                  } else {
                    $scope.sessionId = bms.uuid();
                    $scope.session = bmsSessionService.getSession($scope.sessionId);
                    initFunc = $scope.session.init($scope.manifestPath);
                    $location.path($scope.sessionId);
                  }

                  $scope.id = bms.uuid(); // Visualization
                  $scope.view = $scope.session.getView($scope.id); // Get fresh view instance

                  // Initialize session
                  initFunc
                    .then(function(bmsSession) {
                        // Set root view id
                        $scope.viewId = bmsSession.manifestData.views[0].id;
                        // Open other views in bms dialog directive
                        angular.forEach(bmsSession.manifestData.views, function(view, i) {
                          if (i > 0) { // Ignore root view
                            bmsViewService.addView(view);
                          }
                        });
                        bmsModalService.endLoading();
                      },
                      function(err) {
                        bmsModalService.openErrorDialog(err)
                          .then(function() {
                            $location.path('');
                            window.location.reload();
                          });
                      });

                };

                initialize();

                // Navigation button actions ...
                $scope.openDialog = function(type) {
                  $rootScope.$broadcast('openDialog_' + type);
                };

                $scope.views = bmsViewService.getViews();

                $scope.$watch(function() {
                  return bmsViewService.getViews();
                }, function(newValue) {
                  self.views = newValue;
                }, true);

              }
            ],
            link: function($scope, element, attrs) {
              element.attr('class', 'fullWidthHeight');
            }
          }
        }
      ]);

  });

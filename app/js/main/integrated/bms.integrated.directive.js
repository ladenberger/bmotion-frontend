/**
 * BMotionWeb Integrated Directive
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

    return angular.module('bms.integrated.directive', [
        'bms.session',
        'bms.modal',
        'bms.directive',
        'bms.view',
        'ngRoute'
      ])
      .directive('bmsIntegratedVisualization', ['$compile', '$rootScope', '$location', '$route', 'bmsModalService', 'bmsSessionService', 'bmsViewService',
        function($compile, $rootScope, $location, $route, bmsModalService, bmsSessionService, bmsViewService) {
          return {
            template: '<div class="fullWidthHeight">' +
              '<div data-bms-visualization-view="{{viewId}}" data-bms-visualization-id="{{id}}" data-bms-session-id="{{sessionId}}" data-bms-root-view class="fullWidthHeight"></div>' +
              '<div ng-repeat="view in views track by $index" bms-dialog state="open" width="{{view.width}}" height="{{view.height}}" title="View ({{view.id}})">' +
              '<div data-bms-visualization-view="{{view.id}}" data-bms-session-id="{{sessionId}}" class="fullWidthHeight"></div>' +
              '</div>' +
              '</div>',
            replace: false,
            scope: {},
            controller: ['$scope',
              function($scope) {

                bmsModalService.loading("Initializing visualization ...");

                var initialize = function() {

                  var initFunc;

                  var searchObject = $location.search();
                  $scope.manifestPath = searchObject['manifest'];

                  if ($scope.manifestPath) {

                    // Set session id
                    var urlSessionId = $location.$$path.replace("/", "");
                    if (urlSessionId.length > 0) {
                      // Try to get session id via URL
                      $scope.sessionId = urlSessionId;
                      $scope.session = bmsSessionService.getSession($scope.sessionId);
                      initFunc = $scope.session.load();
                    } else {
                      // Else create a new session id
                      $scope.sessionId = bms.uuid();
                      $scope.session = bmsSessionService.getSession($scope.sessionId);
                      initFunc = $scope.session.init($scope.manifestPath);
                    }

                    $scope.id = bms.uuid(); // Visualization
                    $scope.view = $scope.session.getView($scope.id); // Get fresh view instance

                    // Initialize session
                    initFunc
                      .then(function(bmsSession) {
                          // Set root view id
                          $scope.viewId = bmsSession.manifestData.id;
                          // Open other views in bms dialog directive
                          angular.forEach(bmsSession.manifestData.views, function(view, i) {
                            bmsViewService.addView(view);
                          });
                          bmsModalService.endLoading();
                        },
                        function(err) {
                          bmsModalService.setError(err);
                        });

                  }

                };

                initialize();

                bmsViewService.clearViews();
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

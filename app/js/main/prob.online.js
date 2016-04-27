/**
 * BMotionWeb for ProB Standalone Module
 *
 */
define(['angularAMD', 'angular', 'bms.api.extern', 'bms.visualization', 'bms.directive', 'bms.observers', 'bms.handlers', 'prob.ui', 'bms.manifest', 'bms.modal', 'bms.common', 'bms.session', 'angular-route'],
  function(angularAMD, angular) {

    var module = angular.module('prob.online', ['bms.visualization', 'bms.directive', 'bms.observers', 'bms.handlers', 'prob.ui', 'bms.manifest', 'bms.modal', 'bms.common', 'bms.session', 'ngRoute'])
      .run(['bmsMainService',
        function(bmsMainService) {
          bmsMainService.setMode('ModeOnline');
        }
      ])
      .config(['$routeProvider', '$locationProvider',
        function($routeProvider) {
          $routeProvider
            .when('/', {
              template: '<div class="navbar navbar-default navbar-fixed-bottom" role="navigation">' +
                '<div class="container-fluid">' +
                '<div class="navbar-header"><a class="navbar-brand" href="">BMotionWeb</a></div>' +
                '</div>' +
                '</div>',
              controller: 'bmsOnlineHomeCtrl'
            })
            .when('/vis/:sessionId/:view/:file', {
              template: '<div ng-controller="bmsVisualizationCtrl as vis" class="fullWidthHeight">' +
                '<div data-bms-visualisation-session="{{vis.sessionId}}" data-bms-visualisation-view="{{vis.view}}"  data-bms-visualisation-file="{{vis.file}}" class="fullWidthHeight"></div>' +
                '<div ng-controller="bmsUiNavigationCtrl as nav">' +
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
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'CurrentTrace\')">' +
                '<i class="glyphicon glyphicon-indent-left"></i> History</a></a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'Events\')">' +
                '<i class="glyphicon glyphicon-align-left"></i> Events</a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'StateInspector\')">' +
                '<i class="glyphicon glyphicon-list-alt"></i> State</a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'CurrentAnimations\')">' +
                '<i class="glyphicon glyphicon-th-list"></i> Animations</a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'ModelCheckingUI\')">' +
                '<i class="glyphicon glyphicon-ok"></i> Model Checking</a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'BConsole\')">' +
                '<i class="glyphicon glyphicon glyphicon-cog"></i> Console</a></li>' +
                '</ul>' +
                '</li>' +
                //'<li uib-dropdown>' +
                //'<a href="" uib-dropdown-toggle>Diagram <span class="caret"></span></a>' +
                //'<ul class="uib-dropdown-menu" role="menu" aria-labelledby="single-button">' +
                //'<li ng-show="nav.isBAnimation()"><a href="" ng-click="nav.openElementProjectionDiagram()">' +
                //'<i class="glyphicon glyphicon-random"></i> Element Projection</a></li>' +
                //'<li role="menuitem"><a href="" ng-click="nav.openTraceDiagram()">' +
                //'<i class="glyphicon glyphicon glyphicon-road"></i> Trace Diagram</a></li>' +
                //'</ul>' +
                //'</li>' +
                '</ul>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div bms-dialog type="CurrentTrace" title="History"><div prob-view></div></div>' +
                '<div bms-dialog type="Events" title="Events"><div prob-view></div></div>' +
                '<div bms-dialog type="StateInspector" title="State"><div prob-view></div></div>' +
                '<div bms-dialog type="CurrentAnimations" title="Animations"><div prob-view></div></div>' +
                '<div bms-dialog type="BConsole" title="Console"><div prob-view></div></div>' +
                '<div bms-dialog type="ModelCheckingUI" title="ModelChecking"><div prob-view></div></div>' +
                '<div ng-controller="bmsViewsCtrl as tabsCtrl">' +
                '<div ng-repeat="view in tabsCtrl.views track by $index" bms-dialog state="open" width="{{view.width}}" height="{{view.height}}" title="View ({{view.id}})">' +
                '<div data-bms-visualisation-session="{{vis.sessionId}}" data-bms-visualisation-view="{{view.id}}" data-bms-visualisation-file="{{vis.file}}" class="fullWidthHeight"></div>' +
                '</div>' +
                '</div>' +
                '</div>',
              controller: 'bmsOnlineVisualizationCtrl'
            })
            .when('/model/:sessionId/:win/:tool', {
              template: '<div ng-controller="bmsUiNavigationCtrl as nav">' +
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
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'CurrentTrace\')">' +
                '<i class="glyphicon glyphicon-indent-left"></i> History</a></a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'Events\')">' +
                '<i class="glyphicon glyphicon-align-left"></i> Events</a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'StateInspector\')">' +
                '<i class="glyphicon glyphicon-list-alt"></i> State</a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'CurrentAnimations\')">' +
                '<i class="glyphicon glyphicon-th-list"></i> Animations</a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'ModelCheckingUI\')">' +
                '<i class="glyphicon glyphicon-ok"></i> Model Checking</a></li>' +
                '<li role="menuitem"><a href="" ng-click="nav.openDialog(\'BConsole\')">' +
                '<i class="glyphicon glyphicon glyphicon-cog"></i> Console</a></li>' +
                '</ul>' +
                '</li>' +
                '</ul>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div bms-dialog type="CurrentTrace" title="History"><div prob-view></div></div>' +
                '<div bms-dialog type="Events" title="Events"><div prob-view></div></div>' +
                '<div bms-dialog type="StateInspector" title="State"><div prob-view></div></div>' +
                '<div bms-dialog type="CurrentAnimations" title="Animations"><div prob-view></div></div>' +
                '<div bms-dialog type="ModelCheckingUI" title="ModelChecking"><div prob-view></div></div>' +
                '<div bms-dialog type="BConsole" title="Console"><div prob-view></div></div>',
              controller: 'bmsOnlineModelCtrl'
            })
            .otherwise({
              redirectTo: '/'
            });
        }
      ])
      .controller('bmsOnlineHomeCtrl', ['$scope', 'initVisualizationService', '$routeParams', 'initModelService',
        function($scope, initVisualizationService, $routeParams, initModelService) {
          var path = $routeParams['path'];
          var model = $routeParams['model'];
          if (path) {
            initVisualizationService(path);
          } else if (model) {
            initModelService(model);
          }
        }
      ])
      .controller('bmsOnlineVisualizationCtrl', ['$scope',
        function($scope) {}
      ])
      .controller('bmsOnlineModelCtrl', ['$scope', '$routeParams', '$rootScope', 'bmsSessionService', 'bmsModalService',
        function($scope, $routeParams, $rootScope, bmsSessionService, bmsModalService) {
          var sessionId = $routeParams['sessionId'];
          bmsSessionService.loadServerData(sessionId)
            .then(function(serverData) {
              $rootScope.$broadcast('closeDialog');
              $rootScope.$broadcast('setProBViewTraceId', serverData['traceId']);
              $rootScope.$broadcast('openDialog_CurrentTrace');
              $rootScope.$broadcast('openDialog_Events');
            }, function(errors) {
              bmsModalService.openErrorDialog(errors);
            });
        }
      ])
      .controller('bmsVisualizationCtrl', ['$scope', '$routeParams', 'bmsSessionService',
        function($scope, $routeParams, bmsSessionService) {
          var self = this;
          self.view = $routeParams.view;
          self.sessionId = $routeParams.sessionId;
          self.file = $routeParams.file;
          $scope.sessionId = $routeParams.sessionId;
          bmsSessionService.setSessionId(self.sessionId);
        }
      ])
      .directive('bmsVisualization', ['$routeParams', '$compile', 'initVisualizationService', 'bmsModalService', 'bmsManifestService',
        function($routeParams, $compile, initVisualizationService, bmsModalService, bmsManifestService) {
          return {
            replace: true,
            scope: {},
            controller: ['$scope', function($scope) {}],
            link: function($scope, element, attrs) {
              element.attr('class', 'fullWidthHeight');
              var path = attrs['bmsVisualization'];
              if (path) {
                bmsModalService.loading("Initialising visualization ...");
                initVisualizationService(path)
                  .then(function() {
                    bmsModalService.endLoading();
                  });
              } else {
                bmsModalService.setMessage("Please provide path to BMotionWeb manifest file (bmotion.json).");
              }
            }
          }
        }
      ])
      .directive('bmsModel', ['initModelService', '$routeParams', 'bmsModalService',
        function(initModelService, $routeParams, bmsModalService) {
          return {
            replace: true,
            scope: {},
            controller: ['$scope', function($scope) {}],
            link: function($scope, element, attrs) {
              var sessionId = $routeParams.sessionId;
              if (!sessionId) {
                var path = attrs['bmsModel'];
                if (path) {
                  initModelService(path);
                } else {
                  bmsModalService.setMessage("Please provide path to model file.");
                }
              }
            }
          }
        }
      ])
      .controller('bmsViewsCtrl', ['$scope', 'bmsOnlineViewService',
        function($scope, bmsOnlineViewService) {

          var self = this;
          self.views = bmsOnlineViewService.getViews();

          $scope.$watch(function() {
            return bmsOnlineViewService.getViews();
          }, function(newValue) {
            self.views = newValue;
          }, true);

        }
      ])
      .factory('bmsOnlineViewService', function() {

        var views = [];

        return {
          addView: function(view) {
            views.push(view);
          },
          getViews: function() {
            return views;
          }
        };

      })
      .factory('initVisualizationService', ['$q', '$location', 'bmsOnlineViewService', 'bmsSessionService', 'bmsManifestService', 'bmsModalService', '$routeParams',
        function($q, $location, bmsOnlineViewService, bmsSessionService, bmsManifestService, bmsModalService, $routeParams) {

          var initVisualizationSession = function(modelPath, tool, options, manifestFilePath) {
            var defer = $q.defer();
            bmsSessionService.init(modelPath, tool, options, manifestFilePath)
              .then(function(data) {
                defer.resolve(data);
              }, function(errors) {
                defer.reject(errors)
              });
            return defer.promise;
          };

          var openViews = function(views) {
            angular.forEach(views, function(view, i) {
              if (i > 0) { // Ignore root view with id 1
                bmsOnlineViewService.addView(view);
              }
            });
          };

          return function(manifestPath) {

            var defer = $q.defer();

            bmsManifestService.validate(manifestPath)
              .then(function(manifestData) {
                return bmsManifestService.normalize(manifestData);
              }, function(errors) {
                bmsModalService.openErrorDialog(errors);
              })
              .then(function(data) {

                var views = data['views'];

                if (!$routeParams.sessionId && !$routeParams.view) {

                  initVisualizationSession(
                    data['model'],
                    data['prob'],
                    manifestPath
                  ).then(function(sessionId) {
                    var rootView = views[0];
                    var filename = manifestPath.replace(/^.*[\\\/]/, '');
                    $location.path('/vis/' + sessionId + '/' + rootView['id'] + '/' + filename);
                    openViews(views);
                    defer.resolve();
                  });

                } else {
                  openViews(views);
                  defer.resolve();
                }

              });

            return defer.promise;

          };

        }

      ])
      .factory('initModelService', ['$rootScope', '$location', 'bmsSessionService', 'bmsManifestService', 'bmsMainService', 'bmsModalService',
        function($rootScope, $location, bmsSessionService, bmsManifestService, bmsMainService, bmsModalService) {

          return function(modelPath) {

            bmsModalService.loading("Initialising Formal Model ...");

            var filename = modelPath.replace(/^.*[\\\/]/, '');
            var fileExtension = filename.split('.').pop();
            var tool = fileExtension === 'csp' ? 'CSPAnimation' : 'BAnimation';

            bmsSessionService.init(modelPath, {
                preferences: {}
              })
              .then(function(sessionId) {
                $location.path('/model/' + sessionId + '/1/' + tool);
                bmsModalService.endLoading();
              });

          }

        }
      ]);
    return angularAMD.bootstrap(module);

  });

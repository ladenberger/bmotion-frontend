define([
  'angular',
  'bms.func',
  'bms.session',
  'bms.view',
  'bms.standalone.tabs',
  'bms.common',
  'bms.ws',
  'ng-electron'
], function(angular, bms) {

  return angular.module('bms.standalone.ctrl.session', ['bms.session', 'bms.view', 'bms.standalone.tabs', 'bms.common', 'bms.ws', 'ngElectron'])
    .controller('bmsSessionCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'electron', 'bmsViewService', 'bmsSessionService', 'bmsTabsService', 'bmsVisualizationService', 'bmsModalService', 'bmsErrorService', 'ws',
      function($scope, $rootScope, $routeParams, $location, electron, bmsViewService, bmsSessionService, bmsTabsService, bmsVisualizationService, bmsModalService, bmsErrorService, ws) {

        // Load session by id
        bmsModalService.loading("Initializing visualization ...");

        $scope.sessionId = $routeParams.sessionId;
        $scope.session = bmsSessionService.getSession($scope.sessionId); // Get fresh session instance
        $scope.id = bms.uuid(); // Visualization
        $scope.view = $scope.session.getView($scope.id); // Get fresh view instance

        bmsViewService.clearViews();
        $scope.views = bmsViewService.getViews();
        $scope.svgs = $scope.session.getSvgData();

        ws.on('log', function(msg) {
          console.log("Groovy logs", msg);
        });

        $scope.$watch(function() {
          return bmsViewService.getViews();
        }, function(newValue) {
          $scope.views = newValue;
        }, true);

        $scope.$watch(function() {
          return $scope.session.getSvgData();
        }, function(newValue) {
          $scope.svgs = newValue;
        }, true);

        $scope.session.load()
          .then(function() {

            $scope.viewId = $scope.session.manifestData.id;
            $scope.view.viewId = $scope.viewId;

            // Open additional views
            angular.forEach($scope.session.manifestData.views, function(view, i) {
              bmsViewService.addView(view);
            });

            bmsModalService.endLoading();

          }, function(err) {
            bmsModalService.openErrorDialog(err)
              .finally(function() {
                $location.path('/welcome');
              });
          });

        var disabledTabs = bmsVisualizationService.getDisabledTabs();

        $scope.lastTab = 'simulator';

        $scope.tabs = bmsTabsService.getTabs();

        $scope.isDisabled = function(svg) {
          return disabledTabs[svg] === undefined ? false : disabledTabs[svg]['status'];
        };

        $scope.whyDisabled = function(svg) {
          if (disabledTabs[svg] !== undefined && disabledTabs[svg]['status']) {
            bmsModalService.openErrorDialog(disabledTabs[svg]['reason']);
          }
        };

        $scope.selectEditorTab = function(svg) {
          $scope.currentSvg = svg;
          $scope.lastTab = 'editor';
          $rootScope.$broadcast('selectEditorTab');
          $rootScope.$broadcast('hideDialog');
        };

        $scope.selectDiagramTab = function() {
          $scope.lastTab = 'diagram';
          $rootScope.$broadcast('hideDialog');
        };

        $scope.selectSimulatorTab = function() {
          $scope.lastTab = 'simulator';
          $rootScope.$broadcast('showDialog');
        };

        $scope.removeTab = function(index) {
          bmsTabsService.removeTab(index);
        };

        $scope.enter = function(tab) {
          return tab.showClose = true;
        };

        $scope.leave = function(tab) {
          return tab.showClose = false;
        };

      }
    ]);

});

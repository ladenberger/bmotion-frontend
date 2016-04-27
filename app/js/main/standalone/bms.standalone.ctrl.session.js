define([
  'angular',
  'bms.func',
  'bms.session',
  'bms.view',
  'bms.standalone.tabs',
  'ng-electron'
], function(angular, bms) {

  return angular.module('bms.standalone.ctrl.session', ['bms.session', 'bms.view', 'bms.standalone.tabs', 'ngElectron'])
    .controller('bmsSessionCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'electron', 'bmsViewService', 'bmsSessionService', 'bmsTabsService', 'bmsVisualizationService', 'bmsModalService',
      function($scope, $rootScope, $routeParams, $location, electron, bmsViewService, bmsSessionService, bmsTabsService, bmsVisualizationService, bmsModalService) {

        $scope.sessionId = $routeParams.sessionId;

        // Load session by id
        bmsModalService.loading("Initializing visualization ...");
        var bmsSession = bmsSessionService.getSession($scope.sessionId);
        $scope.id = bms.uuid();
        $scope.view = bmsSession.getView($scope.id);

        bmsSession.load()
          .then(function() {

            $scope.viewId = bmsSession.manifestData.views[0].id;

            // Open additional views
            angular.forEach(bmsSession.manifestData.views, function(view, i) {
              if (i > 0) { // Ignore root view with id 1
                bmsViewService.addView(view);
              }
            });

            electron.send({
              type: "buildVisualizationMenu",
              tool: bmsSession.tool,
              addMenu: true
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

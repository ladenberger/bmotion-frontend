/**
 * BMotionWeb for ProB UI Module
 *
 */
define([
  'angular',
  'jquery',
  'jquery-ui',
  'ui-bootstrap',
  'bms.config'
], function(angular, $) {

  var module = angular.module('prob.ui', ['ui.bootstrap', 'bms.config'])
    .controller('bmsUiNavigationCtrl', ['$scope', '$rootScope', 'bmsVisualizationService',
      function($scope, $rootScope, bmsVisualizationService) {

        var self = this;

        // Navigation button actions ...
        self.openDialog = function(type) {
          $rootScope.$broadcast('openDialog_' + type);
        };

        self.visualizationLoaded = function() {
          return bmsVisualizationService.getCurrentVisualizationId() !== undefined;
        };

        self.isBAnimation = function() {
          var vis = bmsVisualizationService.getCurrentVisualization();
          return vis && (vis['tool'] === 'EventBVisualisation' || vis['tool'] === 'ClassicalBVisualisation');
        };

        self.reloadVisualization = function() {
          var id = bmsVisualizationService.getCurrentVisualizationId();
          if (id) {
            document.getElementById(id).contentDocument.location.reload(true);
            $rootScope.$broadcast('reloadVisualisation', id);
          }
        };

        self.editVisualization = function(svgid) {
          $rootScope.$broadcast('openEditorModal', bmsVisualizationService.getCurrentVisualizationId(), svgid);
        };

        self.openElementProjectionDiagram = function() {
          $rootScope.$broadcast('openElementProjectionModal');
        };

        self.openTraceDiagram = function() {
          $rootScope.$broadcast('openTraceDiagramModal');
        };

        self.hasSvg = function() {
          return self.getSvg() !== undefined;
        };

        self.getSvg = function() {
          var vis = bmsVisualizationService.getCurrentVisualization();
          if (vis) return vis.svg;
        }

      }
    ]);  

  return module;

});

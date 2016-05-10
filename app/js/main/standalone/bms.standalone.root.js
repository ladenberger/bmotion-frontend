/**
 * BMotionWeb Standalone Root Module
 *
 */
define([
    'angular',
    'angularAMD',
    'bms.api.extern',
    'bms.config',
    'bms.observers',
    'bms.handlers',
    'bms.directive',
    'bms.directive.editor',
    'bms.standalone.nodejs',
    'bms.standalone.service',
    'bms.standalone.routing',
    'bms.standalone.tabs',
    'bms.views',
    'prob.graph'
  ],
  function(angular, angularAMD) {

    var module = angular.module('bms.standalone.root', [
        'bms.config',
        'bms.observers',
        'bms.handlers',
        'bms.directive',
        'bms.directive.editor',
        'bms.standalone.nodejs',
        'bms.standalone.service',
        'bms.standalone.routing',
        'bms.standalone.tabs',
        'bms.views',
        'prob.graph'
      ])
      .run(['$rootScope', 'bmsTabsService', 'bmsMainService', 'bmsConfigService', 'bmsModalService', 'initVisualizationService', 'createVisualizationService', 'initFormalModelOnlyService',
        function($rootScope, bmsTabsService, bmsMainService, bmsConfigService, bmsModalService, initVisualizationService, createVisualizationService, initFormalModelOnlyService) {

          bmsMainService.setMode('ModeStandalone');
          //editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

          // Delegate calls from electron main process
          $rootScope.$on('electron-host', function(evt, data) {
            if (data.type === 'startVisualisationViaFileMenu') {
              initVisualizationService(data.data);
            } else if (data.type === 'startFormalModelOnlyViaFileMenu') {
              initFormalModelOnlyService(data.data);
            } else if (data.type === 'openDialog') {
              $rootScope.$apply(function() {
                $rootScope.$broadcast('openDialog_' + data.data);
              });
            } else if (data.type === 'openTraceDiagramModal') {
              $rootScope.$apply(function() {
                bmsTabsService.addTraceDiagramTab();
              });
            } else if (data.type === 'openElementProjectionModal') {
              $rootScope.$apply(function() {
                bmsTabsService.addProjectionDiagramTab();
              });
            } else if (data.type === 'openHelp') {
              bmsConfigService.getConfig()
                .then(function(config) {
                  bmsModalService.openDialog("<p>BMotionWeb (version " + data.data + ")</p>" +
                    "<p>ProB 2.0 (version " + config.prob.version + ")</p>" +
                    "<p>" + config.prob.revision + "</p>");
                });
            } else if (data.type === 'showError') {
              bmsModalService.openErrorDialog(data.data);
            } else if (data.type === 'createNewVisualization') {
              createVisualizationService();
            }
          });

        }
      ]);
    return angularAMD.bootstrap(module);

  });

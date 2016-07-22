/**
 * BMotionWeb Integrated Root Module
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
    'bms.integrated.directive',
    'bms.views'
  ],
  function(angular, angularAMD) {

    var module = angular.module('bms.integrated.root', [
        'bms.config',
        'bms.observers',
        'bms.handlers',
        'bms.directive',
        'bms.integrated.directive',
        'bms.views'
      ])
      .run(['$rootScope', 'bmsMainService',
        function($rootScope, bmsMainService) {
          bmsMainService.setMode('ModeIntegrated');
        }
      ]);

    return angularAMD.bootstrap(module);

  });

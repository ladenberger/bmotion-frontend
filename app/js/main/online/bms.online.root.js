/**
 * BMotionWeb Online Root Module
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
    'bms.online.directive'
  ],
  function(angular, angularAMD) {

    var module = angular.module('bms.online.root', [
        'bms.config',
        'bms.observers',
        'bms.handlers',
        'bms.directive',
        'bms.online.directive'
      ])
      .run(['$rootScope', 'bmsMainService',
        function($rootScope, bmsMainService) {
          bmsMainService.setMode('ModeOnline');
        }
      ]);

    return angularAMD.bootstrap(module);

  });

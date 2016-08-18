/**
 * BMotionWeb Directives Module
 *
 */
define([
  'angular',
  'bms.directive.bms.widget',
  'bms.directive.visualization.view',
  'bms.directive.svg',
  'bms.directive.dialog',
  'prob.directive.view'
], function(angular) {
  return angular.module('bms.directive', [
    'bms.directive.bms.widget',
    'bms.directive.visualization.view',
    'bms.directive.svg',
    'bms.directive.dialog',
    'prob.directive.view'
  ]);
});

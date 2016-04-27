/**
 * BMotionWeb Directive Execute Event module
 *
 */
define([
  'angular',
  'bms.modal',
  'bms.api'
], function(angular) {

  return angular.module('bms.directive.execute.event', ['bms.modal', 'bms.api'])
    .directive('executeEvent', ['bmsApiService',
      function(bmsApiService) {
        'use strict';
        return {
          restrict: 'A',
          replace: false,
          link: function($scope, element, attr) {
            bmsApiService.addEvent($scope.id, 'executeEvent', {
              element: element,
              name: attr['name'],
              predicate: attr['predicate']
            });
          }
        }
      }
    ]);

});

/**
 * BMotionWeb Directive Execute Event module
 *
 */
define([
  'angular',
  'bms.modal',
  'bms.api'
], function(angular) {

  return angular.module('prob.directive.execute.event', [
      'bms.modal',
      'bms.api'
    ])
    .directive('executeEvent', ['bmsApiService',
      function(bmsApiService) {
        'use strict';
        return {
          restrict: 'A',
          replace: false,
          link: function($scope, _element_, attr) {
            bmsApiService.addEvent($scope.sessionId, $scope.id, 'executeEvent', {
              element: _element_,
              name: attr['name'],
              predicate: attr['predicate']
            });
          }
        }
      }
    ]);

});

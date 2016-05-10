/**
 * BMotionWeb User Interactions Directive View Module
 *
 */
define([
  'angular',
  'jquery',
  'jquery-ui',
  'ui-bootstrap',
  'prob.ws',
  'bms.modal',
  'bms.session'
], function(angular, $) {

  var module = angular.module('bms.views.user.interactions', [
      'prob.ws',
      'bms.modal',
      'bms.session',
      'ui.bootstrap'
    ])
    .filter('reverse', function() {
      return function(items) {
        if (items) return items.slice().reverse();
      };
    })
    .directive('bmsUserInteraction', ['ws', 'probWsService', 'bmsModalService', 'bmsSessionService',
      function(ws, probWsService, bmsModalService, bmsSessionService) {
        'use strict';

        return {

          template: '<table class="table table-striped table-condensed">' +
            '<tr><th>Transition</th><th>Executor</th></tr>' +
            '<tr ng-repeat="trans in transitions | reverse" ng-click="gotoTraceIndex(trans)" class="userInteractionsView-item userInteractionsView-item-{{trans.group}}">' +
            '<td>{{trans.opString}}</td>' +
            '<td>{{trans.executor ? "#" + trans.executor : ""}}</td>' +
            '</tr>' +
            '</table>',
          controller: ['$scope', function($scope) {

            var bmsSession = bmsSessionService.getSession($scope.sessionId);
            bmsSession.isInitialized()
              .then(function() {
                probWsService.observeHistory($scope.sessionId,
                  function(transitions) {
                    $scope.transitions = transitions;
                  }).then(function() {}, function(err) {
                  bmsModalService.openErrorDialog(err);
                });
              });

            $scope.gotoTraceIndex = function(evt) {

              probWsService.gotoTraceIndex($scope.sessionId, {
                index: $scope.transitions.indexOf(evt)
              });

            }

          }]

        }

      }
    ]);

  return module;

});

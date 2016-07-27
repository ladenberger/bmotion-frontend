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
  'bms.session',
  'bms.common'
], function(angular, $) {

  var module = angular.module('bms.views.user.interactions', [
      'prob.ws',
      'bms.modal',
      'bms.session',
      'ui.bootstrap',
      'bms.common'
    ])
    .filter('reverse', function() {
      return function(items) {
        if (items) return items.slice().reverse();
      };
    })
    .directive('bmsUserInteraction', ['probWsService', 'bmsModalService', 'bmsSessionService', 'bmsErrorService',
      function(probWsService, bmsModalService, bmsSessionService, bmsErrorService) {
        'use strict';

        return {
          replace: false,
          scope: {
            sessionId: '@bmsSessionId'
          },
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
                  bmsErrorService.print(err);
                  //bmsModalService.openErrorDialog(err);
                });
              });

            $scope.gotoTraceIndex = function(evt) {
              probWsService.gotoTraceIndex($scope.sessionId, $scope.transitions.indexOf(evt));
            };

          }]

        }

      }
    ]);

  return module;

});

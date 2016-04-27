/**
 * BMotionWeb User Interactions Directive View Module
 *
 */
define(['jquery', 'angular', 'jquery-ui', 'ui-bootstrap'], function($, angular) {

  var module = angular.module('bms.views.user.interactions', ['ui.bootstrap'])
    .filter('reverse', function() {
      return function(items) {
        if (items) return items.slice().reverse();
      };
    })
    .directive('bmsUserInteraction', ['ws',
      function(ws) {
        'use strict';

        return {

          templateUrl: 'js/main/views/UserInteractions.html',
          controller: ['$scope', function($scope) {

            ws.emiton('observeHistory', {
              data: {
                id: $scope.sessionId
              }
            }, function(data) {
              $scope.events = data;
            });

            $scope.executeEvent = function(evt) {
              ws.emit('executeEvent', {
                data: {
                  id: $scope.sessionId,
                  index: $scope.events.indexOf(evt)
                }
              });
            }

          }]
        }

      }
    ]);

  return module;

});

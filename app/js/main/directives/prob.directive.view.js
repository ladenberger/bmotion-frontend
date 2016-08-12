/**
 * BMotionWeb for ProB Directive ProB View Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.session',
  'bms.config',
  'bms.socket'
], function(angular, $) {

  var module = angular.module('prob.directive.view', ['bms.session', 'bms.config', 'bms.socket'])
    .directive('probView', ['$q', 'bmsSessionService', 'bmsConfigService', 'ws',
      function($q, bmsSessionService, bmsConfigService, ws) {
        'use strict';
        return {
          replace: true,
          scope: {
            sessionId: '@bmsSessionId'
          },
          template: '<div class="fullWidthHeight"><iframe src="" frameBorder="0" class="fullWidthHeight"></iframe></div>',
          require: '^bmsDialog',
          controller: ['$scope', function($scope) {

            var bmsSession = bmsSessionService.getSession($scope.sessionId);
            bmsSession.isInitialized()
              .then(function() {
                $scope.traceId = bmsSession.toolData.traceId;
              });

            var probPort = undefined;

            $scope.postpone = false;

            $scope.$on('openDialog_GroovyConsoleSession', function() {
              $scope.setUrl();
            });

            $scope.getProBPort = function() {
              var defer = $q.defer();
              if (probPort) {
                defer.resolve(probPort);
              } else {
                ws.emit('initProB')
                  .then(function(port) {
                    probPort = port;
                    defer.resolve(probPort);
                  });
              }
              return defer.promise;
            }

          }],
          link: function($scope, element, attrs, ctrl) {

            var iframe = $(element).find("iframe");

            ctrl.onEventListener('open', function() {
              if ($scope.postpone) {
                $scope.setUrl($scope.traceId);
                $scope.postpone = false;
              }
            });

            $scope.setUrl = function(postfix) {
              bmsConfigService.getConfig()
                .then(function(config) {
                  $scope.getProBPort().then(function(probPort) {
                    postfix = postfix ? postfix : '';
                    iframe.attr("src", 'http://' + config.prob.host + ':' + probPort + '/sessions/' + ctrl.getType() + '/' + postfix);
                  });
                });
            };

            $scope.$watch('traceId', function(newTraceId, oldTraceId) {
              if (newTraceId && newTraceId !== oldTraceId) {
                if (ctrl.isOpen()) {
                  $scope.setUrl(newTraceId);
                } else {
                  $scope.postpone = true;
                }
              }
            });

          }
        }
      }
    ]);

});

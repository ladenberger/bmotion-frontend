/**
 * BMotionWeb for ProB WS Module
 *
 */
define([
  'angular',
  'bms.socket'
], function(angular) {

  return angular.module('prob.ws', ['bms.socket'])
    .factory('probWsService', ['$q', 'ws',
      function($q, ws) {

        return {

          checkEvents: function(sessionId, traceId, events) {

            var defer = $q.defer();

            if (!sessionId) {
              defer.reject("Session id must not be undefined.");
            }

            ws.emit('checkEvents', {
              sessionId: sessionId,
              traceId: traceId,
              transitions: events
            }).then(function(result) {
              defer.resolve(result);
            }, function(err) {
              defer.reject(err);
            });

            return defer.promise;

          },
          observeHistory: function(sessionId) {

            var defer = $q.defer();

            if (!sessionId) {
              defer.reject("Session id must not be undefined.");
            }

            ws.emit('observeHistory', {
              sessionId: sessionId,
              options: {}
            }).then(function(result) {
              defer.resolve(result);
            }, function(err) {
              defer.reject(err);
            });

            return defer.promise;

          }

        }

      }

    ]);

});

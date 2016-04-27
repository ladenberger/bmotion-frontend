/**
 * BMotionWeb WS Module
 *
 */
define([
  'angular',
  'bms.socket'
], function(angular) {

  return angular.module('bms.ws', ['bms.socket'])
    .factory('bmsWsService', ['$q', 'ws',
      function($q, ws) {

        return {

          initSession: function(sessionId, manifestFilePath, modelPath, options) {

            var defer = $q.defer();

            if (!sessionId) {
              defer.reject("Session id must not be undefined.");
            }

            if (!manifestFilePath) {
              defer.reject("Manifest file path must not be undefined.");
            }

            if (!modelPath) {
              defer.reject("Model path must not be undefined.");
            }

            ws.emit('initSession', {
              sessionId: sessionId,
              manifestFilePath: manifestFilePath,
              modelPath: modelPath,
              options: options
            }).then(function(data) {
              defer.resolve(data);
            }, function(error) {
              defer.reject(error);
            });

            return defer.promise;

          },
          destroySession: function(sessionId) {

            var defer = $q.defer();

            if (!sessionId) {
              defer.reject("Session id must not be undefined.");
            }

            ws.emit('destroySession', sessionId)
              .then(function(data) {
                defer.resolve(data);
              }, function(error) {
                defer.reject(error);
              });

            return defer.promise;

          },
          loadSession: function(sessionId) {

            var defer = $q.defer();

            if (!sessionId) {
              defer.reject("Session id must not be undefined.");
            }

            ws.emit('loadSession', sessionId)
              .then(function(data) {
                defer.resolve(data);
              }, function(error) {
                defer.reject(error);
              });

            return defer.promise;

          },
          evaluateFormulas: function(sessionId, formulas) {

            var defer = $q.defer();

            if (!sessionId) {
              defer.reject("Session id must not be undefined.");
            }

            ws.emit('evaluateFormulas', {
              sessionId: sessionId,
              formulas: formulas
            }).then(function(data) {
              defer.resolve(data);
            }, function(error) {
              defer.reject(error);
            });

            return defer.promise;

          },
          executeEvent: function(sessionId, name, options) {

            var defer = $q.defer();

            if (!sessionId) {
              defer.reject("Session id must not be undefined.");
            }

            ws.emit("executeEvent", {
              sessionId: sessionId,
              name: name,
              options: options
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

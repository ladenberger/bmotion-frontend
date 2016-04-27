/**
 * BMotionWeb Socket Module
 *
 */
define([
  'angular',
  'socket.io',
  'bms.config',
  'bms.modal'
], function(angular, io) {

  return angular.module('bms.socket', ['bms.config', 'bms.modal'])
    .factory('bmsSocketService', ['bmsConfigService', '$q', 'bmsModalService',
      function(bmsConfigService, $q, bmsModalService) {
        'use strict';
        var socket = null;
        return {
          socket: function() {
            var defer = $q.defer();
            if (socket === null) {
              bmsConfigService.getConfig()
                .then(function(config) {
                  socket = io.connect('http://' + config.socket.host + ':' + config.socket.port);
                  socket.on('disconnect', function() {
                    bmsModalService.setError("BMotionWeb server disconnected");
                  });
                  defer.resolve(socket);
                }, function(error) {
                  defer.reject(error);
                });
            } else {
              defer.resolve(socket);
            }
            return defer.promise;
          }
        };
      }
    ])
    .factory('ws', ['$rootScope', 'bmsSocketService', 'bmsModalService', '$q',
      function($rootScope, bmsSocketService, bmsModalService, $q) {
        'use strict';
        return {
          emiton: function(event, data, callback) {
            this.removeAllListeners(event);
            this.emit(event, data, callback);
            this.on(event, callback);
          },
          emit: function(event, data) {

            var defer = $q.defer();

            bmsSocketService.socket()
              .then(function(socket) {
                socket.emit(event, data, function() {
                  var args = arguments;
                  $rootScope.$apply(function() {
                    if (args[0]) {
                      if (args[0].error) {
                        defer.reject(args[0].error);
                      } else {
                        if (args.length > 1) {
                          defer.resolve(args);
                        } else {
                          defer.resolve(args[0]);
                        }
                      }
                    } else {
                      defer.resolve();
                    }
                  });
                });
              }, function(error) {
                defer.reject(error);
              });

            return defer.promise;

          },
          on: function(event, callback) {
            bmsSocketService.socket()
              .then(function(socket) {
                socket.on(event, function() {
                  var args = arguments;
                  $rootScope.$apply(function() {
                    callback.apply(null, args);
                  });
                });
              }, function(error) {
                bmsModalService.openErrorDialog(error);
              });
          },
          removeAllListeners: function(event) {
            bmsSocketService.socket()
              .then(function(socket) {
                socket.removeAllListeners(event);
              }, function(error) {
                bmsModalService.openErrorDialog(error);
              });
          }
        };
      }
    ]);

});

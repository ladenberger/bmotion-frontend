/**
 * BMotionWeb Socket Module
 *
 */
define([
  'angular',
  'socket.io',
  'bms.config',
  'bms.modal',
  'bms.common'
], function(angular, io) {

  return angular.module('bms.socket', ['bms.config', 'bms.modal', 'bms.common'])
    .factory('bmsSocketService', ['bmsConfigService', '$q', 'bmsModalService', 'bmsErrorService',
      function(bmsConfigService, $q, bmsModalService, bmsErrorService) {
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
          emit: function(event, data, observable) {

            var defer = $q.defer();

            var self = this;

            if (observable) self.removeAllListeners(event);

            bmsSocketService.socket()
              .then(function(socket) {
                socket.emit(event, data, function() {
                  var args = arguments;
                  $rootScope.$apply(function() {
                    if (args[0]) {
                      if (args[0].error) {
                        defer.reject(args[0].error);
                      } else {
                        if (observable) self.on(event, observable);
                        if (args.length > 1) {
                          defer.resolve(args);
                          if (observable) observable(args);
                        } else {
                          defer.resolve(args[0]);
                          if (observable) observable(args[0]);
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
          on: function(event, observable) {
            bmsSocketService.socket()
              .then(function(socket) {
                socket.on(event, function() {
                  var args = arguments;
                  $rootScope.$apply(function() {
                    observable.apply(null, args);
                  });
                });
              }, function(error) {
                bmsErrorService.print(error);
                //bmsModalService.openErrorDialog(error);
              });
          },
          removeAllListeners: function(event) {
            bmsSocketService.socket()
              .then(function(socket) {
                socket.removeAllListeners(event);
              }, function(error) {
                bmsErrorService.print(error);
                //bmsModalService.openErrorDialog(error);
              });
          }
        };
      }
    ]);

});

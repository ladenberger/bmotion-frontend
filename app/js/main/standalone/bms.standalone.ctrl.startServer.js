define([
  'angular',
  'bms.modal',
  'bms.config',
  'bms.socket'
], function(angular) {

  return angular.module('bms.standalone.ctrl.startServer', ['bms.modal', 'bms.config', 'bms.socket'])
    .controller('bmsStartServerCtrl', ['$scope', '$routeParams', '$q', '$location', 'bmsModalService', 'bmsConfigService', 'bmsSocketService',
      function($scope, $routeParams, $q, $location, bmsModalService, bmsConfigService, bmsSocketService) {

        bmsModalService.closeModal();

        var checkIfConnectionExists = function() {
          var defer = $q.defer();
          bmsSocketService.socket()
            .then(function(socket) {
              if (socket.connected) defer.resolve(true);
              socket.on('connect_error', function() {
                defer.resolve(false);
              });
              socket.on('connect_timeout', function() {
                defer.resolve(false);
              });
              socket.on('connect', function() {
                defer.resolve(true);
              });
            }, function() {
              defer.resolve(false);
            });
          return defer.promise;
        };

        var startServer = function(connected, configData) {

          var defer = $q.defer();

          var path = require('path');
          var appPath = path.dirname(__dirname);
          var probBinary;
          if (configData['prob']['binary'] === undefined) {
            configData['prob']['binary'] = appPath + '/cli/';
            probBinary = appPath + '/cli/';
          }

          if (!connected) {

            var exec = require('child_process').exec;
            var isWin = /^win/.test(process.platform);
            var separator = isWin ? ';' : ':';
            var server = exec('java -Xmx1024m -cp ' + appPath + '/libs/*' + separator + appPath + '/libs/bmotion-prob-0.3.0.jar de.bmotion.prob.Standalone -local');
            server.stdout.on('data', function(data) {
              try {
                var json = JSON.parse(data.toString('utf8'));
                if (json) {
                  configData['socket']['port'] = json['port'];
                  defer.resolve();
                }
              } catch (err) {
                console.log(data.toString('utf8'));
              }
            });
            server.stderr.on('data', function(data) {
              console.log(data.toString('utf8'));
            });
            server.on('close', function(code) {
              console.log('BMotionWeb Server process exited with code ' + code);
            });

          } else {
            defer.resolve();
          }

          return defer.promise;

        };

        var initBMotionStudio = function() {

          var defer = $q.defer();

          bmsModalService.loading("Starting BMotionWeb ...");

          bmsConfigService.getConfig()
            .then(function(configData) {
              checkIfConnectionExists()
                .then(function(connected) {
                  startServer(connected, configData)
                    .then(function() {
                      defer.resolve();
                    }, function(error) {
                      defer.reject(error);
                    });
                });
            }, function(error) {
              defer.reject(error);
            });

          return defer.promise;

        };

        initBMotionStudio()
          .then(function() {
            bmsModalService.endLoading();
            $location.path('/welcome');
          }, function(error) {
            bmsModalService.openErrorDialog(error)
              .then(function() {
                electronWindow.fromId(1).close();
              }, function() {
                electronWindow.fromId(1).close();
              });
          });


      }
    ]);
});

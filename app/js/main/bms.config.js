/**
 * BMotionWeb Config Module
 *
 */
define([
  'angular',
  'tv4',
  'bms.common'
], function(angular, tv4) {

  return angular.module('bms.config', ['bms.common'])
    .constant('defaultConfig', {
      socket: {
        "host": "localhost",
        "port": "19090",
      }
    })
    .constant('configScheme', {
      "title": "BMotionWeb Config",
      "type": "object",
      "properties": {
        "socket": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string",
              "description": "Host name of websocket server."
            },
            "port": {
              "type": "string",
              "description": "Port of websocket server."
            }
          }
        },
        "prob": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "binary": {
              "type": "string"
            },
            "version": {
              "type": "string"
            },
            "revision": {
              "type": "string"
            }
          }
        }
      }
    })
    .factory('bmsConfigService', ['$q', '$http', 'configScheme', 'defaultConfig', 'bmsMainService',
      function($q, $http, configScheme, defaultConfig, bmsMainService) {

        var config = null;

        var service = {
          getConfig: function() {

            var defer = $q.defer();
            if (config) {
              defer.resolve(config);
            } else {

              service.getConfigData()
                .then(function(configData) {
                  service.validate(configData)
                    .then(function(validatedConfigData) {
                      config = angular.merge({}, {
                        socket: {
                          "host": "localhost",
                          "port": "19090",
                        }
                      }, validatedConfigData);
                      defer.resolve(config);
                    }, function(error) {
                      defer.reject(error);
                    });
                }, function(error) {
                  defer.reject(error);
                });

            }

            return defer.promise;

          },
          getConfigData: function() {

            var defer = $q.defer();

            var path = bmsMainService.getMode() === "ModeStandalone" ? '../bmotion.json' : 'bmotion.json';

            $http.get(path)
              .success(function(configData) {
                defer.resolve(configData);
              })
              .error(function(data, status, headers, config) {
                // If config file was not found resolve the default config
                defer.resolve(defaultConfig);
              });

            return defer.promise;

          },
          validate: function(configData) {

            var defer = $q.defer();

            if (tv4.validate(configData, configScheme)) {
              defer.resolve(configData);
            } else {
              defer.reject("BMotionWeb config file (bmotion.json) invalid: " + tv4.error.message + " (" + tv4.error.dataPath + ")");
            }

            return defer.promise;

          }
        };

        return service;

      }
    ]);

});

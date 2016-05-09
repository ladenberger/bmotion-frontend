/**
 * BMotionWeb Manifest Module
 *
 */
define([
  'angular',
  'tv4'
], function(angular, tv4) {

  return angular.module('bms.manifest', [])
    .constant('manifestScheme', {
      "title": "BMotionWeb Manifest",
      "type": "object",
      "properties": {
        "views": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "template": {
                "type": "string"
              },
              "observers": {
                "type": "string"
              },
              "events": {
                "type": "string"
              },
              "width": {
                "type": "integer"
              },
              "height": {
                "type": "integer"
              }
            },
            "required": ["id", "template"]
          }
        },
        "model": {
          "type": "string",
          "description": "Path to model (e.g. Event-B machine or CSP model)"
        },
        "modelOptions": {
          "type": "object"
        },
        "tool": {
          "type": "string",
          "description": "Visualization provider"
        }
      },
      "required": ["views"]
    })
    .factory('bmsManifestService', ['$q', '$http', 'manifestScheme', function($q, $http, manifestScheme) {

      var service = {

        getManifest: function(manifestFilePath) {

          var defer = $q.defer();

          if (!manifestFilePath) {
            defer.reject("You need to provide a valid path to a BMotionWeb manifest file.");
          } else {

            var filename = manifestFilePath.replace(/^.*[\\\/]/, '');
            if (filename !== 'bmotion.json') {
              defer.reject(filename + " is no valid BMotionWeb manifest file.");
            } else {

              service.getManifestData(manifestFilePath)
                .then(function(manifestData) {

                    service.validate(manifestData)
                      .then(function(validatedManifestData) {
                        defer.resolve(validatedManifestData);
                      }, function(error) {
                        defer.reject(error);
                      })

                  },
                  function(error) {
                    defer.reject(error);
                  });

            }

          }

          return defer.promise;

        },

        getManifestData: function(manifestFilePath) {

          var defer = $q.defer();

          $http.get(manifestFilePath)
            .success(function(data) {
              defer.resolve(data);
            })
            .error(function(data, status, headers, config) {
              if (status === 404) {
                defer.reject("File not found: " + config.url);
              } else {
                defer.reject("Some error occurred while requesting BMotionWeb manifest file (bmotion.json).");
              }
            });

          return defer.promise;

        },

        validate: function(manifestData) {

          var defer = $q.defer();

          if (tv4.validate(manifestData, manifestScheme)) {
            defer.resolve(manifestData);
          } else {
            defer.reject("BMotionWeb manifest file invalid: " + tv4.error.message + " (" + tv4.error.dataPath + ")");
          }

          return defer.promise;

        }

      };

      return service;

    }]);

});

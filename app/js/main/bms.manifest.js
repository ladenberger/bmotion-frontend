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
        "id": {
          "type": "string",
          "description": "Unique id of the interactive formal prototype"
        },
        "name": {
          "type": "string",
          "description": "The name of the interactive formal prototype"
        },
        "template": {
          "type": "string",
          "description": "The relative path to the HTML template file (e.g. template.html)"
        },
        "model": {
          "type": "string",
          "description": "The relative path to the formal specification file that should be animated (e.g. model/mymodel.mch)"
        },
        "modelOptions": {
          "type": "object",
          "description": "A key/value map defining the options for loading the model - The available options are dependent on the animator and formalism"
        },
        "autoOpen": {
          "type": "array",
          "description": "The user can specify the ProB views which should be opened automatically when running the interactive formal prototype - The following views are available for ProB animations: CurrentTrace, Events, StateInspector and ModelCheckingUI"
        },
        "views": {
          "type": "array",
          "description": "List of additional views",
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
        }
      },
      "required": ["id", "template", "model"]
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
                        defer.resolve(angular.merge({
                          modelOptions: {}
                        }, validatedManifestData));

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
            defer.reject("BMotionWeb manifest file invalid: " + tv4.error.message);
          }

          return defer.promise;

        }

      };

      return service;

    }]);

});

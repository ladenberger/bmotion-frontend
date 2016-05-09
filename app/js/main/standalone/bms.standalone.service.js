define([
  'angular',
  'bms.func',
  'bms.session',
  'bms.standalone.electron'
], function(angular, bms) {

  return angular.module('bms.standalone.service', ['bms.session', 'bms.standalone.electron'])
    .factory('createVisualizationService', ['$uibModal', '$q', 'electronDialog', 'fs', 'path', 'ncp', 'initVisualizationService',
      function($uibModal, $q, electronDialog, fs, path, ncp, initVisualizationService) {

        var createJsonFile = function(folder, file, json) {
          var defer = $q.defer();
          fs.writeFile(folder + '/' + file, JSON.stringify(json, null, "    "),
            function(err) {
              if (err) {
                defer.reject(err);
              } else {
                defer.resolve(file);
              }
            });
          return defer.promise;
        }

        return function() {

          var modalInstance = $uibModal.open({
            templateUrl: 'resources/templates/bms-create-visualization.html',
            controller: function($scope, $modalInstance) {

              $scope.close = function() {
                $modalInstance.close();
              };

              $scope.ok = function() {

                $scope.$broadcast('show-errors-check-validity');

                if ($scope.userForm.$valid) {
                  $modalInstance.close($scope.view);
                }

              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };

            },
            resolve: {},
            backdrop: false
          });
          modalInstance.result.then(function(view) {

              electronDialog.showOpenDialog({
                  title: 'Please select a folder where the BMotionWeb visualization should be saved.',
                  properties: ['openDirectory', 'createDirectory']
                },
                function(files) {

                  if (files) {

                    var folder = files[0];
                    var appPath = path.dirname(__dirname);
                    var templateFolder = appPath + '/template';
                    ncp(templateFolder, folder, function(err) {

                      if (err) {
                        bmsModalService.openErrorDialog(err);
                      } else {

                        view.template = 'index.html';
                        view.observers = view.id + '.observers.json';
                        view.events = view.id + '.events.json';
                        var manifestFile = 'bmotion.json';

                        createJsonFile(folder, view.observers, {
                            observers: []
                          })
                          .then(function() {
                            return createJsonFile(folder, view.events, {
                              events: []
                            });
                          })
                          .then(function() {
                            return createJsonFile(folder, manifestFile, {
                              views: [view]
                            });
                          })
                          .then(function() {
                            initVisualizationService(folder + '/' + manifestFile);
                          }, function(err) {
                            bmsModalService.openErrorDialog("An error occurred while writing file: " + err);
                          });

                      }

                    });

                  }

                });

            },
            function() {});

        }

      }
    ])
    .factory('initFormalModelOnlyService', ['bmsSessionService', 'bmsModalService', '$location',
      function(bmsSessionService, bmsModalService, $location) {

        return function(modelPath) {

          bmsModalService.loading("Initializing Model ...");

          var filename = modelPath.replace(/^.*[\\\/]/, '');
          var fileExtension = filename.split('.').pop();
          var tool = fileExtension === 'csp' ? 'CSPAnimation' : 'BAnimation';

          bmsSessionService.init(modelPath, {
              preferences: {}
            })
            .then(function(sessionId) {
              $location.path('/model/' + sessionId + '/1/' + tool);
              bmsModalService.endLoading();
            });

        }

      }
    ])
    .factory('openModelService', ['electronDialog', '$q', '$uibModal',
      function(electronDialog, $q, $uibModal) {

        return function() {

          var defer = $q.defer();

          var modalInstance = $uibModal.open({
            templateUrl: 'resources/templates/bms-open-model.html',
            controller: function($scope, $modalInstance) {

              $scope.openModel = function() {

                electronDialog.showOpenDialog({
                    title: 'Please select a model.',
                    filters: [{
                      name: 'Model (*.mch, *.csp, *.bcm)',
                      extensions: ['mch', 'csp', 'bcm']
                    }],
                    properties: ['openFile']
                  },
                  function(files) {

                    if (files) {

                      var modelPath = files[0];
                      $scope.$apply(function() {
                        $scope.model = modelPath;
                      });

                    }

                  }
                );

              };

              $scope.close = function() {
                $scope.$broadcast('show-errors-check-validity');
                if ($scope.userForm.$valid) {
                  // TODO: RETURN DATA
                  $modalInstance.close($scope.model);
                }
              };

              $scope.ok = function() {
                $scope.close();
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };

            },
            resolve: {},
            backdrop: false
          });
          modalInstance.result.then(function(model) {
            defer.resolve(model);
          }, function() {
            defer.reject("Please select a model to start the visualization.");
          });

          return defer.promise;

        }

      }
    ])
    .factory('initVisualizationService', ['$location', 'bmsSessionService', 'bmsModalService', 'electronWindow', 'electronWindowService',
      function($location, bmsSessionService, bmsModalService, electronWindow, electronWindowService) {

        /*var getModel = function(modelPath) {
          var defer = $q.defer();
          if (!modelPath) {
            defer.resolve(openModelService());
          } else {
            defer.resolve(modelPath);
          }
          return defer.promise;
        };*/

        return function(manifestFilePath) {

          bmsModalService.loading("Initializing visualization ...");

          var sessionId = bms.uuid(); // Session id
          var session = bmsSessionService.getSession(sessionId); // Get fresh session instance

          //var bmsSession = bmsSessionService.getSession();
          session.init(manifestFilePath)
            .then(function() {              
              $location.path('/vis/' + sessionId);
              bmsModalService.endLoading();
            }, function(err) {
              bmsModalService.openErrorDialog(err);
            });

        }

      }
    ]);

});

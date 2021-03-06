/**
 * BMotionWeb Directive Editor Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.modal',
  'bms.session',
  'bms.standalone.nodejs',
  'bms.visualization',
  'bms.standalone.electron',
  'bms.common',
], function(angular, $) {

  return angular.module('bms.directive.editor', ['bms.modal', 'bms.session', 'bms.visualization', 'bms.standalone.nodejs', 'bms.standalone.electron', 'bms.common'])
    .directive('bmsVisualizationEditor', ['bmsModalService', 'bmsSessionService', 'bmsVisualizationService', '$q', '$timeout', '$http', '$rootScope', 'fs', 'electron', 'bmsErrorService',
      function(bmsModalService, bmsSessionService, bmsVisualizationService, $q, $timeout, $http, $rootScope, fs, electron, bmsErrorService) {
        return {
          replace: false,
          scope: {
            svg: '@bmsSvgFile',
            id: '@bmsVisualizationId',
            //view: '@bmsVisualisationView',
            sessionId: '@bmsSessionId'
          },
          template: '<iframe src="editor.html" class="editorIframe"></iframe>',
          controller: ['$scope', '$rootScope', function($scope, $rootScope) {

            if (!$scope.sessionId) {
              bmsErrorService.print("Session id must not be undefined.");
              //bmsModalService.openErrorDialog("Session id must not be undefined.");
            }
            // TODO check if session really exists!?
            $scope.session = bmsSessionService.getSession($scope.sessionId);
            $scope.view = $scope.session.getView($scope.id);

            // Parent API (called from bms.editor.root)
            // --------------------------------------
            $scope.addObserver = function(type, data) {
              $scope.view.jsonObservers.push({
                type: type,
                data: data
              });
              $scope.view.addObserver(type, data);
            };

            $scope.addEvent = function(type, data) {
              $scope.view.jsonEvents.push({
                type: type,
                data: data
              });
              $scope.view.addEvent(type, data);
            };

            $scope.disableEditor = function(reason) {
              bmsVisualizationService.disableTab($scope.svg, reason);
            };

            $scope.openDialog = function(msg, cb) {
              electron.dialog.showMessageBox({
                title: "Please confirm",
                type: "info",
                buttons: ["Ok", "Cancel"],
                message: msg,
              }, cb);
            };

            // --------------------------------------

            $scope.bmsModalService = bmsModalService;

            $scope.init = function() {

              var defer = $q.defer();

              var view = $scope.session.getView($scope.id);
              $http.get($scope.session.templateFolder + '/' + $scope.svg)
                .success(function(svgContent) {
                  defer.resolve({
                    view: view,
                    session: $scope.session,
                    svgFile: $scope.svg,
                    svgContent: svgContent
                  });
                })
                .error(function() {
                  defer.reject("Some error occurred while requesting SVG file " + $scope.svg);
                });

              return defer.promise;

            };

            var saveSvg = function(templateFolder, svg) {

              var defer = $q.defer();
              svg = svg.replace(new RegExp(templateFolder + '/', "g"), "");
              fs.writeFile(templateFolder + '/' + $scope.svg, svg,
                function(err) {
                  if (err) {
                    defer.reject("An error occurred while writing svg file " + $scope.svg + ": " + err);
                  } else {
                    defer.resolve();
                  }
                });

              return defer.promise;

            };

            var saveObservers = function(templateFolder, view) {

              var defer = $q.defer();

              var jsonObservers = {
                observers: view.jsonObservers
              };
              var jsonString = JSON.stringify(jsonObservers, null, "    ");
              var observersViewPath = view.viewData.observers ? view.viewData.observers : view.viewData.id + '.observers.json';
              fs.writeFile(templateFolder + '/' + observersViewPath, jsonString,
                function(err) {
                  if (err) {
                    defer.reject("An error occurred while writing file " + observersViewPath + ": " + err);
                  } else {
                    defer.resolve();
                  }
                });

              return defer.promise;

            };

            var saveEvents = function(templateFolder, view) {

              var defer = $q.defer();

              var jsonEvents = {
                events: view.jsonEvents
              };
              var jsonString = JSON.stringify(jsonEvents, null, "    ");
              var eventsViewPath = view.viewData.events ? view.viewData.events : view.viewData.id + '.events.json';
              fs.writeFile(templateFolder + '/' + eventsViewPath, jsonString,
                function(err) {
                  if (err) {
                    defer.reject("An error occurred while writing file " + eventsViewPath + ": " + err);
                  } else {
                    defer.resolve();
                  }
                });

              return defer.promise;

            };

            $scope.save = function(svg) {

              bmsModalService.loading("Saving svg ...");
              var templateFolder = $scope.session.templateFolder;
              var view = $scope.session.getView($scope.id);
              saveSvg(templateFolder, svg)
                .then(function() {
                  bmsModalService.loading("Saving observers ...");
                  return saveObservers(templateFolder, view);
                })
                .then(function() {
                  bmsModalService.loading("Saving events ...");
                  return saveEvents(templateFolder, view);
                })
                .then(function() {
                  bmsModalService.endLoading("");
                  bmsModalService.openDialog("Visualization has been saved successfully.");
                  $rootScope.$broadcast('visualizationSaved', $scope.id, $scope.svg);
                }, function(error) {
                  bmsErrorService.print(error);
                  //bmsModalService.openErrorDialog(error);
                });

            };

          }],
          link: function($scope, $element, attrs, ctrl) {
            $scope.$on('selectEditorTab', function() {
              $timeout(function() {
                var iframe = $element.contents();
                iframe[0].focus();
              }, 0);
            });
          }
        }
      }
    ]);

});

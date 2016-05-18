/**
 * BMotionWeb Directive Visualization View Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.modal',
  'bms.session',
  'bms.visualization',
  'bms.manifest'
], function(angular, $, bms) {

  return angular.module('bms.directive.visualization.view', ['bms.modal', 'bms.session', 'bms.visualization', 'bms.manifest'])
    .directive('bmsVisualizationView', ['$rootScope', 'bmsManifestService', 'bmsSessionService', 'bmsVisualizationService', 'ws', 'bmsModalService', 'trigger', '$compile', '$http', '$q',
      function($rootScope, bmsManifestService, bmsSessionService, bmsVisualizationService, ws, bmsModalService, trigger, $compile, $http, $q) {
        'use strict';
        return {
          replace: false,
          scope: {
            sessionId: '@bmsSessionId',
            viewId: '@bmsVisualizationView',
            id: '@bmsVisualizationId'
          },
          template: '<iframe src="" frameBorder="0" class="fullWidthHeight bmsIframe"></iframe>',
          controller: ['$scope', function($scope) {

            if (!$scope.sessionId) {
              bmsModalService.openErrorDialog("Session id must not be undefined.");
            }

            // Get session instance
            $scope.session = bmsSessionService.getSession($scope.sessionId);
            // Get view instance
            $scope.view = $scope.session.getView($scope.id);

            // Create a new view instance in session
            $scope.values = $scope.view.getValues();

            $scope.attrs = {};

            // Listen on checkObserver events
            ws.on('checkObserver', function(cause, toolData) {
              $scope.session.toolData = angular.merge($scope.session.toolData, toolData);
              $scope.view.clearValues();
              $scope.view.checkObservers()
                .then(function() {}, function(err) {
                  bmsModalService.openErrorDialog(err);
                });
              $scope.view.triggerListeners(cause);
            });

            // Remove all checkObserver event listeners if session is destroyed
            $scope.$on('$destroy', function() {
              ws.removeAllListeners("checkObserver");
            });

          }],
          link: function($scope, $element, attrs, ctrl) {

            // Set container of visualization instance
            var iframe = $($element.contents());
            iframe.attr("viewId", $scope.id);
            iframe.attr("sessionId", $scope.sessionId);
            var iframeContents;
            $scope.view.container = iframe;

            // Watch for changes in attribute values
            $scope.$watch(function() {
              return $scope.view.getValues();
            }, function(newValue) {
              // If changes are deteced apply the new values
              if (!bms.isEmpty(newValue)) {
                $scope.values = newValue;
                $scope.applyValues();
              }
            }, true);

            $scope.getValue = function(bmsid, attr, defaultValue) {
              var returnValue = defaultValue === 'undefined' ? undefined : defaultValue;
              var ele = $scope.values[bmsid];
              if (ele) {
                returnValue = ele[attr] === undefined ? returnValue : ele[attr];
              }
              return returnValue;
            };

            $scope.applyValues = function() {
              for (var bmsid in $scope.values) {
                if ($scope.attrs[bmsid] === undefined) {
                  $scope.attrs[bmsid] = [];
                }
                var nattrs = $scope.values[bmsid];
                for (var a in nattrs) {
                  if ($scope.attrs[bmsid].indexOf(a) === -1) {
                    var orgElement = $scope.view.container.contents().find('[data-bms-id=' + bmsid + ']');
                    var attrDefault = orgElement.attr(a);
                    // Special case for class attributes
                    if (a === "class" && attrDefault === undefined) {
                      attrDefault = ""
                    }
                    orgElement
                      .attr("ng-attr-" + a, "{{getValue('" + bmsid + "','" + a + "','" + attrDefault + "')}}");
                    $compile(orgElement)($scope);
                    $scope.attrs[bmsid].push(a);
                  }
                }
              }
            };

            // Listen to visualizationSaved event
            // (typically called from editor after saving)
            $scope.$on('visualizationSaved', function(evt, id, svg) {

              if ($scope.id === id) {

                var svgItem = $scope.view.getSvg(svg);

                // Get defer of saved svg file
                svgItem.deferSave = $q.defer();

                // Clear all observers, events and listeners
                $scope.view.clearObservers();
                $scope.view.clearEvents();
                $scope.view.clearListeners();

                // Readd observer and events coming from json
                $scope.addJsonData({
                  observers: $scope.view.jsonObservers,
                  events: $scope.view.jsonEvents
                });

                // Reload template in order to readd observers
                // and events coming from js
                iframe.attr('src', iframe.attr('src'));
                // Wait until svg content is successfully loaded
                svgItem.deferSave.promise
                  .then(function() {
                    // Finally check and setup events
                    $scope.view.checkObservers();
                    $scope.view.setupEvents();
                  });
              }

            });

            $scope.loadViewData = function(viewId, manifestData) {
              var defer = $q.defer();
              var views = manifestData['views'];
              if (views) {
                angular.forEach(manifestData['views'], function(v) {
                  if (v['id'] === viewId) {
                    defer.resolve(v);
                  }
                });
              } else {
                defer.reject("View with id " + viewId + " not found.");
              }
              return defer.promise;
            };

            $scope.getJsonElements = function(templateFolder, viewData) {

              var defer = $q.defer();
              var observersViewPath = viewData.observers;
              var eventsViewPath = viewData.events

              var returnData = {
                observers: [],
                events: []
              };

              var promises = [];

              if (observersViewPath) {
                promises.push($http.get(templateFolder + '/' + observersViewPath));
              }

              if (eventsViewPath) {
                promises.push($http.get(templateFolder + '/' + eventsViewPath));
              }

              $q.all(promises)
                .then(function(data) {
                  if (data[0]) {
                    returnData.observers = data[0].data.observers;
                  }
                  if (data[1]) {
                    returnData.events = data[1].data.events;
                  }
                }).finally(function() {
                  defer.resolve(returnData);
                });

              return defer.promise;

            };

            $scope.addJsonData = function(data) {

              var defer = $q.defer();

              var observerPromises = data.observers.map(function(e) {
                return $scope.view.addObserver(e.type, e.data);
              });

              var eventsPromises = data.events.map(function(e) {
                return $scope.view.addEvent(e.type, e.data);
              });

              // Check all observers
              $q.all(observerPromises)
                .then(
                  function success(observerInstances) {
                    return $scope.view.checkObservers(observerInstances);
                  },
                  function error(err) {
                    defer.reject(err);
                  })
                .then(
                  function success() {
                    return $q.all(eventsPromises);
                  },
                  function error(err) {
                    defer.reject(err);
                  })
                //Setup all events
                .then(
                  function success(eventsInstances) {
                    return $scope.view.setupEvents(eventsInstances);
                  },
                  function error(err) {
                    defer.reject(err);
                  })
                .then(
                  function success() {
                    defer.resolve();
                  },
                  function error(err) {
                    defer.reject(err);
                  });

              return defer.promise;

            };

            $scope.initView = function(viewId) {

              var defer = $q.defer();

              // load view data from manifest data based on view id
              $scope.loadViewData(viewId, $scope.session.manifestData)
                .then(
                  function success(viewData) {
                    // Set view data in visualization instance
                    $scope.view.viewData = viewData;
                    // load view template
                    $scope.view.loadTemplate(viewData.template, $scope)
                      .then(
                        function success() {
                          // get json observer and events
                          return $scope.getJsonElements($scope.session.templateFolder, viewData);
                        })
                      .then(
                        function success(data) {
                          // set plain json data in view instance
                          $scope.view.jsonObservers = data.observers;
                          $scope.view.jsonEvents = data.events;
                          // add and check json observer and events
                          return $scope.addJsonData(data);
                        })
                      .then(
                        function success() {
                          // if no errors occurred in the chain resolve
                          defer.resolve();
                        },
                        function error(err) {
                          defer.reject(err);
                        }
                      );
                  },
                  function error(err) {
                    defer.reject(err);
                  });

              return defer.promise;

            };

            $scope.$watch(function() {
              return attrs['bmsVisualizationView'];
            }, function(newValue) {
              if (newValue && newValue.length > 0) {
                $scope.session.isInitialized()
                  .then(function() {
                    $scope.initView(newValue)
                      .then(function success() {
                          // if no errors occurred in the chain mark visualization
                          // as initialized and propagate "visualizationLoaded" event
                          $rootScope.$broadcast('visualizationLoaded', $scope.view);
                          $scope.view.initialized.resolve();
                        },
                        function error(err) {
                          bmsModalService.openErrorDialog('An error occurred while initializing view ' + $scope.id + ':' + err);
                        });
                  });
              }
            });

          }
        }
      }
    ]);

});

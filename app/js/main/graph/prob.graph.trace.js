/**
 * BMotionWeb for ProB Graph Trace Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.session',
  'prob.graph.rendering'
], function(angular, $) {

  return angular.module('prob.graph.trace', [
      'bms.session',
      'prob.graph.rendering'
    ])
    .factory('bmsDiagramTraceGraph', ['$q', function($q) {

      return {

        build: function(container, data) {

          var deferred = $q.defer();

          $(function() { // on dom ready

            // Cytoscape needs the jquery $ variables as a global variable
            // in order to initialise the cytoscape jquery plugin
            window.$ = window.jQuery = $;

            requirejs(['cytoscape', 'cytoscape.navigator'], function(cytoscape) {

              var containerEle = $(container);
              var graphEle = containerEle.find(".trace-diagram-graph");
              var navigatorEle = containerEle.find(".trace-diagram-navigator");
              graphEle.cytoscape({
                ready: function() {
                  graphEle.cyNavigator({
                    container: navigatorEle
                  });
                  deferred.resolve({
                    cy: this,
                    navigator: graphEle
                  });
                },
                style: cytoscape.stylesheet()
                  .selector('node')
                  .css({
                    'shape': 'rectangle',
                    'content': 'data(label)',
                    'width': 'data(width)',
                    'height': 'data(height)',
                    'background-color': 'white',
                    'border-width': 2,
                    'font-size': '15px',
                    'text-valign': 'top',
                    'text-halign': 'center',
                    'background-repeat': 'no-repeat',
                    'background-image': 'data(svg)',
                    'background-fit': 'none',
                    'background-position-x': '15px',
                    'background-position-y': '15px'
                  })
                  .selector('edge')
                  .css({
                    'content': 'data(label)',
                    'target-arrow-shape': 'triangle',
                    'width': 1,
                    'line-color': 'black',
                    'target-arrow-color': 'black',
                    'color': 'black',
                    'font-size': '15px',
                    'control-point-distance': 60
                  }),
                layout: {
                  name: 'circle',
                  animate: false,
                  fit: true,
                  padding: 30,
                  directed: true,
                  avoidOverlap: true,
                  roots: '#root'
                },
                elements: {
                  nodes: data.nodes,
                  edges: data.edges
                }
              });

            });

          }); // on dom ready
          return deferred.promise;
        }

      };

    }])
    .directive('bmsDiagramTraceView', ['bmsModalService', 'bmsRenderingService', 'bmsDiagramTraceGraph', 'bmsSessionService',
      function(bmsModalService, bmsRenderingService, bmsDiagramTraceGraph, bmsSessionService) {
        return {
          replace: false,
          scope: {
            id: '@bmsVisualizationId',
            sessionId: '@bmsSessionId'
          },
          template: '<div class="input-group input-group-sm diagram-form">' +
            '<label>Select view and selector</label>' +
            '<select class="form-control" ng-options="s as s.viewId for s in viewIds" ng-change="updateSelectors()" ng-model="selectedView">' +
            '</select>' +
            '</div>' +
            '<div class="input-group input-group-sm diagram-form">' +
            '<select class="form-control" ng-options="s as s.selector for s in selectors" ng-model="selectedSelector">' +
            '</select>' +
            '<span class="input-group-btn">' +
            '<button class="btn btn-default" type="button" ng-click="useSelector()">' +
            '<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>' +
            '</button>' +
            '</span>' +
            '<input type="text" class="form-control" placeholder="Selector" ng-model="selector">' +
            '<span class="input-group-btn">' +
            '<button class="btn btn-default" type="button" ng-click="createDiagram()">Go!</button>' +
            '</span>' +
            '</div>' +
            '<div class="fullWidthHeight">' +
            '<div class="trace-diagram-graph fullWidthHeight"></div>' +
            '<div class="trace-diagram-navigator"></div>' +
            '</div>',
          controller: ['$scope', function($scope) {

            if (!$scope.sessionId) {
              bmsModalService.openErrorDialog("Session id must not be undefined.");
            }

            // TODO check if session really exists!?
            $scope.session = bmsSessionService.getSession($scope.sessionId);
            $scope.view = $scope.session.getView($scope.id);

            //$scope.selectors = bmsRenderingService.getElementIds($scope.session);
            $scope.selectors = [];
            $scope.viewIds = [];

            for (viewId in $scope.session.views) {
              var view = $scope.session.views[viewId];
              $scope.viewIds.push({
                id: view.id,
                viewId: view.viewData.id
              });
            }

            $scope.updateSelectors = function() {
              if ($scope.selectedView) {
                var view = $scope.session.getView($scope.selectedView.id);
                $scope.selectors = bmsRenderingService.getElementIds(view);
              }
            }

            $scope.$on('exportSvg', function() {
              if ($scope.cy) {
                window.open($scope.cy.png({
                  full: true,
                  scale: 2
                }));
              }
            });

            $scope.useSelector = function() {
              if ($scope.selectedSelector) $scope.selector = $scope.selectedSelector.selector;
            };

          }],
          link: function($scope, $element) {

            $scope.createDiagram = function() {

              bmsModalService.loading("Creating trace diagram for selector " + $scope.selector);
              if (!$scope.selectedView || !$scope.selector) {
                bmsModalService.openErrorDialog("Please select a view and selector.");
              } else {
                var view = $scope.session.getView($scope.selectedView.id);
                bmsRenderingService.getDiagramData(view, $scope.selector, 'createTraceDiagram', function(node) {
                    return node.data.id !== 'root' && node.data.id !== '0' && node.data.op !== '$setup_constants';
                  })
                  .then(
                    function success(graphData) {
                      if (!$scope.cy) {
                        bmsDiagramTraceGraph.build($element, graphData)
                          .then(function(r) {
                            $scope.cy = r.cy;
                            $scope.navigator = r.navigator;
                            bmsModalService.endLoading();
                          });
                      } else {
                        $scope.cy.load(graphData, function() {}, function() {});
                        bmsModalService.endLoading();
                      }
                    },
                    function error(error) {
                      bmsModalService.openErrorDialog(error);
                    });
              };
            }

          }
        }

      }
    ]);

});

/**
 * BMotionWeb for ProB Graph Projection Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.session',
  'prob.graph.rendering'
], function(angular, $) {

  return angular.module('prob.graph.projection', [
      'prob.graph.rendering',
      'bms.session'
    ])
    .factory('bmsDiagramElementProjectionGraph', ['$q', function($q) {

      return {

        build: function(container, data) {

          var deferred = $q.defer();

          $(function() { // on dom ready

            // Cytoscape needs the jquery $ variables as a global variable
            // in order to initialise the cytoscape jquery plugin
            window.$ = window.jQuery = $;

            requirejs(['cytoscape', 'cytoscape.navigator'], function(cytoscape) {

              var containerEle = $(container);
              var graphEle = containerEle.find(".projection-diagram-graph");
              var navigatorEle = containerEle.find(".projection-diagram-navigator");
              graphEle.cytoscape({
                zoomingEnabled: true,
                userZoomingEnabled: true,
                panningEnabled: true,
                userPanningEnabled: true,
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
                    'width': 'data(width)',
                    'height': 'data(height)',
                    'content': 'data(labels)',
                    'background-color': 'white',
                    'border-width': 2,
                    'border-color': 'data(color)',
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
                    'line-color': 'data(color)',
                    'line-style': 'data(style)',
                    'target-arrow-color': 'data(color)',
                    'font-size': '15px',
                    'control-point-distance': 100
                  }),
                layout: {
                  name: 'cose',
                  animate: false,
                  fit: true,
                  padding: 25,
                  directed: true,
                  roots: '#1',
                  nodeOverlap: 100, // Node repulsion (overlapping) multiplier
                  nodeRepulsion: 3000000 // Node repulsion (non overlapping)
                    // multiplier
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
    .directive('bmsDiagramElementProjectionView', ['bmsModalService', 'bmsRenderingService', 'bmsDiagramElementProjectionGraph', 'bmsSessionService',
      function(bmsModalService, bmsRenderingService, bmsDiagramElementProjectionGraph, bmsSessionService) {

        return {
          replace: false,
          scope: {
            id: '@bmsVisualizationId',
            sessionId: '@bmsSessionId'
          },
          template: '<div class="input-group input-group-sm diagram-form">' +
            '<select class="form-control" ng-options="s as s.selector for s in selectors" ng-model="selected">' +
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
            '<div class="projection-diagram-graph fullWidthHeight"></div>' +
            '<div class="projection-diagram-navigator"></div>' +
            '</div>',
          controller: ['$scope', function($scope) {

            if (!$scope.sessionId) {
              bmsModalService.openErrorDialog("Session id must not be undefined.");
            }
            // TODO check if session really exists!?
            $scope.session = bmsSessionService.getSession($scope.sessionId);
            $scope.view = $scope.session.getView($scope.id);

            $scope.selectors = bmsRenderingService.getElementIds($scope.view);

            $scope.$on('exportSvg', function() {
              if ($scope.cy) {
                window.open($scope.cy.png({
                  full: true,
                  scale: 2
                }));
              }
            });

            $scope.useSelector = function() {
              if ($scope.selected) $scope.selector = $scope.selected.selector;
            };

          }],
          link: function($scope, $element) {

            $scope.createDiagram = function() {

              bmsModalService.loading("Creating projection diagram for selector " + $scope.selector);

              bmsRenderingService.getDiagramData($scope.view, $scope.selector, 'createProjectionDiagram', function(node) {
                  return node.data.id !== '1' && node.data.labels[0] !== '<< undefined >>';
                })
                .then(
                  function success(graphData) {
                    if (!$scope.cy) {
                      bmsDiagramElementProjectionGraph.build($element, graphData)
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
    ]);

});

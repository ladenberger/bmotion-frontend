/**
 * BMotionWeb for ProB Graph Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.visualization',
  'bms.observers'
], function(angular, $) {

  return angular.module('prob.graph', ['bms.visualization', 'bms.observers'])
    .factory('bmsRenderingService', ['$q', 'ws', '$injector', 'bmsModalService', 'bmsObserverService', 'bmsVisualizationService', '$http', '$templateCache', '$compile', '$rootScope', '$interpolate', '$timeout', function($q, ws, $injector, bmsModalService, bmsObserverService, bmsVisualizationService, $http, $templateCache, $compile, $rootScope, $interpolate, $timeout) {

      var supportedSvgElements = ["svg", "g", "rect", "circle", "image", "line", "path", "text", "ellipse"];

      var isValidSelector = function(container, selector) {

        if (selector === undefined) {
          return "Please enter a valid selector.";
        } else {
          var elements = container.find(selector);
          if (elements.length === 0) {
            return "No graphical elements found for selector " + selector + ".";
          } else {
            var isValidSvg = true;
            angular.forEach(elements, function(el) {
              var tag = $(el).prop("tagName");
              if ($.inArray(tag, supportedSvgElements) === -1) {
                isValidSvg = false;
              }
            });
            if (!isValidSvg) {
              return "Your selector contains non svg elements.";
            }
          }
        }
        return undefined;

      };

      var getStyle = function(path, style) {
        var defer = $q.defer();
        if (style) {
          $http.get(path + "/" + style, {
            cache: $templateCache
          }).success(function(css) {
            defer.resolve('<style type="text/css">\n<![CDATA[\n' + css + '\n]]>\n</style>');
          });
        } else {
          defer.resolve();
        }
        return defer.promise;
      };

      var removeBlanks = function(context, canvas, imgWidth, imgHeight) {

        var imageData = context.getImageData(0, 0, imgWidth, imgHeight),
          data = imageData.data,
          getRBG = function(x, y) {
            var offset = imgWidth * y + x;
            return {
              red: data[offset * 4],
              green: data[offset * 4 + 1],
              blue: data[offset * 4 + 2],
              opacity: data[offset * 4 + 3]
            };
          },
          isWhite = function(rgb) {
            // many images contain noise, as the white is not a pure #fff white
            return rgb.red > 200 && rgb.green > 200 && rgb.blue > 200;
          },
          scanY = function(fromTop) {
            var offset = fromTop ? 1 : -1;

            // loop through each row
            for (var y = fromTop ? 0 : imgHeight - 1; fromTop ? (y < imgHeight) : (y > -1); y += offset) {

              // loop through each column
              for (var x = 0; x < imgWidth; x++) {
                var rgb = getRBG(x, y);
                if (!isWhite(rgb)) {
                  return y;
                }
              }
            }
            return null; // all image is white
          },
          scanX = function(fromLeft) {
            var offset = fromLeft ? 1 : -1;

            // loop through each column
            for (var x = fromLeft ? 0 : imgWidth - 1; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {

              // loop through each row
              for (var y = 0; y < imgHeight; y++) {
                var rgb = getRBG(x, y);
                if (!isWhite(rgb)) {
                  return x;
                }
              }
            }
            return null; // all image is white
          };

        var cropTop = scanY(true),
          cropBottom = scanY(false),
          cropLeft = scanX(true),
          cropRight = scanX(false),
          cropWidth = cropRight - cropLeft + 2,
          cropHeight = cropBottom - cropTop + 2;

        var $croppedCanvas = $("<canvas>").attr({
          width: cropWidth,
          height: cropHeight
        });
        $croppedCanvas[0].getContext("2d").drawImage(canvas, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

        return $croppedCanvas[0];

      };

      var getImageCanvasForSvg = function(svg) {

        var deferred = $q.defer();

        var canvas = document.createElement('canvas'),
          context;
        canvas.width = 50;
        canvas.height = 50;

        if (svg) {

          context = canvas.getContext("2d");
          var svgElement = $(svg);
          var image = new Image();
          image.crossOrigin = "anonymous";
          canvas.width = svgElement.attr("width") === undefined ? 50 : svgElement.attr("width");
          canvas.height = svgElement.attr("height") === undefined ? 50 : svgElement.attr("height");
          image.onload = function() {
            if (context) {
              context.drawImage(this, 0, 0, this.width, this.height);
              var croppedCanvas = removeBlanks(context, canvas, this.width, this.height);
              deferred.resolve(croppedCanvas);
            } else {
              // TODO: Report error if browser is to old!
            }
          };
          image.src = 'data:image/svg+xml;base64,' + window.btoa(svg);

        } else {
          deferred.resolve(canvas);
        }

        return deferred.promise;

      };

      var convertImgToBase64 = function(url, callback, outputFormat) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var img = new Image;
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
          canvas.height = img.height;
          canvas.width = img.width;
          ctx.drawImage(img, 0, 0);
          var dataURL = canvas.toDataURL(outputFormat || 'image/png');
          callback.call(this, dataURL);
          // Clean up
          canvas = null;
        };
        img.src = url;
      };

      var convertSvgImagePaths = function(path, container) {
        var defer = $q.defer();
        // Replace image paths with embedded images
        var imgConvert = [];
        var cfn = function(el, attr, attrVal) {
          var defer = $q.defer();
          convertImgToBase64(path + "/" + attrVal, function(dataUrl) {
            el.attr(attr, dataUrl);
            defer.resolve();
          });
          return defer.promise;
        };
        container.find("image").each(function(i, e) {
          var jElement = $(e);
          var xlinkhref = jElement.attr("xlink:href");
          var href = jElement.attr("href");
          if (xlinkhref) {
            imgConvert.push(cfn(jElement, "xlink:href", xlinkhref));
          }
          if (href) {
            imgConvert.push(cfn(jElement, "href", href));
          }
        });
        $q.all(imgConvert).then(function() {
          defer.resolve(container);
        });
        return defer.promise;
      };

      var getEmptySnapshotDataUrl = function() {
        var defer = $q.defer();
        defer.resolve({
          dataUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
          width: 25,
          height: 25
        });
        return defer.promise;
      };

      var getElementSnapshotAsDataUrl = function(sessionId, visualizationId, elementObservers, node, path) {

        var defer = $q.defer();

        // Generate for each element a single canvas image
        var promises = [];
        angular.forEach(elementObservers, function(obj) {

          promises.push(function() {
            var d = $q.defer();
            getElementSnapshotAsSvg(sessionId, visualizationId, obj, node, path).then(function(svg) {
              d.resolve(getImageCanvasForSvg(svg));
            });
            return d.promise;
          }());

        });

        // Merge canvas images to one single image
        $q.all(promises)
          .then(function(canvasList) {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext("2d");
            canvas.width = 50;
            canvas.height = 50;
            var fwidth = 0;
            var fheight = 0;
            var yoffset = 0;
            angular.forEach(canvasList, function(c) {
              fwidth = fwidth < c.width ? c.width : fwidth;
              fheight = c.height + fheight + 15;
            });
            canvas.width = fwidth;
            canvas.height = fheight;
            angular.forEach(canvasList, function(c) {
              context.drawImage(c, 0, yoffset);
              yoffset = c.height + yoffset + 15;
            });
            return canvas;
          })
          .then(function(canvas) {
            defer.resolve({
              dataUrl: canvas.toDataURL('image/png'),
              width: canvas.width,
              height: canvas.height
            });
          });

        return defer.promise;

      };

      var getElementSnapshotAsSvg = function(sessionId, visualizationId, obj, node, path) {

        var defer = $q.defer();
        var results = node.data['results'];

        var observers = obj.observers;
        var clonedElement = obj.element.clone(true);
        var element = $('<svg xmlns="http://www.w3.org/2000/svg" style="background-color:white" xmlns:xlink="http://www.w3.org/1999/xlink" style="background-color:white" width="1000" height="1000">').html(clonedElement);

        // Prepare observers
        var promises = [];
        angular.forEach(observers, function(o) {
          try {
            var observerInstance = $injector.get(o.type, "");
          } catch (err) {
            // TODO: Return error
          }
          if (observerInstance) {
            if (typeof observerInstance.getFormulas === "function") {
              var result = observerInstance.getFormulas(o).map(function(f) {
                return f.translate ? results[f.formula]['trans'] : results[f.formula]['result'];
              });
              promises.push(observerInstance.apply(sessionId, visualizationId, o, element, {
                result: result
              }));
            } else {
              promises.push(observerInstance.apply(sessionId, visualizationId, o, element, {
                stateId: node.data.id
              }));
            }
          }
        });

        // Apply observers
        $q.all(promises).then(function(data) {

          // Collect attributes and values
          var fvalues = {};
          angular.forEach(data, function(value) {
            if (value !== undefined) {
              $.extend(true, fvalues, value);
            }
          });

          var attrs = {};

          // Apply values
          for (bmsid in fvalues) {
            if (attrs[bmsid] === undefined) {
              attrs[bmsid] = [];
            }
            var nattrs = fvalues[bmsid];
            for (var a in nattrs) {
              if (attrs[bmsid].indexOf(a) === -1) {
                var orgElement = element.find('[data-bms-id=' + bmsid + ']');
                var attrDefault = orgElement.attr(a);
                // Special case for class attributes
                if (a === "class" && attrDefault === undefined) {
                  attrDefault = ""
                }
                orgElement.attr("ng-attr-" + a, "{{getValue('" + bmsid + "','" + a + "','" + attrDefault + "')}}");
                attrs[bmsid].push(a);
              }
            }
          }

          var newScope = $rootScope.$new(true);
          newScope.values = fvalues;
          newScope.getValue = function(bmsid, attr, defaultValue) {
            var returnValue = defaultValue === 'undefined' ? undefined : defaultValue;
            var ele = fvalues[bmsid];
            if (ele) {
              returnValue = ele[attr] === undefined ? returnValue : ele[attr];
            }
            return returnValue;
          };

          // Start compiling ...
          var compiled = $compile(element)(newScope);

          // Wait for finishing compiling ...
          $timeout(function() {
            // Destroy scope
            newScope.$destroy();
            // Replace image paths with embedded images
            var ecompiled = $(compiled);
            convertSvgImagePaths(path, ecompiled).then(function(convertedElement) {
              var wrapper = $('<div>').html(convertedElement);
              defer.resolve(wrapper.html());
            });
          }, 0);

        });

        return defer.promise;

      };

      var getChildrenObservers = function(element) {
        var observers = [];
        var co = element.data('observers');
        if (co) observers = observers.concat(co);
        var eleChildren = element.children();
        if (eleChildren.length > 0) {
          eleChildren.each(function() {
            observers = observers.concat(getChildrenObservers($(this)));
          });
        }
        return observers;
      };

      var getDiagramData = function(visualizationId, selector, diagramType, diagramCond) {

        var defer = $q.defer();

        var vis = bmsVisualizationService.getVisualization(visualizationId);
        var container = vis.container.contents();
        var selectorCheckHasError = isValidSelector(container, selector);
        var sessionId = vis.id;

        if (selectorCheckHasError) {
          defer.reject(selectorCheckHasError);
        } else {

          // (1) Attach observers to elements
          var observers = bmsVisualizationService.getObservers(visualizationId);
          angular.forEach(observers, function(o) {

            try {
              var observerInstance = $injector.get(o.type, "");
            } catch (err) {
              // TODO: Do we need to return an error?
            } finally {
              var check = true;
              if (observerInstance && (typeof observerInstance.shouldBeChecked === "function")) {
                var check = observerInstance.shouldBeChecked(visualizationId, o);
              }
              if (check && o.data.selector) {
                var oe = container.find(o.data.selector);
                if (oe.length) { // If element(s) exist(s)
                  oe.each(function() {
                    var e = $(this);
                    if (!e.data('observers')) {
                      e.data('observers', []);
                    }
                    e.data('observers').push(o);
                  });
                }
              }
            }

          });

          // (2) Generate element observer map
          var elements = container.find(selector);
          var elementObservers = [];
          elements.each(function() {
            var e = $(this);
            var eo = {
              element: e,
              observers: getChildrenObservers(e)
            };
            elementObservers.push(eo);
          });

          // (3) Collect formulas of observers
          var formulas = [];
          angular.forEach(elementObservers, function(oe) {
            angular.forEach(oe.observers, function(o) {
              try {
                var observerInstance = $injector.get(o.type, "");
              } catch (err) {
                // TODO: Return some error
              }
              if (observerInstance && (typeof observerInstance.getFormulas === "function")) {
                observerInstance.getFormulas(o).forEach(function(f) {
                  var exists = false;
                  angular.forEach(formulas, function(ef) {
                    if (ef.formula === f.formula) exists = true;
                  });
                  if (!exists) {
                    formulas.push(f);
                  }
                });
              }
            });
          });

          // (3) Receive diagram data from ProB
          ws.emit(diagramType, {
            data: {
              id: sessionId,
              traceId: vis.traceId,
              formulas: formulas
            }
          }, function(data) {

            var errors = data['errors'];

            if (errors && errors.length > 0) {
              defer.reject(errors);
            } else {
              var promises = [];
              // Get HTML data
              angular.forEach(data.nodes, function(node) {
                if (diagramCond(node)) {
                  promises.push(getElementSnapshotAsDataUrl(sessionId, visualizationId, elementObservers, node, vis.templateFolder));
                } else {
                  promises.push(getEmptySnapshotDataUrl());
                }
              });
              $q.all(promises).then(function(screens) {
                angular.forEach(data.nodes, function(n, i) {
                  n.data.svg = screens[i].dataUrl;
                  n.data.height = screens[i].height + 30;
                  n.data.width = screens[i].width + 30;
                });
                defer.resolve(data);
              });
            }

          });

        }

        return defer.promise;

      };

      return {

        getTraceDiagramData: function(selector) {
          return getDiagramData(bmsVisualizationService.getCurrentVisualizationId(), selector, 'createTraceDiagram', function(node) {
            return node.data.id !== 'root' && node.data.id !== '0' && node.data.op !== '$setup_constants';
          });
        },
        getProjectionDiagramData: function(selector) {
          return getDiagramData(bmsVisualizationService.getCurrentVisualizationId(), selector, 'createProjectionDiagram', function(node) {
            return node.data.id !== '1' && node.data.labels[0] !== '<< undefined >>';
          });
        },
        getElementIds: function() {

          var elementIds = [];

          var visualizationId = bmsVisualizationService.getCurrentVisualizationId();
          var observers = bmsVisualizationService.getObservers(visualizationId);
          var vis = bmsVisualizationService.getVisualization(visualizationId);
          var container = vis.container;

          angular.forEach(observers, function(o) {

            try {
              var observerInstance = $injector.get(o.type, "");
            } catch (err) {
              // TODO: Return some error
            } finally {
              if (observerInstance && (typeof observerInstance.shouldBeChecked === "function")) {
                if (observerInstance.shouldBeChecked() && isValidSelector(container.contents(), o.data.selector) === undefined) {
                  elementIds.push({
                    selector: o.data.selector
                  });
                }
              }
            }

          });

          return elementIds;

        }


      };

    }])
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
    .directive('bmsDiagramElementProjectionView', ['bmsModalService', 'bmsRenderingService', 'bmsDiagramElementProjectionGraph', function(bmsModalService, bmsRenderingService, bmsDiagramElementProjectionGraph) {

      return {
        replace: false,
        scope: {},
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

          $scope.selectors = bmsRenderingService.getElementIds();

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

            bmsRenderingService.getProjectionDiagramData($scope.selector).then(function(graphData) {
              if (!$scope.cy) {
                bmsDiagramElementProjectionGraph.build($element, graphData).then(function(r) {
                  $scope.cy = r.cy;
                  $scope.navigator = r.navigator;
                  bmsModalService.endLoading();
                });
              } else {
                $scope.cy.load(graphData, function() {}, function() {});
                bmsModalService.endLoading();
              }
            }, function(error) {
              bmsModalService.openErrorDialog(error);
            });

          };

        }
      }

    }])
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
    .directive('bmsDiagramTraceView', ['bmsModalService', 'bmsRenderingService', 'bmsDiagramTraceGraph', function(bmsModalService, bmsRenderingService, bmsDiagramTraceGraph) {
      return {
        replace: false,
        scope: {},
        template: '<div class="input-group input-group-sm diagram-form">' +
          '<select class="form-control" ng-options="s as s.selector for s in selectors" ng-model="selected">' +
          '</select>' + '<span class="input-group-btn">' +
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

          $scope.selectors = bmsRenderingService.getElementIds();

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

            bmsModalService.loading("Creating trace diagram for selector " + $scope.selector);

            bmsRenderingService.getTraceDiagramData($scope.selector).then(function(graphData) {
              if (!$scope.cy) {
                bmsDiagramTraceGraph.build($element, graphData).then(function(r) {
                  $scope.cy = r.cy;
                  $scope.navigator = r.navigator;
                  bmsModalService.endLoading();
                });
              } else {
                $scope.cy.load(graphData, function() {}, function() {});
                bmsModalService.endLoading();
              }
            }, function(error) {
              bmsModalService.openErrorDialog(error);
            });

          };

        }
      }

    }]);

});

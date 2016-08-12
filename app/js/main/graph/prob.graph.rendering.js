/**
 * BMotionWeb for ProB Graph Service Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.visualization',
  'bms.observers'
], function(angular, $) {

  return angular.module('prob.graph.rendering', ['bms.visualization', 'bms.observers'])
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

      var getElementSnapshotAsDataUrl = function(elementObservers, node, path) {

        var defer = $q.defer();

        // Generate for each element a single canvas image
        var promises = [];
        angular.forEach(elementObservers, function(obj) {

          promises.push(function() {
            var d = $q.defer();
            getElementSnapshotAsSvg(obj, node, path).then(function(svg) {
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

      var getElementSnapshotAsSvg = function(obj, node, path) {

        var defer = $q.defer();
        var results = node.results;

        var observers = obj.observers;
        var clonedElement = obj.element.clone(true);
        var clonedContainer = $('<svg xmlns="http://www.w3.org/2000/svg" style="background-color:white" xmlns:xlink="http://www.w3.org/1999/xlink" style="background-color:white" width="1000" height="1000">').html(clonedElement);

        // Prepare observers
        var promises = [];
        angular.forEach(observers, function(o) {
          if (typeof o.getDiagramData === "function") {
            promises.push(o.apply(o.getDiagramData(node), clonedContainer));
          }
        });

        // Apply observers
        $q.all(promises)
          .then(function(vals) {

            var values = {};
            angular.forEach(vals, function(value) {
              if (value) {
                angular.merge(values, value);
              }
            });

            var attrs = {};

            // Apply values
            for (bmsid in values) {
              if (attrs[bmsid] === undefined) {
                attrs[bmsid] = [];
              }
              var nattrs = values[bmsid];
              for (var a in nattrs) {
                if (attrs[bmsid].indexOf(a) === -1) {
                  var orgElement = clonedContainer.find('[data-bms-id=' + bmsid + ']');
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
            newScope.values = values;
            newScope.getValue = function(bmsid, attr, defaultValue) {
              var returnValue = defaultValue === 'undefined' ? undefined : defaultValue;
              var ele = values[bmsid];
              if (ele) {
                returnValue = ele[attr] === undefined ? returnValue : ele[attr];
              }
              return returnValue;
            };

            // Start compiling ...
            var compiled = $compile(clonedContainer)(newScope);

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

      var getDiagramData = function(view, selector, diagramType, diagramCond) {

        var defer = $q.defer();

        var container = view.container.contents();
        var selectorCheckHasError = isValidSelector(container, selector);
        var sessionId = view.session.id;

        if (selectorCheckHasError) {
          defer.reject(selectorCheckHasError);
        } else {

          // (1) Attach observers to elements
          var observers = view.getObservers();
          angular.forEach(observers, function(o) {

            if ((typeof o.shouldBeChecked === 'function') && o.shouldBeChecked() && o.options.selector) {
              var oe = container.find(o.options.selector);
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
          var formulas = {};
          angular.forEach(elementObservers, function(oe) {

            angular.forEach(oe.observers, function(o) {

              if (typeof o.getFormulas === "function") {

                var fformulas = [];

                o.getFormulas().forEach(function(f) {

                  var exists = false;
                  angular.forEach(formulas, function(ef) {
                    if (ef.formula === f.formula) exists = true;
                  });
                  if (!exists) {
                    fformulas.push(f);
                  };

                  formulas[o.getId()] = {
                    formulas: fformulas
                  };

                });

              }

            });

          });

          // (3) Receive diagram data from ProB
          ws.emit(diagramType, {
              sessionId: view.session.id,
              formulas: formulas
            })
            .then(
              function success(data) {

                var nodes = data[0];
                var edges = data[1];

                if(diagramType === 'createProjectionDiagram') {
                  edges = edges.filter(function(val) {
                    return val.data.source !== val.data.target;
                  });
                }

                var promises = [];
                // Get HTML data
                angular.forEach(nodes, function(node) {
                  if (diagramCond(node)) {
                    promises.push(getElementSnapshotAsDataUrl(elementObservers, node, view.session.templateFolder));
                  } else {
                    promises.push(getEmptySnapshotDataUrl());
                  }
                });
                $q.all(promises).then(function(screens) {
                  angular.forEach(nodes, function(n, i) {
                    n.data.svg = screens[i].dataUrl;
                    n.data.height = screens[i].height + 30;
                    n.data.width = screens[i].width + 30;
                  });
                  defer.resolve({
                    nodes: nodes,
                    edges: edges
                  });
                });

              },
              function error(err) {
                defer.reject(err);
              });

        }

        return defer.promise;

      };

      return {

        getDiagramData: function(view, selector, diagramType, diagramCond) {
          return getDiagramData(view, selector, diagramType, diagramCond);
        },
        getElementIds: function(view) {

          var elementIds = [];

          var observers = view.getObservers();
          var container = view.container;

          angular.forEach(observers, function(o) {
            if ((typeof o.shouldBeChecked === 'function') && o.shouldBeChecked() && isValidSelector(container.contents(), o.options.selector) === undefined) {
              elementIds.push({
                selector: o.options.selector
              });
            }
          });

          return elementIds;

        }


      };

    }]);

});

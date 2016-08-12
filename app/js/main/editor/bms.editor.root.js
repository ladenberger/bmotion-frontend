/**
 * BMotionWeb Editor Inline Module
 *
 */
define([
  'angular',
  'angularAMD',
  'code-mirror!javascript',
  'jquery.jgraduate',
  'jpicker',
  'jquery.draginput',
  'mousewheel',
  'taphold',
  'requestanimationframe',
  'method-draw',
  'angular-ui-codemirror',
  'angular-xeditable',
  'ui-bootstrap',
  'ui-bootstrap-tpls',
  'angular-sanitize'
], function(angular, angularAMD, CodeMirror) {

  var module = angular.module('bmotion.editor.root', ['ui.codemirror', 'xeditable', 'ui.bootstrap', 'ngSanitize'])
    .run(function(editableOptions, editableThemes) {
      window.CodeMirror = CodeMirror;
      editableOptions.theme = 'default';
      editableThemes['default'].submitTpl = '<button type="submit"><i class="fa fa-floppy-o"></i></button>';
      editableThemes['default'].cancelTpl = '<button type="button" ng-click="$form.$cancel()"><i class="fa fa-ban"></i></button>';
    })
    .filter('cut', function() {
      return function(value, wordwise, max, tail) {
        if (!value) return '';
        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;
        value = value.substr(0, max);
        if (wordwise) {
          var lastspace = value.lastIndexOf(' ');
          if (lastspace != -1) {
            value = value.substr(0, lastspace);
          }
        }
        return value + (tail || '...');
      };
    })
    .factory('$parentScope', ['$window', function($window) {
      return $window.parent.angular.element($window.frameElement).scope();
    }])
    .factory('bmsEditorCommonService', ['$q', 'bmsParentService', function($q, bmsParentService) {

      var isInitialised = $q.defer();
      var view, session, observers, events, uiState;

      // Get json observers and events
      isInitialised.promise.then(function() {

        observers = view.jsonObservers;
        events = view.jsonEvents;
        uiState = {};

        if (observers) {
          uiState.observers = observers.map(function() {
            return {
              isMenu: false,
              isCollapsed: true
            };
          });
        }

        if (events) {
          uiState.events = events.map(function() {
            return {
              isMenu: false,
              isCollapsed: true
            }
          });
        }

      });

      var service = {
        setView: function(_view_) {
          view = _view_;
        },
        getView: function() {
          return view;
        },
        setSession: function(_session_) {
          session = _session_;
        },
        getSession: function() {
          return session;
        },
        getObservers: function() {
          return observers;
        },
        getUiState: function(type) {
          return uiState[type];
        },
        getEvents: function() {
          return events;
        },
        addObserver: function(type, data) {
          bmsParentService.addObserver(type, data);
          return uiState['observers'].push({
            isMenu: false,
            isCollapsed: true
          }) - 1;
        },
        removeObserver: function(index) {
          observers.splice(index, 1);
          uiState['observers'].splice(index, 1);
        },
        duplicateObserver: function(index) {
          var newObject = $.extend(true, {}, observers[index]);
          observers.push(newObject);
          uiState['observers'].push({
            isMenu: false,
            isCollapsed: true
          });
        },
        addEvent: function(type, data) {
          bmsParentService.addEvent(type, data);
          return uiState['events'].push({
            isMenu: false,
            isCollapsed: true
          }) - 1;
        },
        removeEvent: function(index) {
          events.splice(index, 1);
          uiState['events'].splice(index, 1)
        },
        duplicateEvent: function(index) {
          var newObject = $.extend(true, {}, events[index]);
          events.push(newObject);
          uiState['events'].push({
            isMenu: false,
            isCollapsed: true
          });
        },
        toggleCollapse: function(type, index) {
          uiState[type][index]['isCollapsed'] = !uiState[type][index]['isCollapsed'];
        },
        showMenu: function(type, index) {
          uiState[type][index]['isMenu'] = true;
        },
        hideMenu: function(type, index) {
          uiState[type][index]['isMenu'] = false;
        },
        isInitialised: isInitialised
      };

      return service;

    }])
    .factory('bmsParentService', ['$parentScope', function($parentScope) {
      return {
        init: function() {
          return $parentScope.init();
        },
        save: function(svg) {
          $parentScope.save(svg);
        },
        saveObservers: function() {
          $parentScope.saveObservers();
        },
        saveEvents: function() {
          $parentScope.saveEvents();
        },
        addObserver: function(type, data) {
          $parentScope.addObserver(type, data);
        },
        addEvent: function(type, data) {
          $parentScope.addEvent(type, data);
        },
        disableEditor: function(reason) {
          $parentScope.disableEditor(reason);
        },
        openDialog: function(msg, cb) {
          $parentScope.openDialog(msg, cb);
        },
        bmsModalService: $parentScope.bmsModalService
      };
    }])
    .factory('bmsJsEditorService', ['$uibModal', '$timeout', function($uibModal, $timeout) {

      return {

        openJsEditor: function(fn, el, doc) {

          var code = el[fn];

          if ($.isFunction(code)) {
            var entire = code.toString(); // this part may fail!
            code = entire.substring(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
          }

          var modalInstance = $uibModal.open({
            templateUrl: 'editor/templates/bms-js-editor.html',
            controller: function($scope, $modalInstance, code, doc) {

              $scope.code = code;

              $scope.doc = doc;

              $scope.isCollapsed = true;

              $modalInstance.setRefresh = function(b) {
                $scope.refresh = b;
              };

              $scope.close = function() {
                $modalInstance.close();
              };

              $scope.ok = function() {
                $modalInstance.close($scope.code);
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };

              $scope.codemirrorLoaded = function(_editor) {
                $timeout(function() {
                  _editor.refresh();
                });
              };

              $scope.editorOptions = {
                lineWrapping: true,
                mode: 'javascript',
                onLoad: $scope.codemirrorLoaded
              };

            },
            resolve: {
              code: function() {
                return code;
              },
              doc: function() {
                return doc;
              }
            },
            backdrop: false
          });
          modalInstance.result.then(function(code) {
            el[fn] = code;
            //$scope.$emit('highlightObserver', false);
          }, function() {
            //$scope.$emit('highlightObserver', false);
          });
        }

      };

    }])
    .directive('ngConfirmClick', [function() {
      return {
        link: function(scope, element, attr) {
          var msg = attr.ngConfirmClick || "Are you sure?";
          var clickAction = attr.confirmedClick;
          element.bind('click', function(event) {
            if (window.confirm(msg)) {
              scope.$eval(clickAction)
            }
          });
        }
      };
    }])
    .controller('bmsObserverRefinementCtrl', ['$scope', 'bmsJsEditorService',
      function($scope, bmsJsEditorService) {

        $scope.isMenu = false;

      }

    ])
    .controller('bmsObserverFormulaCtrl', ['$scope',
      function($scope) {

        $scope.isMenu = false;

        $scope.showMenu = function() {
          $scope.isMenu = true;
        };

        $scope.hideMenu = function() {
          $scope.isMenu = false;
        };

        $scope.addFormula = function() {
          $scope.observer.data.formulas.push("");
        };

        $scope.removeFormula = function(index) {
          $scope.observer.data.formulas.splice(index, 1);
        };

      }

    ])
    .controller('bmsExecuteEventCtrl', ['$scope', 'bmsEditorCommonService',
      function($scope, bmsEditorCommonService) {

        $scope.isMenu = false;

        $scope.showMenu = function() {
          $scope.isMenu = true;
        };

        $scope.hideMenu = function() {
          $scope.isMenu = false;
        };

        $scope.addEvent = function() {
          $scope.event.data.events.push({
            name: "",
            predicate: ""
          });
        };

        $scope.removeEvent = function(index) {
          $scope.event.data.events.splice(index, 1);
        };

      }
    ])
    .controller('bmsObserverCspEventCtrl', ['$scope', function($scope) {

      $scope.isObserverMenu = false;
      $scope.actionMenu = {};

      $scope.showObserverMenu = function() {
        $scope.isObserverMenu = true;
      };

      $scope.hideObserverMenu = function() {
        $scope.isObserverMenu = false;
      };

      $scope.isActionMenu = function(index) {
        return $scope.actionMenu[index] ? $scope.actionMenu[index] : false;
      };

      $scope.showActionMenu = function(index) {
        $scope.actionMenu[index] = true;
      };

      $scope.hideActionMenu = function(index) {
        $scope.actionMenu[index] = false;
      };

      $scope.addTransformer = function() {
        $scope.observer.data.observers.push({
          exp: "",
          actions: []
        });
      };

      $scope.addAction = function(o) {
        o['actions'].push({
          selector: "",
          attr: "",
          value: ""
        });
      };

      $scope.removeTransformer = function(index) {
        $scope.observer.data.observers.splice(index, 1);
      };

      $scope.removeAction = function(o, index) {
        o['actions'].splice(index, 1);
      };

    }])
    .controller('bmsObserverViewCtrl', ['$scope', 'bmsEditorCommonService', 'bmsParentService', '$rootScope',
      function($scope, bmsEditorCommonService, bmsParentService, $rootScope) {

        // Get json observers
        bmsEditorCommonService.isInitialised.promise.then(function() {
          $scope.data = bmsEditorCommonService.getObservers();
          $scope.uiState = bmsEditorCommonService.getUiState('observers');
        });

        $scope.getIncludeFile = function(type) {
          return 'editor/templates/bms-' + type + '-observer.html';
        };

        $scope.removeObserver = function(index) {
          bmsParentService.openDialog("Do you really want to delete this observer?", function(response) {
            if (response === 0) {
              $rootScope.$apply(function() {
                bmsEditorCommonService.removeObserver(index);
              });
            }
          });
        };

        $scope.duplicateObserver = function(index) {
          bmsEditorCommonService.duplicateObserver(index);
        };

        $scope.toggleCollapse = function(index) {
          bmsEditorCommonService.toggleCollapse('observers', index);
        };

        $scope.showMenu = function(index) {
          bmsEditorCommonService.showMenu('observers', index);
        };

        $scope.hideMenu = function(index) {
          bmsEditorCommonService.hideMenu('observers', index);
        };

        $scope.isCollapsed = function(index) {
          return $scope.uiState[index]['isCollapsed'];
        };

        $scope.isMenu = function(index) {
          return $scope.uiState[index]['isMenu'];
        };

        $scope.switchToJs = function(fn, el) {
          var newValue = el[fn + "Js"] ? !el[fn + "Js"] : true;
          el[fn + "Js"] = newValue;
        };

      }
    ])
    .controller('bmsEventsViewCtrl', ['$scope', 'bmsEditorCommonService', 'bmsParentService', '$rootScope',
      function($scope, bmsEditorCommonService, bmsParentService, $rootScope) {

        $scope.events = [];

        bmsEditorCommonService.isInitialised.promise.then(function() {
          $scope.data = bmsEditorCommonService.getEvents();
          $scope.uiState = bmsEditorCommonService.getUiState('events');
          var session = bmsEditorCommonService.getSession();
          if (session.toolData.model) {
            angular.forEach(session.toolData.model.transitions, function(ev) {
              $scope.events.push({
                value: ev.name,
                text: ev.name
              });
            });
          }
        });

        $scope.dynamicPopover = {
          templateUrl: 'eventsMenuTemplate.html'
        };

        $scope.getIncludeFile = function(type) {
          return 'editor/templates/bms-' + type + '-event.html';
        };

        $scope.removeEvent = function(index) {
          bmsParentService.openDialog("Do you really want to delete this event?", function(response) {
            if (response === 0) {
              $rootScope.$apply(function() {
                bmsEditorCommonService.removeEvent(index);
              });
            }
          });
        };

        $scope.duplicateEvent = function(index) {
          bmsEditorCommonService.duplicateEvent(index);
        };

        $scope.toggleCollapse = function(index) {
          bmsEditorCommonService.toggleCollapse('events', index);
        };

        $scope.showMenu = function(index) {
          bmsEditorCommonService.showMenu('events', index);
        };

        $scope.hideMenu = function(index) {
          bmsEditorCommonService.hideMenu('events', index);
        };

        $scope.isCollapsed = function(index) {
          return $scope.uiState[index]['isCollapsed'];
        };

        $scope.isMenu = function(index) {
          return $scope.uiState[index]['isMenu'];
        };

        $scope.switchToJs = function(fn, el) {
          var newValue = el[fn + "Js"] ? !el[fn + "Js"] : true;
          el[fn + "Js"] = newValue;
        };

      }
    ])
    .controller('bmsEditorCtrl', ['$scope', 'bmsParentService', 'bmsJsEditorService', 'bmsEditorCommonService', 'bmsEditorTabsService', '$http', '$parentScope',
      function($scope, bmsParentService, bmsJsEditorService, bmsEditorCommonService, bmsEditorTabsService, $http, $parentScope) {

        var self = this;

        var addObserver = function(type, data) {
          var selectedElements = methodDraw.getSvgCanvas().getSelectedElems();
          if (selectedElements) {
            var selectors = selectedElements.map(function(element) {
              return "#" + $(element).attr("id");
            });
            data.selector = selectors.join(",");
            var index = bmsEditorCommonService.addObserver(type, data);
            bmsEditorTabsService.activateTab('observers');
            bmsEditorCommonService.toggleCollapse('observers', index);
          }
        };

        var addEvent = function(type, data) {
          var selectedElements = methodDraw.getSvgCanvas().getSelectedElems();
          if (selectedElements) {
            var selectors = selectedElements.map(function(element) {
              return "#" + $(element).attr("id");
            });
            data.selector = selectors.join(",");
            var index = bmsEditorCommonService.addEvent(type, data);
            bmsEditorTabsService.activateTab('events');
            bmsEditorCommonService.toggleCollapse('events', index);
          }
        };

        bmsParentService.init().then(function(obj) {

          self.view = obj.view;
          self.session = obj.session;
          self.svgFile = obj.svgFile;
          self.svgRootId = $(obj.svgContent).attr('id');

          bmsEditorCommonService.setView(self.view);
          bmsEditorCommonService.setSession(self.session);

          methodDraw.setView(self.view);
          methodDraw.setSession(self.session);
          methodDraw.setSvgRootId(self.svgRootId);
          if (obj.svgContent) methodDraw.loadFromString(obj.svgContent);
          bmsEditorCommonService.isInitialised.resolve();

          self.dynamicPopover = {
            templateUrl: 'observerMenuTemplate.html'
          };

          self.addObserverItems = [{
            label: "Add Formula Observer",
            show: self.session.isBVisualization(),
            click: function() {
              addObserver("formula", {
                formulas: []
              });
            }
          }, {
            label: "Add Predicate Observer",
            show: self.session.isBVisualization(),
            click: function() {
              addObserver("predicate", {
                predicate: ""
              });
            }
          }, {
            label: "Add Refinement Observer",
            show: self.session.isEventBVisualization(),
            click: function() {
              addObserver("refinement", {
                refinement: ""
              });
            }
          }, {
            label: "Add CSP Observer",
            show: self.session.isCSPVisualization(),
            click: function() {
              addObserver("cspEvent", {
                observers: []
              });
            }
          }];

          self.addEventItems = [{
            label: "Add Execute Event Handler",
            show: self.session.isBVisualization(),
            click: function() {
              addEvent("executeEvent", {
                events: []
              });
            }
          }];

        }, function(error) {
          bmsParentService.bmsModalService.openErrorDialog("An error occurred while initialising editor: " + error);
          bmsParentService.disableEditor("An error occurred while initialising editor: " + error);
        });

        /*self.getModel = function() {
          console.log(self.visualization.model);
            return self.visualization.model;
        };*/

        self.save = function() {
          // remove the selected outline before serializing
          svgCanvas.clearSelection();
          var svgContent = svgCanvas.getSvgString();
          // Save svg
          bmsParentService.save(svgContent);
        };

        $parentScope.$on('saveVisualization', function(evt, svg) {
          if (self.svg === svg) self.save();
        });

        // TODO: We should save these docs in external files
        var docs = {
          "enable": {
            description: 'The enable function will be called after initialising the machine ' +
              '(if the given refinement enabled in the running animation) with its ' +
              '<i>origin</i> reference set to the graphical element that the observer is attached to. ' +
              'The <i>origin</i> is a jQuery selector element. ' +
              'Consult the <a href="http://api.jquery.com/" target="_blank">jQuery API</a> for more ' +
              'information regarding accessing or manipulating the <i>origin</i> ' +
              '(e.g. <a href="http://api.jquery.com/category/attributes/" target="_blank">set and get attributes</a>).',
            parameter: [{
              name: 'origin',
              description: 'The reference set to the graphical element that the observer is attached to.'
            }, {
              name: 'container',
              description: 'The reference to the container element.'
            }]
          },
          "disable": {
            description: 'The disable function will be called after initialising the machine ' +
              '(if the given refinement is disabled in the running animation) with its ' +
              '<i>origin</i> reference set to the graphical element that the observer is attached to. ' +
              'The <i>origin</i> is a jQuery selector element. ' +
              'Consult the <a href="http://api.jquery.com/" target="_blank">jQuery API</a> for more ' +
              'information regarding accessing or manipulating the <i>origin</i> ' +
              '(e.g. <a href="http://api.jquery.com/category/attributes/" target="_blank">set and get attributes</a>).',
            parameter: [{
              name: 'origin',
              description: 'The reference set to the graphical element that the observer is attached to.'
            }, {
              name: 'container',
              description: 'The reference to the container element.'
            }]
          },
          "label": {
            description: 'The label function returns a custom label to be shown in the ' +
              'tooltip when hovering the graphical element that the execute event handler ' +
              'is attached to. You can also return an HTML element.',
            parameter: [{
              name: 'event',
              description: 'An object containing the information of the respective event. ' +
                'Use <i>event.name</i> to obtain the name of the event and <i>event.predicate</i> ' +
                'to obtain the predicate of the event respectively.'
            }, {
              name: 'origin',
              description: 'The reference set to the graphical element that the execute ' +
                'event handler is attached to. The <i>origin</i> is a jQuery selector element. ' +
                'Consult the <a href="http://api.jquery.com/" target="_blank">jQuery API</a> for more ' +
                'information about accessing or manipulating the <i>origin</i>.'
            }, {
              name: 'container',
              description: 'The reference to the container element.'
            }]
          },
          "trigger": {
            description: 'The trigger function will be called after every state change with its ' +
              '<i>origin</i> reference set to the graphical element that the observer is attached to ' +
              'and the <i>values</i> of the formulas. The <i>origin</i> is a jQuery selector element. ' +
              'Consult the <a href="http://api.jquery.com/" target="_blank">jQuery API</a> for more ' +
              'information regarding accessing or manipulating the <i>origin</i> ' +
              '(e.g. <a href="http://api.jquery.com/category/attributes/" target="_blank">set and get attributes</a>).' +
              'The <i>values</i> parameter contains the values of ' +
              'the defined formulas in an array, e.g. use <i>values[0]</i> to obtain the result of ' +
              'the first formula.',
            parameter: [{
              name: 'origin',
              description: 'The reference set to the graphical element that the observer is attached to.'
            }, {
              name: 'values',
              description: 'Contains the values of the defined formulas in an array, e.g. use <i>values[0]</i> to obtain the result of the first formula.'
            }]
          },
          "default": {
            description: '',
            parameter: [{
              name: 'origin',
              description: 'The reference set to the graphical element that the observer is attached to.'
            }, {
              name: 'container',
              description: 'The reference to the container element.'
            }]
          }
        };

        $scope.openJsEditor = function(fn, el) {
          var doc = docs[fn] ? docs[fn] : docs["default"];
          bmsJsEditorService.openJsEditor(fn, el, doc);
        };

      }
    ])
    .controller('bmsEditorTabsCtrl', ['$scope', 'bmsEditorTabsService',
      function($scope, bmsEditorTabsService) {

        var self = this;

        self.active = bmsEditorTabsService.getActiveTab();

        self.toggleTab = function(type) {
          bmsEditorTabsService.activateTab(type);
          self.active = type;
        };

        $scope.$watch(function() {
          return bmsEditorTabsService.getActiveTab()
        }, function(newValue) {
          self.active = newValue;
        });

      }
    ])
    .factory('bmsEditorTabsService', function() {

      var activeTab = 'properties';

      return {
        getActiveTab: function() {
          return activeTab;
        },
        activateTab: function(type) {
          activeTab = type;
        },
        activatePropertiesTab: function() {
          activeTab = 'properties';
        },
        activateObserversTab: function() {
          activeTab = 'observers';
        },
        activateEventsTab: function() {
          activeTab = 'events';
        }
      };

    });


  return angularAMD.bootstrap(module);

});

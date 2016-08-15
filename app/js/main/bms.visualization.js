/**
 * BMotionWeb Visualization Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.session',
  'bms.ws',
  'bms.observers',
  'bms.handlers'
], function(angular, $, bms) {

  return angular.module('bms.visualization', ['bms.observers', 'bms.handlers', 'bms.session', 'bms.ws'])
    .factory('bmsVisualization', ['$q', 'ws', '$injector', '$compile', 'bmsWsService',
      function($q, ws, $injector, $compile, bmsWsService) {

        var bmsVisualization = function(id, session) {
          this.id = id;
          this.session = session;
          this.observers = [];
          this.events = [];
          this.jsonObservers = [];
          this.jsonEvents = [];
          this.svg = {};
          this.listener = {};
          this.bmsids = {};
          this.initialized = $q.defer();
          this.attributeValues = {};
          this.toolOptions = {};
          this.viewData = {};
          this.stateId = 0;
        };

        bmsVisualization.prototype.addObserver = function(type, data) {

          var defer = $q.defer();

          var self = this;

          try {
            var service = $injector.get(type + "Observer", "");
            var defaultOptions = service.getDefaultOptions(data);
            var observerInstance = {
              id: bms.uuid(),
              type: type,
              options: defaultOptions
            };
            this.observers.push(observerInstance);
            defer.resolve(observerInstance);
          } catch (err) {
            defer.reject("An error occurred while adding observer '" + type + "': " + err);
          }

          return defer.promise;

        };

        bmsVisualization.prototype.addEvent = function(type, data) {

          var defer = $q.defer();

          var self = this;

          try {
            var service = $injector.get(type + "Event", "");
            var defaultOptions = service.getDefaultOptions(data);
            var eventInstance = {
              id: bms.uuid(),
              type: type,
              options: defaultOptions
            };
            this.events.push(eventInstance);
            defer.resolve(eventInstance);
          } catch (err) {
            defer.reject("An error occurred while adding event '" + type + "': " + err);
          }

          return defer.promise;

        };

        bmsVisualization.prototype.getObservers = function() {
          return this.observers;
        };

        bmsVisualization.prototype.clearObservers = function() {
          this.observers = [];
        };

        bmsVisualization.prototype.clearEvents = function() {
          this.events = [];
        };

        bmsVisualization.prototype.getEvents = function() {
          return this.events;
        };

        bmsVisualization.prototype.addSvg = function(svg) {
          if (!this.svg[svg]) this.svg[svg] = {};
          return this.svg[svg];
        };

        bmsVisualization.prototype.getSvg = function(svg) {
          return this.svg[svg];
        };

        bmsVisualization.prototype.hasSvg = function() {
          return !bms.isEmpty(this.svg);
        };

        bmsVisualization.prototype.addListener = function(what, callback) {
          if (!this.listener[what]) this.listener[what] = [];
          var obj = {
            callback: callback,
            executed: false
          };
          this.listener[what].push(obj);
          return obj;
        };

        bmsVisualization.prototype.clearListeners = function() {
          this.listener = {};
        };

        bmsVisualization.prototype.getListeners = function(what) {
          return this.listener[what];
        };

        bmsVisualization.prototype.getBmsIdForElement = function(element) {
          var bmsid = element.attr("data-bms-id");
          if (!bmsid) {
            bmsid = bms.uuid();
            element.attr("data-bms-id", bmsid);
          }
          return bmsid;
        };

        bmsVisualization.prototype.getBmsIds = function(selector, _container_) {
          var self = this;
          if (self.bmsids[selector] === undefined) {
            var container = _container_ ? _container_ : self.container;
            var bmsids = [];
            container.find(selector).each(function(i, e) {
              var ele = $(e);
              var cbmsid = ele.attr("data-bms-id");
              if (!cbmsid) {
                cbmsid = bms.uuid();
                ele.attr("data-bms-id", cbmsid);
              }
              bmsids.push(cbmsid);
            });
            self.bmsids[selector] = bmsids;
          }
          return self.bmsids[selector];
        };

        bmsVisualization.prototype.clearBmsIdCache = function() {
          this.bmsids['bmsids'] = {};
        };

        bmsVisualization.prototype.collectFormulas = function(observers) {

          var self = this;

          observers = observers ? observers : self.getObservers();

          var formulas = {};

          angular.forEach(observers, function(observer) {

            var service = $injector.get(observer.type + "Observer", "");
            // Only handle observers which implement the getFormulas function
            if (typeof service.getFormulas === 'function' && service.shouldBeChecked(observer, self)) {

              var element = self.determineElement(observer);

              if (element instanceof $) {
                element.each(function() {
                  var ele = $(this);
                  self.addFormulas(formulas, service.getFormulas(observer, self, ele), observer.id);
                });
              } else {
                self.addFormulas(formulas, service.getFormulas(observer, self), observer.id);
              }

            }

          });

          return formulas;

        };

        bmsVisualization.prototype.evaluateFormulas = function(observers) {
          return bmsWsService.evaluateFormulas(this.session.id, this.collectFormulas(observers));
        };

        bmsVisualization.prototype.checkObserver = function(observer) {
          return this.checkObservers([observer]);
        };

        bmsVisualization.prototype.checkObservers = function(observers) {

          var defer = $q.defer();

          var self = this;

          var promises = [];
          for (var s in self.svg) {
            promises.push(self.svg[s]['defer'].promise);
          }
          $q.all(promises).then(function() {

            observers = observers ? observers : self.getObservers();

            self.evaluateFormulas(observers)
              .then(function(results) {

                var checks = [];
                angular.forEach(observers, function(observer) {

                  var service = $injector.get(observer.type + "Observer", "");
                  var check = true;
                  if (typeof service.shouldBeChecked === 'function') {
                    check = service.shouldBeChecked(observer, self);
                  }
                  if (check) {

                    var element = self.determineElement(observer);
                    if (element instanceof $) {
                      element.each(function() {
                        var ele = $(this);
                        if (typeof service.getFormulas === 'function') {
                          checks.push(service.check(observer, self, ele, results[observer.id]));
                        } else {
                          checks.push(service.check(observer, self, ele));
                        }
                      });
                    } else {
                      if (typeof service.getFormulas === 'function') {
                        checks.push(service.check(observer, self, undefined, results[observer.id]));
                      } else {
                        checks.push(service.check(observer, self));
                      }
                    }

                  }

                });

                $q.all(checks)
                  .then(function(vals) {
                      var values = {};
                      angular.forEach(vals, function(value) {
                        if (value) {
                          angular.merge(values, value);
                        }
                      });
                      if (!bms.isEmpty(values)) {
                        self.setValues(values);
                      }
                      defer.resolve();
                    },
                    function(err) {
                      defer.reject(err);
                    });

              }, function(err) {
                defer.reject(err);
              });

          });

          return defer.promise;

        };

        bmsVisualization.prototype.setupEvent = function(event) {
          return this.setupEvents([event]);
        };

        bmsVisualization.prototype.setupEvents = function(events) {

          var defer = $q.defer();

          var self = this;

          var promises = [];
          for (var s in self.svg) {
            promises.push(self.svg[s]['defer'].promise);
          }
          $q.all(promises)
            .then(function() {

              events = events ? events : self.getEvents();

              var setups = [];
              angular.forEach(events, function(evt) {

                var service = $injector.get(evt.type + "Event", "");
                var check = true;
                if (typeof service.shouldBeChecked === 'function') {
                  check = service.shouldBeChecked(evt, self);
                }
                if (check) {

                  var element = self.determineElement(evt);
                  if (element instanceof $) {
                    element.each(function() {
                      var ele = $(this);
                      setups.push(service.setup(evt, self, ele));
                    });
                  } else {
                    defer.reject("Please specify a selector or an element for the interactive handler.")
                  }

                }

              });

              $q.all(setups)
                .then(function() {
                  defer.resolve();
                }, function(err) {
                  defer.reject(err);
                });

            });

          return defer.promise;

        };

        bmsVisualization.prototype.loadTemplate = function(template, $scope) {
          var defer = $q.defer();
          var self = this;
          var path = self.session.templateFolder.length > 0 ? self.session.templateFolder + '/' + template : template;
          self.iframe.attr('src', path);
          self.iframe.load(function() {
            self.container = self.iframe.contents();
            $compile(self.container)($scope);
            defer.resolve();
          });
          return defer.promise;
        };

        bmsVisualization.prototype.triggerListeners = function(cause) {
          var self = this;
          angular.forEach(this.listener[cause], function(l) {
            if (!l.executed) {
              // Init listener should be called only once
              if (cause === "ModelInitialised") {
                l.executed = true;
                self.isInitialized().then(function() {
                  l.callback();
                });
              } else {
                l.callback();
              }
            }
          });
        };

        bmsVisualization.prototype.removeDuplicates = function(arr, prop) {

          var new_arr = [];
          var lookup = {};

          for (var i in arr) {
            lookup[arr[i][prop]] = arr[i];
          }

          for (i in lookup) {
            new_arr.push(lookup[i]);
          }

          return new_arr;

        };


        bmsVisualization.prototype.addFormulas = function(finalFormulas, observerFormulas, observerId) {

          if (finalFormulas[observerId] === undefined) {
            finalFormulas[observerId] = {
              formulas: []
            };
          }

          // Concat formulas
          finalFormulas[observerId]['formulas'] = finalFormulas[observerId]['formulas'].concat(observerFormulas);
          // Remove duplicate formulas
          finalFormulas[observerId]['formulas'] = this.removeDuplicates(finalFormulas[observerId]['formulas'], "formula");

        };

        bmsVisualization.prototype.determineElement = function(observer) {
          var self = this;
          var ele;
          if (observer.options.selector !== undefined && observer.options.selector.length > 0) {
            ele = self.container.find(observer.options.selector);
          }
          if (observer.options.element !== undefined && observer.options.element.length > 0) {
            ele = observer.options.element;
          }
          if (ele instanceof $) {
            return ele;
          } else {
            return undefined;
          }
        };

        bmsVisualization.prototype.setValues = function(values) {
          angular.merge(this.attributeValues, values);
        };

        bmsVisualization.prototype.getValues = function() {
          return this.attributeValues;
        };

        bmsVisualization.prototype.clearValues = function() {
          this.attributeValues = {};
        };

        bmsVisualization.prototype.isInitialized = function() {
          return this.initialized.promise;
        };

        return bmsVisualization;

      }
    ])
    .factory('bmsVisualizationService',
      function() {

        var disabledTabs = {};

        var visualizationService = {

          getDisabledTabs: function() {
            return disabledTabs;
          },
          disableTab: function(id, reason) {
            if (disabledTabs[id] === undefined) disabledTabs[id] = {};
            disabledTabs[id]['status'] = true;
            disabledTabs[id]['reason'] = reason;
          }

        };

        return visualizationService;

      });

});

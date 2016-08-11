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
            // Create an add new observer instance
            var instance = $injector.get(type + "Observer", "");
            var observerInstance = new instance(self, data);
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
            var instance = $injector.get(type + "Event", "");
            var eventInstance = new instance(self, data);
            self.events.push(eventInstance);
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
            var container = _container_ ? _container_ : self.container.contents();
            var bmsids = container.find(selector).map(function() {
              var cbmsid = $(this).attr("data-bms-id");
              if (!cbmsid) {
                cbmsid = bms.uuid();
                $(this).attr("data-bms-id", cbmsid);
              }
              return cbmsid;
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
          angular.forEach(self.getObservers(), function(observer) {
            // Only handle observers which implement the getFormulas function
            if (typeof observer.getFormulas === 'function' && typeof observer.getId === 'function' && observer.shouldBeChecked()) {
              formulas[observer.getId()] = {
                formulas: observer.getFormulas()
              };
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
                var checks = observers.map(function(observer) {
                  var check = true;
                  if (typeof observer.shouldBeChecked === 'function') {
                    check = observer.shouldBeChecked();
                  }
                  if (check) {
                    if (typeof observer.getId === 'function') {
                      return observer.check(results[observer.getId()]);
                    } else {
                      return observer.check();
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

              var setups = events.map(function(evt) {
                if (evt.shouldBeChecked()) {
                  return evt.setup(self);
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
          self.container.attr('src', path);
          self.container.load(function() {
            $compile(self.container.contents())($scope);
            defer.resolve();
          });
          return defer.promise;
        };

        bmsVisualization.prototype.triggerListeners = function(cause) {
          var self = this;
          console.log(cause)
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

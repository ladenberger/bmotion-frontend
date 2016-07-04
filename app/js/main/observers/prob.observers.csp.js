/**
 * BMotionWeb for ProB Observer CSP Module
 *
 */
define([
  'angular',
  'jquery',
  'bms.func',
  'bms.session',
  'bms.visualization',
  'bms.ws',
  'prob.ws'
], function(angular, $, bms) {

  return angular.module('prob.observers.csp', ['bms.session', 'bms.visualization', 'prob.ws'])
    .factory('cspEventObserver', ['ws', '$q', 'bmsSessionService', 'bmsWsService', 'probWsService',
      function(ws, $q, bmsSessionService, bmsWsService, probWsService) {
        'use strict';

        var expressionCache;

        var observer = function(view, options) {
          this.id = bms.uuid();
          this.view = view;
          this.options = this.getDefaultOptions(options);
        };

        observer.prototype.getDefaultOptions = function(options) {
          return angular.merge({
            cause: "AnimationChanged",
            observers: []
          }, options);
        };

        observer.prototype.getId = function() {
          return this.id;
        };

        observer.prototype.shouldBeChecked = function() {
          return true;
        };

        observer.prototype.replaceParameter = function(str, parameters) {
          var fstr = str;
          angular.forEach(parameters, function(p, i) {
            var find = '{{a' + (i + 1) + '}}';
            var re = new RegExp(find, 'g');
            fstr = fstr.replace(re, p);
          });
          return fstr;
        };

        observer.prototype.evaluateExpressions = function(sessionId) {

          var defer = $q.defer();

          var self = this;

          if (!expressionCache) {

            var formulas = {};
            formulas[self.getId()] = {
              formulas: bms.toList(self.options.observers).map(function(observer) {
                return {
                  formula: observer.exp
                }
              })
            };

            bmsWsService.evaluateFormulas(sessionId, formulas)
              .then(function(results) {
                var res = {};
                angular.forEach(results[self.getId()], function(value, key) {
                  res[key] = value.result.replace("{", "").replace("}", "").split(",");
                });
                expressionCache = res;
                defer.resolve(res);
              });

          } else {
            defer.resolve(expressionCache);
          }

          return defer.promise;

        };

        observer.prototype.getDiagramData = function(node) {
          return node.data.index;
        };

        observer.prototype.apply = function(index, _container_) {

          var defer = $q.defer();

          var self = this;

          var container;

          if (_container_) {
            container = _container_;
          } else if (self.view.container) {
            container = self.view.container.contents();
          }

          probWsService.observeHistory(self.view.session.id)
            .then(function(transitions) {

              self.evaluateExpressions(self.view.session.id)
                .then(function(expressions) {

                  var fmap = {};

                  var keepGoing = true;

                  angular.forEach(transitions, function(transition) {

                    if (keepGoing) {

                      angular.forEach(self.options.observers, function(observer) {

                        var events = [];
                        // Collects events from expression
                        if (observer.exp) {
                          var eventsFromExp = expressions[observer.exp];
                          if (eventsFromExp) {
                            events = events.concat(eventsFromExp);
                          }
                        }
                        // Collect static events
                        if (observer.events) {
                          events = events.concat(observer.events);
                        }

                        if (bms.inArray(transition['opString'], events)) {
                          if (observer.trigger) {
                            observer.trigger.call(this, transition);
                          }
                          angular.forEach(observer.actions, function(action) {
                            var selector = self.replaceParameter(action.selector, transition['parameters']);
                            var attr = self.replaceParameter(action.attr, transition['parameters']);
                            var value = self.replaceParameter(action.value, transition['parameters']);
                            var bmsids = self.view.getBmsIds(selector, container);
                            angular.forEach(bmsids, function(id) {
                              if (fmap[id] === undefined) {
                                fmap[id] = {};
                              }
                              fmap[id][attr] = value;
                            });

                          });
                        }

                      });

                    }

                    if (index) {
                      keepGoing = transition['index'] < index;
                    } else {
                      keepGoing = transition['group'] === 'past';
                    }

                  });

                  defer.resolve(fmap);

                });

            });

          return defer.promise;

        };

        observer.prototype.check = function() {

          var defer = $q.defer();

          this.apply()
            .then(function(values) {
              defer.resolve(values);
            });

          return defer.promise;

        };

        return observer;

      }
    ]);


});

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

        var observerService = {

          getDefaultOptions: function(options) {
            return angular.merge({
              cause: "AnimationChanged",
              observers: []
            }, options);
          },
          shouldBeChecked: function(observer, view) {
            return true;
          },
          replaceParameter: function(str, parameters) {
            var fstr = str;
            angular.forEach(parameters, function(p, i) {
              var find = '{{a' + (i + 1) + '}}';
              var re = new RegExp(find, 'g');
              fstr = fstr.replace(re, p);
            });
            return fstr;
          },
          evaluateExpressions: function(sessionId, observer) {

            var defer = $q.defer();

            if (!expressionCache) {

              // Collect formula to be evaluated
              var formulas = {};
              formulas[observer.id] = {
                formulas: bms.toList(observer.options.observers).map(function(observer) {
                  return {
                    formula: observer.exp
                  }
                })
              };

              // Evaluate formulas
              bmsWsService.evaluateFormulas(sessionId, formulas)
                .then(function(results) {

                  var res = {};
                  var errors = [];
                  angular.forEach(results[observer.id], function(value, key) {
                    if (value['result'] !== undefined) {
                      res[key] = value.result.replace("{", "").replace("}", "").split(",");
                    }
                    if (value['error'] !== undefined) {
                      errors.push(value['error']);
                    }
                  });
                  if (errors.length > 0) {
                    defer.reject(errors);
                  } else {
                    expressionCache = res;
                    defer.resolve(res);
                  }

                });

            } else {
              defer.resolve(expressionCache);
            }

            return defer.promise;

          },
          getDiagramData: function(node, observer, view, element) {
            return node.data.index;
          },
          apply: function(observer, view, element, container, index) {

            var defer = $q.defer();

            container = container ? container : view.container.contents();

            probWsService.observeHistory(view.session.id)
              .then(function(transitions) {

                observerService.evaluateExpressions(view.session.id, observer)
                  .then(function(expressions) {

                    var fmap = {};

                    var keepGoing = true;

                    angular.forEach(transitions, function(transition) {

                      if (keepGoing) {

                        angular.forEach(observer.options.observers, function(observer) {

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
                              var selector = observerService.replaceParameter(action.selector, transition['parameters']);
                              var attr = observerService.replaceParameter(action.attr, transition['parameters']);
                              var value = observerService.replaceParameter(action.value, transition['parameters']);
                              var bmsids = view.getBmsIds(selector, container);
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

                  }, function(error) {
                    defer.reject(error);
                  });

              });

            return defer.promise;

          },
          check: function(observer, view, element, results) {

            var defer = $q.defer();

            observerService.apply(observer, view, element, results)
              .then(function(values) {
                defer.resolve(values);
              }, function(errors) {
                defer.reject(errors);
              });

            return defer.promise;

          }

        };

        return observerService;

      }
    ]);


});

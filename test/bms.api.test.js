define([
  'sharedTest',
  'jquery',
  'bms.api'
], function(sharedTest, $) {

  "use strict";

  describe('bms.api', function() {

    var bmsApiService;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var bmsWsService;
    var ws;
    var $q;

    beforeEach(module('bms.api'));

    beforeEach(function(done) {
      inject(function(_bmsApiService_, _bmsWsService_, _$q_, bmsSessionService) {
        bmsApiService = _bmsApiService_;
        bmsWsService = _bmsWsService_;
        $q = _$q_;
        sharedTest.setup(done);
      })
    });

    it('(1) should exist', function() {
      expect(bmsApiService).toBeDefined();
    });

    it('(2) eval function should call trigger function with formula results and container', function(done) {

      spyOn(bmsWsService, "evaluateFormulas").and.callFake(function(evt, args) {
        var defer = $q.defer();
        var results = {};
        for (var id in args) {
          results[id] = {
            'door': {
              formula: 'door',
              result: 'closed'
            },
            'floor': {
              formula: 'floor',
              result: '1'
            }
          }
        }
        defer.resolve(results);
        return defer.promise;
      });

      bmsApiService.eval(sessionId, viewId, {
        formulas: ['door', 'floor'],
        trigger: function(results, container) {
          expect(container).toBeInDOM();
          expect(results).toEqual(['closed', '1']);
          done();
        }
      });

    });

    it('(3) eval function should reject if formulas contain errors', function(done) {

      spyOn(bmsWsService, "evaluateFormulas").and.callFake(function(evt, args) {
        var defer = $q.defer();
        var results = {};
        for (var id in args) {
          results[id] = {
            'door': {
              formula: 'door',
              result: 'closed',
              error: 'someerror'
            },
            'floor': {
              formula: 'floor',
              result: '1'
            }
          }
        }
        defer.resolve(results);
        return defer.promise;
      });

      var promise = bmsApiService.eval(sessionId, viewId, {
        formulas: ['door', 'floor'],
        trigger: function(results, container) {}
      });

      var error;
      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });


    it('(4) addObserver function should add and check observer (trigger function should be called with origin and results)', function(done) {

      spyOn(bmsWsService, "evaluateFormulas").and.callFake(function(evt, args) {
        var defer = $q.defer();
        var results = {};
        for (var id in args) {
          results[id] = {
            'door': {
              formula: 'door',
              result: 'closed'
            },
            'floor': {
              formula: 'floor',
              result: '1'
            }
          }
        }
        defer.resolve(results);
        return defer.promise;
      });

      bmsApiService.addObserver(sessionId, viewId, 'formula', {
          selector: '#door',
          formulas: ['door', 'floor'],
          trigger: function(origin, results) {
            // Origin should be passed to trigger function
            expect(origin).toBeInDOM();
            // Results should be passed to trigger function
            expect(['closed', '1']).toEqual(results);
          }
        })
        .then(function(observer) {
          expect(observer).toBeDefined();
          // Observer should be added to view instance
          expect(window.viewInstance.getObservers().length).toBe(1);
        })
        .finally(done);

    });

    it('(5) addObserver function should resolve if no selector was set', function(done) {

      spyOn(bmsWsService, "evaluateFormulas").and.callFake(function(evt, args) {
        var defer = $q.defer();
        var results = {};
        for (var id in args) {
          results[id] = {}
        }
        defer.resolve(results);
        return defer.promise;
      });

      var promise = bmsApiService.addObserver(sessionId, viewId, 'formula', {});
      promise.then(
          function() {})
        .finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

    });

    it('(6) addEvent function should add and setup event', function(done) {

      bmsApiService.addEvent(sessionId, viewId, 'executeEvent', {
          selector: '#door',
          name: 'eventname'
        })
        .then(function(evt) {
          expect(evt).toBeDefined();
          // Tooltip should be installed
          expect($('#door')).toHaveAttr('data-hasqtip');
          // Event should be added to view instance
          expect(window.viewInstance.getEvents().length).toBe(1);
        })
        .finally(done);

    });

    it('(7) addEvent function should reject if no selector was set', function(done) {

      var error;

      var promise = bmsApiService.addEvent(sessionId, viewId, 'executeEvent', {
        events: [{
          name: 'eventname'
        }]
      });
      promise.then(
          function() {},
          function(err) {
            error = err;
          })
        .finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

    });

    it('(8) executeEvent function should resolve and call callback with result and container', function(done) {

      // Simulate resolving executeEvent server call
      spyOn(bmsWsService, "executeEvent").and.callFake(function(evt, args) {
        var defer = $q.defer();
        defer.resolve('someresults');
        return defer.promise;
      });

      var promise = bmsApiService.executeEvent(sessionId, viewId, {
        name: 'someevent',
        callback: function(result, container) {
          // Callback should be called
          expect(result).toBe('someresults');
          expect(container).toBe(window.viewInstance.container);
        }
      });
      promise.then(
        function(result) {
          // Function should be resolved
          expect(result).toBe('someresults');
          done();
        });

    });

    it('(9) executeEvent function should reject if executeEvent server call rejects', function(done) {

      // Simulate resolving executeEvent server call
      spyOn(bmsWsService, "executeEvent").and.callFake(function(evt, args) {
        var defer = $q.defer();
        defer.reject('Some error occurred while executing event.');
        return defer.promise;
      });

      var error;

      var promise = bmsApiService.executeEvent(sessionId, viewId, {
        name: 'someevent'
      });
      promise.then(
          function() {},
          function(err) {
            error = err;
          })
        .finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

    });

    it('(10) executeEvent function should reject if options scheme is incorrect', function(done) {

      var error;

      var promise = bmsApiService.executeEvent(sessionId, viewId, {});
      promise.then(
          function() {},
          function(err) {
            error = err;
          })
        .finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

    });

    it('(11) on function should register listener in viewInstance', function() {
      bmsApiService.on(sessionId, viewId, 'ModelInitialised', function() {});
      expect(window.viewInstance.getListeners('ModelInitialised').length).toBe(1);
    });

  });

});

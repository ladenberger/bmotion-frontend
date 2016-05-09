define([
  'jquery',
  'bms.api'
], function($) {

  "use strict";

  describe('bms.api', function() {

    var bmsApiService;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('bms.api'));

    beforeEach(function(done) {
      inject(function(_bmsApiService_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService, bmsVisualization) {

        bmsApiService = _bmsApiService_;
        $rootScope = _$rootScope_;
        ws = _ws_;
        $q = _$q_;

        var manifestData = {
          "model": "model/m3.bcm",
          "views": [{
            "id": viewId,
            "name": "Lift environment",
            "template": "lift.html"
          }]
        };
        var manifestPath = 'somepath/bmotion.json';
        $httpBackend.when('GET', manifestPath)
          .respond(manifestData);

        spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
          var deferred = $q.defer();
          deferred.resolve(sessionId);
          return deferred.promise;
        });

        spyOn(bmsWsService, "evaluateFormulas").and.callFake(function(evt, args) {
          var defer = $q.defer();
          var results = {};
          for (var id in args) {
            results[id] = {
              'door': 'closed',
              'floor': '1'
            }
          }
          defer.resolve(results);
          return defer.promise;
        });

        var bmsSessionInstance = bmsSessionService.getSession(sessionId);
        var promise = bmsSessionInstance.init(manifestPath);
        viewInstance = bmsSessionInstance.getView(viewId);
        // Set manually container of view
        loadFixtures('examples/lift.html');
        viewInstance.container = $('body');

        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(done);

        $rootScope.$digest();

      });

    });

    it('should exist', inject(function() {
      expect(bmsApiService).toBeDefined();
    }));

    it('eval function should call trigger function with formula results', function(done) {

      bmsApiService.eval(sessionId, viewId, {
        formulas: ['door', 'floor'],
        trigger: function(results) {
          expect(results).toEqual(['closed', '1']);
          done();
        }
      });

    });

    it('eval function should call trigger function with origin and formula results', function(done) {

      bmsApiService.eval(sessionId, viewId, {
        selector: '#door',
        formulas: ['door', 'floor'],
        trigger: function(origin, results) {
          // Origin should be passed to trigger function
          expect(origin).toBeInDOM();
          // Results should be passed to trigger function
          expect(['closed', '1']).toEqual(results);
          done();
        }
      });

    });

    it('addObserver function should add and check observer (trigger function should be called with origin and results)', function(done) {

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
          expect(viewInstance.getObservers().length).toBe(1);
        })
        .finally(done);

    });

    it('addEvent function should add and setup event', function(done) {

      bmsApiService.addEvent(sessionId, viewId, 'executeEvent', {
          selector: '#door',
          name: 'eventname'
        })
        .then(function(evt) {
          expect(evt).toBeDefined();
          // Tooltip should be installed
          expect($('#door')).toHaveAttr('data-hasqtip');
          // Event should be added to view instance
          expect(viewInstance.getEvents().length).toBe(1);
        })
        .finally(done);

    });

    it('addEvent function should reject if no selector was set in case of adding executeEvent event', function(done) {

      var error;

      var promise = bmsApiService.addEvent(sessionId, viewId, 'executeEvent', {
        name: 'eventname'
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

    it('executeEvent function should resolve and call callback with result and container', function(done) {

      inject(function(bmsWsService) {

        // Simulate resolving executeEvent server call
        spyOn(bmsWsService, "executeEvent").and.callFake(function(evt, args) {
          var defer = $q.defer();
          defer.resolve('someresults');
          return defer.promise;
        });

        var promise = bmsApiService.executeEvent(sessionId, viewId, 'someevent', {
          callback: function(result, container) {
            // Callback should be called
            expect(result).toBe('someresults');
            expect(container).toBe(viewInstance.container);
          }
        });
        promise.then(
          function(result) {
            // Function should be resolved
            expect(result).toBe('someresults');
          }).finally(done);

      });

    });

    it('executeEvent function should reject if executeEvent server call rejects', function(done) {

      inject(function(bmsWsService) {

        // Simulate resolving executeEvent server call
        spyOn(bmsWsService, "executeEvent").and.callFake(function(evt, args) {
          var defer = $q.defer();
          defer.reject('somerror');
          return defer.promise;
        });

        var error;

        var promise = bmsApiService.executeEvent(sessionId, viewId, 'someevent', {});
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

    });

  });

});

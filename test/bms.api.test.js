define(['bms.api'], function() {

  "use strict";

  describe('bms.api', function() {

    var bmsApiService;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

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
              'formula1': 'res1',
              'formula2': 'res2'
            }
          }
          defer.resolve(results);
          return defer.promise;
        });

        var promise = bmsSessionService.initSession(manifestPath);
        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(function(bmsSessionInstance) {
          viewInstance = bmsSessionInstance.getView(viewId);

          // Simulate checkObserver function of view instance
          spyOn(viewInstance, "checkObserver").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
          });

          // Simulate setupEvent function of view instance
          spyOn(viewInstance, "setupEvent").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
          });

        }).finally(done);

        $rootScope.$digest();

      });

    });

    it('should exist', inject(function() {
      expect(bmsApiService).toBeDefined();
    }));

    it('eval function should call trigger function with formula results', function(done) {

      bmsApiService.eval(sessionId, viewId, {
        formulas: ['formula1', 'formula2'],
        trigger: function(results) {
          expect(results).toEqual(['res1', 'res2']);
          done();
        }
      });

    });

    it('addObserver function should add observer in view instance', function(done) {

      bmsApiService.addObserver(sessionId, viewId, 'formula', {
          formulas: ['formula1', 'formula2'],
          trigger: function() {}
        })
        .then(function(observer) {
          expect(viewInstance.getObservers().length).toBe(1);
        })
        .finally(done);

    });

    it('addEvent function should add event in view instance', function(done) {

      bmsApiService.addEvent(sessionId, viewId, 'executeEvent', {
          selector: '#someselector',
          name: 'someeventname'
        })
        .then(function() {
          expect(viewInstance.getEvents().length).toBe(1);
        })
        .finally(done);

    });

  });

});

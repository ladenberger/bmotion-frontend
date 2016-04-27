define(['prob.observers.refinement'], function() {

  "use strict";

  describe('prob.observers.refinement', function() {

    var bmsVisualizationService;
    var refinementObserver;
    var refinementObserverInstance;
    var bmsSessionInstance;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

    beforeEach(module('prob.observers.refinement'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _refinementObserver_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        refinementObserver = _refinementObserver_;
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

        var promise = bmsSessionService.initSession(manifestPath);
        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(function(_bmsSessionInstance_) {
          bmsSessionInstance = _bmsSessionInstance_;
          viewInstance = new bmsVisualization(viewId, bmsSessionInstance);
          refinementObserverInstance = new refinementObserver(viewInstance, {
            selector: '#someselector',
            refinement: 'ref1',
            enable: function() {
              return {
                'opacity': 1
              }
            },
            disable: function() {
              return {
                'opacity': 0
              }
            }
          });

          // Simulate apply function of formula observer
          spyOn(refinementObserverInstance, "apply").and.callFake(function(data) {
            var defer = $q.defer();
            defer.resolve({
              'somebmsid': {
                'opacity': data ? 1 : 0
              }
            });
            return defer.promise;
          });

        }).finally(done);

        $rootScope.$digest();

      });

    });

    it('should exist', inject(function() {
      expect(refinementObserver).toBeDefined();
    }));

    it('should implement functions: getFormulas and getDefaultOptions', inject(function() {

      expect(refinementObserverInstance.getDefaultOptions).toBeDefined();

    }));

    it('check function should return enable attribute values of observer if refinement is in animation', function(done) {

      bmsSessionInstance.toolData['model'] = {};
      bmsSessionInstance.toolData['model']['refinements'] = ['ref1'];

      var promise = refinementObserverInstance.check();
      promise.then(function(attributeValues) {
        expect(attributeValues).toEqual({
          'somebmsid': {
            'opacity': 1
          }
        });
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('check function should return disable attribute values of observer if refinement is not in animation', function(done) {

      bmsSessionInstance.toolData['model'] = {};
      bmsSessionInstance.toolData['model']['refinements'] = [];

      var promise = refinementObserverInstance.check(viewInstance);
      promise.then(function(attributeValues) {
        expect(attributeValues).toEqual({
          'somebmsid': {
            'opacity': 0
          }
        });
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

  });

});

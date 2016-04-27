define(['prob.handlers.event'], function() {

  "use strict";

  describe('prob.handlers.event', function() {

    var bmsVisualizationService;
    var viewInstance;
    var executeEventEvent;
    var executeEventEventInstance;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

    beforeEach(module('prob.handlers.event'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _executeEventEvent_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        executeEventEvent = _executeEventEvent_;
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
        promise.then(function(bmsSessionInstance) {
          viewInstance = new bmsVisualization(viewId, bmsSessionInstance);
          executeEventEventInstance = new executeEventEvent(viewInstance, {
            selector: '#someselector',
            name: 'someevent',
            predicate: 'somepredicate'
          });
        }).finally(done);

        $rootScope.$digest();

      });

    });

    it('should exist', inject(function() {
      expect(executeEventEventInstance).toBeDefined();
    }));

    it('should implement functions: getId and getDefaultOptions', inject(function() {

      expect(executeEventEventInstance.getId).toBeDefined();
      expect(executeEventEventInstance.getDefaultOptions).toBeDefined();

    }));

  });

});

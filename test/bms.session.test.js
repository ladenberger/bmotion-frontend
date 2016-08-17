define(['bms.session'], function() {

  "use strict";

  describe('bms.session', function() {

    var bmsSession;
    var bmsSessionService;
    var bmsSessionInstance;
    var $rootScope;
    var $httpBackend;
    var manifestPath;
    var manifestData;
    var sessionId = "someSessionId";
    var templateFolder = '';

    beforeEach(module('bms.session'));

    beforeEach(function(done) {

      inject(function(bmsManifestService, _bmsSession_, _bmsSessionService_, bmsWsService, ws, $q, _$rootScope_, _$httpBackend_) {

        bmsSession = _bmsSession_;
        bmsSessionService = _bmsSessionService_;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        manifestData = {
          "model": "model/m3.bcm",
          "id": "viewId",
          "name": "Lift environment",
          "template": "lift.html",
          "modelOptions": {}
        };
        manifestPath = 'somepath/bmotion.json';
        $httpBackend.when('GET', manifestPath)
          .respond(manifestData);

        spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
          var deferred = $q.defer();
          deferred.resolve([{
            tool: 'BVisualization',
            templateFolder: templateFolder
          }, {
            traceId: 'someTraceId'
          }]);
          return deferred.promise;
        });

        bmsSessionInstance = bmsSessionService.getSession(sessionId);

        var promise = bmsSessionInstance.init(manifestPath);
        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(done);

        $rootScope.$digest();

      });

    });

    it('(1) should exist', inject(function() {
      expect(bmsSession).toBeDefined();
      expect(bmsSessionService).toBeDefined();
    }));

    it('(2) should implement functions: load and destroy', inject(function() {
      var bmsSessionInstance = new bmsSession(sessionId);
      expect(bmsSessionInstance.load).toBeDefined();
      expect(bmsSessionInstance.destroy).toBeDefined();
    }));

    it('(3) initSession function should set session instance data', function() {
      //expect(bmsSessionInstance.modelPath).toBe('somepath/model/m3.bcm');
      expect(bmsSessionInstance.manifestData).toEqual(manifestData);
      expect(bmsSessionInstance.id).toBe(sessionId);
    });

    it('(4) createView should create new view instance', function() {

      var view = bmsSessionInstance.getView('lift');
      expect(view.session).toEqual(bmsSessionInstance);
      expect(view).toBeDefined();

    });

    it('(5) session should be initialized', function(done) {

      var promise = bmsSessionInstance.isInitialized();
      promise.then(function(data) {})
        .finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

    });

    it('(6) init function should return error if no manifest file path was passed', function(done) {

      var promise = bmsSessionInstance.init();
      var error;
      promise.then(function(data) {}, function(err) {
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

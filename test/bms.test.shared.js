define([
  'jquery'
], function($) {

  "use strict";

  var viewId = 'lift';
  var sessionId = 'someSessionId';
  var manifestPath = 'somepath/bmotion.json';
  var bmsWsService;
  var bmsSessionService;
  var $rootScope;
  var $httpBackend;
  var $q;

  var setup = function(done, callFunc) {

    describe("(shared)", function() {

      beforeEach(inject(function($rootScope, $httpBackend, $q, bmsWsService, bmsSessionService) {

        jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

        var manifestData = {
          "model": "model/m3.bcm",
          "id": viewId,
          "name": "Lift environment",
          "template": "lift.html"
        };
        $httpBackend.when('GET', manifestPath)
          .respond(manifestData);

        spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
          var deferred = $q.defer();
          deferred.resolve(sessionId);
          return deferred.promise;
        });

        var bmsSessionInstance = bmsSessionService.getSession(sessionId);
        spyOn(bmsSessionInstance, "isBVisualization").and.callFake(function(evt, args) {
          return true;
        });
        window.bmsSessionInstance = bmsSessionInstance;
        var viewInstance = bmsSessionInstance.getView(viewId);
        window.viewInstance = viewInstance;
        // Set manually container of view
        loadFixtures('examples/lift.html');
        viewInstance.container = $('body');

        // Simulate isInitialized function of view instance
        spyOn(viewInstance, "isInitialized").and.callFake(function(evt, args) {
          var defer = $q.defer();
          defer.resolve();
          return defer.promise;
        });

        var promise = bmsSessionInstance.init(manifestPath);
        //$httpBackend.expectGET(manifestPath).respond(200, manifestData);

        promise.then(function() {
          if (callFunc) {
            callFunc();
          }
        }).finally(done);

        $httpBackend.flush();
        $rootScope.$digest();

      }));

    });

  };

  return {
    setup: setup
  };

});

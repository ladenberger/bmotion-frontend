define([
  'jquery',
  'prob.directive.execute.event'
], function($) {

  "use strict";

  describe('prob.directive.execute.event', function() {

    var $compile, $rootScope, $scope;
    var viewData, manifestData, bmsSessionInstance, viewInstance;
    var directiveElem;
    var templateFolder = "";
    var manifestPath = templateFolder + "/bmotion.json";
    var viewId = 'lift';
    var sessionId = 'someSessionId';

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('prob.directive.execute.event'));

    describe('compile tests', function() {

      beforeEach(function(done) {

        inject(function(_$compile_, _$rootScope_, $httpBackend, $q, bmsWsService, bmsSessionService) {

          viewData = {
            "id": viewId,
            "name": "Lift environment",
            "template": "lift.html"
          };

          manifestData = {
            "model": "model/m3.bcm",
            "views": [viewData]
          };

          $compile = _$compile_;
          $rootScope = _$rootScope_;

          spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve(sessionId);
            return deferred.promise;
          });

          $httpBackend.when('GET', manifestPath).respond(manifestData);

          bmsSessionInstance = bmsSessionService.getSession(sessionId);
          viewInstance = bmsSessionInstance.getView(viewId);
          // Set manually container of view
          loadFixtures('examples/lift.html');
          viewInstance.container = $('html');

          // Simulate isInitialized function of view instance
          spyOn(viewInstance, "isInitialized").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
          });

          var promise = bmsSessionInstance.init(manifestPath);
          promise.then(function() {

            var element = angular.element('<div execute-event name="send_request" predicate="f=0"></div>');
            var newScope = $rootScope.$new();
            newScope.sessionId = sessionId;
            newScope.id = viewId;
            directiveElem = $compile(element)(newScope);
            $scope = directiveElem.isolateScope();

          }).finally(done);

          $httpBackend.flush();

          $rootScope.$digest();

        });

      });

      it('event should be added to view instance', function() {
        expect(viewInstance.getEvents().length).toBe(1);
      });

    });

  });

});
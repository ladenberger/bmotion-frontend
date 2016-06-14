define([
  'jquery',
  'bms.online.directive'
], function($) {

  "use strict";

  describe('bms.online.directive', function() {

    var $scope;
    var directiveElem;
    var viewData;
    var viewDataWithoutJsonElements;
    var manifestData;
    var templateFolder = "someTemplateFolder";
    var manifestPath = templateFolder + "/bmotion.json";
    var viewId = 'lift';
    var bmsSessionInstance;
    var bmsViewService;
    var jsonObservers;
    var jsonEvents;
    var $httpBackend;
    var sessionId = "someSessionId";
    var $rootScope;

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('bms.online.directive'));

    describe('compile tests', function() {

      beforeEach(function() {

        inject(function(bmsSessionService, bmsManifestService, bmsWsService, _bmsViewService_, $compile, ws, _$rootScope_, $q, _$httpBackend_) {

          // Simulate ws on socket listener
          spyOn(ws, "on").and.callFake(function(evt, args) {});
          spyOn(ws, "removeAllListeners").and.callFake(function(evt, args) {});

          $httpBackend = _$httpBackend_;
          $rootScope = _$rootScope_;
          bmsViewService = _bmsViewService_;

          viewData = {
            "id": viewId,
            "name": "Lift environment",
            "template": "lift.html",
            "observers": "observers.json",
            "events": "events.json"
          };

          manifestData = {
            "model": "model/m3.bcm",
            "views": [
              viewData, {
                "id": "secondView",
                "name": "Lift controller",
                "template": "controller.html",
                "observers": "observers.json",
                "events": "events.json"
              }, {
                "id": "thirdView",
                "name": "Lift controller",
                "template": "controller.html",
                "observers": "observers.json",
                "events": "events.json"
              }
            ],
            "modelOptions": {}
          };

          jsonObservers = {
            "observers": [{
              "type": "formula",
              "data": {
                "formulas": [
                  "floor"
                ],
                "cause": "AnimationChanged",
                "trigger": "origin.text('Current Floor: ' + values[0]);",
                "selector": "#txt_floor"
              }
            }, {
              "type": "formula",
              "data": {
                "formulas": [
                  "move"
                ],
                "cause": "AnimationChanged",
                "trigger": "origin.text('Moving: ' + values[0]);",
                "selector": "#txt_direction"
              }
            }]
          };

          jsonEvents = {
            "events": [{
              "type": "executeEvent",
              "data": {
                "events": [{
                  "name": "close_door",
                  "predicate": "",
                  "predicateJs": true
                }, {
                  "name": "open_door",
                  "predicate": ""
                }, {
                  "name": "move_serve",
                  "predicate": ""
                }],
                "selector": "#door"
              }
            }]
          };

          spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve(sessionId);
            return deferred.promise;
          });

          $httpBackend.when('GET', manifestPath).respond(manifestData);
          $httpBackend.when('GET', templateFolder + '/observers.json').respond(jsonObservers);
          $httpBackend.when('GET', templateFolder + '/events.json').respond(jsonEvents);

          // Simulate compilation of bmsVisualizationView directive
          var element = angular.element('<div data-bms-online-visualization="' + manifestPath + '"></div>');
          directiveElem = $compile(element)($rootScope.$new());
          $scope = directiveElem.isolateScope();

          // Set manually container of view
          loadFixtures('examples/lift.html');
          $scope.view.container = $('body');

          // Simulate checkObservers and setupEvents methods
          spyOn($scope.view, "checkObservers").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
          });

          spyOn($scope.view, "setupEvents").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
          });

          spyOn($scope.view, "loadTemplate").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
          });

          spyOn($scope.session, "isInitialized").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve(sessionId);
            return deferred.promise;
          });

          $httpBackend.flush();

        });

      });

      it('should have iframe element', function() {
        var iframeElement = directiveElem.find('iframe');
        expect(iframeElement).toBeDefined();
      });

      it('session is set', function() {
        expect($scope.session).toBeDefined();
        expect($scope.session.manifestData).toEqual(manifestData);
      });

      it('view instance and container is set', function() {
        expect($scope.view).toBeDefined();
        expect($scope.view.container).toBeDefined();
      });

      it('view should be initialized', function(done) {

        var promise = $scope.view.isInitialized();
        promise.then(function() {
          expect($scope.view.viewData).toEqual(viewData);
          expect($scope.view.getEvents().length).toBe(1);
          expect($scope.view.getObservers().length).toBe(2);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

        $rootScope.$digest();

      });

      it('additional views should be added', function(done) {

        var promise = $scope.view.isInitialized();
        promise.then(function() {
          expect(bmsViewService.getViews().length).toBe(2);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

        $rootScope.$digest();

      });

    });

  });

});

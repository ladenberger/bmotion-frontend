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
    var templateFolder = "";
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

      beforeEach(function(done) {

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

          viewDataWithoutJsonElements = {
            "id": viewId,
            "name": "Lift environment",
            "template": "lift.html"
          };

          manifestData = {
            "model": "model/m3.bcm",
            "name": "Lift visualization",
            "modelOptions": {},
            "id": "rootId",
            "template": "template.html",
            "observers": "observers.json",
            "events": "events.json",
            "views": [viewData]
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
            deferred.resolve([{
              tool: 'BVisualization',
              templateFolder: templateFolder
            }, {
              traceId: 'someTraceId'
            }]);
            return deferred.promise;
          });

          $httpBackend.when('GET', manifestPath).respond(manifestData);
          $httpBackend.when('GET', templateFolder + '/observers.json').respond(jsonObservers);
          $httpBackend.when('GET', templateFolder + '/events.json').respond(jsonEvents);

          bmsSessionInstance = bmsSessionService.getSession(sessionId);
          var viewInstance = bmsSessionInstance.getView(viewId);
          var promise = bmsSessionInstance.init(manifestPath);
          promise.then(function() {

            // Simulate compilation of bmsVisualizationView directive
            var element = angular.element('<div data-bms-online-visualization="' + manifestPath + '" data-bms-online-visualization-id="' + viewId + '" data-bms-session-id="' + bmsSessionInstance.id + '"></div>');
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

            spyOn($scope.session, "isInitialized").and.callFake(function(evt, args) {
              var deferred = $q.defer();
              deferred.resolve(sessionId);
              return deferred.promise;
            });

            spyOn($scope.view, "loadTemplate").and.callFake(function(evt, args) {
              var deferred = $q.defer();
              deferred.resolve();
              return deferred.promise;
            });

          }).finally(done);

          $httpBackend.flush();

          $rootScope.$digest();

        });

      });

      it('(1) should have iframe element', function() {
        var iframeElement = directiveElem.find('iframe');
        expect(iframeElement).toBeDefined();
      });

      it('(2) session is set', function() {
        expect($scope.session).toBeDefined();
      });

      it('(3) view instance and container is set', function() {
        expect($scope.view).toBeDefined();
        expect($scope.view.container).toBeDefined();
      });

      it('(4) view should be initialized', function(done) {

        var promise = $scope.view.isInitialized();
        promise.then(function() {
          expect($scope.view.viewData).toEqual({
            id: 'rootId',
            template: 'template.html',
            name: 'Lift visualization',
            observers: 'observers.json',
            events: 'events.json'
          });
          expect($scope.view.getEvents().length).toBe(1);
          expect($scope.view.getObservers().length).toBe(2);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('(5) additional views should be added', function(done) {

        var promise = $scope.view.isInitialized();
        promise.then(function() {
          expect(bmsViewService.getViews().length).toBe(1);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

    });

  });

});

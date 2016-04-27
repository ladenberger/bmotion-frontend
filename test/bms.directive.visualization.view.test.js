define(['bms.directive.visualisation.view'], function() {

  "use strict";

  describe('bms.directive.visualisation.view', function() {

    var $scope;
    var directiveElem;
    var viewData;
    var viewDataWithoutJsonElements;
    var manifestData;
    var templateFolder = "someManifestPath";
    var manifestPath = templateFolder + "/bmotion.json";
    var viewId = 'lift';
    var bmsSessionInstance;
    var jsonObservers;
    var jsonEvents;
    var $httpBackend;
    var sessionId = "someSessionId";

    beforeEach(module('bms.directive.visualisation.view'));

    describe('compile tests', function() {

      beforeEach(function(done) {

        inject(function(bmsSessionService, bmsManifestService, bmsWsService, $compile, ws, $rootScope, $q, _$httpBackend_) {

          $httpBackend = _$httpBackend_;

          // Simulate ws on socket listener
          spyOn(ws, "on").and.callFake(function(evt, args) {});
          spyOn(ws, "removeAllListeners").and.callFake(function(evt, args) {});

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
            deferred.resolve(sessionId);
            return deferred.promise;
          });

          $httpBackend.expectGET(manifestPath).respond(200, manifestData);

          var promise = bmsSessionService.initSession(manifestPath);
          promise.then(function(_bmsSessionInstance_) {

            $httpBackend.expectGET(templateFolder + '/observers.json').respond(200, jsonObservers);
            $httpBackend.expectGET(templateFolder + '/events.json').respond(200, jsonEvents);

            bmsSessionInstance = _bmsSessionInstance_;

            // Simulate compilation of bmsVisualizationView directive
            var element = angular.element('<div data-bms-visualization-view="' + viewId + '" data-bms-session-id="' + bmsSessionInstance.id + '"></div>');
            directiveElem = $compile(element)($rootScope.$new());
            $scope = directiveElem.isolateScope();

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

            spyOn($scope, "loadTemplate").and.callFake(function(evt, args) {
              var deferred = $q.defer();
              deferred.resolve();
              return deferred.promise;
            });

          }).finally(done);

          $httpBackend.flush();

          $rootScope.$digest();

        });

      });

      it('should have iframe element', function() {
        var iframeElement = directiveElem.find('iframe');
        expect(iframeElement).toBeDefined();
      });

      it('session is set', function() {
        expect($scope.session).toEqual(bmsSessionInstance);
      });

      it('view instance and container is set', function() {
        expect($scope.view).toBeDefined();
        expect($scope.view.container).toBeDefined();
      });

      it('loadViewData should resolve view data', function(done) {

        var promise = $scope.loadViewData(viewId, manifestData);
        promise.then(function(viewData) {
          expect(viewData).toEqual(viewData);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('getJsonElements should resolve object', function(done) {

        $httpBackend.expectGET(templateFolder + '/observers.json').respond(200, jsonObservers);
        $httpBackend.expectGET(templateFolder + '/events.json').respond(200, jsonEvents);

        var promise = $scope.getJsonElements(templateFolder, viewData);

        promise.then(function(data) {
          expect(data).toEqual({
            observers: jsonObservers.observers,
            events: jsonEvents.events
          });
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('getJsonElements should resolve empty object if no path to json files were set', function(done) {

        var promise = $scope.getJsonElements(templateFolder, viewDataWithoutJsonElements);
        promise.then(function(jsonData) {
          expect(jsonData).toEqual({
            observers: [],
            events: []
          });
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('initView should set view instance data', function(done) {

        var promise = $scope.view.isInitialized();
        promise.then(function() {
          expect($scope.view.viewData).toEqual(viewData);
          expect($scope.view.getEvents().length).toBe(1);
          expect($scope.view.getObservers().length).toBe(2);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

    });

  });

});

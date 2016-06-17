define([
  'jquery',
  'prob.observers.set'
], function($) {

  "use strict";

  describe('prob.observers.set', function() {

    var bmsVisualizationService;
    var bmsSessionInstance;
    var setObserver;
    var setObserverInstance;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('prob.observers.set'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _setObserver_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        setObserver = _setObserver_;
        $rootScope = _$rootScope_;
        ws = _ws_;
        $q = _$q_;

        var manifestData = {
          "model": "model/m3.bcm",
          "id": viewId,
          "name": "Lift environment",
          "template": "lift.html"
        };
        var manifestPath = 'somepath/bmotion.json';
        $httpBackend.when('GET', manifestPath)
          .respond(manifestData);

        spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
          var deferred = $q.defer();
          deferred.resolve(sessionId);
          return deferred.promise;
        });

        bmsSessionInstance = bmsSessionService.getSession(sessionId);

        spyOn(bmsSessionInstance, "isBVisualization").and.callFake(function(evt, args) {
          return true;
        });

        viewInstance = bmsSessionInstance.getView(viewId);
        setObserverInstance = new setObserver(viewInstance, {
          selector: '#request',
          set: 'request',
          convert: function(element) {
            return "#label_floor_" + element;
          }
        });

        // Set manually container of view
        loadFixtures('examples/lift.html');
        viewInstance.container = $('body');

        var promise = bmsSessionInstance.init(manifestPath);
        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(done);

        $rootScope.$digest();

      });

    });

    it('should exist', inject(function() {
      expect(setObserver).toBeDefined();
    }));

    it('should implement functions: getId, getFormulas and getDefaultOptions', inject(function() {

      expect(setObserverInstance.getId).toBeDefined();
      expect(setObserverInstance.getFormulas).toBeDefined();
      expect(setObserverInstance.getDefaultOptions).toBeDefined();
      expect(setObserverInstance.getDiagramData).toBeDefined();

    }));

    it('getFormulas function should return one formula object', inject(function() {
      expect(setObserverInstance.getFormulas().length).toBe(1);
    }));

    it('check function should call trigger function (with origin and set elements)', function(done) {

      setObserverInstance.options.trigger = function(origin, set) {
        // Origin should be passed to trigger function
        expect(origin).toBeInDOM();
        // Set should be passed to trigger function
        expect(set).toBeInDOM();
        done();
      };

      var promise = setObserverInstance.check({
        'request': [-1, 0, 1]
      });
      promise.then(function() {
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
      });

    });

    it('empty set should resolve', function(done) {

      var promise = setObserverInstance.check({
        'request': []
      });
      promise.then(function() {
      }).finally(function() {
        done();
        expect(promise.$$state.status).toBe(1); // Resolved
      });

    });

    it('shouldBeChecked should return true if given refinement is in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      setObserverInstance.options.refinement = 'm3';

      expect(setObserverInstance.shouldBeChecked()).toBeTruthy();

    });

    it('shouldBeChecked should return false if given refinement is not in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      setObserverInstance.options.refinement = 'm3';

      expect(setObserverInstance.shouldBeChecked()).toBe(false);

    });

  });

});

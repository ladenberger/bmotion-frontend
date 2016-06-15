define([
  'jquery',
  'prob.observers.predicate'
], function($) {

  "use strict";

  describe('prob.observers.predicate', function() {

    var bmsVisualizationService;
    var bmsSessionInstance;
    var predicateObserver;
    var predicateObserverInstance;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('prob.observers.predicate'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _predicateObserver_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        predicateObserver = _predicateObserver_;
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

        predicateObserverInstance = new predicateObserver(viewInstance, {
          selector: '#door',
          predicate: 'predicate1'
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
      expect(predicateObserver).toBeDefined();
    }));

    it('should implement functions: getFormulas and getDefaultOptions', inject(function() {

      expect(predicateObserverInstance.getId).toBeDefined();
      expect(predicateObserverInstance.getFormulas).toBeDefined();
      expect(predicateObserverInstance.getDefaultOptions).toBeDefined();
      expect(predicateObserverInstance.getDiagramData).toBeDefined();

    }));

    it('getFormulas function should return one formula objects', inject(function() {
      expect(predicateObserverInstance.getFormulas().length).toBe(1);
    }));

    it('check function should return true attribute values of observer if result of predicate is true', function(done) {

      predicateObserverInstance.options.true = function(origin) {
        // Origin should be passed to true function
        expect(origin).toBeInDOM();
        return {
          'fill': 'green'
        }
      };

      var promise = predicateObserverInstance.check({
        'predicate1': 'TRUE'
      });
      var doorBmsId = $('#door').attr('data-bms-id');
      var expectedObj = {};
      expectedObj[doorBmsId] = {
        'fill': 'green'
      };

      promise.then(function(attributeValues) {
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('check function should return false attribute values of observer if result of predicate is false', function(done) {

      predicateObserverInstance.options.false = function(origin) {
        // Origin should be passed to false function
        expect(origin).toBeInDOM();
        return {
          'fill': 'red'
        }
      };

      var promise = predicateObserverInstance.check({
        'predicate1': 'FALSE'
      });

      var doorBmsId = $('#door').attr('data-bms-id');
      var expectedObj = {};
      expectedObj[doorBmsId] = {
        'fill': 'red'
      };

      promise.then(function(attributeValues) {
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('check function should call true function if result of predicate is true', function(done) {

      predicateObserverInstance.options.selector = '';
      predicateObserverInstance.options.true = function(container) {
        // Origin should be passed to true function
        expect(container).toBeInDOM();
      };

      var promise = predicateObserverInstance.check({
        'predicate1': 'TRUE'
      });
      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('check function should call false function if result of predicate is false', function(done) {

      predicateObserverInstance.options.selector = '';
      predicateObserverInstance.options.false = function(container) {
        // Origin should be passed to true function
        expect(container).toBeInDOM();
      };

      var promise = predicateObserverInstance.check({
        'predicate1': 'FALSE'
      });
      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('shouldBeChecked should return true if given refinement is in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      predicateObserverInstance.options.refinement = 'm3';

      expect(predicateObserverInstance.shouldBeChecked()).toBeTruthy();

    });

    it('shouldBeChecked should return false if given refinement is not in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      predicateObserverInstance.options.refinement = 'm3';

      expect(predicateObserverInstance.shouldBeChecked()).toBe(false);

    });

  });

});

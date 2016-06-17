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

    it('(1) should exist', inject(function() {
      expect(predicateObserver).toBeDefined();
    }));

    it('(2) should implement functions: getFormulas and getDefaultOptions', inject(function() {
      expect(predicateObserverInstance.getId).toBeDefined();
      expect(predicateObserverInstance.getFormulas).toBeDefined();
      expect(predicateObserverInstance.getDefaultOptions).toBeDefined();
      expect(predicateObserverInstance.getDiagramData).toBeDefined();
    }));

    it('(3) getFormulas function should return one formula objects', inject(function() {
      expect(predicateObserverInstance.getFormulas().length).toBe(1);
    }));

    it('(4) apply function should reject if no selector is given', function(done) {

      predicateObserverInstance.options.selector = undefined;
      var promise = predicateObserverInstance.apply("TRUE");
      var error;

      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });

    it('(5) check function should reject if formulas contain errors', function(done) {

      var promise = predicateObserverInstance.check({
        'predicate1': {
          'formula': 'predicate1',
          'result': 'TRUE',
          'error': 'someerror'
        }
      });

      var error;
      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });

    it('(6) check function should return true attribute values of observer if result of predicate is true', function(done) {

      predicateObserverInstance.options.true = function(origin) {
        // Origin should be passed to true function
        expect(origin).toBeInDOM();
        return {
          'fill': 'green'
        }
      };

      var promise = predicateObserverInstance.check({
        'predicate1': {
          'formula': 'predicate1',
          'result': 'TRUE'
        }
      });
      var doorBmsId = $('#door').attr('data-bms-id');
      promise.then(function(attributeValues) {
        var expectedObj = {};
        expectedObj[doorBmsId] = {
          'fill': 'green'
        };
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(7) check function should return false attribute values of observer if result of predicate is false', function(done) {

      predicateObserverInstance.options.false = function(origin) {
        // Origin should be passed to false function
        expect(origin).toBeInDOM();
        return {
          'fill': 'red'
        }
      };

      var promise = predicateObserverInstance.check({
        'predicate1': {
          'formula': 'predicate1',
          'result': 'FALSE'
        }
      });

      var doorBmsId = $('#door').attr('data-bms-id');
      promise.then(function(attributeValues) {
        var expectedObj = {};
        expectedObj[doorBmsId] = {
          'fill': 'red'
        };
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(8) shouldBeChecked should return true if given refinement is in animation', function() {
      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      predicateObserverInstance.options.refinement = 'm3';
      expect(predicateObserverInstance.shouldBeChecked()).toBeTruthy();
    });

    it('(9) shouldBeChecked should return false if given refinement is not in animation', function() {
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

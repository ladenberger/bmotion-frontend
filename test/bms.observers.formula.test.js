define([
  'jquery',
  'bms.observers.formula'
], function($) {

  "use strict";

  describe('bms.observers.formula', function() {

    var bmsVisualizationService;
    var bmsSessionInstance;
    var formulaObserver;
    var formulaObserverInstance;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('bms.observers.formula'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _formulaObserver_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        formulaObserver = _formulaObserver_;
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
        formulaObserverInstance = new formulaObserver(viewInstance, {
          selector: '#door',
          formulas: ['door', 'floor']
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
      expect(formulaObserver).toBeDefined();
    }));

    it('should implement functions: getId, getFormulas and getDefaultOptions', inject(function() {

      expect(formulaObserverInstance.getId).toBeDefined();
      expect(formulaObserverInstance.getFormulas).toBeDefined();
      expect(formulaObserverInstance.getDefaultOptions).toBeDefined();
      expect(formulaObserverInstance.getDiagramData).toBeDefined();

    }));

    it('getFormulas function should return two formula objects', inject(function() {
      expect(formulaObserverInstance.getFormulas().length).toBe(2);
    }));

    it('check function should call trigger function (with origin and results parameters and return attribute values)', function(done) {

      formulaObserverInstance.options.trigger = function(origin, results) {

        // Origin should be passed to trigger function
        expect(origin).toBeInDOM();
        // Results should be passed to trigger function
        expect(['closed', '1']).toEqual(results);
        return {
          'stroke-width': 1
        };

      };

      var promise = formulaObserverInstance.check({
        'door': {
          formula: 'door',
          result: 'closed'
        },
        'floor': {
          formula: 'floor',
          result: '1'
        }
      });

      var doorBmsId = $('#door').attr('data-bms-id');
      promise.then(function(attributeValues) {
        var expectedObj = {};
        expectedObj[doorBmsId] = {
          'stroke-width': 1
        };
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('check function should call trigger function with results only if no selector was passed', function(done) {

      // Set manually selector option to undefined
      formulaObserverInstance.options.selector = undefined;
      formulaObserverInstance.options.trigger = function(results) {
        // Results should be passed to trigger function
        expect(['closed', '1']).toEqual(results);
      };

      var promise = formulaObserverInstance.check({
        'door': {
          formula: 'door',
          result: 'closed'
        },
        'floor': {
          formula: 'floor',
          result: '1'
        }
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
      formulaObserverInstance.options.refinement = 'm3';

      expect(formulaObserverInstance.shouldBeChecked()).toBeTruthy();

    });

    it('shouldBeChecked should return false if given refinement is not in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      formulaObserverInstance.options.refinement = 'm3';

      expect(formulaObserverInstance.shouldBeChecked()).toBe(false);

    });

  });

});

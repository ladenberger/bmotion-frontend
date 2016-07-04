define([
  'jquery',
  'prob.observers.csp'
], function($) {

  "use strict";

  describe('prob.observers.csp', function() {

    var bmsVisualizationService;
    var cspEventObserver;
    var cspEventObserverInstance;
    var probWsService;
    var viewInstance;
    var $rootScope;
    var viewId = 'someViewId';
    var sessionId = 'someSessionId';
    var ws;
    var $q;

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('prob.observers.csp'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _probWsService_, _cspEventObserver_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        cspEventObserver = _cspEventObserver_;
        probWsService = _probWsService_;
        $rootScope = _$rootScope_;
        ws = _ws_;
        $q = _$q_;

        var manifestData = {
          "model": "model/crossing.csp",
          "id": viewId,
          "name": "Crossing",
          "template": "crossing.html"
        };
        var manifestPath = 'somepath/bmotion.json';
        $httpBackend.when('GET', manifestPath)
          .respond(manifestData);

        spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
          var deferred = $q.defer();
          deferred.resolve(sessionId);
          return deferred.promise;
        });

        spyOn(bmsWsService, "evaluateFormulas").and.callFake(function(evt, args) {

          var defer = $q.defer();

          var result = {};

          result[cspEventObserverInstance.id] = {
            '{enter.x.y | x <- {0..4}, y <- {Train1,Train2}}': {
              result: '{enter.1.Train1}'
            },
            '{leave.x.y | x <- {0..3}, y <- {Train1,Train2}}': {
              result: '{leave.0.Train1}'
            }
          };

          defer.resolve(result);

          return defer.promise;

        });

        var bmsSessionInstance = bmsSessionService.getSession(sessionId);
        viewInstance = bmsSessionInstance.getView(viewId);

        cspEventObserverInstance = new cspEventObserver(viewInstance, {
          "selector": "#crossing",
          "observers": [{
            "exp": "{gate.down,gate.up}",
            "actions": [{
              "selector": "g[id^=gate]",
              "attr": "opacity",
              "value": "0"
            }]
          }, {
            "exp": "{gate.down}",
            "actions": [{
              "selector": "#gate-go_down-2, #gate-go_down-1",
              "attr": "opacity",
              "value": "100"
            }]
          }, {
            "exp": "{gate.up}",
            "actions": [{
              "selector": "#gate-go_up-2, #gate-go_up-1",
              "attr": "opacity",
              "value": "100"
            }]
          }, {
            "exp": "{enter.x.y | x <- {0..4}, y <- {Train1,Train2}}",
            "actions": [{
              "selector": "#train_{{a2}}",
              "attr": "x",
              "value": "{{a1}}00"
            }, {
              "selector": "#train_{{a2}}",
              "attr": "transform",
              "value": ""
            }]
          }, {
            "exp": "{leave.x.y | x <- {0..3}, y <- {Train1,Train2}}",
            "actions": [{
              "selector": "#train_{{a2}}",
              "attr": "transform",
              "value": "translate(50,0)"
            }]
          }]
        });

        // Set manually container of view
        loadFixtures('examples/crossing.html');
        viewInstance.container = $('body');
        var promise = bmsSessionInstance.init(manifestPath);
        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(done);

        $rootScope.$digest();

      });

    });

    it('should exist', inject(function() {
      expect(cspEventObserver).toBeDefined();
    }));

    it('should implement functions', inject(function() {
      expect(cspEventObserverInstance.getDefaultOptions).toBeDefined();
      expect(cspEventObserverInstance.shouldBeChecked).toBeDefined();
      expect(cspEventObserverInstance.getDiagramData).toBeDefined();
    }));

    it('evaluateExpressions should translate expression results', function(done) {

      var promise = cspEventObserverInstance.evaluateExpressions();
      promise.then(function(results) {
        expect(results).toEqual({
          '{enter.x.y | x <- {0..4}, y <- {Train1,Train2}}': ['enter.1.Train1'],
          '{leave.x.y | x <- {0..3}, y <- {Train1,Train2}}': ['leave.0.Train1']
        });
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('replaceParameter should replace parameters', function() {
      var replaced = cspEventObserverInstance.replaceParameter('#some{{a1}}selector{{a2}}', ['1', '2']);
      expect(replaced).toBe('#some1selector2');
    });

    it('future events should be ignored', function(done) {

      spyOn(probWsService, "observeHistory").and.callFake(function(evt, args) {

        var deferred = $q.defer();

        deferred.resolve([{
          name: 'start_cspm_MAIN',
          opString: 'start_cspm_MAIN',
          group: 'past'
        }, {
          name: 'enter',
          opString: 'enter.1.Train1',
          parameters: ['1', 'Train1'],
          group: 'current'
        }, {
          name: 'leave',
          opString: 'leave.0.Train1',
          parameters: ['0', 'Train1'],
          group: 'future'
        }]);

        return deferred.promise;

      });

      var promise = cspEventObserverInstance.check();
      promise.then(function(attributeValues) {

        var trainId = $('#train_Train1').attr("data-bms-id");
        var expectObject = {};
        expectObject[trainId] = {
          'x': '100',
          'transform': ''
        };
        expect(attributeValues).toEqual(expectObject);

      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('override attribute values', function(done) {

      spyOn(probWsService, "observeHistory").and.callFake(function(evt, args) {

        var deferred = $q.defer();

        deferred.resolve([{
          name: 'start_cspm_MAIN',
          opString: 'start_cspm_MAIN',
          group: 'past'
        }, {
          name: 'enter',
          opString: 'enter.1.Train1',
          parameters: ['1', 'Train1'],
          group: 'past'
        }, {
          name: 'leave',
          opString: 'leave.0.Train1',
          parameters: ['0', 'Train1'],
          group: 'current'
        }]);

        return deferred.promise;

      });

      var promise = cspEventObserverInstance.check();
      promise.then(function(attributeValues) {

        var trainId = $('#train_Train1').attr("data-bms-id");
        var expectObject = {};
        expectObject[trainId] = {
          'x': '100',
          'transform': 'translate(50,0)'
        };
        expect(attributeValues).toEqual(expectObject);

      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

  });

});

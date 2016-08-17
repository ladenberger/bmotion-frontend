define([
  'jquery',
  'bms.visualization'
], function($) {

  "use strict";

  describe('bms.visualization', function() {

    var bmsVisualizationService;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var vis;
    var ws;
    var $q;
    var formulaObserver;
    var templateFolder = '';

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('bms.visualization'));

    beforeEach(function(done) {

      inject(function(bmsSessionService, bmsWsService, bmsVisualization, _bmsVisualizationService_, _ws_, _$q_, _$rootScope_, $httpBackend, _formulaObserver_) {

        bmsVisualizationService = _bmsVisualizationService_;
        $rootScope = _$rootScope_;
        ws = _ws_;
        $q = _$q_;
        formulaObserver = _formulaObserver_;

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
          deferred.resolve([{
            tool: 'BVisualization',
            templateFolder: templateFolder
          }, {
            traceId: 'someTraceId'
          }]);
          return deferred.promise;
        });

        var bmsSessionInstance = bmsSessionService.getSession(sessionId);
        viewInstance = bmsSessionInstance.getView(viewId);

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
      expect(bmsVisualizationService).toBeDefined();
    }));

    it('new view instance should be defined and set correct view id', inject(function() {
      expect(viewInstance).toBeDefined();
      expect(viewInstance.id).toBe(viewId);
    }));

    describe('observer tests', function() {

      var result = {};

      var observer1, observer2;

      beforeEach(function(done) {

        // Simulate evaluateFormulas socket event call
        spyOn(ws, "emit").and.callFake(function(evt, args) {
          var deferred = $q.defer();
          deferred.resolve(result);
          return deferred.promise;
        });

        $q.all([viewInstance.addObserver('formula', {
          selector: '#door',
          formulas: ['formula1', 'formula2'],
          trigger: function() {
            return {
              'fill': 'green'
            };
          }
        }), viewInstance.addObserver('formula', {
          selector: '#door',
          formulas: ['formula1'],
          trigger: function() {
            return {
              'stroke-width': 1
            };
          }
        })]).then(function(data) {

          observer1 = data[0];
          observer2 = data[1];

          // Simulate shouldBeChecked function
          spyOn(formulaObserver, 'shouldBeChecked').and.callFake(function(evt, args) {
            return true;
          });

          result[observer1.id] = {
            'formula1': {
              formula: 'fromula1',
              result: 'result1'
            },
            'formula2': {
              formula: 'formula2',
              result: 'result2'
            }
          };

          result[observer2.id] = {
            'formula1': {
              formula: 'formula1',
              result: 'result1'
            }
          };

          done();

        });

      });

      it('two observers should exists', function(done) {
        expect(viewInstance.getObservers().length).toBe(2);
        done();
      });

      it('adding unknown js observer should reject with error', function(done) {

        var error;
        var promise = viewInstance.addObserver('unknownObserver', {});
        promise.then(function() {}, function(err) {
          error = err;
        }).finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

      });

      it('adding unknown json observer should reject with error', function(done) {

        var error;
        var promise = viewInstance.addObserver('unknownObserver', {});
        promise.then(function() {}, function(err) {
          error = err;
        }).finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

      });

      it('collectFormulas function should return three formula objects', inject(function() {
        var formulas = viewInstance.collectFormulas();
        var formulas1 = formulas[observer1.id];
        var formulas2 = formulas[observer2.id];
        expect(formulas1.formulas.length).toBe(2);
        expect(formulas2.formulas.length).toBe(1);
      }));

      it('evaluateFormulas should return map with formula return objects', function(done) {

        var promise = viewInstance.evaluateFormulas();
        promise.then(function(data) {
          expect(data).toEqual(result);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('checkObservers should set and merge attributes values coming from observers', function(done) {

        var promise = viewInstance.checkObservers();
        promise.then(function() {
          var doorBmsId = $('#door').attr('data-bms-id');
          var expectedObj = {};
          expectedObj[doorBmsId] = {
            'fill': 'green',
            'stroke-width': 1
          };
          expect(viewInstance.attributeValues).toEqual(expectedObj);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('checkObservers should set and merge attributes values ONLY coming from observer(s) passed as argument', function(done) {

        var promise = viewInstance.checkObservers([observer2]);
        promise.then(function() {
          var doorBmsId = $('#door').attr('data-bms-id');
          var expectedObj = {};
          expectedObj[doorBmsId] = {
            'stroke-width': 1
          };
          expect(viewInstance.attributeValues).toEqual(expectedObj);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('checkObservers should set and merge attributes values ONLY coming from observer(s) passed as argument', function(done) {

        var promise = viewInstance.checkObserver(observer1);
        promise.then(function() {
          var doorBmsId = $('#door').attr('data-bms-id');
          var expectedObj = {};
          expectedObj[doorBmsId] = {
            'fill': 'green'
          };
          expect(viewInstance.attributeValues).toEqual(expectedObj);
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

    });

    describe('event tests', function() {

      var executeEvent;

      beforeEach(function(done) {

        viewInstance.addEvent('executeEvent', {
          selector: '#someselector',
          name: 'someevent'
        }).then(function(evt) {
          executeEvent = evt;
          done();
        });

      });

      it('one event should exists', function(done) {
        expect(viewInstance.getEvents().length).toBe(1);
        done();
      });

      it('adding unknown js event should reject with error', function(done) {

        var error;
        var promise = viewInstance.addEvent('unknownEvent', {});
        promise.then(function() {}, function(err) {
          error = err;
        }).finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

      });

      it('adding unknown json event should reject with error', function(done) {

        var error;
        var promise = viewInstance.addEvent('unknownEvent', {});
        promise.then(function() {}, function(err) {
          error = err;
        }).finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

      });

    });

  });

});

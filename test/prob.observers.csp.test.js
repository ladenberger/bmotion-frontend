define(['prob.observers.csp'], function() {

  "use strict";

  describe('prob.observers.csp', function() {

    var bmsVisualizationService;
    var cspEventObserver;
    var cspEventObserverInstance;
    var probWsService;
    var viewInstance;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var ws;
    var $q;

    beforeEach(module('prob.observers.csp'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _probWsService_, _cspEventObserver_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        cspEventObserver = _cspEventObserver_;
        probWsService = _probWsService_;
        $rootScope = _$rootScope_;
        ws = _ws_;
        $q = _$q_;

        var manifestData = {
          "model": "model/m3.bcm",
          "views": [{
            "id": viewId,
            "name": "Lift environment",
            "template": "lift.html"
          }]
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

          defer.resolve({
            'someid': {
              'exp1': '{evt1.1.1,evt2.1.2,evt3.1.3}',
              'exp2': '{evt0}'
            }
          });

          return defer.promise;

        });

        var promise = bmsSessionService.initSession(manifestPath);
        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(function(bmsSessionInstance) {

          viewInstance = new bmsVisualization(viewId, bmsSessionInstance);
          cspEventObserverInstance = new cspEventObserver(viewInstance, {
            selector: '#someselector',
            observers: [{
              exp: "exp1",
              actions: [{
                selector: "#selector{{a2}}",
                attr: "fill",
                value: "green"
              }]
            }, {
              exp: "exp2",
              actions: [{
                selector: "#someotherselector",
                attr: "fill",
                value: "red"
              }]
            }, {
              events: ["evt3.1.3"],
              actions: [{
                selector: "#selector1",
                attr: "fill",
                value: "yellow"
              }]
            }]
          });

          spyOn(viewInstance, "getBmsIds").and.callFake(function(arg) {
            if (arg === '#selector1') {
              return ['bmsid1'];
            } else if (arg === '#selector2') {
              return ['bmsid2'];
            } else if (arg === '#someotherselector') {
              return ['bmsid3'];
            } else if (arg === '#selector3') {
              return ['bmsid4'];
            }
          });

          spyOn(cspEventObserverInstance, "getId").and.callFake(function(evt, args) {
            return 'someid';
          });

        }).finally(done);

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
          'exp1': ['evt1.1.1', 'evt2.1.2', 'evt3.1.3'],
          'exp2': ['evt0']
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
          name: 'evt1',
          opString: 'evt1.1.1',
          parameters: ['1', '1'],
          group: 'past'
        }, {
          name: 'evt2',
          opString: 'evt2.1.2',
          parameters: ['1', '2'],
          group: 'current'
        }, {
          name: 'evt3',
          opString: 'evt3.1.3',
          parameters: ['1', '3'],
          group: 'future'
        }]);

        return deferred.promise;

      });

      var promise = cspEventObserverInstance.check();
      promise.then(function(attributeValues) {
        expect(attributeValues).toEqual({
          'bmsid1': {
            'fill': 'green'
          },
          'bmsid2': {
            'fill': 'green'
          }
        });
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('override attribute values', function(done) {

      spyOn(probWsService, "observeHistory").and.callFake(function(evt, args) {

        var deferred = $q.defer();

        deferred.resolve([{
          name: 'evt1',
          opString: 'evt1.1.1',
          parameters: ['1', '1'],
          group: 'past'
        }, {
          name: 'evt0',
          opString: 'evt0',
          group: 'past'
        }, {
          name: 'evt3',
          opString: 'evt3.1.3',
          parameters: ['1', '3'],
          group: 'current'
        }]);

        return deferred.promise;

      });

      var promise = cspEventObserverInstance.check();
      promise.then(function(attributeValues) {
        expect(attributeValues).toEqual({
          'bmsid1': {
            'fill': 'yellow'
          },
          'bmsid3': {
            'fill': 'red'
          },
          'bmsid4': {
            'fill': 'green'
          }
        });
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

  });

});

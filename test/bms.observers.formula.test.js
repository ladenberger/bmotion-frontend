define(['bms.observers.formula'], function() {

  "use strict";

  describe('bms.observers.formula', function() {

    var bmsVisualizationService;
    var formulaObserver;
    var formulaObserverInstance;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

    beforeEach(module('bms.observers.formula'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _formulaObserver_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        formulaObserver = _formulaObserver_;
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

        var promise = bmsSessionService.initSession(manifestPath);
        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(function(bmsSessionInstance) {
          viewInstance = new bmsVisualization(viewId, bmsSessionInstance);
          formulaObserverInstance = new formulaObserver(viewInstance, {
            selector: '#someselector',
            formulas: ['formula1', 'formula2'],
            trigger: function() {
              return {
                'stroke-width': 1
              };
            }
          });

          // Simulate apply function of formula observer
          spyOn(formulaObserverInstance, "apply").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve({
              'somebmsid': {
                'stroke-width': 1
              }
            });
            return deferred.promise;
          });

        }).finally(done);

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

    it('check function should return attribute values of observer', function(done) {

      var promise = formulaObserverInstance.check(viewInstance, {
        'formula1': 'res1',
        'formula2': 'res2'
      });
      promise.then(function(attributeValues) {
        expect(attributeValues).toEqual({
          'somebmsid': {
            'stroke-width': 1
          }
        });
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

  });

});

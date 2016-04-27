define(['bms.visualization'], function() {

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

    beforeEach(module('bms.visualization'));

    beforeEach(function(done) {

      inject(function(bmsSessionService, bmsWsService, bmsVisualization, _bmsVisualizationService_, _ws_, _$q_, _$rootScope_, $httpBackend) {

        bmsVisualizationService = _bmsVisualizationService_;
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
        promise.then(function(_bmsSessionInstance_) {
          var bmsSessionInstance = _bmsSessionInstance_;
          viewInstance = new bmsVisualization(viewId, bmsSessionInstance);
        }).finally(done);

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
          selector: '#someselector',
          formulas: ['formula1', 'formula2'],
          trigger: function() {
            return {
              'fill': 'green'
            };
          }
        }), viewInstance.addObserver('formula', {
          selector: '#someselector',
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
          spyOn(observer1, 'shouldBeChecked').and.callFake(function(evt, args) {
            return true;
          });
          spyOn(observer2, 'shouldBeChecked').and.callFake(function(evt, args) {
            return true;
          });

          // Simulate apply function of formula observer
          spyOn(observer1, "apply").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve({
              'somebmsid': {
                'fill': 'green'
              }
            });
            return deferred.promise;
          });
          spyOn(observer2, "apply").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve({
              'somebmsid': {
                'stroke-width': 1
              }
            });
            return deferred.promise;
          });

          result[observer1.getId()] = {
            'formula1': 'result1',
            'formula2': 'result2'
          };

          result[observer2.getId()] = {
            'formula1': 'result1'
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
        var formulas1 = formulas[observer1.getId()];
        var formulas2 = formulas[observer2.getId()];
        expect(formulas1.formulas.length).toBe(2);
        expect(formulas2.formulas.length).toBe(1);
      }));

      it('evaluateFormulas should return map with formula -> result entries', function(done) {

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
          expect(viewInstance.attributeValues).toEqual({
            'somebmsid': {
              'fill': 'green',
              'stroke-width': 1
            }
          });
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('checkObservers should set and merge attributes values ONLY coming from observer(s) passed as argument', function(done) {

        var promise = viewInstance.checkObservers([observer2]);
        promise.then(function() {
          expect(viewInstance.attributeValues).toEqual({
            'somebmsid': {
              'stroke-width': 1
            }
          });
        }).finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      });

      it('checkObservers should set and merge attributes values ONLY coming from observer(s) passed as argument', function(done) {

        var promise = viewInstance.checkObserver(observer1);
        promise.then(function() {
          expect(viewInstance.attributeValues).toEqual({
            'somebmsid': {
              'fill': 'green'
            }
          });
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

define([
  'sharedTest',
  'jquery',
  'bms.handlers.method'
], function(sharedTest, $) {

  "use strict";

  describe('bms.handlers.method', function() {

    var methodEvent;
    var methodEventInstance;
    var bmsWsService;

    beforeEach(module('bms.handlers.method'));

    beforeEach(function(done) {
      inject(function(_methodEvent_, _bmsWsService_) {

        methodEvent = _methodEvent_;
        bmsWsService = _bmsWsService_;

        sharedTest.setup(done, function() {
          methodEventInstance = new methodEvent(viewInstance, {
            selector: '#door',
            method: 'testMethod',
            args: ['arg1', 'arg2']
          });
        });

      });

    });

    it('(1) should exist', inject(function() {
      expect(methodEventInstance).toBeDefined();
    }));

    it('(2) should implement functions: getId and getDefaultOptions', inject(function() {
      expect(methodEventInstance.getId).toBeDefined();
      expect(methodEventInstance.getDefaultOptions).toBeDefined();
    }));

    it('(3) setup should reject if no selector or element is given', function(done) {

      methodEventInstance.options.selector = undefined;
      var promise = methodEventInstance.setup();
      var error;

      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });

    it('(4) setup should resolve', function(done) {

      spyOn(bmsWsService, "callMethod").and.callFake(function(evt, args) {
        var deferred = $q.defer();
        deferred.resolve();
        return deferred.promise;
      });

      var promise = methodEventInstance.setup();

      promise.then(function() {
        // TODO Check if click handler is registered and call manually
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(5) shouldBeChecked should return true if given refinement is in animation', function() {
      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      methodEventInstance.options.refinement = 'm3';
      expect(methodEventInstance.shouldBeChecked()).toBeTruthy();
    });

    it('(6) shouldBeChecked should return false if given refinement is not in animation', function() {
      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      methodEventInstance.options.refinement = 'm3';
      expect(methodEventInstance.shouldBeChecked()).toBe(false);
    });

  });

});

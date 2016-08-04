define([
  'sharedTest',
  'jquery',
  'bms.observers.method'
], function(sharedTest, $) {

  "use strict";

  describe('bms.observers.method', function() {

    var methodObserver;
    var methodObserverInstance;
    var bmsWsService;
    var $q;

    beforeEach(module('bms.observers.method'));

    beforeEach(function(done) {
      inject(function(_methodObserver_, _bmsWsService_, _$q_) {

        methodObserver = _methodObserver_;
        bmsWsService = _bmsWsService_;
        $q = _$q_;

        sharedTest.setup(done, function() {
          methodObserverInstance = new methodObserver(window.viewInstance, {
            selector: '#door',
            method: 'testMethod',
            args: ['arg1', 'arg2']
          });
        });

      });

    });

    it('(1) should exist', inject(function() {
      expect(methodObserver).toBeDefined();
    }));

    it('(2) should implement functions: getId and getDefaultOptions', inject(function() {
      expect(methodObserverInstance.getId).toBeDefined();
      expect(methodObserverInstance.getDefaultOptions).toBeDefined();
    }));

    it('(3) check function should call callback function and return attribute values', function(done) {

      spyOn(bmsWsService, "callMethod").and.callFake(function(evt, args) {
        var deferred = $q.defer();
        deferred.resolve('returnValue');
        return deferred.promise;
      });

      var doorElement = $('#door');
      methodObserverInstance.options.callback = function(origin, data) {
        // Origin should be passed to callback function
        expect(origin).toEqual(doorElement);
        expect('returnValue').toEqual(data);
        return {
          'fill': 'green'
        };
      };

      var promise = methodObserverInstance.check();
      promise.then(function(attributeValues) {
        var doorBmsId = doorElement.attr('data-bms-id');
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

    it('(4) check function should reject if an error occurred while executing event on server side', function(done) {

      spyOn(bmsWsService, "callMethod").and.callFake(function(evt, args) {
        var deferred = $q.defer();
        deferred.reject('someError');
        return deferred.promise;
      });

      var promise = methodObserverInstance.check();
      var error;
      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });


    it('(5) shouldBeChecked should return true if given refinement is in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      methodObserverInstance.options.refinement = 'm3';
      expect(methodObserverInstance.shouldBeChecked()).toBeTruthy();
    });

    it('(6) shouldBeChecked should return false if given refinement is NOT in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      methodObserverInstance.options.refinement = 'm3';
      expect(methodObserverInstance.shouldBeChecked()).toBe(false);
    });

    it('(7) shouldBeChecked should return false if model is not initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': false
      };
      expect(methodObserverInstance.shouldBeChecked()).toBe(false);
    });

    it('(8) shouldBeChecked should return true if model is initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true
      };
      expect(methodObserverInstance.shouldBeChecked()).toBe(true);
    });

    it('(9) shouldBeChecked should return false if model is initialized and given refinement is not in animation', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true,
        'model': {
          'refinements': ['m1']
        }
      };
      methodObserverInstance.options.refinement = 'm3';
      expect(methodObserverInstance.shouldBeChecked()).toBe(false);
    });

  });

});

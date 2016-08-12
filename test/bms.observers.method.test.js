define([
  'sharedTest',
  'jquery',
  'bms.func',
  'bms.observers.method'
], function(sharedTest, $, bms) {

  "use strict";

  describe('bms.observers.method', function() {

    var observerService;
    var observerInstance;
    var view;
    var bmsWsService;
    var $q;

    beforeEach(module('bms.observers.method'));

    beforeEach(function(done) {
      inject(function(_methodObserver_, _bmsWsService_, _$q_) {

        bmsWsService = _bmsWsService_;
        $q = _$q_;

        observerService = _methodObserver_;
        observerInstance = {
          type: "method",
          id: bms.uuid(),
          options: {
            selector: '#door',
            method: 'testMethod',
            args: ['arg1', 'arg2']
          }
        };
        sharedTest.setup(done, function(_view_) {
          view = _view_;
        });

      });

    });

    it('(1) should exist', inject(function() {
      expect(observerService).toBeDefined();
    }));

    it('(2) should implement functions: getId and getDefaultOptions', inject(function() {
      expect(observerService.getDefaultOptions).toBeDefined();
    }));

    it('(3) check function should call callback function and return attribute values', function(done) {

      spyOn(bmsWsService, "callMethod").and.callFake(function(evt, args) {
        var deferred = $q.defer();
        deferred.resolve('returnValue');
        return deferred.promise;
      });

      var doorElement = $('#door');
      observerInstance.options.callback = function(origin, data) {
        // Origin should be passed to callback function
        expect(origin).toEqual(doorElement);
        expect('returnValue').toEqual(data);
        return {
          'fill': 'green'
        };
      };

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, doorElement);
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

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element);
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
      observerInstance.options.refinement = 'm3';
      expect(observerService.shouldBeChecked(observerInstance, view)).toBeTruthy();
    });

    it('(6) shouldBeChecked should return false if given refinement is NOT in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      observerInstance.options.refinement = 'm3';
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(false);
    });

    it('(7) shouldBeChecked should return false if model is not initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': false
      };
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(false);
    });

    it('(8) shouldBeChecked should return true if model is initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true
      };
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(true);
    });

    it('(9) shouldBeChecked should return false if model is initialized and given refinement is not in animation', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true,
        'model': {
          'refinements': ['m1']
        }
      };
      observerInstance.options.refinement = 'm3';
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(false);
    });

  });

});

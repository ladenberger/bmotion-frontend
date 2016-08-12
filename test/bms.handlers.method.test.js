define([
  'sharedTest',
  'jquery',
  'bms.func',
  'bms.handlers.method'
], function(sharedTest, $, bms) {

  "use strict";

  describe('bms.handlers.method', function() {

    var handlerService;
    var handlerInstance;
    var view;
    var bmsWsService;

    beforeEach(module('bms.handlers.method'));

    beforeEach(function(done) {
      inject(function(_methodEvent_, _bmsWsService_) {

        bmsWsService = _bmsWsService_;
        handlerService = _methodEvent_;
        handlerInstance = {
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
      expect(handlerService).toBeDefined();
    }));

    it('(2) should implement functions: getDefaultOptions', inject(function() {
      expect(handlerService.getDefaultOptions).toBeDefined();
    }));

    it('(3) setup should reject if no selector or element is given', function(done) {

      handlerInstance.options.selector = '';
      handlerInstance.options.element = '';

      var element = view.determineElement(handlerInstance);
      var promise = handlerService.setup(handlerInstance, view, element);
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

      var element = view.determineElement(handlerInstance);
      var promise = handlerService.setup(handlerInstance, view, element);

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
      handlerInstance.options.refinement = 'm3';
      expect(handlerService.shouldBeChecked(handlerInstance, view)).toBeTruthy();
    });

    it('(6) shouldBeChecked should return false if given refinement is not in animation', function() {
      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      handlerInstance.options.refinement = 'm3';
      expect(handlerService.shouldBeChecked(handlerInstance, view)).toBe(false);
    });

  });

});

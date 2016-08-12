define([
  'sharedTest',
  'jquery',
  'bms.func',
  'prob.observers.refinement'
], function(sharedTest, $, bms) {

  "use strict";

  describe('prob.observers.refinement', function() {

    var observerService;
    var observerInstance;
    var view;

    beforeEach(module('prob.observers.refinement'));

    beforeEach(function(done) {
      inject(function(_refinementObserver_) {

        observerService = _refinementObserver_;
        observerInstance = {
          type: "refinement",
          id: bms.uuid(),
          options: {
            selector: '#door',
            refinement: 'ref1'
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

    it('(2) should implement functions: getFormulas and getDefaultOptions', inject(function() {
      expect(observerService.getDefaultOptions).toBeDefined();
    }));

    it('(3) check function should resolve if no selector is given', function(done) {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };

      observerInstance.options.selector = undefined;
      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element);
      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolve
        done();
      });

    });

    it('(4) check function should return enable attribute values of observer if refinement is in animation', function(done) {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['ref1']
        }
      };
      observerInstance.options.enable = function(origin) {
        expect(origin).toBeInDOM();
        return {
          'opacity': 1
        }
      };

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element);
      var doorBmsId = $('#door').attr('data-bms-id');
      promise.then(function(attributeValues) {
        var expectedObj = {};
        expectedObj[doorBmsId] = {
          'opacity': 1
        };
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(5) check function should return disable attribute values of observer if refinement is not in animation', function(done) {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };

      observerInstance.options.disable = function(origin) {
        expect(origin).toBeInDOM();
        return {
          'opacity': 0
        }
      };

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element);
      var doorBmsId = $('#door').attr('data-bms-id');
      promise.then(function(attributeValues) {
        var expectedObj = {};
        expectedObj[doorBmsId] = {
          'opacity': 0
        };
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

  });

});

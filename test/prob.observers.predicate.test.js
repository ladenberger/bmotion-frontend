define([
  'sharedTest',
  'jquery',
  'bms.func',
  'prob.observers.predicate'
], function(sharedTest, $, bms) {

  "use strict";

  describe('prob.observers.predicate', function() {

    var observerService;
    var observerInstance;
    var view;

    beforeEach(module('prob.observers.predicate'));

    beforeEach(function(done) {
      inject(function(_predicateObserver_) {

        observerService = _predicateObserver_;
        observerInstance = {
          type: "predicate",
          id: bms.uuid(),
          options: {
            selector: '#door',
            predicate: 'predicate1'
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

    it('(2) should implement functions: getFormulas, getDefaultOptions and getDiagramData', inject(function() {
      expect(observerService.getFormulas).toBeDefined();
      expect(observerService.getDefaultOptions).toBeDefined();
      expect(observerService.getDiagramData).toBeDefined();
    }));

    it('(3) getFormulas function should return one formula objects', inject(function() {
      var element = view.determineElement(observerInstance);
      expect(observerService.getFormulas(observerInstance, view, element).length).toBe(1);
    }));

    it('(4) check function should reject if formulas contain errors', function(done) {

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element, {
        'predicate1': {
          'formula': 'predicate1',
          'result': 'TRUE',
          'error': 'someerror'
        }
      });

      var error;
      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });

    it('(5) check function should reject if no results were passed', function(done) {

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

    it('(6) check function should return true attribute values of observer if result of predicate is true', function(done) {

      observerInstance.options.true = function(origin) {
        // Origin should be passed to true function
        expect(origin).toBeInDOM();
        return {
          'fill': 'green'
        }
      };

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element, {
        'predicate1': {
          'formula': 'predicate1',
          'result': 'TRUE'
        }
      });
      var doorBmsId = $('#door').attr('data-bms-id');
      promise.then(function(attributeValues) {
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

    it('(7) check function should return false attribute values of observer if result of predicate is false', function(done) {

      observerInstance.options.false = function(origin) {
        // Origin should be passed to false function
        expect(origin).toBeInDOM();
        return {
          'fill': 'red'
        }
      };

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element, {
        'predicate1': {
          'formula': 'predicate1',
          'result': 'FALSE'
        }
      });

      var doorBmsId = $('#door').attr('data-bms-id');
      promise.then(function(attributeValues) {
        var expectedObj = {};
        expectedObj[doorBmsId] = {
          'fill': 'red'
        };
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(8) check function should call true function if result of predicate is true (element passed)', function(done) {

      var doorElement = $('#door');
      observerInstance.options.element = doorElement;
      observerInstance.options.true = function(origin) {
        // Origin should be passed to true function
        expect(origin).toEqual(doorElement);
      };

      var promise = observerService.check(observerInstance, view, doorElement, {
        'predicate1': {
          'formula': 'predicate1',
          'result': 'TRUE'
        }
      });
      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(9) check function should resolve if result is boolean value', function(done) {

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element, {
        'predicate1': {
          'formula': 'predicate1',
          'result': false
        }
      });

      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(10) shouldBeChecked should return true if given refinement is in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      observerInstance.options.refinement = 'm3';
      expect(observerService.shouldBeChecked(observerInstance, view)).toBeTruthy();
    });

    it('(11) shouldBeChecked should return false if given refinement is not in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      observerInstance.options.refinement = 'm3';
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(false);
    });

    it('(12) shouldBeChecked should return false if model is not initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': false
      };
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(false);
    });

    it('(13) shouldBeChecked should return true if model is initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true
      };
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(true);
    });

    it('(14) shouldBeChecked should return false if model is initialized and given refinement is not in animation', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true,
        'model': {
          'refinements': ['m1']
        }
      };
      observerInstance.options.refinement = 'm3';
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(false);
    });

    it('(15) apply function should resolve if no selector is given', function(done) {

      observerInstance.options.selector = undefined;
      var element = view.determineElement(observerInstance);
      var promise = observerService.apply(observerInstance, view, element, view.container, true);
      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolve
        done();
      });

    });

  });

});

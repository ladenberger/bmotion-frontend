define([
  'sharedTest',
  'jquery',
  'bms.observers.formula'
], function(sharedTest, $) {

  "use strict";

  describe('bms.observers.formula', function() {

    var formulaObserver;
    var formulaObserverInstance;

    beforeEach(module('bms.observers.formula'));

    beforeEach(function(done) {
      inject(function(_formulaObserver_) {

        formulaObserver = _formulaObserver_;
        sharedTest.setup(done, function() {
          formulaObserverInstance = new formulaObserver(window.viewInstance, {
            selector: '#door',
            formulas: ['door', 'floor']
          });
        });

      });

    });

    it('(1) should exist', inject(function() {
      expect(formulaObserver).toBeDefined();
    }));

    it('(2) should implement functions: getId, getFormulas and getDefaultOptions', inject(function() {
      expect(formulaObserverInstance.getId).toBeDefined();
      expect(formulaObserverInstance.getFormulas).toBeDefined();
      expect(formulaObserverInstance.getDefaultOptions).toBeDefined();
      expect(formulaObserverInstance.getDiagramData).toBeDefined();
    }));

    it('(3) getFormulas function should return two formula objects', inject(function() {
      expect(formulaObserverInstance.getFormulas().length).toBe(2);
    }));

    it('(4) check function should reject if formulas contain errors', function(done) {

      var promise = formulaObserverInstance.check({
        'door': {
          formula: 'door',
          result: 'closed',
          error: 'some error'
        },
        'floor': {
          formula: 'floor',
          result: '1'
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

      var promise = formulaObserverInstance.check();

      var error;
      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });

    it('(6) check function should reject if not all results were passed', function(done) {

      var promise = formulaObserverInstance.check({
        'door': {
          formula: 'door',
          result: 'closed'
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

    it('(7) check function should call trigger function and return attribute values (element passed)', function(done) {

      var doorElement = $('#door');
      formulaObserverInstance.options.element = doorElement;
      formulaObserverInstance.options.trigger = function(origin, results) {
        // Origin should be passed to trigger function
        expect(origin).toEqual(doorElement);
        // Results should be passed to trigger function
        expect(['closed', '1']).toEqual(results);
        return {
          'stroke-width': 1
        };
      };

      var promise = formulaObserverInstance.check({
        'door': {
          formula: 'door',
          result: 'closed'
        },
        'floor': {
          formula: 'floor',
          result: '1'
        }
      });

      var doorBmsId = doorElement.attr('data-bms-id');
      promise.then(function(attributeValues) {
        var expectedObj = {};
        expectedObj[doorBmsId] = {
          'stroke-width': 1
        };
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(8) check function should call trigger function and return attribute values (selector passed)', function(done) {

      formulaObserverInstance.options.trigger = function(origin, results) {
        // Origin should be passed to trigger function
        expect(origin).toBeInDOM();
        // Results should be passed to trigger function
        expect(['closed', '1']).toEqual(results);
        return {
          'stroke-width': 1
        };
      };

      var promise = formulaObserverInstance.check({
        'door': {
          formula: 'door',
          result: 'closed'
        },
        'floor': {
          formula: 'floor',
          result: '1'
        }
      });

      var doorBmsId = $('#door').attr('data-bms-id');
      promise.then(function(attributeValues) {
        var expectedObj = {};
        expectedObj[doorBmsId] = {
          'stroke-width': 1
        };
        expect(attributeValues).toEqual(expectedObj);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(9) check function should call trigger function if no selector or element was passed', function(done) {

      formulaObserverInstance.options.selector = undefined;
      formulaObserverInstance.options.trigger = function(results) {
        // Results should be passed to trigger function
        expect(['closed', '1']).toEqual(results);
      };

      var promise = formulaObserverInstance.check({
        'door': {
          formula: 'door',
          result: 'closed'
        },
        'floor': {
          formula: 'floor',
          result: '1'
        }
      });

      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(10) check function should call trigger function if formula result is boolean value', function(done) {

      formulaObserverInstance.options.trigger = function(origin, results) {
        // Origin should be passed to trigger function
        expect(origin).toBeInDOM();
        // Results should be passed to trigger function
        expect([false, true]).toEqual(results);
      };

      var promise = formulaObserverInstance.check({
        'door': {
          formula: 'door',
          result: false
        },
        'floor': {
          formula: 'floor',
          result: true
        }
      });

      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(11) shouldBeChecked should return true if given refinement is in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      formulaObserverInstance.options.refinement = 'm3';
      expect(formulaObserverInstance.shouldBeChecked()).toBeTruthy();
    });

    it('(12) shouldBeChecked should return false if given refinement is NOT in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      formulaObserverInstance.options.refinement = 'm3';
      expect(formulaObserverInstance.shouldBeChecked()).toBe(false);
    });

    it('(13) shouldBeChecked should return false if model is not initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': false
      };
      expect(formulaObserverInstance.shouldBeChecked()).toBe(false);
    });

    it('(14) shouldBeChecked should return true if model is initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true
      };
      expect(formulaObserverInstance.shouldBeChecked()).toBe(true);
    });

    it('(15) shouldBeChecked should return false if model is initialized and given refinement is not in animation', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true,
        'model': {
          'refinements': ['m1']
        }
      };
      formulaObserverInstance.options.refinement = 'm3';
      expect(formulaObserverInstance.shouldBeChecked()).toBe(false);
    });

  });

});

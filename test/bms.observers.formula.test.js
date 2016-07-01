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

    it('(4) apply function should reject if no selector is given', function(done) {

      formulaObserverInstance.options.selector = undefined;
      var promise = formulaObserverInstance.apply(['closed', '1']);
      var error;

      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });

    it('(5) check function should reject if formulas contain errors', function(done) {

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

    it('(6) check function should reject if no selector was set', function(done) {

      formulaObserverInstance.options.selector = undefined;

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

      var error;
      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });

    it('(7) check function should reject if no results were passed', function(done) {

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

    it('(8) check function should reject if not all results were passed', function(done) {

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

    it('(9) check function should call trigger function and return attribute values)', function(done) {

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

    it('(10) shouldBeChecked should return true if given refinement is in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      formulaObserverInstance.options.refinement = 'm3';
      expect(formulaObserverInstance.shouldBeChecked()).toBeTruthy();
    });

    it('(11) shouldBeChecked should return false if given refinement is NOT in animation', function() {
      window.bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      formulaObserverInstance.options.refinement = 'm3';
      expect(formulaObserverInstance.shouldBeChecked()).toBe(false);
    });

  });

});

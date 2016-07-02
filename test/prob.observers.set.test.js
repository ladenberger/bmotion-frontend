define([
  'sharedTest',
  'jquery',
  'prob.observers.set'
], function(sharedTest, $) {

  "use strict";

  describe('prob.observers.set', function() {

    var setObserver;
    var setObserverInstance;

    beforeEach(module('prob.observers.set'));

    beforeEach(function(done) {
      inject(function(_setObserver_) {

        setObserver = _setObserver_;

        sharedTest.setup(done, function() {
          setObserverInstance = new setObserver(viewInstance, {
            selector: '#request',
            set: 'request',
            convert: function(element) {
              return "#label_floor_" + element;
            }
          });
        });

      });

    });

    it('(1) should exist', inject(function() {
      expect(setObserver).toBeDefined();
    }));

    it('(2) should implement functions: getId, getFormulas and getDefaultOptions', inject(function() {
      expect(setObserverInstance.getId).toBeDefined();
      expect(setObserverInstance.getFormulas).toBeDefined();
      expect(setObserverInstance.getDefaultOptions).toBeDefined();
      expect(setObserverInstance.getDiagramData).toBeDefined();
    }));

    it('(3) getFormulas function should return one formula object', inject(function() {
      expect(setObserverInstance.getFormulas().length).toBe(1);
    }));

    it('(4) check function should reject if formulas contain errors', function(done) {

      var promise = setObserverInstance.check({
        'request': {
          formula: 'request',
          result: [-1, 0, 1],
          error: 'someerror'
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

      var promise = setObserverInstance.check();

      var error;
      promise.then(function() {}, function(err) {
        error = err;
      }).finally(function() {
        expect(error).toBeDefined();
        expect(promise.$$state.status).toBe(2); // Rejected
        done();
      });

    });

    it('(6) check function should call trigger function (with origin and set elements)', function(done) {

      setObserverInstance.options.trigger = function(origin, set) {
        // Origin should be passed to trigger function
        expect(origin).toBeInDOM();
        // Set should be passed to trigger function
        expect(set).toBeInDOM();
        done();
      };

      var promise = setObserverInstance.check({
        'request': {
          formula: 'request',
          result: [-1, 0, 1]
        }
      });
      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
      });

    });

    it('(7) check function should call trigger function (with origin and set elements) (element was passed)', function(done) {

      var requestElement = $("#request");
      setObserverInstance.options.element = requestElement;
      setObserverInstance.options.trigger = function(origin, set) {
        // Origin should be passed to trigger function
        expect(origin).toEqual(requestElement);
        // Set should be passed to trigger function
        expect(set).toBeInDOM();
        done();
      };

      var promise = setObserverInstance.check({
        'request': {
          formula: 'request',
          result: [-1, 0, 1]
        }
      });
      promise.then(function() {}).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
      });

    });

    it('(8) shouldBeChecked should return true if given refinement is in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      setObserverInstance.options.refinement = 'm3';

      expect(setObserverInstance.shouldBeChecked()).toBeTruthy();

    });

    it('(9) shouldBeChecked should return false if given refinement is not in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      setObserverInstance.options.refinement = 'm3';

      expect(setObserverInstance.shouldBeChecked()).toBe(false);

    });

    it('(10) shouldBeChecked should return false if model is not initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': false
      };
      expect(setObserverInstance.shouldBeChecked()).toBe(false);
    });

    it('(11) shouldBeChecked should return true if model is initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true
      };
      expect(setObserverInstance.shouldBeChecked()).toBe(true);
    });

    it('(12) shouldBeChecked should return false if model is initialized and given refinement is not in animation', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true,
        'model': {
          'refinements': ['m1']
        }
      };
      setObserverInstance.options.refinement = 'm3';
      expect(setObserverInstance.shouldBeChecked()).toBe(false);
    });

  });

});

define([
  'sharedTest',
  'jquery',
  'prob.observers.refinement'
], function(sharedTest, $) {

  "use strict";

  describe('prob.observers.refinement', function() {

    var refinementObserver;
    var refinementObserverInstance;

    beforeEach(module('prob.observers.refinement'));

    beforeEach(function(done) {
      inject(function(_refinementObserver_) {

        refinementObserver = _refinementObserver_;

        sharedTest.setup(done, function() {
          refinementObserverInstance = new refinementObserver(viewInstance, {
            selector: '#door',
            refinement: 'ref1'
          });
        });

      });

    });

    it('(1) should exist', inject(function() {
      expect(refinementObserver).toBeDefined();
    }));

    it('(2) should implement functions: getFormulas and getDefaultOptions', inject(function() {
      expect(refinementObserverInstance.getDefaultOptions).toBeDefined();
    }));

    it('(3) apply function should resolve if no selector is given', function(done) {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };

      refinementObserverInstance.options.selector = undefined;
      var promise = refinementObserverInstance.apply();
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
      refinementObserverInstance.options.enable = function(origin) {
        expect(origin).toBeInDOM();
        return {
          'opacity': 1
        }
      };

      var promise = refinementObserverInstance.check();
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

      refinementObserverInstance.options.disable = function(origin) {
        expect(origin).toBeInDOM();
        return {
          'opacity': 0
        }
      };

      var promise = refinementObserverInstance.check();

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

define([
  'sharedTest',
  'jquery',
  'bms.func',
  'prob.observers.set'
], function(sharedTest, $, bms) {

  "use strict";

  describe('prob.observers.set', function() {

    var observerService;
    var observerInstance;
    var view;

    beforeEach(module('prob.observers.set'));

    beforeEach(function(done) {
      inject(function(_setObserver_) {

        observerService = _setObserver_;
        observerInstance = {
          type: "predicate",
          id: bms.uuid(),
          options: {
            selector: '#request',
            set: 'request',
            convert: function(element) {
              return "#label_floor_" + element;
            },
            actions: [{
              attr: 'fill',
              value: 'green'
            }]
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

    it('(3) getFormulas function should return one formula object', inject(function() {
      var element = view.determineElement(observerInstance);
      expect(observerService.getFormulas(observerInstance, view, element).length).toBe(1);
    }));

    it('(4) check function should reject if formulas contain errors', function(done) {

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element, {
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

    it('(6) check function should call trigger function (with origin and set elements)', function(done) {

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element, {
        'request': {
          formula: 'request',
          result: [-1, 0, 1]
        }
      });
      promise.then(function(attributeValues) {

        var requestId1 = $('#label_floor_-1').attr("data-bms-id");
        var requestId2 = $('#label_floor_1').attr("data-bms-id");
        var requestId3 = $('#label_floor_0').attr("data-bms-id");

        var expectObject = {};
        expectObject[requestId1] = {
          'fill': 'green'
        };
        expectObject[requestId2] = {
          'fill': 'green'
        };
        expectObject[requestId3] = {
          'fill': 'green'
        };
        expect(attributeValues).toEqual(expectObject);

      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(7) check function should call trigger function (with origin and set elements) (element was passed)', function(done) {

      var requestElement = $("#request");
      observerInstance.options.element = requestElement;

      var element = view.determineElement(observerInstance);
      var promise = observerService.check(observerInstance, view, element, {
        'request': {
          formula: 'request',
          result: [-1, 0, 1]
        }
      });
      promise.then(function(attributeValues) {

        var requestId1 = $('#label_floor_-1').attr("data-bms-id");
        var requestId2 = $('#label_floor_1').attr("data-bms-id");
        var requestId3 = $('#label_floor_0').attr("data-bms-id");

        var expectObject = {};
        expectObject[requestId1] = {
          'fill': 'green'
        };
        expectObject[requestId2] = {
          'fill': 'green'
        };
        expectObject[requestId3] = {
          'fill': 'green'
        };

        expect(attributeValues).toEqual(expectObject);

      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(8) shouldBeChecked should return true if given refinement is in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      observerInstance.options.refinement = 'm3';

      expect(observerService.shouldBeChecked(observerInstance, view)).toBeTruthy();

    });

    it('(9) shouldBeChecked should return false if given refinement is not in animation', function() {

      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      observerInstance.options.refinement = 'm3';

      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(false);

    });

    it('(10) shouldBeChecked should return false if model is not initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': false
      };
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(false);
    });

    it('(11) shouldBeChecked should return true if model is initialized', function() {
      window.bmsSessionInstance.toolData = {
        'initialized': true
      };
      expect(observerService.shouldBeChecked(observerInstance, view)).toBe(true);
    });

    it('(12) shouldBeChecked should return false if model is initialized and given refinement is not in animation', function() {
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

define([
  'sharedTest',
  'jquery',
  'bms.func',
  'prob.handlers.event'
], function(sharedTest, $, bms) {

  "use strict";

  describe('prob.handlers.event', function() {

    var handlerService;
    var handlerInstance;
    var view;

    beforeEach(module('prob.handlers.event'));

    beforeEach(function(done) {
      inject(function(_executeEventEvent_) {

        handlerService = _executeEventEvent_;
        handlerInstance = {
          type: "executeEvent",
          id: bms.uuid(),
          options: {
            events: [{
              name: 'close_door'
            }, {
              name: 'open_door'
            }]
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

    it('(4) setup should init tooltip on given selector', function(done) {

      handlerInstance.options.selector = '#door';
      handlerInstance.options.element = '';

      var element = view.determineElement(handlerInstance);
      var promise = handlerService.setup(handlerInstance, view, element);

      promise.then(function() {
        // Tooltip should be installed
        expect($('#door')).toHaveAttr('data-hasqtip');
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(5) setup should init tooltip on given element', function(done) {

      var door = $('#door');

      handlerInstance.options.selector = '';
      handlerInstance.options.element = door;

      var element = view.determineElement(handlerInstance);
      var promise = handlerService.setup(handlerInstance, view, element);

      promise.then(function() {
        // Tooltip should be installed
        expect(door).toHaveAttr('data-hasqtip');
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

    });

    it('(6) shouldBeChecked should return true if given refinement is in animation', function() {
      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1', 'm2', 'm3']
        }
      };
      handlerInstance.options.refinement = 'm3';
      expect(handlerService.shouldBeChecked(handlerInstance, view)).toBeTruthy();
    });

    it('(7) shouldBeChecked should return false if given refinement is not in animation', function() {
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

define([
  'sharedTest',
  'jquery',
  'prob.handlers.event'
], function(sharedTest, $) {

  "use strict";

  describe('prob.handlers.event', function() {

    var executeEventEvent;
    var executeEventEventInstance;

    beforeEach(module('prob.handlers.event'));

    beforeEach(function(done) {
      inject(function(_executeEventEvent_) {

        executeEventEvent = _executeEventEvent_;

        sharedTest.setup(done, function() {
          executeEventEventInstance = new executeEventEvent(viewInstance, {
            events: [{
              name: 'close_door'
            }, {
              name: 'open_door'
            }]
          });
        });

      });

    });

    it('(1) should exist', inject(function() {
      expect(executeEventEventInstance).toBeDefined();
    }));

    it('(2) should implement functions: getId and getDefaultOptions', inject(function() {
      expect(executeEventEventInstance.getId).toBeDefined();
      expect(executeEventEventInstance.getDefaultOptions).toBeDefined();
    }));

    it('(3) setup should reject if no selector or element is given', function(done) {

      var promise = executeEventEventInstance.setup();
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

      executeEventEventInstance.options.selector = '#door';
      executeEventEventInstance.options.element = '';

      var promise = executeEventEventInstance.setup();

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

      executeEventEventInstance.options.selector = '';
      executeEventEventInstance.options.element = door;

      var promise = executeEventEventInstance.setup();

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
      executeEventEventInstance.options.refinement = 'm3';
      expect(executeEventEventInstance.shouldBeChecked()).toBeTruthy();
    });

    it('(7) shouldBeChecked should return false if given refinement is not in animation', function() {
      bmsSessionInstance.toolData = {
        'model': {
          'refinements': ['m1']
        }
      };
      executeEventEventInstance.options.refinement = 'm3';
      expect(executeEventEventInstance.shouldBeChecked()).toBe(false);
    });

  });

});

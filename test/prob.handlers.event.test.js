define([
  'jquery',
  'prob.handlers.event'
], function($) {

  "use strict";

  describe('prob.handlers.event', function() {

    var bmsVisualizationService;
    var bmsSessionInstance;
    var viewInstance;
    var executeEventEvent;
    var executeEventEventInstance;
    var $rootScope;
    var viewId = 'lift';
    var sessionId = 'someSessionId';
    var viewInstance;
    var ws;
    var $q;

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('prob.handlers.event'));

    beforeEach(function(done) {
      inject(function(bmsVisualization, _executeEventEvent_, _ws_, _$q_, _$rootScope_, $httpBackend, bmsWsService, bmsSessionService) {

        executeEventEvent = _executeEventEvent_;
        $rootScope = _$rootScope_;
        ws = _ws_;
        $q = _$q_;

        var manifestData = {
          "model": "model/m3.bcm",
          "id": viewId,
          "name": "Lift environment",
          "template": "lift.html"
        };
        var manifestPath = 'somepath/bmotion.json';
        $httpBackend.when('GET', manifestPath)
          .respond(manifestData);

        spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
          var deferred = $q.defer();
          deferred.resolve(sessionId);
          return deferred.promise;
        });

        bmsSessionInstance = bmsSessionService.getSession(sessionId);

        spyOn(bmsSessionInstance, "isBVisualization").and.callFake(function(evt, args) {
          return true;
        });

        viewInstance = bmsSessionInstance.getView(viewId);

        // Set manually container of view
        loadFixtures('examples/lift.html');
        viewInstance.container = $('body');

        executeEventEventInstance = new executeEventEvent(viewInstance, {
          events: [{
            name: 'close_door'
          }, {
            name: 'open_door'
          }]
        });

        var promise = bmsSessionInstance.init(manifestPath);
        $httpBackend.expectGET(manifestPath).respond(200, manifestData);
        $httpBackend.flush();
        promise.then(done);

        $rootScope.$digest();

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

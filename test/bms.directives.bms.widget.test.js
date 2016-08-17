define([
  'jquery',
  'bms.directive.bms.widget'
], function($) {

  "use strict";

  describe('bms.directive.bms.widget', function() {

    var $compile, $rootScope;
    var viewData, manifestData, bmsSessionInstance, viewInstance;
    var templateFolder = "";
    var manifestPath = templateFolder + "/bmotion.json";
    var viewId = 'lift';
    var sessionId = 'someSessionId';

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

    beforeEach(module('bms.directive.bms.widget'));

    describe('compile tests', function() {

      beforeEach(function(done) {

        inject(function(_$compile_, _$rootScope_, $httpBackend, $q, bmsWsService, bmsSessionService) {

          manifestData = {
            "model": "model/m3.bcm",
            "id": viewId,
            "name": "Lift environment",
            "template": "lift.html"
          };

          $compile = _$compile_;
          $rootScope = _$rootScope_;

          spyOn(bmsWsService, "initSession").and.callFake(function(evt, args) {
            var deferred = $q.defer();
            deferred.resolve([{
              tool: 'BVisualization',
              templateFolder: templateFolder
            }, {
              traceId: 'someTraceId'
            }]);
            return deferred.promise;
          });

          $httpBackend.when('GET', manifestPath).respond(manifestData);

          bmsSessionInstance = bmsSessionService.getSession(sessionId);
          viewInstance = bmsSessionInstance.getView(viewId);
          var promise = bmsSessionInstance.init(manifestPath);
          promise.then(function() {

            // Set manually container of view
            loadFixtures('examples/lift.html');
            viewInstance.container = $('html');

          }).finally(done);

          $httpBackend.flush();

          $rootScope.$digest();

        });

      });

      it('iarea test', function() {

        var element = angular.element('<div bms-widget="iarea"></div>');
        var newScope = $rootScope.$new();
        newScope.sessionId = sessionId;
        newScope.id = viewId;
        $compile(element)(newScope);

      });

      it('iradio test', function() {

        var element = angular.element('<div bms-widget="iradio"></div>');
        var newScope = $rootScope.$new();
        newScope.sessionId = sessionId;
        newScope.id = viewId;
        $compile(element)(newScope);

      });

      it('icheckbox test', function() {

        var element = angular.element('<div bms-widget="icheckbox"></div>');
        var newScope = $rootScope.$new();
        newScope.sessionId = sessionId;
        newScope.id = viewId;
        $compile(element)(newScope);

      });

      it('ibutton test', function() {

        var element = angular.element('<div bms-widget="ibutton"></div>');
        var newScope = $rootScope.$new();
        newScope.sessionId = sessionId;
        newScope.id = viewId;
        $compile(element)(newScope);

      });

      it('iinput test', function() {

        var element = angular.element('<div bms-widget="iinput"></div>');
        var newScope = $rootScope.$new();
        newScope.sessionId = sessionId;
        newScope.id = viewId;
        $compile(element)(newScope);

      });

    });

  });

});

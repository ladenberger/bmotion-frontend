define([
  'sharedTest',
  'jquery',
  'prob.directive.execute.event'
], function(sharedTest, $) {

  "use strict";

  describe('prob.directive.execute.event', function() {

    var viewId = 'lift';
    var sessionId = 'someSessionId';

    beforeEach(module('prob.directive.execute.event'));

    describe('compile tests', function() {

      beforeEach(function(done) {

        inject(function($compile, $rootScope) {

          sharedTest.setup(done, function() {
            var element = angular.element('<div execute-event name="send_request" predicate="f=0"></div>');
            var newScope = $rootScope.$new();
            newScope.sessionId = sessionId;
            newScope.id = viewId;
            $compile(element)(newScope);
          });

        });

      });

      it('event should be added to view instance', function() {
        expect(window.viewInstance.getEvents().length).toBe(1);
      });

      //it('should init tooltip on given element', function() {
      //expect($(directiveElem)).toHaveAttr('data-hasqtip');
      //});

    });

  });

});

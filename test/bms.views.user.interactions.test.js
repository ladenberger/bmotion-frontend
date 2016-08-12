define([
  'jquery',
  'bms.views.user.interactions'
], function($) {

  "use strict";

  describe('bms.views.user.interactions', function() {

    var $scope;
    var directiveElem;

    beforeEach(module('bms.views.user.interactions'));

    describe('compile tests', function() {

      beforeEach(inject(function($compile, $rootScope) {

        // Simulate compilation of bmsVisualizationView directive
        var element = angular.element('<div bms-user-interaction class="userInteractionsView"></div>');
        directiveElem = $compile(element)($rootScope.$new());
        $scope = directiveElem.isolateScope();

      }));

      it('should have table element', function() {
        var tableElement = directiveElem.find('table');
        expect(tableElement.length).toBe(1);
      });

      it('scope should implement functions: gotoTraceIndex', inject(function() {
        expect($scope.gotoTraceIndex).toBeDefined();
      }));

    });

  });

});

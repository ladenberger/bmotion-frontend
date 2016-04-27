define(['bms.api'], function() {

  "use strict";

  describe('bms.api', function() {

    var bmsApiService;
    var $rootScope;

    beforeEach(module('bms.api'));

    beforeEach(inject(function(_bmsApiService_, $q, _$rootScope_) {
      bmsApiService = _bmsApiService_;
      $rootScope = _$rootScope_;
    }));

    it('should exist', inject(function() {
      expect(bmsApiService).toBeDefined();
    }));

  });

});

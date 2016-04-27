define(['bms.modal'], function() {

  "use strict";

  describe('bms.modal', function() {

    var bmsModalService;
    var $rootScope;
    var $q;
    var modal;

    beforeEach(module('bms.modal'));

    beforeEach(inject(function(_bmsModalService_, _$q_, _$rootScope_) {

      bmsModalService = _bmsModalService_;
      $rootScope = _$rootScope_;
      $q = _$q_;

    }));

    beforeEach(function(done) {

      bmsModalService.getModal()
        .then(function(_modal_) {
          modal = _modal_;
        }).finally(done);

      $rootScope.$digest();

    });

    it('should exist', function() {
      expect(bmsModalService).toBeDefined();
    });

    it('get modal function should return always the same modal instance', function(done) {
      bmsModalService.getModal().then(function(modalNew) {
        expect(modal).toEqual(modalNew);
      }).finally(done);
    });

    it('close modal should set modal instance to null', function() {
      bmsModalService.closeModal();
      expect(bmsModalService.currentModalInstance).toEqual(null);
    });

    it('end loading should close modal', function() {
      bmsModalService.endLoading()
      expect(bmsModalService.currentModalInstance).toEqual(null);
    });

  });

});

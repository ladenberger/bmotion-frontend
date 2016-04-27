define(['bms.manifest'], function() {

  "use strict";

  describe('bms.manifest', function() {

    var bmsManifestService;
    var $rootScope;
    var $q;

    beforeEach(module('bms.manifest'));

    beforeEach(inject(function(_bmsManifestService_, _$q_, _$rootScope_) {
      bmsManifestService = _bmsManifestService_;
      $rootScope = _$rootScope_;
      $q = _$q_;
    }));

    it('should exist', inject(function() {
      expect(bmsManifestService).toBeDefined();
    }));

    it('should implement functions: getManifest, getManifestData and validate', inject(function() {

      expect(bmsManifestService.getManifest).toBeDefined();
      expect(bmsManifestService.getManifestData).toBeDefined();
      expect(bmsManifestService.validate).toBeDefined();

    }));

    it('invalid manifest file name should cause error', function(done) {

      var error;
      var promise = bmsManifestService.getManifest('somepath/invalid.json');
      promise
        .then(function() {}, function(er) {
          error = er;
        })
        .finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

      $rootScope.$digest();

    });

    it('empty manifest file name should cause error', function(done) {

      var error;
      var promise = bmsManifestService.getManifest();
      promise
        .then(function() {}, function(er) {
          error = er;
        })
        .finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

      $rootScope.$digest();

    });

    it('test valid bmotion.json manifest data', function(done) {

      var manifestData = {
        views: [{
          id: "id",
          template: "template.html"
        }]
      };

      var promise = bmsManifestService.validate(manifestData);
      promise
        .then(function(data) {
          expect(data).toEqual(manifestData);
        })
        .finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      $rootScope.$digest();

    });

    it('invalid bmotion.json manifest data should cause error', function(done) {

      var manifestData = {};

      var error;
      var promise = bmsManifestService.validate(manifestData);
      promise
        .then(function() {}, function(er) {
          error = er;
        })
        .finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

      $rootScope.$digest();

    });

    it('valid manifest data should be returned', function(done) {

      spyOn(bmsManifestService, "getManifestData").and.callFake(function() {
        var defer = $q.defer();
        defer.resolve({
          views: [{
            id: "someid",
            template: "template.html"
          }]
        });
        return defer.promise;
      });

      var promise = bmsManifestService.getManifest("bmotion.json");
      promise
        .then(function(data) {
          expect(data).toBeDefined();
        })
        .finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      $rootScope.$digest();

    });

    it('invalid manifest data should cause error', function(done) {

      spyOn(bmsManifestService, "getManifestData").and.callFake(function() {
        var defer = $q.defer();
        defer.resolve({
          views: [{
            // id is missing
            template: "template.html"
          }]
        });
        return defer.promise;
      });

      var promise = bmsManifestService.getManifest("ingore");
      var error;
      promise
        .then(function(config) {}, function(er) {
          error = er;
        })
        .finally(function() {
          expect(error).toBeDefined();
          expect(promise.$$state.status).toBe(2); // Rejected
          done();
        });

      $rootScope.$digest();

    });

  });

});

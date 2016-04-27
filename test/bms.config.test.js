define(['bms.config'], function() {

  "use strict";

  describe('bms.config', function() {

    var bmsConfigService;
    var $rootScope;
    var $q;

    beforeEach(module('bms.config'));

    beforeEach(inject(function(_bmsConfigService_, _$q_, _$rootScope_) {
      bmsConfigService = _bmsConfigService_;
      $rootScope = _$rootScope_;
      $q = _$q_;
    }));

    it('should exist', inject(function() {
      expect(bmsConfigService).toBeDefined();
    }));

    it('should implement functions: getConfig and validate', inject(function() {

      expect(bmsConfigService.getConfig).toBeDefined();
      expect(bmsConfigService.getConfigData).toBeDefined();
      expect(bmsConfigService.validate).toBeDefined();

    }));

    it('test valid bmotion.json manifest data', function(done) {

      var configData = {
        "socket": {
          "host": "localhost",
          "port": "19090"
        }
      };

      var promise = bmsConfigService.validate(configData);
      promise.then(function(data) {
        expect(data).toBe(configData);
      }).finally(function() {
        expect(promise.$$state.status).toBe(1); // Resolved
        done();
      });

      $rootScope.$digest();

    });

    it('invalid bmotion.json manifest data should cause error', function(done) {

      var configData = {
        "socket": {
          "port": 19090
        }
      };

      var error;
      var promise = bmsConfigService.validate(configData);
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

    it('valid config should be returned', function(done) {

      spyOn(bmsConfigService, "getConfigData").and.callFake(function() {
        var defer = $q.defer();
        defer.resolve({
          "socket": {
            "host": "localhost",
            "port": "19090"
          }
        });
        return defer.promise;
      });

      var promise = bmsConfigService.getConfig();
      promise
        .then(function(config) {
          expect(config).toBeDefined();
        })
        .finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      $rootScope.$digest();

    });

    it('invalid config should cause error', function(done) {

      spyOn(bmsConfigService, "getConfigData").and.callFake(function() {
        var defer = $q.defer();
        defer.resolve({
          "socket": {
            "port": 19090
          }
        });
        return defer.promise;
      });

      var promise = bmsConfigService.getConfig();
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

    it('not completed configs should be normalized', function(done) {

      spyOn(bmsConfigService, "getConfigData").and.callFake(function() {
        var defer = $q.defer();
        defer.resolve({
          "socket": {
            "host": "localhost"
          }
        });
        return defer.promise;
      });

      var promise = bmsConfigService.getConfig();
      promise
        .then(function(config) {
          expect(config).toEqual({ // To equal makes a deep equality comparison
            "socket": {
              "host": "localhost",
              "port": "19090"
            }
          });
        })
        .finally(function() {
          expect(promise.$$state.status).toBe(1); // Resolved
          done();
        });

      $rootScope.$digest();

    });

  });

});

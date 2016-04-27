var bmsapi = bmsapi || {};

define([
  'angular'
], function(angular) {

  var apis = {};

  bmsapi = function(visId) {

    var api = apis[visId];
    if (!api) {

      apis[visId] = {
        eval: function(options) {
          setTimeout(function() {
            var elem = angular.element(document.querySelector('[ng-show]'));
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            service.evalExtern(visId, options);
          }, 0);
        },
        getModelData: function(what, options) {
          setTimeout(function() {
            var elem = angular.element(document.querySelector('[ng-show]'));
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            return service.getModelData(visId, what, options);
          }, 0);
        },
        getModelEvents: function(options) {
          return this.getModelData("events", options);
        },
        observe: function(what, options) {
          setTimeout(function() {
            var elem = angular.element(document.querySelector('[ng-show]'));
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            service.addObserver(visId, what, options, 'js');
          }, 0);
        },
        registerEvent: function(type, options) {
          setTimeout(function() {
            var elem = angular.element(document.querySelector('[ng-show]'));
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            service.addEvent(visId, type, options, 'js');
          }, 0);
        },
        executeEvent: function(options) {
          if (options.selector || options.element) {
            this.registerEvent('executeEvent', options);
          } else {
            var elem = angular.element(document.querySelector('[ng-show]'));
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            return service.executeEvent(visId, options);
          }
        },
        on: function(what, callback) {
          setTimeout(function() {
            var elem = angular.element(document.querySelector('[ng-show]'));
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            service.on(visId, what, callback);
          }, 0);
        },
        init: function(callback) {
          this.on("ModelInitialised", callback);
        }
      }

    }

    return apis[visId];

  };

});

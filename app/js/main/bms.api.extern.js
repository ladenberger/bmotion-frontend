var bmsapi = bmsapi || {};

define([
  'angular'
], function(angular) {

  var apis = {};

  bmsapi = function(sessionId, viewId) {

    var api = apis[viewId];
    if (!api) {

      apis[viewId] = {
        eval: function(options) {
          setTimeout(function() {
            var elem = angular.element(document.body);
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            service.evalExtern(sessionId, viewId, options);
          }, 0);
        },
        getModelData: function(what, options) {
          setTimeout(function() {
            var elem = angular.element(document.body);
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            return service.getModelData(sessionId, viewId, what, options);
          }, 0);
        },
        getModelEvents: function(options) {
          return this.getModelData("events", options);
        },
        observe: function(what, options) {
          setTimeout(function() {
            var elem = angular.element(document.body);
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            service.addObserver(sessionId, viewId, what, options);
          }, 0);
        },
        registerEvent: function(type, options) {
          setTimeout(function() {
            var elem = angular.element(document.body);
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            service.addEvent(sessionId, viewId, type, options);
          }, 0);
        },
        executeEvent: function(name, options) {
          if (options.selector || options.element) {
            this.registerEvent('executeEvent', options);
          } else {
            var elem = angular.element(document.body);
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            return service.executeEvent(sessionId, viewId, name, options);
          }
        },
        on: function(what, callback) {
          setTimeout(function() {
            var elem = angular.element(document.body);
            var injector = elem.injector();
            var service = injector.get('bmsApiService');
            service.on(sessionId, viewId, what, callback);
          }, 0);
        },
        init: function(callback) {
          this.on("ModelInitialised", callback);
        }
      }

    }

    return apis[viewId];

  };

});

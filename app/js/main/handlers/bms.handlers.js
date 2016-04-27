/**
 * BMotionWeb Handler Module
 *
 */
define([
  'angular',
  'prob.handlers.event'
], function(angular) {

  return angular.module('bms.handlers', ['prob.handlers.event'])
    .service('bmsHandlerService',
      function() {
        'use strict';
        var service = {};
        return service;
      }
    );

});

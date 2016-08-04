/**
 * BMotionWeb Handler Module
 *
 */
define([
  'angular',
  'prob.handlers.event',
  'bms.handlers.method'
], function(angular) {

  return angular.module('bms.handlers', [
      'prob.handlers.event',
      'bms.handlers.method'
    ])
    .service('bmsHandlerService',
      function() {
        'use strict';
        var service = {};
        return service;
      }
    );

});

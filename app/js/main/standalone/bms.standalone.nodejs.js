/**
 * BMotionWeb NodeJs Module
 *
 */
define([
  'angular'
], function(angular) {

  var module = angular.module('bms.standalone.nodejs', [])
    .factory('fs', function() {
      return require('fs');
    })
    .factory('path', function() {
      return require('path');
    })
    .factory('ncp', function() {
      return require('ncp');
    });
  return module;

});

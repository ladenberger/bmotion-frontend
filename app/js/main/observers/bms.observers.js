/**
 * BMotionWeb Observer Module
 *
 */
define([
  'angular',
  'bms.observers.formula',
  'prob.observers.refinement',
  'prob.observers.predicate',
  'prob.observers.csp',
  'prob.observers.set',
  'bms.observers.method'
], function(angular) {

  return angular.module('bms.observers', [
      'bms.observers.formula',
      'prob.observers.refinement',
      'prob.observers.predicate',
      'prob.observers.csp',
      'prob.observers.set',
      'bms.observers.method'
    ])
    .service('bmsObserverService',
      function() {
        'use strict';
        return {};
      });

});

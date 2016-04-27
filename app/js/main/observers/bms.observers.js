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
  'prob.observers.data'
], function(angular) {

  return angular.module('bms.observers', ['bms.observers.formula', 'prob.observers.refinement', 'prob.observers.predicate', 'prob.observers.csp', 'prob.observers.data'])
    .service('bmsObserverService',
      function() {
        'use strict';
        return {};
      });

});

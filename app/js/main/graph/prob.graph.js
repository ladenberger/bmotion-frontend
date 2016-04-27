/**
 * BMotionWeb for ProB Graph Module
 *
 */
define([
  'angular',
  'prob.graph.trace',
  'prob.graph.projection'
], function(angular) {

  return angular.module('prob.graph', ['prob.graph.trace', 'prob.graph.projection']);

});

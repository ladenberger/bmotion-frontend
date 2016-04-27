/**
 * BMotionWeb Directive SVG Module
 *
 */
define([
  'angular',
  'bms.session'
], function(angular) {

  return angular.module('bms.directive.svg', ['bms.session'])
    .directive('bmsSvg', ['$http', '$compile', '$q', 'bmsVisualizationService', 'bmsSessionService',
      function($http, $compile, $q, bmsVisualizationService, bmsSessionService) {
        'use strict';
        return {
          restrict: 'A',
          replace: false,
          link: function($scope, element, attrs) {
            var svg = attrs['bmsSvg'];
            var session = bmsSessionService.getSession($scope.sessionId);
            var view = session.getView($scope.id);
            var svgObj = view.addSvg(svg);
            svgObj.defer = $q.defer();
            var reloadTemplate = function() {
              return $http.get(session.templateFolder + '/' + svg)
                .success(function(svgCode) {
                  element.html(svgCode);
                  $compile(element.contents())($scope);
                  if (svgObj.defer) svgObj.defer.resolve();
                  if (svgObj.deferSave) svgObj.deferSave.resolve();
                });
            };
            reloadTemplate();
          }
        }
      }
    ]);

});

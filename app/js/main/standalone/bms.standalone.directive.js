define([
  'angular',
  'jquery',
  'bms.standalone.service'
], function(angular, $) {

  return angular.module('bms.standalone.directive', ['bms.standalone.service'])
    .directive('bmsDropZone', ['initVisualizationService', function(initVisualizationService) {
      return {
        link: function($scope, element, attrs) {

          // prevent default behavior from changing page on dropped file
          window.ondragover = function(e) {
            e.preventDefault();
            return false
          };
          window.ondrop = function(e) {
            e.preventDefault();
            return false
          };

          var holder = element[0];
          holder.ondragover = function() {
            $(this).addClass('dragover');
            return false;
          };
          holder.ondragleave = function() {
            $(this).removeClass('dragover');
            return false;
          };
          holder.ondrop = function(e) {
            e.preventDefault();
            $(this).removeClass('dragover');
            if (e.dataTransfer.files.length > 0) {
              var manifest = e.dataTransfer.files[0].path;
              if (manifest) {
                initVisualizationService(manifest);
              }
            }
            return false;
          };

        }
      }
    }]);

});

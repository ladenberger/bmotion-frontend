define([
  'angular'
], function(angular) {

  return angular.module('bms.view', [])
    .factory('bmsViewService', function() {

      var views = [];

      return {
        addView: function(view) {
          views.push(view);
        },
        getViews: function() {
          return views;
        }
      };

    });

});

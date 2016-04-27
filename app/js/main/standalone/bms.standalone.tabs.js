/**
 * BMotionWeb Tabs Module
 *
 */
define([
  'angular'
], function(angular) {

  return angular.module('bms.standalone.tabs', [])
    .factory('bmsTabsService', function() {

      var tabs = [];

      return {
        addProjectionDiagramTab: function() {
          tabs.push({
            title: 'Projection Diagram',
            content: 'projectionDiagramTemplate',
            active: true,
            showClose: false
          });
        },
        addTraceDiagramTab: function() {
          tabs.push({
            title: 'Trace Diagram',
            content: 'traceDiagramTemplate',
            active: true,
            showClose: false
          });
        },
        removeTab: function(index) {
          tabs.splice(index, 1);
        },
        getTabs: function() {
          return tabs;
        }
      }

    });

});

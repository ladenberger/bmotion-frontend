define([
  'angular',
  'bms.standalone.service',
  'bms.standalone.electron',
  'ng-electron'
], function(angular) {

  return angular.module('bms.standalone.ctrl.welcome', ['bms.standalone.service', 'bms.standalone.electron', 'ngElectron'])
    .controller('bmsWelcomeCtrl', ['$scope', 'electronDialog', 'initVisualizationService', 'electron',
      function($scope, electronDialog, initVisualizationService, electron) {

        $scope.openFileDialog = function() {
          electronDialog.showOpenDialog({
              title: 'Open BMotionWeb Visualisation',
              filters: [{
                name: 'BMotionWeb Manifest (bmotion.json)',
                extensions: ['json']
              }, {
                name: 'Formal Model (*.mch, *.csp, *.bcm, *.bcc)',
                extensions: ['mch', 'csp', 'bcm', 'bcc']
              }],
              properties: ['openFile']
            },
            function(files) {
              if (files) {
                var file = files[0];
                var filename = file.replace(/^.*[\\\/]/, '');
                //var fileExtension = filename.split('.').pop();
                if (filename === 'bmotion.json') {
                  initVisualizationService(file);
                } else {
                  //initFormalModelOnlyService(file);
                }
              }
            });
        };

      }
    ]);

});

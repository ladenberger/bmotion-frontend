/**
 * BMotionWeb Common Module
 *
 */
define([
  'angular'
], function(angular) {

  return angular.module('bms.common', [])
    .constant('trigger', {
      TRIGGER_MODEL_CHANGED: "ModelChanged",
      TRIGGER_MODEL_INITIALISED: "ModelInitialised",
      TRIGGER_MODEL_SETUP_CONSTANTS: "ModelSetupConstants",
      TRIGGER_ANIMATION_CHANGED: "AnimationChanged"
    })
    .factory('bmsMainService', function() {

      var mode = "ModeStandalone";

      return {
        getMode: function() {
          return mode;
        },
        setMode: function(m) {
          mode = m;
        }
      };

    });

});

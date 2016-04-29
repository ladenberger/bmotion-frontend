var bms = bms || {};
var angular = angular || {};

(function() {
  bms = window.parent.bmsapi(window.frameElement.sessionId, window.frameElement.viewId);
  angular = window.parent.angular;
})();

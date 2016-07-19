/**
 * BMotionWeb Standalone Routing Module
 *
 */
define([
    'angular',
    'angular-route',
    'bms.standalone.ctrl.welcome',
    'bms.standalone.ctrl.session'
  ],
  function(angular) {

    return angular.module('bms.standalone.routing', [
        'ngRoute',
        'bms.standalone.ctrl.welcome',
        'bms.standalone.ctrl.session'
      ])
      .config(['$routeProvider', '$locationProvider',
        function($routeProvider) {
          $routeProvider
            .when('/welcome', {
              templateUrl: 'js/main/standalone/bms.standalone.welcome.html',
              controller: 'bmsWelcomeCtrl'
            })
            .when('/vis/:sessionId', {
              templateUrl: 'js/main/standalone/bms.standalone.html',
              controller: 'bmsSessionCtrl'
            })
            .otherwise({
              redirectTo: '/welcome'
            });
        }
      ]);

  });

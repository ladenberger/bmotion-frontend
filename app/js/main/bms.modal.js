/**
 * BMotionWeb Modal Module
 *
 */
define([
  'angular',
  'ui-bootstrap',
  'ui-bootstrap-tpls',
  'angular-sanitize'
], function(angular) {

  var module = angular.module('bms.modal', ['ui.bootstrap', 'ngSanitize'])
    .controller('bmsLoadingModalInstanceCtrl', ['$scope', '$modalInstance', '$q', 'bmsModalService',
      function($scope, $modalInstance, $q, bmsModalService) {

        $scope.message = "";
        $scope.state = bmsModalService.states.default;
        $scope.dialog = false;

        $scope.close = function() {
          $modalInstance.close();
          bmsModalService.currentModalInstance = null;
        };

        $scope.ok = function() {
          bmsModalService.modaDialogDeferred.resolve();
          $scope.close();
        };

        $scope.cancel = function() {
          bmsModalService.modaDialogDeferred.reject();
          $scope.close();
        };

        $modalInstance.setDialog = function(d) {
          $scope.dialog = d;
        };

        $modalInstance.getState = function() {
          return $scope.state;
        };

        $modalInstance.getMessage = function() {
          return $scope.message;
        };

        $modalInstance.setMessage = function(msg, s) {
          if (Object.prototype.toString.call(msg) === '[object Array]') {
            $scope.message = msg.join("<br>");
          } else {
            $scope.message = msg;
          }
          $scope.state = s ? s : $scope.state;
        };

      }
    ])
    .service('bmsModalService', ['$rootScope', '$q', '$uibModal',
      function($rootScope, $q, $uibModal) {

        var self = this;

        self.currentModalInstance = null;

        self.states = {
          error: {
            class: 'alert-danger',
            icon: 'bmotion-img-error'
          },
          loading: {
            class: 'alert-info',
            icon: 'bmotion-img-loader'
          },
          default: {
            class: 'alert-info',
            icon: ''
          }
        };

        self.isOpen = false;

        self.createModal = function() {

          var modalInstance = $uibModal.open({
            template: '<div class="modal-header" style="height:40px;">' +
              '<button type="button" class="close" data-dismiss="modal" ng-click="close()">' +
              '<span aria-hidden="true">&times;</span><span class="sr-only">Close</span>' +
              '</button>' +
              '</div>' +
              '<div class="modal-body">' +
              '<p class="bmotion-img-logo"></p>' +
              '<p ng-attr-class="{{state.icon}}"></p>' +
              '<div ng-if="message">' +
              '<div class="bmotion-alert alert {{state.class}}" role="alert" ng-bind-html="message"></div>' +
              '<div class="modal-footer" ng-show="dialog">' +
              '<button class="btn" type="button" ng-click="ok()">OK</button>' +
              '<button class="btn" type="button" ng-click="cancel()">Cancel</button>' +
              '</div>' +
              '</div>',
            controller: 'bmsLoadingModalInstanceCtrl',
            backdrop: false
          });

          return modalInstance;

        };

        self.getModal = function() {

          var defer = $q.defer();

          if (self.currentModalInstance === null) self.currentModalInstance = self.createModal();
          self.currentModalInstance.opened.then(function() {
            defer.resolve(self.currentModalInstance);
          });

          return defer.promise;

        };

        self.reset = function() {
          self.hideDialog();
          self.removeMessage();
        };

        self.hideDialog = function() {
          if (self.currentModalInstance !== null) self.currentModalInstance.setDialog(false);
        };

        self.removeMessage = function() {
          if (self.currentModalInstance !== null) self.currentModalInstance.setMessage("");
        };

        self.setDialog = function(b) {
          if (self.currentModalInstance !== null) self.currentModalInstance.setDialog(b);
        };

        self.setMessage = function(msg, s) {
          if (msg.length > 0) {
            self.getModal().then(function(m) {
              m.setMessage(msg, s ? s : self.states.default);
            });
          }
        };

        self.setDefault = function(msg) {
          self.setMessage(msg, self.states.default);
        };

        self.setError = function(msg) {
          self.setMessage(msg, self.states.error);
        };

        self.openErrorDialog = function(msg) {
          return self.openDialog(msg, self.states.error);
        };

        self.openDialog = function(msg, s) {

          self.modaDialogDeferred = $q.defer();
          if (msg.length > 0) {
            self.getModal().then(function() {
              self.setMessage(msg, s);
              self.setDialog(true);
            });
          } else {
            self.modaDialogDeferred.resolve();
          }
          return self.modaDialogDeferred.promise;

        };

        self.loading = function(msg) {
          self.setMessage(msg, self.states.loading)
        };

        self.endLoading = function() {
          self.closeModal();
        };

        self.closeModal = function() {
          if (self.currentModalInstance !== null) {
            self.currentModalInstance.close();
            self.currentModalInstance = null;
          }
        };

      }
    ]);

  return module;

});

/**
 * BMotionWeb Session Module
 *
 */
define([
  'angular',
  'bms.func',
  'bms.ws',
  'bms.manifest',
  'bms.visualization'
], function(angular, bms) {

  return angular.module('bms.session', ['bms.ws', 'bms.manifest', 'bms.visualization'])
    .factory('bmsSession', ['$q', 'bmsWsService', 'bmsManifestService', 'bmsVisualization',
      function($q, bmsWsService, bmsManifestService, bmsVisualization) {

        var bmsSession = function(sessionId) {
          this.id = sessionId;
          this.manifestFilePath = undefined;
          this.manifestData = {};
          this.initialized = $q.defer();
          this.templateFolder = undefined;
          this.modelPath = undefined;
          this.toolData = {};
          this.views = {};
        };

        bmsSession.prototype.getId = function() {
          return this.id;
        };

        bmsSession.prototype.getModelPath = function() {
          return this.modelPath;
        };

        bmsSession.prototype.load = function() {

          var defer = $q.defer();
          var self = this;
          self.initialized = $q.defer();

          bmsWsService.loadSession(self.id)
            .then(function(sessionData) {
              self.manifestFilePath = sessionData[0].manifestFilePath;
              self.tool = sessionData[0].tool;
              self.toolData = sessionData[1];
              var filename = self.manifestFilePath.replace(/^.*[\\\/]/, '');
              self.templateFolder = self.manifestFilePath.replace('/' + filename, '');
              bmsManifestService.getManifest(self.manifestFilePath)
                .then(function(_manifestData_) {
                  self.manifestData = _manifestData_;
                  self.modelPath = self.templateFolder + '/' + self.manifestData.model;
                  defer.resolve(self);
                  self.initialized.resolve(self);
                });
            }, function(err) {
              defer.reject(err);
            });

          return defer.promise;

        };

        bmsSession.prototype.destroy = function() {
          return bmsWsService.destroySession(self.id);
        };

        bmsSession.prototype.isInitialized = function() {
          return this.initialized.promise;
        };

        bmsSession.prototype.isClassicalBVisualization = function() {
          if (!this.tool) {
            return false;
          } else {
            return this.tool === 'ClassicalBVisualization';
          }
        };

        bmsSession.prototype.isEventBVisualization = function() {
          if (!this.tool) {
            return false;
          } else {
            return this.tool === 'EventBVisualization';
          }
        };

        bmsSession.prototype.isBVisualization = function() {
          if (!this.tool) {
            return false;
          } else {
            return this.tool === 'EventBVisualization' || this.tool === 'ClassicalBVisualization';
          }
        };

        bmsSession.prototype.isCSPVisualization = function() {
          if (!this.tool) {
            return false;
          } else {
            return this.tool === 'CSPVisualisation';
          }
        };

        bmsSession.prototype.getView = function(viewId) {
          // If id is undefined create a new one
          viewId = viewId === undefined ? bms.uuid() : viewId;
          if (this.views[viewId] === undefined) {
            this.views[viewId] = new bmsVisualization(viewId, this);
          }
          return this.views[viewId];
        };

        return bmsSession;

      }
    ])
    .factory('bmsSessionService', ['$q', 'bmsSession', 'bmsManifestService', 'bmsWsService',
      function($q, bmsSession, bmsManifestService, bmsWsService) {

        var sessions = {};

        return {
          getTemplateFolder: function(manifestFilePath) {
            //TODO check if manifestFilePath is undefined
            var filename = manifestFilePath.replace(/^.*[\\\/]/, '');
            var folder = manifestFilePath.replace('/' + filename, '');
            return folder;
          },
          initSession: function(manifestFilePath) {

            var defer = $q.defer();

            var self = this;

            if (!manifestFilePath) {
              defer.reject("Manifest file path must not be undefined.");
            } else {
              bmsManifestService.getManifest(manifestFilePath)
                .then(function(_manifestData_) {

                  var manifestData = _manifestData_;
                  var templateFolder = self.getTemplateFolder(manifestFilePath);
                  var modelPath = templateFolder + '/' + manifestData.model;

                  bmsWsService.initSession(bms.uuid(), manifestFilePath, modelPath, manifestData.modelOptions)
                    .then(function(_sessionId_) {
                      var newBmsSession = new bmsSession(_sessionId_);
                      newBmsSession.manifestFilePath = manifestFilePath;
                      newBmsSession.manifestData = manifestData;
                      newBmsSession.templateFolder = templateFolder;
                      newBmsSession.modelPath = modelPath;
                      sessions[_sessionId_] = newBmsSession;
                      defer.resolve(newBmsSession);
                    }, function(err) {
                      defer.reject(err);
                    });
                }, function(err) {
                  defer.reject(err);
                });
            }

            return defer.promise;

          },
          getSession: function(sessionId) {
            sessionId = sessionId ? sessionId : bms.uuid();
            if (sessions[sessionId] === undefined) {
              sessions[sessionId] = new bmsSession(sessionId);
            }
            return sessions[sessionId];
          }
        }

      }
    ]);

});

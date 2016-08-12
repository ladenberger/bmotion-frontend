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

        bmsSession.prototype.getTemplateFolder = function(manifestFilePath) {
          //TODO check if manifestFilePath is undefined
          //var filename = manifestFilePath.replace(/^.*[\\\/]/, '');
          return manifestFilePath.replace('/bmotion.json', '');
          //return folder;
        };

        bmsSession.prototype.getSvgData = function() {
          var self = this;
          var svgData = [];
          angular.forEach(this.views, function(view) {
            for (svg in view.svg) {
              svgData.push({
                file: svg,
                viewId: view.viewData.id,
                id: view.id
              });
            }
          });
          return svgData;
        };

        bmsSession.prototype.init = function(manifestFilePath) {

          var defer = $q.defer();

          var self = this;

          if (!manifestFilePath) {
            defer.reject("Manifest file path must not be undefined.");
          } else {
            bmsManifestService.getManifest(manifestFilePath)
              .then(function(manifestData) {

                self.manifestFilePath = manifestFilePath;
                self.manifestData = manifestData;
                self.templateFolder = self.getTemplateFolder(manifestFilePath);
                self.modelPath = self.templateFolder + '/' + manifestData.model;

                if (manifestData.groovy) {
                  self.groovyPath = self.templateFolder + '/' + manifestData.groovy;
                }

                bmsWsService.initSession(self.id, self.manifestFilePath, self.modelPath, self.groovyPath, manifestData.modelOptions)
                  .then(function(sessionData) {
                    self.tool = sessionData[0].tool;
                    self.toolData = sessionData[1];
                    defer.resolve(self);
                    self.initialized.resolve(self);
                  }, function(err) {
                    defer.reject(err);
                  });
              }, function(err) {
                defer.reject(err);
              });
          }

          return defer.promise;

        };

        bmsSession.prototype.load = function() {

          var defer = $q.defer();
          var self = this;
          self.initialized = $q.defer();

          bmsWsService.loadSession(self.id)
            .then(function(sessionData) {

              self.tool = sessionData[0].tool;
              self.toolData = sessionData[1];
              self.manifestFilePath = sessionData[0].manifestFilePath;
              self.templateFolder = self.getTemplateFolder(self.manifestFilePath);

              bmsManifestService.getManifest(self.manifestFilePath)
                .then(function(manifestData) {
                  self.manifestData = manifestData;
                  self.modelPath = self.templateFolder + '/' + manifestData.model;
                  if (manifestData.groovy) {
                    self.groovyPath = self.templateFolder + '/' + manifestData.groovy;
                  }
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
          getSession: function(_sessionId_) {
            sessionId = _sessionId_ ? _sessionId_ : bms.uuid();
            if (sessions[sessionId] === undefined) {
              sessions[sessionId] = new bmsSession(sessionId);
            }
            return sessions[sessionId];
          }
        };

      }
    ]);

});

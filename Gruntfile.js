module.exports = function(grunt) {

  var path = require('path');
  var cssBowerLibs = 'css/libs/bower/';
  var jsBowerLibs = 'js/libs/bower/';
  var appVersion = '0.2.7';
  var electronVersion = '0.36.2';
  var targets = ["linux-ia32", "linux-x64", "darwin-x64", "win32-ia32", "win32-x64"];
  var editorDependencies = ["angular-ui-codemirror", "codemirror", "angular-xeditable", "eventEmitter", "eventie", "imagesloaded", "jquery.browser"];

  grunt.initConfig({
    clean: [
      "build",
      "cache",
      "bower_components",
      "coverage",
      "app/js/libs/bower",
      "app/css/libs/bower",
      "app/editor/js/libs/bower",
      "app/editor/css/libs/bower"
    ],
    electron: {
      "linux-x64": {
        options: {
          name: 'bmotion',
          dir: 'app',
          out: 'build/client',
          version: electronVersion,
          platform: 'linux',
          arch: 'x64',
          asar: true,
          "app-version": appVersion
        }
      },
      "linux-ia32": {
        options: {
          name: 'bmotion',
          dir: 'app',
          out: 'build/client',
          version: electronVersion,
          platform: 'linux',
          arch: 'ia32',
          asar: true,
          "app-version": appVersion
        }
      },
      "win32-ia32": {
        options: {
          name: 'bmotion',
          dir: 'app',
          out: 'build/client',
          version: electronVersion,
          platform: 'win32',
          //icon: 'app/resources/icons/bmsicon.ico',
          arch: 'ia32',
          asar: true,
          "app-version": appVersion
        }
      },
      "win32-x64": {
        options: {
          name: 'bmotion',
          dir: 'app',
          out: 'build/client',
          version: electronVersion,
          //icon: 'app/resources/icons/bmsicon.ico',
          platform: 'win32',
          arch: 'x64',
          asar: true,
          "app-version": appVersion
        }
      },
      "darwin-x64": {
        options: {
          name: 'bmotion',
          dir: 'app',
          out: 'build/client',
          version: electronVersion,
          icon: 'app/resources/icons/bmsicon.icns',
          platform: 'darwin',
          arch: 'x64',
          asar: true,
          "app-version": appVersion
        }
      }
    },
    bower: {
      install: {
        options: {
          layout: function(type, component, source) {
            /* workaround for https://github.com/yatskevich/grunt-bower-task/issues/121 */
            if (type === '__untyped__') {
              type = source.substring(source.lastIndexOf('.') + 1);
            }
            var renamedType = type;
            var prefix = '';
            if (editorDependencies.indexOf(component) > -1) {
              prefix = 'editor/'
            }
            switch (type) {
              case 'js':
                if (component === 'codemirror') {
                  if (source.indexOf('javascript', this.length - 'javascript'.length) !== -1) {
                    renamedType = 'js/libs/bower/codemirror/mode/javascript';
                  } else {
                    renamedType = 'js/libs/bower/codemirror/lib';
                  }
                } else {
                  renamedType = path.join(jsBowerLibs, component);
                }
                break;
              case 'css':
                renamedType = component === 'bootstrap' ? 'css/bootstrap/css' : path.join(cssBowerLibs, component);
                break;
              case 'fonts':
                renamedType = component === 'bootstrap' ? 'css/bootstrap/fonts' : path.join(cssBowerLibs, component);
                break;
            }
            return prefix + renamedType;
          },
          targetDir: 'app'
            //,cleanBowerDir: true
        }
      }
    },
    requirejs: {
      'js-online': {
        options: {
          mainConfigFile: "app/bmotion.config.js",
          baseUrl: "app",
          removeCombined: true,
          findNestedDependencies: true,
          name: "bmotion.online",
          out: "build/online/js/bmotion.online.js",
          optimize: 'none',
          skipDirOptimize: true,
          keepBuildDir: false,
          noBuildTxt: true
        }
      },
      'css-online': {
        options: {
          keepBuildDir: true,
          //optimizeCss: "standard.keepLines.keepWhitespace",
          optimizeCss: "standard",
          cssPrefix: "",
          cssIn: "app/css/bms.main.css",
          out: "build/online/css/bms.main.css"
        }
      }
    },
    copy: {
      online: {
        files: [{
          expand: true,
          cwd: 'app/',
          src: ['css/**', 'images/**', 'js/require.js', 'bmotion.json'],
          dest: 'build/online/'
        }]
      },
      template: {
        files: [{
          expand: true,
          cwd: 'template/',
          src: ['**'],
          dest: 'build/template/'
        }]
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        // run karma in the background
        background: true,
        // which browsers to run the tests on
        browsers: ['PhantomJS']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-electron');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', ['build']);

  grunt.registerTask('test', ['karma']);

  grunt.registerTask('prepare', ['bower:install']);
  grunt.registerTask('build', ['standalone_all']);

  grunt.registerTask('online', ['prepare', 'test', 'requirejs:js-online', 'requirejs:css-online', 'copy:online']);

  targets.forEach(function(target) {
    grunt.registerTask('standalone_' + target, '', function() {
      grunt.config.set('mode', 'standalone');
      grunt.task.run(['prepare', 'test', 'copy:template', 'electron:' + target]);
    });
  });

  grunt.registerTask('standalone_all', '', function() {
    grunt.config.set('mode', 'standalone');
    grunt.task.run(['prepare', 'test', 'copy:template', 'electron']);
  });

};

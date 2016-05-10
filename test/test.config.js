var tests = [];

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function(file) {
  if (/(spec|test)\.js$/i.test(file)) {
    tests.push(file);
  }
});

requirejs.config({

  baseUrl: '/base/app',

  paths: {

    // Directive modules
    "bms.directive": "js/main/directives/bms.directive",
    "bms.directive.execute.event": "js/main/directives/bms.directive.execute.event",
    "bms.directive.bms.widget": "js/main/directives/bms.directive.bms.widget",
    "bms.directive.visualization.view": "js/main/directives/bms.directive.visualization.view",
    "bms.directive.editor": "js/main/directives/bms.directive.editor",
    "bms.directive.dialog": "js/main/directives/bms.directive.dialog",
    "bms.directive.svg": "js/main/directives/bms.directive.svg",

    "prob.directive.view": "js/main/directives/prob.directive.view",

    // Handler modules
    "bms.handlers": "js/main/handlers/bms.handlers",
    "prob.handlers.event": "js/main/handlers/prob.handlers.event",

    // Observer modules
    "bms.observers": "js/main/observers/bms.observers",
    "bms.observers.formula": "js/main/observers/bms.observers.formula",
    "prob.observers.predicate": "js/main/observers/prob.observers.predicate",
    "prob.observers.refinement": "js/main/observers/prob.observers.refinement",
    "prob.observers.csp": "js/main/observers/prob.observers.csp",
    "prob.observers.data": "js/main/observers/prob.observers.data",

    // Graph modules
    "prob.graph": "js/main/graph/prob.graph",
    "prob.graph.rendering": "js/main/graph/prob.graph.rendering",
    "prob.graph.trace": "js/main/graph/prob.graph.trace",
    "prob.graph.projection": "js/main/graph/prob.graph.projection",

    // View modules
    "bms.views": "js/main/views/bms.views",
    "bms.views.user.interactions": "js/main/views/bms.views.user.interactions",

    // Main modules
    "bms.common": "js/main/bms.common",
    "bms.session": "js/main/bms.session",
    "bms.func": "js/main/bms.func",
    "bms.socket": "js/main/bms.socket",
    "bms.config": "js/main/bms.config",
    "bms.visualization": "js/main/bms.visualization",
    "bms.manifest": "js/main/bms.manifest",
    "bms.api": "js/main/bms.api",
    "bms.api.extern": "js/main/bms.api.extern",
    "bms.view": "js/main/bms.view",
    "bms.modal": "js/main/bms.modal",
    "bms.ws": "js/main/bms.ws",

    "prob.ui": "js/main/prob.ui",
    "prob.ws": "js/main/prob.ws",

    // Root modules
    "bms.standalone.root": "js/main/standalone/bms.standalone.root",
    "bms.editor.root": "js/main/editor/bms.editor.root",
    "bms.online.root": "js/main/online/bms.online.root",

    // Online modules
    "bms.online.directive": "js/main/online/bms.online.directive",

    // Standalone modules
    "bms.standalone.ctrl.session": "js/main/standalone/bms.standalone.ctrl.session",
    "bms.standalone.ctrl.startServer": "js/main/standalone/bms.standalone.ctrl.startServer",
    "bms.standalone.ctrl.welcome": "js/main/standalone/bms.standalone.ctrl.welcome",
    "bms.standalone.directive": "js/main/standalone/bms.standalone.directive",
    "bms.standalone.electron": "js/main/standalone/bms.standalone.electron",
    "bms.standalone.nodejs": "js/main/standalone/bms.standalone.nodejs",
    "bms.standalone.root": "js/main/standalone/bms.standalone.root",
    "bms.standalone.routing": "js/main/standalone/bms.standalone.routing",
    "bms.standalone.service": "js/main/standalone/bms.standalone.service",
    "bms.standalone.tabs": "js/main/standalone/bms.standalone.tabs",

    // Third party modules
    "jquery": "js/libs/bower/jquery/jquery",
    "socket.io": "js/libs/bower/socket.io-client/socket.io",
    "angular": "js/libs/bower/angular/angular",
    "angular-route": "js/libs/bower/angular-route/angular-route",
    "angular-sanitize": "js/libs/bower/angular-sanitize/angular-sanitize",
    "angular-bootstrap-show-errors": "js/libs/bower/angular-bootstrap-show-errors/showErrors",
    "angularAMD": "js/libs/bower/angularAMD/angularAMD",
    "jquery-ui": "js/libs/ext/jquery-ui/jquery-ui",
    "ng-electron": "js/libs/bower/ng-electron/ng-electron",
    "qtip": "js/libs/bower/qtip2/jquery.qtip",
    "tv4": "js/libs/bower/tv4/tv4",
    "cytoscape": "js/libs/bower/cytoscape/cytoscape",
    "cytoscape.navigator": "js/libs/ext/cytoscape.navigator/cytoscape.js-navigator",
    "angular-sanitize": "js/libs/bower/angular-sanitize/angular-sanitize",
    "ui-bootstrap": "js/libs/bower/angular-bootstrap/ui-bootstrap",
    "ui-bootstrap-tpls": "js/libs/bower/angular-bootstrap/ui-bootstrap-tpls",

    // Editor dependencies
    "angular-xeditable": "editor/js/libs/bower/angular-xeditable/xeditable",
    "prob.iframe.editor": "editor/js/prob.iframe.editor",
    "prob.editor": "editor/js/prob.editor",
    "codemirror-javascript": "editor/js/libs/bower/codemirror/mode/javascript/javascript",
    "angular-ui-codemirror": "editor/js/libs/bower/angular-ui-codemirror/ui-codemirror",
    "code-mirror": "editor/js/libs/ext/requirejs-codemirror/code-mirror",
    "jquery.contextMenu": "editor/js/libs/ext/contextmenu/jquery.contextMenu",
    "jquery.jgraduate": "editor/js/libs/ext/jgraduate/jquery.jgraduate.min",
    "jpicker": "editor/js/libs/ext/jgraduate/jpicker.min",
    "jquery.svgicons": "editor/js/libs/ext/jquery.svgicons",
    "jquery.bbq": "editor/js/libs/ext/jquerybbq/jquery.ba-bbq",
    "jquery.browser": "editor/js/libs/bower/jquery.browser/jquery.browser",
    "jquery.hotkeys": "editor/js/libs/ext/js-hotkeys/jquery.hotkeys.min",
    "jquery.draginput": "editor/js/libs/ext/jquery-draginput",
    "mousewheel": "editor/js/libs/ext/mousewheel",
    "taphold": "editor/js/libs/ext/taphold",
    "touch": "editor/js/libs/ext/touch",
    "requestanimationframe": "editor/js/libs/ext/requestanimationframe",
    "browser": "editor/js/browser",
    "contextmenu": "editor/js/contextmenu",
    "dialog": "editor/js/dialog",
    "draw": "editor/js/draw",
    "history": "editor/js/history",
    "math": "editor/js/math",
    "method-draw": "editor/js/method-draw",
    "path": "editor/js/path",
    "sanitize": "editor/js/sanitize",
    "select": "editor/js/select",
    "svgcanvas": "editor/js/svgcanvas",
    "svgtransformlist": "editor/js/svgtransformlist",
    "svgutils": "editor/js/svgutils",
    "units": "editor/js/units"

  },
  shim: {
    "socket.io": {
      "exports": "io"
    },
    "jquery": {
      "exports": "$"
    },
    "angular": {
      "exports": "angular"
    },
    "angularAMD": ["angular"],
    "ui-bootstrap": ["angular"],
    "ui-bootstrap-tpls": ["ui-bootstrap"],
    "angular-sanitize": ["angular"],
    "angular-bootstrap-show-errors": ["angular"],
    "angular-xeditable": ["angular"],
    "angular-ui-codemirror": ["angular", "code-mirror"],
    "ng-electron": ["angular"],
    "qtip": ["jquery"],
    "cytoscape": {
      exports: "cy",
      deps: ["jquery"]
    },
    "cytoscape.navigator": ['cytoscape', 'jquery'],
    "jquery-ui": ["jquery"],
    "angular-route": ["angular"],
    "jpicker": ["jquery.jgraduate"],
    "jquery.jgraduate": ["jquery"],
    "jquery.contextMenu": ["jquery"],
    "jquery.bbq": ["jquery", "jquery.browser"],
    "jquery.hotkeys": ["jquery"],
    "jquery.draginput": ["jquery"],
    "jquery.svgicons": ["jquery"],
    "taphold": ["jquery"],
    "mousewheel": ["jquery"],
    "contextmenu": ["jquery", "method-draw"],
    "sanitize": ["jquery"],
    "svgcanvas": ["jquery"],
    "units": ["jquery"],
    "dialog": ["jquery", "jquery-ui"],
    "svgutils": ["browser"],
    "method-draw": [
      "jquery", "touch", "jquery.hotkeys", "jquery.bbq",
      "jquery.svgicons", "jquery.contextMenu",
      "browser", "svgtransformlist", "math",
      "units", "svgutils", "sanitize", "history",
      "select", "draw", "path", "dialog", "svgcanvas",
      "jquery.browser"
    ]
  },
  cm: {
    // baseUrl to CodeMirror dir
    baseUrl: './',
    // path to CodeMirror lib
    path: 'editor/js/libs/bower/codemirror/lib/codemirror',
    // path to CodeMirror css file
    css: 'css/libs/bower/codemirror/codemirror.css',
    // define themes
    themes: {},
    modes: {
      // modes dir structure
      path: 'editor/js/libs/bower/codemirror/mode/{mode}/{mode}'
    }
  },

  // Ask Require.js to load these files (all our tests).
  deps: tests,

  // Set test to start run once Require.js is done.
  callback: window.__karma__.start

});

/**
 * BMotionWeb Helper Module
 *
 */
define([
  'angular',
  'jquery'
], function(angular, $) {

  var api = {

    inArray: function(obj, array) {
      return !($.inArray(obj, array) === -1);
    },
    mapFilter: function(arr, func) {
      return arr.map(func).filter(function(x) {
        return typeof x !== 'undefined';
      });
    },
    toList: function(obj) {
      return Object.prototype.toString.call(obj) !== '[object Array]' ? [obj] : obj;
    },
    getUrlParameter: function(sParam) {
      var sPageURL = window.location.search.substring(1);
      var sURLVariables = sPageURL.split('&');
      for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
          return sParameterName[1];
        }
      }
    },
    _normalize: function(obj, exclude, origin, container) {
      for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
          if (origin !== undefined) {
            origin.data(property, obj[property]);
          }
          if (typeof obj[property] == "object") {
            api._normalize(obj[property], exclude, origin, container);
          } else {
            if ($.inArray(property, exclude) === -1) {
              obj[property] = api.callOrReturn(obj[property], origin, obj[property + "Js"], container);
            }
          }
        }
      }
    },
    normalize: function(obj, exclude, origin, container) {

      exclude = exclude === 'undefined' ? [] : exclude;

      if (Object.prototype.toString.call(obj) === '[object Array]') {
        var clone = $.extend(true, [], obj);
        angular.forEach(clone, function(o) {
          api._normalize(o, exclude, origin, container);
        });
        return clone;
      } else {
        var clone = $.extend(true, {}, obj);
        api._normalize(clone, exclude, origin, container);
        return clone;
      }

    },
    // Calls function with origin and one optional additional parameter
    callElementFunction: function(functor, element, paraName, paraData) {
      if (typeof functor === 'function') {
        if (paraName && paraData) {
          return functor.call(self, element, paraData);
        } else {
          return functor.call(self, element);
        }
      } else {
        if (paraName && paraData) {
          return new Function('origin', paraName, functor)(element, paraData);
        } else {
          return new Function('origin', functor)(element);
        }
      }
    },
    // Calls function with one optional parameter
    callFunction: function(functor, paraName, paraData) {
      if (typeof functor === 'function') {
        if (paraName && paraData) {
          return functor.call(self, paraData);
        } else {
          return functor.call();
        }
      } else {
        if (paraName && paraData) {
          return new Function(paraName, functor)(paraData);
        } else {
          return new Function(functor)();
        }
      }
    },
    // Calls function or returns object (used for
    // observer and interactive handler properties)
    callOrReturn: function(subject, element, isJsString, container) {

      var arguments = [];
      var argStrings = [];
      if (element) {
        arguments.push(element);
        argStrings.push('origin');
      }
      if (container) {
        arguments.push(container);
        argStrings.push('container');
      }

      if (api.isFunction(subject)) {
        return subject.apply(this, arguments);
      } else if (isJsString) {
        try {
          var func = new Function(argStrings.join(","), subject);
          return func.apply(this, arguments);
        } catch (err) {
          return subject;
        }
      } else {
        return subject;
      }

    },
    // Converts or returns the given function
    convertFunction: function(parameters, func) {
      if (typeof func === 'function') {
        return func;
      } else {
        // Whenever the function comes from json, we need to convert
        // the string function to a real javascript function
        // TODO: We need to handle errors while converting the string function to a reals javascript function
        return new Function(parameters, func);
      }
    },
    isFunction: function(functionToCheck) {
      var getType = {};
      return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    },
    isEmpty: function(map) {
      for (var key in map) {
        if (map.hasOwnProperty(key)) {
          return false;
        }
      }
      return true;
    },
    _s4: function() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    },
    uuid: function() {
      return api._s4() + api._s4() + '-' + api._s4() + '-' + api._s4() + '-' +
        api._s4() + '-' + api._s4() + api._s4() + api._s4();
    }
  };

  return api;

});

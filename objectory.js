/*
  Object.assign POLYFILL (MDN)
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
*/

if (!Object.assign) {
  Object.defineProperty(Object, "assign", {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function (target, firstSource) {
      "use strict";
      if (target === undefined || target === null)
        throw new TypeError("Cannot convert first argument to object");
      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) continue;
        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) to[nextKey] = nextSource[nextKey];
        }
      }
      return to;
    }
  });
}

(function () {

  var objectory = function (constr) {
    var isInstantiating = true,
        constructors = [],
        delegate = Object.create({}, {
        compose: {
          enumerable: false,
          value: function () {
            var args = [].slice.call(arguments),
              composeConstr = args.shift();
            if (isInstantiating) {
              constructors.push(composeConstr);
              delegate = Object.assign(Object.create(delegate), typeof composeConstr === 'function' ? composeConstr.prototype : composeConstr);
            } else if (typeof composeConstr === 'function' && composeConstr.isObjectory) {
              composeConstr.constructor.call(this, this);
            } else if (typeof composeConstr === 'function') {
              composeConstr.apply(this, args);
            }
            return this;
          }
        },
        assign: {
          enumerable: false,
          value: function () {
            var args = [this].concat([].slice.call(arguments));
            Object.assign.apply(Object, args);
            return this;
          }
        },
        delegate: {
          enumerable: false,
          value: function (method, args) {
            method.apply(this, args);
          }
        },
        composedOf: {
          enumerable: false,
          value: function (constr) {
            console.log('constr', constr, constructors);
            return constructors.indexOf(constr) >= 0 || constructors.indexOf(constr.constructor) >= 0;
          }
        }
      }),
      creator;

    // Run constructor to build delegate
    constr(Object.create(delegate));
    isInstantiating = false;

    // The function that creates the objects
    creator = function (obj) {

      var rootObject = Object.create(delegate);

      // If object passed, add properties to root object
      if (typeof obj === 'object' && obj !== null && !(obj instanceof Array)) {
        Object.assign(rootObject, obj);
      }

      constr(rootObject);

      return rootObject;

    };

    // Used to identify the factory where the object was created
    creator.prototype = delegate;
    creator.constructor = constr;
    creator.isObjectory = true;

    // Add creator as initial constructor
    constructors.unshift(creator);

    return creator;

  };

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(function () {
      return objectory;
    });
  } else if (typeof module === 'object') {
    // CommonJS
    module.exports = objectory;
  } else {
    // Browser global.
    window.objectory = objectory;
  }

}());

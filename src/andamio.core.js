(function (global, Backbone, _) {
  'use strict';

  var Andamio = {
    // use default DOM library
    $: Backbone.$
  };

  // @include andamio.view.js
  // @include andamio.router.js
  // @include andamio.application.js

  // expose Andamio
  global.Andamio = Backbone.Andamio = Andamio;

  // exports
  (function (root, factory) {
    if (typeof exports === 'object') {
      var underscore = require('underscore');
      var backbone = require('backbone');
      module.exports = factory(underscore, backbone);

    } else if (typeof define === 'function' && define.amd) {
      define(['underscore', 'backbone'], factory);
    }
  }(this, function (_, Backbone) {
    return Andamio;
  }));

}(this, Backbone, _));

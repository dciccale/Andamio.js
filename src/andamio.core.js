(function (global, _, Backbone) {
  'use strict';

  var Andamio = {
    // use default DOM library
    $: Backbone.$,

    extend: Backbone.Model.extend
  };

  // expose Andamio
  global.Andamio = Backbone.Andamio = Andamio;

  // @include andamio.bindevents.js
  // @include andamio.region.js
  // @include andamio.view.js
  // @include andamio.model.js
  // @include andamio.router.js
  // @include andamio.application.js
  // @include andamio.utils.js

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
    /* jshint unused: vars */
    return Andamio;
  }));

}(this, _, Backbone));

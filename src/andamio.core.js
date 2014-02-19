(function (global, _, Backbone) {
  'use strict';

  // global namespace
  var Andamio = {
    // use default DOM library
    $: Backbone.$,

    extend: Backbone.Model.extend
  };

  // expose Andamio
  global.Andamio = Backbone.Andamio = Andamio;

  // @include andamio.utils.js
  // @include andamio.bindevents.js
  // @include andamio.region.js
  // @include andamio.view.js
  // @include andamio.itemview.js
  // @include andamio.collectionview.js
  // @include andamio.model.js
  // @include andamio.collection.js
  // @include andamio.router.js
  // @include andamio.application.js

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

}(this, _, Backbone));

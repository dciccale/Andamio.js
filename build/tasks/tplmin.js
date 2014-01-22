/*!
 * grunt-underscore-tplmin
 * Copyright (c) 2013 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/grunt-underscore-tplmin/blob/master/LICENSE.txt
 */

'use strict';

module.exports = function (grunt) {

  var _ = grunt.util._;

  grunt.registerMultiTask('tplmin', 'Minify underscore templates removing white spaces', function () {

    var files = grunt.file.expand(this.data.files);

    grunt.log.write('Minifying underscore templates...\n');

    files.map(function (path) {
      var src = grunt.file.read(path);
      var srcMin = _.trim(_.clean(src));
      var file = {path: path};

      // check if minified version works
      try {
        _.template(srcMin);
        file.min = srcMin;
        return file;

      // if not, use original source
      } catch (e) {
        grunt.fail.warn('Unable to minify "' + path + '". --force will use original file');
        file.min = src;
        return file;
      }
    })
    // write minified template files
    .forEach(function (file) {
      grunt.log.writeln(file.path);
      grunt.file.write(file.path, file.min);
    });

    grunt.log.ok();
  });
};

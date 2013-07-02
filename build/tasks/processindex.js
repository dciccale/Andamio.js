module.exports = function (grunt) {
  var path = require('path');

  var _process = function (dest, content) {
    var regbuild = /<!--\s*build:(\w+)(?:\(([^\)]+)\))?\s*([^\s]+)\s*-->/;
    var regend = /<!--\s*\/build\s*-->/;

    var lines = content.replace(/\r\n/g, '\n').split(/\n/);
    var block = false;
    var sections = [];
    var last;

    lines.forEach(function (l) {
      var build = l.match(regbuild);
      var endbuild = regend.test(l);

      // discard empty lines
      if (build) {
        block = true;
        // handle absolute path
        if (build[3][0] === '/') {
          build[3] = build[3].substr(1);
        }
        last = {
          type: build[1],
          dest: build[3],
          raw: []
        };
      }

      // switch back block flag when endbuild
      if (block && endbuild) {
        last.raw.push(l);
        sections.push(last);
        block = false;
      }

      if (block && last) {
        var asset = l.match(/(href|src)=["']([^'"]+)["']/);
        if (asset && asset[2]) {
          // preserve media attribute
          var media = l.match(/media=['"]([^'"]+)['"]/);
          if (media) {
            last.media = media[1];
          }
        }
        last.raw.push(l);
      }
    });

    return sections;
  };

  var _replaceWith = (block) {
    var result = '';
    var dest = block.dest;

    if (block.type === 'css') {
      var media = block.media ? ' media="' + block.media + '"' : '';
      result = '<link rel="stylesheet" href="' + dest + '"' + media + '>';

    } else if (block.type === 'js') {
      result = '<script src="' + dest + '"><\/script>';
    }

    return result;
  };




  grunt.registerMultiTask('processindex', 'Process index file for production environment', function () {

    var files = this.files;
    var options = this.options({
      baseDir: ''
    });
    var file = files[0];
    var filepath = file.src[0];
    var html;
    var content = grunt.file.read(filepath);
    var linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';
    var dest = path.dirname(filepath);

    // warn on invalid source files
    if (!grunt.file.exists(filepath)) {
      grunt.fail.warn('Source file "' + filepath + '" not found.');
    }

    try {
      html = _process(file.dest, content);
    } catch (e) {
      var err = 'Processing the index file failed';
      if (e.msg) {
        err += ', ' + e.msg + '.';
      }
      err.origError = e;
      grunt.fail.warn(err);
    }

    html.forEach(function (block) {
      var blockLine = block.raw.join(linefeed);
      content = content.replace(blockLine, replaceWith(block));
    });

    grunt.file.write(file.dest, content);
    grunt.log.writeln('File "' + file.dest + '" created.');
  });
};

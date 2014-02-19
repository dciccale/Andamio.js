module.exports = function (grunt) {

  grunt.initConfig({
    SRC_DIR: 'src/',

    DIST_FILE: 'lib/<%= PKG.name %>',

    PKG: grunt.file.readJSON('package.json'),

    meta: {
      banner: '/*!\n' +
        ' * <%= PKG.name %> v<%= PKG.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * <%= PKG.homepage %>\n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= PKG.author %>\n' +
        ' * Released under the <%= PKG.licenses[0].type %> license\n' +
        ' * <%= PKG.licenses[0].url %>\n' +
        ' */\n'
    },

    directives: {
      options: {
        banner: '<%= meta.banner %>',
        separator: '\n\n'
      },
      core: {
        src: ['<%= SRC_DIR %>andamio.core.js'],
        dest: '<%= DIST_FILE %>.js'
      }
    },

    jshint: {
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['Gruntfile.js']
      },
      lib: {
        options: {
          jshintrc: '<%= SRC_DIR %>.jshintrc'
        },
        src: ['<%= SRC_DIR %>*.js']
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= PKG.name %> v<%= PKG.version %> | <%= PKG.homepage %> | <%= PKG.licenses[0].url %> */\n',
        sourceMap: true,
        sourceMapName: '<%= DIST_FILE %>.map'
      },
      lib: {
        src: '<%= DIST_FILE %>.js',
        dest: '<%= DIST_FILE %>.min.js'
      }
    },

    watch: {
      gruntfile: {
        files: ['Gruntfile.js'],
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: ['<%= SRC_DIR %>*.js'],
        tasks: ['build', 'jshint:lib']
      }
    }
  });

  grunt.loadNpmTasks('grunt-directives');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['directives', 'uglify']);

  grunt.registerTask('default', ['build', 'jshint']);
};

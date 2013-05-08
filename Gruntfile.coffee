module.exports = ->

  @initConfig
    SRC_DIR: 'src/'
    DIST_FILE: 'lib/<%= PKG.name %>'
    PKG: @file.readJSON('package.json')

    directives:
      options:
        banner: '/*!\n' +
          ' * <%= PKG.name %> v<%= PKG.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
          ' * <%= PKG.homepage %>\n' +
          ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= PKG.author %>\n' +
          ' * Released under the <%= PKG.licenses[0].type %> license\n' +
          ' * <%= PKG.licenses[0].url %>\n' +
          ' */\n'
        separator: '\n\n'

      core:
        src: ['<%= SRC_DIR %>andamio.core.js']
        dest: '<%= DIST_FILE %>.js'

    jshint:
      gruntfile:
        options:
          jshintrc: '.jshintrc'
        src: ['Gruntfile.js']

      lib:
        options:
          jshintrc: '<%= SRC_DIR %>.jshintrc'
        src: ['<%= DIST_FILE %>.js']

    uglify:
      options:
        banner: '/*! <%= PKG.name %> v<%= PKG.version %> | <%= PKG.homepage %> | <%= PKG.licenses[0].url %> */\n'
        sourceMap: '<%= DIST_FILE %>.sourcemap.js'

      dest:
        files:
          '<%= DIST_FILE %>.min.js': ['<%= DIST_FILE %>.js']

    watch:
      gruntfile:
        files: ['Gruntfile.coffee']
        tasks: ['jshint:gruntfile']

      lib:
        files: ['<%= SRC_DIR %>*.js']
        tasks: ['build', 'jshint:lib']

  @loadNpmTasks 'grunt-directives'
  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-uglify'
  @loadNpmTasks 'grunt-contrib-watch'

  @registerTask 'build', ['directives', 'uglify']
  @registerTask 'default', ['build', 'jshint']

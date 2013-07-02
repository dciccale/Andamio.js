#--------------------------------------------------------------------------------
# Grunt build script for your Backbone.Andamio apps
#--------------------------------------------------------------------------------

module.exports = ->

  @initConfig

    # PATHS
    JS_DIR: 'js/'
    CSS_DIR: '../css/'
    DIST_DIR: '../dist/'
    MID_DIR: '../mid/'
    TMP_DIR: '../tmp/'

    #--------------------------------------------------------------------------------
    # Build clean up
    #--------------------------------------------------------------------------------

    clean:
      options:
        force: true

      dist: ['<%= DIST_DIR %>']
      temp: ['<%= TMP_DIR %>']
      mid: ['<%= MID_DIR %>']


    #--------------------------------------------------------------------------------
    # Moving files
    #--------------------------------------------------------------------------------

    copy:
      index:
        files: [
          src: ['../index.html']
          dest: '<%= TMP_DIR %>/index.html'
        ]

      js:
        files: [
          expand: true
          src: ['../<%= JS_DIR %>**/*']
          dest: '<%= TMP_DIR %><%= JS_DIR %>'
        ]


    #--------------------------------------------------------------------------------
    # Concatenation
    #--------------------------------------------------------------------------------

    concat:
      jsdist:
        src: [
          './node_modules/almond/almond.js'
          '<%= MID_DIR %><%= JS_DIR %>app.js'
        ]
        dest: '<%= TMP_DIR %>app.js'


    #--------------------------------------------------------------------------------
    # Linting
    #--------------------------------------------------------------------------------

    # Configure with your project jshint options
    jshint:
      options:
        jshintrc: '.jshintrc'

      lib:
        src: [
          'Gruntfile.js',
          '../<%= JS_DIR %>app.js',
          '../<%= JS_DIR %>config.js',
          '../<%= JS_DIR %>main.js',
          '../<%= JS_DIR %>models/**/.js',
          '../<%= JS_DIR %>collections/**/.js',
          '../<%= JS_DIR %>routers/**/*.js',
          '../<%= JS_DIR %>views/**/*.js'
        ]


    #--------------------------------------------------------------------------------
    # Minification
    #--------------------------------------------------------------------------------

    # JS
    uglify:
      dest:
        files:
          '<%= DIST_DIR %>app.min.js': '<%= TMP_DIR %>app.js'

    # CSS
    cssmin:
      dist:
        files:
          '<%= DIST_DIR %>/app.min.css': ['<%= CSS_DIR %>normalize.css', '<%= CSS_DIR %>main.css', '<%= CSS_DIR %>app.css']

    # HTML
    htmlmin:
      options:
        removeComments: true
        removeCommentsFromCDATA: true
        removeEmptyAttributes: true
        cleanAttributes: true
        removeAttributeQuotes: true
        removeRedundantAttributes: true
        removeScriptTypeAttributes: true
        removeStyleLinkTypeAttributes: true
        collapseWhitespace: true
        collapseBooleanAttributes: true
        removeOptionalTags: true

      index:
        files:
          '<%= DIST_DIR %>index.html': '<%= TMP_DIR %>index.html'

    # TEMPLATES
    templateminifier:
      dist:
        files: '<%= TMP_DIR %><%= JS_DIR %>templates/**/*.tpl'


    #--------------------------------------------------------------------------------
    # Optimization
    #--------------------------------------------------------------------------------

    requirejs:
      compile:
        options:
          name: 'app'
          include: @file.expand({cwd: '../js'}, ['views/*']).map((dir) -> dir.replace(/\.js$/, ''))
          dir: '<%= MID_DIR %><%= JS_DIR %>'
          appDir: '<%= TMP_DIR %><%= JS_DIR %>'
          baseUrl: '.'
          mainConfigFile: '<%= TMP_DIR %><%= JS_DIR %>config.js'
          optimize: 'none'


    #--------------------------------------------------------------------------------
    # Process index.html for production
    #--------------------------------------------------------------------------------

    processindex:
      dest:
        files:
          '<%= TMP_DIR %>index.html': '<%= TMP_DIR %>index.html'


    #--------------------------------------------------------------------------------
    # Watch for development
    #--------------------------------------------------------------------------------

    watch:
      jshint:
        files: '<%= jshint.files %>'
        tasks: ['jshint']


  #--------------------------------------------------------------------------------
  # Load main tasks
  #--------------------------------------------------------------------------------

  @loadTasks 'tasks'
  @loadNpmTasks 'grunt-contrib-copy'
  @loadNpmTasks 'grunt-contrib-clean'
  @loadNpmTasks 'grunt-contrib-concat'
  @loadNpmTasks 'grunt-contrib-uglify'
  @loadNpmTasks 'grunt-contrib-cssmin'
  @loadNpmTasks 'grunt-contrib-htmlmin'
  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-requirejs'
  @loadNpmTasks 'grunt-contrib-watch'

  # separate dist tasks
  @registerTask 'js:dist', ['clean:mid', 'copy:js', 'templateminifier', 'requirejs', 'concat', 'uglify', 'clean:temp', 'clean:mid']
  @registerTask 'css:dist', ['cssmin:dist']
  @registerTask 'index:dist', ['clean:mid', 'copy:index', 'processindex', 'htmlmin', 'clean:temp', 'clean:mid']

  # generates production distribution
  @registerTask 'dist', ['clean:dist', 'js:dist', 'css:dist', 'index:dist']

  # default task generates production distribution
  @registerTask 'default', ['dist']

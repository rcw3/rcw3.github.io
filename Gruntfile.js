/* TODO:  

	1. Would like to beautify css
	2. Add EXCLUDE directory to JSS and CSS
	3. Clean target


for both css & js - need a local & merged prod variant
style + vendor = app.css
script + vendor = app.js


	copy			copy bower_components jss / css to appropriate directory 

	compass			convert scss to css
	cssmin			minimize css

	jsbeautifier	beautify js
	jshint			lint js
	uglify			minimize/mangle js

	jekyll
	concurrent

----
May need this:
launchctl limit maxfiles 2048 2048 

*/


/*global module:false*/
module.exports = function(grunt) {

    var imagesDir = 'images/';
    var fontsDir = 'fonts/';
    var bowerDir = 'bower_components/';

    var cssDir = 'css/';
    var cssVendorDir = 'css/vendor/';
    var scssDir = 'scss/';
    var scssVendorDir = 'scss/vendor/';
    var cssStyleFile = 'style.css';
    var cssStyleMinFile = 'style.min.css';
    var cssMergedMinFile = 'app.min.css';

    var jsDir = 'js/';
    var jsVendorDir = 'js/vendor/';
    var jsScriptFile = 'script.js';
    var jsMergedFile = 'app.js';
    var jsMergedMinFile = 'app.min.js';
    var jsFileList = ['js/**/*.js', 'GruntFile.js'];


    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        // COPY

        copy: {
            style: {
                files: [{
                    expand: true,
                    flatten: false,
                    cwd: bowerDir + 'foundation/scss/',
                    src: '**/*',
                    dest: scssVendorDir + 'foundation/',
                }]
            },
            script: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: [bowerDir + 'jquery/jquery.min.js',
                        //  bowerDir + 'fastclick/lib/fastclick.js',
                        bowerDir + 'foundation/js/foundation.min.js',
                        bowerDir + 'modernizr/modernizr.js'
                    ],
                    dest: jsVendorDir,
                    filter: 'isFile'
                }]
            }
        },


        // STYLESHEETS

        compass: {
            options: {
                sassDir: scssDir,
                cssDir: cssDir

            },
            dev: {
                options: {
                    environment: 'development'
                }
            },
            prod: {
                options: {
                    environment: 'production'
                }
            }
        },

        clean: {
            cssPrep: {
                src: [cssDir + '**/*.min.css']
            }
        },

        cssmin: {
            minify: {
                expand: true,
                cwd: cssDir,
                //src: ['**/*.css', '!*.min.css'],
                src: ['**/*.css'],
                dest: cssDir,
                ext: '.min.css'
            },
            combine: {
                src: [cssVendorDir + '**/*.min.css', cssDir + cssStyleMinFile],
                dest: cssDir + cssMergedMinFile
            },
        },



        // JAVASCRIPT

        jshint: {
            files: [jsFileList, // Really, should I just lint the local?
                '!' + jsVendorDir + 'foundation.*',
                '!' + jsVendorDir + 'modernizr.*',
                '!' + jsVendorDir + 'jquery.*',
                '!' + jsDir + jsMergedFile,
                '!' + jsDir + jsMergedMinFile
            ],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    require: true,
                    define: true,
                    requirejs: true,
                    describe: true,
                    expect: true,
                    it: true
                }
            }
        },

        jsbeautifier: {
            files: jsFileList,
            options: {
                html: {
                    braceStyle: "collapse",
                    indentChar: " ",
                    indentScripts: "keep",
                    indentSize: 4,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    unformatted: ["a", "sub", "sup", "b", "i", "u"],
                    wrapLineLength: 0
                },
                css: {
                    indentChar: " ",
                    indentSize: 4
                },
                js: {
                    braceStyle: "collapse",
                    breakChainedMethods: false,
                    e4x: false,
                    evalCode: false,
                    indentChar: " ",
                    indentLevel: 0,
                    indentSize: 4,
                    indentWithTabs: false,
                    jslintHappy: false,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    spaceBeforeConditional: true,
                    spaceInParen: false,
                    unescapeStrings: false,
                    wrapLineLength: 0
                }
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
            },
            beautify: { // Pretty up non-min CSS files
                options: {
                    mangle: false, // mangle: Turn on or off mangling
                    beautify: true, // beautify: beautify your code for debugging/troubleshooting purposes
                    compress: false,
                },
                files: [{
                    expand: true,
                    cwd: jsDir,
                    src: ['**/*.js', '!**/*.min.js'],
                    dest: jsDir
                }]
            },
            build: {
                options: {
                    mangle: true, // mangle: Turn on or off mangling
                    beautify: false, // beautify: beautify your code for debugging/troubleshooting purposes
                    compress: true,
                },
                src: [jsVendorDir + '**/*.js',
                    /*[jsVendorDir + 'jquery.min.js',
                    jsVendorDir + 'foundation.min.js',
                    jsVendorDir + 'modernizr.js',
                    jsVendorDir + 'fastclick.js',*/
                    jsDir + jsScriptFile
                ],
                dest: jsDir + jsMergedMinFile
            }
        },




        // SERVER / WATCH

        jekyll: {
            build: {
                options: {
                    serve: false,
                    drafts: true
                }
            },
            serve: {
                options: {
                    serve: true,
                    auto: true,
                    drafts: true
                }
            }
        },

        watch: {
            js: {
                files: ['<%= jsbeautifier.files %>'],
                tasks: ['jsbeautifier', 'jshint', 'uglify', 'jekyll:build']
            },
            scss: {
                files: [scssDir + '*.scss'],
                tasks: ['compass']
            },
            css: {
                files: ['css/**/*.css'],
                tasks: ['clean:cssPrep', 'cssmin', 'jekyll:build']
            },
            jekyll: {
                files: ['_posts/*', '_layouts/*', 'images/**/*'],
                tasks: ['jekyll:build']
            }
        },

        concurrent: {
            tasks: ['jekyll:serve', 'watch'],
            options: {
                logConcurrentOutput: true
            }
        }

    });


    // Load tasks
    require('load-grunt-tasks')(grunt);


    // Server
    grunt.registerTask('server', function(target) {
        if (target === '/') {
            return grunt.task.run(['default', 'connect:development:keepalive']);
        }

        grunt.task.run([
            'watch'
        ]);
    });

    grunt.registerTask('build', ['copy', 'compass:dev', 'clean:cssPrep', 'cssmin', 'jsbeautifier', 'jshint', 'uglify', 'jekyll:build']);
    grunt.registerTask('serve', ['copy', 'compass:dev', 'clean:cssPrep', 'cssmin', 'jsbeautifier', 'jshint', 'uglify', 'jekyll:build', 'concurrent']);
    grunt.registerTask('dist', ['copy', 'compass:prod', 'clean:cssPrep', 'cssmin', 'jsbeautifier', 'jshint', 'uglify', 'jekyll:build']);

    // Default task(s).
    grunt.registerTask('default', ['copy', 'compass:dev', 'clean:cssPrep', 'cssmin', 'jsbeautifier', 'jshint', 'uglify', 'jekyll:build']);

};

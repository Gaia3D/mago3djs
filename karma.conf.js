// Karma configuration
// Generated on Thu Jan 12 2017 10:39:32 GMT+0900 (대한민국 표준시)

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',
		
		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],
	
		// list of files / patterns to load in the browser
		files: [
			// dependencies
			//'./external/jasmine-2.5.2/jasmine.js',
			// application code
			'./src/js/*.js',
			
			// test dependencies
			'./external/jasmine-2.5.2/jasmine.css',
			'./external/jasmine-2.5.2/jasmine.js',
			'./external/jasmine-2.5.2/jasmine-html.js',
			'./external/jasmine-2.5.2/boot.js',
			
			// tests
			'./test/*.js'
		],
	
		// list of files to exclude
		exclude: [
			'./src/js/cesium'
		],
	
		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
		},
	
		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['mocha'],
//		reporters: ['mocha', 'html'],

//		htmlReporter: {
//			outputDir: './build/reporter', // where to put the reports 
//			templatePath: null, // set if you moved jasmine_template.html
//			focusOnFailures: true, // reports show failures on start
//			namedFiles: false, // name files instead of creating sub-directories
//			pageTitle: null, // page title for reports; browser info by default
//			urlFriendlyName: false, // simply replaces spaces with _ for files/dirs
//			reportName: 'test-report.html', // report summary filename; browser info by default
//
//			// experimental
//			preserveDescribeNesting: false, // folded suites stay folded 
//			foldAll: false, // reports start folded (only with preserveDescribeNesting)
//		},
		
//		plugins: [
//			// other plugins
//			'karma-html-reporter'
//		],
		
		mochaReporter: {
			colors: {
				success: 'blue',
				info: 'bgGreen',
				warning: 'cyan',
				error: 'bgRed'
			},
			symbols: {
				success: '+',
				info: '#',
				warning: '!',
				error: 'x'
			}
		},
	
		// web server port
		port: 80,
	
		// enable / disable colors in the output (reporters and logs)
		colors: true,
	
		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,
	
		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,
	
		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		//browsers: ['Chrome','PhantomJS','Firefox'],
		browsers: ['Firefox', 'Chrome'],
//		browsers: ['PhantomJS', 'PhantomJS_custom'],
//		 
//	    // you can define custom flags 
//	    customLaunchers: {
//	      'PhantomJS_custom': {
//	        base: 'PhantomJS',
//	        options: {
//	          windowName: 'my-window',
//	          settings: {
//	            webSecurityEnabled: false
//	          },
//	        },
//	        flags: ['--load-images=true'],
//	        debug: true
//	      }
//	    },
//	 
//	    phantomjsLauncher: {
//	      // Have phantomjs exit if a ResourceError is encountered (useful if karma exits without killing phantom) 
//	      exitOnResourceError: true
//	    },
		
		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false,
	
		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity
	})
}

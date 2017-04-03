
// https://github.com/karma-runner/karma-jasmine

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',
		
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		//frameworks: ['browserify', 'mocha', 'requirejs', 'chai'],
		frameworks: ['jasmine'],
	
		files: [
			// dependencies
			'external/jasmine-2.5.2/jasmine.css',
			'external/jasmine-2.5.2/jasmine.js',
			'external/jasmine-2.5.2/jasmine-html.js',
			'external/jasmine-2.5.2/boot.js',
			
			// application code
			'src/mago3d/*.js',
			
			// test dependencies
			
			// tests
			'test/*.js'
		],
	
		// list of files to exclude
		exclude: [
			'src/engine/cesium'
		],
		
		reporters:['progress'],
		
		// web server port
		port: 80,
	
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
//		browsers: process.env.TRAVIS ? ['Firefox'] : ['Chrome'],
		browsers : ['PhantomJS'],
		
//		plugins: [
//			'karma-jasmine',	
//			'karma-firefox-launcher',
//			'karma-chrome-launcher'
//		],		
		
		captureTimeout: 60000,
//		browserDisconnectTimeout: 5000,
		browserNoActivityTimeout: 10000,
//		browserDisconnectTolerance: 10,
		
		// enable / disable colors in the output (reporters and logs)
		colors: true,
	
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,
	
		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,		
				
		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true,
	
		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity
	})
}

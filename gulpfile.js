var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify');
//var imagemin = require('gulp-imagemin');
//var sourcemaps = require('gulp-sourcemaps');
var cleanCss = require('gulp-clean-css');
var rename = require("gulp-rename");
var util = require('gulp-util');
var convertEncoding = require('gulp-convert-encoding');
var jasmine = require('gulp-jasmine');
var jasmineBrowser = require('gulp-jasmine-browser');
var watch = require('gulp-watch');
var del = require('del');
var jsdoc = require('gulp-jsdoc3');
var Server = require('karma').Server;

var paths = {
	data : './3d_data',
	source_js : [ './src/js/*.js', '!./src/js/cesium' ],
	source_images : './images/*',
	source_css : './src/css/*',
	dest_js : './build/js',
	dest_images : './images',
	dest_css : './build/css',
	test : './test/*.js'
};

// 삭제가 필요한 디렉토리가 있는 경우
gulp.task('clean', function() {
	return del([ paths.dest_js, paths.dest_css ]);
});

//gulp.task('minify-js', [ 'clean' ], function() {
//	return gulp.src( paths.source_js )
//			.pipe(minify({
//				ext:{
//					src:'.js',
//					min:'.min.js'
//			    },
//			    exclude: ['tasks'],
//			    ignoreFiles: ['.combo.js', '.min.js']
//			}))
//			.pipe(gulp.dest( paths.dest_js ))
//});

gulp.task('uglify', [ 'clean' ], function () {
	return gulp.src(paths.source_js)
		.pipe(uglify())
		.pipe(rename({ suffix: '.min'}))
		.pipe(gulp.dest( paths.dest_js));
});

//gulp.task('combine-js', [ 'clean' ], function() {
//	return gulp.src(paths.source_js)
////			.pipe(stripeDebug())
//			.pipe(uglify())
//			//.pipe(rename({ suffix: '.min'}))
//			.pipe(concat('all.js'))
//			.pipe(gulp.dest(paths.dest_js));
//});

gulp.task('minify-css', [ 'clean' ], function() {
	return gulp.src(paths.source_css)
		.pipe(cleanCss({compatibility : 'ie8'}))
		.pipe(gulp.dest(paths.dest_css));
});

// // Copy all static images
//gulp.task('images', [ 'clean' ], function() {
//	return gulp.src(paths.images)
//		// Pass in options to the task
//		.pipe(imagemin({ optimizationLevel : 5}))
//		.pipe(gulp.dest('./public/dist/image'));
//});

gulp.task('watch', function() {
	gulp.watch( paths.source_js, ['uglify']);
});

//gulp.task('jasmine', function() {
//	return gulp.src( [ './external/jasmine-2.5.2/*.js', './test/hellospec.js', './src/test/hello.js' ] )
//			.pipe(convertEncoding({to: 'utf8'}))
//			.pipe(jasmine());
//});

//gulp.task('jasmine', function() {
//	  return gulp.src(['./src/js/*.js', './test/*.js'])
//	    .pipe(jasmineBrowser.specRunner())
//	    .pipe(jasmineBrowser.server({port: 8888}));
//	});

gulp.task('jasmine', function (done) {
	new Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done).start();
});

gulp.task('doc', function (cb) {
	var config = require('./jsdoc.json');
	gulp.src(['README.md', './src/js/*.js'], {read: false})
		.pipe(jsdoc(config, cb));
});

gulp.task('default', [ 'uglify', 'minify-css', 'jasmine', 'doc' ]);


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
//var jasmine = require('gulp-jasmine');
//var jasmineBrowser = require('gulp-jasmine-browser');
var mocha = require('gulp-mocha');
var watch = require('gulp-watch');
var del = require('del');
//var fileInclude = require('gulp-file-include');
var eslint = require('gulp-eslint');
var jsdoc = require('gulp-jsdoc3');
var Server = require('karma').Server;

var paths = {
	data : './data',
	source_js : [ './src/mago3d/*.js', '!./src/engine/cesium' ],
//	source_images : './images/*',
//	source_css : './src/css/*',
	dest_js : './build/mago3d',
//	dest_images : './images',
//	dest_css : './build/css',
	test : './test/*.js',
	build : './build'
};

// 삭제가 필요한 디렉토리가 있는 경우
gulp.task('clean', function() {
	return del([ paths.build ]);
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

////Concatenate and Minify JS task
//gulp.task('scripts', function() {
//  return gulp.src('./public_html/assets/js/modules/*.js')
//    .pipe(concat('webstoemp.js'))
//    .pipe(gulp.dest('./public_html/assets/js/build'))
//    .pipe(rename('webstoemp.min.js'))
//    .pipe(stripdebug())
//    .pipe(uglify())
//    .pipe(gulp.dest('./public_html/assets/js/build'))
//    .pipe(notify({ message: 'Scripts task complete' }));
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

//gulp.task('minify-css', [ 'clean' ], function() {
//	return gulp.src(paths.source_css)
//		.pipe(cleanCss({compatibility : 'ie8'}))
//		.pipe(gulp.dest(paths.dest_css));
//});

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

gulp.task('karma', function (done) {
	new Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done).start();
});

// eslint
gulp.task('lint', function() {
	return gulp.src(paths.source_js)
		.pipe(eslint({configFile : 'eslintrc.json'}))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('doc', function (cb) {
	var config = require('./jsdoc.json');
	gulp.src(['README.md', './src/mago3d/*.js'], {read: false})
		.pipe(jsdoc(config, cb));
});

gulp.task('default', [ 'uglify', 'doc' ]);

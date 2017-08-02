// jshint node:true
'use strict';

var fs = require('fs');
var path = require('path');
var gulp = require('gulp');

var globby = require('globby');
var rimraf = require('rimraf');
var glslStripComments = require('glsl-strip-comments');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
//var minify = require('gulp-minify');
//var imagemin = require('gulp-imagemin');
//var sourcemaps = require('gulp-sourcemaps');
//var cleanCss = require('gulp-clean-css');
var rename = require("gulp-rename");
//var util = require('gulp-util');
//var convertEncoding = require('gulp-convert-encoding');
//var jasmine = require('gulp-jasmine');
//var jasmineBrowser = require('gulp-jasmine-browser');
//var mocha = require('gulp-mocha');
//var watch = require('gulp-watch');
var mkdirp = require('mkdirp');
var del = require('del');
//var fileInclude = require('gulp-file-include');
var eslint = require('gulp-eslint');
var gulpIf = require('gulp-if');
var jsdoc = require('gulp-jsdoc3');
var Server = require('karma').Server;
//var yargs = require('yargs');

var paths = {
	data      : './data',
	source_js : [ './src/mago3d/*.js', './src/mago3d/*/*.js', '!./src/engine/cesium', '!./src/mago3d/Demo*.js' ],
	//	source_images : './images/*',
	//	source_css : './src/css/*',
	dest_js   : './build/mago3d',
	//	dest_images : './images',
	//	dest_css : './build/css',
	test      : './test/*.js',
	build     : './build'
};

function glslToJavaScript(minify, minifyStateFilePath) {
	fs.writeFileSync(minifyStateFilePath, minify);
	var minifyStateFileLastModified = fs.existsSync(minifyStateFilePath) ? fs.statSync(minifyStateFilePath).mtime.getTime() : 0;

	// collect all currently existing JS files into a set, later we will remove the ones
	// we still are using from the set, then delete any files remaining in the set.
	var leftOverJsFiles = {};
	var shaderContents = "'use strict';\nvar ShaderSource = ShaderSource || {};\n";

	globby.sync(['src/mago3d/Shaders/**/*.js']).forEach(function(file) {
		leftOverJsFiles[path.normalize(file)] = true;
	});

	var glslFiles = globby.sync(['src/mago3d/Shaders/**/*.glsl']);
	glslFiles.forEach(function(glslFile) {
		glslFile = path.normalize(glslFile);
		var baseName = path.basename(glslFile, '.glsl');
		var jsFile = path.join(path.dirname(glslFile), baseName) + '.js';

		delete leftOverJsFiles[jsFile];

		var jsFileExists = fs.existsSync(jsFile);
		var jsFileModified = jsFileExists ? fs.statSync(jsFile).mtime.getTime() : 0;
		var glslFileModified = fs.statSync(glslFile).mtime.getTime();

		if (jsFileExists && jsFileModified > glslFileModified && jsFileModified > minifyStateFileLastModified) {
			return;
		}

		var contents = fs.readFileSync(glslFile, 'utf8');
		contents = contents.replace(/\r\n/gm, '\n');

		var copyrightComments = '';
		var extractedCopyrightComments = contents.match(/\/\*\*(?:[^*\/]|\*(?!\/)|\n)*?@license(?:.|\n)*?\*\//gm);
		if (extractedCopyrightComments) {
			copyrightComments = extractedCopyrightComments.join('\n') + '\n';
		}

		if (minify) {
			contents = glslStripComments(contents);
			contents = contents.replace(/\s+$/gm, '').replace(/^\s+/gm, '').replace(/\n+/gm, '\n');
			contents += '\n';
		}

		contents = contents.split('"').join('\\"').replace(/\n/gm, '\\n\\\n');

		shaderContents += 'ShaderSource' + "['" + baseName + "']" + ' = "' + contents + '";\n';

		contents = copyrightComments + '\
/*global define*/\n\
define(function() {\n\
    \'use strict\';\n\
    return "' + contents + '";\n\
});';

		//fs.writeFileSync(jsFile, contents);
	});

	fs.writeFileSync('src/mago3d/ShaderSource.js', shaderContents);

	// delete any left over JS files from old shaders
	Object.keys(leftOverJsFiles).forEach(function(filepath) {
		rimraf.sync(filepath);
	});
}

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

gulp.task('uglify:js', [ 'combine:js' ], function () {
	return gulp.src(path.join(path.normalize(paths.dest_js), 'mago3d.js'))
		.pipe(uglify())
		.pipe(rename({extname: '.min.js'}))
		.pipe(gulp.dest(paths.dest_js));
});

gulp.task('combine:js', [ 'clean', 'build' ], function() {
	return gulp.src(paths.source_js)
		.pipe(concat('mago3d.js'))
		.pipe(gulp.dest(paths.dest_js));
});

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

function isFixed(file) {
	return file.eslint !== null && file.eslint.fixed;
}
gulp.task('watch', function() {
	//gulp.watch( paths.source_js, ['uglify']);
	gulp.watch('**/*.{js,jsx}', ['lint']);
});

gulp.task('karma', function (done) {
	new Server({
		configFile : __dirname + '/karma.conf.js',
		singleRun  : true
	}, done).start();
});

// eslint
gulp.task('lint', function() {
	return gulp.src(paths.source_js)
		.pipe(eslint({fix: true}))
		.pipe(eslint.format())
	//.pipe(rename({suffix: '.fixed'}))
		.pipe(gulpIf(isFixed, gulp.dest(function(file){
			return file.base;
		})))
		.pipe(eslint.failAfterError());
});

gulp.task('doc', function (cb) {
	var config = require('./jsdoc.json');
	gulp.src(['README.md', './src/mago3d/*.js'], {read: false})
		.pipe(jsdoc(config, cb));
});

gulp.task('build', function() {
	mkdirp.sync(paths.build);
	mkdirp.sync(paths.dest_js);
	glslToJavaScript(false, path.join(path.normalize(paths.build), 'minifyShaders.state'));
});

gulp.task('default', [ 'clean', 'combine:js', 'lint', 'doc' ]);

gulp.task('buildShader', function() {
	glslToJavaScript(false, path.join(path.normalize(paths.build), 'minifyShaders.state'));
});

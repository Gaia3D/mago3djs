// jshint node:true
'use strict';

var fs = require('fs');
var path = require('path');
var gulp = require('gulp');

var globby = require('globby');
var rimraf = require('rimraf');
var glslStripComments = require('glsl-strip-comments');
var concat = require('gulp-concat');
var uglifyjs = require('uglify-es');	// for ES6 support 
var composer = require('gulp-uglify/composer');
var uglify = composer(uglifyjs, console);

var rename = require("gulp-rename");
var mkdirp = require('mkdirp');
var del = require('del');

var eslint = require('gulp-eslint');
var gulpIf = require('gulp-if');
var jsdoc = require('gulp-jsdoc3');
var Server = require('karma').Server;

var paths = {
	data      : './data',
	source_js : [ './src/mago3d/*.js', './src/mago3d/**/*.js', '!./src/engine/cesium', '!./src/mago3d/Demo*.js' ],
	//	source_images : './images/*',
	//	source_css : './src/css/*',
	dest_js   : './build/mago3d',
	//	dest_images : './images',
	//	dest_css : './build/css',
	test      : './test/*.js',
	build     : './build'
};

function glslToJavaScript(minify, minifyStateFilePath) 
{
	fs.writeFileSync(minifyStateFilePath, minify);
	var minifyStateFileLastModified = fs.existsSync(minifyStateFilePath) ? fs.statSync(minifyStateFilePath).mtime.getTime() : 0;

	// collect all currently existing JS files into a set, later we will remove the ones
	// we still are using from the set, then delete any files remaining in the set.
	var leftOverJsFiles = {};
	var shaderContents = "'use strict';\nvar ShaderSource = {};\n";

	globby.sync(['src/mago3d/shader/glsl/**/*.js']).forEach(function(file) 
	{
		leftOverJsFiles[path.normalize(file)] = true;
	});

	var glslFiles = globby.sync(['src/mago3d/shader/glsl/**/*.glsl']);
	glslFiles.forEach(function(glslFile) 
	{
		glslFile = path.normalize(glslFile);
		var baseName = path.basename(glslFile, '.glsl');
		var jsFile = path.join(path.dirname(glslFile), baseName) + '.js';

		delete leftOverJsFiles[jsFile];

		var jsFileExists = fs.existsSync(jsFile);
		var jsFileModified = jsFileExists ? fs.statSync(jsFile).mtime.getTime() : 0;
		var glslFileModified = fs.statSync(glslFile).mtime.getTime();

		if (jsFileExists && jsFileModified > glslFileModified && jsFileModified > minifyStateFileLastModified) 
		{
			return;
		}

		var contents = fs.readFileSync(glslFile, 'utf8');
		contents = contents.replace(/\r\n/gm, '\n');

		var copyrightComments = '';
		var extractedCopyrightComments = contents.match(/\/\*\*(?:[^*\/]|\*(?!\/)|\n)*?@license(?:.|\n)*?\*\//gm);
		if (extractedCopyrightComments) 
		{
			copyrightComments = extractedCopyrightComments.join('\n') + '\n';
		}

		if (minify) 
		{
			contents = glslStripComments(contents);
			contents = contents.replace(/\s+$/gm, '').replace(/^\s+/gm, '').replace(/\n+/gm, '\n');
			contents += '\n';
		}

		contents = contents.split('"').join('\\"').replace(/\n/gm, '\\n\\\n');

		shaderContents += 'ShaderSource.' + baseName + ' = "' + contents + '";\n';

		contents = copyrightComments + '\
/*global define*/\n\
define(function() {\n\
    \'use strict\';\n\
    return "' + contents + '";\n\
});';

		//fs.writeFileSync(jsFile, contents);
	});

	fs.writeFileSync('src/mago3d/shader/ShaderSource.js', shaderContents);

	// delete any left over JS files from old shaders
	Object.keys(leftOverJsFiles).forEach(function(filepath) 
	{
		rimraf.sync(filepath);
	});
}

// 삭제가 필요한 디렉토리가 있는 경우
gulp.task('clean', function() 
{
	return del([ paths.build ]);
});

gulp.task('build', function(done) 
{
	mkdirp.sync(paths.build);
	mkdirp.sync(paths.dest_js);
	glslToJavaScript(false, path.join(path.normalize(paths.build), 'minifyShaders.state'));
	done();
});

gulp.task('combine:js', gulp.series( 'clean', 'build', function() 
{
	return gulp.src(paths.source_js)
		.pipe(concat('mago3d.js'))
		.pipe(gulp.dest(paths.dest_js));
}));

gulp.task('uglify:js', gulp.series( 'combine:js', function () 
{
	return gulp.src(path.join(path.normalize(paths.dest_js), 'mago3d.js'))
		//.pipe(stripDebug())
		.pipe(uglify())
		.pipe(rename({extname: '.min.js'}))
		.pipe(gulp.dest('./'));
}));

function isFixed(file) 
{
	return file.eslint !== null && file.eslint !== undefined && file.eslint.fixed;
}

gulp.task('watch', function() 
{
	gulp.watch('./src/mago3d/**/*.js', gulp.series('lint'));
});

gulp.task('karma', function (done) 
{
	new Server({
		configFile : __dirname + '/karma.conf.js',
		singleRun  : true
	}, done).start();
});

// eslint
gulp.task('lint', function() 
{
	var list = paths.source_js;
	list.push('!./src/mago3d/extern/*.js');
	return gulp.src(list)
		.pipe(eslint({fix: true}))
		.pipe(eslint.format())
		.pipe(gulpIf(isFixed, gulp.dest(function(file)
		{
			return file.base;
		})))
		.pipe(eslint.failAfterError());
});

gulp.task('doc', function (cb) 
{
	var config = require('./jsdoc.json');
	gulp.src(['README.md', './src/mago3d/*.js', './src/mago3d/**/*.js'], {read: false})
		.pipe(jsdoc(config, cb));
});

gulp.task('default', gulp.series('clean', 'lint', 'uglify:js',  'doc'));

gulp.task('buildShader', function(done) 
{
	mkdirp.sync(paths.build);
	glslToJavaScript(false, path.join(path.normalize(paths.build), 'minifyShaders.state'));
	done();
});

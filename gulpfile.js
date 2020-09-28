// jshint node:true
'use strict';

var fs = require('fs');
var ncp = require('ncp');
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
	source_js : [ './src/mago3d/*.js', './src/mago3d/**/*.js', '!./src/engine/cesium', '!./src/mago3d/Demo*.js', '!./src/mago3d/extern/*.js' ],
	dest_js   : './build/mago3d',
	worker_js : './build/mago3d/Worker',
	test      : ['./test/*.js', './test/mago3d/*.js', './test/mago3d/**/*.js'],
	build     : './build'
};

var packageJson = require('./package.json');
var version = packageJson.version;
if (/\.0$/.test(version))
{
	version = version.substring(0, version.length - 2);
}

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

function jsonToJavaScript(minify, minifyStateFilePath) 
{
	fs.writeFileSync(minifyStateFilePath, minify);
	var minifyStateFileLastModified = fs.existsSync(minifyStateFilePath) ? fs.statSync(minifyStateFilePath).mtime.getTime() : 0;

	// collect all currently existing JS files into a set, later we will remove the ones
	// we still are using from the set, then delete any files remaining in the set.
	var leftOverJsFiles = {};
	var messageContents = "'use strict';\nvar MessageSource = {};\n";

	globby.sync(['src/mago3d/message/i18n/**/*.js']).forEach(function(file) 
	{
		leftOverJsFiles[path.normalize(file)] = true;
	});

	var jsonFiles = globby.sync(['src/mago3d/message/i18n/**/*.json']);
	jsonFiles.forEach(function(jsonFile) 
	{
		jsonFile = path.normalize(jsonFile);
		var baseName = path.basename(jsonFile, '.json');
		var jsFile = path.join(path.dirname(jsonFile), baseName) + '.js';

		delete leftOverJsFiles[jsFile];

		var jsFileExists = fs.existsSync(jsFile);
		var jsFileModified = jsFileExists ? fs.statSync(jsFile).mtime.getTime() : 0;
		var glslFileModified = fs.statSync(jsonFile).mtime.getTime();

		if (jsFileExists && jsFileModified > glslFileModified && jsFileModified > minifyStateFileLastModified) 
		{
			return;
		}

		var contents = fs.readFileSync(jsonFile, 'utf8');
		if (minify) 
		{
			contents = contents.replace(/\s+$/gm, '').replace(/^\s+/gm, '').replace(/\n+/gm, '\n');
		}

		//contents = contents.replace(/\n/gm, '\\n\\\n');
		messageContents += 'MessageSource.' + baseName + ' = ' + contents + ';\n';
	});

	fs.writeFileSync('src/mago3d/message/MessageSource.js', messageContents);

	// delete any left over JS files from old shaders
	Object.keys(leftOverJsFiles).forEach(function(filepath) 
	{
		rimraf.sync(filepath);
	});
}

function filePathToModuleId(moduleId) 
{
	return moduleId.substring(0, moduleId.lastIndexOf('.')).replace(/\\/g, '/');
}

function createMago3D(minify, minifyStateFilePath) 
{
	fs.writeFileSync(minifyStateFilePath, minify);
	var minifyStateFileLastModified = fs.existsSync(minifyStateFilePath) ? fs.statSync(minifyStateFilePath).mtime.getTime() : 0;

	var assignments = [];
	var list = paths.source_js.slice(0);
	list.push('!./src/mago3d/api/APIGateway.js');
	list.push('!./src/mago3d/domain/Callback.js');
	list.push('!./src/mago3d/worker/*');
	globby.sync(list).forEach(function(file)
	{
		file = path.relative('src/mago3d', file);
		var parameterName = path.basename(file, path.extname(file));
		var assignmentName = "['" + parameterName + "']";
		assignments.push('_mago3d' + assignmentName + ' = ' + parameterName + ';');
	});

	var jsFile = path.join(path.normalize(paths.dest_js), 'mago3d.js');
	var jsFileExists = fs.existsSync(jsFile);
	var jsFileModified = jsFileExists ? fs.statSync(jsFile).mtime.getTime() : 0;

	if (jsFileExists && jsFileModified > minifyStateFileLastModified) 
	{
		return;
	}

	var contents = '\
\'use strict\';\n\
var Mago3D = (function() \n\
{\n\
'+ fs.readFileSync(jsFile, 'utf8') +'\
	var _mago3d = {\n\
		VERSION: \'' + version + '\',\n\
	};\n\
	'+ assignments.join('\n	') +'\n\
	return _mago3d;\n\
})();\n';
	fs.writeFileSync(jsFile, contents);
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
	jsonToJavaScript(false, path.join(path.normalize(paths.build), 'minifyShaders.state'));
	done();
});

gulp.task('merge:js', gulp.series( 'clean', 'build', function() 
{
	var list = paths.source_js.slice(0);
	list.push('!./src/mago3d/api/APIGateway.js');
	list.push('!./src/mago3d/domain/Callback.js');
	list.push('!./src/mago3d/worker/*');
	return gulp.src(list)
		.pipe(concat('mago3d.js'))
		.pipe(gulp.dest(paths.dest_js));
}));

gulp.task('combine:js', gulp.series( 'merge:js', function() 
{
	createMago3D(false, path.join(path.normalize(paths.build), 'minifyShaders.state'));

	var list = [];
	list.push('./src/mago3d/api/APIGateway.js');
	list.push('./src/mago3d/domain/Callback.js');
	list.push('./src/mago3d/extern/*.js');
	list.push(path.join(path.normalize(paths.dest_js), 'mago3d.js'));

	return gulp.src(list)
		.pipe(concat('mago3d.js'))
		.pipe(gulp.dest(paths.dest_js));
}));

gulp.task('uglify:js', gulp.series( 'combine:js', function () 
{
	copyWorker();
	return gulp.src(path.join(path.normalize(paths.dest_js), 'mago3d.js'))
		//.pipe(stripDebug())
		.pipe(uglify())
		.pipe(rename({extname: '.min.js'}))
		.pipe(gulp.dest('./'));
}));

function copyWorker()
{
	mkdirp.sync(paths.worker_js);
	ncp('./src/mago3d/worker/',paths.worker_js, function(err){
		if(err) {
			return console.error(err);
		}
	});
}

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
    var list = paths.source_js.slice(0);
    list = list.concat(paths.test);
    return gulp.src(list)
        .pipe(eslint({fix: true}))
        .pipe(eslint({fix: true, quiet: isError}))
        .pipe(eslint.format())
        .pipe(gulpIf(isFixed, gulp.dest(function(file)
        {
            return file.base;
        })))
        .pipe(eslint.failAfterError());

    function isError(msg){
        return msg.severity !== 1;
    }
});
gulp.task('doc', function (cb) 
{
	console.info(cb);
	var config = require('./jsdoc.json');
	gulp.src(['seeforest.md', './src/mago3d/core/MagoManager.js','./src/mago3d/core/Mago3d.js'
	,'./src/mago3d/core/TextureLayer.js'
,'./src/mago3d/core/WMSLayer.js'
,'./src/mago3d/core/XYZLayer.js'
,'./src/mago3d/geometry/MagoWorld.js'
,'./src/mago3d/geometry/Modeler.js'
,'./src/mago3d/geometry/MagoGeometry.js'
,'./src/mago3d/geometry/MagoPoint.js'
,'./src/mago3d/geometry/MagoPolyline.js'
,'./src/mago3d/geometry/MagoRectangle.js'
,'./src/mago3d/core/InteractionCollection.js'
,'./src/mago3d/parametricModels/interaction/DrawGeometryInteraction.js'
,'./src/mago3d/parametricModels/interaction/LineDrawer.js'
,'./src/mago3d/parametricModels/interaction/PointDrawer.js'
,'./src/mago3d/parametricModels/interaction/RectangleDrawer.js'
,'ol-magoworld.js'
], {read: true})
		.pipe(jsdoc(config, cb));
});

gulp.task('default', gulp.series('clean', 'lint', 'uglify:js'));

gulp.task('buildShader', function(done) 
{
	mkdirp.sync(paths.build);
	glslToJavaScript(false, path.join(path.normalize(paths.build), 'minifyShaders.state'));
	done();
});

exports.build = gulp.task('combine:js');

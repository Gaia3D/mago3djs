'use strict';

var MagoEarthViewerInit = function(containerId, serverPolicy) 
{
	ViewerInit.call(this, containerId, serverPolicy);
};

MagoEarthViewerInit.prototype = Object.create(ViewerInit.prototype);
MagoEarthViewerInit.prototype.constructor = MagoEarthViewerInit;

MagoEarthViewerInit.prototype.init = function() 
{
	var canvas = document.getElementById(containerId);
	var glAttrs = {antialias          : true, 
		stencil            : true,
		premultipliedAlpha : false};
	var gl = canvas.getContext("webgl", glAttrs);
	if (!gl)
	{ gl = canvas.getContext("experimental-webgl", glAttrs); }
    
	// Problem: canvas-width initially is 300 and canvas-height = 150.***
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
    
	magoManager = new MagoManager();
	var sceneState = magoManager.sceneState;
	sceneState.textureFlipYAxis = true;
	sceneState.gl = gl;
	sceneState.drawingBufferWidth[0] = canvas.clientWidth;
	sceneState.drawingBufferHeight[0] = canvas.clientHeight;
	sceneState.camera.frustum.aspectRatio[0] = canvas.clientWidth/canvas.clientHeight;
	sceneState.camera.frustum.fovRad[0] = Math.PI/3*1.8;
	sceneState.camera.frustum.fovyRad[0] = sceneState.camera.frustum.fovRad[0]/sceneState.camera.frustum.aspectRatio;
	sceneState.camera.frustum.tangentOfHalfFovy[0] = Math.tan(sceneState.camera.frustum.fovyRad[0]/2);
    
	// initial camera position.***
	sceneState.camera.position.set(-7586937.743019165, 10881859.054284709, 5648264.99911627);
	sceneState.camera.direction.set(0.5307589970384617, -0.7598419113077192, -0.3754132585133587);
	sceneState.camera.up.set(0.23477224008249162, -0.29380469331271475, 0.9265855321012102);
    
	// test init camera position.***
	//sphere.r = 6378137.0;
	sceneState.encodedCamPosHigh[0] = -7536640;
	sceneState.encodedCamPosHigh[1] = 10878976;
	sceneState.encodedCamPosHigh[2] = 5636096;
    
	sceneState.encodedCamPosLow[0] = -50297.7421875;
	sceneState.encodedCamPosLow[1] = 2883.05419921875;
	sceneState.encodedCamPosLow[2] = 12168.9990234375;

    
	viewer = new MagoWorld(magoManager);
	magoManager.magoWorld = viewer;
	magoManager.globe = new Globe();
	// init matrices.***
	viewer.updateModelViewMatrixByCamera(sceneState.camera);
	//magoManager.upDateSceneStateMatrices(sceneState);
    
	// Create the tinTerrains(MagoEarth).***
	magoManager.tinTerrainManager = new TinTerrainManager();
    
	// event listener.***
	canvas.addEventListener('mousedown', function(event)
	{
		viewer.mousedown(event);			
	}, false);
    
	canvas.addEventListener('mouseup', function(event)
	{
		viewer.mouseup(event);			
	}, false);
    
	canvas.addEventListener('mousewheel', function(event)
	{
		viewer.mousewheel(event); 
	}, false);
    
	canvas.addEventListener('mousemove', function(event)
	{
		viewer.mousemove(event);
	}, false);
    
	canvas.addEventListener('click', function(event)
	{
		viewer.mouseclick(event);
	}, false);
    
	canvas.addEventListener('resize', function(event)
	{
		// TODO:
		console.log("resize");
	}, false);
    
	canvas.addEventListener('keydown', function(event) // no works.***
	{
		viewer.keydown(event); // no works.***
	}, false);

	var gl = viewer.magoManager.sceneState.gl;
	var manager = viewer.magoManager;
	manager.vboMemoryManager.gl = gl;
	manager.postFxShadersManager.gl = gl;
	manager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
	manager.createDefaultShaders(gl);// A1-Use this.***
};

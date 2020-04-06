'use strict';

var MagoEarthViewerInit = function(containerId, serverPolicy) 
{
	ViewerInit.call(this, containerId, serverPolicy);
};

MagoEarthViewerInit.prototype = Object.create(ViewerInit.prototype);
MagoEarthViewerInit.prototype.constructor = MagoEarthViewerInit;

MagoEarthViewerInit.prototype.init = function() 
{
	this.magoManager = new MagoManager();
	this.viewer = new MagoWorld(this.magoManager);
	this.magoManager.magoWorld = this.viewer;
	this.magoManager.globe = new Globe();
	// init matrices.***
	this.viewer.updateModelViewMatrixByCamera(this.magoManager.sceneState.camera);
	//magoManager.upDateSceneStateMatrices(sceneState);
    
	// Create the tinTerrains(MagoEarth).***
	this.magoManager.tinTerrainManager = new TinTerrainManager();

	var gl = this.magoManager.sceneState.gl;
	this.magoManager.vboMemoryManager.gl = gl;
	this.magoManager.postFxShadersManager.gl = gl;
	this.magoManager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
	this.magoManager.createDefaultShaders(gl);// A1-Use this.***
};
MagoEarthViewerInit.prototype.setEventHandler = function() 
{
	var canvas = this.magoManager.sceneState.canvas;
	var viewer = this.viewer;
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
};
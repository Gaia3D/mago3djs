'use strict';

var MagoEarthViewerInit = function(containerId, serverPolicy, options) 
{
	this.options = options || {};
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
	// Create the tinTerrains(MagoEarth).***

	this.magoManager.tinTerrainManager = new TinTerrainManager(this.magoManager, this.options);
	//if (!this.magoManager.tinTerrainManager) { this.magoManager.tinTerrainManager = new TinTerrainManager(); }

	// init matrices.***
	this.viewer.updateModelViewMatrixByCamera(this.magoManager.sceneState.camera);
	var gl = this.magoManager.sceneState.gl;
	this.magoManager.vboMemoryManager.gl = gl;
	this.magoManager.postFxShadersManager.gl = gl;
	this.magoManager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
	this.magoManager.createDefaultShaders(gl);// A1-Use this.***

	var viewer = this.viewer;
	var manager = this.magoManager;
	setRequestAnimFrame();
	
	function setRequestAnimFrame() 
	{
		window.requestAnimFrame = (function() 
		{
			return  window.requestAnimationFrame || 
					window.webkitRequestAnimationFrame ||  
					window.mozRequestAnimationFrame || 
					window.oRequestAnimationFrame || 
					window.msRequestAnimationFrame ||
			// if none of the above, use non-native timeout method
			function(callback) 
			{
			  window.setTimeout(callback, 1000 / 60);
			};
		})(); 
		  
		function animationLoop()
		{
			// feedback loop requests new frame
			var a = requestAnimFrame( animationLoop );
			manager.reqFrameId = a;
			// render function is defined below
			render(); 
		}
		function render()
		{
			viewer.renderScene();
		}
		animationLoop();
	}	
};
MagoEarthViewerInit.prototype.setEventHandler = function() 
{
	var that =this;
	var canvas = that.magoManager.sceneState.canvas;
	var viewer = that.viewer;
	// event listener.***
	canvas.addEventListener('mousedown', function(event)
	{
		viewer.mousedown(event);			
	}, false);
    
	canvas.addEventListener('mouseup', function(event)
	{
		viewer.mouseup(event);			
	}, false);
    
	canvas.addEventListener('wheel', function(event)
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

	canvas.addEventListener('contextmenu', function(event) 
	{
		event.preventDefault();
		viewer.mouseRightClick(event);
	}, false);

	canvas.addEventListener('dblclick', function(event)
	{
		viewer.mouseDblClick(event);
	}, false);
    
	window.addEventListener('resize', function(event)
	{
		// TODO:
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;

		var magoWorld = viewer;
		var magomanager = magoWorld.magoManager;
		var sceneState = magomanager.sceneState;
		sceneState.setDrawingBufferSize(canvas.offsetWidth, canvas.offsetHeight);
	}, false);
	
	var handlekeydown = function(event) 
	{
		viewer.keydown(event); 
	};

	document.addEventListener('keydown', handlekeydown, false);
};
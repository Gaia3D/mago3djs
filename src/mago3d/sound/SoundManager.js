'use strict';

/**
 * @class SoundManager
 */
var SoundManager = function(magoManager) 
{
	if (!(this instanceof SoundManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// Terrain editing on the fly : how to get quantizedMesh:
	// https://community.cesium.com/t/terrain-editing-on-the-fly/9695/6

    this.soundLayersArray = [];
    this.magoManager = magoManager;

	// Simulation parameters.**************************************************************************
	this.simulationTextureWidth = 1024;
	this.simulationTextureHeight = 1024;
	//this.simulationTextureWidth = 512; // limited by DEM texture size
	//this.simulationTextureHeight = 512;
	this.bSsimulateWater = false;

	this.terrainTextureWidth = 512;
	this.terrainTextureHeight = 512;

	this.fbo;

    //this.createDefaultShaders();
	this.init();
	
};

SoundManager.prototype.init = function ()
{

	var magoManager = this.magoManager;
	var gl = this.magoManager.getGl();
	// create frame buffer object.
	
	if(!this.fbo) // simulation fbo (512 x 512).
	{
		var bufferWidth = this.simulationTextureWidth;
		var bufferHeight = this.simulationTextureHeight;
		var bUseMultiRenderTarget = this.magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 3}); 
	}

	// Create default shaders.
	this.createDefaultShaders();
};

SoundManager.prototype.render = function ()
{
	var magoManager = this.magoManager;
	var soundLayersCount = this.soundLayersArray.length;
	var layer;
	if(this.magoManager.currentFrustumIdx === 0)
	{
		// Simulate in the last frustum only.
		for(var i=0; i<soundLayersCount; i++)
		{
			layer = this.soundLayersArray[i];
			layer.doSimulationSteps(magoManager);
		}
	}

	// ************.MAIN-FRAMEBUFFER.************************************.MAIN-FRAMEBUFFER.************************
	// Once finished simulation, bind the current framebuffer. 
	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;
	magoManager.bindMainFramebuffer();
	gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);
};

SoundManager.prototype.newSoundLayer = function (options)
{
	var soundLayer = new SoundLayer(this, options);
	this.soundLayersArray.push(soundLayer);
	return soundLayer;
};
SoundManager.prototype._newTexture = function (gl, texWidth, texHeight)
{
	var imageData = new Uint8Array(texWidth * texHeight * 4);
	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);  // depthTex.
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	gl.bindTexture(gl.TEXTURE_2D, null);

	var magoTexture = new Texture();
	magoTexture.texId = tex;
	magoTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;

	return magoTexture;
};

SoundManager.prototype.createDefaultShaders = function ()
{
    // the water render shader.
    var magoManager = this.magoManager;
    var gl = magoManager.getGl();

    var use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
	var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	var glVersion = gl.getParameter(gl.VERSION);
	
	if (!magoManager.isCesiumGlobe())
	{
		var supportEXT = gl.getSupportedExtensions().indexOf("EXT_frag_depth");
		if (supportEXT > -1)
		{
			gl.getExtension("EXT_frag_depth");
		}
		magoManager.EXTENSIONS_init = true;
		use_linearOrLogarithmicDepth = "USE_LOGARITHMIC_DEPTH";

		magoManager.postFxShadersManager.bUseLogarithmicDepth = true;
	}

	magoManager.postFxShadersManager.bUseMultiRenderTarget = false;
	var supportEXT = gl.getSupportedExtensions().indexOf("WEBGL_draw_buffers");
	if (supportEXT > -1)
	{
		var extbuffers = gl.getExtension("WEBGL_draw_buffers");
		magoManager.postFxShadersManager.bUseMultiRenderTarget = true;
		use_multi_render_target = "USE_MULTI_RENDER_TARGET";
	}

	var userAgent = window.navigator.userAgent;
	var isIE = userAgent.indexOf('Trident') > -1;
	if (isIE) 
	{
		use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
		magoManager.postFxShadersManager.bUseLogarithmicDepth = false;	
	}

	// here creates the necessary shaders for waterManager.***
	// 1) waterRender Shader.********************************************************************************************
	var shaderName = "depthTexFromQuantizedMesh";
	var vs_source = ShaderSource.waterQuantizedMeshVS;
	var fs_source = ShaderSource.waterDEMTexFromQuantizedMeshFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.position3_loc = gl.getAttribLocation(shader.program, "a_pos");
	shader.u_minMaxHeights_loc = gl.getUniformLocation(shader.program, "u_minMaxHeights"); // change this by rainMaxHeight
	//shader.u_waterMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_waterMaxHeigh");
	//shader.u_contaminantMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_contaminantMaxHeigh");

	//shader.waterSourceTex_loc = gl.getUniformLocation(shader.program, "waterSourceTex");
	//shader.contaminantSourceTex_loc = gl.getUniformLocation(shader.program, "contaminantSourceTex");
	//shader.rainTex_loc = gl.getUniformLocation(shader.program, "rainTex");
	//shader.currWaterHeightTex_loc = gl.getUniformLocation(shader.program, "currWaterHeightTex");
	//shader.currContaminationHeightTex_loc = gl.getUniformLocation(shader.program, "currContaminationHeightTex");
	//shader.waterAditionTex_loc = gl.getUniformLocation(shader.program, "waterAditionTex");
	magoManager.postFxShadersManager.useProgram(shader);
	//gl.uniform1i(shader.waterSourceTex_loc, 0);

	
};

SoundManager.prototype._test_sound = function ()
{
	// 127.1966787369999992,35.5972825200000003 : 127.2283140579999952,35.6277023940000035 // original from BBC.
	var increLon = 5.0;
	var increLat = 25.0;

	increLon = 0.0;
	increLat = 0.0;

    var minLon = 127.1966787369999992 + increLon;
    var minLat = 35.5972825200000003 + increLat;
    var minAlt = 0;
    var maxLon = 127.2283140579999952 + increLon;
    var maxLat = 35.6277023940000035 + increLat;
    var maxAlt = 0;
    var geographicExtent = new GeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
    var options = {
        geographicExtent : geographicExtent
    };
    var soundLayer = this.newSoundLayer(options);

	//----------------------------------------------
    this.testStarted = true;
};
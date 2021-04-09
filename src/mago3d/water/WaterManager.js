'use strict';

/**
 * @class WaterManager
 */
var WaterManager = function(magoManager) 
{
	if (!(this instanceof WaterManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    // https://github.com/LanLou123/Webgl-Erosion

    this.waterLayersArray = [];
    this.magoManager = magoManager;

	this.fbo;

    this.createDefaultShaders();
	this.init();
};

/**
 * render
 */
WaterManager.prototype.newWater = function (options)
{
	var water = new Water(this, options);
	this.waterLayersArray.push(water);
	return water;
};

WaterManager.prototype.init = function ()
{
	/*
	var bufferWidth = this.sceneState.drawingBufferWidth[0];
	var bufferHeight = this.sceneState.drawingBufferHeight[0];
	var bUseMultiRenderTarget = this.postFxShadersManager.bUseMultiRenderTarget;
	this.texturesManager.lBuffer = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 3}); 
	*/

	// create frame buffer object.
	if(!this.fbo)
	{
		var gl = this.magoManager.getGl();
		var bufferWidth = 512;
		var bufferHeight = 512;
		var bUseMultiRenderTarget = this.magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 3}); 
	}
};

 /**
 * render
 */
WaterManager.prototype.createDefaultShaders = function ()
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
	var shaderName = "waterRender";
	var vs_source = ShaderSource.waterRenderVS;
	var fs_source = ShaderSource.waterRenderFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_SimRes_loc = gl.getUniformLocation(shader.program, "u_SimRes");
	shader.hightmap_loc = gl.getUniformLocation(shader.program, "hightmap");
	shader.terrainmap_loc = gl.getUniformLocation(shader.program, "terrainmap");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.hightmap_loc, 0);
	gl.uniform1i(shader.terrainmap_loc, 1);

	// 1) waterRender Shader.********************************************************************************************
	var shaderName = "waterDepthRender";
	var vs_source = ShaderSource.waterDepthRenderVS;
	var fs_source = ShaderSource.waterDepthRenderFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_SimRes_loc = gl.getUniformLocation(shader.program, "u_SimRes");
	shader.hightmap_loc = gl.getUniformLocation(shader.program, "hightmap");
	shader.terrainmap_loc = gl.getUniformLocation(shader.program, "terrainmap");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.hightmap_loc, 0);
	gl.uniform1i(shader.terrainmap_loc, 1);

	// 1.1) terrainRender Shader.********************************************************************************************
	var shaderName = "terrainRender";
	var vs_source = ShaderSource.waterSimTerrainRenderVS;
	var fs_source = ShaderSource.waterSimTerrainRenderFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_SimRes_loc = gl.getUniformLocation(shader.program, "u_SimRes");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.hightmap_loc = gl.getUniformLocation(shader.program, "hightmap");
	shader.terrainmap_loc = gl.getUniformLocation(shader.program, "terrainmap");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.hightmap_loc, 0);
	gl.uniform1i(shader.terrainmap_loc, 1);

	// 2) calculate waterHeight by water source and rain.*******************************************************************
	shaderName = "waterCalculateHeight";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateHeightFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);

	shader.waterSourceTex_loc = gl.getUniformLocation(shader.program, "waterSourceTex");
	shader.rainTex_loc = gl.getUniformLocation(shader.program, "rainTex");
	shader.currWaterHeightTex_loc = gl.getUniformLocation(shader.program, "currWaterHeightTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.waterSourceTex_loc, 0);
	gl.uniform1i(shader.rainTex_loc, 1);
	gl.uniform1i(shader.currWaterHeightTex_loc, 2);

	// 3) calculateFlux Shader.*********************************************************************************************
	shaderName = "waterCalculateFlux";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateFluxFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_SimRes_loc = gl.getUniformLocation(shader.program, "u_SimRes");
	shader.u_PipeLen_loc = gl.getUniformLocation(shader.program, "u_PipeLen");
	shader.u_timestep_loc = gl.getUniformLocation(shader.program, "u_timestep");
	shader.u_PipeArea_loc = gl.getUniformLocation(shader.program, "u_PipeArea");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");

	shader.waterHeightTex_loc = gl.getUniformLocation(shader.program, "waterHeightTex");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");
	shader.currWaterFluxTex_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.waterHeightTex_loc, 0);
	gl.uniform1i(shader.terrainHeightTex_loc, 1);
	gl.uniform1i(shader.currWaterFluxTex_loc, 2);

	// 4) calculateVelocity Shader.*********************************************************************************************
	shaderName = "waterCalculateVelocity";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateVelocityFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_SimRes_loc = gl.getUniformLocation(shader.program, "u_SimRes");
	shader.u_PipeLen_loc = gl.getUniformLocation(shader.program, "u_PipeLen");
	shader.u_timestep_loc = gl.getUniformLocation(shader.program, "u_timestep");
	shader.u_PipeArea_loc = gl.getUniformLocation(shader.program, "u_PipeArea");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");

	shader.waterHeightTex_loc = gl.getUniformLocation(shader.program, "waterHeightTex");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");
	shader.currWaterFluxTex_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.waterHeightTex_loc, 0);
	gl.uniform1i(shader.terrainHeightTex_loc, 1);
	gl.uniform1i(shader.currWaterFluxTex_loc, 2);
};

WaterManager.prototype.getQuadBuffer = function ()
{
	if(!this.screenQuad)
	{
		var gl = this.magoManager.getGl();
		var posData = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]); // total screen.
		var webglposBuffer = FBO.createBuffer(gl, posData);

		this.screenQuad = {
			posBuffer : webglposBuffer
		};
	}

	return this.screenQuad;
};

WaterManager.prototype.render = function ()
{
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();

	this.doSimulation();

	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;

	// Now, render the water depth.************************************************************************
	// Note: the water depth must be rendered in the depth framebuffer:
	var fbo = this.fbo;
	var shader = magoManager.postFxShadersManager.getShader("waterDepthRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();
	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		//waterLayer.renderWaterDepth(shader, magoManager);
	}

	// Once finished simulation, bind the current framebuffer.
	magoManager.bindMainFramebuffer();
	gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);

	// 1rst render terrain.********************************************************************************
	var shader = magoManager.postFxShadersManager.getShader("terrainRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();
	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.renderTerrain(shader, magoManager);
	}

	// 2nd, render water.**********************************************************************************
	shader = magoManager.postFxShadersManager.getShader("waterRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	// Bind the textures:
	var flipYTexCoord = false;
	gl.uniform1i(shader.textureFlipYAxis_loc, flipYTexCoord);
	shader.enableVertexAttribArray(shader.position3_loc);
	shader.enableVertexAttribArray(shader.texCoord2_loc);
	gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.

	gl.enable(gl.DEPTH_TEST);

	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.renderWater(shader, magoManager);
	}
};

/**
 * render
 */
WaterManager.prototype.doSimulation = function ()
{
	// bind frameBuffer.
	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.doSimulationSteps(this.magoManager);
	}
};

 /**
 */
WaterManager.prototype._test_water = function()
{
    // 127.1966787369999992,35.5972825200000003 : 127.2283140579999952,35.6277023940000035
    var minLon = 127.1966787369999992;
    var minLat = 35.5972825200000003;
    var minAlt = 0;
    var maxLon = 127.2283140579999952;
    var maxLat = 35.6277023940000035;
    var maxAlt = 0;
    var geographicExtent = new GeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
    var options = {
        geographicExtent : geographicExtent
    };
    var water = this.newWater(options);

	//----------------------------------------------
    this.testStarted = true;
};

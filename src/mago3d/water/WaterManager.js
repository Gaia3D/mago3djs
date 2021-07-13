'use strict';

/**
 * @class WaterManager
 */
var WaterManager = function (magoManager, options) 
{
	if (!(this instanceof WaterManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    // https://github.com/LanLou123/Webgl-Erosion
	// https://cgg.mff.cuni.cz/~jaroslav/papers/2008-sca-erosim/2008-sca-erosiom-fin.pdf

    this.waterLayersArray = [];
    this.magoManager = magoManager;

	// Simulation extension.***************************************************************************
	this.simulationGeoExtent;
	this.simulationTileDepth; // The water simulation runs over terrain of the some tile depth.

	// The DEM can be from highMapTextures files, or from quantizedMesh.*******************************
	this.terrainDemSourceType = "HIGHMAP"; // from HighMap or from QuantizedMesh.
	// if this.terrainDemSourceType === "HIGHMAP", then load from files.
	// if this.terrainDemSourceType === "QUANTIZEDMESH", then load the quantizedMesh & make the highMap.
	this.terrainProvider; // if this.terrainDemSourceType === "QUANTIZEDMESH", then use terrain provider to load quantizedMeshes.

	this.fbo;

	// Simulation parameters.**************************************************************************
	var simRes = 1024; // todo : try to set texture size that the simulation cell is aproximately square.
	this.simulationTextureSize = new Float32Array([simRes, simRes]);
	this.bSsimulateWater = false;
	this.terrainTextureSize = new Float32Array([simRes, simRes]);

	// Water wind.*************************************************************************************
	this.bRenderParticles = true;
	this.windParticlesPosFbo;
	this.windRes = 64;
	this.dropRate = 0.003; // how often the particles move to a random place
	this.dropRateBump = 0.001; // drop rate increase relative to individual particle speed
	//-------------------------------------------------------------------------------------------------

	// Rain.*******************************************************************************************
	this.bExistRain = false;

	// Terrain slippage.*******************************************************************************
	this.bSimulateTerrainSlippage = false;
	//-------------------------------------------------------------------------------------------------

	// Excavation.*************************************************************************************
	this.bExistPendentExcavation = false; // If this var is "true", then do excavation process only one time.
	this.bDoLandSlideSimulation = false; // false by default.
	//-------------------------------------------------------------------------------------------------

	// Check options.***
	if(options)
	{
		if(options.simulationGeographicExtent)
		{
			this.simulationGeoExtent = options.simulationGeographicExtent;
		}

		if(options.terrainDemSourceType)
		{
			this.terrainDemSourceType = options.terrainDemSourceType;
		}

		if(options.terrainProvider)
		{
			this.terrainProvider = options.terrainProvider;
		}

		if(options.renderParticles !== undefined)
		{
			this.bRenderParticles = options.renderParticles;
		}

		if(options.existRain !== undefined)
		{
			this.bExistRain = options.existRain;
		}

		if(options.waterSourceUrl !== undefined)
		{
			this.waterSourceUrl = options.waterSourceUrl;
		}
	}


    this.createDefaultShaders();
	this.init();
};

WaterManager.prototype.setDoLandSlideSimulation = function (bDoLandSlideSimulation)
{
	this.bDoLandSlideSimulation = bDoLandSlideSimulation;
};

/**
 * render
 */
WaterManager.prototype.newWater = function (options)
{
	var water = new Water(this, options);
	water.windRes = this.windRes;
	this.waterLayersArray.push(water);
	return water;
};

WaterManager.prototype.init = function ()
{
	// 1rst, determine the simulation texture size by this.simulationGeoExtent.
	var simulationGeoExtent = this.simulationGeoExtent;

	//var lonRange = simulationGeoExtent.getLongitudeRange();
	//var latRange = simulationGeoExtent.getLatitudeRange();


	var lonArcDist = simulationGeoExtent.getLongitudeArcDistance();
	var latArcDist = simulationGeoExtent.getLatitudeArcDistance();



	if(lonArcDist > latArcDist)
	{
		// longitude texture size is 1024.
		this.simulationTextureSize[0] = 1024;
		this.simulationTextureSize[1] = Math.floor(1024 * (latArcDist / lonArcDist));
	}
	else
	{
		this.simulationTextureSize[0] = Math.floor(1024 * (lonArcDist / latArcDist));
		this.simulationTextureSize[1] = 1024;
	}

	this.terrainTextureSize[0] = this.simulationTextureSize[0];
	this.terrainTextureSize[1] = this.simulationTextureSize[1];

	var magoManager = this.magoManager;
	var gl = this.magoManager.getGl();
	// create frame buffer object.
	
	if(!this.fbo) // simulation fbo (512 x 512).
	{
		var bufferWidth = this.simulationTextureSize[0];
		var bufferHeight = this.simulationTextureSize[1];
		var bUseMultiRenderTarget = this.magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 3}); 
	}

	if(!this.terrainTexFbo) // simulation fbo (512 x 512).
	{
		var bufferWidth = this.terrainTextureSize[0];
		var bufferHeight = this.terrainTextureSize[1];
		var bUseMultiRenderTarget = this.magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.terrainTexFbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 3}); 
	}

	if(!this.depthFbo) // screen size fbo.
	{
		var magoManager = this.magoManager;
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0];
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.depthFbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 3}); 
	}

	// Water particles.**************************************************************************************************************************************************
	// Create indices for the particles.
	this.numParticles = this.windRes * this.windRes;
	var particleIndices = new Float32Array(this.numParticles);
	for (var i = 0; i < this.numParticles; i++) 
	{ particleIndices[i] = i; }
	this.particleIndexBuffer = FBO.createBuffer(gl, particleIndices);

	this.particlesRenderTexWidth = 2048;
	this.particlesRenderTexHeight = 2048;

	if(!this.windParticlesPosFbo) // simulation fbo (windRes x windRes).
	{
		var bufferWidth = this.windRes;
		var bufferHeight = this.windRes;
		var bUseMultiRenderTarget = this.magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.windParticlesPosFbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 1}); 
	}

	if(!this.windParticlesRenderingFbo) // simulation fbo (windRes x windRes).
	{
		var bufferWidth = this.particlesRenderTexWidth;
		var bufferHeight = this.particlesRenderTexHeight;
		var bUseMultiRenderTarget = this.magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.windParticlesRenderingFbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 3}); 
	}
	//------------------------------------------------------------------------------------------------------------------------------------------------------------------------

	// create only one water layer.******************************************************************************************************************************************
	var geoExtent = this.simulationGeoExtent;
	var options = {
		geographicExtent : geoExtent
	};

	if(this.waterSourceUrl)
	{
		options.waterSourceUrl = this.waterSourceUrl;
	}

	var waterLayer = this.newWater(options);
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
	shader.hightmap_loc = gl.getUniformLocation(shader.program, "waterHeightTex");
	shader.terrainmap_loc = gl.getUniformLocation(shader.program, "terrainmap");
	shader.waterTex_loc = gl.getUniformLocation(shader.program, "waterTex");
	shader.contaminantHeightTex_loc = gl.getUniformLocation(shader.program, "contaminantHeightTex");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.projectionMatrixInv_loc = gl.getUniformLocation(shader.program, "projectionMatrixInv");//
	shader.uWaterType_loc = gl.getUniformLocation(shader.program, "uWaterType");//
	shader.u_waterMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_waterMaxHeigh");
	shader.u_RenderParticles_loc = gl.getUniformLocation(shader.program, "u_RenderParticles");
	shader.u_contaminantMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_contaminantMaxHeigh");
	shader.u_tileSize_loc = gl.getUniformLocation(shader.program, "u_tileSize");
	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_terrainTextureSize_loc = gl.getUniformLocation(shader.program, "u_terrainTextureSize");

	magoManager.postFxShadersManager.useProgram(shader);
	//gl.uniform1i(shader.depthTex_loc, 0);
	gl.uniform1i(shader.hightmap_loc, 1); // this is water height tex.
	gl.uniform1i(shader.terrainmap_loc, 2); // this is terrain height tex.
	gl.uniform1i(shader.waterTex_loc, 3); // this is water color tex.
	gl.uniform1i(shader.contaminantHeightTex_loc, 4); // this is contaminant height tex.
	

	// 1) waterRender Shader.********************************************************************************************
	var shaderName = "waterDepthRender"; // no used.
	var vs_source = ShaderSource.waterDepthRenderVS;
	var fs_source = ShaderSource.waterDepthRenderFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_SimRes_loc = gl.getUniformLocation(shader.program, "u_SimRes");
	shader.hightmap_loc = gl.getUniformLocation(shader.program, "waterHeightTex");
	shader.terrainmap_loc = gl.getUniformLocation(shader.program, "terrainmap");
	shader.contaminantHeightTex_loc = gl.getUniformLocation(shader.program, "contaminantHeightTex");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_waterMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_waterMaxHeigh");
	shader.u_contaminantMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_contaminantMaxHeigh");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.hightmap_loc, 0);
	gl.uniform1i(shader.terrainmap_loc, 1);
	gl.uniform1i(shader.contaminantHeightTex_loc, 2); // this is contaminant height tex.

	// 1.1) terrainRender Shader.********************************************************************************************
	var shaderName = "terrainRender";
	var vs_source = ShaderSource.waterSimTerrainRenderVS;
	var fs_source = ShaderSource.waterSimTerrainRenderFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_SimRes_loc = gl.getUniformLocation(shader.program, "u_SimRes");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_tileSize_loc = gl.getUniformLocation(shader.program, "u_tileSize");
	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.u_terrainTextureSize_loc = gl.getUniformLocation(shader.program, "u_terrainTextureSize");

	shader.hightmap_loc = gl.getUniformLocation(shader.program, "hightmap");
	shader.terrainmap_loc = gl.getUniformLocation(shader.program, "terrainmap");
	shader.difusseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");
	shader.terrainMapToCompare_loc = gl.getUniformLocation(shader.program, "terrainMapToCompare");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.hightmap_loc, 0);
	gl.uniform1i(shader.terrainmap_loc, 1);
	gl.uniform1i(shader.difusseTex_loc, 2);
	gl.uniform1i(shader.terrainMapToCompare_loc, 3);

	// 2) calculate waterHeight by water source and rain.*******************************************************************
	shaderName = "waterCalculateHeight";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateHeightFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_existRain_loc = gl.getUniformLocation(shader.program, "u_existRain"); // change this by rainMaxHeight
	shader.u_waterMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_waterMaxHeigh");
	shader.u_contaminantMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_contaminantMaxHeigh");

	shader.waterSourceTex_loc = gl.getUniformLocation(shader.program, "waterSourceTex");
	shader.contaminantSourceTex_loc = gl.getUniformLocation(shader.program, "contaminantSourceTex");
	shader.rainTex_loc = gl.getUniformLocation(shader.program, "rainTex");
	shader.currWaterHeightTex_loc = gl.getUniformLocation(shader.program, "currWaterHeightTex");
	shader.currContaminationHeightTex_loc = gl.getUniformLocation(shader.program, "currContaminationHeightTex");
	shader.waterAditionTex_loc = gl.getUniformLocation(shader.program, "waterAditionTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.waterSourceTex_loc, 0);
	gl.uniform1i(shader.rainTex_loc, 1);
	gl.uniform1i(shader.currWaterHeightTex_loc, 2);
	gl.uniform1i(shader.contaminantSourceTex_loc, 3);
	gl.uniform1i(shader.currContaminationHeightTex_loc, 4);
	gl.uniform1i(shader.waterAditionTex_loc, 5);

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
	shader.u_waterMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_waterMaxHeigh");
	shader.u_waterMaxFlux_loc = gl.getUniformLocation(shader.program, "u_waterMaxFlux");
	shader.u_tileSize_loc = gl.getUniformLocation(shader.program, "u_tileSize");

	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_terrainTextureSize_loc = gl.getUniformLocation(shader.program, "u_terrainTextureSize");
	shader.u_contaminantMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_contaminantMaxHeigh");

	shader.waterHeightTex_loc = gl.getUniformLocation(shader.program, "waterHeightTex");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");
	shader.currWaterFluxTex_HIGH_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex_HIGH");
	shader.currWaterFluxTex_LOW_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex_LOW");
	shader.contaminantHeightTex_loc = gl.getUniformLocation(shader.program, "contaminantHeightTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.waterHeightTex_loc, 0);
	gl.uniform1i(shader.terrainHeightTex_loc, 1);
	gl.uniform1i(shader.currWaterFluxTex_HIGH_loc, 2);
	gl.uniform1i(shader.currWaterFluxTex_LOW_loc, 3);
	gl.uniform1i(shader.contaminantHeightTex_loc, 4);
	

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
	shader.u_waterMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_waterMaxHeigh");
	shader.u_waterMaxFlux_loc = gl.getUniformLocation(shader.program, "u_waterMaxFlux");
	shader.u_tileSize_loc = gl.getUniformLocation(shader.program, "u_tileSize");
	shader.u_waterMaxVelocity_loc = gl.getUniformLocation(shader.program, "u_waterMaxVelocity");

	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_terrainTextureSize_loc = gl.getUniformLocation(shader.program, "u_terrainTextureSize");
	shader.u_contaminantMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_contaminantMaxHeigh");

	shader.waterHeightTex_loc = gl.getUniformLocation(shader.program, "waterHeightTex");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");
	shader.currWaterFluxTex_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex");
	shader.currWaterFluxTex_HIGH_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex_HIGH");
	shader.currWaterFluxTex_LOW_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex_LOW");
	shader.contaminantHeightTex_loc = gl.getUniformLocation(shader.program, "contaminantHeightTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.waterHeightTex_loc, 0);
	gl.uniform1i(shader.terrainHeightTex_loc, 1);
	gl.uniform1i(shader.currWaterFluxTex_HIGH_loc, 2);
	gl.uniform1i(shader.currWaterFluxTex_LOW_loc, 3);
	gl.uniform1i(shader.contaminantHeightTex_loc, 4);

	// 4.1) calculate terrain max slippage Shader.******************************************************************************************
	shaderName = "waterCalculateTerrainMaxSlippage"; //
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateTerrainMaxSlippageFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	
	shader.u_timestep_loc = gl.getUniformLocation(shader.program, "u_timestep");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_waterMaxFlux_loc = gl.getUniformLocation(shader.program, "u_terrainMaxFlux");
	shader.u_tileSize_loc = gl.getUniformLocation(shader.program, "u_tileSize");
	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_terrainTextureSize_loc = gl.getUniformLocation(shader.program, "u_terrainTextureSize");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.terrainHeightTex_loc, 0);

	// 4.1) calculate terrain flux Shader.******************************************************************************************
	shaderName = "waterCalculateTerrainFlux"; //waterCalculateTerrainMaxSlippageFS
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateTerrainFluxFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	
	shader.u_timestep_loc = gl.getUniformLocation(shader.program, "u_timestep");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_terrainMaxFlux_loc = gl.getUniformLocation(shader.program, "u_terrainMaxFlux");
	shader.u_tileSize_loc = gl.getUniformLocation(shader.program, "u_tileSize");
	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_terrainTextureSize_loc = gl.getUniformLocation(shader.program, "u_terrainTextureSize");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");
	shader.terrainMaxSlippageTex_loc = gl.getUniformLocation(shader.program, "terrainMaxSlippageTex");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.terrainHeightTex_loc, 0);
	gl.uniform1i(shader.terrainMaxSlippageTex_loc, 1);

	// 4.1) calculate terrain height by terrainFlux Shader.******************************************************************************************
	shaderName = "waterCalculateTerrainHeightByFlux"; 
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateTerrainHeightByFluxFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	
	shader.u_timestep_loc = gl.getUniformLocation(shader.program, "u_timestep");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_terrainMaxFlux_loc = gl.getUniformLocation(shader.program, "u_terrainMaxFlux");
	shader.u_tileSize_loc = gl.getUniformLocation(shader.program, "u_tileSize");
	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_terrainTextureSize_loc = gl.getUniformLocation(shader.program, "u_terrainTextureSize");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");
	shader.terrainFluxTex_HIGH_loc = gl.getUniformLocation(shader.program, "terrainFluxTex_HIGH");
	shader.terrainFluxTex_LOW_loc = gl.getUniformLocation(shader.program, "terrainFluxTex_LOW");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.terrainHeightTex_loc, 0);
	gl.uniform1i(shader.terrainFluxTex_HIGH_loc, 1);
	gl.uniform1i(shader.terrainFluxTex_LOW_loc, 2);
	

	// 4.1) Calculate sediment shader.******************************************************************************************
	shaderName = "waterCalculateSediment"; // NO USED .***
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateSedimentFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);

	shader.waterHeightTex_loc = gl.getUniformLocation(shader.program, "waterHeightTex");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");
	shader.currWaterFluxTex_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.waterHeightTex_loc, 0);
	gl.uniform1i(shader.terrainHeightTex_loc, 1);
	gl.uniform1i(shader.currWaterFluxTex_loc, 2);

	// 4.1) Calculate contaminant shader.******************************************************************************************
	shaderName = "waterCalculateContamination"; // NO USED .***
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCalculateContaminationFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_waterMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_waterMaxHeigh");
	shader.u_waterMaxFlux_loc = gl.getUniformLocation(shader.program, "u_waterMaxFlux");
	shader.u_tileSize_loc = gl.getUniformLocation(shader.program, "u_tileSize");
	shader.u_waterMaxVelocity_loc = gl.getUniformLocation(shader.program, "u_waterMaxVelocity");
	shader.u_contaminantMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_contaminantMaxHeigh");

	shader.waterHeightTex_loc = gl.getUniformLocation(shader.program, "waterHeightTex");
	shader.terrainHeightTex_loc = gl.getUniformLocation(shader.program, "terrainHeightTex");
	shader.currWaterFluxTex_loc = gl.getUniformLocation(shader.program, "currWaterFluxTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.waterHeightTex_loc, 0);
	gl.uniform1i(shader.terrainHeightTex_loc, 1);
	gl.uniform1i(shader.currWaterFluxTex_loc, 2);

	// 5) calculateVelocity Shader.*********************************************************************************************
	shaderName = "waterOrthogonalDepthRender";
	vs_source = ShaderSource.WaterOrthogonalDepthShaderVS;
	fs_source = ShaderSource.WaterOrthogonalDepthShaderFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_modelViewProjectionMatrix_loc = gl.getUniformLocation(shader.program, "modelViewProjectionMatrix");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.u_color4_loc = gl.getUniformLocation(shader.program, "u_color4");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_processType_loc = gl.getUniformLocation(shader.program, "u_processType");
	shader.currDEMTex_loc = gl.getUniformLocation(shader.program, "currDEMTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.currDEMTex_loc, 0);

	// 5.1) calculateHeight contamination Shader.**********************************************************************************
	shaderName = "waterOrthogonalContamination";
	vs_source = ShaderSource.WaterOrthogonalDepthShaderVS;
	fs_source = ShaderSource.waterCalculateHeightContaminationFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_modelViewProjectionMatrix_loc = gl.getUniformLocation(shader.program, "modelViewProjectionMatrix");
	shader.u_fluidMaxHeigh_loc = gl.getUniformLocation(shader.program, "u_fluidMaxHeigh");
	shader.u_fluidHeigh_loc = gl.getUniformLocation(shader.program, "u_fluidHeigh");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.u_color4_loc = gl.getUniformLocation(shader.program, "u_color4");
	shader.currDEMTex_loc = gl.getUniformLocation(shader.program, "currDEMTex");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.currDEMTex_loc, 0);

	// 6) simple texture copy Shader.*********************************************************************************************
	shaderName = "waterCopyTexture";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterCopyFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.texToCopy_loc = gl.getUniformLocation(shader.program, "texToCopy");
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.texToCopy_loc, 0);

	// 7) water particles update shader.*********************************************************************************************
	shaderName = "waterParticlesUpdate";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterUpdateParticlesFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_particles_loc = gl.getUniformLocation(shader.program, "u_particles"); // smple2d.
	shader.u_wind_loc = gl.getUniformLocation(shader.program, "u_wind"); // smple2d.

	shader.u_flipTexCoordY_windMap_loc = gl.getUniformLocation(shader.program, "u_flipTexCoordY_windMap");
	shader.u_wind_res_loc = gl.getUniformLocation(shader.program, "u_wind_res");
	shader.u_wind_min_loc = gl.getUniformLocation(shader.program, "u_wind_min");
	shader.u_wind_max_loc = gl.getUniformLocation(shader.program, "u_wind_max");
	shader.u_geoCoordRadiansMax_loc = gl.getUniformLocation(shader.program, "u_geoCoordRadiansMax");
	shader.u_geoCoordRadiansMin_loc = gl.getUniformLocation(shader.program, "u_geoCoordRadiansMin");
	shader.u_speed_factor_loc = gl.getUniformLocation(shader.program, "u_speed_factor");
	shader.u_drop_rate_loc = gl.getUniformLocation(shader.program, "u_drop_rate");
	shader.u_drop_rate_bump_loc = gl.getUniformLocation(shader.program, "u_drop_rate_bump");
	shader.u_rand_seed_loc = gl.getUniformLocation(shader.program, "u_rand_seed");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.u_particles_loc, 0);
	gl.uniform1i(shader.u_wind_loc, 1);

	// 7) water particles render shader.*********************************************************************************************
	shaderName = "waterParticlesRender";
	vs_source = ShaderSource.waterParticlesRenderVS;
	fs_source = ShaderSource.waterParticlesRenderFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_particles_loc = gl.getUniformLocation(shader.program, "u_particles"); // smple2d.
	shader.u_wind_loc = gl.getUniformLocation(shader.program, "u_wind"); // smple2d.

	shader.u_particles_res_loc = gl.getUniformLocation(shader.program, "u_particles_res");
	shader.u_flipTexCoordY_windMap_loc = gl.getUniformLocation(shader.program, "u_flipTexCoordY_windMap");
	shader.u_wind_min_loc = gl.getUniformLocation(shader.program, "u_wind_min");
	shader.u_wind_max_loc = gl.getUniformLocation(shader.program, "u_wind_max");
	shader.u_colorScale_loc = gl.getUniformLocation(shader.program, "u_colorScale");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.u_particles_loc, 0);
	gl.uniform1i(shader.u_wind_loc, 1);

	// 7) water particles render shader.*********************************************************************************************
	shaderName = "waterParticlesRenderFade";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterParticlesRenderingFadeFS;
	//fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	//fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_screen_loc = gl.getUniformLocation(shader.program, "u_screen"); // smple2d.
	shader.u_opacity_loc = gl.getUniformLocation(shader.program, "u_opacity");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.u_screen_loc, 0);
	
	// 8) depthTexFromQuantizedMesh Shader.********************************************************************************************
	var shaderName = "depthTexFromQuantizedMesh";
	var vs_source = ShaderSource.waterQuantizedMeshVS;
	var fs_source = ShaderSource.waterDEMTexFromQuantizedMeshFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.position3_loc = gl.getAttribLocation(shader.program, "a_pos");//
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");//
	shader.u_minMaxHeights_loc = gl.getUniformLocation(shader.program, "u_minMaxHeights"); // change this by rainMaxHeight//
	shader.colorType_loc = gl.getUniformLocation(shader.program, "colorType");//
	shader.u_oneColor4_loc = gl.getUniformLocation(shader.program, "u_oneColor4");

	shader.u_totalMinGeoCoord_loc = gl.getUniformLocation(shader.program, "u_totalMinGeoCoord");
	shader.u_totalMaxGeoCoord_loc = gl.getUniformLocation(shader.program, "u_totalMaxGeoCoord");
	shader.u_currentMinGeoCoord_loc = gl.getUniformLocation(shader.program, "u_currentMinGeoCoord");
	shader.u_currentMaxGeoCoord_loc = gl.getUniformLocation(shader.program, "u_currentMaxGeoCoord");
	magoManager.postFxShadersManager.useProgram(shader);

	// 7) TEST qMesh render shader.*********************************************************************************************
	shaderName = "qMeshRenderTEST";
	vs_source = ShaderSource.waterQuantizedMeshVS_3D_TEST;
	fs_source = ShaderSource.waterQuantizedMeshFS_3D_TEST;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_screen_loc = gl.getUniformLocation(shader.program, "u_screen"); // smple2d.
	shader.u_opacity_loc = gl.getUniformLocation(shader.program, "u_opacity");
	shader.colorType_loc = gl.getUniformLocation(shader.program, "colorType");//
	shader.u_oneColor4_loc = gl.getUniformLocation(shader.program, "u_oneColor4");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.u_screen_loc, 0);

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

WaterManager.prototype._newTexture = function (gl, texWidth, texHeight)
{
	var filter = gl.LINEAR;
	var data = new Uint8Array(texWidth * texHeight * 4);
	var tex = Texture.createTexture(gl, filter, data, texWidth, texHeight);

	var magoTexture = new Texture();
	magoTexture.texId = tex;
	magoTexture.imageWidth = texWidth;
	magoTexture.imageHeight = texHeight;
	magoTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;

	return magoTexture;
};

WaterManager.prototype.doIntersectedObjectsCulling = function (visiblesArray, nativeVisiblesArray)
{
	var isFarestFrustum = this.magoManager.isFarestFrustum();
	//if(!this.bObjectsCulling)
	//{
		var waterLayersCount = this.waterLayersArray.length;
		var waterLayer;

		if(isFarestFrustum)
		{
			for(var i=0; i<waterLayersCount; i++)
			{
				waterLayer = this.waterLayersArray[i];
				if(waterLayer.visibleObjectsControler)
				{ waterLayer.visibleObjectsControler.clear(); }
			}
		}

		for(var i=0; i<waterLayersCount; i++)
		{
			waterLayer = this.waterLayersArray[i];
			waterLayer.doIntersectedObjectsCulling(visiblesArray, nativeVisiblesArray);
		}

		this.bObjectsCulling = true;
	//}
};

WaterManager.prototype.makeWaterAndContaminationSourceTex = function ()
{
	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	var magoManager = this.magoManager;

	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.makeWaterAndContaminationSourceTex(magoManager);
	}
};

WaterManager.prototype.doExcavationDEM = function ()
{
	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	var shader;
	var magoManager = this.magoManager;

	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.excavationDEM(shader, magoManager);
	}
};

WaterManager.prototype.overWriteDEMWithObjects = function ()
{
	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	var shader;
	var magoManager = this.magoManager;

	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.overWriteDEMWithObjects(shader, magoManager);
	}
};

WaterManager.prototype.renderTerrain = function ()
{
	// Note: terrain must be rendered in opaques-pass.***
	var magoManager = this.magoManager;
	//magoManager.bindMainFramebuffer();
	//var gl = magoManager.getGl();
	//gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);

	// Render terrain.********************************************************************************
	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	var shader = magoManager.postFxShadersManager.getShader("terrainRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();
	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.renderTerrain(shader, magoManager);
	}
};

WaterManager.prototype._TEST_renderQMesh = function ()
{
	// Note: terrain must be rendered in opaques-pass.***
	var magoManager = this.magoManager;
	//magoManager.bindMainFramebuffer();
	//var gl = magoManager.getGl();
	//gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);

	// Render terrain.********************************************************************************
	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	//var shader = magoManager.postFxShadersManager.getShader("terrainRender");
	//magoManager.postFxShadersManager.useProgram(shader);
	//shader.bindUniformGenerals();
	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer._renderQMesh(magoManager);
	}
};

WaterManager.prototype.setExistPendentExcavation = function (bExistExcavation)
{
	this.bExistPendentExcavation = bExistExcavation;
};

WaterManager.prototype.setTrrainDiffuseTextureIdx = function (terrainDiffTexIdx)
{
	// Terrains can have 1 or more diffuse textures.
	// provisionally there are only 2 textures, so swap its.
	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		Water._swapTextures(waterLayer.terrainDiffTex, waterLayer.terrainDiffTex2);
	}
};

WaterManager.prototype.render = function ()
{
	// Note: water must be rendered in transparent-pass.***
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();

	// 1rst, check if exist excavations.*********************************************************************
	if(this.bExistPendentExcavation)
	{
		// do excavations only one time for all frustums.
		this.doExcavationDEM();
		if(this.magoManager.currentFrustumIdx === 0)
		{
			this.bExistPendentExcavation = false;
		}
	}
	//-------------------------------------------------------------------------------------------------------

	// 2nd, check if simulate water.************************************************************************
	if(this.bSsimulateWater)
	{
		//if(!this.magoManager.isCameraMoving)

		this.overWriteDEMWithObjects();
		this.makeWaterAndContaminationSourceTex();

		if(this.magoManager.currentFrustumIdx === 0)
		{ 
			// do simulation in "currentFrustumIdx" == 0 (nearestFrustum).
			// in nearestFrustum we have overWriteDEM data ready & updated.
			this.doSimulation(); 
		}
		
	}
	//-------------------------------------------------------------------------------------------------------
	

	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	var shader;

	// Now, render the water depth.************************************************************************
	// Note: the water depth must be rendered in the depth framebuffer:
	/*
	if(!this.depthTex || !this.depthTex.texId)
	{
		var texWidth = sceneState.drawingBufferWidth[0];
		var texHeight = sceneState.drawingBufferHeight[0];
		this.depthTex = this._newTexture(gl, texWidth, texHeight);
	}
	
	var fbo = this.depthFbo;
	var extbuffers = fbo.extbuffers;
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.depthTex.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	var shader = magoManager.postFxShadersManager.getShader("waterDepthRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	gl.disable(gl.BLEND);
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0);
	if(this.magoManager.isFarestFrustum())
	{ gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); }

	
	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.renderWaterDepth(shader, magoManager);
	}
	*/
	// ************.MAIN-FRAMEBUFFER.************************************.MAIN-FRAMEBUFFER.************************
	// Once finished simulation, bind the current framebuffer. 
	magoManager.bindMainFramebuffer();
	gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);


	// 2nd, render water.**********************************************************************************
	//if(this.bSsimulateWater)
	{
		shader = magoManager.postFxShadersManager.getShader("waterRender");
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();

		// Bind the textures:
		var flipYTexCoord = false;
		gl.uniform1i(shader.textureFlipYAxis_loc, flipYTexCoord);
		shader.enableVertexAttribArray(shader.position3_loc);
		shader.enableVertexAttribArray(shader.texCoord2_loc);
		gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform1i(shader.u_RenderParticles_loc, 1); // render particles.

		gl.enable(gl.DEPTH_TEST);

		for(var i=0; i<waterLayersCount; i++)
		{
			waterLayer = this.waterLayersArray[i];
			waterLayer.renderWater(shader, magoManager);
		}
	}
};

WaterManager.prototype.getContaminationObjectsArray = function ()
{
	if(!this._contaminationBoxesArray)
	this._contaminationBoxesArray = [];
	
	return this._contaminationBoxesArray;
};

WaterManager.prototype.getWaterSourceObjectsArray = function ()
{
	if(!this._waterSourceObjectsArray)
	this._waterSourceObjectsArray = [];
	
	return this._waterSourceObjectsArray;
};

/**
 * @param {MagoRenderable} object
 * @param {depth} number
 */
WaterManager.prototype.addObject = function (object, depth) 
{
	if(!(object instanceof MagoRenderable)) {
		return false;
	}
	
	var permitNames = ['waterGenerator', 'contaminationGenerator'];
	var nameType = permitNames.indexOf(object.name);
	if(!object.name || nameType < 0) {
		return false;
	}
	var objectArray = (nameType === 0) ? this.getWaterSourceObjectsArray() : this.getContaminationObjectsArray();
	objectArray.push(object);
	depth = depth ? depth : 5;
	this.magoManager.modeler.addObject(object, depth);
}

/**
 * @param {MagoRenderable} object
 */
 WaterManager.prototype.removeObject = function (object) 
 {
	 var _remove = function(item){
		return item !== object;
	}
	 if(!(object instanceof MagoRenderable)) {
		 return false;
	 }
	 
	 var permitNames = ['waterGenerator', 'contaminationGenerator'];
	 var nameType = permitNames.indexOf(object.name);
	 if(!object.name || nameType < 0) {
		 return false;
	 }

	 if(nameType === 0) {
		this._waterSourceObjectsArray = this._waterSourceObjectsArray.filter(_remove);
	 } else {
		this._contaminationBoxesArray = this._contaminationBoxesArray.filter(_remove);
	 }
	 
	 this.magoManager.modeler.removeObject(object);
 }

WaterManager.prototype.getExcavationObjectsArray = function ()
{
	if(!this._excavationObjectsArray)
	this._excavationObjectsArray = [];
	
	return this._excavationObjectsArray;
};

WaterManager.prototype._loadQuantizedMesh = function (L, X, Y, waterLayer)
{
	if(!this.qMeshesPromisesMap)
	{
		this.qMeshesPromisesMap = {};
	}

	if(this.qMeshesPromisesMap[L])
	{
		if(this.qMeshesPromisesMap[L][X])
		{
			if(this.qMeshesPromisesMap[L][X][Y])
			{
				// Exist the qMeshPromise, so wait.
				return false;
			}
		}
	}

	// if no exist qMeshPromise, then request.
	if(!this.qMeshesPromisesMap[L]){this.qMeshesPromisesMap[L] = {}};
	if(!this.qMeshesPromisesMap[L][X]){this.qMeshesPromisesMap[L][X] = {}};
	if(!this.qMeshesPromisesMap[L][X][Y]){this.qMeshesPromisesMap[L][X][Y] = {}};

	this.qMeshesPromisesMap[L][X][Y] = this.terrainProvider.requestTileGeometry(X, Y, L);
	this.qMeshesPromisesMap[L][X][Y].then((value) =>
	{
		if(!this.qMeshesMap[L]){this.qMeshesMap[L] = {}};
		if(!this.qMeshesMap[L][X]){this.qMeshesMap[L][X] = {}};
		if(!this.qMeshesMap[L][X][Y]){this.qMeshesMap[L][X][Y] = {}};

		this.qMeshesMap[L][X][Y] = value;
		this.qMeshesMap[L][X][Y].tileIndices = {
			L : L, X : X, Y : Y
		}; // no necessary.
	});
};

WaterManager.prototype.getQuantizedMesh = function (L, X, Y, waterLayer)
{
	if(!this.qMeshesMap)
	{
		this.qMeshesMap = {};
	}

	var existQMeshVbo = false;

	if(this.qMeshesMap[L])
	{
		if(this.qMeshesMap[L][X])
		{
			if(this.qMeshesMap[L][X][Y])
			{
				// return the qMeshVbo.
				return this.qMeshesMap[L][X][Y];
			}
		}
	}
	
	// If no exist the qMesh, then load it.
	this._loadQuantizedMesh(L, X, Y, waterLayer);
};

WaterManager.prototype.test__createExcavationBox = function (magoManager)
{
	var lon = 127.21537;
	var lat = 35.61202;

	// Test with box.***
	var width = 300.0;
	var length = 300.0;
	var height = 400.0;
	var name = "excavationObject";
	var initialGeoCoord = new GeographicCoord(lon, lat, 80.0);
	var box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(0.8, 0.8, 0.2, 1.0);
	box.options = {};
	var depth = 6;
	magoManager.modeler.addObject(box, depth);

	var excavationObjectsArray = this.getExcavationObjectsArray();
	excavationObjectsArray.push(box);

	return true;
};

WaterManager.prototype.test__createContaminationBox = function (magoManager)
{
	var lon = 127.21537;
	var lat = 35.61202;

	

	// Test with box.***
	var width = 10.0;
	var length = 10.0;
	var height = 200.0;
	var name = "contaminationGenerator";
	var initialGeoCoord = new GeographicCoord(lon, lat, 200.0);
	var box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(1.0, 0.5, 0.2, 1.0);
	box.options = {};
	var depth = 6;
	magoManager.modeler.addObject(box, depth);

	var contaminationBoxesArray = this.getContaminationObjectsArray();
	contaminationBoxesArray.push(box);

	// create 3 waterSourceObjects.***
	// this.getWaterSourceObjectsArray();
	lon = 127.21049;
	lat = 35.60385;

	width = 20.0;
	length = 20.0;
	height = 200.0;
	var alt = 300;
	name = "waterGenerator";
	initialGeoCoord = new GeographicCoord(lon, lat, alt);
	box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(0.2, 0.5, 1.0, 1.0);
	box.options = {};
	depth = 6;
	magoManager.modeler.addObject(box, depth);

	var waterSourceObjectsArray = this.getWaterSourceObjectsArray();
	waterSourceObjectsArray.push(box);

	// another water source.
	lon = 127.21592;
	lat = 35.61843;

	name = "waterGenerator";
	initialGeoCoord = new GeographicCoord(lon, lat, alt);
	box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(0.2, 0.5, 1.0, 1.0);
	box.options = {};
	depth = 6;
	magoManager.modeler.addObject(box, depth);

	var waterSourceObjectsArray = this.getWaterSourceObjectsArray();
	waterSourceObjectsArray.push(box);

	// another water source.
	lon = 127.21673;
	lat = 35.60460;

	name = "waterGenerator";
	initialGeoCoord = new GeographicCoord(lon, lat, alt);
	box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(0.2, 0.5, 1.0, 1.0);
	box.options = {};
	depth = 6;
	magoManager.modeler.addObject(box, depth);

	var waterSourceObjectsArray = this.getWaterSourceObjectsArray();
	waterSourceObjectsArray.push(box);

	
	return true;
};

WaterManager.prototype.test__createContaminationBox_sejong = function (magoManager)
{
	var lon = 127.23257;
	var lat = 36.51568;

	

	// Test with box.***
	var width = 20.0;
	var length = 20.0;
	var height = 200.0;
	var name = "contaminationGenerator";
	var initialGeoCoord = new GeographicCoord(lon, lat, 200.0);
	var box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(1.0, 0.5, 0.2, 1.0);
	box.options = {};
	var depth = 6;
	magoManager.modeler.addObject(box, depth);

	var contaminationBoxesArray = this.getContaminationObjectsArray();
	contaminationBoxesArray.push(box);

	// create 3 waterSourceObjects.***
	// this.getWaterSourceObjectsArray();
	lon = 126.90190;
	lat = 37.35583;

	var lon = 126.87882;
	var lat = 37.32386;

	width = 20.0;
	length = 20.0;
	width = 50.0;
	length = 50.0;
	height = 400.0;
	var alt = 50;
	name = "waterGenerator";
	initialGeoCoord = new GeographicCoord(lon, lat, alt);
	box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(0.2, 0.5, 1.0, 1.0);
	box.options = {};
	depth = 6;
	magoManager.modeler.addObject(box, depth);

	var waterSourceObjectsArray = this.getWaterSourceObjectsArray();
	waterSourceObjectsArray.push(box);

	// another water source.
	lon = 127.21592;
	lat = 35.61843;

	var lon = 126.88789;
	var lat = 37.34314;

	name = "waterGenerator";
	initialGeoCoord = new GeographicCoord(lon, lat, alt);
	box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(0.2, 0.5, 1.0, 1.0);
	box.options = {};
	depth = 6;
	magoManager.modeler.addObject(box, depth);

	var waterSourceObjectsArray = this.getWaterSourceObjectsArray();
	waterSourceObjectsArray.push(box);

	// another water source.
	lon = 127.21673;
	lat = 35.60460;

	var lon = 126.89650;
	var lat = 37.35525;

	name = "waterGenerator";
	initialGeoCoord = new GeographicCoord(lon, lat, alt);
	box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.setOneColor(0.2, 0.5, 1.0, 1.0);
	box.options = {};
	depth = 6;
	magoManager.modeler.addObject(box, depth);

	var waterSourceObjectsArray = this.getWaterSourceObjectsArray();
	waterSourceObjectsArray.push(box);

	
	return true;
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
    var water = this.newWater(options);

	//----------------------------------------------
    this.testStarted = true;
};

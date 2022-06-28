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
	this.maxSimulationSize = 500;
	this.simulationTextureSize = new Float32Array([this.maxSimulationSize, this.maxSimulationSize]);
	this.bSsimulateSound = false;
	this.terrainTextureSize = new Float32Array([this.maxSimulationSize, this.maxSimulationSize]);
	this.terrainHeightEncodingBytes = 1; // default 1byte.***

	this.airMaxPressure = 20.0;
	this.airEnvirontmentPressure = 1.0; // 1 Atm.***
	this.maxFlux = 200.0;
	this.airMaxVelocity = 40.0;

	// The DEM can be from highMapTextures files, or from quantizedMesh.*******************************
	this.terrainDemSourceType = "QUANTIZEDMESH"; // from HighMap or from QuantizedMesh.
	// if this.terrainDemSourceType === "HIGHMAP", then load from files.
	// if this.terrainDemSourceType === "QUANTIZEDMESH", then load the quantizedMesh & make the highMap.
	this.terrainProvider = this.magoManager.scene.globe.terrainProvider; // if this.terrainDemSourceType === "QUANTIZEDMESH", then use terrain provider to load quantizedMeshes.

	this.fbo;

	//this.createDefaultShaders();
	this.init();
	
};

SoundManager.prototype.init = function ()
{

	var magoManager = this.magoManager;
	var gl = this.magoManager.getGl();
	// create frame buffer object.
	
	if (!this.fbo) // simulation fbo (512 x 512).
	{
		var bufferWidth = this.simulationTextureSize[0];
		var bufferHeight = this.simulationTextureSize[1];
		var bUseMultiRenderTarget = this.magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 3}); 
	}

	if (!this.terrainTexFbo) // simulation fbo (512 x 512).
	{
		var bufferWidth = this.terrainTextureSize[0];
		var bufferHeight = this.terrainTextureSize[1];
		var bUseMultiRenderTarget = this.magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.terrainTexFbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 3}); 
	}

	// Create default shaders.
	this.createDefaultShaders();
};

SoundManager.prototype.doSimulation = function ()
{
	var magoManager = this.magoManager;
	var soundLayersCount = this.soundLayersArray.length;
	var layer;
	if (this.magoManager.currentFrustumIdx === 0)
	{
		// Simulate in the last frustum only.
		for (var i=0; i<soundLayersCount; i++)
		{
			layer = this.soundLayersArray[i];
			layer.doSimulationSteps(magoManager);
		}
	}
};

SoundManager.prototype.overWriteDEMWithObjects = function ()
{
	var soundLayersCount = this.soundLayersArray.length;
	var layer;
	var shader;
	var magoManager = this.magoManager;

	for (var i=0; i<soundLayersCount; i++)
	{
		layer = this.soundLayersArray[i];
		layer.overWriteDEMWithObjects(shader, magoManager);
	}
};

SoundManager.prototype._renderSoundLayers = function ()
{
	var magoManager = this.magoManager;
	var soundLayersCount = this.soundLayersArray.length;
	var layer;
	//if (this.magoManager.currentFrustumIdx === 0)
	{
		// Simulate in the last frustum only.
		for (var i=0; i<soundLayersCount; i++)
		{
			layer = this.soundLayersArray[i];
			layer.renderWave(magoManager);
		}
	}
};

SoundManager.prototype.render = function ()
{
	if (!this.testStarted)
	{
		this._test_sound();
	}

	var magoManager = this.magoManager;

	// make dem tex with buildings, if the simulation is not started yet. TODO : .***
	this.overWriteDEMWithObjects();

	// Now, do the simulation steps.***
	if (!magoManager.isCameraMoving && !magoManager.mouseLeftDown && !magoManager.mouseMiddleDown)
	{
		this.doSimulation();
	}
	

	// Now, render the wave.***
	this._renderSoundLayers();

	

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

SoundManager.prototype.doIntersectedObjectsCulling = function (visiblesArray, nativeVisiblesArray)
{
	// Note : do this process only 1 time.***
	//if (!this.intersectedObjectsCullingFinished)
	//{
	var isFarestFrustum = this.magoManager.isFarestFrustum();
	var soundLayersCount = this.soundLayersArray.length;
	var waterLayer;
	/*
		if (isFarestFrustum)
		{
			for (var i=0; i<soundLayersCount; i++)
			{
				waterLayer = this.soundLayersArray[i];
				if (waterLayer.visibleObjectsControler)
				{ waterLayer.visibleObjectsControler.clear(); }
			}
		}
		*/

	for (var i=0; i<soundLayersCount; i++)
	{
		waterLayer = this.soundLayersArray[i];
		waterLayer.doIntersectedObjectsCulling(visiblesArray, nativeVisiblesArray);
	}

	this.intersectedObjectsCullingFinished = true;
	//}
	
};

SoundManager.prototype._test_sound = function ()
{
	//var minLon = 127.23049, minLat = 36.50861, minAlt = 0.0, maxLon = 127.24178, maxLat = 36.51691, maxAlt = 400.0; // big
	//var minLon = 127.23596, minLat = 36.50977, minAlt = 60.0, maxLon = 127.23915, maxLat = 36.51229, maxAlt = 95.0; // small
	var minLon = 127.23596, minLat = 36.50977, minAlt = 60.0, maxLon = 127.23915, maxLat = 36.51229, maxAlt = 140.0; // small
	
	var geographicExtent = new GeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
	var options = {
		geographicExtent: geographicExtent
	};
	var soundLayer = this.newSoundLayer(options);

	// provisionally make a native extruded object to render the simulation box.***
	this.simulationBox = geographicExtent.getRenderableObject(this.magoManager);
	this.simulationBox.setOneColor(0, 146/255, 203/255, 0.3); // kim seon young 20220523.***
	this.simulationBox.attributes.isMovable = false;
	this.simulationBox.attributes.isSelectable = false;
	this.simulationBox.attributes.name = "soundSimulationSpaceBox";
	this.simulationBox.attributes.doubleFace = true;
	this.simulationBox.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0); // selectedColor fully transparent.
	if (this.simulationBox.options === undefined)
	{ this.simulationBox.options = {}; }
	
	// set wireframe parameters.***
	this.simulationBox.options.renderWireframe = true;
	if (this.simulationBox.objectsArray && this.simulationBox.objectsArray.length > 0)
	{
		var object = this.simulationBox.objectsArray[0];
		object.thickness = 2.5;

		var surfacesCount = object.getSurfacesCount();
		object.setColor(0, 146/255, 203/255, 0.3); // sets color for all surfaces.***

		// now, set colors for caps:
		var surface = object.getSurface(surfacesCount - 2); // top cap surface.***
		surface.setColor(0, 146/255, 203/255, 0.0);

		var surface = object.getSurface(surfacesCount - 1); // down cap surface.***
		surface.setColor(0, 146/255, 203/255, 0.0);
	}

	this.simulationBox.options.renderShaded = true;
	this.simulationBox.options.depthMask = false;
	var depth = 4;
	//this.magoManager.modeler.addObject(this.simulationBox, depth);
	//----------------------------------------------
	this.testStarted = true;
};

SoundManager.prototype._newTexture = function (gl, texWidth, texHeight)
{
	var imageData = new Uint8Array(texWidth * texHeight * 4);
	var filter = gl.NEAREST;
	var tex = Texture.createTexture(gl, filter, imageData, texWidth, texHeight);

	var magoTexture = new Texture();
	magoTexture.texId = tex;
	magoTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
	magoTexture.imageWidth = texWidth;
	magoTexture.imageHeight = texHeight;

	return magoTexture;
};

SoundManager.prototype.getQuadBuffer = function ()
{
	if (!this.screenQuad)
	{
		var gl = this.magoManager.getGl();
		var posData = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]); // total screen.
		var webglposBuffer = FBO.createBuffer(gl, posData);

		this.screenQuad = {
			posBuffer: webglposBuffer
		};
	}

	return this.screenQuad;
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
	shader.u_oneColor4_loc = gl.getUniformLocation(shader.program, "u_oneColor4"); //
	shader.u_terrainHeightEncodingBytes_loc = gl.getUniformLocation(shader.program, "u_terrainHeightEncodingBytes");
	shader.u_flipTexCoordY_loc = gl.getUniformLocation(shader.program, "u_flipTexCoordY");

	shader.u_totalMinGeoCoord_loc = gl.getUniformLocation(shader.program, "u_totalMinGeoCoord");
	shader.u_totalMaxGeoCoord_loc = gl.getUniformLocation(shader.program, "u_totalMaxGeoCoord");
	shader.u_currentMinGeoCoord_loc = gl.getUniformLocation(shader.program, "u_currentMinGeoCoord");
	shader.u_currentMaxGeoCoord_loc = gl.getUniformLocation(shader.program, "u_currentMaxGeoCoord");
	magoManager.postFxShadersManager.useProgram(shader);

	// 5) waterOrthogonalDepthRender Shader.*********************************************************************************************
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
	shader.u_terrainHeightEncodingBytes_loc = gl.getUniformLocation(shader.program, "u_terrainHeightEncodingBytes");
	shader.u_processType_loc = gl.getUniformLocation(shader.program, "u_processType");
	shader.currDEMTex_loc = gl.getUniformLocation(shader.program, "currDEMTex");
	shader.u_quantizedVolume_MinMax_loc = gl.getUniformLocation(shader.program, "u_quantizedVolume_MinMax");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.currDEMTex_loc, 0);

	// 5) waterOrthogonalDepthRender Shader.*********************************************************************************************
	shaderName = "orthogonalVoxelizationRender_MRT";
	vs_source = ShaderSource.OrthogonalVoxelizationShaderVS_MRT;
	fs_source = ShaderSource.OrthogonalVoxelizationShaderFS_MRT;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_modelViewProjectionMatrix_loc = gl.getUniformLocation(shader.program, "modelViewProjectionMatrix");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.u_color4_loc = gl.getUniformLocation(shader.program, "u_color4");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_terrainHeightEncodingBytes_loc = gl.getUniformLocation(shader.program, "u_terrainHeightEncodingBytes");
	shader.u_processType_loc = gl.getUniformLocation(shader.program, "u_processType");
	shader.currDEMTex_loc = gl.getUniformLocation(shader.program, "currDEMTex");
	shader.u_quantizedVolume_MinMax_loc = gl.getUniformLocation(shader.program, "u_quantizedVolume_MinMax");
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

	// voxelize shader.*********************************************************************************************
	shaderName = "voxelize";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterVoxelizeFromDepthTexFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.a_pos = gl.getAttribLocation(shader.program, "a_pos");//
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize"); // The original texture3D size.***
	shader.u_mosaicTexSize_loc = gl.getUniformLocation(shader.program, "u_mosaicTexSize"); // The mosaic texture size.***
	shader.u_mosaicSize_loc = gl.getUniformLocation(shader.program, "u_mosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_lowestMosaicSliceIndex_loc = gl.getUniformLocation(shader.program, "u_lowestMosaicSliceIndex");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_realTex3d_minMaxAltitudes_loc = gl.getUniformLocation(shader.program, "u_realTex3d_minMaxAltitudes");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.depthTex_loc, 0);

	// voxelizeFromPartialYDirectionTexture3D shader.*********************************************************************************************
	shaderName = "voxelizeFromPartialYDirectionTexture3D";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterVoxelizeFromPartialYDirectionTexture3DFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.a_pos = gl.getAttribLocation(shader.program, "a_pos");//
	shader.currentSceneVoxelizedMosaicTex_loc = gl.getUniformLocation(shader.program, "currentSceneVoxelizedMosaicTex"); // tex.***
	shader.partialYDirectionMosaicTex_loc = gl.getUniformLocation(shader.program, "partialYDirectionMosaicTex"); // tex.***
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize"); // The original texture3D size.***
	shader.u_mosaicTexSize_loc = gl.getUniformLocation(shader.program, "u_mosaicTexSize"); // The mosaic texture size.***
	shader.u_mosaicSize_loc = gl.getUniformLocation(shader.program, "u_mosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_lowestMosaicSliceIndex_loc = gl.getUniformLocation(shader.program, "u_lowestMosaicSliceIndex");//
	shader.u_lowestYDirMosaicSliceIndex_loc = gl.getUniformLocation(shader.program, "u_lowestYDirMosaicSliceIndex");//
	shader.u_yDirMosaicSize_loc = gl.getUniformLocation(shader.program, "u_yDirMosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_yDirTextureSize_loc = gl.getUniformLocation(shader.program, "u_yDirTextureSize"); // The original texture3D size of the yDirTex3d.***

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.currentSceneVoxelizedMosaicTex_loc, 0);
	gl.uniform1i(shader.partialYDirectionMosaicTex_loc, 1);

	// voxelizeFromPartialXDirectionTexture3D shader.*********************************************************************************************
	shaderName = "voxelizeFromPartialXDirectionTexture3D";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterVoxelizeFromPartialXDirectionTexture3DFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.a_pos = gl.getAttribLocation(shader.program, "a_pos");//
	shader.currentSceneVoxelizedMosaicTex_loc = gl.getUniformLocation(shader.program, "currentSceneVoxelizedMosaicTex"); // tex.***
	shader.partialXDirectionMosaicTex_loc = gl.getUniformLocation(shader.program, "partialXDirectionMosaicTex"); // tex.***
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize"); // The original texture3D size.***
	shader.u_mosaicTexSize_loc = gl.getUniformLocation(shader.program, "u_mosaicTexSize"); // The mosaic texture size.***
	shader.u_mosaicSize_loc = gl.getUniformLocation(shader.program, "u_mosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_lowestMosaicSliceIndex_loc = gl.getUniformLocation(shader.program, "u_lowestMosaicSliceIndex");//
	shader.u_lowestXDirMosaicSliceIndex_loc = gl.getUniformLocation(shader.program, "u_lowestXDirMosaicSliceIndex");//
	shader.u_xDirMosaicSize_loc = gl.getUniformLocation(shader.program, "u_xDirMosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_xDirTextureSize_loc = gl.getUniformLocation(shader.program, "u_xDirTextureSize"); // The original texture3D size of the yDirTex3d.***

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.currentSceneVoxelizedMosaicTex_loc, 0);
	gl.uniform1i(shader.partialXDirectionMosaicTex_loc, 1);

	// voxelizeFromPartialZDirectionTexture3D shader.*********************************************************************************************
	shaderName = "voxelizeFromPartialZDirectionTexture3D";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.waterVoxelizeFromPartialZDirectionTexture3DFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.a_pos = gl.getAttribLocation(shader.program, "a_pos");//
	shader.currentSceneVoxelizedMosaicTex_loc = gl.getUniformLocation(shader.program, "currentSceneVoxelizedMosaicTex"); // tex.***
	shader.partialZDirectionMosaicTex_loc = gl.getUniformLocation(shader.program, "partialZDirectionMosaicTex"); // tex.***
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize"); // The original texture3D size.***
	shader.u_mosaicTexSize_loc = gl.getUniformLocation(shader.program, "u_mosaicTexSize"); // The mosaic texture size.***
	shader.u_mosaicSize_loc = gl.getUniformLocation(shader.program, "u_mosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_lowestMosaicSliceIndex_loc = gl.getUniformLocation(shader.program, "u_lowestMosaicSliceIndex");//
	shader.u_lowestZDirMosaicSliceIndex_loc = gl.getUniformLocation(shader.program, "u_lowestZDirMosaicSliceIndex");//
	shader.u_zDirMosaicSize_loc = gl.getUniformLocation(shader.program, "u_zDirMosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_zDirTextureSize_loc = gl.getUniformLocation(shader.program, "u_zDirTextureSize"); // The original texture3D size of the yDirTex3d.***

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.currentSceneVoxelizedMosaicTex_loc, 0);
	gl.uniform1i(shader.partialZDirectionMosaicTex_loc, 1);

	// Ortographic renderer to magoTexture3D.************************************************************************
	shaderName = "renderOrthogonalToMagoTexture3D";
	vs_source = ShaderSource.WaterOrthogonalDepthShaderVS;
	fs_source = ShaderSource.WaterOrthogonalMagoTexture3DFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_modelViewProjectionMatrix_loc = gl.getUniformLocation(shader.program, "modelViewProjectionMatrix");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.u_color4_loc = gl.getUniformLocation(shader.program, "u_color4");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	shader.u_simulationTextureSize_loc = gl.getUniformLocation(shader.program, "u_simulationTextureSize");
	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize");
	shader.u_lowestTex3DSliceIndex_loc = gl.getUniformLocation(shader.program, "u_lowestTex3DSliceIndex");
	shader.u_airMaxPressure_loc = gl.getUniformLocation(shader.program, "u_airMaxPressure");
	shader.u_currAirPressure_loc = gl.getUniformLocation(shader.program, "u_currAirPressure");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.currDEMTex_loc, 0);

	// 6) simple texture copy Shader.*********************************************************************************************
	shaderName = "copyTextureIntoMosaic";
	vs_source = ShaderSource.quadVertTexCoordVS;
	fs_source = ShaderSource.soundCopyFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.a_pos_loc = gl.getAttribLocation(shader.program, "a_pos");//
	shader.a_texcoord_loc = gl.getAttribLocation(shader.program, "a_texcoord");//
	shader.texToCopy_loc = gl.getUniformLocation(shader.program, "texToCopy");
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.texToCopy_loc, 0);

	// 2) calculate air pressure from sound source.******************************************************************************
	shaderName = "soundCalculateAirPressure";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.soundCalculatePressureFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.a_pos = gl.getAttribLocation(shader.program, "a_pos");
	shader.u_airMaxPressure_loc = gl.getUniformLocation(shader.program, "u_airMaxPressure");
	shader.u_airEnvirontmentPressure_loc = gl.getUniformLocation(shader.program, "u_airEnvirontmentPressure");
	shader.u_processType_loc = gl.getUniformLocation(shader.program, "u_processType");

	shader.soundSourceTex_0_loc = gl.getUniformLocation(shader.program, "soundSourceTex_0");
	shader.soundSourceTex_1_loc = gl.getUniformLocation(shader.program, "soundSourceTex_1");
	shader.soundSourceTex_2_loc = gl.getUniformLocation(shader.program, "soundSourceTex_2");
	shader.soundSourceTex_3_loc = gl.getUniformLocation(shader.program, "soundSourceTex_3");
	shader.currAirPressureTex_0_loc = gl.getUniformLocation(shader.program, "currAirPressureTex_0");
	shader.currAirPressureTex_1_loc = gl.getUniformLocation(shader.program, "currAirPressureTex_1");
	shader.currAirPressureTex_2_loc = gl.getUniformLocation(shader.program, "currAirPressureTex_2");
	shader.currAirPressureTex_3_loc = gl.getUniformLocation(shader.program, "currAirPressureTex_3");
	magoManager.postFxShadersManager.useProgram(shader);

	gl.uniform1i(shader.soundSourceTex_0_loc, 0);
	gl.uniform1i(shader.soundSourceTex_1_loc, 1);
	gl.uniform1i(shader.soundSourceTex_2_loc, 2);
	gl.uniform1i(shader.soundSourceTex_3_loc, 3);
	gl.uniform1i(shader.currAirPressureTex_0_loc, 4);
	gl.uniform1i(shader.currAirPressureTex_1_loc, 5);
	gl.uniform1i(shader.currAirPressureTex_2_loc, 6);
	gl.uniform1i(shader.currAirPressureTex_3_loc, 7);

	// 6) simple texture copy Shader.*********************************************************************************************
	shaderName = "copyTexturePartially";
	vs_source = ShaderSource.quadVertTexCoordVS;
	fs_source = ShaderSource.soundCopyPartiallyFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.texToCopy_0_loc = gl.getUniformLocation(shader.program, "texToCopy_0");
	shader.texToCopy_1_loc = gl.getUniformLocation(shader.program, "texToCopy_1");
	shader.texToCopy_2_loc = gl.getUniformLocation(shader.program, "texToCopy_2");
	shader.texToCopy_3_loc = gl.getUniformLocation(shader.program, "texToCopy_3");
	shader.texToCopy_4_loc = gl.getUniformLocation(shader.program, "texToCopy_4");
	shader.texToCopy_5_loc = gl.getUniformLocation(shader.program, "texToCopy_5");
	shader.texToCopy_6_loc = gl.getUniformLocation(shader.program, "texToCopy_6");
	shader.texToCopy_7_loc = gl.getUniformLocation(shader.program, "texToCopy_7");

	shader.a_pos_loc = gl.getAttribLocation(shader.program, "a_pos");//
	shader.a_texcoord_loc = gl.getAttribLocation(shader.program, "a_texcoord");//
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.texToCopy_0_loc, 0);
	gl.uniform1i(shader.texToCopy_1_loc, 0);
	gl.uniform1i(shader.texToCopy_2_loc, 1);
	gl.uniform1i(shader.texToCopy_3_loc, 2);
	gl.uniform1i(shader.texToCopy_4_loc, 3);
	gl.uniform1i(shader.texToCopy_5_loc, 4);
	gl.uniform1i(shader.texToCopy_6_loc, 5);
	gl.uniform1i(shader.texToCopy_7_loc, 6);
	gl.uniform1i(shader.texToCopy_8_loc, 7);
	
	// 3) calculateFlux Shader.*********************************************************************************************
	shaderName = "soundCalculateFlux";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.soundCalculateFluxFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);

	shader.airPressureMosaicTex_loc = gl.getUniformLocation(shader.program, "airPressureMosaicTex");
	shader.flux_RFU_MosaicTex_HIGH_loc = gl.getUniformLocation(shader.program, "flux_RFU_MosaicTex_HIGH");
	shader.flux_RFU_MosaicTex_LOW_loc = gl.getUniformLocation(shader.program, "flux_RFU_MosaicTex_LOW");
	shader.flux_LBD_MosaicTex_HIGH_loc = gl.getUniformLocation(shader.program, "flux_LBD_MosaicTex_HIGH");
	shader.flux_LBD_MosaicTex_LOW_loc = gl.getUniformLocation(shader.program, "flux_LBD_MosaicTex_LOW");
	shader.auxMosaicTex_loc = gl.getUniformLocation(shader.program, "auxMosaicTex");

	shader.a_pos_loc = gl.getAttribLocation(shader.program, "a_pos");//
	shader.u_airMaxPressure_loc = gl.getUniformLocation(shader.program, "u_airMaxPressure");//
	shader.u_airEnvirontmentPressure_loc = gl.getUniformLocation(shader.program, "u_airEnvirontmentPressure");
	shader.u_maxFlux_loc = gl.getUniformLocation(shader.program, "u_maxFlux");
	shader.u_mosaicSize_loc = gl.getUniformLocation(shader.program, "u_mosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize"); // The original texture3D size.***
	shader.u_voxelSizeMeters_loc = gl.getUniformLocation(shader.program, "u_voxelSizeMeters");
	shader.u_timestep_loc = gl.getUniformLocation(shader.program, "u_timestep");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.airPressureMosaicTex_loc, 0);
	gl.uniform1i(shader.flux_RFU_MosaicTex_HIGH_loc, 1);
	gl.uniform1i(shader.flux_RFU_MosaicTex_LOW_loc, 2);
	gl.uniform1i(shader.flux_LBD_MosaicTex_HIGH_loc, 3);
	gl.uniform1i(shader.flux_LBD_MosaicTex_LOW_loc, 4);
	gl.uniform1i(shader.auxMosaicTex_loc, 5);

	// 3) calculateVelocity Shader.*********************************************************************************************
	shaderName = "soundCalculateVelocity";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.soundCalculateVelocityFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);

	shader.airPressureMosaicTex_loc = gl.getUniformLocation(shader.program, "airPressureMosaicTex");
	shader.flux_RFU_MosaicTex_HIGH_loc = gl.getUniformLocation(shader.program, "flux_RFU_MosaicTex_HIGH");
	shader.flux_RFU_MosaicTex_LOW_loc = gl.getUniformLocation(shader.program, "flux_RFU_MosaicTex_LOW");
	shader.flux_LBD_MosaicTex_HIGH_loc = gl.getUniformLocation(shader.program, "flux_LBD_MosaicTex_HIGH");
	shader.flux_LBD_MosaicTex_LOW_loc = gl.getUniformLocation(shader.program, "flux_LBD_MosaicTex_LOW");
	shader.auxMosaicTex_loc = gl.getUniformLocation(shader.program, "auxMosaicTex");

	shader.a_pos_loc = gl.getAttribLocation(shader.program, "a_pos");//
	shader.u_airMaxPressure_loc = gl.getUniformLocation(shader.program, "u_airMaxPressure");//
	shader.u_airEnvirontmentPressure_loc = gl.getUniformLocation(shader.program, "u_airEnvirontmentPressure");
	shader.u_maxFlux_loc = gl.getUniformLocation(shader.program, "u_maxFlux");
	shader.u_mosaicSize_loc = gl.getUniformLocation(shader.program, "u_mosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize"); // The original texture3D size.***
	shader.u_voxelSizeMeters_loc = gl.getUniformLocation(shader.program, "u_voxelSizeMeters");
	shader.u_timestep_loc = gl.getUniformLocation(shader.program, "u_timestep");
	shader.u_maxVelocity_loc = gl.getUniformLocation(shader.program, "u_maxVelocity");

	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.airPressureMosaicTex_loc, 0);
	gl.uniform1i(shader.flux_RFU_MosaicTex_HIGH_loc, 1);
	gl.uniform1i(shader.flux_RFU_MosaicTex_LOW_loc, 2);
	gl.uniform1i(shader.flux_LBD_MosaicTex_HIGH_loc, 3);
	gl.uniform1i(shader.flux_LBD_MosaicTex_LOW_loc, 4);
	gl.uniform1i(shader.auxMosaicTex_loc, 5);
	
	// 3) calculateVelocity Shader.*********************************************************************************************
	shaderName = "volumetricWaves";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.soundVolumetricFS;
	
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	
	shader.simulationBoxDoubleDepthTex_loc = gl.getUniformLocation(shader.program, "simulationBoxDoubleDepthTex");
	shader.simulationBoxDoubleNormalTex_loc = gl.getUniformLocation(shader.program, "simulationBoxDoubleNormalTex");
	shader.airPressureMosaicTex_loc = gl.getUniformLocation(shader.program, "airPressureMosaicTex");
	shader.sceneDepthTex_loc = gl.getUniformLocation(shader.program, "sceneDepthTex"); // scene depth tex.***
	shader.sceneNormalTex_loc = gl.getUniformLocation(shader.program, "sceneNormalTex"); // scene normal tex.***
	shader.airVelocityTex_loc = gl.getUniformLocation(shader.program, "airVelocityTex");

	shader.a_pos_loc = gl.getAttribLocation(shader.program, "a_pos");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.tangentOfHalfFovy_loc = gl.getUniformLocation(shader.program, "tangentOfHalfFovy");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");
	shader.modelViewMatrixRelToEyeInv_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEyeInv");

	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize"); // The original texture3D size.***
	shader.u_mosaicTexSize_loc = gl.getUniformLocation(shader.program, "u_mosaicTexSize"); // The mosaic texture size.***
	shader.u_mosaicSize_loc = gl.getUniformLocation(shader.program, "u_mosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_airMaxPressure_loc = gl.getUniformLocation(shader.program, "u_airMaxPressure");
	shader.u_airEnvirontmentPressure_loc = gl.getUniformLocation(shader.program, "u_airEnvirontmentPressure");
	shader.u_voxelSizeMeters_loc = gl.getUniformLocation(shader.program, "u_voxelSizeMeters");

	shader.u_simulBoxTMat_loc = gl.getUniformLocation(shader.program, "u_simulBoxTMat");
	shader.u_simulBoxTMatInv_loc = gl.getUniformLocation(shader.program, "u_simulBoxTMatInv");
	shader.u_simulBoxPosHigh_loc = gl.getUniformLocation(shader.program, "u_simulBoxPosHigh");
	shader.u_simulBoxPosLow_loc = gl.getUniformLocation(shader.program, "u_simulBoxPosLow");
	shader.u_simulBoxMinPosLC_loc = gl.getUniformLocation(shader.program, "u_simulBoxMinPosLC");
	shader.u_simulBoxMaxPosLC_loc = gl.getUniformLocation(shader.program, "u_simulBoxMaxPosLC");
	
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.simulationBoxDoubleDepthTex_loc, 0);
	gl.uniform1i(shader.simulationBoxDoubleNormalTex_loc, 1);
	gl.uniform1i(shader.airPressureMosaicTex_loc, 2);
	gl.uniform1i(shader.sceneDepthTex_loc, 3);
	gl.uniform1i(shader.sceneNormalTex_loc, 4);
	gl.uniform1i(shader.airVelocityTex_loc, 5);

	magoManager.postFxShadersManager.useProgram(null);
};

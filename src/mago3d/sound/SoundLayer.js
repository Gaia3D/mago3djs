'use strict';

/**
 * @class SoundLayer
 */
var SoundLayer = function(soundManager, options) 
{
	if (!(this instanceof SoundLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.soundManager = soundManager;
	this.geographicExtent;

	this._bIsPrepared = false;

	// simulation parameters.******************************************
	this.terrainMinMaxHeights = new Float32Array([180.0, 540.0]);
	this.simulationTextureSize = new Float32Array([soundManager.maxSimulationSize, soundManager.maxSimulationSize]);
	this.texturesNumSlices = 1; // by default.***
	this.terrainTextureSize = new Float32Array([soundManager.maxSimulationSize, soundManager.maxSimulationSize]);

	this.simulationTimeStep = 0.08; // 
	this.simulationTimeStep = 0.0005;
	this.simulationTimeStep = 0.0008; // ok for sejong
	///////////////////////////////////////////////////////
	this.simulationTimeStep = 0.0002; // for south city
	this.simulationTimeStep = 0.0004; // test delete.!!!

	// wave vars.***
	/*
	Para una temperatura de aire de 20ºC donde la velocidad del sonido es 344 m/s, las ondas de sonido audible, tienen longitudes de onda desde 0,0172 m (0,68 pulgadas), a 17,2 metros (56,4 pies).
	*/
	this.waveLength = 1.0;
	this.waveAmplitude = 1.0;
	this.wavePhase = 0.0;
	this.timeStepAccum = 0.0;

	// The buildings & objects intersected by this waterTile.
	this.visibleObjectsControler;

	// Textures.******************************************************
	this.demWithBuildingsTex;

	// PingPong textures.*********************************************
	this.pressureMosaicTexture3d_A;
	this.pressureMosaicTexture3d_B;

	if (options)
	{
		if (options.geographicExtent)
		{
			this.geographicExtent = options.geographicExtent;
		}
	}

	this.init();
};

SoundLayer.prototype.isPrepared = function()
{
	if (!this._bIsPrepared)
	{
		this.init();
		return false;
	}
	return true;
};

SoundLayer.prototype.prepareTextures = function ()
{
	// Here prepares all needed textures.***
	// Original DEM texture.**************************************************************************************************
	// Note : the original dem texture can provide from HeightMapTexture or quantizedMesh.
	if (this.soundManager.terrainDemSourceType === "HIGHMAP")
	{
		if (!this.original_dem_texture)
		{
			var magoManager = this.soundManager.magoManager;
			var gl = magoManager.getGl();

			// load test texture dem.
			this.original_dem_texture = new Texture();
			this.original_dem_texture.texId = gl.createTexture();
			return false;
		}
		else if (this.original_dem_texture.fileLoadState === CODE.fileLoadState.READY)
		{
			var magoManager = this.soundManager.magoManager;
			var gl = magoManager.getGl();
			var dem_texturePath = this.soundManager.DEMHighMapUrl;//'/images/en/demSampleTest.png'; // provisional.***

			ReaderWriter.loadImage(gl, dem_texturePath, this.original_dem_texture);
			return false;
		}
		else if (this.original_dem_texture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
		{
			return false;
		}
	}
	else if (this.soundManager.terrainDemSourceType === "QUANTIZEDMESH")
	{
		// check the needed tiles.***

		if (!this.tilesArray)
		{
			// 1rst, must find the tile depth with similar size of my geoExtent.***
			var geoExtent = this.geographicExtent;
			// From my geoExtent, determine the minimum size of the rectangle.
			var lonRangeDegree = geoExtent.maxGeographicCoord.longitude - geoExtent.minGeographicCoord.longitude;
			var latRangeDegree = geoExtent.maxGeographicCoord.latitude - geoExtent.minGeographicCoord.latitude;
			var targetDepth = -1;
			if (lonRangeDegree < latRangeDegree)
			{
				// use lonRange to determine the closes tile depth.
				var angDepthRange;
				for (var i=1; i<30; i++)
				{
					angDepthRange = SmartTile.selectTileAngleRangeByDepth(i);
					if (angDepthRange < lonRangeDegree)
					{
						targetDepth = i;
						break;
					}
				}
			}
			else
			{
				// use latRange to determine the closest tile depth.
				var angDepthRange;
				for (var i=1; i<30; i++)
				{
					angDepthRange = SmartTile.selectTileAngleRangeByDepth(i);
					if (angDepthRange < latRangeDegree)
					{
						targetDepth = i;
						break;
					}
				}
			}

			var soundManager = this.soundManager;
			soundManager.simulationTileDepth = targetDepth;
			var simulationTileDepth = soundManager.simulationTileDepth;
			this._targetDepth = simulationTileDepth + 6; // default = +4.***

			var maxDepthAvailable = MagoManager.getMaximumLevelOfTerrainProvider(this.soundManager.terrainProvider);
			if (this._targetDepth > maxDepthAvailable)
			{
				this._targetDepth = maxDepthAvailable;
			}

			
			//if (this._targetDepth > 17)// test:::
			//{
			//	this._targetDepth = 17;// test:::
			//}

			var depth = this._targetDepth;
			
			var minLon = geoExtent.minGeographicCoord.longitude;
			var minLat = geoExtent.minGeographicCoord.latitude;
			var maxLon = geoExtent.maxGeographicCoord.longitude;
			var maxLat = geoExtent.maxGeographicCoord.latitude;

			this.tilesArray = SmartTile.selectTileIndicesArray(depth, minLon, minLat, maxLon, maxLat, undefined);
		}

		// Now, check if tile's qMesh is loaded.***
		if (!this.allQuantizedMeshesLoaded)
		{
			var allQuantizedMeshesLoaded = true;
			var tilesCount = this.tilesArray.length;
			for (var i=0; i<tilesCount; i++)
			{
				var tile = this.tilesArray[i];
				if (!tile.fileLoadState)
				{
					tile.fileLoadState = CODE.fileLoadState.READY;
				}

				// check the tile status.***
				if (tile.fileLoadState === CODE.fileLoadState.READY)
				{
					var X = tile.X;
					var Y = tile.Y;
					var L = tile.L;
					this._loadQuantizedMesh(L, X, Y, tile);
					allQuantizedMeshesLoaded = false;
				}
				else if (tile.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
				{
					allQuantizedMeshesLoaded = false;
				}

				//if (!tile.qMesh)
				//{
				//	allQuantizedMeshesLoaded = false;
				//}
			}

			if (allQuantizedMeshesLoaded)
			{
				this.allQuantizedMeshesLoaded = true;
			}
		}

		if (this.allQuantizedMeshesLoaded)
		{
			// Make dem texture from qMeshes.***
			//if (!this.original_dem_texture)
			if (!this.makeDemTextureByQMeshses_processFinished)
			{
				this.makeDEMTextureByQuantizedMeshes();
				return false;
			}
		}
	}

	return true;
};

SoundLayer.prototype._loadQuantizedMesh = function (L, X, Y, tile)
{
	tile.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	tile.qMeshPromise = this.soundManager.terrainProvider.requestTileGeometry(X, Y, L);
	tile.qMeshPromise.then((value) =>
	{
		tile.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		tile.qMesh = value;
		tile.geoExtent = SmartTile.getGeographicExtentOfTileLXY(L, X, Y, undefined, CODE.imageryType.CRS84);
	}, function (status) 
	{
		//console.log("xhr status = " + status);
		tile.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		tile.geoExtent = SmartTile.getGeographicExtentOfTileLXY(L, X, Y, undefined, CODE.imageryType.CRS84);
	});
};

SoundLayer.prototype.init = function ()
{
	// 1rst, determine texture sizes.***
	var lonArcDist = this.geographicExtent.getLongitudeArcDistance();
	var latArcDist = this.geographicExtent.getLatitudeArcDistance();

	var maxTexSize = this.soundManager.maxSimulationSize;
	this.pixelSizeInMeters = 0.0; // this param is used to determine the number of texture slices of the voxel.***

	if (lonArcDist > latArcDist)
	{
		// longitude texture size is 1024.
		this.simulationTextureSize[0] = maxTexSize;
		this.simulationTextureSize[1] = Math.floor(maxTexSize * (latArcDist / lonArcDist));
		this.pixelSizeInMeters = lonArcDist / maxTexSize;
	}
	else
	{
		this.simulationTextureSize[0] = Math.floor(maxTexSize * (lonArcDist / latArcDist));
		this.simulationTextureSize[1] = maxTexSize;
		this.pixelSizeInMeters = latArcDist / maxTexSize;
	}

	// now, determine the texture slices count.***
	var altRange = this.geographicExtent.getAltitudeRange();
	this.texturesNumSlices = Math.floor(altRange / this.pixelSizeInMeters);

	this.terrainTextureSize[0] = this.simulationTextureSize[0];
	this.terrainTextureSize[1] = this.simulationTextureSize[1];

	// Now, calculate the one voxel size in meters.***
	var oneVoxelSizeMeters_x = lonArcDist / this.simulationTextureSize[0];
	var oneVoxelSizeMeters_y = latArcDist / this.simulationTextureSize[1];
	var oneVoxelSizeMeters_z = altRange / this.texturesNumSlices;
	this.oneVoxelSizeInMeters = [oneVoxelSizeMeters_x, oneVoxelSizeMeters_y, oneVoxelSizeMeters_z];

	var magoManager = this.soundManager.magoManager;
	var gl = magoManager.getGl();

	if (!this.fbo) // simulation fbo (512 x 512).
	{
		var bufferWidth = this.simulationTextureSize[0];
		var bufferHeight = this.simulationTextureSize[1];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 3}); 
	}

	if (!this.terrainTexFbo) // simulation fbo (512 x 512).
	{
		var bufferWidth = this.terrainTextureSize[0];
		var bufferHeight = this.terrainTextureSize[1];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.terrainTexFbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 3}); 
	}

	// Make all needed textures.***
	this._makeTextures();

	this._bIsPrepared = true;
};

SoundLayer.prototype._makeTextures = function ()
{
	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var gl = magoManager.getGl();

	// water simulation texture size: it depends of soundManager.
	var texWidth = this.simulationTextureSize[0];
	var texHeight = this.simulationTextureSize[1];

	this.demWithBuildingsTex = soundManager._newTexture(gl, texWidth, texHeight);
};

SoundLayer.prototype._getSimulationBox = function (magoManager)
{
	if (!this.simulationBox)
	{
		this.simulationBox = this.geographicExtent.getRenderableObject(magoManager);
		this.simulationBox.setOneColor(0.2, 0.7, 0.8, 0.05);
		this.simulationBox.attributes.isMovable = false;
		this.simulationBox.attributes.isSelectable = false;
		this.simulationBox.attributes.name = "simulationBox";
		this.simulationBox.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0); // selectedColor fully transparent.
		if (this.simulationBox.options === undefined)
		{ this.simulationBox.options = {}; }
		
		this.simulationBox.options.renderWireframe = false;
		this.simulationBox.options.renderShaded = true;
		this.simulationBox.options.depthMask = false;
		var bbox = this.simulationBox.getBoundingBoxLC();
		var depth = 4;
		//magoManager.modeler.addObject(this.simulationBox, depth);
	}
	
	return this.simulationBox;
};

SoundLayer.prototype._getVolumeDepthFBO = function(magoManager)
{
	//      +-----------+-----------+
	//      |           |           | 
	//      |   tex_0   |   tex_1   |
	//      |           |           |
	//      +-----------+-----------+
	// Note : the width of fbo must be the double of the screen width.***
	if (!this.volumeDepthFBO)
	{
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0] * 2; // double of the screen width.***
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.volumeDepthFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 4}); 
	}

	return this.volumeDepthFBO;
};

SoundLayer.prototype._getScreenFBO = function(magoManager)
{
	// This is a screen size FBO.***
	if (!this.screenFBO)
	{
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0]; 
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.screenFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 4}); 
	}

	return this.screenFBO;
};

SoundLayer.prototype._renderDepthVolume = function (magoManager)
{
	// Render depth 2 times:
	// 1- render the rear faces.
	// 2- render the front faces.
	//-------------------------------
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();
	var extbuffers = magoManager.extbuffers;

	// Now, render the windPlane.
	if (!this.visibleObjControler)
	{
		this.visibleObjControler = new VisibleObjectsController();
	}

	this.simulationBox = this._getSimulationBox(magoManager);

	if (this.simulationBox)
	{ this.visibleObjControler.currentVisibleNativeObjects.opaquesArray[0] = this.simulationBox; }

	// Bind FBO.***
	//      +-----------------+----------------+
	//      |                 |                | 
	//      |   front depth   |   rear depth   |
	//      |                 |                |
	//      +-----------------+----------------+
	// Note : the width of fbo must be the double of the screen width.***

	// Front Face.***************************************************************************************************************************
	var doubleFBO = this._getVolumeDepthFBO(magoManager);
	doubleFBO.bind();
	gl.viewport(0, 0, doubleFBO.width[0]/2, doubleFBO.height[0]);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, doubleFBO.colorBuffersArray[0], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, doubleFBO.colorBuffersArray[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, doubleFBO.colorBuffersArray[2], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, doubleFBO.colorBuffersArray[3], 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex (front).
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
	  ]);

	//if (magoManager.isFarestFrustum())// === 2)
	if (magoManager.currentFrustumIdx === 2)
	{
		gl.clearColor(0, 0, 0, 0);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
	}

	gl.clear(gl.DEPTH_BUFFER_BIT);

	var renderType = 1;
	gl.frontFace(gl.CCW);
	magoManager.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControler);

	// Test:
	this.simulBoxdoubleDepthTex = doubleFBO.colorBuffersArray[1];
	this.simulBoxDoubleNormalTex = doubleFBO.colorBuffersArray[2];

	// End front face.---------------------------------------------------------------------------------------------------------------------------

	// Rear Face.***************************************************************************************************************************
	gl.viewport(doubleFBO.width[0]/2, 0, doubleFBO.width[0]/2, doubleFBO.height[0]);


	var renderType = 1;
	gl.frontFace(gl.CW);
	magoManager.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControler);
	// End rear face.---------------------------------------------------------------------------------------------------------------------------

	// unbind fbo.***
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);
	doubleFBO.unbind();

	// Return to main framebuffer.************************
	// return default values:
	gl.frontFace(gl.CCW);
	/*
	magoManager.bindMainFramebuffer();

	// unbind mago colorTextures:
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
	]);
	*/
};

SoundLayer.prototype.renderWave = function (magoManager) 
{
	// check if exist textures:
	if (!this.pressureMosaicTexture3d_A || !this.pressureMosaicTexture3d_A.texturesArray || this.pressureMosaicTexture3d_A.texturesArray.length === 0)
	{
		return;
	}

	// render volumetrically the texture3d.***
	// 1rst, need the box depth 2 textures : frontFace depth texture & backFace depth texture.***
	this._renderDepthVolume(magoManager);

	// Now, do volumetric render with the mosaic textures 3d.***
	var soundManager = this.soundManager;
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();
	var fbo = this._getScreenFBO(magoManager);
	var extbuffers = fbo.extbuffers;

	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);

	var screenQuad = soundManager.getQuadBuffer();
	var shader = magoManager.postFxShadersManager.getShader("volumetricWaves"); // (waterQuadVertVS, soundVolumetricFS)
	magoManager.postFxShadersManager.useProgram(shader);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, fbo.colorBuffersArray[0], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, fbo.colorBuffersArray[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, fbo.colorBuffersArray[2], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, fbo.colorBuffersArray[3], 0);

	// Test:
	this.volumRenderTex = fbo.colorBuffersArray[0];

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] 
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3]
	  ]);

	//if (magoManager.isFarestFrustum())// === 2)
	if (magoManager.currentFrustumIdx === 2)
	{
		gl.clearColor(0, 0, 0, 0);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
	}

	gl.clear(gl.DEPTH_BUFFER_BIT);

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos_loc, 2);

	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);

	var refTex3D = this.fluxRFUMosaicTexture3d_HIGH_A; // we can take any other texture3D.***

	// bind uniforms.***
	shader.bindUniformGenerals();

	gl.uniform1iv(shader.u_texSize_loc, [refTex3D.texture3DXSize, refTex3D.texture3DYSize, refTex3D.texture3DZSize]); // The original texture3D size.***
	gl.uniform1iv(shader.u_mosaicSize_loc, [refTex3D.mosaicXCount, refTex3D.mosaicYCount, refTex3D.finalSlicesCount]); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(shader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);
	gl.uniform1f(shader.u_airMaxPressure_loc, soundManager.airMaxPressure);
	gl.uniform1f(shader.u_airEnvirontmentPressure_loc, soundManager.airEnvirontmentPressure);
	gl.uniform1f(shader.u_maxVelocity_loc, soundManager.airMaxVelocity);
	gl.uniform2fv(shader.u_screenSize_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	gl.uniform2fv(shader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
	gl.uniform3fv(shader.u_voxelSizeMeters_loc, [this.oneVoxelSizeInMeters[0], this.oneVoxelSizeInMeters[1], this.oneVoxelSizeInMeters[2]]); // The one voxel size in meters.***

	this.simulationBox = this._getSimulationBox(magoManager);
	var geoLocDataManager = this.simulationBox.geoLocDataManager;
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var simulBoxMatInv = geoLocData.getRotMatrixInv();
	gl.uniformMatrix4fv(shader.u_simulBoxTMat_loc, false, geoLocData.rotMatrix._floatArrays);
	gl.uniformMatrix4fv(shader.u_simulBoxTMatInv_loc, false, simulBoxMatInv._floatArrays);
	gl.uniform3fv(shader.u_simulBoxPosHigh_loc, geoLocData.positionHIGH);
	gl.uniform3fv(shader.u_simulBoxPosLow_loc, geoLocData.positionLOW);

	var bboxLC = this.simulationBox.getBoundingBoxLC();
	gl.uniform3fv(shader.u_simulBoxMinPosLC_loc, [bboxLC.minX, bboxLC.minY, bboxLC.minZ]);
	gl.uniform3fv(shader.u_simulBoxMaxPosLC_loc, [bboxLC.maxX, bboxLC.maxY, bboxLC.maxZ]);

	// bind textures.***
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.simulBoxdoubleDepthTex); 
	//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex); 

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.simulBoxDoubleNormalTex); 

	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( 0 )); 

	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex); 

	gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.normalTex); 


	gl.activeTexture(gl.TEXTURE5);
	gl.bindTexture(gl.TEXTURE_2D, this.airVelocity_B.getTexture( 0 )); 

	gl.activeTexture(gl.TEXTURE6);
	gl.bindTexture(gl.TEXTURE_2D, this.maxPressureMosaicTexture3d_A.getTexture( 0 ));

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);

	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	fbo.unbind();

	/*
	uniform sampler2D simulationBoxDoubleDepthTex;
	uniform sampler2D simulationBoxDoubleNormalTex; // used to calculate the current frustum idx.***
	uniform sampler2D airPressureMosaicTex;

	////uniform vec3 encodedCameraPositionMCHigh;
	////uniform vec3 encodedCameraPositionMCLow;
	////uniform float tangentOfHalfFovy;
	////uniform float aspectRatio;
	*/

	gl.enable(gl.BLEND);
	
	this.drawSimulationVariables();
};

SoundLayer.prototype.newPointSource = function (longitude, latitude, altitude) 
{
	var geoCoord = new GeographicCoord(longitude, latitude, altitude); 
	geoCoord.makeDefaultGeoLocationData();

	// provisionally render it.***
	var magoManager = this.soundManager.magoManager;
	var geoCoordsList = magoManager.modeler.getGeographicCoordsList();
	geoCoordsList.addGeoCoord(geoCoord);

	var modelViewProjMatrix = this.getTileOrthographic_mvpMat();
	this.voxelizer.renderToMagoTexture3D(this.soundManager, this.soundSourceRealTexture3d, this.geographicExtent, modelViewProjMatrix, [geoCoord]);
};

SoundLayer.prototype.newBSplineCubic3DSource = function (geoCoordsArray) 
{
	var options = {
		geoCoordsArray         : geoCoordsArray,
		initialArmsLengthRatio : 0.3,
		bLoop                  : false
	};

	var bSpline = new BSplineCubic3D(options);
	var modelViewProjMatrix = this.getTileOrthographic_mvpMat();
	this.voxelizer.renderToMagoTexture3D(this.soundManager, this.soundSourceRealTexture3d, this.geographicExtent, modelViewProjMatrix, [bSpline]);
};

SoundLayer.prototype.TEST_yangDongHumenSiA_apt = function () 
{
	// (광주) 양동휴먼시아 아파트.***
	// ******************************************************************************************************************************************************************
	this.newPointSource(126.89556, 35.15776, 5.0);
	this.newPointSource(126.89535, 35.15715, 5.0);
	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------

	// render a spline as linear sound source (126.89454, 35.15673), (126.89513, 35.15698), (126.89503, 35.15736), (126.89564, 35.15784).*********************************
	var alt = 3.0;
	var geoCoordsList = new GeographicCoordsList();
	geoCoordsList.newGeoCoord(126.89454, 35.15673, alt);
	geoCoordsList.newGeoCoord(126.89513, 35.15698, alt);
	geoCoordsList.newGeoCoord(126.89503, 35.15736, alt);
	geoCoordsList.newGeoCoord(126.89564, 35.15784, alt);

	this.newBSplineCubic3DSource(geoCoordsList.geographicCoordsArray);
	//--------------------------------------------------------------------------------------------------------------------------------------------------------------------
};

SoundLayer.prototype.TEST_MoATown_apt = function () 
{
	// (광주) 모아타운 아파트.***
	// ******************************************************************************************************************************************************************
	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------

	// render a spline as linear sound source (126.89454, 35.15673), (126.89513, 35.15698), (126.89503, 35.15736), (126.89564, 35.15784).*********************************
	var alt = 3.0;
	var geoCoordsList = new GeographicCoordsList();
	geoCoordsList.newGeoCoord(126.90506, 35.16952, alt);
	geoCoordsList.newGeoCoord(126.90718, 35.16899, alt);

	this.newBSplineCubic3DSource(geoCoordsList.geographicCoordsArray);
	//--------------------------------------------------------------------------------------------------------------------------------------------------------------------
};

SoundLayer.prototype.TEST_NongSeon_SK_viewCentral_apt = function () 
{
	// (광주) 농성SK뷰센트럴 아파트.***
	// ******************************************************************************************************************************************************************
	//this.newPointSource(126.88602, 35.15512, 5.0);
	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------

	// render a spline as linear sound source (126.89454, 35.15673), (126.89513, 35.15698), (126.89503, 35.15736), (126.89564, 35.15784).*********************************
	var alt = 3.0;
	var geoCoordsList = new GeographicCoordsList();
	geoCoordsList.newGeoCoord(126.88568, 35.15520, alt);
	geoCoordsList.newGeoCoord(126.88620, 35.15494, alt);
	geoCoordsList.newGeoCoord(126.88648, 35.15528, alt);
	geoCoordsList.newGeoCoord(126.88724, 35.15534, alt);
	geoCoordsList.newGeoCoord(126.88780, 35.15602, alt);

	this.newBSplineCubic3DSource(geoCoordsList.geographicCoordsArray);
	//--------------------------------------------------------------------------------------------------------------------------------------------------------------------
};

SoundLayer.prototype.doSimulationSteps = function (magoManager) 
{
	// 1rst, must check if all textures are prepared.***
	if (!this.prepareTextures())
	{
		return false;
	}

	if (!this.overWriteDEMWithObjectsFinished)
	{
		return false;
	}

	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var gl = magoManager.getGl();

	var maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

	// now, make the voxelization of the scene(geoExtent).************************************************************************************
	// Note : to save memory & limited by MAX_TEXTURE_IMAGE_UNITS = 8, we make the voxelization into fluxRFUMosaicTexture3d_HIGH_A(B) alpha channel.***
	// ***************************************************************************************************************************************
	if (!this.voxelizer)
	{
		var options = {};
		options.voxelXSize = this.simulationTextureSize[0];
		options.voxelYSize = this.simulationTextureSize[1];
		options.voxelZSize = this.texturesNumSlices;
		this.voxelizer = new Voxelizer(options);
	}

	// Make the simulation FBO if no exist.***
	if (!this.simulationMosaicFBO)
	{
		// create the simulation fbo.***
		var result = Voxelizer.getMosaicColumnsAndRows(this.simulationTextureSize[0], this.simulationTextureSize[1], this.texturesNumSlices);
		var mosaicXCount = result.numColumns;
		var mosaicYCount = result.numRows;

		var finalTextureXSize = mosaicXCount * this.simulationTextureSize[0];
		var finalTextureYSize = mosaicYCount * this.simulationTextureSize[1];

		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.simulationMosaicFBO = new FBO(gl, finalTextureXSize, finalTextureYSize, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 8}); 
	}

	if (!this.bSceneVoxelized)
	{
		// do voxelization process.***
		this.fluxRFUMosaicTexture3d_HIGH_B = this.voxelizer.voxelizeByDepthTexture(magoManager, this.demWithBuildingsTex, this.simulationTextureSize[0], this.simulationTextureSize[1], this.texturesNumSlices, this, undefined);

		this.bSceneVoxelized = true;
	}

	// create the fluxTextures.***
	if (!this.fluxRFUMosaicTexture3d_HIGH_A)
	{
		//*********************************************************
		// R= right, F= front, U= up, L= left, B= back, D= down.
		// RFU = x, y, z.
		// LBD = -x, -y, -z.
		//*********************************************************
		// HIGH.***
		//this.fluxRFUMosaicTexture3d_HIGH_B : this texture is created 1rst.

		var refTex3D = this.fluxRFUMosaicTexture3d_HIGH_B;

		this.fluxRFUMosaicTexture3d_HIGH_A = new MagoTexture3D();
		this.fluxRFUMosaicTexture3d_HIGH_A.copyParametersFrom(refTex3D);
		this.fluxRFUMosaicTexture3d_HIGH_A.createTextures(gl);

		this.fluxLBDMosaicTexture3d_HIGH_A = new MagoTexture3D();
		this.fluxLBDMosaicTexture3d_HIGH_A.copyParametersFrom(refTex3D);
		this.fluxLBDMosaicTexture3d_HIGH_A.createTextures(gl);

		this.fluxLBDMosaicTexture3d_HIGH_B = new MagoTexture3D();
		this.fluxLBDMosaicTexture3d_HIGH_B.copyParametersFrom(refTex3D);
		this.fluxLBDMosaicTexture3d_HIGH_B.createTextures(gl);

		// LOW.***
		this.fluxRFUMosaicTexture3d_LOW_A = new MagoTexture3D();
		this.fluxRFUMosaicTexture3d_LOW_A.copyParametersFrom(refTex3D);
		this.fluxRFUMosaicTexture3d_LOW_A.createTextures(gl);

		this.fluxRFUMosaicTexture3d_LOW_B = new MagoTexture3D();
		this.fluxRFUMosaicTexture3d_LOW_B.copyParametersFrom(refTex3D);
		this.fluxRFUMosaicTexture3d_LOW_B.createTextures(gl);

		this.fluxLBDMosaicTexture3d_LOW_A = new MagoTexture3D();
		this.fluxLBDMosaicTexture3d_LOW_A.copyParametersFrom(refTex3D);
		this.fluxLBDMosaicTexture3d_LOW_A.createTextures(gl);

		this.fluxLBDMosaicTexture3d_LOW_B = new MagoTexture3D();
		this.fluxLBDMosaicTexture3d_LOW_B.copyParametersFrom(refTex3D);
		this.fluxLBDMosaicTexture3d_LOW_B.createTextures(gl);

		// shaderLog texture. delete after debug.***
		this.shaderLogTexture = new MagoTexture3D();
		this.shaderLogTexture.copyParametersFrom(refTex3D);
		this.shaderLogTexture.createTextures(gl);

		this.shaderLogTexture_vel = new MagoTexture3D();
		this.shaderLogTexture_vel.copyParametersFrom(refTex3D);
		this.shaderLogTexture_vel.createTextures(gl);

		// Now, voxelize in Y & X directions.***
		this._voxelizeInYDirection(magoManager);
		this._voxelizeInXDirection(magoManager);
		this._voxelizeInZDirection(magoManager);
	}

	// Now, make the sound source texture3d.***************************************************************************************************
	if (!this.soundSourceRealTexture3d)
	{
		// Create a real magoTexture3D, not a mosaic, to render the sources in it.***
		this.soundSourceRealTexture3d = new MagoTexture3D();
		this.soundSourceRealTexture3d.texture3DXSize = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DXSize;
		this.soundSourceRealTexture3d.texture3DYSize = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DYSize;
		this.soundSourceRealTexture3d.texture3DZSize = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DZSize;

		// The 3D texture into a mosaic texture matrix params.***
		this.soundSourceRealTexture3d.mosaicXCount = 1; 
		this.soundSourceRealTexture3d.mosaicYCount = 1; 
		this.soundSourceRealTexture3d.createTextures(gl);

		// Now, render a point or a curve into the soundSourceTex3d.***
		//this.TEST_yangDongHumenSiA_apt(); // (광주) 양동휴먼시아 아파트.***
		//this.TEST_MoATown_apt(); // (광주) 모아타운 아파트.***
		this.TEST_NongSeon_SK_viewCentral_apt();// (광주) 농성SK뷰센트럴 아파트.***
	}

	if (!this.soundSourceRealTexture3d)
	{
		return false;
	}

	if (!this.soundSourceMosaicTexture3d)
	{
		// make the mosaic texture 3d from the "this.soundSourceRealTexture3d".***
		this.soundSourceMosaicTexture3d = this.voxelizer.makeMosaicTexture3DFromRealTexture3D(magoManager, this.soundSourceRealTexture3d, undefined);

		// Once made the "soundSourceMosaicTexture3d", delete the "soundSourceRealTexture3d" to save memory.***
		//this.soundSourceRealTexture3d.deleteTextures(gl);
	}

	if (!this.soundSourceMosaicTexture3d)
	{
		return false;
	}

	// Now, calculate the the air pressure (equivalent to water height).***
	if (!this.pressureMosaicTexture3d_A)
	{
		// create the mosaic texture 3d.***
		this.pressureMosaicTexture3d_A = new MagoTexture3D();
		this.pressureMosaicTexture3d_A.copyParametersFrom(this.fluxRFUMosaicTexture3d_HIGH_A);
		this.pressureMosaicTexture3d_A.createTextures(gl);

		this.pressureMosaicTexture3d_B = new MagoTexture3D();
		this.pressureMosaicTexture3d_B.copyParametersFrom(this.fluxRFUMosaicTexture3d_HIGH_A);
		this.pressureMosaicTexture3d_B.createTextures(gl);

		// create the max pressure record mosaic texture 3d.***
		this.maxPressureMosaicTexture3d_A = new MagoTexture3D();
		this.maxPressureMosaicTexture3d_A.copyParametersFrom(this.fluxRFUMosaicTexture3d_HIGH_A);
		this.maxPressureMosaicTexture3d_A.createTextures(gl);

		this.maxPressureMosaicTexture3d_B = new MagoTexture3D();
		this.maxPressureMosaicTexture3d_B.copyParametersFrom(this.fluxRFUMosaicTexture3d_HIGH_A);
		this.maxPressureMosaicTexture3d_B.createTextures(gl);


		// Now, must set the environtment air pressure.***
		this._setEnvirontmentAirPressure();
	}

	if (!this.airVelocity_A)
	{
		// create the mosaic texture 3d.***
		this.airVelocity_A = new MagoTexture3D();
		this.airVelocity_A.copyParametersFrom(this.fluxRFUMosaicTexture3d_HIGH_A);
		this.airVelocity_A.createTextures(gl);

		this.airVelocity_B = new MagoTexture3D();
		this.airVelocity_B.copyParametersFrom(this.fluxRFUMosaicTexture3d_HIGH_A);
		this.airVelocity_B.createTextures(gl);
	}

	if (!this.auxMosaicTexture3d_forFluxCalculation)
	{
		// *********************************************************************************************************************************
		// Here makes a auxiliar mosaic texture to bind in sound flux calculation.
		// We make this auxMosaicTex bcos in the flux calculation fragment shader, there are only 8 tex channels, & 6 is occupied, and
		// there are 10 more textures to bind. So, join the 10 textures in a 4 X 3 mosaic tex.***
		// There are one auxMosaicTex3d for each simulationMosaicTex3D slices.***
		// *********************************************************************************************************************************
		this.auxMosaicTexture3d_forFluxCalculation = new MagoTexture3D();
		this.auxMosaicTexture3d_forFluxCalculation.texture3DXSize = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DXSize; // other textures is possible bcos are equals.***
		this.auxMosaicTexture3d_forFluxCalculation.texture3DYSize = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DYSize; // other textures is possible bcos are equals.***
		this.auxMosaicTexture3d_forFluxCalculation.texture3DZSize = 12; // 4 X 3.***

		// The 3D texture into a mosaic texture matrix params.***
		this.auxMosaicTexture3d_forFluxCalculation.mosaicXCount = 4; 
		this.auxMosaicTexture3d_forFluxCalculation.mosaicYCount = 3; 
		this.auxMosaicTexture3d_forFluxCalculation.finalSlicesCount = this.fluxRFUMosaicTexture3d_HIGH_A.finalSlicesCount;

		var filter = gl.NEAREST;
		var texWrap = gl.CLAMP_TO_EDGE;
		var data = undefined;

		// 1rst, find the finally used texture size.***
		this.auxMosaicTexture3d_forFluxCalculation.finalTextureXSize = this.auxMosaicTexture3d_forFluxCalculation.mosaicXCount * this.auxMosaicTexture3d_forFluxCalculation.texture3DXSize;
		this.auxMosaicTexture3d_forFluxCalculation.finalTextureYSize = this.auxMosaicTexture3d_forFluxCalculation.mosaicYCount * this.auxMosaicTexture3d_forFluxCalculation.texture3DYSize;

		for (var i=0; i<this.auxMosaicTexture3d_forFluxCalculation.finalSlicesCount; i++)
		{
			var webglTex = Texture.createTexture(gl, filter, data, this.auxMosaicTexture3d_forFluxCalculation.finalTextureXSize, this.auxMosaicTexture3d_forFluxCalculation.finalTextureYSize, texWrap);
			this.auxMosaicTexture3d_forFluxCalculation.texturesArray.push(webglTex);
		}
	}

	if (!this.auxMosaicTexture3d_forFluxCalculation)
	{ 
		return false; 
	}

	if (!this.timeStepAccum)
	{
		this.timeStepAccum = 0.0;
	}
	
	if (!this.oneSimulationStep) // test debug "if". Delete after debug.!!!
	{
		// Start the simulation steps.***
		if (!this.airPresureFromSource) // test debug "if". Delete after debug.!!!
		{
			// this.simulationTimeStep

			if (this.timeStepAccum >= 0.05)
			{
				//this.airPresureFromSource = true;
				//this._calculateAirPressureFromSoundSource();
				//this.timeStepAccum = 0.0;
			}
			this._calculateAirPressureFromSoundSource();
			//this.airPresureFromSource = true;	
		}
		
		this._makeAuxMosaicTexture3D_forFluxCalculation();

		this._calculateFlux();
		this._makeAuxMosaicTexture3D_forFluxCalculation(); // must recalculate the auxMosaicTexture3D bcos flux was modified.***

		this._calculateVelocity();
		
		//this.oneSimulationStep = true; // test debug var.***
	}

	this.timeStepAccum += this.simulationTimeStep;
	

	var hola = 0;
	// https://www.animations.physics.unsw.edu.au/jw/sound-wave-equation.htm#sub1
};

SoundLayer.prototype._calculateVelocity = function ()
{
	if (!this.voxelizer)
	{
		return false;
	}

	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var gl = magoManager.getGl();

	var fbo = this.simulationMosaicFBO; // this if mosaicTextureSize.***
	var extbuffers = fbo.extbuffers;

	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
	]);

	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, null, 0);

	var shader = magoManager.postFxShadersManager.getShader("soundCalculateVelocity");
	magoManager.postFxShadersManager.useProgram(shader);
	var screenQuad = soundManager.getQuadBuffer();
	var webglController = new WebGlController(gl);

	var refTex3D = this.fluxRFUMosaicTexture3d_HIGH_A; // we can take any other texture3D.***

	gl.uniform1f(shader.u_airMaxPressure_loc, soundManager.airMaxPressure);
	gl.uniform1f(shader.u_airEnvirontmentPressure_loc, soundManager.airEnvirontmentPressure);
	gl.uniform1f(shader.u_maxFlux_loc, soundManager.maxFlux);
	gl.uniform1iv(shader.u_mosaicSize_loc, [refTex3D.mosaicXCount, refTex3D.mosaicYCount, refTex3D.finalSlicesCount]); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	gl.uniform1iv(shader.u_texSize_loc, [refTex3D.texture3DXSize, refTex3D.texture3DYSize, refTex3D.texture3DZSize]); // The original texture3D size.***
	gl.uniform3fv(shader.u_voxelSizeMeters_loc, [this.oneVoxelSizeInMeters[0], this.oneVoxelSizeInMeters[1], this.oneVoxelSizeInMeters[2]]); // The one voxel size in meters.***
	gl.uniform1f(shader.u_timestep_loc, this.simulationTimeStep);//u_maxVelocity_loc, airMaxVelocity
	gl.uniform1f(shader.u_maxVelocity_loc, soundManager.airMaxVelocity);

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos_loc, 2);

	webglController.clearColor(0.0, 0.0, 0.0, 0.0);

	var finalSlicesCount = this.pressureMosaicTexture3d_A.finalSlicesCount;
	for (var i=0; i<finalSlicesCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i ), 0); // airPressure
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.airVelocity_A.getTexture( i ), 0); // airVelocity.
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.maxPressureMosaicTexture3d_A.getTexture( i ), 0); // airVelocity.
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.shaderLogTexture_vel.getTexture( i ), 0); // airVelocity.
		

		//gl.uniform1i(shader.u_lowestMosaicSliceIndex_loc,  i*8);
		// bind sound source.***
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i )); // sound source.

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_B.getTexture( i )); // sound source.

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_LOW_B.getTexture( i )); // sound source.

		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_HIGH_B.getTexture( i )); // sound source.

		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_LOW_B.getTexture( i ));

		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i ));

		gl.activeTexture(gl.TEXTURE6);
		gl.bindTexture(gl.TEXTURE_2D, this.maxPressureMosaicTexture3d_B.getTexture( i ));


		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// Draw screenQuad:
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	fbo.unbind();
	webglController.restoreAllParameters();

	// now, swap waterHeightTextures:
	SoundLayer._swapTextures3D(this.pressureMosaicTexture3d_A, this.pressureMosaicTexture3d_B);
	SoundLayer._swapTextures3D(this.airVelocity_A, this.airVelocity_B);
	SoundLayer._swapTextures3D(this.maxPressureMosaicTexture3d_A, this.maxPressureMosaicTexture3d_B);
};

SoundLayer.prototype._makeAuxMosaicTexture3D_forFluxCalculation = function ()
{
	// *********************************************************************************************************************************
	// Here makes a auxiliar mosaic texture to bind in sound flux calculation.
	// We make this auxMosaicTex bcos in the flux calculation fragment shader, there are only 8 tex channels, & 6 is occupied, and
	// there are 10 more textures to bind. So, join the 10 textures in a 4 X 3 mosaic tex.***
	// There are one auxMosaicTex3d for each simulationMosaicTex3D slices.***
	// *********************************************************************************************************************************

	// tex_0 = prev airPressureTex
	// tex_1 = next airPressureTex
	// tex_2 = prev flux_RFU_HIGH
	// tex_3 = next flux_RFU_HIGH
	// tex_4 = prev flux_RFU_LOW
	// tex_5 = next flux_RFU_LOW
	// tex_6 = prev flux_LBD_HIGH
	// tex_7 = next flux_LBD_HIGH
	// tex_8 = prev flux_LBD_LOW
	// tex_9 = next flux_LBD_LOW

	//  
	//      +-----------+-----------+-----------+-----------+
	//      |           |           |           |           |     
	//      |   tex_8   |   tex_9   |  nothing  |  nothing  |
	//      |           |           |           |           | 
	//      +-----------+-----------+-----------+-----------+
	//      |           |           |           |           | 
	//      |   tex_4   |   tex_5   |   tex_6   |   tex_7   |
	//      |           |           |           |           |
	//      +-----------+-----------+-----------+-----------+
	//      |           |           |           |           |    
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   | 
	//      |           |           |           |           |
	//      +-----------+-----------+-----------+-----------+
	//

	// Note : Take the "this.fluxRFUMosaicTexture3d_HIGH_A" as areference, bcos all mosaicTex3D are equals to "this.fluxRFUMosaicTexture3d_HIGH_A".***
	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var gl = magoManager.getGl();

	if (!this.fbo_auxMosaicFlux)
	{
		// create the frame buffer object.***
		var bufferWidth = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DXSize * 4;
		var bufferHeight = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DYSize * 3;
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo_auxMosaicFlux = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 1}); 
	}

	var fbo = this.fbo_auxMosaicFlux;
	var extbuffers = fbo.extbuffers;
	var shader;
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[4]
		extbuffers.NONE, // gl_FragData[5]
		extbuffers.NONE, // gl_FragData[6]
		extbuffers.NONE, // gl_FragData[7]
	]);

	shader = magoManager.postFxShadersManager.getShader("copyTexturePartially");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();
	gl.uniform1i(shader.u_textureFlipYAxis_loc, false);

	//gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, modelViewProjMatrix._floatArrays);
	//gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	//gl.uniform4fv(shader.u_color4_loc, [1.0, 0.0, 0.0, 1.0]); //.***
	//gl.uniform2fv(shader.u_heightMap_MinMax_loc, [geoExtent.minGeographicCoord.altitude, geoExtent.maxGeographicCoord.altitude]);
	//gl.uniform2fv(shader.u_simulationTextureSize_loc, [magoTex3d.finalTextureXSize, magoTex3d.finalTextureYSize]);
	//gl.uniform1iv(shader.u_texSize_loc, [magoTex3d.texture3DXSize, magoTex3d.texture3DYSize, magoTex3d.texture3DZSize]);
	
	gl.disable(gl.CULL_FACE);
	gl.disable(gl.DEPTH_TEST);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null); 

	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, null); 

	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, null); 

	gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D, null); 

	gl.activeTexture(gl.TEXTURE5);
	gl.bindTexture(gl.TEXTURE_2D, null); 

	gl.activeTexture(gl.TEXTURE6);
	gl.bindTexture(gl.TEXTURE_2D, null); 

	gl.activeTexture(gl.TEXTURE7);
	gl.bindTexture(gl.TEXTURE_2D, null); 


	gl.frontFace(gl.CCW);

	var subTexWidth = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DXSize;
	var subTexHeight = this.fluxRFUMosaicTexture3d_HIGH_A.texture3DYSize;

	var mosaicXCount = this.fluxRFUMosaicTexture3d_HIGH_A.mosaicXCount;
	var mosaicYCount = this.fluxRFUMosaicTexture3d_HIGH_A.mosaicYCount;
	var unitaryXRange = 1.0 / mosaicXCount;
	var unitaryYRange = 1.0 / mosaicYCount;

	var finalSlicesCount = this.auxMosaicTexture3d_forFluxCalculation.finalSlicesCount;
	//var rendersCount = Math.ceil(finalSlicesCount / 8);
	for (var i=0; i<finalSlicesCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i ), 0);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i*8 + 1 ), 0);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i*8 + 2 ), 0);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i*8 + 3 ), 0);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i*8 + 4 ), 0);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i*8 + 5 ), 0);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i*8 + 6 ), 0);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i*8 + 7 ), 0);

		//gl.uniform1i(shader.u_lowestTex3DSliceIndex_loc,  i*8);

		// Now, render the 10 auxiliar textures :
		for (var j=0; j<10; j++)
		{
			if (j === 0)
			{
				// Destination :
				// copy PREV airPressure tex in col = 0, row = 0.***
				var destCol = 0;
				var destRow = 0;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = mosaicXCount - 1;
				var originRow = mosaicYCount - 1;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var prevIdx = i-1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture(prevIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 1)
			{
				// Destination :
				// copy NEXT airPressure tex in col = 1, row = 0.***
				var destCol = 1;
				var destRow = 0;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = 0;
				var originRow = 0;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var nextIdx = i+1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture(nextIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 2)
			{
				// Destination :
				// copy PREV flux_RFU_HIGH tex in col = 2, row = 0.***
				var destCol = 2;
				var destRow = 0;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = mosaicXCount - 1;
				var originRow = mosaicYCount - 1;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var prevIdx = i-1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_A.getTexture(prevIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 3)
			{
				// Destination :
				// copy next flux_RFU_HIGH tex in col = 3, row = 0.***
				var destCol = 3;
				var destRow = 0;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = 0;
				var originRow = 0;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var nextIdx = i+1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_A.getTexture(nextIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 4)
			{
				// Destination :
				// copy prev flux_RFU_LOW tex in col = 0, row = 1.***
				var destCol = 0;
				var destRow = 1;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = mosaicXCount - 1;
				var originRow = mosaicYCount - 1;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var prevIdx = i-1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_LOW_A.getTexture(prevIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 5)
			{
				// Destination :
				// copy next flux_RFU_LOW tex in col = 1, row = 1.***
				var destCol = 1;
				var destRow = 1;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = 0;
				var originRow = 0;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var nextIdx = i+1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_LOW_A.getTexture(nextIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 6)
			{
				// Destination :
				// copy prev flux_LBD_HIGH tex in col = 0, row = 1.***
				var destCol = 2;
				var destRow = 1;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = mosaicXCount - 1;
				var originRow = mosaicYCount - 1;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var prevIdx = i-1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_HIGH_A.getTexture(prevIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 7)
			{
				// Destination :
				// copy next flux_LBD_HIGH tex in col = 1, row = 1.***
				var destCol = 3;
				var destRow = 1;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = 0;
				var originRow = 0;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var nextIdx = i+1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_HIGH_A.getTexture(nextIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 8)
			{
				// Destination :
				// copy prev flux_LBD_LOW tex in col = 0, row = 1.***
				var destCol = 0;
				var destRow = 2;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = mosaicXCount - 1;
				var originRow = mosaicYCount - 1;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var prevIdx = i-1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_LOW_A.getTexture(prevIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
			else if (j === 9)
			{
				// Destination :
				// copy next flux_LBD_LOW tex in col = 1, row = 1.***
				var destCol = 1;
				var destRow = 2;
				gl.viewport(destCol, destRow, subTexWidth, subTexHeight);

				// Origin : 
				// calculate the coord of the screenQuad.***
				var originCol = 0;
				var originRow = 0;
				var minX = originCol * unitaryXRange;
				var minY = originRow * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); 
				var texcoordData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // origin texCoords.***
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// Now, bind the textures.***
				var nextIdx = i+1;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_LOW_A.getTexture(nextIdx)); 

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
		}
		
	}


	fbo.unbind();
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
};

SoundLayer.prototype._calculateFlux = function ()
{
	if (!this.voxelizer)
	{
		return false;
	}

	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var gl = magoManager.getGl();

	var fbo = this.simulationMosaicFBO; // this if mosaicTextureSize.***
	var extbuffers = fbo.extbuffers;

	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	var webglController = new WebGlController(gl);

	var screenQuad = soundManager.getQuadBuffer();
	var shader = magoManager.postFxShadersManager.getShader("soundCalculateFlux"); // (waterQuadVertVS, soundCalculateFluxFS)
	magoManager.postFxShadersManager.useProgram(shader);
	//var increTimeSeconds = waterManager.getIncrementTimeSeconds() * 1;

	var refTex3D = this.fluxRFUMosaicTexture3d_HIGH_A; // we can take any other texture3D.***

	gl.uniform1f(shader.u_airMaxPressure_loc, soundManager.airMaxPressure);
	gl.uniform1f(shader.u_maxFlux_loc, soundManager.maxFlux);
	gl.uniform1f(shader.u_airEnvirontmentPressure_loc, soundManager.airEnvirontmentPressure);
	gl.uniform1iv(shader.u_mosaicSize_loc, [refTex3D.mosaicXCount, refTex3D.mosaicYCount, refTex3D.finalSlicesCount]); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	gl.uniform1iv(shader.u_texSize_loc, [refTex3D.texture3DXSize, refTex3D.texture3DYSize, refTex3D.texture3DZSize]); // The original texture3D size.***
	gl.uniform3fv(shader.u_voxelSizeMeters_loc, [this.oneVoxelSizeInMeters[0], this.oneVoxelSizeInMeters[1], this.oneVoxelSizeInMeters[2]]); // The one voxel size in meters.***
	gl.uniform1f(shader.u_timestep_loc, this.simulationTimeStep);

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos_loc, 2);

	//********************************************************************************************************
	// Note : MRT with 4 channels.
	//********************************************************************************************************
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
		extbuffers.COLOR_ATTACHMENT4_WEBGL, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
	]);

	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, null, 0);

	webglController.clearColor(0.0, 0.0, 0.0, 0.0);

	var finalSlicesCount = this.pressureMosaicTexture3d_A.finalSlicesCount;
	for (var i=0; i<finalSlicesCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_A.getTexture( i ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_LOW_A.getTexture( i ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_HIGH_A.getTexture( i ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_LOW_A.getTexture( i ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, this.shaderLogTexture.getTexture( i ), 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i )); // sound source.

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_B.getTexture( i )); // sound source.

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_LOW_B.getTexture( i )); // sound source.

		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_HIGH_B.getTexture( i )); // sound source.

		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, this.fluxLBDMosaicTexture3d_LOW_B.getTexture( i ));

		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, this.auxMosaicTexture3d_forFluxCalculation.getTexture( i ));

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// Draw screenQuad:
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0);

	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	fbo.unbind();
	webglController.restoreAllParameters();

	// now, swap waterHeightTextures:
	SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_HIGH_A, this.fluxRFUMosaicTexture3d_HIGH_B);
	SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_LOW_A, this.fluxRFUMosaicTexture3d_LOW_B);
	SoundLayer._swapTextures3D(this.fluxLBDMosaicTexture3d_HIGH_A, this.fluxLBDMosaicTexture3d_HIGH_B);
	SoundLayer._swapTextures3D(this.fluxLBDMosaicTexture3d_LOW_A, this.fluxLBDMosaicTexture3d_LOW_B);
};

SoundLayer.prototype._setEnvirontmentAirPressure = function ()
{
	if (!this.voxelizer)
	{
		return false;
	}

	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var gl = magoManager.getGl();

	var fbo = this.simulationMosaicFBO; // this if mosaicTextureSize.***
	var extbuffers = fbo.extbuffers;

	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	var webglController = new WebGlController(gl);

	var screenQuad = soundManager.getQuadBuffer();
	var shader = magoManager.postFxShadersManager.getShader("soundCalculateAirPressure"); // (waterQuadVertVS, soundCalculatePressureFS)
	magoManager.postFxShadersManager.useProgram(shader);
	//var increTimeSeconds = waterManager.getIncrementTimeSeconds() * 1;

	gl.uniform1f(shader.u_airMaxPressure_loc, soundManager.airMaxPressure);
	gl.uniform1f(shader.u_airEnvirontmentPressure_loc, soundManager.airEnvirontmentPressure);

	// u_processType == 0= pressure from pressure soyrce. 
	// u_processType == 1= setting air environtment pressure.***
	gl.uniform1i(shader.u_processType_loc, 1);

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	//********************************************************************************************************
	// Note : MRT with 4 channels, because we need bind 4 source textures & 4 current airPressure textures.***
	//********************************************************************************************************
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
	]);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, null, 0);

	// Here no need any texture, so deactive all textures.***
	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	webglController.clearColor(0.0, 0.0, 0.0, 0.0);

	var finalSlicesCount = this.pressureMosaicTexture3d_A.finalSlicesCount;
	var rendersCount = Math.ceil(finalSlicesCount / 4);
	for (var i=0; i<rendersCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i*4 + 0 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i*4 + 1 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i*4 + 2 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i*4 + 3 ), 0);

		// Draw screenQuad:
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	for (var i=0; i<rendersCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i*4 + 0 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i*4 + 1 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i*4 + 2 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i*4 + 3 ), 0);

		// Draw screenQuad:
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	for (var i=0; i<8; i++)
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL+i, gl.TEXTURE_2D, null, 0);
	}

	

	fbo.unbind();
	webglController.restoreAllParameters();

	// now, swap waterHeightTextures:
	SoundLayer._swapTextures3D(this.pressureMosaicTexture3d_A, this.pressureMosaicTexture3d_B);
};

SoundLayer.prototype.drawSimulationVariables = function() 
{
	/*
	// Text inside rectangle sample.*********************************
	// Text inside rectangle sample.*********************************
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");

	var fontsize = 14;
	var fontface = 'verdana';
	var lineHeight = fontsize * 1.286;
	var text = 'Draw a rectangle around me.';

	ctx.font = fontsize + 'px ' + fontface;
	var textWidth = ctx.measureText(text).width;

	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';

	ctx.fillText(text, 20, 50);
	ctx.strokeRect(20, 50, textWidth, lineHeight);
	//------------------------------------------------------------------
	*/

	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var canvas = magoManager.getObjectLabel();
	var ctx = canvas.getContext("2d");

	// lod2.
	var gl = magoManager.getGl();
	var worldPosition;
	var screenCoord = new Point2D(100, 100);

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	// write.*****************************************************
	var offset = [0.0, 0.0];
	var increY = 30.0;
	ctx.fillStyle = "black";
	ctx.strokeStyle = "white";
	ctx.font = "bold 18px Arial";
	var lineHeight = 18 * 1.286;

	var text = "Wave length (m) : " + this.waveLength.toString(10);
	var textWidth = ctx.measureText(text).width;
	ctx.strokeText(text, screenCoord.x, screenCoord.y);
	ctx.fillText(text, screenCoord.x, screenCoord.y);
	//ctx.strokeRect(screenCoord.x, screenCoord.y, textWidth, lineHeight);

	offset[1] += increY;
	text = "Wave amplitude (Pa) : " + this.waveAmplitude.toString(10);
	textWidth = ctx.measureText(text).width;
	ctx.strokeText(text, screenCoord.x + offset[0], screenCoord.y + offset[1]);
	ctx.fillText(text, screenCoord.x + offset[0], screenCoord.y + offset[1]);//this.simulationTimeStep
	//ctx.strokeRect(screenCoord.x + offset[0], screenCoord.y + offset[1], textWidth, lineHeight);

	offset[1] += increY;
	text = "Simulation time step (s) : " + this.simulationTimeStep.toFixed(5).toString(10);
	textWidth = ctx.measureText(text).width;
	ctx.strokeText(text, screenCoord.x + offset[0], screenCoord.y + offset[1]);
	ctx.fillText(text, screenCoord.x + offset[0], screenCoord.y + offset[1]);
	//ctx.strokeRect(screenCoord.x + offset[0], screenCoord.y + offset[1], textWidth, lineHeight);

	offset[1] += increY;
	text = "Wave phase : " + this.wavePhase.toFixed(5).toString(10);
	textWidth = ctx.measureText(text).width;
	ctx.strokeText(text, screenCoord.x + offset[0], screenCoord.y + offset[1]);
	ctx.fillText(text, screenCoord.x + offset[0], screenCoord.y + offset[1]);
	//ctx.strokeRect(screenCoord.x + offset[0], screenCoord.y + offset[1], textWidth, lineHeight);

	offset[1] += increY;
	text = "Time (s) : " + this.timeStepAccum.toFixed(5).toString(10);
	textWidth = ctx.measureText(text).width;
	ctx.strokeText(text, screenCoord.x + offset[0], screenCoord.y + offset[1]);
	ctx.fillText(text, screenCoord.x + offset[0], screenCoord.y + offset[1]);
	//ctx.strokeRect(screenCoord.x + offset[0], screenCoord.y + offset[1], textWidth, lineHeight);

	// End writing.-----------------------------------------------------
	ctx.restore();
	this.canvasDirty = true;
};

SoundLayer.prototype._calculateAirPressureFromSoundSource = function ()
{
	if (!this.voxelizer)
	{
		return false;
	}

	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var gl = magoManager.getGl();

	var fbo = this.simulationMosaicFBO; // this if mosaicTextureSize.***
	var extbuffers = fbo.extbuffers;

	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	var webglController = new WebGlController(gl);

	var screenQuad = soundManager.getQuadBuffer();
	var shader = magoManager.postFxShadersManager.getShader("soundCalculateAirPressure"); // (waterQuadVertVS, soundCalculatePressureFS)
	magoManager.postFxShadersManager.useProgram(shader);
	//var increTimeSeconds = waterManager.getIncrementTimeSeconds() * 1;

	// Simulate a wave airPressure using "this.timeStepAccum" & "this.simulationTimeStep".***
	/*
	Para una temperatura de aire de 20ºC donde la velocidad del sonido es 344 m/s, 
	las ondas de sonido audible, tienen longitudes de onda desde 0,0172 m (0,68 pulgadas), 
	a 17,2 metros (56,4 pies).
	*/
	this.waveLength = 15.0; // 1m.***
	var waveSpeed = 320.0;// 320m/s.
	var freq = waveSpeed / this.waveLength;
	var angularVelocity = 2 * Math.PI * freq; // w = 2PI/T or w = 2PI*freq.***
	this.waveAmplitude = 6.0;
	var environtmentAirPressure = soundManager.airEnvirontmentPressure;
	var currTimeSec = this.timeStepAccum;
	this.wavePhase = Math.sin(angularVelocity * currTimeSec);
	var airPressureAlternative = this.waveAmplitude * this.wavePhase + (this.waveAmplitude);// + environtmentAirPressure); // Pa.***

	gl.uniform1f(shader.u_airMaxPressure_loc, soundManager.airMaxPressure);
	gl.uniform1f(shader.u_airEnvirontmentPressure_loc, soundManager.airEnvirontmentPressure);
	gl.uniform1f(shader.u_airPressureAlternative_loc, airPressureAlternative);

	//*****************************************************************
	// u_processType == 0= pressure from pressure soyrce. 
	// u_processType == 1= setting air environtment pressure.***
	// u_processType == 2= wave pressure.***
	gl.uniform1i(shader.u_processType_loc, 2);
	//-----------------------------------------------------------------

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	//********************************************************************************************************
	// Note : MRT with 4 channels, because we need bind 4 source textures & 4 current airPressure textures.***
	//********************************************************************************************************
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[3]
	]);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, null, 0);

	webglController.clearColor(0.0, 0.0, 0.0, 0.0);

	var finalSlicesCount = this.pressureMosaicTexture3d_A.finalSlicesCount;
	var rendersCount = Math.ceil(finalSlicesCount / 4);
	for (var i=0; i<rendersCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i*4 + 0 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i*4 + 1 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i*4 + 2 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.pressureMosaicTexture3d_A.getTexture( i*4 + 3 ), 0);

		//gl.uniform1i(shader.u_lowestMosaicSliceIndex_loc,  i*8);
		// bind sound source.***
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.soundSourceMosaicTexture3d.getTexture( i*4 + 0 )); // sound source.

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.soundSourceMosaicTexture3d.getTexture( i*4 + 1 )); // sound source.

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.soundSourceMosaicTexture3d.getTexture( i*4 + 2 )); // sound source.

		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, this.soundSourceMosaicTexture3d.getTexture( i*4 + 3 )); // sound source.

		// bind current air pressure.***
		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i*4 + 0 ));

		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i*4 + 1 ));

		gl.activeTexture(gl.TEXTURE6);
		gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i*4 + 2 ));

		gl.activeTexture(gl.TEXTURE7);
		gl.bindTexture(gl.TEXTURE_2D, this.pressureMosaicTexture3d_B.getTexture( i*4 + 3 ));

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// Draw screenQuad:
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	for (var i=0; i<8; i++)
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL+i, gl.TEXTURE_2D, null, 0);
	}

	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	fbo.unbind();
	webglController.restoreAllParameters();

	// now, swap waterHeightTextures:
	SoundLayer._swapTextures3D(this.pressureMosaicTexture3d_A, this.pressureMosaicTexture3d_B);
};

SoundLayer._swapTextures3D = function (magoTexture3D_A, magoTexture3D_B)
{
	// swap the texturesArray.***
	var texturesArrayAux = magoTexture3D_A.texturesArray;
	magoTexture3D_A.texturesArray = magoTexture3D_B.texturesArray;
	magoTexture3D_B.texturesArray = texturesArrayAux;
};

SoundLayer.prototype._makeQuantizedMeshVbo = function (tile)
{
	var qMesh = tile.qMesh;
	var minHeight = qMesh._minimumHeight;
	var maxHeight = qMesh._maximumHeight;
	var uValues = qMesh._uValues;
	var vValues = qMesh._vValues;
	var hValues = qMesh._heightValues;
	this.indices = qMesh._indices;

	// Now, make vbo.***
	var pointsCount = uValues.length;
	this.cartesiansArray = new Uint16Array(pointsCount * 3);

	var shortMax = 32767;
	var x, y, z;
	for (var i=0; i<pointsCount; i++)
	{
		x = uValues[i];
		y = vValues[i];
		z = hValues[i];

		this.cartesiansArray[i * 3] = x;
		this.cartesiansArray[i * 3 + 1] = y;
		this.cartesiansArray[i * 3 + 2] = z;
	}

	var magoManager = this.soundManager.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;

	if (tile.qMeshVboKeyContainer === undefined)
	{ tile.qMeshVboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKey = tile.qMeshVboKeyContainer.newVBOVertexIdxCacheKey();
	
	// Positions.
	vboKey.setDataArrayPos(this.cartesiansArray, vboMemManager);

	// Normals.
	if (this.normalsArray)
	{
		vboKey.setDataArrayNor(this.normalsArray, vboMemManager);
	}
	
	// TexCoords.
	if (this.texCoordsArray)
	{
		vboKey.setDataArrayTexCoord(this.texCoordsArray, vboMemManager);
	}
		
	// Indices.
	vboKey.setDataArrayIdx(this.indices, vboMemManager);

	var hola = 0;
};

SoundLayer.prototype.makeDEMTextureByQuantizedMeshes = function ()
{
	if (this.makeDemTextureByQMeshses_processFinished) 
	{
		return;
	}

	if (!this.isPrepared()) 
	{ 
		return; 
	}

	

	/*
	// Note : In sound simulation dont recalculate the heights of the geoExtension bcos this is the volume of the sound simulation.***
	// Must calculate the minHeight & maxHeight of the water simulation area.***
	// So, to do this, reset the altitudes of the geographicExtension.
	if (!this.recalculatedGeoExtentAltitudes)
	{
		this.geographicExtent.setExtentAltitudes(10000.0, -10000.0);
		var tilesCount = this.tilesArray.length;
		for (var i=0; i<tilesCount; i++)
		{
			var tile = this.tilesArray[i];
			var minHeight = tile.qMesh._minimumHeight;
			var maxHeight = tile.qMesh._maximumHeight;

			// In this point, calculate the minimumHeight and the maximumHeight of the simulation area.***
			if (this.geographicExtent.minGeographicCoord.altitude > minHeight)
			{
				this.geographicExtent.minGeographicCoord.altitude = minHeight;
			}
			else if (this.geographicExtent.maxGeographicCoord.altitude < maxHeight)
			{
				this.geographicExtent.maxGeographicCoord.altitude = maxHeight;
			}
		}

		this.recalculatedGeoExtentAltitudes = true;
	}
	*/

	this.terrainMinMaxHeights[0] = this.geographicExtent.minGeographicCoord.altitude;
	this.terrainMinMaxHeights[1] = this.geographicExtent.maxGeographicCoord.altitude;

	// Now, make the vbo of the each tile.***
	var tilesCount = this.tilesArray.length;

	if (!this.tilesQuantizedMeshVboMade)
	{
		for (var i=0; i<tilesCount; i++)
		{
			var tile = this.tilesArray[i];
			if (!tile.qMeshVboKeyContainer)
			{
				if (tile.qMesh && tile.qMesh._uValues === undefined)
				{
					// Note : the code enter here when serverPolicy.terrainType = 'cesium-default';
					// Note : the cesium default terrain(without DEM) has "qMesh", but has no "qMesh._uValues".***
					// So, set tile.qMesh as undefined & continue the algorithm.***
					tile.qMesh = undefined;
				}

				if (!tile.qMesh)
				{
					// The terrainProvider has no qMesh of this tile, so :
					// make mesh virtually.***
					var lonSegments = 2;
					var latSegments = 2;
					var altitude = 0.0;

					tile.qMesh = QuantizedMeshManager.makeQuantizedMesh_virtually(lonSegments, latSegments, altitude, undefined);
				}

				if (tile.qMesh)
				{
					this._makeQuantizedMeshVbo(tile);
				}
				else
				{
					// The terrainProvider has no qMesh of this tile, so :
					// make mesh virtually.***
					var hola = 0;
				}
			}
		}

		this.tilesQuantizedMeshVboMade = true;
	}
	
	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.getGl();
	var fbo = this.terrainTexFbo; // simulation fbo. (512 x 512).
	//var fbo = soundManager.fbo; // simulation fbo. (1024 x 1024).
	var extbuffers = fbo.extbuffers;
	var shader;


	

	if (!this.original_dem_texture)
	{
		var texWidth = this.terrainTextureSize[0];
		var texHeight = this.terrainTextureSize[1];

		this.original_dem_texture = soundManager._newTexture(gl, texWidth, texHeight);
	}

	// 2n, make building depth over terrain depth.******************************************************************************************************
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.original_dem_texture.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
	]);

	gl.disable(gl.BLEND);
	gl.disable(gl.CULL_FACE);
	//gl.clearColor(1.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0);

	shader = magoManager.postFxShadersManager.getShader("depthTexFromQuantizedMesh"); // (waterQuantizedMeshVS, waterDEMTexFromQuantizedMeshFS)
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	//gl.uniform2fv(shader.u_minMaxHeights_loc, [this.qMesh._minimumHeight, this.qMesh._maximumHeight]);
	gl.uniform1i(shader.colorType_loc_loc, 0);
	gl.uniform1i(shader.u_terrainHeightEncodingBytes_loc, soundManager.terrainHeightEncodingBytes);
	gl.uniform1i(shader.u_flipTexCoordY_loc, false);

	//gl.disable(gl.CULL_FACE);
	gl.clear(gl.DEPTH_BUFFER_BIT);

	// Now, set the waterSimGeoExtent & the qMeshGeoExtent.
	var geoExtent = this.geographicExtent;
	//var totalMinLonFloor = Math.floor(geoExtent.minGeographicCoord.longitude);
	//var totalMinLatFloor = Math.floor(geoExtent.minGeographicCoord.latitude);
	gl.uniform3fv(shader.u_totalMinGeoCoord_loc, new Float32Array([geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]));
	gl.uniform3fv(shader.u_totalMaxGeoCoord_loc, new Float32Array([geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]));

	//var lonRange = geoExtent.maxGeographicCoord.longitude - geoExtent.minGeographicCoord.longitude;
	//var latRange = geoExtent.maxGeographicCoord.latitude - geoExtent.minGeographicCoord.latitude;

	if (this.demTextureByQMesh_lastTileIdx === undefined)
	{
		this.demTextureByQMesh_lastTileIdx = 0;
	}

	var maxTilesRender = 50;
	for (var i = 0; i<maxTilesRender; i++)
	{
		var idx = i + this.demTextureByQMesh_lastTileIdx;

		if (idx >= tilesCount)
		{
			this.original_dem_texture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
			this.makeDemTextureByQMeshses_processFinished = true;
			
			break;
		}
		var tile = this.tilesArray[idx];
		var tileGeoExtent = tile.geoExtent;
		gl.uniform3fv(shader.u_currentMinGeoCoord_loc, new Float32Array([tileGeoExtent.minGeographicCoord.longitude, tileGeoExtent.minGeographicCoord.latitude, tile.qMesh._minimumHeight]));
		gl.uniform3fv(shader.u_currentMaxGeoCoord_loc, new Float32Array([tileGeoExtent.maxGeographicCoord.longitude, tileGeoExtent.maxGeographicCoord.latitude, tile.qMesh._maximumHeight]));

		var vbo_vicky = tile.qMeshVboKeyContainer.vboCacheKeysArray[0]; // there are only one.
		var vertices_count = vbo_vicky.vertexCount;

		// Bind positions.
		vbo_vicky.vboBufferPos.bindData(shader, shader.position3_loc, vboMemManager);
		
		//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
		//{ return false; }

		//if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
		//{ return false; }

		//if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
		//{ return false; }

		var indicesCount = vbo_vicky.indicesCount;
		if (!vbo_vicky.bindDataIndice(shader, magoManager.vboMemoryManager))
		{ return false; }

		gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
	}

	this.demTextureByQMesh_lastTileIdx += maxTilesRender;

	fbo.unbind();
	gl.enable(gl.CULL_FACE);
	//gl.clearColor(0.0, 0.0, 0.0, 0.0);
	
};

SoundLayer.prototype.getBoundingSphereWC = function ()
{
	if (!this._BSphereWC)
	{
		var magoManager = this.soundManager.magoManager;
		this._BSphereWC = SmartTile.computeSphereExtent(magoManager, this.geographicExtent.minGeographicCoord, this.geographicExtent.maxGeographicCoord, undefined);
	}

	return this._BSphereWC;
};

SoundLayer.prototype._isObjectIdDemOverWrited = function (objectId)
{
	if (!this.buildingsId_OverWritedOnDemMap)
	{
		return false;
	}

	return this.buildingsId_OverWritedOnDemMap.hasOwnProperty(objectId);
};

SoundLayer.prototype.doIntersectedObjectsCulling = function (visiblesArray, nativeVisiblesArray)
{
	// this function does a frustumCulling-like process.
	if (!this.intersectedObjectsCullingFinished)
	{
		var soundManager = this.soundManager;
		var magoManager = soundManager.magoManager;
		var smartTileManager = magoManager.smartTileManager;
		if (!this.visibleObjectsControler)
		{
			// create a visible objects controler.
			this.visibleObjectsControler = new VisibleObjectsController();
		}
		smartTileManager.getRenderableObjectsInGeographicExtent(this.geographicExtent, this.visibleObjectsControler);
		var visiblesArray = this.visibleObjectsControler.getAllVisibles();
		if (visiblesArray.length > 0)
		{ this.intersectedObjectsCullingFinished = true; }
	}
	/*
	// Old....
	if (!this.cullingUpdatedTime)
	{ this.cullingUpdatedTime = 0; }

	var visiblesCount = 0;
	var nativeVisiblesCount = 0;

	if (visiblesArray)
	{ visiblesCount = visiblesArray.length; }

	if (nativeVisiblesArray)
	{ nativeVisiblesCount = nativeVisiblesArray.length; }

	//if(visiblesCount === 0 && nativeVisiblesCount === 0)
	//return;

	var myBSphereWC = this.getBoundingSphereWC();

	

	// visiblesObjects (nodes).
	var node;
	var bSphereWC;
	for (var i=0; i<visiblesCount; i++)
	{
		node = visiblesArray[i];
		if (this._isObjectIdDemOverWrited(node._guid)) 
		{
			// There are 3 or more frustums, so cannot apply this function : "_isObjectIdDemOverWrited()".***
			continue;
		}
		bSphereWC = node.getBoundingSphereWC(bSphereWC);

		if (myBSphereWC.intersectionSphere(bSphereWC) !== Constant.INTERSECTION_OUTSIDE)
		{
			this.visibleObjectsControler.currentVisibles0.push(node);
		}
	}

	// test.******
	if (!this.buildingsId_OverWritedOnDemMap)
	{
		this.buildingsId_OverWritedOnDemMap = {};
	}
	//if (Object.keys(this.buildingsId_OverWritedOnDemMap).length === 0)
	//{
	//	var hola = 0;
	//}

	// nativeVisiblesObjects.
	var native;
	for (var i=0; i<nativeVisiblesCount; i++)
	{
		native = nativeVisiblesArray[i];
		if (native.name === "contaminationGenerator" || native.name === "excavationObject" || native.name === "waterGenerator") 
		{
			continue;
		}

		if (this._isObjectIdDemOverWrited(native._guid)) 
		{
			//continue;
		}

		bSphereWC = native.getBoundingSphereWC(bSphereWC);

		if (myBSphereWC.intersectionSphere(bSphereWC) !== Constant.INTERSECTION_OUTSIDE)
		{
			this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.push(native);
		}
	}
	
	*/
	return true;
};

SoundLayer.prototype.getTileOrthographic_mvpMat_zAxisDirection = function ()
{
	if (!this.tileOrthoModelViewProjMatrix_zAxisDirection)
	{
		// Calculate the mvp matrix.***********************************************************************************************
		var minLon = this.geographicExtent.minGeographicCoord.longitude;
		var minLat = this.geographicExtent.minGeographicCoord.latitude;
		var minAlt = this.geographicExtent.minGeographicCoord.altitude;

		var maxLon = this.geographicExtent.maxGeographicCoord.longitude;
		var maxLat = this.geographicExtent.maxGeographicCoord.latitude;
		var maxAlt = this.geographicExtent.maxGeographicCoord.altitude;

		var midLon = (minLon + maxLon) / 2.0;
		var midLat = (minLat + maxLat) / 2.0;
		var midAlt = (minAlt + maxAlt) / 2.0;

		var lonRange = maxLon - minLon;
		var latRange = maxLat - minLat;
		var altRange = maxAlt - minAlt;
		
		//***************************************
		// Setting values for cam dir = -z.***
		var left = -lonRange / 2.0;
		var right = lonRange / 2.0;
		var bottom = -latRange / 2.0;
		var top = latRange / 2.0;
		var near = -altRange / 2.0;
		var far = altRange / 2.0;
		//---------------------------------------


		var ortho = new Matrix4();
		var nearFarScale = 1.0; // original 2.0.
		ortho._floatArrays = glMatrix.mat4.ortho(ortho._floatArrays, left, right, bottom, top, near * nearFarScale, far * nearFarScale);

		// The modelView matrix is a NO rotation matrix, centered in the midle of the tile.
		var tMat = new Matrix4();
		tMat.setTranslation(midLon, midLat, midAlt);


		// Now, calculate mvMat from transformMat.***
		var modelView = new Matrix4();
		modelView._floatArrays = glMatrix.mat4.invert(modelView._floatArrays, tMat._floatArrays);

		// Now, calculate modelViewProjectionMatrix.
		// modelViewProjection.***
		this.tileOrthoModelViewProjMatrix_zAxisDirection = new Matrix4();
		this.tileOrthoModelViewProjMatrix_zAxisDirection = modelView.getMultipliedByMatrix(ortho, this.tileOrthoModelViewProjMatrix_zAxisDirection);
	}

	return this.tileOrthoModelViewProjMatrix_zAxisDirection;
};

SoundLayer.prototype.getTileOrthographic_mvpMat_yAxisDirection = function ()
{
	if (!this.tileOrthoModelViewProjMatrix_yAxisDirection)
	{
		// Calculate the mvp matrix.***********************************************************************************************
		var minLon = this.geographicExtent.minGeographicCoord.longitude;
		var minLat = this.geographicExtent.minGeographicCoord.latitude;
		var minAlt = this.geographicExtent.minGeographicCoord.altitude;

		var maxLon = this.geographicExtent.maxGeographicCoord.longitude;
		var maxLat = this.geographicExtent.maxGeographicCoord.latitude;
		var maxAlt = this.geographicExtent.maxGeographicCoord.altitude;

		var midLon = (minLon + maxLon) / 2.0;
		var midLat = (minLat + maxLat) / 2.0;
		var midAlt = (minAlt + maxAlt) / 2.0;

		var lonRange = maxLon - minLon;
		var latRange = maxLat - minLat;
		var altRange = maxAlt - minAlt;
		
		//***************************************
		// Setting values for cam dir = -z.***
		//var left = -lonRange / 2.0;
		//var right = lonRange / 2.0;
		//var bottom = -latRange / 2.0;
		//var top = latRange / 2.0;
		//var near = -altRange / 2.0;
		//var far = altRange / 2.0;
		//---------------------------------------
		//// calculate the latitudesRange for 1 slice.***
		//var simXSize = this.simulationTextureSize[0];
		//var simYSize = this.simulationTextureSize[1];
		//var simZSize = this.texturesNumSlices;

		var left = -lonRange / 2.0;
		var right = lonRange / 2.0;
		var bottom = -altRange / 2.0; // here, bottom-top depends of the altitude.***
		var top = altRange / 2.0; // here, bottom-top depends of the altitude.***
		var near = -latRange / 2.0; // here, near-far depends of the latitude.***
		var far = latRange / 2.0; // here, near-far depends of the latitude.***


		var ortho = new Matrix4();
		var nearFarScale = 1.0; // original 2.0.
		ortho._floatArrays = glMatrix.mat4.ortho(ortho._floatArrays, left, right, bottom, top, near * nearFarScale, far * nearFarScale);

		// The modelView matrix is a NO rotation matrix, centered in the midle of the tile.
		var tMat = new Matrix4();
		tMat.setTranslation(midLon, midLat, midAlt);

		// Need a rotation matrix (rot 90 deg in xAxis).***
		var rotMat = new Matrix4();
		//Matrix4.prototype.rotationAxisAngDeg = function(angDeg, axis_x, axis_y, axis_z)
		rotMat.rotationAxisAngDeg(90.0, 1.0, 0.0, 0.0);

		// Now, multiply tMat & rotMat.***
		var transformMat = new Matrix4();
		transformMat = rotMat.getMultipliedByMatrix(tMat, transformMat);

		// Now, calculate mvMat from transformMat.***
		var modelView = new Matrix4();
		modelView._floatArrays = glMatrix.mat4.invert(modelView._floatArrays, transformMat._floatArrays);

		// Now, calculate modelViewProjectionMatrix.
		// modelViewProjection.***
		this.tileOrthoModelViewProjMatrix_yAxisDirection = new Matrix4();
		this.tileOrthoModelViewProjMatrix_yAxisDirection = modelView.getMultipliedByMatrix(ortho, this.tileOrthoModelViewProjMatrix_yAxisDirection);
	}

	return this.tileOrthoModelViewProjMatrix_yAxisDirection;
};

SoundLayer.prototype.getTileOrthographic_mvpMat_xAxisDirection = function ()
{
	if (!this.tileOrthoModelViewProjMatrix_xAxisDirection)
	{
		// Calculate the mvp matrix.***********************************************************************************************
		var minLon = this.geographicExtent.minGeographicCoord.longitude;
		var minLat = this.geographicExtent.minGeographicCoord.latitude;
		var minAlt = this.geographicExtent.minGeographicCoord.altitude;

		var maxLon = this.geographicExtent.maxGeographicCoord.longitude;
		var maxLat = this.geographicExtent.maxGeographicCoord.latitude;
		var maxAlt = this.geographicExtent.maxGeographicCoord.altitude;

		var midLon = (minLon + maxLon) / 2.0;
		var midLat = (minLat + maxLat) / 2.0;
		var midAlt = (minAlt + maxAlt) / 2.0;

		var lonRange = maxLon - minLon;
		var latRange = maxLat - minLat;
		var altRange = maxAlt - minAlt;
		
		//***************************************
		// Setting values for cam dir = -z.***
		//var left = -lonRange / 2.0;
		//var right = lonRange / 2.0;
		//var bottom = -latRange / 2.0;
		//var top = latRange / 2.0;
		//var near = -altRange / 2.0;
		//var far = altRange / 2.0;
		//---------------------------------------
		//// calculate the latitudesRange for 1 slice.***
		//var simXSize = this.simulationTextureSize[0];
		//var simYSize = this.simulationTextureSize[1];
		//var simZSize = this.texturesNumSlices;

		var left = -latRange / 2.0; // here, left-right depends of the latitude.***
		var right = latRange / 2.0; // here, left-right depends of the latitude.***
		var bottom = -altRange / 2.0; // here, bottom-top depends of the altitude.***
		var top = altRange / 2.0; // here, bottom-top depends of the altitude.***
		var near = -lonRange / 2.0; // here, near-far depends of the longitude.***
		var far = lonRange / 2.0; // here, near-far depends of the longitude.***


		var ortho = new Matrix4();
		var nearFarScale = 1.0; // original 2.0.
		ortho._floatArrays = glMatrix.mat4.ortho(ortho._floatArrays, left, right, bottom, top, near * nearFarScale, far * nearFarScale);

		// The modelView matrix is a NO rotation matrix, centered in the midle of the tile.
		var tMat = new Matrix4();
		tMat.setTranslation(midLon, midLat, midAlt);

		// Need a rotation matrix (rot -90 deg in zAxis).***
		var zrotMat = new Matrix4();
		zrotMat.rotationAxisAngDeg(-90.0, 0.0, 0.0, 1.0);

		// Need a rotation matrix (rot 90 deg in xAxis).***
		var xrotMat = new Matrix4();
		xrotMat.rotationAxisAngDeg(90.0, 1.0, 0.0, 0.0);

		// Now, calculate the totalRotMatrix.***
		var totalrotMat = new Matrix4();
		totalrotMat = xrotMat.getMultipliedByMatrix(zrotMat, totalrotMat);
		//totalrotMat = zrotMat.getMultipliedByMatrix(xrotMat, totalrotMat);

		// Now, multiply tMat & xrotMat.***
		var transformMat = new Matrix4();
		transformMat = totalrotMat.getMultipliedByMatrix(tMat, transformMat);

		// Now, calculate mvMat from transformMat.***
		var modelView = new Matrix4();
		modelView._floatArrays = glMatrix.mat4.invert(modelView._floatArrays, transformMat._floatArrays);

		// Now, calculate modelViewProjectionMatrix.
		// modelViewProjection.***
		this.tileOrthoModelViewProjMatrix_xAxisDirection = new Matrix4();
		this.tileOrthoModelViewProjMatrix_xAxisDirection = modelView.getMultipliedByMatrix(ortho, this.tileOrthoModelViewProjMatrix_xAxisDirection);
	}

	return this.tileOrthoModelViewProjMatrix_xAxisDirection;
};

SoundLayer.prototype.getTileOrthographic_mvpMat = function ()
{
	if (!this.tileOrthoModelViewProjMatrix)
	{
		// Calculate the mvp matrix.***********************************************************************************************
		//var depthFactor = 10.0;
		var minLon = this.geographicExtent.minGeographicCoord.longitude;
		var minLat = this.geographicExtent.minGeographicCoord.latitude;
		//var minAlt = this.terrainMinMaxHeights[0]; // old. used in water sim.****
		var minAlt = this.geographicExtent.minGeographicCoord.altitude;

		var maxLon = this.geographicExtent.maxGeographicCoord.longitude;
		var maxLat = this.geographicExtent.maxGeographicCoord.latitude;
		//var maxAlt = this.terrainMinMaxHeights[1]; // old. used in water sim.****
		var maxAlt = this.geographicExtent.maxGeographicCoord.altitude;

		var midLon = (minLon + maxLon) / 2.0;
		var midLat = (minLat + maxLat) / 2.0;
		var midAlt = (minAlt + maxAlt) / 2.0;

		var lonRange = maxLon - minLon;
		var latRange = maxLat - minLat;
		var altRange = maxAlt - minAlt;
		
		var left = -lonRange / 2.0;
		var right = lonRange / 2.0;
		var bottom = -latRange / 2.0;
		var top = latRange / 2.0;
		var near = -altRange / 2.0;
		var far = altRange / 2.0;
		//var nRange = light.directionalBoxWidth/2;
		//var left = -nRange, right = nRange, bottom = -nRange, top = nRange, near = -depthFactor*nRange, far = depthFactor*nRange;
		var ortho = new Matrix4();
		var nearFarScale = 1.0; // original 2.0.
		ortho._floatArrays = glMatrix.mat4.ortho(ortho._floatArrays, left, right, bottom, top, near * nearFarScale, far * nearFarScale);

		// The modelView matrix is a NO rotation matrix, centered in the midle of the tile.
		var tMat = new Matrix4();
		tMat.setTranslation(midLon, midLat, midAlt);

		var modelView = new Matrix4();
		modelView._floatArrays = glMatrix.mat4.invert(modelView._floatArrays, tMat._floatArrays);

		// Now, calculate modelViewProjectionMatrix.
		// modelViewProjection.***
		this.tileOrthoModelViewProjMatrix = new Matrix4();
		this.tileOrthoModelViewProjMatrix = modelView.getMultipliedByMatrix(ortho, this.tileOrthoModelViewProjMatrix);
	}

	return this.tileOrthoModelViewProjMatrix;
};

SoundLayer.prototype.copyTexture = function (originalTexture, dstTexturesArray, bFlipTexcoordY, fbo)
{
	// There are the original tile DEM texture named : "dem_texture".
	// In this function we copy the originalDEM into "demWithBuildingsTex".
	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var screenQuad = this.soundManager.getQuadBuffer();
	var gl = magoManager.getGl();
	if (!fbo)
	{
		fbo = this.fbo; // simulation fbo. (512 x 512).
	}
	var extbuffers = fbo.extbuffers;
	var shader;

	var dstTexture = dstTexturesArray[0];

	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, dstTexture.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
	]);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, originalTexture.texId);  // original.***
		
	gl.disable(gl.BLEND);

	shader = magoManager.postFxShadersManager.getShader("waterCopyTexture"); // (waterQuadVertVS, waterCopyFS)
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	gl.uniform1i(shader.u_textureFlipYAxis_loc, bFlipTexcoordY);

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.attribLocations.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.enable(gl.BLEND);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***

	// Finally unbind the framebuffer.***
	fbo.unbind();
};

SoundLayer.prototype._renderVisibleObjects = function (shader, magoManager)
{
	// Function used in overWritingDEMDepth texture.***
	var visibleNodesCount = this.visibleObjectsControler.currentVisibles0.length;
	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;

	var renderType = 0;
	var refMatrixIdxKey = 0;
	var glPrimitive = undefined; // 

	if (!this.buildingsId_OverWritedOnDemMap)
	{
		this.buildingsId_OverWritedOnDemMap = {};
	}

	var lodRendered = -1;
	this.overWriteDEMWithObjectsFinished = true; // init.***

	for (var i=0; i<visibleNodesCount; i++)
	{
		var node = this.visibleObjectsControler.currentVisibles0[i];
		lodRendered = node.renderContent(magoManager, shader, renderType, refMatrixIdxKey);
		if (lodRendered === undefined || lodRendered < 0)
		{
			this.overWriteDEMWithObjectsFinished = false; // OverWiriteDEM FINISHED.!!!!!! ***
		}
		this.buildingsId_OverWritedOnDemMap[node._guid] = node;
	}

	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	for (var i=0; i<visibleNativesOpaquesCount; i++)
	{
		var native = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray[i];
		if (native.name !== "contaminationGenerator" && native.name !== "excavationObject" && native.name !== "waterGenerator")
		{ 
			// must render in double face.***
			if (native.attributes === undefined)
			{
				native.attributes = {};
			}
			// keep the current value.***
			var currNativeDoubleFace = native.attributes.doubleFace;

			if (native.attributes.doubleFace === undefined || native.attributes.doubleFace === false)
			{
				native.attributes.doubleFace = true;
			}
			native.render(magoManager, shader, renderType, glPrimitive); 
			this.buildingsId_OverWritedOnDemMap[native._guid] = native;

			// return the keeped value.***
			native.attributes.doubleFace = currNativeDoubleFace;
		}
	}

	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;
	for (var i=0; i<visibleNativesTransparentsCount; i++)
	{
		var native = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray[i];
		if (native.name !== "contaminationGenerator" && native.name !== "excavationObject" && native.name !== "waterGenerator")
		{ 
			// must render in double face.***
			if (native.attributes === undefined)
			{
				native.attributes = {};
			}
			// keep the current value.***
			var currNativeDoubleFace = native.attributes.doubleFace;

			if (native.attributes.doubleFace === undefined || native.attributes.doubleFace === false)
			{
				native.attributes.doubleFace = true;
			}
			native.render(magoManager, shader, renderType, glPrimitive); 
			this.buildingsId_OverWritedOnDemMap[native._guid] = native;

			// return the keeped value.***
			native.attributes.doubleFace = currNativeDoubleFace;
		}
	}
};

SoundLayer.prototype.overWriteDEMWithObjects = function (shader, magoManager)
{
	if (this.overWriteDEMWithObjectsFinished)
	{
		return true;
	}

	// render extrudeObjects depth over the DEM depth texture.
	if (!this.visibleObjectsControler)
	{ return; }

	if (!this.isPrepared())
	{ return; }

	if (!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	if (!this.original_dem_texture)
	{ return false; }

	var visibleNodesCount = this.visibleObjectsControler.currentVisibles0.length;
	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;

	var modelViewProjMatrix = this.getTileOrthographic_mvpMat();

	var soundManager = this.soundManager;
	var gl = magoManager.getGl();
	var fbo = this.fbo; // simulation fbo. (512 x 512).
	var extbuffers = fbo.extbuffers;
	var shader;

	// 1rst, copy the terrain depth into "this.demWithBuildingsTex".************************************************************************************
	//if (magoManager.isFarestFrustum())
	{ 
		if (!this.demWithBuildingsTex_isPrepared)
		{
			// We must copy "dem_texture" into "demWithBuildingsTex" to preserve the "dem_texture".
			// There are the original tile DEM texture named : "dem_texture".
			// In this function we copy the "dem_texture" into "demWithBuildingsTex".
			// Note : "dem_texture" can have excavations.
			var bFlipTexcoordY = false;
			this.copyTexture(this.original_dem_texture, [this.demWithBuildingsTex], bFlipTexcoordY);
			this.demWithBuildingsTex_isPrepared = true;
		}
	}

	if (visibleNodesCount + visibleNativesOpaquesCount + visibleNativesTransparentsCount === 0)
	{
		return;
	}

	// 2n, make building depth over terrain depth.******************************************************************************************************
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.demWithBuildingsTex.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
	]);

	gl.disable(gl.BLEND);
	//gl.clearColor(1.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.original_dem_texture.texId);  // original.***

	
	// 1rst, create a local coords system:
	// the center of the water tile is origin.
	shader = magoManager.postFxShadersManager.getShader("waterOrthogonalDepthRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	var geoExtent = this.geographicExtent;
	gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, modelViewProjMatrix._floatArrays);
	gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	gl.uniform4fv(shader.u_color4_loc, [1.0, 0.0, 0.0, 1.0]); //.***
	////gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights); // old. used in water sim.***
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, [geoExtent.minGeographicCoord.altitude, geoExtent.maxGeographicCoord.altitude]);
	gl.uniform2fv(shader.u_simulationTextureSize_loc, this.simulationTextureSize);
	gl.uniform1i(shader.u_terrainHeightEncodingBytes_loc, soundManager.terrainHeightEncodingBytes);

	gl.uniform1i(shader.u_processType_loc, 0); // 0 = overWriteDEM, 1 = excavation, 2 = overWrite, but limited by "quantizedVolume_MinMax".***
	gl.uniform3fv(shader.u_quantizedVolume_MinMax_loc, [0.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
	
	//gl.disable(gl.CULL_FACE);
	gl.clear(gl.DEPTH_BUFFER_BIT);

	//this._renderVisibleObjects(shader, magoManager); // Active this code.!!!
	this.overWriteDEMWithObjectsFinished = true; // test debug : delete this.!!!!!!
	
	gl.enable(gl.CULL_FACE);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null); 
	gl.frontFace(gl.CCW);
};

SoundLayer.prototype._voxelizeInYDirection = function (magoManager)
{
	//if (this.overWriteDEMWithObjectsFinished)
	//{
	//	return true;
	//}

	if (!this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray || this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray.length === 0)
	{
		return false;
	}

	// render extrudeObjects depth over the DEM depth texture.
	if (!this.visibleObjectsControler)
	{ return; }

	if (!this.isPrepared())
	{ return; }

	if (!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	if (!this.original_dem_texture)
	{ return false; }

	var visibleNodesCount = this.visibleObjectsControler.currentVisibles0.length;
	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;

	var soundManager = this.soundManager;
	var gl = magoManager.getGl();
	var shader;


	if (visibleNodesCount + visibleNativesOpaquesCount + visibleNativesTransparentsCount === 0)
	{
		return;
	}


	// Render in Y axis direction.*****************************************************************************************************************************
	// Render in Y axis direction.*****************************************************************************************************************************
	// Must render into yAxisDirectionSceneVoxelTexture & then overwrite into voxelTexture.***
	// we render fluxRFUMosaicTexture3d_HIGH_B.size_y times.***
	var scene_xSize = this.simulationTextureSize[0];
	var scene_ySize = this.simulationTextureSize[1];
	var scene_zSize = this.texturesNumSlices;
	if (!this.fbo_yAxisDirection) // simulation fbo (512 x 512).
	{
		// The camera direction is scene_local_y_axis, so:
		var bufferWidth = scene_xSize;
		var bufferHeight = scene_zSize;
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo_yAxisDirection = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 8}); 
	}

	// create an auxiliar magoTexture3D.
	if (!this.auxTex3d_yDirection)
	{
		var options = {};
		options.texture3DXSize = scene_xSize;
		options.texture3DYSize = scene_zSize;
		options.texture3DZSize = 8;
		this.auxTex3d_yDirection = new MagoTexture3D(options);
		this.auxTex3d_yDirection.createTextures(gl);
	}
	

	var fbo = this.fbo_yAxisDirection;
	var extbuffers = fbo.extbuffers;

	gl.clearColor(0, 0, 0, 0);
	gl.clearDepth(1);
	
	// we render with 8 textures output. Then, translate the data into sceneVoxelMatrix.***
	var n = 0.0;
	var f = 1.0;
	var iterationsCount = Math.ceil(scene_ySize/8);
	var nearFarRange = 1.0 / (iterationsCount);
	//iterationsCount = 2; // test delete!!!!!!!!!!!
	for (var i=0; i<iterationsCount; i++)
	{
		fbo = this.fbo_yAxisDirection;
		extbuffers = fbo.extbuffers;
		fbo.bind();
		gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
			extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
			extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
			extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
			extbuffers.COLOR_ATTACHMENT4_WEBGL, // gl_FragData[4]
			extbuffers.COLOR_ATTACHMENT5_WEBGL, // gl_FragData[5]
			extbuffers.COLOR_ATTACHMENT6_WEBGL, // gl_FragData[6]
			extbuffers.COLOR_ATTACHMENT7_WEBGL, // gl_FragData[7]
		]);

		shader = magoManager.postFxShadersManager.getShader("orthogonalVoxelizationRender_MRT"); // (OrthogonalVoxelizationShaderVS_MRT, OrthogonalVoxelizationShaderFS_MRT)
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();

		var mvpMat_yDirection = this.getTileOrthographic_mvpMat_yAxisDirection();
		gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, mvpMat_yDirection._floatArrays);
		gl.uniform1i(shader.u_processType_loc, 2); // 0 = overWriteDEM, 1 = excavation, 2 = overWrite, but limited by "quantizedVolume_MinMax".***

		// calculate near & far of the 8 slices.***
		n = i * nearFarRange;
		f = n + nearFarRange;
		gl.uniform3fv(shader.u_quantizedVolume_MinMax_loc, [0.0, 0.0, n, 1.0, 1.0, f]);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.auxTex3d_yDirection.getTexture(0), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.auxTex3d_yDirection.getTexture(1), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.auxTex3d_yDirection.getTexture(2), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.auxTex3d_yDirection.getTexture(3), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, this.auxTex3d_yDirection.getTexture(4), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, this.auxTex3d_yDirection.getTexture(5), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, this.auxTex3d_yDirection.getTexture(6), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, this.auxTex3d_yDirection.getTexture(7), 0);

		// clear color buffers & depth.***
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.disable(gl.CULL_FACE);
		this._renderVisibleObjects(shader, magoManager);

		// Now, make an unique mosaic 3x3 texture of the 8 textures.***
		this.mosaic_partial_ydirection = this.voxelizer.makeMosaicTexture3DFromRealTexture3D(magoManager, this.auxTex3d_yDirection, this.mosaic_partial_ydirection);
		
		//****************************************************************************************************************************************************************************
		// Now, translate the partially-y-dir voxelized into the sceneVoxelized (codified into alpha channel of this.fluxRFUMosaicTexture3d_HIGH_B).***
		// We need fluxRFUMosaicTexture3d_HIGH_A & fluxRFUMosaicTexture3d_HIGH_B, because one is the current and the another is next.***
		// Use the simulation fbo.***
		fbo = this.simulationMosaicFBO; 
		extbuffers = fbo.extbuffers;
		fbo.bind();
		gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
			extbuffers.NONE, // gl_FragData[1]
			extbuffers.NONE, // gl_FragData[2]
			extbuffers.NONE, // gl_FragData[3]
			extbuffers.NONE, // gl_FragData[4]
			extbuffers.NONE, // gl_FragData[5]
			extbuffers.NONE, // gl_FragData[6]
			extbuffers.NONE, // gl_FragData[7]
		]);

		var shaderName = "voxelizeFromPartialYDirectionTexture3D"; // (waterQuadVertVS, waterVoxelizeFromPartialYDirectionTexture3DFS)
		shader = magoManager.postFxShadersManager.getShader(shaderName); 
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();

		var refTex3D = this.fluxRFUMosaicTexture3d_HIGH_A; // we can take any other texture3D.***

		gl.uniform1iv(shader.u_texSize_loc, [refTex3D.texture3DXSize, refTex3D.texture3DYSize, refTex3D.texture3DZSize]);
		gl.uniform1iv(shader.u_mosaicTexSize_loc, [refTex3D.finalTextureXSize, refTex3D.finalTextureYSize, refTex3D.finalSlicesCount]);
		gl.uniform1iv(shader.u_mosaicSize_loc, [refTex3D.mosaicXCount, refTex3D.mosaicYCount, refTex3D.finalSlicesCount]);
		gl.uniform1iv(shader.u_yDirMosaicSize_loc, [this.mosaic_partial_ydirection.mosaicXCount, this.mosaic_partial_ydirection.mosaicYCount, this.mosaic_partial_ydirection.finalSlicesCount]);
		gl.uniform1iv(shader.u_yDirTextureSize_loc, [this.mosaic_partial_ydirection.texture3DXSize, this.mosaic_partial_ydirection.texture3DYSize, this.mosaic_partial_ydirection.texture3DZSize]);

		var valAux = i*8;
		var lowestYDirMosaicSliceIndex = new Int32Array([valAux]);
		gl.uniform1i(shader.u_lowestYDirMosaicSliceIndex_loc,  lowestYDirMosaicSliceIndex[0]);//

		var screenQuad = soundManager.getQuadBuffer();

		// bind screenQuad positions.
		FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);
		gl.disable(gl.DEPTH_TEST);

		var fluxRFUMosaicTexture3d_HIGH_slicesCount = this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray.length;
		for (var j=0; j<fluxRFUMosaicTexture3d_HIGH_slicesCount; j++)
		{
			gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_A.getTexture( j ), 0);
			gl.uniform1i(shader.u_lowestMosaicSliceIndex_loc,  j);//

			// Now, bind textures.***
			gl.activeTexture(gl.TEXTURE0); 
			gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_B.getTexture( j ));

			gl.activeTexture(gl.TEXTURE1); 
			gl.bindTexture(gl.TEXTURE_2D, this.mosaic_partial_ydirection.getTexture( 0 )); // there are only one.***

			// Draw screenQuad:
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, null); 
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, null); 

		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0);
		fbo.unbind();

		gl.enable(gl.DEPTH_TEST);

		SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_HIGH_A, this.fluxRFUMosaicTexture3d_HIGH_B);
	}

	fbo.unbind();

	// now, swap waterHeightTextures:
	//SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_HIGH_A, this.fluxRFUMosaicTexture3d_HIGH_B);
	//SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_LOW_A, this.fluxRFUMosaicTexture3d_LOW_B);
	//SoundLayer._swapTextures3D(this.fluxLBDMosaicTexture3d_HIGH_A, this.fluxLBDMosaicTexture3d_HIGH_B);
	//SoundLayer._swapTextures3D(this.fluxLBDMosaicTexture3d_LOW_A, this.fluxLBDMosaicTexture3d_LOW_B);

	// finally must delete this.mosaic_partial_ydirection to save memory.***
	// TODO :
	
	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.CULL_FACE);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null); 
	gl.frontFace(gl.CCW);
};

SoundLayer.prototype._voxelizeInZDirection = function (magoManager)
{
	//if (this.overWriteDEMWithObjectsFinished)
	//{
	//	return true;
	//}

	if (!this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray || this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray.length === 0)
	{
		return false;
	}

	// render extrudeObjects depth over the DEM depth texture.
	if (!this.visibleObjectsControler)
	{ return; }

	if (!this.isPrepared())
	{ return; }

	if (!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	if (!this.original_dem_texture)
	{ return false; }

	var visibleNodesCount = this.visibleObjectsControler.currentVisibles0.length;
	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;

	var soundManager = this.soundManager;
	var gl = magoManager.getGl();
	var shader;


	if (visibleNodesCount + visibleNativesOpaquesCount + visibleNativesTransparentsCount === 0)
	{
		return;
	}


	// Render in Y axis direction.*****************************************************************************************************************************
	// Render in Y axis direction.*****************************************************************************************************************************
	// Must render into yAxisDirectionSceneVoxelTexture & then overwrite into voxelTexture.***
	// we render fluxRFUMosaicTexture3d_HIGH_B.size_y times.***
	var scene_xSize = this.simulationTextureSize[0];
	var scene_ySize = this.simulationTextureSize[1];
	var scene_zSize = this.texturesNumSlices;
	if (!this.fbo_zAxisDirection) // simulation fbo (512 x 512).
	{
		// The camera direction is scene_local_z_axis, so:
		var bufferWidth = scene_xSize;
		var bufferHeight = scene_ySize;
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo_zAxisDirection = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 8}); 
	}

	// create an auxiliar magoTexture3D.
	if (!this.auxTex3d_zDirection)
	{
		var options = {};
		options.texture3DXSize = scene_xSize;
		options.texture3DYSize = scene_ySize;
		options.texture3DZSize = 8;
		this.auxTex3d_zDirection = new MagoTexture3D(options);
		this.auxTex3d_zDirection.createTextures(gl);
	}
	

	var fbo = this.fbo_zAxisDirection;
	var extbuffers = fbo.extbuffers;

	gl.clearColor(0, 0, 0, 0);
	gl.clearDepth(1);
	
	// we render with 8 textures output. Then, translate the data into sceneVoxelMatrix.***
	var n = 0.0;
	var f = 1.0;
	var iterationsCount = Math.ceil(scene_zSize/8);
	var nearFarRange = 1.0 / iterationsCount;
	for (var i=0; i<iterationsCount; i++)
	{
		fbo = this.fbo_zAxisDirection;
		extbuffers = fbo.extbuffers;
		fbo.bind();
		gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
			extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
			extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
			extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
			extbuffers.COLOR_ATTACHMENT4_WEBGL, // gl_FragData[4]
			extbuffers.COLOR_ATTACHMENT5_WEBGL, // gl_FragData[5]
			extbuffers.COLOR_ATTACHMENT6_WEBGL, // gl_FragData[6]
			extbuffers.COLOR_ATTACHMENT7_WEBGL, // gl_FragData[7]
		]);

		shader = magoManager.postFxShadersManager.getShader("orthogonalVoxelizationRender_MRT"); // (OrthogonalVoxelizationShaderVS_MRT, OrthogonalVoxelizationShaderFS_MRT)
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();

		var mvpMat_zDirection = this.getTileOrthographic_mvpMat_zAxisDirection();
		gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, mvpMat_zDirection._floatArrays);
		gl.uniform1i(shader.u_processType_loc, 2); // 0 = overWriteDEM, 1 = excavation, 2 = overWrite, but limited by "quantizedVolume_MinMax".***

		// calculate near & far of the 8 slices.***
		n = i * nearFarRange;
		f = n + nearFarRange;
		gl.uniform3fv(shader.u_quantizedVolume_MinMax_loc, [0.0, 0.0, n, 1.0, 1.0, f]);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.auxTex3d_zDirection.getTexture(0), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.auxTex3d_zDirection.getTexture(1), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.auxTex3d_zDirection.getTexture(2), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.auxTex3d_zDirection.getTexture(3), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, this.auxTex3d_zDirection.getTexture(4), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, this.auxTex3d_zDirection.getTexture(5), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, this.auxTex3d_zDirection.getTexture(6), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, this.auxTex3d_zDirection.getTexture(7), 0);

		// clear color buffers & depth.***
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.disable(gl.CULL_FACE);
		this._renderVisibleObjects(shader, magoManager);

		// Now, make an unique mosaic 3x3 texture of the 8 textures.***
		this.mosaic_partial_zdirection = this.voxelizer.makeMosaicTexture3DFromRealTexture3D(magoManager, this.auxTex3d_zDirection, this.mosaic_partial_zdirection);
		
		//****************************************************************************************************************************************************************************
		// Now, translate the partially-y-dir voxelized into the sceneVoxelized (codified into alpha channel of this.fluxRFUMosaicTexture3d_HIGH_B).***
		// We need fluxRFUMosaicTexture3d_HIGH_A & fluxRFUMosaicTexture3d_HIGH_B, because one is the current and the another is next.***
		// Use the simulation fbo.***
		fbo = this.simulationMosaicFBO; 
		extbuffers = fbo.extbuffers;
		fbo.bind();
		gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
			extbuffers.NONE, // gl_FragData[1]
			extbuffers.NONE, // gl_FragData[2]
			extbuffers.NONE, // gl_FragData[3]
			extbuffers.NONE, // gl_FragData[4]
			extbuffers.NONE, // gl_FragData[5]
			extbuffers.NONE, // gl_FragData[6]
			extbuffers.NONE, // gl_FragData[7]
		]);

		var shaderName = "voxelizeFromPartialZDirectionTexture3D"; // (waterQuadVertVS, waterVoxelizeFromPartialXDirectionTexture3DFS)
		shader = magoManager.postFxShadersManager.getShader(shaderName); 
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();

		var refTex3D = this.fluxRFUMosaicTexture3d_HIGH_A; // we can take any other texture3D.***

		gl.uniform1iv(shader.u_texSize_loc, [refTex3D.texture3DXSize, refTex3D.texture3DYSize, refTex3D.texture3DZSize]);
		gl.uniform1iv(shader.u_mosaicTexSize_loc, [refTex3D.finalTextureXSize, refTex3D.finalTextureYSize, refTex3D.finalSlicesCount]);
		gl.uniform1iv(shader.u_mosaicSize_loc, [refTex3D.mosaicXCount, refTex3D.mosaicYCount, refTex3D.finalSlicesCount]);
		gl.uniform1iv(shader.u_zDirMosaicSize_loc, [this.mosaic_partial_zdirection.mosaicXCount, this.mosaic_partial_zdirection.mosaicYCount, this.mosaic_partial_zdirection.finalSlicesCount]);
		gl.uniform1iv(shader.u_zDirTextureSize_loc, [this.mosaic_partial_zdirection.texture3DXSize, this.mosaic_partial_zdirection.texture3DYSize, this.mosaic_partial_zdirection.texture3DZSize]);

		var valAux = i*8;
		var lowestZDirMosaicSliceIndex = new Int32Array([valAux]);
		gl.uniform1i(shader.u_lowestZDirMosaicSliceIndex_loc,  lowestZDirMosaicSliceIndex[0]);//

		var screenQuad = soundManager.getQuadBuffer();

		// bind screenQuad positions.
		FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);
		gl.disable(gl.DEPTH_TEST);

		var fluxRFUMosaicTexture3d_HIGH_slicesCount = this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray.length;
		for (var j=0; j<fluxRFUMosaicTexture3d_HIGH_slicesCount; j++)
		{
			gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_A.getTexture( j ), 0);
			gl.uniform1i(shader.u_lowestMosaicSliceIndex_loc,  j);//

			// Now, bind textures.***
			gl.activeTexture(gl.TEXTURE0); 
			gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_B.getTexture( j ));

			gl.activeTexture(gl.TEXTURE1); 
			gl.bindTexture(gl.TEXTURE_2D, this.mosaic_partial_zdirection.getTexture( 0 )); // there are only one.***

			// Draw screenQuad:
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, null); 
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, null); 

		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0);
		fbo.unbind();

		gl.enable(gl.DEPTH_TEST);

		SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_HIGH_A, this.fluxRFUMosaicTexture3d_HIGH_B);
	}

	fbo.unbind();

	// now, swap waterHeightTextures:
	//SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_HIGH_A, this.fluxRFUMosaicTexture3d_HIGH_B);
	//SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_LOW_A, this.fluxRFUMosaicTexture3d_LOW_B);
	//SoundLayer._swapTextures3D(this.fluxLBDMosaicTexture3d_HIGH_A, this.fluxLBDMosaicTexture3d_HIGH_B);
	//SoundLayer._swapTextures3D(this.fluxLBDMosaicTexture3d_LOW_A, this.fluxLBDMosaicTexture3d_LOW_B);

	// finally must delete this.mosaic_partial_ydirection to save memory.***
	// TODO :
	
	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.CULL_FACE);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null); 
	gl.frontFace(gl.CCW);
};

SoundLayer.prototype._voxelizeInXDirection = function (magoManager)
{
	//if (this.overWriteDEMWithObjectsFinished)
	//{
	//	return true;
	//}

	if (!this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray || this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray.length === 0)
	{
		return false;
	}

	// render extrudeObjects depth over the DEM depth texture.
	if (!this.visibleObjectsControler)
	{ return; }

	if (!this.isPrepared())
	{ return; }

	if (!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	if (!this.original_dem_texture)
	{ return false; }

	var visibleNodesCount = this.visibleObjectsControler.currentVisibles0.length;
	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;

	var soundManager = this.soundManager;
	var gl = magoManager.getGl();
	var shader;


	if (visibleNodesCount + visibleNativesOpaquesCount + visibleNativesTransparentsCount === 0)
	{
		return;
	}


	// Render in Y axis direction.*****************************************************************************************************************************
	// Render in Y axis direction.*****************************************************************************************************************************
	// Must render into yAxisDirectionSceneVoxelTexture & then overwrite into voxelTexture.***
	// we render fluxRFUMosaicTexture3d_HIGH_B.size_y times.***
	var scene_xSize = this.simulationTextureSize[0];
	var scene_ySize = this.simulationTextureSize[1];
	var scene_zSize = this.texturesNumSlices;
	if (!this.fbo_xAxisDirection) // simulation fbo (512 x 512).
	{
		// The camera direction is scene_local_x_axis, so:
		var bufferWidth = scene_ySize;
		var bufferHeight = scene_zSize;
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo_xAxisDirection = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 8}); 
	}

	// create an auxiliar magoTexture3D.
	if (!this.auxTex3d_xDirection)
	{
		var options = {};
		options.texture3DXSize = scene_ySize;
		options.texture3DYSize = scene_zSize;
		options.texture3DZSize = 8;
		this.auxTex3d_xDirection = new MagoTexture3D(options);
		this.auxTex3d_xDirection.createTextures(gl);
	}
	

	var fbo = this.fbo_xAxisDirection;
	var extbuffers = fbo.extbuffers;

	gl.clearColor(0, 0, 0, 0);
	gl.clearDepth(1);
	
	// we render with 8 textures output. Then, translate the data into sceneVoxelMatrix.***
	var n = 0.0;
	var f = 1.0;
	var iterationsCount = Math.ceil(scene_xSize/8);
	var nearFarRange = 1.0 / iterationsCount;
	for (var i=0; i<iterationsCount; i++)
	{
		fbo = this.fbo_xAxisDirection;
		extbuffers = fbo.extbuffers;
		fbo.bind();
		gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
			extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
			extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
			extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
			extbuffers.COLOR_ATTACHMENT4_WEBGL, // gl_FragData[4]
			extbuffers.COLOR_ATTACHMENT5_WEBGL, // gl_FragData[5]
			extbuffers.COLOR_ATTACHMENT6_WEBGL, // gl_FragData[6]
			extbuffers.COLOR_ATTACHMENT7_WEBGL, // gl_FragData[7]
		]);

		shader = magoManager.postFxShadersManager.getShader("orthogonalVoxelizationRender_MRT"); // (OrthogonalVoxelizationShaderVS_MRT, OrthogonalVoxelizationShaderFS_MRT)
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();

		var mvpMat_xDirection = this.getTileOrthographic_mvpMat_xAxisDirection();
		gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, mvpMat_xDirection._floatArrays);
		gl.uniform1i(shader.u_processType_loc, 2); // 0 = overWriteDEM, 1 = excavation, 2 = overWrite, but limited by "quantizedVolume_MinMax".***

		// calculate near & far of the 8 slices.***
		n = i * nearFarRange;
		f = n + nearFarRange;
		gl.uniform3fv(shader.u_quantizedVolume_MinMax_loc, [0.0, 0.0, n, 1.0, 1.0, f]);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.auxTex3d_xDirection.getTexture(0), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.auxTex3d_xDirection.getTexture(1), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.auxTex3d_xDirection.getTexture(2), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.auxTex3d_xDirection.getTexture(3), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, this.auxTex3d_xDirection.getTexture(4), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, this.auxTex3d_xDirection.getTexture(5), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, this.auxTex3d_xDirection.getTexture(6), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, this.auxTex3d_xDirection.getTexture(7), 0);

		// clear color buffers & depth.***
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.disable(gl.CULL_FACE);
		this._renderVisibleObjects(shader, magoManager);

		// Now, make an unique mosaic 3x3 texture of the 8 textures.***
		this.mosaic_partial_xdirection = this.voxelizer.makeMosaicTexture3DFromRealTexture3D(magoManager, this.auxTex3d_xDirection, this.mosaic_partial_xdirection);
		
		//****************************************************************************************************************************************************************************
		// Now, translate the partially-y-dir voxelized into the sceneVoxelized (codified into alpha channel of this.fluxRFUMosaicTexture3d_HIGH_B).***
		// We need fluxRFUMosaicTexture3d_HIGH_A & fluxRFUMosaicTexture3d_HIGH_B, because one is the current and the another is next.***
		// Use the simulation fbo.***
		fbo = this.simulationMosaicFBO; 
		extbuffers = fbo.extbuffers;
		fbo.bind();
		gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
			extbuffers.NONE, // gl_FragData[1]
			extbuffers.NONE, // gl_FragData[2]
			extbuffers.NONE, // gl_FragData[3]
			extbuffers.NONE, // gl_FragData[4]
			extbuffers.NONE, // gl_FragData[5]
			extbuffers.NONE, // gl_FragData[6]
			extbuffers.NONE, // gl_FragData[7]
		]);

		var shaderName = "voxelizeFromPartialXDirectionTexture3D"; // (waterQuadVertVS, waterVoxelizeFromPartialXDirectionTexture3DFS)
		shader = magoManager.postFxShadersManager.getShader(shaderName); 
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();

		var refTex3D = this.fluxRFUMosaicTexture3d_HIGH_A; // we can take any other texture3D.***

		gl.uniform1iv(shader.u_texSize_loc, [refTex3D.texture3DXSize, refTex3D.texture3DYSize, refTex3D.texture3DZSize]);
		gl.uniform1iv(shader.u_mosaicTexSize_loc, [refTex3D.finalTextureXSize, refTex3D.finalTextureYSize, refTex3D.finalSlicesCount]);
		gl.uniform1iv(shader.u_mosaicSize_loc, [refTex3D.mosaicXCount, refTex3D.mosaicYCount, refTex3D.finalSlicesCount]);
		gl.uniform1iv(shader.u_xDirMosaicSize_loc, [this.mosaic_partial_xdirection.mosaicXCount, this.mosaic_partial_xdirection.mosaicYCount, this.mosaic_partial_xdirection.finalSlicesCount]);
		gl.uniform1iv(shader.u_xDirTextureSize_loc, [this.mosaic_partial_xdirection.texture3DXSize, this.mosaic_partial_xdirection.texture3DYSize, this.mosaic_partial_xdirection.texture3DZSize]);

		var valAux = i*8;
		var lowestXDirMosaicSliceIndex = new Int32Array([valAux]);
		gl.uniform1i(shader.u_lowestXDirMosaicSliceIndex_loc,  lowestXDirMosaicSliceIndex[0]);//

		var screenQuad = soundManager.getQuadBuffer();

		// bind screenQuad positions.
		FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);
		gl.disable(gl.DEPTH_TEST);

		var fluxRFUMosaicTexture3d_HIGH_slicesCount = this.fluxRFUMosaicTexture3d_HIGH_B.texturesArray.length;
		for (var j=0; j<fluxRFUMosaicTexture3d_HIGH_slicesCount; j++)
		{
			gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_A.getTexture( j ), 0);
			gl.uniform1i(shader.u_lowestMosaicSliceIndex_loc,  j);//

			// Now, bind textures.***
			gl.activeTexture(gl.TEXTURE0); 
			gl.bindTexture(gl.TEXTURE_2D, this.fluxRFUMosaicTexture3d_HIGH_B.getTexture( j ));

			gl.activeTexture(gl.TEXTURE1); 
			gl.bindTexture(gl.TEXTURE_2D, this.mosaic_partial_xdirection.getTexture( 0 )); // there are only one.***

			// Draw screenQuad:
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, null); 
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, null); 

		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0);
		fbo.unbind();

		gl.enable(gl.DEPTH_TEST);

		SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_HIGH_A, this.fluxRFUMosaicTexture3d_HIGH_B);
	}

	fbo.unbind();

	// now, swap waterHeightTextures:
	//SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_HIGH_A, this.fluxRFUMosaicTexture3d_HIGH_B);
	//SoundLayer._swapTextures3D(this.fluxRFUMosaicTexture3d_LOW_A, this.fluxRFUMosaicTexture3d_LOW_B);
	//SoundLayer._swapTextures3D(this.fluxLBDMosaicTexture3d_HIGH_A, this.fluxLBDMosaicTexture3d_HIGH_B);
	//SoundLayer._swapTextures3D(this.fluxLBDMosaicTexture3d_LOW_A, this.fluxLBDMosaicTexture3d_LOW_B);

	// finally must delete this.mosaic_partial_ydirection to save memory.***
	// TODO :
	
	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.CULL_FACE);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null); 
	gl.frontFace(gl.CCW);
};



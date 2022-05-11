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
	this.sceneVoxelizedTexture3d; // MagoTexture3D.***

	this._bIsPrepared = false;

	// simulation parameters.******************************************
	this.terrainMinMaxHeights = new Float32Array([180.0, 540.0]);
	this.simulationTextureSize = new Float32Array([soundManager.maxSimulationSize, soundManager.maxSimulationSize]);
	this.texturesNumSlices = 1; // by default.***
	this.terrainTextureSize = new Float32Array([soundManager.maxSimulationSize, soundManager.maxSimulationSize]);

	// The buildings & objects intersected by this waterTile.
	this.visibleObjectsControler;

	// Textures.******************************************************
	this.demWithBuildingsTex;

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
				// use latRange to determine the closes tile depth.
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
				if (!tile.qMesh)
				{
					if (!tile.qMeshPromise)
					{
						var X = tile.X;
						var Y = tile.Y;
						var L = tile.L;
						this._loadQuantizedMesh(L, X, Y, tile);
					}

					allQuantizedMeshesLoaded = false;
				}
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
	tile.qMeshPromise = this.soundManager.terrainProvider.requestTileGeometry(X, Y, L);
	tile.qMeshPromise.then((value) =>
	{
		tile.qMesh = value;
		tile.geoExtent = SmartTile.getGeographicExtentOfTileLXY(L, X, Y, undefined, CODE.imageryType.CRS84);
	});
};

SoundLayer.prototype._makeDepthTexture = function (magoManager)
{

};

SoundLayer.prototype._voxelizeSceneByDepthTexture = function ()
{
	// 1rst, render the scene orthographically to obtain the depth texture.***

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

	// now, make the voxelization of the scene(geoExtent).************************************************************************************
	if (!this.sceneVoxelizedTexture3d)
	{
		if (!this.voxelizer)
		{
			var options = {};
			options.voxelXSize = this.simulationTextureSize[0];
			options.voxelYSize = this.simulationTextureSize[1];
			options.voxelZSize = this.texturesNumSlices;
			this.voxelizer = new Voxelizer(options);
		}

		this.sceneVoxelizedTexture3d = this.voxelizer.voxelizeByDepthTexture(magoManager, this.demWithBuildingsTex, this.simulationTextureSize[0], this.simulationTextureSize[1], this.texturesNumSlices, undefined);
	}

	if (!this.sceneVoxelizedTexture3d)
	{
		return false;
	}

	// Now, make the sound source texture3d.***************************************************************************************************
	if (!this.soundSourceRealTexture3d)
	{
		// Create a real magoTexture3D, not a mosaic, to render the sources in it.***
		this.soundSourceRealTexture3d = new MagoTexture3D();
		this.soundSourceRealTexture3d.texture3DXSize = this.sceneVoxelizedTexture3d.texture3DXSize;
		this.soundSourceRealTexture3d.texture3DYSize = this.sceneVoxelizedTexture3d.texture3DYSize;
		this.soundSourceRealTexture3d.texture3DZSize = this.sceneVoxelizedTexture3d.texture3DZSize;

		// The 3D texture into a mosaic texture matrix params.***
		this.soundSourceRealTexture3d.mosaicXCount = 1; 
		this.soundSourceRealTexture3d.mosaicYCount = 1; 
		this.soundSourceRealTexture3d.createTextures(gl);

		// Now, render a point or a curve into the soundSourceTex3d.***
		// render a point (127.23761, 36.51072, 50.0).***
		if (!this._testGeoCoord)
		{
			this._testGeoCoord = new GeographicCoord(127.23761, 36.51072, 50.0);
			this._testGeoCoord.makeDefaultGeoLocationData();
		}

		var modelViewProjMatrix = this.getTileOrthographic_mvpMat();
		this.voxelizer.renderToMagoTexture3D(magoManager, this.soundSourceRealTexture3d, this.geographicExtent, modelViewProjMatrix, [this._testGeoCoord]);

		// Now, with the "soundSourceRealTexture3d" make the soundSourceMosaicTexture.***
	}

	if (!this.soundSourceRealTexture3d)
	{
		return false;
	}

	if (!this.soundSourceMosaicTexture3d)
	{
		// make the mosaic texture 3d from the "this.soundSourceRealTexture3d".***
		this.soundSourceMosaicTexture3d = this.voxelizer.makeMosaicTexture3DFromRealTexture3D(magoManager, this.soundSourceRealTexture3d, undefined);
	}


	
	var hola = 0;
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
				this._makeQuantizedMeshVbo(tile);
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

	shader = magoManager.postFxShadersManager.getShader("depthTexFromQuantizedMesh");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	//gl.uniform2fv(shader.u_minMaxHeights_loc, [this.qMesh._minimumHeight, this.qMesh._maximumHeight]);
	gl.uniform1i(shader.colorType_loc_loc, 0);
	gl.uniform1i(shader.u_terrainHeightEncodingBytes_loc, soundManager.terrainHeightEncodingBytes);

	//gl.disable(gl.CULL_FACE);
	gl.clear(gl.DEPTH_BUFFER_BIT);

	// Now, set the waterSimGeoExtent & the qMeshGeoExtent.
	var geoExtent = this.geographicExtent;
	gl.uniform3fv(shader.u_totalMinGeoCoord_loc, [geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]);
	gl.uniform3fv(shader.u_totalMaxGeoCoord_loc, [geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]);

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
		gl.uniform3fv(shader.u_currentMinGeoCoord_loc, [tileGeoExtent.minGeographicCoord.longitude, tileGeoExtent.minGeographicCoord.latitude, tile.qMesh._minimumHeight]);
		gl.uniform3fv(shader.u_currentMaxGeoCoord_loc, [tileGeoExtent.maxGeographicCoord.longitude, tileGeoExtent.maxGeographicCoord.latitude, tile.qMesh._maximumHeight]);

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

	shader = magoManager.postFxShadersManager.getShader("waterCopyTexture");
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

SoundLayer.prototype.makeVoxelizedTextures3dFromDepthTexture = function (magoManager)
{
	if (!this.overWriteDEMWithObjectsFinished)
	{
		return false;
	}

	// must calculate the textures slices count.***

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

	// Check if all f4d renderables are prepared to render.***
	/*
	var f4dArePrepared = false;
	for (var i=0; i<visibleNodesCount; i++)
	{
		var node = this.visibleObjectsControler.currentVisibles0[i];
		var neoBuilding = node.data.neoBuilding;

	}
	*/

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

	gl.uniform1i(shader.u_processType_loc, 0); // 0 = overWriteDEM, 1 = excavation.
	
	gl.disable(gl.CULL_FACE);
	gl.clear(gl.DEPTH_BUFFER_BIT);

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
			this.overWriteDEMWithObjectsFinished = false;
		}
		this.buildingsId_OverWritedOnDemMap[node._guid] = node;
	}

	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	for (var i=0; i<visibleNativesOpaquesCount; i++)
	{
		var native = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray[i];
		if (native.name !== "contaminationGenerator" && native.name !== "excavationObject" && native.name !== "waterGenerator")
		{ 
			native.render(magoManager, shader, renderType, glPrimitive); 
			this.buildingsId_OverWritedOnDemMap[native._guid] = native;
		}
	}

	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;
	for (var i=0; i<visibleNativesTransparentsCount; i++)
	{
		var native = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray[i];
		if (native.name !== "contaminationGenerator" && native.name !== "excavationObject" && native.name !== "waterGenerator")
		{ 
			native.render(magoManager, shader, renderType, glPrimitive); 
			this.buildingsId_OverWritedOnDemMap[native._guid] = native;
		}
	}

	//this.overWriteDEMWithObjectsFinished = true;
	
	gl.enable(gl.CULL_FACE);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null); 
	gl.frontFace(gl.CCW);
};



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
	this.textureWidth = new Int32Array([soundManager.simulationTextureWidth]);
	this.textureHeight = new Int32Array([soundManager.simulationTextureHeight]);

	// simulation textures.
	this.terrainHeightTexA; // terrain DEM texture.
	this.terrainHeightTexB; // terrain DEM texture.

	this.soundHeightTexA; // water height over terrain.
	this.soundHeightTexB; // water height over terrain.

	// water source & rain.
	this.soundSourceTex;

	this.soundFluxTexA; // water fluxing in 4 directions.
	this.soundFluxTexB; // water fluxing in 4 directions.

	this.soundVelocityTexA;
	this.soundVelocityTexB;

	this.terrainMinMaxHeights = new Float32Array([10.0, 200.0]);

	this._bIsPrepared = false;

	// The water renderable surface.
	this.surface; // tile size surface, with 512 x 512 points (as DEM texture size).

	// quantized mesh.
	this.qMesh;

	// The buildings & objects intersected by this waterTile.
	this.visibleObjectsControler;

	if (options)
	{
		if (options.geographicExtent)
		{
			this.geographicExtent = options.geographicExtent;
		}
	}
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

SoundLayer.prototype.init = function ()
{
	this._makeSurface();
	this._makeTextures();

	this._bIsPrepared = true;
};

SoundLayer.prototype.prepareTextures = function ()
{
	// Original DEM texture.**************************************************************************************************
	if (!this.original_dem_texture)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();

		// load test texture dem.
		this.original_dem_texture = new Texture();
		this.original_dem_texture.texId = gl.createTexture();
		return false;
	}
	else if (this.original_dem_texture.fileLoadState === CODE.fileLoadState.READY)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();
		var dem_texturePath = '/images/en/demSampleTest.png';

		ReaderWriter.loadImage(gl, dem_texturePath, this.original_dem_texture);
		return false;
	}
	else if (this.original_dem_texture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return false;
	}

	return true;

};

SoundLayer.prototype._makeTextures = function ()
{
	var magoManager = this.soundManager.magoManager;
	var gl = magoManager.getGl();

	// water simulation texture size: it depends of waterManager.
	var texWidth = this.textureWidth[0];
	var texHeight = this.textureHeight[0];

	this.demTex = this.soundManager._newTexture(gl, texWidth, texHeight);
	
};

SoundLayer.prototype.makeQuantizedMeshVbo = function (qMesh)
{
	if (this.qMeshVboKeyContainer)
	{
		return true;
	}

	var minHeight = qMesh._minimumHeight;
	var maxHeight = qMesh._maximumHeight;
	var uValues = qMesh._uValues;
	var vValues = qMesh._vValues;
	var hValues = qMesh._heightValues;
	this.indices = qMesh._indices;

	// Now, make vbo.***
	var pointsCount = uValues.length;
	this.cartesiansArray = new Uint16Array(pointsCount * 3);
	
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

	if (this.qMeshVboKeyContainer === undefined)
	{ this.qMeshVboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKey = this.qMeshVboKeyContainer.newVBOVertexIdxCacheKey();
	
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

SoundLayer.prototype.makeDEMTextureByQuantizedMesh = function (qMesh)
{
	if (!this.isPrepared())
	{ return; }

	if (!this.qMeshVboKeyContainer)
	{
		this.makeQuantizedMeshVbo(qMesh);
	}
	
	var soundManager = this.soundManager;
	var magoManager = soundManager.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.getGl();
	var fbo = soundManager.fbo; // simulation fbo. (512 x 512).
	var extbuffers = fbo.extbuffers;
	var shader;


	gl.disable(gl.BLEND);
	gl.clearColor(1.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0);
	

	// 2n, make building depth over terrain depth.******************************************************************************************************
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.demTex.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
	]);

	shader = magoManager.postFxShadersManager.getShader("depthTexFromQuantizedMesh");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	gl.uniform2fv(shader.u_minMaxHeights_loc, [this.qMesh._minimumHeight, this.qMesh._maximumHeight]);

	//gl.disable(gl.CULL_FACE);
	gl.clear(gl.DEPTH_BUFFER_BIT);

	var vbo_vicky = this.qMeshVboKeyContainer.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;

	// Bind positions.
	vbo_vicky.vboBufferPos.bindData(shader, shader.a_pos, vboMemManager);
	
	//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
	//{ return false; }

	//if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
	//{ return false; }

	var indicesCount = vbo_vicky.indicesCount;
	if (!vbo_vicky.bindDataIndice(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.

	fbo.unbind();
};

SoundLayer.prototype.doSimulationSteps = function (magoManager)
{
	if (!this.isPrepared())
	{
		return false;
	}

	// Check if made demTexture by quantizedMesh.***
	if (!this.bDemTexFromQuantizedMesh && this.qMesh)
	{
		// make dem texture by quantized mesh.
		this.makeDEMTextureByQuantizedMesh(this.qMesh);
		this.bDemTexFromQuantizedMesh = true;

	}

	// Do another test:
	if (!this.quantizedSurfaceTest)
	{
		// 1rst, calculate the geoExtent of the tile:
		var imageryType = CODE.imageryType.CRS84;
		var geoExtent = SmartTile.getGeographicExtentOfTileLXY(this.qMesh.L, this.qMesh.X, this.qMesh.Y, undefined, imageryType);

		this.quantizedSurface = new QuantizedSurface(this.qMesh);
		// The testing tile extent:
		// {longitude: 127.24364884800002, latitude: 36.49658264, altitude: 155.60084533691406}
		// {longitude: 127.23266252000002, latitude: 36.485596312, altitude: 0}
		var excavationGeoCoords = [new GeographicCoord(127.238, 36.492, 0.0), 
			new GeographicCoord(127.238, 36.489, 0.0), 
			new GeographicCoord(127.240, 36.489, 0.0), 
			new GeographicCoord(127.240, 36.490, 0.0), 
			new GeographicCoord(127.239, 36.490, 0.0), 
			new GeographicCoord(127.239, 36.492, 0.0)];

		var excavationDepth = 20.0;
		this.quantizedSurface.excavation(excavationGeoCoords, excavationDepth);
		this.quantizedSurfaceTest = true;
	}
	

};

SoundLayer.prototype._makeSurface = function ()
{
	// CRS84.***
	var lonSegments = this.soundManager.simulationTextureWidth;
	var latSegments = this.soundManager.simulationTextureHeight;

	var altitude = 0;

	// This function makes an ellipsoidal mesh for tiles that has no elevation data.
	//********************************************************************************
	// Note: In waterTiles, make trianglesArray, no use drawElemets, use drawArray.
	//--------------------------------------------------------------------------------
	var degToRadFactor = Math.PI/180.0;
	var minLon = this.geographicExtent.minGeographicCoord.longitude * degToRadFactor;
	var minLat = this.geographicExtent.minGeographicCoord.latitude * degToRadFactor;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude * degToRadFactor;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	var depth = this.depth;
	
	var lonIncreDeg = lonRange/lonSegments;
	var latIncreDeg = latRange/latSegments;
	
	// calculate total verticesCount.
	var vertexCount = (lonSegments + 1)*(latSegments + 1);

	var lonArray = new Array(vertexCount);
	var latArray = new Array(vertexCount);
	var altArray = new Array(vertexCount);

	this.texCoordsArray = new Float32Array(vertexCount*2);
	
	var currLon = minLon; // init startLon.
	var currLat = minLat; // init startLat.
	var idx = 0;
	var s, t;

	
	// check if exist altitude.
	var alt = 0;
	if (altitude)
	{ alt = altitude; }
	
	for (var currLatSeg = 0; currLatSeg<latSegments+1; currLatSeg++)
	{
		currLat = minLat + latIncreDeg * currLatSeg;
		if (currLat > maxLat)
		{ currLat = maxLat; }
		
		
		for (var currLonSeg = 0; currLonSeg<lonSegments+1; currLonSeg++)
		{
			currLon = minLon + lonIncreDeg * currLonSeg;
			
			if (currLon > maxLon)
			{ currLon = maxLon; }
			
			lonArray[idx] = currLon;
			latArray[idx] = currLat;
			// Now set the altitude.
			altArray[idx] = alt;


			// make texcoords CRS84.***
			s = (currLon - minLon)/lonRange;
			t = (currLat - minLat)/latRange;
			
			this.texCoordsArray[idx*2] = s;
			this.texCoordsArray[idx*2+1] = t;
			
			// actualize current values.
			idx++;
		}
	}

	if (!this.cartesiansArray)
	{
		var coordsCount = lonArray.length;
		this.cartesiansArray = new Array(coordsCount);
	}
	
	this.cartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, this.cartesiansArray);
	
	// Make normals using the cartesians.***
	this.normalsArray = new Int8Array(vertexCount*3);
	var point = new Point3D();
	for (var i=0; i<vertexCount; i++)
	{
		point.set(this.cartesiansArray[i*3], this.cartesiansArray[i*3+1], this.cartesiansArray[i*3+2]);
		point.unitary();
		
		this.normalsArray[i*3] = point.x*126;
		this.normalsArray[i*3+1] = point.y*126;
		this.normalsArray[i*3+2] = point.z*126;
	}
	
	// finally make indicesArray.
	var numCols = lonSegments + 1;
	var numRows = latSegments + 1;
	var options = {
		bCalculateBorderIndices : true,
		indicesByteSize         : 4 // In this case (waterTiles) must calculate indices in Uint32, because here vertexCount is greater than max_shortSize..
	};
	var resultObject = GeometryUtils.getIndicesTrianglesRegularNet(numCols, numRows, undefined, undefined, undefined, undefined, undefined, options);
	this.indices = resultObject.indicesArray;
	this.southIndices = resultObject.southIndicesArray;
	this.eastIndices = resultObject.eastIndicesArray;
	this.northIndices = resultObject.northIndicesArray;
	this.westIndices = resultObject.westIndicesArray;
	
	this.westVertexCount = this.westIndices.length;
	this.southVertexCount = this.southIndices.length;
	this.eastVertexCount = this.eastIndices.length;
	this.northVertexCount = this.northIndices.length;

	// Now, calculate the centerPosition of the waterTile.***
	var altitude = 0.0;
	var resultGeographicCoord;
	resultGeographicCoord = this.geographicExtent.getMidPoint(resultGeographicCoord);
	
	var centerLon = resultGeographicCoord.longitude;
	var centerLat = resultGeographicCoord.latitude;
	
	var resultCartesian;
	resultCartesian = Globe.geographicToCartesianWgs84(centerLon, centerLat, altitude, resultCartesian);
	
	// Float64Array.
	this.centerX = new Float64Array([resultCartesian[0]]);
	this.centerY = new Float64Array([resultCartesian[1]]);
	this.centerZ = new Float64Array([resultCartesian[2]]);

	// Now, make the trianglesArray.*****************************************************************************
	var indicesCount = this.indices.length;
	var posBuffer = new Float32Array(indicesCount * 3);
	var texCoordBuffer = new Float32Array(indicesCount * 2);
	var idx;
	for (var i=0; i<indicesCount; i++)
	{
		idx = this.indices[i];
		posBuffer[i*3] = this.cartesiansArray[idx*3] - this.centerX[0];
		posBuffer[i*3+1] = this.cartesiansArray[idx*3+1] - this.centerY[0];
		posBuffer[i*3+2] = this.cartesiansArray[idx*3+2] - this.centerZ[0];

		texCoordBuffer[i*2] = this.texCoordsArray[idx*2];
		texCoordBuffer[i*2+1] = this.texCoordsArray[idx*2+1];
	}

	this.surface = true;
	this.posBuffer = posBuffer;
	this.texCoordBuffer = texCoordBuffer;

	// now, calculate terrainPositionHIGH & terrainPositionLOW.
	if (this.terrainPositionHIGH === undefined)
	{ this.terrainPositionHIGH = new Float32Array(3); }

	if (this.terrainPositionLOW === undefined)
	{ this.terrainPositionLOW = new Float32Array(3); }
	ManagerUtils.calculateSplited3fv([this.centerX[0], this.centerY[0], this.centerZ[0]], this.terrainPositionHIGH, this.terrainPositionLOW);

	// Now, calculate the buildingRotMatrix. This matrix is the tMat at cartesian point. This matrix will be used to
	// calculate the normal from highMaps. So, calculate the tMat at the middle of the tile.
	this.buildingGeoLocMat = new Matrix4(); // Only rotations.
	this.buildingGeoLocMat._floatArrays = Globe.transformMatrixAtCartesianPointWgs84(this.centerX[0], this.centerY[0], this.centerZ[0], this.buildingGeoLocMat._floatArrays);
	this.buildingGeoLocMat._floatArrays[12] = 0.0; // Only rotations.
	this.buildingGeoLocMat._floatArrays[13] = 0.0; // Only rotations.
	this.buildingGeoLocMat._floatArrays[14] = 0.0; // Only rotations.
};

SoundLayer.prototype.overWriteDEMWithObjects = function(shader, magoManager)
{
	// To simulate sound we need terrain + buildings depthTex.

};


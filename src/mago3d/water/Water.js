'use strict';

/**
 * @class Water
 */
var Water = function(waterManager, options) 
{
	if (!(this instanceof Water)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    this.waterManager = waterManager;
	this.geographicExtent;

	// Now, childTilesTargetDepth.
	this._targetDepth; // the depth of tiles used to make the DEM texture from quantizedMeshes.***


	//this.simulationResolution = waterManager.simulationTextureWidth;
	//this.textureWidth = new Int32Array([waterManager.simulationTextureWidth]);
	//this.textureHeight = new Int32Array([waterManager.simulationTextureHeight]);

	//***************************************************************************************************************
	// original_dem_texture -> (excavate)-> dem_texture -> (overWriteBuildings) -> demWithBuildingsTex.**************
	// The "original_dem_texture" can NOT be modified.
	// The "dem_texture" only can be modified by excavations & landSlides.
	// The "demWithBuildingsTex" can be modified by buildings.

	this.original_dem_texture; // this is the original DEM texture. Do NOT modify.
	this.dem_withExcavation;
	this.dem_texture_A;
	this.dem_texture_B;
	this.terrainFluxTexA_HIGH; // terrain fluxing in 4 directions. splitted values in high & low.
	this.terrainFluxTexB_HIGH; // terrain fluxing in 4 directions. splitted values in high & low.
	this.terrainFluxTexA_LOW; // terrain fluxing in 4 directions. splitted values in high & low.
	this.terrainFluxTexB_LOW; // terrain fluxing in 4 directions. splitted values in high & low.
	this.terrainMaxSlippageTex;
	this.demWithBuildingsTex;
	this.terrainMaxFlux = 10000.0; // 
	//this.terrainMaxFlux = 10.0;
	//---------------------------------------------------------------------------------------------------------------

	// texture url.**************************************************************************************************
	this.waterSourceUrl;


	this.waterHeightTexA; // water height over terrain.
	this.waterHeightTexB; // water height over terrain.

	// water source, contaminant source  & rain.*********************************************************************
	this.waterSourceTex;
	this.waterAditionTex;
	this.rainTex;
	this.contaminantSourceTex;

	this.waterFluxTexA_HIGH; // water fluxing in 4 directions. splitted values in high & low.
	this.waterFluxTexB_HIGH; // water fluxing in 4 directions. splitted values in high & low.
	this.waterFluxTexA_LOW; // water fluxing in 4 directions. splitted values in high & low.
	this.waterFluxTexB_LOW; // water fluxing in 4 directions. splitted values in high & low.

	this.waterVelocityTexA;
	this.waterVelocityTexB;

	// water particles.************************************************
	this.particlesTex_A;
	this.particlesTex_B;
	this.particlesPosTex_A;
	this.particlesPosTex_B;
	this.windRes;

	// contamination texture.******************************************
	this.contaminationTex_A;
	this.contaminationTex_B;

	// Shader log textures.********************************************
	this.shaderLogTexA; // auxiliar tex to debug shaders.***
	this.shaderLogTexB; // auxiliar tex to debug shaders.***

	this.shaderLogTex_Flux_A; // auxiliar tex to debug shaders.***
	this.shaderLogTex_Flux_B; // auxiliar tex to debug shaders.***

	// Quantized volume.*******************************************************************************
	this.quantizedVolumeMinMaxHeights = new Float32Array([-100.0, 1000.0]);

	// simulation parameters.******************************************
	this.terrainMinMaxHeights = new Float32Array([180.0, 540.0]);
	this.waterMaxHeight = 500.0; // ok.
	//this.waterMaxHeight = 1000.0; // ok.
	this.waterMaxFlux = 100000.0; // ok. (4000 is no enought).
	this.waterMaxVelocity = 40.0;
	this.waterMaxVelocity = 400.0;
	this.contaminantMaxheight = -1.0; // value when there are no exist contaminant.
	this.contaminantMaxheight = 50.0;

	this.simulationTimeStep = 0.08; // ok.

	// The "simulationTimeStep" must be calculated by simulation cell size.***


	// The water renderable surface.
	this.surface; // tile size surface, with 512 x 512 points (as DEM texture size).

	this._bIsPrepared = false;

	// The buildings & objects intersected by this waterTile.
	this.visibleObjectsControler;

	if(options)
	{
		if(options.geographicExtent)
		{
			this.geographicExtent = options.geographicExtent;
		}

		if(options.tileIndices)
		{
			this.tileIndices = options.tileIndices;
		}

		if(options.targetDepth)
		{
			this._targetDepth = options.targetDepth;
		}

		if(options.waterSourceUrl !== undefined)
		{
			this.waterSourceUrl = options.waterSourceUrl;
		}
	}
};

Water.prototype.init = function ()
{
	this._makeSurface();
	this._makeTextures();

	// calculate the size of the tile in meters.***
	// Globe.getArcDistanceBetweenGeographicCoords = function(startGeoCoord, endGeoCoord)
	var minLon = this.geographicExtent.minGeographicCoord.longitude;
	var minLat = this.geographicExtent.minGeographicCoord.latitude;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude;

	// in longitude direction.
	var geoCoord_leftDown = new GeographicCoord(minLon, minLat, 0);
	var geoCoord_leftUp = new GeographicCoord(minLon, maxLat, 0);
	var geoCoord_rightDown = new GeographicCoord(maxLon, minLat, 0);

	this.tileSizeMeters_x = Globe.getArcDistanceBetweenGeographicCoords(geoCoord_leftDown, geoCoord_rightDown);
	this.tileSizeMeters_y = Globe.getArcDistanceBetweenGeographicCoords(geoCoord_leftDown, geoCoord_leftUp);

	// The "simulationTimeStep" must be calculated by simulation cell size.***
	this.cellSize_x = this.tileSizeMeters_x / this.waterManager.simulationTextureSize[0];
	this.cellSize_y = this.tileSizeMeters_y / this.waterManager.simulationTextureSize[1];
	this.cellArea = this.cellSize_x * this.cellSize_y;

	this.simulationTimeStep = 0.08;

	this._bIsPrepared = true;
};


Water.prototype._makeTextures = function ()
{
	var waterManager = this.waterManager;
	var magoManager = waterManager.magoManager;
	var gl = magoManager.getGl();

	// water simulation texture size: it depends of waterManager.
	var texWidth = waterManager.simulationTextureSize[0];
	var texHeight = waterManager.simulationTextureSize[1];

	this.waterAditionTex = waterManager._newTexture(gl, texWidth, texHeight);
	
	// make a heightMap and a fluxMap.
	this.waterHeightTexA = waterManager._newTexture(gl, texWidth, texHeight);
	this.waterHeightTexB = waterManager._newTexture(gl, texWidth, texHeight);

	this.waterHeightTexA.name = "A";
	this.waterHeightTexB.name = "B";

	this.waterFluxTexA_HIGH = waterManager._newTexture(gl, texWidth, texHeight); // water fluxing in 4 directions. splitted values in high & low.
	this.waterFluxTexB_HIGH = waterManager._newTexture(gl, texWidth, texHeight); // water fluxing in 4 directions. splitted values in high & low.
	this.waterFluxTexA_LOW = waterManager._newTexture(gl, texWidth, texHeight); // water fluxing in 4 directions. splitted values in high & low.
	this.waterFluxTexB_LOW = waterManager._newTexture(gl, texWidth, texHeight); // water fluxing in 4 directions. splitted values in high & low.
	
	this.waterVelocityTexA = waterManager._newTexture(gl, texWidth, texHeight);
	this.waterVelocityTexB = waterManager._newTexture(gl, texWidth, texHeight);

	this.demWithBuildingsTex = waterManager._newTexture(gl, texWidth, texHeight);
	
	// Shade Log textures.**********************************************************************************************************************
	this.shaderLogTexA = waterManager._newTexture(gl, texWidth, texHeight); // auxiliar tex to debug shaders. delete after use.
	this.shaderLogTexB = waterManager._newTexture(gl, texWidth, texHeight); // auxiliar tex to debug shaders. delete after use.

	this.shaderLogTex_Flux_A = waterManager._newTexture(gl, texWidth, texHeight); // auxiliar tex to debug shaders. delete after use.
	this.shaderLogTex_Flux_B = waterManager._newTexture(gl, texWidth, texHeight); // auxiliar tex to debug shaders. delete after use.

	// Particles.********************************************************************************************************************************
	// Now, inicialitze particles random position.
	var particlesTexWidth = waterManager.particlesRenderTexWidth;
	var particlesTexHeight = waterManager.particlesRenderTexHeight;
	this.particlesTex_A = waterManager._newTexture(gl, particlesTexWidth, particlesTexHeight);
	this.particlesTex_B = waterManager._newTexture(gl, particlesTexWidth, particlesTexHeight);
	var numParticles = this.windRes * this.windRes;
	var particleState = new Uint8Array(numParticles * 4);
	for (var i = 0; i < particleState.length; i++) 
	{
		particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
	}
	this.particlesPosTex_A = new Texture();
	this.particlesPosTex_B = new Texture();
	this.particlesPosTex_A.texId = Texture.createTexture(gl, gl.NEAREST, particleState, this.windRes, this.windRes);
	this.particlesPosTex_B.texId = Texture.createTexture(gl, gl.NEAREST, particleState, this.windRes, this.windRes);

	// Contamination texture.*********************************************************************************************************************
	this.contaminationTex_A = waterManager._newTexture(gl, texWidth, texHeight);
	this.contaminationTex_B = waterManager._newTexture(gl, texWidth, texHeight);

	this.contaminantSourceTex = waterManager._newTexture(gl, texWidth, texHeight);

	// DEM texture.*******************************************************************************************************************************
	this.dem_withExcavation; // do NOT create here.
	this.dem_texture_A; // do NOT create here.
	this.dem_texture_B; // do NOT create here.
	this.terrainFluxTexA_HIGH = waterManager._newTexture(gl, texWidth, texHeight); // terrain fluxing in 4 directions. splitted values in high & low.
	this.terrainFluxTexB_HIGH = waterManager._newTexture(gl, texWidth, texHeight); // terrain fluxing in 4 directions. splitted values in high & low.
	this.terrainFluxTexA_LOW = waterManager._newTexture(gl, texWidth, texHeight); // terrain fluxing in 4 directions. splitted values in high & low.
	this.terrainFluxTexB_LOW = waterManager._newTexture(gl, texWidth, texHeight); 
	this.terrainMaxSlippageTex = waterManager._newTexture(gl, texWidth, texHeight); 

	gl.bindTexture(gl.TEXTURE_2D, null);
};

Water.prototype.makeDEMTextureByQuantizedMeshes = function ()
{
	if(!this.isPrepared())
	{ return; }

	// Must calculate the minHeight & maxHeight of the water simulation area.***
	// So, to do this, reset the altitudes of the geographicExtension.
	this.geographicExtent.setExtentAltitudes(10000.0, -10000.0);
	var tilesCount = this.tilesArray.length;
	for(var i=0; i<tilesCount; i++)
	{
		var tile = this.tilesArray[i];
		var minHeight = tile.qMesh._minimumHeight;
		var maxHeight = tile.qMesh._maximumHeight;

		// In this point, calculate the minimumHeight and the maximumHeight of the simulation area.***
		if(this.geographicExtent.minGeographicCoord.altitude > minHeight)
		{
			this.geographicExtent.minGeographicCoord.altitude = minHeight;
		}
		else if(this.geographicExtent.maxGeographicCoord.altitude < maxHeight)
		{
			this.geographicExtent.maxGeographicCoord.altitude = maxHeight;
		}
	}

	this.terrainMinMaxHeights[0] = this.geographicExtent.minGeographicCoord.altitude;
	this.terrainMinMaxHeights[1] = this.geographicExtent.maxGeographicCoord.altitude;

	// Now, make the vbo of the each tile.***
	var tilesCount = this.tilesArray.length;
	for(var i=0; i<tilesCount; i++)
	{
		var tile = this.tilesArray[i];
		if(!tile.qMeshVboKeyContainer)
		{
			this._makeQuantizedMeshVbo(tile);
		}
	}
	
	var waterManager = this.waterManager;
	var magoManager = waterManager.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.getGl();
	var fbo = waterManager.terrainTexFbo; // simulation fbo. (512 x 512).
	//var fbo = waterManager.fbo; // simulation fbo. (1024 x 1024).
	var extbuffers = fbo.extbuffers;
	var shader;


	gl.disable(gl.BLEND);
	gl.disable(gl.CULL_FACE);
	gl.clearColor(1.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0);

	if(!this.original_dem_texture)
	{
		//var texWidth = waterManager.simulationTextureSize[0];
		//var texHeight = waterManager.simulationTextureSize[1];
		var texWidth = waterManager.terrainTextureSize[0];
		var texHeight = waterManager.terrainTextureSize[1];

		this.original_dem_texture = waterManager._newTexture(gl, texWidth, texHeight);
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

	shader = magoManager.postFxShadersManager.getShader("depthTexFromQuantizedMesh");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	//gl.uniform2fv(shader.u_minMaxHeights_loc, [this.qMesh._minimumHeight, this.qMesh._maximumHeight]);
	gl.uniform1i(shader.colorType_loc_loc, 0);

	//gl.disable(gl.CULL_FACE);
	gl.clear(gl.DEPTH_BUFFER_BIT);

	// Now, set the waterSimGeoExtent & the qMeshGeoExtent.
	var geoExtent = this.geographicExtent;
	gl.uniform3fv(shader.u_totalMinGeoCoord_loc, [geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]);
	gl.uniform3fv(shader.u_totalMaxGeoCoord_loc, [geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]);

	for(var i=0; i<tilesCount; i++)
	{
		var tile = this.tilesArray[i];
		var tileGeoExtent = tile.geoExtent;
		gl.uniform3fv(shader.u_currentMinGeoCoord_loc, [tileGeoExtent.minGeographicCoord.longitude, tileGeoExtent.minGeographicCoord.latitude, tile.qMesh._minimumHeight]);
		gl.uniform3fv(shader.u_currentMaxGeoCoord_loc, [tileGeoExtent.maxGeographicCoord.longitude, tileGeoExtent.maxGeographicCoord.latitude, tile.qMesh._maximumHeight]);


		var vbo_vicky = tile.qMeshVboKeyContainer.vboCacheKeysArray[0]; // there are only one.
		var vertices_count = vbo_vicky.vertexCount;

		// Bind positions.
		vbo_vicky.vboBufferPos.bindData(shader, shader.a_pos, vboMemManager);
		
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

	

	fbo.unbind();
	gl.enable(gl.CULL_FACE);

	this.original_dem_texture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
};

Water.prototype.makeDEMTextureByQuantizedMesh__testQSurfaceMesh = function (qMesh)
{
	// Test function to render qSurface in excavation.***
	// Test function to render qSurface in excavation.***
	// Test function to render qSurface in excavation.***
	if(!this.isPrepared())
	{ return; }

	if(!this.qMeshVboKeyContainer)
	{
		this._makeQuantizedMeshVbo__testQSurfaceMesh(qMesh);
	}
	
	var waterManager = this.waterManager;
	var magoManager = waterManager.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.getGl();
	var fbo = waterManager.terrainTexFbo; // simulation fbo. (512 x 512).
	//var fbo = waterManager.fbo; // simulation fbo. (1024 x 1024).
	var extbuffers = fbo.extbuffers;
	var shader;


	gl.disable(gl.BLEND);
	gl.disable(gl.CULL_FACE);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clearDepth(1.0);

	if(!this.qSurfaceMesh_dem_texture)
	{
		//var texWidth = waterManager.simulationTextureSize[0];
		//var texHeight = waterManager.simulationTextureSize[1];
		var texWidth = waterManager.terrainTextureSize[0];
		var texHeight = waterManager.terrainTextureSize[1];

		this.qSurfaceMesh_dem_texture = waterManager._newTexture(gl, texWidth, texHeight);
	}

	if(!qMesh.geoExtent)
    {
        // Make the geographicExtent by tile indices L, X, Y.
        var imageryType = CODE.imageryType.CRS84;
        var tileIndices = qMesh.tileIndices;
        qMesh.geoExtent = SmartTile.getGeographicExtentOfTileLXY(tileIndices.L, tileIndices.X, tileIndices.Y, undefined, imageryType);

        // set minAltitude & maxAltitude to the geoExtent.
        var maxHeight = qMesh._maximumHeight;
        var minHeight = qMesh._minimumHeight;
        
        qMesh.geoExtent.setExtentAltitudes(minHeight, maxHeight);
    }

	// 2n, make building depth over terrain depth.******************************************************************************************************
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.qSurfaceMesh_dem_texture.texId, 0); // depthTex.
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

	gl.uniform4fv(shader.u_oneColor4_loc, [1.0, 0.5, 0.25, 1.0]);
	

	// Now, set the waterSimGeoExtent & the qMeshGeoExtent.
	
	var geoExtent = qMesh.geoExtent;
	gl.uniform3fv(shader.u_totalMinGeoCoord_loc, [geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]);
	gl.uniform3fv(shader.u_totalMaxGeoCoord_loc, [geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]);

	//var tileGeoExtent = qMesh.geoExtent;
	gl.uniform3fv(shader.u_currentMinGeoCoord_loc, [geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]);
	gl.uniform3fv(shader.u_currentMaxGeoCoord_loc, [geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]);
	

	//gl.disable(gl.CULL_FACE);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var vbo_vicky = this.qMeshVboKeyContainer.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;

	// Bind positions.
	vbo_vicky.vboBufferPos.bindData(shader, shader.a_pos, vboMemManager);
	
	//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
	//{ return false; }

	//if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
	//{ return false; }

	if(vbo_vicky.vboBufferCol)
	{
		vbo_vicky.vboBufferCol.bindData(shader, shader.color4_loc, vboMemManager);
	}

	var indicesCount = vbo_vicky.indicesCount;
	if (!vbo_vicky.bindDataIndice(shader, magoManager.vboMemoryManager))
	{ return false; }

	// Render in traditional mode.***
	/*
	gl.uniform1i(shader.colorType_loc, 1);
	gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); 

	gl.uniform1i(shader.colorType_loc, 0);
	gl.disable(gl.DEPTH_TEST);
	gl.drawElements(gl.LINES, indicesCount, gl.UNSIGNED_SHORT, 0); 
	*/

	// Render triangle one by one.**********************************************************
	var triCount = indicesCount/3.0;
	var byteOffset;
	gl.uniform1i(shader.colorType_loc, 1);
	for(var i=0; i<triCount; i++)
	{
		byteOffset = i*3*2;
		gl.uniform4fv(shader.u_oneColor4_loc, [Math.random()*0.5, Math.random()*0.5, Math.random()*0.5, 1.0]);
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, byteOffset); 
	}

	fbo.unbind();
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);

	this.qSurfaceMesh_dem_texture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
};

Water.prototype._makeQuantizedMeshVbo = function (tile)
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
	for(var i=0; i<pointsCount; i++)
	{
		x = uValues[i];
		y = vValues[i];
		z = hValues[i];

		this.cartesiansArray[i * 3] = x;
		this.cartesiansArray[i * 3 + 1] = y;
		this.cartesiansArray[i * 3 + 2] = z;
	}

	var magoManager = this.waterManager.magoManager;
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

Water.prototype._makeQuantizedMeshVbo__testQSurfaceMesh = function (qMesh)
{
	if(this.qMeshVboKeyContainer)
	{
		return true;
	}

	var minHeight = qMesh._minimumHeight;
	var maxHeight = qMesh._maximumHeight;
	var uValues = qMesh._uValues;
	var vValues = qMesh._vValues;
	var hValues = qMesh._heightValues;
	this.indices = qMesh._indices;
	var colors;

	// check if has colors.
	if(qMesh._colors)
	{
		// has colors.
		colors = qMesh._colors;
	}

	// Now, make vbo.***
	var pointsCount = uValues.length;
	var cartesiansArray = new Uint16Array(pointsCount * 3);
	
	// Now, scale the mesh into the this.geoExtension.***

	var shortMax = 32767;
	var x, y, z;
	for(var i=0; i<pointsCount; i++)
	{
		x = uValues[i];
		y = vValues[i];
		z = hValues[i];

		cartesiansArray[i * 3] = x;
		cartesiansArray[i * 3 + 1] = y;
		cartesiansArray[i * 3 + 2] = z;
	}

	var magoManager = this.waterManager.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;

	if (this.qMeshVboKeyContainer === undefined)
	{ this.qMeshVboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKey = this.qMeshVboKeyContainer.newVBOVertexIdxCacheKey();
	
	// Positions.
	vboKey.setDataArrayPos(cartesiansArray, vboMemManager);

	// Normals.
	//if (this.normalsArray)
	//{
	//	vboKey.setDataArrayNor(this.normalsArray, vboMemManager);
	//}
	
	// TexCoords.
	//if (this.texCoordsArray)
	//{
	//	vboKey.setDataArrayTexCoord(this.texCoordsArray, vboMemManager);
	//}

	if(colors)
	{
		vboKey.setDataArrayCol(colors, vboMemManager);
	}
		
	// Indices.
	vboKey.setDataArrayIdx(this.indices, vboMemManager);

	var hola = 0;
};

/**
 * render
 */
Water.prototype.isPrepared = function()
{
	if(!this._bIsPrepared)
	{
		this.init();
		return false;
	}
	return true;
};

Water.prototype._loadQuantizedMesh = function (L, X, Y, tile)
{
	tile.qMeshPromise = this.waterManager.terrainProvider.requestTileGeometry(X, Y, L);
	tile.qMeshPromise.then((value) =>
	{
		tile.qMesh = value;
		tile.geoExtent = SmartTile.getGeographicExtentOfTileLXY(L, X, Y, undefined, CODE.imageryType.CRS84);
	});
};

Water._loadOrCreateTexture = function (texture, waterManager)
{
	if (texture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
	{ return true; }

	if(texture.url)
	{
		if (texture.fileLoadState === CODE.fileLoadState.READY)
		{
			var gl = waterManager.magoManager.getGl();
			ReaderWriter.loadImage(gl, texture.url, texture);
			return false;
		}
		else if (texture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
		{
			return false;
		}
	}
	else
	{
		var gl = waterManager.magoManager.getGl();

		// create the texture.
		var texWidth = waterManager.simulationTextureSize[0];
		var texHeight = waterManager.simulationTextureSize[1];
		
		var filter = gl.NEAREST; // gl.NEAREST, LINEAR
		var data = null;
		var tex = Texture.createTexture(gl, filter, data, texWidth, texHeight);

		texture.texId = tex;
		texture.imageWidth = texWidth;
		texture.imageHeight = texHeight;
		texture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
		return false;
	}

	return true;
};

Water.prototype.prepareTextures = function ()
{
	var waterManager = this.waterManager;

	// Water source texture.**************************************************************************************************
	
	if(!this.waterSourceTex)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();

		// load test texture dem.
		var options = {};
		if(this.waterSourceUrl)
		{
			options.waterSourceUrl = this.waterSourceUrl;
		}
		this.waterSourceTex = new Texture(options);
		this.waterSourceTex.texId = gl.createTexture();
		return false;
	}

	/*
	if(!Water._loadOrCreateTexture(this.waterSourceTex, waterManager))
	{
		return false;
	}
	*/
	
	else if (this.waterSourceTex.fileLoadState === CODE.fileLoadState.READY)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();
		//var texturePath = '/images/en/waterSourceTexTestlow.png';
		//var texturePath = '/images/en/waterSourceTexTest_rain.png';
		var texturePath = '/images/en/black.png';
		//var texturePath = '/images/en/contaminantHigh.png';

		ReaderWriter.loadImage(gl, texturePath, this.waterSourceTex);
		var texWidth = waterManager.simulationTextureSize[0];
		var texHeight = waterManager.simulationTextureSize[1];
		//this.waterSourceTex = waterManager._newTexture(gl, texWidth, texHeight);

		// Test debug:**************************************************************************
		/*
		var gl = waterManager.magoManager.getGl();

		// create the texture.
		
		texWidth = 512;
		texHeight = 512;
		
		var filter = gl.NEAREST; // NEAREST, LINEAR
		var data = null;
		var tex = Texture.createTexture(gl, filter, data, texWidth, texHeight);

		this.waterSourceTex.texId = tex;
		this.waterSourceTex.imageWidth = texWidth;
		this.waterSourceTex.imageHeight = texHeight;
		this.waterSourceTex.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
		*/
		// end test debug.---------------------------------------------------------------------

		return false;
	}
	else if (this.waterSourceTex.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return false;
	}
	
	// Rain if exist.**************************************************************************************************
	if(!this.rainTex)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();

		// load test texture dem.
		this.rainTex = new Texture();
		this.rainTex.texId = gl.createTexture();
		return false;
	}
	else if (this.rainTex.fileLoadState === CODE.fileLoadState.READY)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();
		var texturePath = '/images/en/waterSourceTexTest_rain.png';

		ReaderWriter.loadImage(gl, texturePath, this.rainTex);
		return false;
	}
	else if (this.rainTex.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return false;
	}

	// Original DEM texture.**************************************************************************************************
	// Note : the original dem texture can provide from HeightMapTexture or quantizedMesh.
	if(this.waterManager.terrainDemSourceType === "HIGHMAP")
	{
		if(!this.original_dem_texture)
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
			var dem_texturePath = '/images/en/demSampleTest.png'; // provisional.***

			ReaderWriter.loadImage(gl, dem_texturePath, this.original_dem_texture);
			return false;
		}
		else if (this.original_dem_texture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
		{
			return false;
		}
	}
	else if (this.waterManager.terrainDemSourceType === "QUANTIZEDMESH")
	{
		// check the needed tiles.***

		if(!this.tilesArray)
		{
			// 1rst, must find the tile depth with similar size of my geoExtent.***
			var geoExtent = this.geographicExtent;
			// From my geoExtent, determine the minimum size of the rectangle.
			var lonRangeDegree = geoExtent.maxGeographicCoord.longitude - geoExtent.minGeographicCoord.longitude;
			var latRangeDegree = geoExtent.maxGeographicCoord.latitude - geoExtent.minGeographicCoord.latitude;
			var targetDepth = -1;
			if(lonRangeDegree < latRangeDegree)
			{
				// use lonRange to determine the closes tile depth.
				var angDepthRange;
				for(var i=1; i<30; i++)
				{
					angDepthRange = SmartTile.selectTileAngleRangeByDepth(i);
					if(angDepthRange < lonRangeDegree)
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
				for(var i=1; i<30; i++)
				{
					angDepthRange = SmartTile.selectTileAngleRangeByDepth(i);
					if(angDepthRange < latRangeDegree)
					{
						targetDepth = i;
						break;
					}
				}
			}

			var waterManager = this.waterManager;
			waterManager.simulationTileDepth = targetDepth;
			var simulationTileDepth = waterManager.simulationTileDepth;
			this._targetDepth = simulationTileDepth + 4;

			var maxDepthAvailable = MagoManager.getMaximumLevelOfTerrainProvider(this.waterManager.terrainProvider);
			if(this._targetDepth > maxDepthAvailable)
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
		if(!this.allQuantizedMeshesLoaded)
		{
			var allQuantizedMeshesLoaded = true;
			var tilesCount = this.tilesArray.length;
			for(var i=0; i<tilesCount; i++)
			{
				var tile = this.tilesArray[i];
				if(!tile.qMesh)
				{
					if(!tile.qMeshPromise)
					{
						var X = tile.X;
						var Y = tile.Y;
						var L = tile.L;
						this._loadQuantizedMesh(L, X, Y, tile);
					}

					allQuantizedMeshesLoaded = false;
				}
			}

			if(allQuantizedMeshesLoaded)
			{
				this.allQuantizedMeshesLoaded = true;
			}
		}

		if(this.allQuantizedMeshesLoaded)
		{
			// Make dem texture from qMeshes.***
			if(!this.original_dem_texture)
			{
				this.makeDEMTextureByQuantizedMeshes();
			}
			var hola = 0;
		}
	}

	// Terrain difusse texture.**************************************************************************************************
	if(!this.terrainDiffTex)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();

		// load test texture dem.
		this.terrainDiffTex = new Texture();
		this.terrainDiffTex.texId = gl.createTexture();
		return false;
	}
	else if (this.terrainDiffTex.fileLoadState === CODE.fileLoadState.READY)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();
		var dem_texturePath = '/images/en/waterTerrainDifusse.png';
		//var dem_texturePath = '/images/en/demSampleTest.png';
		//var dem_texturePath = '/images/en/terrainColor.png';

		ReaderWriter.loadImage(gl, dem_texturePath, this.terrainDiffTex);
		return false;
	}
	else if (this.terrainDiffTex.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return false;
	}

	// Terrain difusse texture.**************************************************************************************************
	if(!this.terrainDiffTex2)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();

		// load test texture dem.
		this.terrainDiffTex2 = new Texture();
		this.terrainDiffTex2.texId = gl.createTexture();
		return false;
	}
	else if (this.terrainDiffTex2.fileLoadState === CODE.fileLoadState.READY)
	{
		var magoManager = this.waterManager.magoManager;
		var gl = magoManager.getGl();
		//var dem_texturePath = '/images/en/waterTerrainDifusse.png';
		//var dem_texturePath = '/images/en/demSampleTest.png';
		var dem_texturePath = '/images/en/terrainColor.png';

		ReaderWriter.loadImage(gl, dem_texturePath, this.terrainDiffTex2);
		return false;
	}
	else if (this.terrainDiffTex2.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return false;
	}

	// Copy demTexture to preserve the originalDEMTexture.***********************************************************************
	if (!this.dem_texture_A)
	{
		if (this.original_dem_texture && this.original_dem_texture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
		{
			var magoManager = this.waterManager.magoManager;
			var gl = magoManager.getGl();

			// Note : dem_texture_A & dem_texture_B is used for landSlide simulation.***
			// dem_texture_A & dem_texture_B must to be simulation texture size.***

			var texWidth = this.waterManager.simulationTextureSize[0];
			var texHeight = this.waterManager.simulationTextureSize[1];
			this.dem_texture_A = this.waterManager._newTexture(gl, texWidth, texHeight);
			var bFlipTexcoordY = true;
			this.copyTexture(this.original_dem_texture, [this.dem_texture_A], bFlipTexcoordY);

			// create the dem_texture_B too.
			this.dem_texture_B = this.waterManager._newTexture(gl, texWidth, texHeight);
			this.copyTexture(this.original_dem_texture, [this.dem_texture_B], bFlipTexcoordY);
			this.dem_withExcavation = this.waterManager._newTexture(gl, texWidth, texHeight);
			this.copyTexture(this.original_dem_texture, [this.dem_withExcavation], bFlipTexcoordY);
		}
		return false;
	}

	return true;
};

Water._swapTextures = function (texA, texB)
{
	var texAux = texA.texId;
	texA.texId = texB.texId;
	texB.texId = texAux;
};

Water.prototype.test__doQuantizedSurfaceExcavation = function ()
{
	// Test debug to do excavation on cesium terrain.***

};

/**
 * simulation
 */
Water.prototype.doSimulationSteps = function (magoManager)
{
	if(!this.isPrepared())
	{ return; }

	if(!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	var sceneState = magoManager.sceneState;
	var waterManager = this.waterManager;

	// bind frameBuffer.
	var gl = magoManager.getGl();
	//var extbuffers = magoManager.extbuffers;
	var fbo = waterManager.fbo;
	var extbuffers = fbo.extbuffers;
	var shader;

	// Test.*** delete this.*** Test.*** delete this.*** Test.*** delete this.*** Test.*** delete this.*** Test.*** delete this.*** Test.*** 
	// 1rst, check if dem texture is ready.
	if(!this.quantizedSurfaceTest && this.testQMesh)
	{
		// 1rst, calculate the geoExtent of the tile:
		var imageryType = CODE.imageryType.CRS84;
		var tileIndices = this.testQMesh.tileIndices;
		var geoExtent = SmartTile.getGeographicExtentOfTileLXY(tileIndices.L, tileIndices.X, tileIndices.Y, undefined, imageryType);
		var minGeoCoord = geoExtent.minGeographicCoord;
		var maxGeoCoord = geoExtent.maxGeographicCoord;

		this.quantizedSurface = new QuantizedSurface(this.testQMesh);
		// The testing tile extent:
		var minLon = minGeoCoord.longitude;
		var minLat = minGeoCoord.latitude;
		var maxLon = maxGeoCoord.longitude;
		var maxLat = maxGeoCoord.latitude;

		var midLon = (maxLon + minLon) / 2.0;
		var midLat = (maxLat + minLat) / 2.0;
		var lonRange = maxLon - minLon;
		var latRange = maxLat - minLat;

		var deltaLon = 0.0;
		var deltaLat = 0.0;

		var excavationGeoCoords = [];
		
		// make a rectangle.************************************************************************************************
		// origin is left-down.***
		/*
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.2 * lonRange), (minLat + 0.15 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.78 * lonRange), (minLat + 0.15 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.78 * lonRange), (minLat + 0.8 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.2 * lonRange), (minLat + 0.8 * latRange), 0.0));
		*/

		// make a irregular "L" shape.**************************************************************************************
		
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.1 * lonRange), (minLat + 0.1 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.8 * lonRange), (minLat + 0.15 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.75 * lonRange), (minLat + 0.4 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.4 * lonRange), (minLat + 0.32 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.5 * lonRange), (minLat + 0.9 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.3 * lonRange), (minLat + 0.7 * latRange), 0.0));
		

		// small rectangle.*************************************************************************************************
		/*
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.2 * lonRange), (minLat + 0.15 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.3 * lonRange), (minLat + 0.15 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.3 * lonRange), (minLat + 0.21 * latRange), 0.0));
		excavationGeoCoords.push(new GeographicCoord((minLon + 0.2 * lonRange), (minLat + 0.21 * latRange), 0.0));
			*/
		// make a circle.***************************************************************************************************
		/*
		var angRad = 0.0;
		var interpolation = 128;
		var increAngRad = Math.PI / (interpolation / 2);
		var lonRadius = (lonRange/2) * 0.77;
		var latRadius = (latRange/2) * 0.77;
		var lonOffset = 0.0001;
		var latOffset = 0.0001;
		lonOffset = 0.004;
		latOffset = 0.005;
		for(var i=0; i<interpolation; i++)
		{
			angRad = increAngRad * i;
			var x = Math.cos(angRad);
			var y = Math.sin(angRad);

			var currLon = midLon + lonOffset + lonRadius * x;
			var currLat = midLat + latOffset + latRadius * y;

			excavationGeoCoords.push(new GeographicCoord(currLon + deltaLon, currLat + deltaLat, 0.0));
		}
		*/
		
		var excavationDepth = 20.0;
		this.quantizedSurface.excavation(excavationGeoCoords, excavationDepth);
		this.quantizedSurfaceTest = true;
	}

	if(!this.qSurfaceMesh_dem_texture)
	{
		this.makeDEMTextureByQuantizedMesh__testQSurfaceMesh(this.testQMesh);
	}
	// End test.--- delete this.--- End test.--- delete this.--- End test.--- delete this.--- End test.--- delete this.--- End test.--- delete this.---


	//---------------------------------------------------------------------------------------------------------------------------------
	// Check if simulate landSlides.
	if(waterManager.bDoLandSlideSimulation)
	{
		this.doSimulationSteps_landSlide(magoManager);
	}

	gl.disable(gl.BLEND);
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0); 

	//---------------------------------------------------------------------------------------------------------------------------------
	// 1- Calculate water height by water source.**************************************************************************************
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.waterHeightTexA.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.contaminationTex_A.texId, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.shaderLogTexA.texId, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var screenQuad = waterManager.getQuadBuffer();
	shader = magoManager.postFxShadersManager.getShader("waterCalculateHeight");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.u_existRain_loc, waterManager.bExistRain);
	gl.uniform1f(shader.u_waterMaxHeigh_loc, this.waterMaxHeight);
	gl.uniform1f(shader.u_contaminantMaxHeigh_loc, this.contaminantMaxheight); // negative value -> no exist contaminat.

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.waterSourceTex.texId); // water source.
	//gl.bindTexture(gl.TEXTURE_2D, null); // water source.

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.rainTex.texId); // rain.

	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, this.waterHeightTexB.texId);

	if(this.contaminantMaxheight > 0.0)
	{
		gl.activeTexture(gl.TEXTURE3); // contaminant tex if exist.
		gl.bindTexture(gl.TEXTURE_2D, this.contaminantSourceTex.texId);

		gl.activeTexture(gl.TEXTURE4); // contaminant tex if exist.
		gl.bindTexture(gl.TEXTURE_2D, this.contaminationTex_B.texId);
	}

	// Bind waterAditionTex if exist.
	gl.activeTexture(gl.TEXTURE5);
	gl.bindTexture(gl.TEXTURE_2D, this.waterAditionTex.texId);


	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);
	//FBO.bindAttribute(gl, this.texCoordBuffer, shader.texCoord2_loc, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// now, swap waterHeightTextures:
	//gl.bindFramebuffer(gl.FRAMEBUFFER,null);

	Water._swapTextures(this.waterHeightTexA, this.waterHeightTexB);
	Water._swapTextures(this.contaminationTex_A, this.contaminationTex_B);
		
	//----------------------------------------------------------------------------------------------------------------------------------
	// 2- Calculate the fluxMap by terrain dem & current waterHeight.*******************************************************************
	fbo.bind();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.waterFluxTexA_HIGH.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.waterFluxTexA_LOW.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	shader = magoManager.postFxShadersManager.getShader("waterCalculateFlux");
	magoManager.postFxShadersManager.useProgram(shader);

	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);

	gl.uniform1f(shader.u_timestep_loc, this.simulationTimeStep);
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform1f(shader.u_waterMaxHeigh_loc, this.waterMaxHeight);
	gl.uniform1f(shader.u_waterMaxFlux_loc, this.waterMaxFlux);
	gl.uniform2fv(shader.u_tileSize_loc, [this.tileSizeMeters_x, this.tileSizeMeters_y]);
	gl.uniform1f(shader.u_contaminantMaxHeigh_loc, this.contaminantMaxheight); // negative value -> no exist contaminat.

	gl.activeTexture(gl.TEXTURE0); // water height tex.
	gl.bindTexture(gl.TEXTURE_2D, this.waterHeightTexB.texId);

	gl.activeTexture(gl.TEXTURE1); // terrain height tex.
	gl.bindTexture(gl.TEXTURE_2D,  this.demWithBuildingsTex.texId);

	gl.activeTexture(gl.TEXTURE2); // flux tex high.
	gl.bindTexture(gl.TEXTURE_2D, this.waterFluxTexB_HIGH.texId);

	gl.activeTexture(gl.TEXTURE3); // flux tex low.
	gl.bindTexture(gl.TEXTURE_2D, this.waterFluxTexB_LOW.texId);

	if(this.contaminantMaxheight > 0.0)
	{
		gl.activeTexture(gl.TEXTURE4); // contaminant tex if exist.
		gl.bindTexture(gl.TEXTURE_2D, this.contaminationTex_B.texId);
	}

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// now, swap waterHeightTextures:
	Water._swapTextures(this.waterFluxTexA_HIGH, this.waterFluxTexB_HIGH);
	Water._swapTextures(this.waterFluxTexA_LOW, this.waterFluxTexB_LOW);

	//----------------------------------------------------------------------------------------------------------------------------------------------
	// 3- calculate velocityMap & new height by height & flux maps.*********************************************************************************
	fbo.bind();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.waterHeightTexA.texId, 0); // waterHeight
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.waterVelocityTexA.texId, 0); // waterVelocity.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.contaminationTex_A.texId, 0);  // debug. delete after use.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // 

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	shader = magoManager.postFxShadersManager.getShader("waterCalculateVelocity");
	magoManager.postFxShadersManager.useProgram(shader);

	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);


	gl.uniform1f(shader.u_PipeLen_loc, 1.0); // pipeLen = cellSizeX = cellSizeY.
	gl.uniform1f(shader.u_timestep_loc, this.simulationTimeStep);
	gl.uniform1f(shader.u_PipeArea_loc, 0.8);
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform1f(shader.u_waterMaxHeigh_loc, this.waterMaxHeight);
	gl.uniform1f(shader.u_waterMaxFlux_loc, this.waterMaxFlux);
	gl.uniform2fv(shader.u_tileSize_loc, [this.tileSizeMeters_x, this.tileSizeMeters_y]);
	gl.uniform1f(shader.u_waterMaxVelocity_loc, this.waterMaxVelocity);
	gl.uniform1f(shader.u_contaminantMaxHeigh_loc, this.contaminantMaxheight);

	gl.activeTexture(gl.TEXTURE0); // water height tex.
	gl.bindTexture(gl.TEXTURE_2D, this.waterHeightTexB.texId);

	gl.activeTexture(gl.TEXTURE1); // terrain height tex.
	gl.bindTexture(gl.TEXTURE_2D,  this.demWithBuildingsTex.texId);

	gl.activeTexture(gl.TEXTURE2); // flux tex high.
	gl.bindTexture(gl.TEXTURE_2D, this.waterFluxTexB_HIGH.texId);

	gl.activeTexture(gl.TEXTURE3); // flux tex low.
	gl.bindTexture(gl.TEXTURE_2D, this.waterFluxTexB_LOW.texId);

	if(this.contaminantMaxheight > 0.0)
	{
		gl.activeTexture(gl.TEXTURE4); // contaminant tex if exist.
		gl.bindTexture(gl.TEXTURE_2D, this.contaminationTex_B.texId);
	}

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// now, swap waterHeightTextures:
	Water._swapTextures(this.waterHeightTexA, this.waterHeightTexB);
	Water._swapTextures(this.waterVelocityTexA, this.waterVelocityTexB);
	Water._swapTextures(this.contaminationTex_A, this.contaminationTex_B); // debug. delete after use.

	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// 4) calculate sediment, waterHeight & velocity by terrain & water heights map & velocity.************************************************************
	//shader = magoManager.postFxShadersManager.getShader("waterCalculateSediment");

	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// Once finished simulation, then calculate particles if necessary:
	if(waterManager.bRenderParticles)
	{
		this.doSimulationSteps_particles(magoManager);
	}

	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// Must return to current frameBuffer. TODO:
	var hola = 0;

	for(var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i); 
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

};

/**
 * simulation
 */
Water.prototype.doSimulationSteps_landSlide = function (magoManager)
{
	var gl = magoManager.getGl();
	var fbo = this.waterManager.fbo;
	var extbuffers = fbo.extbuffers;
	var screenQuad = this.waterManager.getQuadBuffer();
	var shader;
	var waterManager = this.waterManager;

	// 1rst, must copy "dem_texture_A" into "dem_texture_B".
	var bFlipTexcoordY = false;
	this.copyTexture(this.dem_texture_A, [this.dem_texture_B], bFlipTexcoordY);

	gl.disable(gl.BLEND);
	
	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// 1) calculate terrain max-slippage.******************************************************************************************************************
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.terrainMaxSlippageTex.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // 
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	shader = magoManager.postFxShadersManager.getShader("waterCalculateTerrainMaxSlippage");
	magoManager.postFxShadersManager.useProgram(shader);

	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);


	gl.uniform1f(shader.u_timestep_loc, this.simulationTimeStep);
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	//gl.uniform2fv(shader.u_tileSize_loc, [this.tileSizeMeters_x, this.tileSizeMeters_y]);

	gl.activeTexture(gl.TEXTURE0); // terrain height tex.
	gl.bindTexture(gl.TEXTURE_2D, this.dem_texture_A.texId); // here use "A".***

	gl.disable(gl.DEPTH_TEST);

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.enable(gl.DEPTH_TEST);

	// now, swap textures:
	// Here no need swap textures.
	
	
	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// 2) calculate terrain flux.**************************************************************************************************************************
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.terrainFluxTexA_HIGH.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.terrainFluxTexA_LOW.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.shaderLogTex_Flux_A.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // 
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

		//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	shader = magoManager.postFxShadersManager.getShader("waterCalculateTerrainFlux");
	magoManager.postFxShadersManager.useProgram(shader);

	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);


	gl.uniform1f(shader.u_timestep_loc, this.simulationTimeStep);
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform1f(shader.u_terrainMaxFlux_loc, this.terrainMaxFlux);
	gl.uniform2fv(shader.u_tileSize_loc, [this.tileSizeMeters_x, this.tileSizeMeters_y]);

	gl.activeTexture(gl.TEXTURE0); // terrain height tex.
	gl.bindTexture(gl.TEXTURE_2D, this.dem_texture_A.texId); // here use "A".***

	gl.activeTexture(gl.TEXTURE1); // max slippage tex.
	gl.bindTexture(gl.TEXTURE_2D, this.terrainMaxSlippageTex.texId); // here use "A".***

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// now, swap textures:
	Water._swapTextures(this.terrainFluxTexA_HIGH, this.terrainFluxTexB_HIGH);
	Water._swapTextures(this.terrainFluxTexA_LOW, this.terrainFluxTexB_LOW);

	
	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// 2) calculate terrain height by terrain flux.********************************************************************************************************
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.dem_texture_A.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // 
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

		//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	shader = magoManager.postFxShadersManager.getShader("waterCalculateTerrainHeightByFlux");
	magoManager.postFxShadersManager.useProgram(shader);

	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);


	gl.uniform1f(shader.u_timestep_loc, this.simulationTimeStep);
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform1f(shader.u_terrainMaxFlux_loc, this.terrainMaxFlux);
	gl.uniform2fv(shader.u_tileSize_loc, [this.tileSizeMeters_x, this.tileSizeMeters_y]);

	gl.activeTexture(gl.TEXTURE0); // terrain height tex.
	gl.bindTexture(gl.TEXTURE_2D, this.dem_texture_B.texId); // here use "B".***

	gl.activeTexture(gl.TEXTURE1); // max slippage tex.
	gl.bindTexture(gl.TEXTURE_2D, this.terrainFluxTexB_HIGH.texId); // here use "A".***

	gl.activeTexture(gl.TEXTURE2); // max slippage tex.
	gl.bindTexture(gl.TEXTURE_2D, this.terrainFluxTexB_LOW.texId); // here use "A".***

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// now, swap textures:
	//Water._swapTextures(this.dem_texture_A, this.dem_texture_B);
	
};

/**
 * simulation
 */
Water.prototype.doSimulationSteps_particles = function (magoManager)
{
	// Use the velocity map of the water to render particles movement.
	var gl = magoManager.getGl();
	var fbo = this.waterManager.windParticlesPosFbo;
	var extbuffers = fbo.extbuffers;
	var screenQuad = this.waterManager.getQuadBuffer();
	var shader;
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.particlesPosTex_A.texId, 0); // waterHeight
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // waterVelocity.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);  // debug. delete after use.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // 
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// 1) Calculate particles position.********************************************************************************************************************
	shader = magoManager.postFxShadersManager.getShader("waterParticlesUpdate");
	magoManager.postFxShadersManager.useProgram(shader);

	var minGeoCoord = this.geographicExtent.minGeographicCoord;
	var maxGeoCoord = this.geographicExtent.maxGeographicCoord;

	gl.uniform1i(shader.u_flipTexCoordY_windMap_loc, true);
	gl.uniform2fv(shader.u_wind_res_loc, [this.windRes, this.windRes]);
	gl.uniform2fv(shader.u_wind_min_loc, [0.0, 0.0]); // provisional value.
	gl.uniform2fv(shader.u_wind_max_loc, [40.0, 40.0]); // provisional value.
	gl.uniform3fv(shader.u_geoCoordRadiansMax_loc, [maxGeoCoord.getLongitudeRad(), maxGeoCoord.getLatitudeRad(), 0.0]); 
	gl.uniform3fv(shader.u_geoCoordRadiansMin_loc, [minGeoCoord.getLongitudeRad(), minGeoCoord.getLatitudeRad(), 0.0]); 
	//gl.uniform1f(shader.u_speed_factor_loc, 0.2); // original.***
	gl.uniform1f(shader.u_speed_factor_loc, 0.1); // ok.
	gl.uniform1f(shader.u_drop_rate_loc, this.waterManager.dropRate);
	gl.uniform1f(shader.u_drop_rate_bump_loc, this.waterManager.dropRateBump);
	var randomSeed = Math.random();
	gl.uniform1f(shader.u_rand_seed_loc, randomSeed);

	gl.activeTexture(gl.TEXTURE0); // "u_particles"
	gl.bindTexture(gl.TEXTURE_2D, this.particlesPosTex_B.texId);

	gl.activeTexture(gl.TEXTURE1); // "u_wind"
	gl.bindTexture(gl.TEXTURE_2D,  this.waterVelocityTexB.texId);

	// bind screenQuad positions.
	gl.enableVertexAttribArray(shader.a_pos);
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	Water._swapTextures(this.particlesPosTex_A, this.particlesPosTex_B);

	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// 2) Fade particles render.***************************************************************************************************************************
	
	fbo = this.waterManager.windParticlesRenderingFbo;
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.particlesTex_A.texId, 0); // waterHeight
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // 
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // 
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // 
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	// NO clear : gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	shader = magoManager.postFxShadersManager.getShader("waterParticlesRenderFade");
	magoManager.postFxShadersManager.useProgram(shader);

	gl.uniform1f(shader.u_opacity_loc, 0.99);

	gl.activeTexture(gl.TEXTURE0); // "u_particles"
	gl.bindTexture(gl.TEXTURE_2D, this.particlesTex_B.texId);

	// bind screenQuad positions.
	gl.enableVertexAttribArray(shader.a_pos);
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);
		
	//-----------------------------------------------------------------------------------------------------------------------------------------------------
	// 3) Render particles.********************************************************************************************************************************
	
	fbo = this.waterManager.windParticlesRenderingFbo;
	extbuffers = fbo.extbuffers;
	fbo.bind();
	
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.particlesTex_A.texId, 0); // waterHeight
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // 
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // 
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // 
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	shader = magoManager.postFxShadersManager.getShader("waterParticlesRender");
	magoManager.postFxShadersManager.useProgram(shader);

	// NO clear : gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.activeTexture(gl.TEXTURE0); // "u_particles"
	gl.bindTexture(gl.TEXTURE_2D, this.particlesPosTex_B.texId);

	gl.activeTexture(gl.TEXTURE1); // "u_wind"
	gl.bindTexture(gl.TEXTURE_2D,  this.waterVelocityTexB.texId);

	// bind screenQuad positions.
	gl.enableVertexAttribArray(shader.a_index);
	FBO.bindAttribute(gl, this.waterManager.particleIndexBuffer, shader.a_index, 1);
	gl.uniform1i(shader.u_colorScale, false);
	
	gl.uniform1f(shader.u_particles_res, this.waterManager.windRes);
	gl.uniform2fv(shader.u_wind_min_loc, [0.0, 0.0]); // provisional value.
	gl.uniform2fv(shader.u_wind_max_loc, [40.0, 40.0]); // provisional value.
	gl.uniform1i(shader.u_flipTexCoordY_windMap, this.flipTexCoordsY_windMap);

	gl.drawArrays(gl.POINTS, 0, this.waterManager.numParticles);
		
	Water._swapTextures(this.particlesTex_A, this.particlesTex_B);
};


Water.prototype.renderTerrain = function (shader, magoManager)
{
	// This is a provisional function. The terrain must be rendered by cesium.
	if(!this.isPrepared())
	{ return; }

	if(!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	var waterManager = this.waterManager;
	var sceneState = magoManager.sceneState;
	var shader = magoManager.postFxShadersManager.getShader("terrainRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	// make the vboKey:*****************************************************************************
	if (this.vbo_vicks_container === undefined)
	{ 
		this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer(); 
		var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
		vboCacheKey.setDataArrayPos(this.posBuffer, magoManager.vboMemoryManager);
		vboCacheKey.setDataArrayTexCoord(this.texCoordBuffer, magoManager.vboMemoryManager);
	}

	var gl = magoManager.getGl();

	gl.uniform3fv(shader.buildingPosHIGH_loc, this.terrainPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, this.terrainPositionLOW);
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.buildingGeoLocMat._floatArrays);
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform2fv(shader.u_tileSize_loc, [this.tileSizeMeters_x, this.tileSizeMeters_y]);
	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);
	gl.uniform1i(shader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	gl.uniform2fv(shader.u_quantizedVolume_MinMax_loc, this.quantizedVolumeMinMaxHeights);
	gl.uniform2fv(shader.u_screenSize_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.waterHeightTexA.texId);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.dem_texture_A.texId); // correct.

	gl.activeTexture(gl.TEXTURE2);
	//gl.bindTexture(gl.TEXTURE_2D, this.terrainDiffTex.texId);
	gl.bindTexture(gl.TEXTURE_2D, this.original_dem_texture.texId);

	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, this.dem_withExcavation.texId); // 

	var vbo_vicky = this.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }
	
	//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
	//{ return false; }

	if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);

	for(var i=0; i<3; i++)
	{
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
};

Water.prototype.renderWaterDepth = function (shader, magoManager)
{
	// render depth of the water.
	if(!this.isPrepared())
	{ return; }

	if(!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	// make the vboKey:*****************************************************************************
	if (this.vbo_vicks_container === undefined)
	{ 
		this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer(); 
		var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
		vboCacheKey.setDataArrayPos(this.posBuffer, magoManager.vboMemoryManager);
		vboCacheKey.setDataArrayTexCoord(this.texCoordBuffer, magoManager.vboMemoryManager);
	}

	var gl = magoManager.getGl();

	gl.uniform3fv(shader.buildingPosHIGH_loc, this.terrainPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, this.terrainPositionLOW);
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform1f(shader.u_waterMaxHeigh_loc, this.waterMaxHeight);
	gl.uniform1f(shader.u_contaminantMaxHeigh_loc, this.contaminantMaxheight);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.waterHeightTexA.texId);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.demWithBuildingsTex.texId);//dem_texture//demWithBuildingsTex

	if(this.contaminantMaxheight > 0.0)
	{
		gl.activeTexture(gl.TEXTURE2); // contaminant tex if exist.
		gl.bindTexture(gl.TEXTURE_2D, this.contaminationTex_B.texId);
	}

	var vbo_vicky = this.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }
	
	//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
	//{ return false; }

	if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
	{ return false; }
	
	gl.disable(gl.BLEND); // depth render NO blending.
	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);

	for(var i=0; i<3; i++)
	{
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

};

Water.prototype.doIntersectedObjectsCulling = function (visiblesArray, nativeVisiblesArray)
{
	// this function does a frustumCulling-like process.
	// This function collects all objects inside of "this.distance" of this light position.
	if(!this.cullingUpdatedTime)
	this.cullingUpdatedTime = 0;

	var visiblesCount = 0;
	var nativeVisiblesCount = 0;

	if(visiblesArray)
	visiblesCount = visiblesArray.length;

	if(nativeVisiblesArray)
	nativeVisiblesCount = nativeVisiblesArray.length;

	//if(visiblesCount === 0 && nativeVisiblesCount === 0)
	//return;
	if(!this._BSphereWC)
	{
		var magoManager = this.waterManager.magoManager;
		this._BSphereWC = SmartTile.computeSphereExtent(magoManager, this.geographicExtent.minGeographicCoord, this.geographicExtent.maxGeographicCoord, undefined);
	}

	if(!this.visibleObjectsControler)
	{
		// create a visible objects controler.
		this.visibleObjectsControler = new VisibleObjectsController();
	}

	

	// visiblesObjects (nodes).
	var node;
	var bSphereWC;
	for(var i=0; i<visiblesCount; i++)
	{
		node = visiblesArray[i];
		bSphereWC = node.getBoundingSphereWC(bSphereWC);

		if(this._BSphereWC.intersectionSphere(bSphereWC) !== Constant.INTERSECTION_OUTSIDE)
		{
			this.visibleObjectsControler.currentVisibles0.push(node);
		}
	}

	// nativeVisiblesObjects.
	var native;
	for(var i=0; i<nativeVisiblesCount; i++)
	{
		native = nativeVisiblesArray[i];
		bSphereWC = native.getBoundingSphereWC(bSphereWC);

		if(this._BSphereWC.intersectionSphere(bSphereWC) !== Constant.INTERSECTION_OUTSIDE)
		{
			this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.push(native);
		}
	}

	this.bIntersectionCulling = true;
	//this.bCubeMapMade = false;

	return true;
};

Water.prototype.getTileOrthographic_mvpMat = function ()
{
	if (!this.tileOrthoModelViewProjMatrix)
	{
		// Calculate the mvp matrix.***********************************************************************************************
		//var depthFactor = 10.0;
		var minLon = this.geographicExtent.minGeographicCoord.longitude;
		var minLat = this.geographicExtent.minGeographicCoord.latitude;
		var minAlt = this.terrainMinMaxHeights[0];

		var maxLon = this.geographicExtent.maxGeographicCoord.longitude;
		var maxLat = this.geographicExtent.maxGeographicCoord.latitude;
		var maxAlt = this.terrainMinMaxHeights[1];

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
		var nearFarScale = 5.0; // original 2.0.
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



Water.prototype.makeWaterAndContaminationSourceTex = function (magoManager)
{
	// render extrudeObjects depth over the DEM depth texture.
	if(!this.isPrepared())
	{ return; }

	if(!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	var modelViewProjMatrix = this.getTileOrthographic_mvpMat();

	var screenQuad = this.waterManager.getQuadBuffer();
	var gl = magoManager.getGl();
	var fbo = this.waterManager.fbo; // simulation fbo. (1024 x 1024).
	var extbuffers = fbo.extbuffers;
	var shader;

	gl.disable(gl.BLEND);
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0);
	
	// 1rst, contamination source (if exist).***
	// *********************************************************************************************************************************************
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.contaminantSourceTex.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	if (magoManager.isFarestFrustum())
	{
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
	}
		
	// 1rst, create a local coords system:
	// the center of the water tile is origin.
	shader = magoManager.postFxShadersManager.getShader("waterOrthogonalContamination");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	// Shared uniforms, so bind only one time.***********************************************************
	gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, modelViewProjMatrix._floatArrays);
	gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	gl.uniform4fv(shader.u_color4_loc, [0.0, 0.5, 0.6, 1.0]); //.***
	// End shared uniforms.------------------------------------------------------------------------------

	gl.uniform1f(shader.u_fluidMaxHeigh_loc, 100.0);
	gl.uniform1f(shader.u_fluidHeigh_loc, 0.2);
	
	gl.disable(gl.CULL_FACE);
	if (magoManager.isFarestFrustum())
	{ gl.clear(gl.DEPTH_BUFFER_BIT); }

	var renderType = 0;
	var refMatrixIdxKey = 0;
	var glPrimitive = undefined;

	var contaminationBoxesArray = this.waterManager.getContaminationObjectsArray(); 
	var contaminantObjectsCount = contaminationBoxesArray.length;

	for(var i=0; i<contaminantObjectsCount; i++)
	{
		var native = contaminationBoxesArray[i];
		native.render(magoManager, shader, renderType, glPrimitive);
	}

	gl.enable(gl.CULL_FACE);

	// 2nd, water source (if exist).***
	// *********************************************************************************************************************************************
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.waterAditionTex.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);

	if (magoManager.isFarestFrustum())
	{
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
	}
		
	// 1rst, create a local coords system:
	// the center of the water tile is origin.
	gl.uniform1f(shader.u_fluidMaxHeigh_loc, 100.0);
	gl.uniform1f(shader.u_fluidHeigh_loc, 3.0);
	
	gl.disable(gl.CULL_FACE);
	if (magoManager.isFarestFrustum())
	{ gl.clear(gl.DEPTH_BUFFER_BIT); }

	var renderType = 0;
	var refMatrixIdxKey = 0;
	var glPrimitive = undefined;

	var waterSourceObjectsArray = this.waterManager.getWaterSourceObjectsArray(); 
	var waterSourceObjectsCount = waterSourceObjectsArray.length;

	for(var i=0; i<waterSourceObjectsCount; i++)
	{
		var native = waterSourceObjectsArray[i];
		native.render(magoManager, shader, renderType, glPrimitive);
	}

	gl.enable(gl.CULL_FACE);
	
};

Water.prototype.copyTexture = function (originalTexture, dstTexturesArray, bFlipTexcoordY, fbo)
{
	// There are the original tile DEM texture named : "dem_texture".
	// In this function we copy the originalDEM into "demWithBuildingsTex".
	var waterManager = this.waterManager;
	var magoManager = waterManager.magoManager;
	var screenQuad = this.waterManager.getQuadBuffer();
	var gl = magoManager.getGl();
	if(!fbo)
	{
		fbo = this.waterManager.fbo; // simulation fbo. (512 x 512).
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
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos, 2);

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.enable(gl.BLEND);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***

	// Finally unbind the framebuffer.***
	fbo.unbind();
};

Water.prototype.excavationDEM = function (shader, magoManager)
{
	// check if exist excavation objects.
	// if exist excavation objects, then modify the DEM of terrain with the excavation object.
	//***************************************************************************************************************
	// original_dem_texture -> (excavate)-> dem_texture -> (overWriteBuildings) -> demWithBuildingsTex.**************
	// The "original_dem_texture" can NOT be modified.
	// The "dem_texture" only can be modified by excavations & landSlides.
	// The "demWithBuildingsTex" can be modified by buildings.
	//---------------------------------------------------------------------------------------------------------------

	if (!this.visibleObjectsControler)
	{ return; }

	if(!this.isPrepared())
	{ return; }

	if(!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	var visibleNodesCount = this.visibleObjectsControler.currentVisibles0.length;
	var modelViewProjMatrix = this.getTileOrthographic_mvpMat();

	var waterManager = this.waterManager;
	var screenQuad = this.waterManager.getQuadBuffer();
	var gl = magoManager.getGl();
	var fbo = this.waterManager.fbo; // simulation fbo. (512 x 512).
	var extbuffers = fbo.extbuffers;
	var shader;

	// 1rst, copy the terrain depth into "this.demWithBuildingsTex".************************************************************************************
	if (magoManager.isFarestFrustum())
	{ 
		// We must copy "original_dem_texture" into "demWithBuildingsTex" to preserve the "original_dem_texture".
		// There are the original tile DEM texture named : "original_dem_texture".
		// In this function we copy the "original_dem_texture" into "demWithBuildingsTex".
		// Note : "dem_texture" can have excavations.
		var bFlipTexcoordY = true;
		this.copyTexture(this.original_dem_texture, [this.dem_texture_A], bFlipTexcoordY);
	}

	gl.disable(gl.BLEND);
	gl.clearColor(0.0, 1.0, 0.0, 0.0);
	gl.clearDepth(1.0);

	// 1rst, copy the terrain depth into "this.demWithBuildingsTex".************************************************************************************
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.dem_texture_A.texId, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // .
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		]);


	// 2n, make building depth over terrain depth.******************************************************************************************************

	// 1rst, create a local coords system:
	// the center of the water tile is origin.
	shader = magoManager.postFxShadersManager.getShader("waterOrthogonalDepthRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, modelViewProjMatrix._floatArrays);
	gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	gl.uniform4fv(shader.u_color4_loc, [1.0, 0.0, 0.0, 1.0]); //.***
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	//gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);

	gl.uniform1i(shader.u_processType_loc, 1); // 0 = overWriteDEM, 1 = excavation.
	
	gl.disable(gl.CULL_FACE);
	gl.clear(gl.DEPTH_BUFFER_BIT);

	// In excavation must render as CW.***
	gl.frontFace(gl.CW);

	var renderType = 0;
	var refMatrixIdxKey = 0;
	var glPrimitive = undefined;

	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	for(var i=0; i<visibleNativesOpaquesCount; i++)
	{
		var native = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray[i];
		if (native.name === "excavationObject")
		{ 
			native.render(magoManager, shader, renderType, glPrimitive); 
			native.setDeleted(true);// Once used, set as "deleted".
			// objects marked sa "deleted" will be deleted in "magoManager.tilesMultiFrustumCullingFinished()"" function.
		}
	}

	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;
	for(var i=0; i<visibleNativesTransparentsCount; i++)
	{
		var native = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray[i];
		if (native.name === "excavationObject")
		{ 
			native.render(magoManager, shader, renderType, glPrimitive); 
			native.setDeleted(true);// Once used, set as "deleted".
			// objects marked sa "deleted" will be deleted in "magoManager.tilesMultiFrustumCullingFinished()"" function.
		}
	}
	
	// return gl defaults.
	fbo.unbind();
	gl.enable(gl.CULL_FACE);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null); 
	gl.frontFace(gl.CCW);

	// finally copy the dem with excavations in "dem_withExcavation"
	if (magoManager.isFarestFrustum())
	{ 
		// We must copy "dem_texture" into "demWithBuildingsTex" to preserve the "dem_texture".
		// There are the original tile DEM texture named : "dem_texture".
		// In this function we copy the "dem_texture" into "demWithBuildingsTex".
		// Note : "dem_texture" can have excavations.
		var bFlipTexcoordY = false;
		this.copyTexture(this.dem_texture_A, [this.dem_withExcavation], bFlipTexcoordY);
	}
};

Water.prototype.overWriteDEMWithObjects = function (shader, magoManager)
{
	// render extrudeObjects depth over the DEM depth texture.
	if (!this.visibleObjectsControler)
	{ return; }

	if(!this.isPrepared())
	{ return; }

	if(!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	var visibleNodesCount = this.visibleObjectsControler.currentVisibles0.length;
	var modelViewProjMatrix = this.getTileOrthographic_mvpMat();

	var waterManager = this.waterManager;
	var gl = magoManager.getGl();
	var fbo = this.waterManager.fbo; // simulation fbo. (512 x 512).
	var extbuffers = fbo.extbuffers;
	var shader;

	// 1rst, copy the terrain depth into "this.demWithBuildingsTex".************************************************************************************
	if (magoManager.isFarestFrustum())
	{ 
		// We must copy "dem_texture" into "demWithBuildingsTex" to preserve the "dem_texture".
		// There are the original tile DEM texture named : "dem_texture".
		// In this function we copy the "dem_texture" into "demWithBuildingsTex".
		// Note : "dem_texture" can have excavations.
		var bFlipTexcoordY = false;
		this.copyTexture(this.dem_texture_A, [this.demWithBuildingsTex], bFlipTexcoordY);
	}

	gl.disable(gl.BLEND);
	gl.clearColor(1.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0);
	

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

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.dem_texture_A.texId);  // original.***

	
	// 1rst, create a local coords system:
	// the center of the water tile is origin.
	shader = magoManager.postFxShadersManager.getShader("waterOrthogonalDepthRender");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, modelViewProjMatrix._floatArrays);
	gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	gl.uniform4fv(shader.u_color4_loc, [1.0, 0.0, 0.0, 1.0]); //.***
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	//gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);

	gl.uniform1i(shader.u_processType_loc, 0); // 0 = overWriteDEM, 1 = excavation.
	
	gl.disable(gl.CULL_FACE);
	gl.clear(gl.DEPTH_BUFFER_BIT);

	var renderType = 0;
	var refMatrixIdxKey = 0;
	var glPrimitive = undefined;
	
	for(var i=0; i<visibleNodesCount; i++)
	{
		var node = this.visibleObjectsControler.currentVisibles0[i];
		node.renderContent(magoManager, shader, renderType, refMatrixIdxKey);
	}

	var visibleNativesOpaquesCount = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;
	for(var i=0; i<visibleNativesOpaquesCount; i++)
	{
		var native = this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray[i];
		if (native.name !== "contaminationGenerator" && native.name !== "excavationObject" && native.name !== "waterGenerator")
		{ native.render(magoManager, shader, renderType, glPrimitive); }
	}

	var visibleNativesTransparentsCount = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray.length;
	for(var i=0; i<visibleNativesTransparentsCount; i++)
	{
		var native = this.visibleObjectsControler.currentVisibleNativeObjects.transparentsArray[i];
		if (native.name !== "contaminationGenerator" && native.name !== "excavationObject" && native.name !== "waterGenerator")
		{ native.render(magoManager, shader, renderType, glPrimitive); }
	}
	
	gl.enable(gl.CULL_FACE);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null); 
	gl.frontFace(gl.CCW);
};

Water.prototype._renderQMesh = function (magoManager)
{
	// This function is a test function, to render the qmesh.***
	// Test function to render qSurface in excavation.***
	// Test function to render qSurface in excavation.***
	// Test function to render qSurface in excavation.***
	if(!this.isPrepared())
	{ return; }

	if(!this.qMeshVboKeyContainer)
	{
		return;
	}
	
	var waterManager = this.waterManager;
	var magoManager = waterManager.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.getGl();
	var shader;


	//gl.disable(gl.BLEND);
	//gl.disable(gl.CULL_FACE);


	var shader = magoManager.postFxShadersManager.getShader("qMeshRenderTEST");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	gl.uniform4fv(shader.u_oneColor4_loc, [1.0, 0.5, 0.25, 1.0]);
	gl.uniform3fv(shader.buildingPosHIGH_loc, this.terrainPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, this.terrainPositionLOW);
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.buildingGeoLocMat._floatArrays);

	// Now, set the waterSimGeoExtent & the qMeshGeoExtent.
	
	//var geoExtent = qMesh.geoExtent;
	//gl.uniform3fv(shader.u_totalMinGeoCoord_loc, [geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]);
	//gl.uniform3fv(shader.u_totalMaxGeoCoord_loc, [geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]);

	//var tileGeoExtent = qMesh.geoExtent;
	//gl.uniform3fv(shader.u_currentMinGeoCoord_loc, [geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]);
	//gl.uniform3fv(shader.u_currentMaxGeoCoord_loc, [geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]);
	


	var vbo_vicky = this.qMeshVboKeyContainer.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;

	// Bind positions.
	vbo_vicky.vboBufferPos.bindData(shader, shader.a_pos, vboMemManager);
	
	//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
	//{ return false; }

	//if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
	//{ return false; }

	if(vbo_vicky.vboBufferCol)
	{
		vbo_vicky.vboBufferCol.bindData(shader, shader.color4_loc, vboMemManager);
	}

	var indicesCount = vbo_vicky.indicesCount;
	if (!vbo_vicky.bindDataIndice(shader, magoManager.vboMemoryManager))
	{ return false; }

	// Render in traditional mode.***
	/*
	gl.uniform1i(shader.colorType_loc, 1);
	gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); 

	gl.uniform1i(shader.colorType_loc, 0);
	gl.disable(gl.DEPTH_TEST);
	gl.drawElements(gl.LINES, indicesCount, gl.UNSIGNED_SHORT, 0); 
	*/

	// Render triangle one by one.**********************************************************
	var triCount = indicesCount/3.0;
	if(!this.randomColorsArray)
	{
		this.randomColorsArray = [];
		for(var i=0; i<triCount; i++)
		{
			this.randomColorsArray.push([Math.random()*0.5, Math.random()*0.5, Math.random()*0.5, 1.0]);
		}
	}
	
	var byteOffset;
	gl.uniform1i(shader.colorType_loc, 1);
	for(var i=0; i<triCount; i++)
	{
		byteOffset = i*3*2;
		gl.uniform4fv(shader.u_oneColor4_loc, this.randomColorsArray[i]);
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, byteOffset); 
	}


};

/**
 * render
 */
Water.prototype.renderWater = function (shader, magoManager)
{
	if(!this.isPrepared())
	{ return; }

	if(!this.prepareTextures()) // textures that must be loaded.
	{ return false; }

	var waterManager = this.waterManager;

	// make the vboKey:*****************************************************************************
	if (this.vbo_vicks_container === undefined)
	{ 
		this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer(); 
		var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
		vboCacheKey.setDataArrayPos(this.posBuffer, magoManager.vboMemoryManager);
		vboCacheKey.setDataArrayTexCoord(this.texCoordBuffer, magoManager.vboMemoryManager);
	}

	var waterTextureType = 0;
	if(waterManager.bRenderParticles)
	{
		waterTextureType = 3;
	}

	var gl = magoManager.getGl();
	var sceneState = this.waterManager.magoManager.sceneState;
	// note: shader uniformGenerals binded at waterManager.
	gl.uniform3fv(shader.buildingPosHIGH_loc, this.terrainPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, this.terrainPositionLOW);
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.buildingGeoLocMat._floatArrays);
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, this.terrainMinMaxHeights);
	gl.uniform2fv(shader.u_screenSize_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	gl.uniform1i(shader.uWaterType_loc, waterTextureType); // 0 = waterColor., 1 = water-flux, 2 = water-velocity, 3= particles.
	gl.uniform1f(shader.u_waterMaxHeigh_loc, this.waterMaxHeight);
	gl.uniform1f(shader.u_contaminantMaxHeigh_loc, this.contaminantMaxheight);
	gl.uniform2fv(shader.u_tileSize_loc, [this.tileSizeMeters_x, this.tileSizeMeters_y]);
	gl.uniform2fv(shader.u_simulationTextureSize_loc, waterManager.simulationTextureSize);
	gl.uniform2fv(shader.u_terrainTextureSize_loc, waterManager.terrainTextureSize);


	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
  	gl.uniformMatrix4fv(shader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);

	gl.activeTexture(gl.TEXTURE0);
	//gl.bindTexture(gl.TEXTURE_2D, this.waterManager.depthTex.texId);  // .***
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.waterHeightTexA.texId);

	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, this.demWithBuildingsTex.texId);//dem_texture//demWithBuildingsTex

	if(waterManager.bRenderParticles)
	{
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, this.particlesTex_A.texId);// waterFluxTexA, waterVelocityTexA, particlesTex_A
	}

	if(this.contaminantMaxheight > 0.0)
	{
		gl.activeTexture(gl.TEXTURE4); // contaminant tex if exist.
		gl.bindTexture(gl.TEXTURE_2D, this.contaminationTex_B.texId);
	}


	var vbo_vicky = this.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }
	
	//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
	//{ return false; }

	if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
	{ return false; }
	gl.enable(gl.BLEND);
	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	//gl.drawArrays(gl.LINES, 0, vertices_count);

	gl.disable(gl.BLEND);

	for(var i=0; i<5; i++)
	{
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
};

Water.prototype._makeSurface = function ()
{
	// CRS84.***
	var lonSegments = this.waterManager.simulationTextureSize[0];
	var latSegments = this.waterManager.simulationTextureSize[1];

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

	if(!this.cartesiansArray)
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
		bCalculateBorderIndices: true,
		indicesByteSize : 4 // In this case (waterTiles) must calculate indices in Uint32, because here vertexCount is greater than max_shortSize..
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
	for(var i=0; i<indicesCount; i++)
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
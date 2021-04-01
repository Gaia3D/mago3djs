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
	this.textureWidth = 512;
	this.textureHeight = 512;

	// The water renderable surface.
	this.surface; // tile size surface, with 512 x 512 points (as DEM texture size).

	if(options)
	{
		if(options.geographicExtent)
		{
			this.geographicExtent = options.geographicExtent;
		}
	}
};

/**
 * Makes the surface that represents the water.
 */
 Water._makeSurface__ = function()
 {
	// The tile DEM size is 512 x 512.
	var width = 512;
	var height = 512;
	var pointsCount = width * height;

	// Make positions.
	var posBuffer = new Float32Array(pointsCount * 3);
	for (var i=0; i<width; i++)
	{
		for (var j=0; j<height; j++)
		{
			//
		}
	}
 };

 Water.prototype._makeSurface = function ()
{
	// CRS84.***
	var lonSegments = 512;
	var latSegments = 512;
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
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
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

};

 /**
 * render
 */
  Water.prototype.isPrepared = function()
  {
	if(!this.surface)
	{ return false; }

	return true;
  };

/**
 * render
 */
Water.prototype.render = function (shader, magoManager)
{
	if(!this.isPrepared())
	{
		this._makeSurface();
		return;
	}

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
	gl.uniform2fv(shader.u_heightMap_MinMax_loc, [100.0, 1000.0]);

	var vbo_vicky = this.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }
	
	//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
	//{ return false; }

	if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);

	var gl = magoManager.getGl();
	var hola = 0;
};
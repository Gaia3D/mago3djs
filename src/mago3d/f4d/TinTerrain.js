'use strict';

/**
 * @class TinTerrain
 */
var TinTerrain = function() 
{
	if (!(this instanceof TinTerrain)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.owner; // undefined if depth = 0.***
	this.geographicExtent;
	this.fileLoadState = 0;
	this.dataArrayBuffer;
	this.vboKeyContainer; // class: VBOVertexIdxCacheKeysContainer.***
	this.terrainPositionHIGH;
	this.terrainPositionLOW;
	this.pathName; // example: "14//4567//516".***
	this.texture;
};

TinTerrain.prototype.makeMesh = function(lonSegments, latSegments, altitude)
{
	// This function makes an ellipsoidal mesh for tiles that has no elevation data.***
	var degToRadFactor = Math.PI/180.0;
	var minLon = this.geographicExtent.minGeographicCoord.longitude * degToRadFactor;
	var minLat = this.geographicExtent.minGeographicCoord.latitude * degToRadFactor;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude * degToRadFactor;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	
	var lonIncreDeg = lonRange/lonSegments;
	var latIncreDeg = latRange/latSegments;
	
	// use a vertexMatrix to make the regular net.***
	var vertexMatrix;
	
	// calculate total verticesCount.***
	var vertexCount = (lonSegments + 1)*(latSegments + 1);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	this.texCoordsArray = new Float32Array(vertexCount*2);
	
	var currLon = minLon; // init startLon.***
	var currLat = minLat; // init startLat.***
	var idx = 0;
	
	// check if exist altitude.***
	var alt = 0;
	if (altitude)
	{ alt = altitude; }
	
	for (var currLatSeg = 0; currLatSeg<latSegments+1; currLatSeg++)
	{
		currLon = minLon;
		for (var currLonSeg = 0; currLonSeg<lonSegments+1; currLonSeg++)
		{
			lonArray[idx] = currLon;
			latArray[idx] = currLat;
			altArray[idx] = alt;

			// make texcoords.***
			this.texCoordsArray[idx*2] = (currLon - minLon)/lonRange;
			this.texCoordsArray[idx*2+1] = (currLat - minLat)/latRange;
			
			if (this.texCoordsArray[idx*2] > 1.0 || this.texCoordsArray[idx*2+1] > 1.0)
			{ var hola = 0; }
			
			// actualize current values.***
			currLon += lonIncreDeg;
			idx++;
		}
		currLat += latIncreDeg;
	}
	
	this.cartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, this.cartesiansArray);
	
	// finally make indicesArray.***
	var numCols = lonSegments + 1;
	var numRows = latSegments + 1;
	this.indices = this.getIndicesTrianglesRegularNet(numCols, numRows, undefined);
};

TinTerrain.prototype.getIndicesTrianglesRegularNet = function(numCols, numRows, resultIndicesArray)
{
	// given a regular net this function returns triangles indices of the net.***
	var verticesCount = numCols * numRows;
	var trianglesCount = (numCols-1) * (numRows-1) * 2;
	if (resultIndicesArray === undefined)
	{ resultIndicesArray = new Uint16Array(trianglesCount * 3); }
	
	var idx_1, idx_2, idx_3;
	var idxCounter = 0;
	
	for (var row = 0; row<numRows-1; row++)
	{
		for (var col=0; col<numCols-1; col++)
		{
			// there are 2 triangles: triA, triB.***
			idx_1 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row);
			idx_2 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row);
			idx_3 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row+1);
			resultIndicesArray[idxCounter] = idx_1; idxCounter++;
			resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			
			idx_1 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row);
			idx_2 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row+1);
			idx_3 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row+1);
			resultIndicesArray[idxCounter] = idx_1; idxCounter++;
			resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			resultIndicesArray[idxCounter] = idx_3; idxCounter++;
		}
	}
	
	return resultIndicesArray;
};

TinTerrain.prototype.zigZagDecode = function(value)
{
	return (value >> 1) ^ (-(value & 1));
};

TinTerrain.prototype.makeVbo = function()
{
	if (this.cartesiansArray === undefined)
	{ return; }
	
	// rest the CenterPosition to the this.cartesiansArray.***
	var coordsCount = this.cartesiansArray.length/3;
	for (var i=0; i<coordsCount; i++)
	{
		this.cartesiansArray[i*3] -= this.centerX;
		this.cartesiansArray[i*3+1] -= this.centerY;
		this.cartesiansArray[i*3+2] -= this.centerZ;
	}
	
	if (this.terrainPositionHIGH === undefined)
	{ this.terrainPositionHIGH = new Float32Array(3); }

	if (this.terrainPositionLOW === undefined)
	{ this.terrainPositionLOW = new Float32Array(3); }
	ManagerUtils.calculateSplited3fv([this.centerX[0], this.centerY[0], this.centerZ[0]], this.terrainPositionHIGH, this.terrainPositionLOW);
	
	if (this.vboKeyContainer === undefined)
	{ this.vboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKey = this.vboKeyContainer.newVBOVertexIdxCacheKey();
	vboKey.posVboDataArray = this.cartesiansArray;
	vboKey.tcoordVboDataArray = this.texCoordsArray;
	vboKey.idxVboDataArray = this.indices;
	vboKey.indicesCount = this.indices.length;
	/*
	if (normal)
	{ vboKey.norVboDataArray = Int8Array.from(norArray); }
	
	if (color)
	{ vboKey.colVboDataArray = Uint8Array.from(colArray); }
	
*/
};

TinTerrain.prototype.decodeData = function()
{
	if (this.geographicExtent === undefined)
	{ return; }
	
	if (this.vertexArray === undefined)
	{ this.vertexArray = []; }
	
	var degToRadFactor = Math.PI/180.0;
	// latitude & longitude in RADIANS.***
	var minLon = this.geographicExtent.minGeographicCoord.longitude * degToRadFactor;
	var minLat = this.geographicExtent.minGeographicCoord.latitude * degToRadFactor;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude * degToRadFactor;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	
	var minHeight = this.minHeight[0];
	var maxHeight = this.maxHeight[0];
	var heightRange = maxHeight - minHeight;
	
	var vertexCount = this.vertexCount[0];
	this.texCoordsArray = new Float32Array(vertexCount*2);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	var shortMax = 32767; // 65536
	var lonRangeDivShortMax = lonRange/shortMax;
	var latRangeDivShortMax = latRange/shortMax;
	var heightRangeDivShortMax = heightRange/shortMax;
	var uValues = this.uValues;
	var vValues = this.vValues;
	var hValues = this.hValues;
	for (var i=0; i<vertexCount; i++)
	{
		lonArray[i] = minLon + uValues[i]*lonRangeDivShortMax;
		latArray[i] = minLat + vValues[i]*latRangeDivShortMax;
		altArray[i] = minHeight + hValues[i]*heightRangeDivShortMax + 2.0;
		
		// Test.***
		//altArray[i] *= 3;
		
		// make texcoords.***
		this.texCoordsArray[i*2] = uValues[i]/shortMax;
		this.texCoordsArray[i*2+1] = vValues[i]/shortMax;
	}
	
	this.cartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, this.cartesiansArray);
	
	// free memory.***
	this.uValues = undefined;
	this.vValues = undefined;
	this.hValues = undefined;
	
	lonArray = undefined;
	latArray = undefined;
	altArray = undefined;
	
};

TinTerrain.prototype.parseData = function(dataArrayBuffer)
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytes_readed = 0;
	
	// 1. header.***
	this.centerX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.centerY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.centerZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	this.minHeight = new Float32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	this.maxHeight = new Float32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	
	this.boundingSphereCenterX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.boundingSphereCenterY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.boundingSphereCenterZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.boundingSphereRadius = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	this.horizonOcclusionPointX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.horizonOcclusionPointY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.horizonOcclusionPointZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	// 2. vertex data.***
	this.vertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	var vertexCount = this.vertexCount[0];
	this.uValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	this.vValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	this.hValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	
	// decode data.***
	var u = 0;
	var v = 0;
	var height = 0;
	for (var i=0; i<vertexCount; i++)
	{
		u += this.zigZagDecode(this.uValues[i]);
		v += this.zigZagDecode(this.vValues[i]);
		height += this.zigZagDecode(this.hValues[i]);
		
		this.uValues[i] = u;
		this.vValues[i] = v;
		this.hValues[i] = height;
	}
	
	// 3. indices.***
	this.trianglesCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
	var trianglesCount = this.trianglesCount;
	if (vertexCount > 65536 )
	{
		this.indices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * trianglesCount * 3)); bytes_readed += 4 * trianglesCount * 3;
	}
	else 
	{
		this.indices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * trianglesCount * 3)); bytes_readed += 2 * trianglesCount * 3;
	}
	
	// decode indices.***
	var code;
	var highest = 0;
	var indicesCount = this.indices.length;
	for (var i=0; i<indicesCount; i++)
	{
		code = this.indices[i];
		this.indices[i] = highest - code;
		if (code === 0) 
		{
			++highest;
		}
	}
	
	// 4. edges indices.***
	if (vertexCount > 65536 )
	{
		this.westVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.westIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * this.westVertexCount)); bytes_readed += 4 * this.westVertexCount;
		
		this.southVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.southIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * this.southVertexCount)); bytes_readed += 4 * this.southVertexCount;
		
		this.eastVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.eastIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * this.eastVertexCount)); bytes_readed += 4 * this.eastVertexCount;
		
		this.northVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.northIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * this.northVertexCount)); bytes_readed += 4 * this.northVertexCount;
	}
	else
	{
		this.westVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.westIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * this.westVertexCount)); bytes_readed += 2 * this.westVertexCount;
		
		this.southVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.southIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * this.southVertexCount)); bytes_readed += 2 * this.southVertexCount;
		
		this.eastVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.eastIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * this.eastVertexCount)); bytes_readed += 2 * this.eastVertexCount;
		
		this.northVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.northIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * this.northVertexCount)); bytes_readed += 2 * this.northVertexCount;
	}
	
	// 5. extension header.***
	this.extensionId = new Uint8Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 1)); bytes_readed += 1;
	this.extensionLength = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
	
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	
	if (this.extensionId.length === 0)
	{
		dataArrayBuffer = undefined;
		return;
	}
	
	dataArrayBuffer = undefined;
};





















































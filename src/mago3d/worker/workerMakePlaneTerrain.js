'use strict';

var worker = self;

worker.onmessage = function (e) 
{
    // WEB_MERCATOR.
	// This function makes an ellipsoidal mesh for tiles that has no elevation data.
    var degToRadFactor = Math.PI/180.0;
    var data = e.data;
    var minLon = data.info.minGeographicLongitude * degToRadFactor;
	var minLat = data.info.minGeographicLatitude * degToRadFactor;
	var maxLon = data.info.maxGeographicLongitude * degToRadFactor;
	var maxLat = data.info.maxGeographicLatitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;

    var lonSegments = data.info.lonSegments;
    var latSegments = data.info.latSegments;
    var altitude = data.info.altitude;

    var texCorrectionFactor = data.info.texCorrectionFactor;
	
	var minHeight = new Float32Array([0]); 
	var maxHeight = new Float32Array([0]);
	
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	var depth = data.info.z;
    var bMakeNormals = data.info.bMakeNormals;
	var imageryType = data.info.imageryType;
	
	var lonIncreDeg = lonRange/lonSegments;
	var latIncreDeg = latRange/latSegments;
	
	// calculate total verticesCount.
	var vertexCount = (lonSegments + 1)*(latSegments + 1);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	var texCoordsArray = new Float32Array(vertexCount*2);
	
	var currLon = minLon; // init startLon.
	var currLat = minLat; // init startLat.
	var idx = 0;
	var s, t;

	var PI = Math.PI;
	var aConst = (1.0/(2.0*PI))*Math.pow(2.0, depth);
	
	// check if exist altitude.
	var alt = 0;
	if (altitude)
	{ alt = altitude; }
	
	// https://en.wikipedia.org/wiki/Web_Mercator_projection
	var PI_DIV_4 = PI/4;
	var minT = Math.round(aConst*(PI-Math.log(Math.tan(PI_DIV_4+minLat/2))));
	var maxT = Math.round(aConst*(PI-Math.log(Math.tan(PI_DIV_4+maxLat/2))));
	var minS = Math.round(aConst*(minLon+PI));
	var maxS = Math.round(aConst*(maxLon+PI));
	var floorMinS = Math.floor(minS);
	
	// Flip texCoordY for minT & maxT.***
	minT = 1.0 - minT;
	maxT = 1.0 - maxT;

    var altitudesSlice = undefined; // for future use.
	
	for (var currLatSeg = 0; currLatSeg < latSegments + 1; currLatSeg++)
	{
		currLat = minLat + latIncreDeg * currLatSeg;
		if (currLat > maxLat)
		{ currLat = maxLat; }
	
		t = aConst*(PI-Math.log(Math.tan(PI_DIV_4+currLat/2)));
		t = 1.0 - t;
			
		// Substract minT to "t" to make range [0 to 1].***
		t -= minT; 

		if (s<0.0)
		{ s = 0.0; }
		else if (s>1.0)
		{ s = 1.0; }

		if (t<0.0)
		{ t = 0.0; }
		else if (t>1.0)
		{ t = 1.0; }
		
		// Texture correction in borders.***
		/*
		if (currLatSeg === 0)
		{
			t = (texCorrectionFactor);
		}
		else if (currLatSeg === latSegments)
		{
			t = (1-texCorrectionFactor);
		}
		*/
		
		for (var currLonSeg = 0; currLonSeg<lonSegments+1; currLonSeg++)
		{
			currLon = minLon + lonIncreDeg * currLonSeg;
			
			if (currLon > maxLon)
			{ currLon = maxLon; }
			
			lonArray[idx] = currLon;
			latArray[idx] = currLat;
			// Now set the altitude.
			if (altitudesSlice)
			{
				//altArray[idx] = altitudesSlice.getValue(currLonSeg, currLatSeg);
				altArray[idx] = altitudesSlice[idx];
			}
			else
			{ altArray[idx] = alt; }

			s = aConst*(currLon+PI);
			s -= floorMinS;
			
			// Texture correction in borders.***
			if (currLonSeg === 0)
			{
				s += texCorrectionFactor/2;
			}
			else if (currLonSeg === lonSegments)
			{
				s += -texCorrectionFactor/2;
			}
			
			texCoordsArray[idx*2] = s;
			texCoordsArray[idx*2+1] = t;
			
			// actualize current values.
			idx++;
		}
	}

    // Calculate the center position.***
    var centerX;
    var centerY;
    var centerZ;
    if (depth === 0)
	{
		centerX = new Float64Array([0]);
		centerY = new Float64Array([0]);
		centerZ = new Float64Array([0]);
	}
	else
	{
        // Calculate the midGeoCoord of the tile.***
        var centerLon = (maxLon + minLon)/2.0;
		var centerLat = (maxLat + minLat)/2.0;
		
		var resultCartesian;
		//resultCartesian = Globe.geographicToCartesianWgs84(centerLon, centerLat, altitude, resultCartesian);
        resultCartesian = geographicRadianArrayToFloat32ArrayWgs84([centerLon*degToRadFactor], [centerLat*degToRadFactor], [altitude], undefined, 0, 0, 0)
		
		// Float64Array.
		centerX = new Float64Array([resultCartesian[0]]);
		centerY = new Float64Array([resultCartesian[1]]);
		centerZ = new Float64Array([resultCartesian[2]]);
	}

	
	var cartesiansArray = geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, undefined, 0, 0, 0);
	var normalsArray;
	if (bMakeNormals)
	{	
		// Make normals using the cartesians.***
        normalsArray = new Int8Array(vertexCount*3);
        var point = new Point3D_();
        for (var i=0; i<vertexCount; i++)
        {
            point.set(cartesiansArray[i*3], cartesiansArray[i*3+1], cartesiansArray[i*3+2]);
            point.unitary();
            
            normalsArray[i*3] = point.x*126;
            normalsArray[i*3+1] = point.y*126;
            normalsArray[i*3+2] = point.z*126;
        }
	}

    // After calculate normals, convert cartesian rel to center.***
	var cartesiansCount = cartesiansArray.length/3;
	for(var i=0; i<cartesiansCount; i++)
	{
		cartesiansArray[i*3] -= centerX[0];
		cartesiansArray[i*3+1] -= centerY[0];
		cartesiansArray[i*3+2] -= centerZ[0];
	}
	
	// finally make indicesArray.
	var numCols = lonSegments + 1;
	var numRows = latSegments + 1;
	var options = {
		bCalculateBorderIndices: true
	};
	
	var resultObject = getIndicesTrianglesRegularNet(numCols, numRows, undefined, undefined, undefined, undefined, undefined, options);
	var indices = resultObject.indicesArray;
	var southIndices = resultObject.southIndicesArray;
	var eastIndices = resultObject.eastIndicesArray;
	var northIndices = resultObject.northIndicesArray;
	var westIndices = resultObject.westIndicesArray;
	
	var westVertexCount = westIndices.length;
	var southVertexCount = southIndices.length;
	var eastVertexCount = eastIndices.length;
	var northVertexCount = northIndices.length;
	
	// make skirtMesh data.
	var options = {
		skirtDepth          : 10000,
		texCorrectionFactor : texCorrectionFactor
	};

	var skirtResultObject = getSkirtTrianglesStrip(lonArray, latArray, altArray, texCoordsArray, southIndices, eastIndices, northIndices, westIndices, options);
	var skirtCartesiansArray = skirtResultObject.skirtCartesiansArray;
	var skirtTexCoordsArray = skirtResultObject.skirtTexCoordsArray;
    var skirtAltitudesArray = skirtResultObject.skirtAltitudesArray;

	var cartesiansCount = skirtCartesiansArray.length/3;
	for(var i=0; i<cartesiansCount; i++)
	{
		skirtCartesiansArray[i*3] -= centerX;
		skirtCartesiansArray[i*3+1] -= centerY;
		skirtCartesiansArray[i*3+2] -= centerZ;
	}
	
	var boundingSphereCenterX = centerX; 
	var boundingSphereCenterY = centerY; 
	var boundingSphereCenterZ = centerZ;
    var boundingSphereRadius = 1000.0;

    var horizonOcclusionPointX = 0; // provisionally.
	var horizonOcclusionPointY = 0; // provisionally.
	var horizonOcclusionPointZ = 0; // provisionally.

    var extensionId = undefined;
    var extensionLength = 0;

    worker.postMessage({parsedTerrain: {
		texCoordsArray       : texCoordsArray,   
		cartesiansArray      : cartesiansArray,
		skirtCartesiansArray : skirtCartesiansArray,
		skirtTexCoordsArray  : skirtTexCoordsArray, 
		skirtAltitudesArray  : skirtAltitudesArray,
		altArray             : altArray,
		normalsArray         : normalsArray,
		longitudesArray      : lonArray,
		latitudesArray       : latArray,
		centerX                : centerX,   
		centerY                : centerY,
		centerZ                : centerZ,
		minHeight              : minHeight, 
		maxHeight              : maxHeight,
		boundingSphereCenterX  : boundingSphereCenterX,
		boundingSphereCenterY  : boundingSphereCenterY,
		boundingSphereCenterZ  : boundingSphereCenterZ,
		boundingSphereRadius   : boundingSphereRadius,
		horizonOcclusionPointX : horizonOcclusionPointX,
		horizonOcclusionPointY : horizonOcclusionPointY,
		horizonOcclusionPointZ : horizonOcclusionPointZ,
		indices                : indices,
		westIndices            : westIndices,
		southIndices           : southIndices,
		eastIndices            : eastIndices,
		northIndices           : northIndices,
		extensionId            : extensionId,
		extensionLength        : extensionLength
	}, info: e.data.info});
};

function geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, resultCartesianArray, centerX, centerY, centerZ)
{
	// defined in the LINZ standard LINZS25000 (Standard for New Zealand Geodetic Datum 2000)
	// https://www.linz.govt.nz/data/geodetic-system/coordinate-conversion/geodetic-datum-conversions/equations-used-datum
	// a = semi-major axis.
	// e2 = firstEccentricitySquared.
	// v = a / sqrt(1 - e2 * sin2(lat)).
	// x = (v+h)*cos(lat)*cos(lon).
	// y = (v+h)*cos(lat)*sin(lon).
	// z = [v*(1-e2)+h]*sin(lat).
	var equatorialRadius = 6378137.0; // meters.
	var firstEccentricitySquared = 6.69437999014E-3;
    
	var lonRad;
	var latRad;
	var cosLon;
	var cosLat;
	var sinLon;
	var sinLat;
	var a = equatorialRadius;
	var e2 = firstEccentricitySquared;
	var e2a = 1.0 - e2;
	var v;
	var h;
    
	var coordsCount = lonArray.length;
	if (resultCartesianArray === undefined)
	{
		resultCartesianArray = new Float32Array(coordsCount*3);
	}

    if(!centerX) centerX = 0.0;
    if(!centerY) centerY = 0.0;
    if(!centerZ) centerZ = 0.0;

	for (var i=0; i<coordsCount; i++)
	{
		lonRad = lonArray[i];
		latRad = latArray[i];
		cosLon = Math.cos(lonRad);
		cosLat = Math.cos(latRad);
		sinLon = Math.sin(lonRad);
		sinLat = Math.sin(latRad);
		v = a/Math.sqrt(1.0 - e2 * sinLat * sinLat);
		h = altArray[i];
        
		resultCartesianArray[i*3] = (v+h)*cosLat*cosLon - centerX;
		resultCartesianArray[i*3+1] = (v+h)*cosLat*sinLon - centerY;
		resultCartesianArray[i*3+2] = (v*e2a+h)*sinLat - centerZ;
	}
    
	return resultCartesianArray;
};

function getIndicesTrianglesRegularNet(numCols, numRows, resultIndicesArray, resultSouthIndices, resultEastIndices, resultNorthIndices, resultWestIndices, options)
{
	// given a regular net this function returns triangles vertices indices of the net.
	var verticesCount = numCols * numRows;
	var trianglesCount = (numCols-1) * (numRows-1) * 2;
	if (resultIndicesArray === undefined)
	{ resultIndicesArray = new Uint16Array(trianglesCount * 3); }
	
	var idx_1, idx_2, idx_3;
	var idxCounter = 0;
	
	var resultObject = {};
	
	// bLoopColumns : if want object like a cilinder or sphere where the 1rstCol touch with the last col.
	var bLoopColumns = false; // Default.***
	var bTrianglesSenseCCW = true;
	if (options !== undefined)
	{
		if (options.bLoopColumns !== undefined)
		{ bLoopColumns = options.bLoopColumns; }
	
		if (options.bTrianglesSenseCCW !== undefined)
		{ bTrianglesSenseCCW = options.bTrianglesSenseCCW; }
	}
	
	for (var row = 0; row<numRows-1; row++)
	{
		for (var col=0; col<numCols-1; col++)
		{
			// there are 2 triangles: triA, triB.
			idx_1 = getIndexOfArray(numCols, numRows, col, row);
			idx_2 = getIndexOfArray(numCols, numRows, col+1, row);
			idx_3 = getIndexOfArray(numCols, numRows, col, row+1);
			
			if (bTrianglesSenseCCW)
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			}
			else
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			}
			
			idx_1 = getIndexOfArray(numCols, numRows, col+1, row);
			idx_2 = getIndexOfArray(numCols, numRows, col+1, row+1);
			idx_3 = getIndexOfArray(numCols, numRows, col, row+1);
			
			if (bTrianglesSenseCCW)
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			}
			else 
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			}
		}
	}
	
	resultObject.indicesArray = resultIndicesArray;
	
	var bCalculateBorderIndices = false;
	if (options)
	{
		if (options.bCalculateBorderIndices !== undefined && options.bCalculateBorderIndices === true)
		{ bCalculateBorderIndices = true; }
	}
	
	// Border indices.***
	if (bCalculateBorderIndices)
	{
		// South.
		if (!resultSouthIndices)
		{ resultSouthIndices = new Uint16Array(numCols); }
		
		for (var col=0; col<numCols; col++)
		{
			var idx = getIndexOfArray(numCols, numRows, col, 0);
			resultSouthIndices[col] = idx;
		}
		
		resultObject.southIndicesArray = resultSouthIndices;
		
		// East.
		if (!resultEastIndices)
		{ resultEastIndices = new Uint16Array(numRows); }
		
		for (var row = 0; row<numRows; row++)
		{
			var idx = getIndexOfArray(numCols, numRows, numCols-1, row);
			resultEastIndices[row] = idx;
		}
		
		resultObject.eastIndicesArray = resultEastIndices;
		
		// North.
		if (!resultNorthIndices)
		{ resultNorthIndices = new Uint16Array(numCols); }
		
		var counter = 0;
		for (var col=numCols-1; col>=0; col--)
		{
			var idx = getIndexOfArray(numCols, numRows, col, numRows-1);
			resultNorthIndices[counter] = idx;
			counter ++;
		}
		
		resultObject.northIndicesArray = resultNorthIndices;
		
		// West.
		if (!resultWestIndices)
		{ resultWestIndices = new Uint16Array(numRows); }
		
		counter = 0;
		for (var row = numRows-1; row>=0; row--)
		{
			var idx = getIndexOfArray(numCols, numRows, 0, row);
			resultWestIndices[counter] = idx;
			counter ++;
		}
		
		resultObject.westIndicesArray = resultWestIndices;
	}
	
	if (bLoopColumns)
	{
		var firstCol = 0;
		var endCol = numCols;
		for (var row = 0; row<numRows-1; row++)
		{
			// there are triangles between lastColumn & 1rstColumn.
			// there are 2 triangles: triA, triB.
			idx_1 = getIndexOfArray(numCols, numRows, endCol, row);
			idx_2 = getIndexOfArray(numCols, numRows, firstCol, row);
			idx_3 = getIndexOfArray(numCols, numRows, endCol, row+1);
			if (bTrianglesSenseCCW)
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			}
			else 
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			}
			
			idx_1 = getIndexOfArray(numCols, numRows, firstCol, row);
			idx_2 = getIndexOfArray(numCols, numRows, firstCol, row+1);
			idx_3 = getIndexOfArray(numCols, numRows, endCol, row+1);
			if (bTrianglesSenseCCW)
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			}
			else 
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			}
		}
	}
	
	return resultObject;
};

function getSkirtTrianglesStrip(lonArray, latArray, altArray, texCoordsArray, southIndices, eastIndices, northIndices, westIndices, options)
{
	// Given "lonArray", "latArray" & "altArray", this function makes skirtCartesiansArray & skirtTexCoordsArray.***
	// Note: skirtMesh is trianglesStrip, so, there are no indices.***
	var skirtDepth = 1000.0;
	var texCorrectionFactor = 1.0;
	var bMakeAltitudesArray = false;
	if (options)
	{
		if (options.skirtDepth !== undefined)
		{ skirtDepth = options.skirtDepth; }
	
		if (options.texCorrectionFactor !== undefined)
		{ texCorrectionFactor = options.texCorrectionFactor; }
	
		if (options.bMakeAltitudesArray)
		{ bMakeAltitudesArray = true; }
	}
	
	// Texture correction in borders & make skirt data.***
	var westVertexCount = westIndices.length;
	var southVertexCount = southIndices.length;
	var eastVertexCount = eastIndices.length;
	var northVertexCount = northIndices.length;
	
	var totalVertexCount = westVertexCount + southVertexCount + eastVertexCount + northVertexCount;
	
	var skirtLonArray = new Float32Array(totalVertexCount * 2);
	var skirtLatArray = new Float32Array(totalVertexCount * 2);
	var skirtAltArray = new Float32Array(totalVertexCount * 2);
	var skirtTexCoordsArray = new Float32Array(totalVertexCount * 4);
	var skinAltitudes = new Float32Array(totalVertexCount * 4);
	var counter = 0;
	
	for (var j=0; j<westVertexCount; j++)
	{
		var idx = westIndices[j];
		
		texCoordsArray[idx*2] += texCorrectionFactor;
		//var texCoord_x = texCoordsArray[idx*2];
		//var texCoord_y = texCoordsArray[idx*2+1];
		
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;

	}
	
	for (var j=0; j<southVertexCount; j++)
	{
		var idx = southIndices[j];
		
		texCoordsArray[idx*2+1] = (texCorrectionFactor);
		//var texCoord_x = texCoordsArray[idx*2];
		//var texCoord_y = texCoordsArray[idx*2+1]
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
	}
	
	for (var j=0; j<eastVertexCount; j++)
	{
		var idx = eastIndices[j];
		
		texCoordsArray[idx*2] -= texCorrectionFactor;
		//var texCoord_x = texCoordsArray[idx*2];
		//var texCoord_y = texCoordsArray[idx*2+1];
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
	}
	
	for (var j=0; j<northVertexCount; j++)
	{
		var idx = northIndices[j];
		
		
		texCoordsArray[idx*2+1] = (1-texCorrectionFactor);
		//var texCoord_x = texCoordsArray[idx*2];
		//var texCoord_y = texCoordsArray[idx*2+1];
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
	}
	
	var skirtCartesiansArray = geographicRadianArrayToFloat32ArrayWgs84(skirtLonArray, skirtLatArray, skirtAltArray, undefined);
	
	var resultObject = {
		skirtCartesiansArray : skirtCartesiansArray,
		skirtTexCoordsArray  : skirtTexCoordsArray,
		skirtAltitudesArray  : skirtAltArray
	};
	
	if (bMakeAltitudesArray)
	{
		resultObject.skirtAltitudesValuesArray = skinAltitudes;
	}
	
	return resultObject;
};


var Point3D_ = function(x, y, z) 
{
	this.x = 0;
	this.y = 0;
	this.z = 0;

	if (x !== undefined)
	{ this.x = x; }
	else
	{ this.x = 0.0; }
	
	if (y !== undefined)
	{ this.y = y; }
	else
	{ this.y = 0.0; }
	
	if (z !== undefined)
	{ this.z = z; }
	else
	{ this.z = 0.0; }
	
	this.pointType; // 1 = important point.
};
Point3D_.prototype.set = function(x, y, z) 
{
	this.x = x; this.y = y; this.z = z;
};
Point3D_.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y + this.z*this.z;
};
Point3D_.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

Point3D_.prototype.squareDistTo = function(x, y, z) 
{
	var dx = this.x - x;
	var dy = this.y - y;
	var dz = this.z - z;

	return dx*dx + dy*dy + dz*dz;
};

Point3D_.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
};

Point3D_.prototype.crossProduct = function(point, resultPoint) 
{
	if (resultPoint === undefined) { resultPoint = new Point3D_(); }

	resultPoint.x = this.y * point.z - point.y * this.z;
	resultPoint.y = point.x * this.z - this.x * point.z;
	resultPoint.z = this.x * point.y - point.x * this.y;

	return resultPoint;
};

Point3D_.prototype.addPoint = function(point) 
{
	this.x += point.x; this.y += point.y; this.z += point.z;
};

function getIndexOfArray(numCols, numRows, col, row) 
{
	// static function.
	var idx = col + row * numCols;
	return idx;
};
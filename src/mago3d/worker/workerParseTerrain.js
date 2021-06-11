'use strict';

var worker = self;

worker.onmessage = function (e) 
{
	// This worker parses & decodes the tinTerrain.***
	var dataArrayBuffer = e.data.dataArrayBuffer;
	var bytes_readed = 0;
	var data = e.data;
	
	// 1. header.
	var centerX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var centerY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var centerZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	var minHeight = new Float32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	var maxHeight = new Float32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	
	var boundingSphereCenterX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var boundingSphereCenterY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var boundingSphereCenterZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var boundingSphereRadius = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	var horizonOcclusionPointX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var horizonOcclusionPointY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var horizonOcclusionPointZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;

	// 2. vertex data.
	var readVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	var vertexCount = readVertexCount[0];
	var uValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	var vValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	var hValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;

	// decode data.
	var u = 0;
	var v = 0;
	var height = 0;
	for (var i=0; i<vertexCount; i++)
	{
		u += zigZagDecode(uValues[i]);
		v += zigZagDecode(vValues[i]);
		height += zigZagDecode(hValues[i]);
		
		uValues[i] = u;
		vValues[i] = v;
		hValues[i] = height;
	}
	
	// 3. indices.
	var readTrianglesCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
	var trianglesCount = readTrianglesCount[0];
	var indices;
	if (vertexCount > 65536 )
	{
		indices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * trianglesCount * 3)); bytes_readed += 4 * trianglesCount * 3;
	}
	else 
	{
		indices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * trianglesCount * 3)); bytes_readed += 2 * trianglesCount * 3;
	}
    
	// decode indices.
	var code;
	var highest = 0;
	var indicesCount = indices.length;
	for (var i=0; i<indicesCount; i++)
	{
		code = indices[i];
		indices[i] = highest - code;
		if (code === 0) 
		{
			++highest;
		}
	}
	
	// 4. edges indices.
	var westVertexCount;
	var westIndices;
	var southVertexCount;
	var southIndices;
	var eastVertexCount;
	var eastIndices;
	var northVertexCount;
	var northIndices;
   
	if (vertexCount > 65536 )
	{
		westVertexCount = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;
		westIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * westVertexCount)); bytes_readed += 4 * westVertexCount;
		
		southVertexCount = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;
		southIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * southVertexCount)); bytes_readed += 4 * southVertexCount;
		
		eastVertexCount = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;
		eastIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * eastVertexCount)); bytes_readed += 4 * eastVertexCount;
		
		northVertexCount = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;
		northIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * northVertexCount)); bytes_readed += 4 * northVertexCount;
	}
	else
	{
		westVertexCount = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;
		westIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * westVertexCount)); bytes_readed += 2 * westVertexCount;
		
		southVertexCount = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;
		southIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * southVertexCount)); bytes_readed += 2 * southVertexCount;
		
		eastVertexCount = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;
		eastIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * eastVertexCount)); bytes_readed += 2 * eastVertexCount;
		
		northVertexCount = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;
		northIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * northVertexCount)); bytes_readed += 2 * northVertexCount;
	}
	
	// 5. extension header.
	var extensionId = new Uint8Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 1)); bytes_readed += 1;
	var extensionLength = (new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)))[0]; bytes_readed += 4;

	// Decoding in this worker.*****************************************************************************************************************************
	// Decoding in this worker.*****************************************************************************************************************************
	// Decoding in this worker.*****************************************************************************************************************************
	var PI = Math.PI;
	var degToRadFactor = PI/180.0;
	
	var minLon = data.info.minGeographicLongitude * degToRadFactor;
	var minLat = data.info.minGeographicLatitude * degToRadFactor;
	var maxLon = data.info.maxGeographicLongitude * degToRadFactor;
	var maxLat = data.info.maxGeographicLatitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
    
	var heightRange = maxHeight[0] - minHeight[0];
    
	//넘길거
	var texCoordsArray = new Float32Array(vertexCount*2);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	var shortMax = 32767; // 65536
	var lonRangeDivShortMax = lonRange/shortMax;
	var latRangeDivShortMax = latRange/shortMax;
	var heightRangeDivShortMax = heightRange/shortMax;

	var depth = data.info.z;
	var bMakeNormals = data.info.bMakeNormals;

	var exageration = 2.0;
	var imageryType = data.info.imageryType;

	//WEB_MERCATOR
	var realmaxS, realmaxT, realminS, realminT;
	if (imageryType === 2)
	{
		// web_mercator.
		// https://en.wikipedia.org/wiki/Web_Mercator_projection
		var aConst = (1.0/(2.0*PI))*Math.pow(2.0, depth);
		var PI_DIV_4 = PI/4;
		var minT = Math.round(aConst*(PI-Math.log(Math.tan(PI_DIV_4+minLat/2))));
		var maxT = Math.round(aConst*(PI-Math.log(Math.tan(PI_DIV_4+maxLat/2))));
		var minS = Math.round(aConst*(minLon+PI));
		var maxS = Math.round(aConst*(maxLon+PI));
		var floorMinS = Math.floor(minS);
		var t, s;
		
		// Flip texCoordY for minT & maxT.***
		minT = 1.0 - minT;
		maxT = 1.0 - maxT;

		//var texCorrectionFactor = 0.0005;
		var texCorrectionFactor = 0.003 + (depth * 0.0000001);
		//var texCorrectionFactor = 0.002 + (1/(depth+1) * 0.008);

		for (var i=0; i<vertexCount; i++)
		{
			lonArray[i] = minLon + uValues[i]*lonRangeDivShortMax;
			latArray[i] = minLat + vValues[i]*latRangeDivShortMax;
			altArray[i] = minHeight[0] + hValues[i]*heightRangeDivShortMax;

			var currLon = lonArray[i];
			var currLat = latArray[i];
			
			// make texcoords.
			t = aConst*(PI-Math.log(Math.tan(PI_DIV_4+currLat/2)));

			//var t1 = t;
			t = 1.0 - t;

			//var t2 = t;
				
			// Substract minT to "t" to make range [0 to 1].***
			t -= minT; 
			//var t3 = t;
			
			s = aConst*(currLon+PI);
			s -= floorMinS;
			
			if ( s < 0.0 )
			{ s = 0.0; }
			else if ( s > 1.0 )
			{ s = 1.0; }

			if ( t < 0.0 )
			{ t = 0.0; }
			else if ( t > 1.0 )
			{ t = 1.0; }
			
			
			texCoordsArray[i*2] = s;
			texCoordsArray[i*2+1] = t;
		}
	}
	else
	{
		// crs84.
		for (var i=0; i<vertexCount; i++)
		{
			lonArray[i] = minLon + uValues[i]*lonRangeDivShortMax;
			latArray[i] = minLat + vValues[i]*latRangeDivShortMax;
			altArray[i] = minHeight[0] + hValues[i]*heightRangeDivShortMax;
			
			// make texcoords.
			texCoordsArray[i*2] = uValues[i]/shortMax;
			texCoordsArray[i*2+1] = vValues[i]/shortMax;
		}
	}


	//넘길거
	var cartesiansArray = geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, undefined, centerX[0], centerY[0], centerZ[0]);
	var normalsArray;
	if (bMakeNormals)
	{	
		normalsArray = getNormalCartesiansArray(cartesiansArray, indices, undefined, undefined);
	}

	var texCorrectionFactor = getTexCorrection(depth);

	// Do overlap for tiles.***
	/*
	var southIndices = param.southIndices;
	var indicesCount = southIndices.length;
	for (var i=0; i<indicesCount; i++)
	{
		var idx = southIndices[i];
		latArray[idx] -= latRange*0.05;
		altArray[idx] -= 3.0;
	}

	var northIndices = param.northIndices;
	var indicesCount = northIndices.length;
	for (var i=0; i<indicesCount; i++)
	{
		var idx = northIndices[i];
		latArray[idx] += latRange*0.05;
		altArray[idx] -= 3.0;
	}

	var westIndices = param.westIndices;
	var indicesCount = westIndices.length;
	for (var i=0; i<indicesCount; i++)
	{
		var idx = westIndices[i];
		lonArray[idx] -= latRange*0.05;
		altArray[idx] -= 3.0;
	}

	var eastIndices = param.eastIndices;
	var indicesCount = westIndices.length;
	for (var i=0; i<indicesCount; i++)
	{
		var idx = eastIndices[i];
		lonArray[idx] += latRange*0.05;
		altArray[idx] -= 3.0;
	}
	*/

	var options = {
		skirtDepth          : 500,
		texCorrectionFactor : texCorrectionFactor
	};
	var skirtResultObject = getSkirtTrianglesStrip(lonArray, latArray, altArray, texCoordsArray, southIndices, eastIndices, northIndices, westIndices, options, centerX[0], centerY[0], centerZ[0]);
	//넘길거
	var skirtCartesiansArray = skirtResultObject.skirtCartesiansArray;
	//넘길거
	var skirtTexCoordsArray = skirtResultObject.skirtTexCoordsArray;
	//넘길거
	var skirtAltitudesArray = skirtResultObject.skirtAltitudesArray;

	//넘길거
	var altArray = altArray;

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

function zigZagDecode(value)
{
	return (value >> 1) ^ (-(value & 1));
};

function getNormalCartesiansArray(cartesiansArray, indicesArray, resultNormalCartesiansArray, options)
{
	var idx_1, idx_2, idx_3;
	var point_1, point_2, point_3;
	var normal;
	var normalsArray = [];
	var trianglesCount = indicesArray.length/3;
	for (var i=0; i<trianglesCount; i++)
	{
		idx_1 = indicesArray[i*3];
		idx_2 = indicesArray[i*3+1];
		idx_3 = indicesArray[i*3+2];
		
		point_1 = new Point3D_(cartesiansArray[idx_1*3], cartesiansArray[idx_1*3+1], cartesiansArray[idx_1*3+2]);
		point_2 = new Point3D_(cartesiansArray[idx_2*3], cartesiansArray[idx_2*3+1], cartesiansArray[idx_2*3+2]);
		point_3 = new Point3D_(cartesiansArray[idx_3*3], cartesiansArray[idx_3*3+1], cartesiansArray[idx_3*3+2]);

		// Calculate the normal for this triangle.
		var resultObject = {
			area: 0
		};
		normal = calculateNormal(point_1, point_2, point_3, undefined, resultObject);
		var area = resultObject.area/1000.0;
		normal.x *= area;
		normal.y *= area;
		normal.z *= area;

		// test calculate triangle perimeter to ponderate the normal.
		//var perimeter = point_1.squareDistTo(point_2.x, point_2.y, point_2.z) + point_2.squareDistTo(point_3.x, point_3.y, point_3.z) + point_3.squareDistTo(point_1.x, point_1.y, point_1.z);
		//perimeter /= 1000.0;
		//normal.x *= perimeter;
		//normal.y *= perimeter;
		//normal.z *= perimeter;
		
		// Accum normals for each points.
		// Point 1.***
		if (normalsArray[idx_1] !== undefined)
		{
			normalsArray[idx_1].addPoint(normal);
		}
		else
		{
			normalsArray[idx_1] = new Point3D_(normal.x, normal.y, normal.z);
		}
		
		// Point 2.***
		if (normalsArray[idx_2] !== undefined)
		{
			normalsArray[idx_2].addPoint(normal);
		}
		else
		{
			normalsArray[idx_2] = new Point3D_(normal.x, normal.y, normal.z);
		}
		
		// Point 3.***
		if (normalsArray[idx_3] !== undefined)
		{
			normalsArray[idx_3].addPoint(normal);
		}
		else
		{
			normalsArray[idx_3] = new Point3D_(normal.x, normal.y, normal.z);
		}
	}
	
	// finally, normalize all normals.
	var normalsCount = normalsArray.length;
	if (resultNormalCartesiansArray === undefined)
	{ resultNormalCartesiansArray = new Int8Array(normalsCount*3); }
	
	for (var i=0; i<normalsCount; i++)
	{
		var normal = normalsArray[i];
		normal.unitary();
		
		resultNormalCartesiansArray[i*3] = Math.floor(normal.x*127);
		resultNormalCartesiansArray[i*3+1] = Math.floor(normal.y*127);
		resultNormalCartesiansArray[i*3+2] = Math.floor(normal.z*127);
	}
	
	return resultNormalCartesiansArray;
	
};



function calculateNormal(point1, point2, point3, resultNormal, resultObject) 
{
	// Given 3 points, this function calculates the normal.
	var currentPoint = point1;
	var prevPoint = point3;
	var nextPoint = point2;

	var v1 = new Point3D_(currentPoint.x - prevPoint.x,     currentPoint.y - prevPoint.y,     currentPoint.z - prevPoint.z);
	var v2 = new Point3D_(nextPoint.x - currentPoint.x,     nextPoint.y - currentPoint.y,     nextPoint.z - currentPoint.z);

	//v1.unitary();
	//v2.unitary();
	if (resultNormal === undefined)
	{ resultNormal = new Point3D_(); }
	
	resultNormal = v1.crossProduct(v2, resultNormal);

	resultObject.area = resultNormal.getModul() / 2;
	resultNormal.unitary();
	
	return resultNormal;
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

var texCorrection = [];

texCorrection[0] = 0.006;
texCorrection[1] = 0.006;
texCorrection[2] = 0.006;
texCorrection[3] = 0.006;
texCorrection[4] = 0.006;
texCorrection[5] = 0.006;
texCorrection[6] = 0.006;
texCorrection[7] = 0.006;
texCorrection[8] = 0.006;
texCorrection[9] = 0.006;
texCorrection[10] = 0.008;
texCorrection[11] = 0.008;
texCorrection[12] = 0.016;
texCorrection[13] = 0.016;
texCorrection[14] = 0.016;
texCorrection[15] = 0.016;
texCorrection[16] = 0.016;
texCorrection[17] = 0.016;
texCorrection[18] = 0.016;
texCorrection[19] = 0.016;
texCorrection[20] = 0.016;
texCorrection[21] = 0.016;
texCorrection[22] = 0.016;

//for (var i=0; i<23; i++)
//{ texCorrection[i] *= 2; }


function getTexCorrection(depth)
{
	return texCorrection[depth];
};

function getSkirtTrianglesStrip(lonArray, latArray, altArray, texCoordsArray, southIndices, eastIndices, northIndices, westIndices, options, centerX, centerY, centerZ)
{
	// Given "lonArray", "latArray" & "altArray", this function makes skirtCartesiansArray & skirtTexCoordsArray.***
	// Note: skirtMesh is trianglesStrip, so, there are no indices.***
	var skirtDepth = 500.0;
	var texCorrectionFactor = 1.0;
	if (options)
	{
		if (options.skirtDepth !== undefined)
		{ skirtDepth = options.skirtDepth; }
	
		if (options.texCorrectionFactor !== undefined)
		{ texCorrectionFactor = options.texCorrectionFactor; }
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
	//var skinAltitudes = new Float32Array(totalVertexCount * 4);

	//texCorrectionFactor *= 0.1;

	var counter = 0;
	var s, t;
	
	for (var j=0; j<westVertexCount; j++)
	{
		var idx = westIndices[j];
		
		//texCoordsArray[idx*2] += texCorrectionFactor;
		s = texCoordsArray[idx*2];
		t = texCoordsArray[idx*2+1];

		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = s;   // s.
		skirtTexCoordsArray[counter*2+1] = t; // t.

		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = s;   // s.
		skirtTexCoordsArray[counter*2+1] = t; // t.

		counter += 1;
	}
	
	for (var j=0; j<southVertexCount; j++)
	{
		var idx = southIndices[j];
		
		//texCoordsArray[idx*2+1] += (texCorrectionFactor);
		s = texCoordsArray[idx*2];
		t = texCoordsArray[idx*2+1];

		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = s;   // s.
		skirtTexCoordsArray[counter*2+1] = t; // t.

		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = s;   // s.
		skirtTexCoordsArray[counter*2+1] = t; // t.

		counter += 1;
	}
	
	for (var j=0; j<eastVertexCount; j++)
	{
		var idx = eastIndices[j];
		
		//texCoordsArray[idx*2] -= texCorrectionFactor;
		s = texCoordsArray[idx*2];
		t = texCoordsArray[idx*2+1];

		var texCoord_x = texCoordsArray[idx*2];
		var texCoord_y = texCoordsArray[idx*2+1];
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = s;   // s.
		skirtTexCoordsArray[counter*2+1] = t; // t.

		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = s;   // s.
		skirtTexCoordsArray[counter*2+1] = t; // t.

		counter += 1;
	}
	
	for (var j=0; j<northVertexCount; j++)
	{
		var idx = northIndices[j];
		//texCoordsArray[idx*2+1] -= (texCorrectionFactor);
		s = texCoordsArray[idx*2];
		t = texCoordsArray[idx*2+1];

		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = s;   // s.
		skirtTexCoordsArray[counter*2+1] = t; // t.
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = s;   // s.
		skirtTexCoordsArray[counter*2+1] = t; // t.
		counter += 1;
	}
	
	var skirtCartesiansArray = geographicRadianArrayToFloat32ArrayWgs84(skirtLonArray, skirtLatArray, skirtAltArray, undefined, centerX, centerY, centerZ);
	
	var resultObject = {
		skirtCartesiansArray : skirtCartesiansArray,
		skirtTexCoordsArray  : skirtTexCoordsArray,
		skirtAltitudesArray  : skirtAltArray
	};
	
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
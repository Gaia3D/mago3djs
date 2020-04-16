'use strict';

var worker = self;
worker.onmessage = function(e) 
{
	var param = e.data.param;
	var PI = Math.PI;
	var degToRadFactor = PI/180.0;

	var minLon = param.minGeographicLongitude * degToRadFactor;
	var minLat = param.minGeographicLatitude * degToRadFactor;
	var maxLon = param.maxGeographicLongitude * degToRadFactor;
	var maxLat = param.maxGeographicLatitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
    
	var minHeight = param.minHeight[0];
	var maxHeight = param.maxHeight[0];
	var heightRange = maxHeight - minHeight;
    
	var vertexCount = param.vertexCount[0];
	//넘길거
	var texCoordsArray = new Float32Array(vertexCount*2);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	var shortMax = 32767; // 65536
	var lonRangeDivShortMax = lonRange/shortMax;
	var latRangeDivShortMax = latRange/shortMax;
	var heightRangeDivShortMax = heightRange/shortMax;
	var uValues = param.uValues;
	var vValues = param.vValues;
	var hValues = param.hValues;
	var depth = param.depth;

	var exageration = 2.0;
	var imageryType = param.imageryType;

	//WEB_MERCATOR
	if (imageryType === 2)
	{
		// web_mercator.
		// https://en.wikipedia.org/wiki/Web_Mercator_projection
		
		
		var aConst = (1.0/(2.0*PI))*Math.pow(2.0, depth);
		var PI_DIV_4 = PI/4;
		var minT = aConst*(PI-Math.log(Math.tan(PI_DIV_4+minLat/2)));
		var maxT = aConst*(PI-Math.log(Math.tan(PI_DIV_4+maxLat/2)));
		var minS = aConst*(minLon+PI);
		var maxS = aConst*(maxLon+PI);
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
			altArray[i] = minHeight + hValues[i]*heightRangeDivShortMax;

			var currLon = lonArray[i];
			var currLat = latArray[i];
			
			// make texcoords.
			t = aConst*(PI-Math.log(Math.tan(PI_DIV_4+currLat/2)));
			t = 1.0 - t;
				
			// Substract minT to "t" to make range [0 to 1].***
			t -= minT; 
			
			s = aConst*(currLon+PI);
			s -= floorMinS;
			
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
			altArray[i] = minHeight + hValues[i]*heightRangeDivShortMax;
			
			// make texcoords.
			texCoordsArray[i*2] = uValues[i]/shortMax;
			texCoordsArray[i*2+1] = vValues[i]/shortMax;
		}
	}
	//넘길거
	var cartesiansArray = geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray);

	var texCorrectionFactor = getTexCorrection(depth);

	var options = {
		skirtDepth          : 50000,
		texCorrectionFactor : texCorrectionFactor
	};
    
	var skirtResultObject = getSkirtTrianglesStrip(lonArray, latArray, altArray, texCoordsArray, param.southIndices, param.eastIndices, param.northIndices, param.westIndices, options);
	//넘길거
	var skirtCartesiansArray = skirtResultObject.skirtCartesiansArray;
	//넘길거
	var skirtTexCoordsArray = skirtResultObject.skirtTexCoordsArray;
	//넘길거
	var skirtAltitudesArray = skirtResultObject.skirtAltitudesArray;

	//넘길거
	var altArray = altArray;

	worker.postMessage({decodedTerrain: {
		texCoordsArray       : texCoordsArray,   
		cartesiansArray      : cartesiansArray,
		skirtCartesiansArray : skirtCartesiansArray,
		skirtTexCoordsArray  : skirtTexCoordsArray, 
		skirtAltitudesArray  : skirtAltitudesArray,
		altArray             : altArray
	}, info: e.data.info});
};
 
function geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, resultCartesianArray)
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
        
		resultCartesianArray[i*3] = (v+h)*cosLat*cosLon;
		resultCartesianArray[i*3+1] = (v+h)*cosLat*sinLon;
		resultCartesianArray[i*3+2] = (v*e2a+h)*sinLat;
	}
    
	return resultCartesianArray;
};

var texCorrection = [];
texCorrection[0] = 0.003;
texCorrection[1] = 0.003;
texCorrection[2] = 0.003;
texCorrection[3] = 0.003;
texCorrection[4] = 0.003;
texCorrection[5] = 0.003;
texCorrection[6] = 0.003;
texCorrection[7] = 0.003;
texCorrection[8] = 0.003;
texCorrection[9] = 0.003;
texCorrection[10] = 0.004;
texCorrection[11] = 0.004;
texCorrection[12] = 0.004;
texCorrection[13] = 0.004;
texCorrection[14] = 0.004;
texCorrection[15] = 0.004;
texCorrection[16] = 0.004;
texCorrection[17] = 0.004;
texCorrection[18] = 0.004;
texCorrection[19] = 0.004;
texCorrection[20] = 0.004;
texCorrection[21] = 0.004;
texCorrection[22] = 0.004;

function getTexCorrection(depth)
{
	return texCorrection[depth];
};

function getSkirtTrianglesStrip(lonArray, latArray, altArray, texCoordsArray, southIndices, eastIndices, northIndices, westIndices, options)
{
	// Given "lonArray", "latArray" & "altArray", this function makes skirtCartesiansArray & skirtTexCoordsArray.***
	// Note: skirtMesh is trianglesStrip, so, there are no indices.***
	var skirtDepth = 1000.0;
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
	var counter = 0;
	
	for (var j=0; j<westVertexCount; j++)
	{
		var idx = westIndices[j];
		
		texCoordsArray[idx*2] += texCorrectionFactor;

		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.

		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.

		counter += 1;
	}
	
	for (var j=0; j<southVertexCount; j++)
	{
		var idx = southIndices[j];
		
		texCoordsArray[idx*2+1] = (texCorrectionFactor);

		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.

		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.

		counter += 1;
	}
	
	for (var j=0; j<eastVertexCount; j++)
	{
		var idx = eastIndices[j];
		
		texCoordsArray[idx*2] -= texCorrectionFactor;
		var texCoord_x = texCoordsArray[idx*2];
		var texCoord_y = texCoordsArray[idx*2+1];
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.

		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.

		counter += 1;
	}
	
	for (var j=0; j<northVertexCount; j++)
	{
		var idx = northIndices[j];
		texCoordsArray[idx*2+1] = (1-texCorrectionFactor);

		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		counter += 1;
	}
	
	var skirtCartesiansArray = geographicRadianArrayToFloat32ArrayWgs84(skirtLonArray, skirtLatArray, skirtAltArray, undefined);
	
	var resultObject = {
		skirtCartesiansArray : skirtCartesiansArray,
		skirtTexCoordsArray  : skirtTexCoordsArray,
		skirtAltitudesArray  : skirtAltArray
	};
	
	return resultObject;
};
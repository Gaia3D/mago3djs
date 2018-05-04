'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Globe
 */
var Globe = function() 
{
	if (!(this instanceof Globe)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	//WGS 84.***************************************************
	// Extracted from WikiPedia "Geodetic datum".
	// WGS 84 Defining Parameters
	// semi-major axis	a	6378137.0 m
	// Reciprocal of flattening	1/f	298.257223563
	
	// WGS 84 derived geometric constants
	// Semi-minor axis	b = a(1 − f)	6356752.3142 m
	// First eccentricity squared	e2 = (1 − b2/a2 = 2f − f2) =	6.69437999014 x 10−3
	// Second eccentricity squared	e′2	= (a2/b2 − 1 = f(2 − f)/(1 − f)2) = 6.73949674228 x 10−3
	//----------------------------------------------------------
	
	this.equatorialRadius = 6378137.0; // meters.
	this.polarRadius = 6356752.3142; // meters.
	this.firstEccentricitySquared = 6.69437999014E-3;
	this.secondEccentricitySquared = 6.73949674228E-3;
	this.degToRadFactor = Math.PI/180.0;
};

Globe.geographicToCartesianWgs84 = function(longitude, latitude, altitude, resultCartesian)
{
	// defined in the LINZ standard LINZS25000 (Standard for New Zealand Geodetic Datum 2000)
	// https://www.linz.govt.nz/data/geodetic-system/coordinate-conversion/geodetic-datum-conversions/equations-used-datum
	// a = semi-major axis.
	// e2 = firstEccentricitySquared.
	// v = a / sqrt(1 - e2 * sin2(lat)).
	// x = (v+h)*cos(lat)*cos(lon).
	// y = (v+h)*cos(lat)*sin(lon).
	// z = [v*(1-e2)+h]*sin(lat).
	var degToRadFactor = Math.PI/180.0;
	var equatorialRadius = 6378137.0; // meters.
	var firstEccentricitySquared = 6.69437999014E-3;
	var lonRad = longitude * degToRadFactor;
	var latRad = latitude * degToRadFactor;
	var cosLon = Math.cos(lonRad);
	var cosLat = Math.cos(latRad);
	var sinLon = Math.sin(lonRad);
	var sinLat = Math.sin(latRad);
	var a = equatorialRadius;
	var e2 = firstEccentricitySquared;
	var v = a/Math.sqrt(1.0 - e2 * sinLat * sinLat);
	var h = altitude;
	
	if (resultCartesian === undefined)
	{ resultCartesian = new Float32Array(3); }
	
	resultCartesian[0]=(v+h)*cosLat*cosLon;
	resultCartesian[1]=(v+h)*cosLat*sinLon;
	resultCartesian[2]=(v*(1.0-e2)+h)*sinLat;
	
	return resultCartesian;
};

Globe.geographicRadianArrayToFloat32ArrayWgs84 = function(lonArray, latArray, altArray, resultCartesianArray)
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
	var resultCartesian;
	
	var coordsCount = lonArray.length;
	resultCartesianArray = new Float32Array(coordsCount*3);
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

		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
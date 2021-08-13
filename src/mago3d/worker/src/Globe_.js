'use strict';

/**
 * This class is used to assume the real globe of earth as ellipsoid
 * @class Globe
 */
var Globe_ = function() 
{
	if (!(this instanceof Globe)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	//WGS 84.
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

Globe_.equatorialRadius = function()
{
	return 6378137.0;
};

Globe_.geographicToCartesianWgs84 = function(longitude, latitude, altitude, resultCartesian)
{
	// a = semi-major axis.
	// e2 = firstEccentricitySquared.
	// v = a / sqrt(1 - e2 * sin2(lat)).
	// x = (v+h)*cos(lat)*cos(lon).
	// y = (v+h)*cos(lat)*sin(lon).
	// z = [v*(1-e2)+h]*sin(lat).
	var degToRadFactor = Math.PI/180.0;
	var equatorialRadius = Globe_.equatorialRadius();
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
	{ resultCartesian = []; }
	
	resultCartesian[0]=(v+h)*cosLat*cosLon;
	resultCartesian[1]=(v+h)*cosLat*sinLon;
	resultCartesian[2]=(v*(1.0-e2)+h)*sinLat;
	
	return resultCartesian;
};

Globe_.normalizeCartesian = function(cartesian)
{
	// this function considere earth as a sphere
	if (cartesian === undefined)
	{ return; }

	var modul = Math.sqrt(cartesian[0]*cartesian[0] + cartesian[1]*cartesian[1] + cartesian[2]*cartesian[2] );
	cartesian[0] /= modul;
	cartesian[1] /= modul;
	cartesian[2] /= modul;
	
	return cartesian;
};

Globe_.polarRadius = function()
{
	return 6356752.3142;
};

Globe_.normalAtCartesianPointWgs84 = function(x, y, z, resultNormal)
{
	if (resultNormal === undefined)
	{ resultNormal = new Float32Array(3); }
	
	var eqRad = Globe_.equatorialRadius();
	var polRad = Globe_.polarRadius();
	var equatorialRadiusSquared = eqRad * eqRad;
	var polarRadiusSquared = polRad * polRad;

	resultNormal[0] = x / equatorialRadiusSquared;
	resultNormal[1] = y / equatorialRadiusSquared;
	resultNormal[2] = z / polarRadiusSquared;
	
	// Normalize cartesian.
	resultNormal = Globe_.normalizeCartesian(resultNormal);
	
	return resultNormal;
};

Globe_.transformMatrixAtCartesianPointWgs84 = function(x, y, z, float32Array)
{
	var xAxis, yAxis, zAxis;
	
	zAxis = Globe_.normalAtCartesianPointWgs84(x, y, z, zAxis);
	
	// Check if zAxis is vertical vector. PENDENT.
	
	// now, calculate the east direction. 
	// project zAxis to plane XY and calculate the left perpendicular.
	xAxis = new Float32Array(3);
	xAxis[0] = -y;
	xAxis[1] = x;
	xAxis[2] = 0.0;
	xAxis = Globe_.normalizeCartesian(xAxis);
	
	// finally calculate the north direction.
	var xAxisVector = new Point3D_(xAxis[0], xAxis[1], xAxis[2]);
	var yAxisVector = new Point3D_();
	var zAxisVector = new Point3D_(zAxis[0], zAxis[1], zAxis[2]);
	
	yAxisVector = zAxisVector.crossProduct(xAxisVector, yAxisVector);
	
	if (float32Array === undefined)
	{ float32Array = new Float32Array(16); }
	
	float32Array[0] = xAxisVector.x;
	float32Array[1] = xAxisVector.y;
	float32Array[2] = xAxisVector.z;
	float32Array[3] = 0.0;
	
	float32Array[4] = yAxisVector.x;
	float32Array[5] = yAxisVector.y;
	float32Array[6] = yAxisVector.z;
	float32Array[7] = 0.0;
	
	float32Array[8] = zAxisVector.x;
	float32Array[9] = zAxisVector.y;
	float32Array[10] = zAxisVector.z;
	float32Array[11] = 0.0;
	
	float32Array[12] = x;
	float32Array[13] = y;
	float32Array[14] = z;
	float32Array[15] = 1.0;
	
	return float32Array;
};
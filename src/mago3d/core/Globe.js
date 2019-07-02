'use strict';

/**
 * This class is used to assume the real globe of earth as ellipsoid
 * @class Globe
 */
var Globe = function() 
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

/**
 * @returns {Number} equatorial Radius
 */
Globe.equatorialRadius = function()
{
	return 6378137.0;
};

/**
 * @returns {Number}
 */
Globe.equatorialRadiusSquared = function()
{
	return 40680631590769.0;
};

/**
 * @returns {Number}
 */
Globe.polarRadius = function()
{
	return 6356752.3142;
};

/**
 * @returns {Number}
 */
Globe.polarRadiusSquared = function()
{
	return 40408299984087.05552164;
};
/**
 * This function returns the radius of earth at the latitude "latDeg".
 * @param latDeg the latitude
 * @returns {Number}
 */
Globe.radiusAtLatitudeDeg = function(latDeg)
{

	// a = equatorialRadius, b = polarRadius.
	// r = a*b / sqrt(a2*sin2(lat) + b2*cos2(lat)).
	//------------------------------------------------------
	
	var latRad = latDeg * Math.PI/180.0;
	var a = Globe.equatorialRadius();
	var b = Globe.polarRadius();
	var a2 = Globe.equatorialRadiusSquared();
	var b2 = Globe.polarRadiusSquared();
	
	var sin = Math.sin(latRad);
	var cos = Math.cos(latRad);
	var sin2 = sin*sin;
	var cos2 = cos*cos;
	
	var radius = (a*b)/(Math.sqrt(a2*sin2 + b2*cos2));
	return radius;
};

/**
 * Normalize the elements of the 3D feature
 * @param {Float32Array} cartesian this can be any feature such as a point or a axis to make unitary
 * 
 */
Globe.normalizeCartesian = function(cartesian)
{
	if (cartesian === undefined)
	{ return; }

	var modul = Math.sqrt(cartesian[0]*cartesian[0] + cartesian[1]*cartesian[1] + cartesian[2]*cartesian[2] );
	cartesian[0] /= modul;
	cartesian[1] /= modul;
	cartesian[2] /= modul;
	
	return cartesian;
};

/**
 * Change cartesian point to WGS84 and nromalize that.
 * @param {Number} x the x coordi value of input cartesian point
 * @param {Number} y the y coordi value of input cartesian point
 * @param {Number} z the z coordi value of input cartesian point
 * @param {Float32Array} resultNormal the cartesian point which will hold the calculated result
 * @returns {Float32Array} resultNormal
 */
Globe.normalAtCartesianPointWgs84 = function(x, y, z, resultNormal)
{
	if (resultNormal === undefined)
	{ resultNormal = new Float32Array(3); }
	
	var eqRad = Globe.equatorialRadius();
	var polRad = Globe.polarRadius();
	var equatorialRadiusSquared = eqRad * eqRad;
	var polarRadiusSquared = polRad * polRad;

	resultNormal[0] = x / equatorialRadiusSquared;
	resultNormal[1] = y / equatorialRadiusSquared;
	resultNormal[2] = z / polarRadiusSquared;
	
	// Normalize cartesian.
	resultNormal = Globe.normalizeCartesian(resultNormal);
	
	return resultNormal;
};

/**
 * Return the transformation matrix which transform the cartesian point to wgs84
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z 
 * @param {Float32Array} float32Array
 * @returns {Float32Array} float32Array
 * 
 */
Globe.transformMatrixAtCartesianPointWgs84 = function(x, y, z, float32Array)
{
	var xAxis, yAxis, zAxis;
	
	zAxis = Globe.normalAtCartesianPointWgs84(x, y, z, zAxis);
	
	// Check if zAxis is vertical vector. PENDENT.
	
	// now, calculate the east direction. 
	// project zAxis to plane XY and calculate the left perpendicular.
	xAxis = new Float32Array(3);
	xAxis[0] = -y;
	xAxis[1] = x;
	xAxis[2] = 0.0;
	xAxis = Globe.normalizeCartesian(xAxis);
	
	// finally calculate the north direction.
	var xAxisVector = new Point3D(xAxis[0], xAxis[1], xAxis[2]);
	var yAxisVector = new Point3D();
	var zAxisVector = new Point3D(zAxis[0], zAxis[1], zAxis[2]);
	
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

/**
 * Normalize the elements of the 3D feature
 * @param {Float32Array} cartesian this can be any feature such as a point or a axis to make unitary
 * 
 */
Globe.prototype.normalizeCartesian = function(cartesian)
{
	return Globe.normalizeCartesian(cartesian);
	/*
	if (cartesian === undefined)
	{ return; }

	var modul = Math.sqrt(cartesian[0]*cartesian[0] + cartesian[1]*cartesian[1] + cartesian[2]*cartesian[2] );
	cartesian[0] /= modul;
	cartesian[1] /= modul;
	cartesian[2] /= modul;
	
	return cartesian;
	*/
};

/**
 * Return the transformation matrix which transform the cartesian point to wgs84
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z 
 * @param {Float32Array} float32Array
 * @returns {Float32Array} float32Array
 * 
 */
Globe.prototype.transformMatrixAtCartesianPointWgs84 = function(x, y, z, float32Array)
{
	var xAxis, yAxis, zAxis;
	
	zAxis = this.normalAtCartesianPointWgs84(x, y, z, zAxis);
	
	// Check if zAxis is vertical vector. PENDENT.
	
	// now, calculate the east direction. 
	// project zAxis to plane XY and calculate the left perpendicular.
	xAxis = new Float32Array(3);
	xAxis[0] = -y;
	xAxis[1] = x;
	xAxis[2] = 0.0;
	xAxis = this.normalizeCartesian(xAxis);
	
	// finally calculate the north direction.
	var xAxisVector = new Point3D(xAxis[0], xAxis[1], xAxis[2]);
	var yAxisVector = new Point3D();
	var zAxisVector = new Point3D(zAxis[0], zAxis[1], zAxis[2]);
	
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
/**
 * function used by "MagoWorld" to paning & rotate the globe by dragging mouse.
 * @param {Line} line
 * @param {Float32Array} resultCartesian
 * @param {Number} radius
 * @returns {Float32Array} resultCartesian
 */
Globe.prototype.intersectionLineWgs84 = function(line, resultCartesian, radius)
{
	// 
	// line: (x, y, z) = x1 + t(x2 - x1), y1 + t(y2 - y1), z1 + t(z2 - z1)
	// sphere: (x - x3)^2 + (y - y3)^2 + (z - z3)^2 = r^2, where x3, y3, z3 is the center of the sphere.
	
	// line:
	var p1 = line.point;
	var lineDir = line.direction;
	var dist = 1000.0;// any value is ok.
	var p2 = new Point3D(p1.x + lineDir.x * dist, p1.y + lineDir.y * dist, p1.z + lineDir.z * dist);
	var x1 = p1.x;
	var y1 = p1.y;
	var z1 = p1.z;
	var x2 = p2.x;
	var y2 = p2.y;
	var z2 = p2.z;

	// sphere:
	var x3 = 0;
	var y3 = 0;
	var z3 = 0;
	var r = this.equatorialRadius; // provisionally.
	if (radius !== undefined)
	{ r = radius; }
	
	// resolve:
	var x21 = (x2-x1);
	var y21 = (y2-y1);
	var z21 = (z2-z1);
	
	var a = x21*x21 + y21*y21 + z21*z21;
	
	var x13 = (x1-x3);
	var y13 = (y1-y3);
	var z13 = (z1-z3);
	
	var b = 2*(x21 * x13 + y21 * y13 + z21 * z13);
	
	var c = x3*x3 + y3*y3 + z3*z3 + x1*x1 + y1*y1 + z1*z1 - 2*(x3*x1 + y3*y1+ z3*z1) - r*r;
	
	var discriminant = b*b - 4*a*c;
	
	if (discriminant < 0)
	{
		// no intersection.
		return undefined;
	}
	else if (discriminant === 0)
	{
		// this is tangent.
		if (resultCartesian === undefined)
		{ resultCartesian = []; } // Float32Array has no enough precision.
		
		var t1 = (-b)/(2*a);
		var intersectPoint1 = new Point3D(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1, z1 + (z2 - z1)*t1);
		resultCartesian[0] = intersectPoint1.x;
		resultCartesian[1] = intersectPoint1.y;
		resultCartesian[2] = intersectPoint1.z;
		
	}
	else
	{
		// find the nearest to p1.
		var sqrtDiscriminant = Math.sqrt(discriminant);
		var t1 = (-b + sqrtDiscriminant)/(2*a);
		var t2 = (-b - sqrtDiscriminant)/(2*a);
		
		// solution 1.
		var intersectPoint1 = new Point3D(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1, z1 + (z2 - z1)*t1);
		var intersectPoint2 = new Point3D(x1 + (x2 - x1)*t2, y1 + (y2 - y1)*t2, z1 + (z2 - z1)*t2);
		
		var dist1 = p1.squareDistToPoint(intersectPoint1);
		var dist2 = p1.squareDistToPoint(intersectPoint2);
		
		if (resultCartesian === undefined)
		{ resultCartesian = []; } // Float32Array has no enough precision.
		
		if (dist1 < dist2)
		{
			resultCartesian[0] = intersectPoint1.x;
			resultCartesian[1] = intersectPoint1.y;
			resultCartesian[2] = intersectPoint1.z;
		}
		else
		{
			resultCartesian[0] = intersectPoint2.x;
			resultCartesian[1] = intersectPoint2.y;
			resultCartesian[2] = intersectPoint2.z;
		}
	}
	
	return resultCartesian;
	
};


/**
 * Change cartesian point to WGS84 and nromalize that.
 * @param {Number} x the x coordi value of input cartesian point
 * @param {Number} y the y coordi value of input cartesian point
 * @param {Number} z the z coordi value of input cartesian point
 * @param {Float32Array} resultNormal the cartesian point which will hold the calculated result
 * @returns {Float32Array} resultNormal
 */
Globe.prototype.normalAtCartesianPointWgs84 = function(x, y, z, resultNormal)
{
	if (resultNormal === undefined)
	{ resultNormal = new Float32Array(3); }

	var equatorialRadiusSquared = this.equatorialRadius * this.equatorialRadius;
	var polarRadiusSquared = this.polarRadius * this.polarRadius;

	resultNormal[0] = x / equatorialRadiusSquared;
	resultNormal[1] = y / equatorialRadiusSquared;
	resultNormal[2] = z / polarRadiusSquared;
	
	// Normalize cartesian.
	resultNormal = this.normalizeCartesian(resultNormal);
	
	return resultNormal;
};

/**
 * Calculate atan
 * @param {Number} y
 * @param {Number} x
 * @returns {Number} 
 */
Globe.atan2Test = function(y, x) 
{
	var M_PI = Math.PI;
	if (x > 0.0)
	{
		return Math.atan(y/x);
	}
	else if (x < 0.0)
	{
		if (y >= 0.0)
		{
			return Math.atan(y/x) + M_PI;
		}
		else 
		{
			return Math.atan(y/x) - M_PI;
		}
	}
	else if (x === 0.0)
	{
		if (y>0.0)
		{
			return M_PI/2.0;
		}
		else if (y<0.0)
		{
			return -M_PI/2.0;
		}
		else 
		{
			return 0.0; // return undefined.
		}
	}
};

/**
 * Change absolute coordinate to WGS84 coordinate 
 * @param {Number} x the x coordi of the point of absolute coordinate
 * @param {Number} y the y coordi of the point of absolute coordinate
 * @param {Number} z the z coordi of the point of absolute coordinate
 * @param {Float32Array} result the cartesian point which will contain the calculated point
 * @param {Boolean} bStoreAbsolutePosition This decide whether store absolute value at the 'result' point or not as the property
 * @param {Float32Array} result
 * 
 */
Globe.CartesianToGeographicWgs84 = function (x, y, z, result, bStoreAbsolutePosition) 
{
	// From WebWorldWind.
	// According to H. Vermeille, "An analytical method to transform geocentric into geodetic coordinates"
	// http://www.springerlink.com/content/3t6837t27t351227/fulltext.pdf
	// Journal of Geodesy, accepted 10/2010, not yet published
	
	/*
	this.equatorialRadius = 6378137.0; // meters.
	this.polarRadius = 6356752.3142; // meters.
	this.firstEccentricitySquared = 6.69437999014E-3;
	this.secondEccentricitySquared = 6.73949674228E-3;
	this.degToRadFactor = Math.PI/180.0;
	*/
	var firstEccentricitySquared = 6.69437999014E-3;
	var equatorialRadius = 6378137.0;
	/*
	var X = z,
		Y = x,
		Z = y,
		*/
	var X = x,
		Y = y,
		Z = z,
		XXpYY = X * X + Y * Y,
		sqrtXXpYY = Math.sqrt(XXpYY),
		a = equatorialRadius,
		ra2 = 1 / (a * a),
		e2 = firstEccentricitySquared,
		e4 = e2 * e2,
		p = XXpYY * ra2,
		q = Z * Z * (1 - e2) * ra2,
		r = (p + q - e4) / 6,
		h,
		phi,
		u,
		evoluteBorderTest = 8 * r * r * r + e4 * p * q,
		rad1,
		rad2,
		rad3,
		atan,
		v,
		w,
		k,
		D,
		sqrtDDpZZ,
		e,
		lambda,
		s2;

	if (evoluteBorderTest > 0 || q !== 0) 
	{
		if (evoluteBorderTest > 0) 
		{
			// Step 2: general case
			rad1 = Math.sqrt(evoluteBorderTest);
			rad2 = Math.sqrt(e4 * p * q);

			// 10*e2 is my arbitrary decision of what Vermeille means by "near... the cusps of the evolute".
			if (evoluteBorderTest > 10 * e2) 
			{
				rad3 = Math.cbrt((rad1 + rad2) * (rad1 + rad2));
				u = r + 0.5 * rad3 + 2 * r * r / rad3;
			}
			else 
			{
				u = r + 0.5 * Math.cbrt((rad1 + rad2) * (rad1 + rad2))
					+ 0.5 * Math.cbrt((rad1 - rad2) * (rad1 - rad2));
			}
		}
		else 
		{
			// Step 3: near evolute
			rad1 = Math.sqrt(-evoluteBorderTest);
			rad2 = Math.sqrt(-8 * r * r * r);
			rad3 = Math.sqrt(e4 * p * q);
			//atan = 2 * Math.atan2(rad3, rad1 + rad2) / 3;
			atan = 2 * Globe.atan2Test(rad3, rad1 + rad2) / 3;

			u = -4 * r * Math.sin(atan) * Math.cos(Math.PI / 6 + atan);
		}

		v = Math.sqrt(u * u + e4 * q);
		w = e2 * (u + v - q) / (2 * v);
		k = (u + v) / (Math.sqrt(w * w + u + v) + w);
		D = k * sqrtXXpYY / (k + e2);
		sqrtDDpZZ = Math.sqrt(D * D + Z * Z);

		h = (k + e2 - 1) * sqrtDDpZZ / k;
		//phi = 2 * Math.atan2(Z, sqrtDDpZZ + D);
		phi = 2 * Globe.atan2Test(Z, sqrtDDpZZ + D);
	}
	else 
	{
		// Step 4: singular disk
		rad1 = Math.sqrt(1 - e2);
		rad2 = Math.sqrt(e2 - p);
		e = Math.sqrt(e2);

		h = -a * rad1 * rad2 / e;
		phi = rad2 / (e * rad2 + rad1 * Math.sqrt(p));
	}

	// Compute lambda
	s2 = Math.sqrt(2);
	if ((s2 - 1) * Y < sqrtXXpYY + X) 
	{
		// case 1 - -135deg < lambda < 135deg
		//lambda = 2 * Math.atan2(Y, sqrtXXpYY + X);
		lambda = 2 * Globe.atan2Test(Y, sqrtXXpYY + X);
	}
	else if (sqrtXXpYY + Y < (s2 + 1) * X) 
	{
		// case 2 - -225deg < lambda < 45deg
		//lambda = -Math.PI * 0.5 + 2 * Math.atan2(X, sqrtXXpYY - Y);
		lambda = -Math.PI * 0.5 + 2 * Globe.atan2Test(X, sqrtXXpYY - Y);
	}
	else 
	{
		// if (sqrtXXpYY-Y<(s2=1)*X) {  // is the test, if needed, but it's not
		// case 3: - -45deg < lambda < 225deg
		//lambda = Math.PI * 0.5 - 2 * Math.atan2(X, sqrtXXpYY + Y);
		lambda = Math.PI * 0.5 - 2 * Globe.atan2Test(X, sqrtXXpYY + Y);
	}

	if (result === undefined)
	{ result = new GeographicCoord(); }

	var factor = 180.0 / Math.PI;
	result.latitude = factor * phi;
	result.longitude = factor * lambda;
	result.altitude = h;
	
	if (bStoreAbsolutePosition !== undefined && bStoreAbsolutePosition === true)
	{
		// In this case, store into result_geographicCoord the x, y, z values.
		if (result.absolutePoint === undefined)
		{ result.absolutePoint = new Point3D(x, y, z); }
		else
		{ result.absolutePoint.set(x, y, z); }
	}

	return result;
};

/**
 * This change the GeographicCoord feature to Point2D feature
 * @param {Number} longitude
 * @param {Number} latitude
 * @param {Point2D} resultPoint2d
 * @returns {Point2D} 
 */
Globe.geographicToMercatorProjection = function(longitude, latitude, resultPoint2d) 
{
	// longitude = [-180, 180].
	// latitude = [-90, 90].
	var degToRadFactor = Math.PI/180.0;
	var lonRad = longitude * degToRadFactor;
	var latRad = latitude * degToRadFactor;
	
	return Globe.geographicRadianToMercatorProjection(lonRad, latRad, resultPoint2d);
};

/**
 * This change the GeographicCoord feature to Point2D feature using Mercator projection
 * @param {Number} lonRad
 * @param {Number} latRad
 * @param {Point2D} resultPoint2d
 * @returns {Point2D}
 */
Globe.geographicRadianToMercatorProjection = function(lonRad, latRad, resultPoint2d) 
{
	// longitude = [-pi, pi].
	// latitude = [-pi/2, pi/2].
	var equatorialRadius = Globe.equatorialRadius();
	if (resultPoint2d === undefined)
	{ resultPoint2d = new Point2D(); }

	resultPoint2d.set(equatorialRadius * lonRad, equatorialRadius * latRad);
	
	return resultPoint2d;
};

/**
 * This change the GeographicCoord feature to the cartesian WGS84 point using the blow method.
 * defined in the LINZ standard LINZS25000 (Standard for New Zealand Geodetic Datum 2000)
 * https://www.linz.govt.nz/data/geodetic-system/coordinate-conversion/geodetic-datum-conversions/equations-used-datum
 * @param {Number} longitude
 * @param {Number} latitude
 * @param {Number} altitude
 * @param {Float32Array} resultCartesian
 * @returns {Float32Array} resultCartesian
 */
Globe.geographicToCartesianWgs84 = function(longitude, latitude, altitude, resultCartesian)
{
	// a = semi-major axis.
	// e2 = firstEccentricitySquared.
	// v = a / sqrt(1 - e2 * sin2(lat)).
	// x = (v+h)*cos(lat)*cos(lon).
	// y = (v+h)*cos(lat)*sin(lon).
	// z = [v*(1-e2)+h]*sin(lat).
	var degToRadFactor = Math.PI/180.0;
	var equatorialRadius = Globe.equatorialRadius();
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
/**
 * This change the array of the absolute coordinates represented as the angle to the array of WGS84
 * @param {Number} longitude
 * @param {Number} latitude
 * @param {Number} altitude
 * @param {Float32Array} resultCartesian
 * @returns {Float32Array} resultCartesian
 */

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

		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
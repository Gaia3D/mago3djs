'use strict';

/**
 * This class represents the coordinate as geographic coordinate system
 * @class GeographicCoordSegment
 */
var GeographicCoordSegment = function(startGeoCoord, endGeoCoord) 
{
	if (!(this instanceof GeographicCoordSegment)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.strGeoCoord = startGeoCoord;
	this.endGeoCoord = endGeoCoord;
};

/**
 * Returns the angle to North in radians of the segment.
 * @param {GeographicCoordSegment} geoCoordSegment.
 * @param {MagoManager} magoManager worldwind mode removed, this args is not need. 
 * @returns {Number} Angle in radians between the segments.
 */
GeographicCoordSegment.calculateHeadingAngRadToNorthOfSegment = function(geoCoordSegment, magoManager) 
{
	// Note: The heading angle is calculated on the strPoint of the segment.***
	var strGeoCoord = geoCoordSegment.strGeoCoord;
	var endGeoCoord = geoCoordSegment.endGeoCoord;
	
	var strPointWC = ManagerUtils.geographicCoordToWorldPoint(strGeoCoord.longitude, strGeoCoord.latitude, strGeoCoord.altitude, undefined, magoManager);
	var endPointWC = ManagerUtils.geographicCoordToWorldPoint(endGeoCoord.longitude, endGeoCoord.latitude, endGeoCoord.altitude, undefined, magoManager);
	
	// Now, calculate the transformation matrix on the startPoint.***
	var geoLocMatrix = ManagerUtils.calculateGeoLocationMatrixAtWorldPosition(strPointWC, undefined);
	
	// Now calculate the inverse of the geoLocMatrix.***
	var matrixInv = glMatrix.mat4.create(); // from glMatrix library.***
	matrixInv = glMatrix.mat4.invert(matrixInv, geoLocMatrix._floatArrays  );
	
	var geoLocMatrixInv = new Matrix4(); // Mago native matrix.***
	geoLocMatrixInv.setByFloat32Array(matrixInv);
	
	// Now calculate the relative position of the endPoint respect the startPoint.***
	var endPointLC = geoLocMatrixInv.transformPoint3D(endPointWC, undefined);
	
	// Finally calculate heading angle to north.***
	var yAxis = new Point2D(0, 1);
	var dir2d = new Point2D(endPointLC.x, endPointLC.y);
	dir2d.unitary();
	var headingAngleRad = yAxis.angleRadToVector(dir2d);
	if (dir2d.x > 0.0)
	{
		headingAngleRad *= -1;
	}
	
	return headingAngleRad;
};

/**
 * Returns the angle to North in radians of the segment.
 * @param {GeographicCoordSegment} geoCoordSegment.
 * @param {MagoManager} magoManager worldwind mode removed, this args is not need. 
 * @returns {Number} Length of the segments.
 */
GeographicCoordSegment.getLengthInMeters = function(geoCoordSegment, magoManager) 
{
	var strGeoCoord = geoCoordSegment.strGeoCoord;
	var endGeoCoord = geoCoordSegment.endGeoCoord;
	
	var strPointWC = ManagerUtils.geographicCoordToWorldPoint(strGeoCoord.longitude, strGeoCoord.latitude, strGeoCoord.altitude, undefined, magoManager);
	var endPointWC = ManagerUtils.geographicCoordToWorldPoint(endGeoCoord.longitude, endGeoCoord.latitude, endGeoCoord.altitude, undefined, magoManager);
	var length = strPointWC.distToPoint(endPointWC);
	return length;
};

/**
 * Returns the direction of this segment.
 * @param {GeographicCoordSegment} geoCoordSegment.
 * @param {Point3D} resultDirection. 
 */
GeographicCoordSegment.getDirection = function(geoCoordSegment, resultDirection) 
{
	if (geoCoordSegment === undefined)
	{ return resultDirection; }
	
	var lonDiff = geoCoordSegment.endGeoCoord.longitude - geoCoordSegment.strGeoCoord.longitude;
	var latDiff = geoCoordSegment.endGeoCoord.latitude - geoCoordSegment.strGeoCoord.latitude;
	var altDiff = geoCoordSegment.endGeoCoord.altitude - geoCoordSegment.strGeoCoord.altitude;
	
	if (resultDirection === undefined)
	{ resultDirection = new Point3D(); }
	
	resultDirection.set(lonDiff, latDiff, altDiff);
	resultDirection.unitary();
	
	return resultDirection;
};

/**
 * Returns the line3d of the "geoCoordSegment".
 * @param {GeographicCoordSegment} geoCoordSegment.
 * @param {Point3D} resultLine3d. 
 */
GeographicCoordSegment.getLine = function(geoCoordSegment, resultLine3d) 
{
	if (resultLine3d === undefined)
	{
		resultLine3d = new Line();
	}
	// unitary direction.
	var dir = GeographicCoordSegment.getDirection(geoCoordSegment, undefined);
	var strGeoCoord = geoCoordSegment.strGeoCoord;
	resultLine3d.setPointAndDir(strGeoCoord.longitude, strGeoCoord.latitude, strGeoCoord.altitude, dir.x, dir.y, dir.z);
	return resultLine3d;
};

/**
 * Returns the projected coord of "geoCoord" into the line of this segment.
 * @param {GeographicCoordSegment} geoCoordSegment.
 * @param {GeographicCoord} geoCoord.
 * @param {GeographicCoord} resultGeoCoord. 
 */
GeographicCoordSegment.getProjectedCoordToLine = function(geoCoordSegment, geoCoord, resultGeoCoord) 
{
	var line = GeographicCoordSegment.getLine(geoCoordSegment, undefined);
	var point3d = new Point3D(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude);
	var projectedCoord = line.getProjectedPoint(point3d, undefined);
	
	if (resultGeoCoord === undefined)
	{ resultGeoCoord = new GeographicCoord(); }
	
	resultGeoCoord.setLonLatAlt(projectedCoord.x, projectedCoord.y, projectedCoord.z);
	return resultGeoCoord;
};

/**
 * Returns the projected coord of "geoCoord" into the line of this segment.
 * @param {GeographicCoordSegment} geoCoordSegment.
 * @param {GeographicCoord} geoCoord.
 */
GeographicCoordSegment.intersectionWithGeoCoord = function(geoCoordSegment, geoCoord) 
{
	var error = 10E-8;
	var strGeoCoord = geoCoordSegment.strGeoCoord;
	var endGeoCoord = geoCoordSegment.endGeoCoord;
	
	var point3d = new Point3D(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude);
	var strPoint3d = new Point3D(strGeoCoord.longitude, strGeoCoord.latitude, strGeoCoord.altitude);
	var endPoint3d = new Point3D(endGeoCoord.longitude, endGeoCoord.latitude, endGeoCoord.altitude);
	var segment3d = new Segment3D(strPoint3d, endPoint3d);
	
	var totalLength = segment3d.getLength();
	var lengthA = strPoint3d.distToPoint(point3d);
	var lengthB = endPoint3d.distToPoint(point3d);
	var lengthSum = lengthA + lengthB;
	if (Math.abs(totalLength - lengthSum) < error)
	{ return true; }
	else
	{ return false; }
};

/**
 * Returns the nearest geoCoord of this segment to ""geoCoord.
 * @param {GeographicCoord} geoCoord.
 */
GeographicCoordSegment.getNearestGeoCoord = function(geoCoordSegment, geoCoord) 
{
	var strGeoCoord = geoCoordSegment.strGeoCoord;
	var endGeoCoord = geoCoordSegment.endGeoCoord;
	
	var point3d = new Point3D(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude);
	var strPoint3d = new Point3D(strGeoCoord.longitude, strGeoCoord.latitude, strGeoCoord.altitude);
	var endPoint3d = new Point3D(endGeoCoord.longitude, endGeoCoord.latitude, endGeoCoord.altitude);
	
	var lengthA = strPoint3d.distToPoint(point3d);
	var lengthB = endPoint3d.distToPoint(point3d);
	
	if (lengthA < lengthB)
	{ return strGeoCoord; }
	else
	{ return endGeoCoord; }
};

















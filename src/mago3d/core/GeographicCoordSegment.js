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
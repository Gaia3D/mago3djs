'use strict';

var Utils_ = {};

function getPrevIdx (idx, pointsCount)
{
	var prevIdx;
	
	if (idx === 0)
	{ prevIdx = pointsCount - 1; }
	else
	{ prevIdx = idx - 1; }

	return prevIdx;
};

function getNextIdx (idx, pointsCount)
{
	var nextIdx;
	
	if (idx === pointsCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	return nextIdx;
};

Utils_.createGuid = function createGuid() 
{
	return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) 
	{
	  var r = Math.random() * 16 | 0,
		  v = c === 'x' ? r : r & 0x3 | 0x8;
	  return v.toString(16);
	});
};

Utils_.calculateSplitedValues = function(value, resultSplitValue)
{
	if (resultSplitValue === undefined)
	{ resultSplitValue = {}; }

	var doubleHigh;
	if (value >= 0.0) 
	{
		doubleHigh = Math.floor(value / 65536.0) * 65536.0; //unsigned short max
		resultSplitValue.high = doubleHigh;
		resultSplitValue.low = value - doubleHigh;
	}
	else 
	{
		doubleHigh = Math.floor(-value / 65536.0) * 65536.0;
		resultSplitValue.high = -doubleHigh;
		resultSplitValue.low = value + doubleHigh;
	}

	return resultSplitValue;
};

Utils_.calculateSplited3fv = function(point3fv, resultSplitPoint3fvHigh, resultSplitPoint3fvLow)
{
	if (point3fv === undefined)
	{ return undefined; }

	if (resultSplitPoint3fvHigh === undefined) // delete unnecesary. agree
	{ resultSplitPoint3fvHigh = new Float32Array(3); }// delete unnecesary. agree

	if (resultSplitPoint3fvLow === undefined)// delete unnecesary. agree
	{ resultSplitPoint3fvLow = new Float32Array(3); }// delete unnecesary. agree

	var posSplitX = this.calculateSplitedValues(point3fv[0], undefined);
	var posSplitY = this.calculateSplitedValues(point3fv[1], undefined);
	var posSplitZ = this.calculateSplitedValues(point3fv[2], undefined);

	resultSplitPoint3fvHigh[0] = posSplitX.high;
	resultSplitPoint3fvHigh[1] = posSplitY.high;
	resultSplitPoint3fvHigh[2] = posSplitZ.high;

	resultSplitPoint3fvLow[0] = posSplitX.low;
	resultSplitPoint3fvLow[1] = posSplitY.low;
	resultSplitPoint3fvLow[2] = posSplitZ.low;
};

Utils_.geographicCoordToWorldPoint = function(longitude, latitude, altitude, resultWorldPoint) 
{
	if (resultWorldPoint === undefined)
	{ resultWorldPoint = new Point3D_(); }

	var cartesian = Globe_.geographicToCartesianWgs84(longitude, latitude, altitude, undefined);
	resultWorldPoint.set(cartesian[0], cartesian[1], cartesian[2]);
	return resultWorldPoint;
};

Utils_.calculateGeoLocationMatrixAtWorldPosition = function(worldPosition, resultGeoLocMatrix) 
{
	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4_(); }

	Globe_.transformMatrixAtCartesianPointWgs84(worldPosition.x, worldPosition.y, worldPosition.z, resultGeoLocMatrix._floatArrays);
	
	return resultGeoLocMatrix;
};

Utils_.calculateTransformMatrixAtWorldPosition = function(worldPosition, heading, pitch, roll, resultGeoLocMatrix, resultTransformMatrix) 
{
	var xRotMatrix = new Matrix4_();  // created as identity matrix.
	var yRotMatrix = new Matrix4_();  // created as identity matrix.
	var zRotMatrix = new Matrix4_();  // created as identity matrix.
	
	if (heading !== undefined && heading !== 0)
	{ zRotMatrix.rotationAxisAngDeg(heading, 0.0, 0.0, 1.0); }

	if (pitch !== undefined && pitch !== 0)
	{ xRotMatrix.rotationAxisAngDeg(pitch, 1.0, 0.0, 0.0); }

	if (roll !== undefined && roll !== 0)
	{ yRotMatrix.rotationAxisAngDeg(roll, 0.0, 1.0, 0.0); }

	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4_(); }  // created as identity matrix.
	
	if (resultTransformMatrix === undefined)
	{ resultTransformMatrix = new Matrix4_(); }  // created as identity matrix.

	// 1rst, calculate the transformation matrix for the location.
	resultGeoLocMatrix = Utils_.calculateGeoLocationMatrixAtWorldPosition(worldPosition, resultGeoLocMatrix);
	
	resultTransformMatrix.copyFromMatrix4(resultGeoLocMatrix);
	var zRotatedTMatrix;
	var zxRotatedTMatrix;
	var zxyRotatedTMatrix;

	zRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(resultTransformMatrix, zRotatedTMatrix);
	zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
	zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
	
	resultTransformMatrix = zxyRotatedTMatrix;
	return resultTransformMatrix;
};

Utils_.calculateGeoLocationData = function(longitude, latitude, altitude, heading, pitch, roll, resultGeoLocationData) 
{
	if (resultGeoLocationData === undefined) { resultGeoLocationData = new GeoLocationData_(); }

	// 0) Position.**
	if (resultGeoLocationData.geographicCoord === undefined)
	{ resultGeoLocationData.geographicCoord = new GeographicCoord_(); }

	if (longitude !== undefined)
	{ resultGeoLocationData.geographicCoord.longitude = longitude; }
	else 
	{ longitude = resultGeoLocationData.geographicCoord.longitude; }

	if (latitude !== undefined)
	{ resultGeoLocationData.geographicCoord.latitude = latitude; }
	else 
	{ latitude = resultGeoLocationData.geographicCoord.latitude; }

	if (altitude !== undefined)
	{ resultGeoLocationData.geographicCoord.altitude = altitude; }
	else 
	{ altitude = resultGeoLocationData.geographicCoord.altitude; }

	if (heading !== undefined)
	{ resultGeoLocationData.heading = heading; }

	if (pitch !== undefined)
	{ resultGeoLocationData.pitch = pitch; }

	if (roll !== undefined)
	{ resultGeoLocationData.roll = roll; }

	if (resultGeoLocationData.geographicCoord.longitude === undefined || resultGeoLocationData.geographicCoord.latitude === undefined)
	{ return; }
	
	//if (magoManager.configInformation === undefined)
	//{ return; }

	resultGeoLocationData.position = Utils_.geographicCoordToWorldPoint(longitude, latitude, altitude, resultGeoLocationData.position);

	// High and Low values of the position.**
	if (resultGeoLocationData.positionHIGH === undefined)
	{ resultGeoLocationData.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
	if (resultGeoLocationData.positionLOW === undefined)
	{ resultGeoLocationData.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
	Utils_.calculateSplited3fv([resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z], resultGeoLocationData.positionHIGH, resultGeoLocationData.positionLOW);

	// Determine the elevation of the position.**
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	//var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	if (resultGeoLocationData.tMatrix === undefined)
	{ resultGeoLocationData.tMatrix = new Matrix4_(); }
	else
	{ resultGeoLocationData.tMatrix.Identity(); }

	if (resultGeoLocationData.geoLocMatrix === undefined)
	{ resultGeoLocationData.geoLocMatrix = new Matrix4_(); }
	else
	{ resultGeoLocationData.geoLocMatrix.Identity(); }

	if (resultGeoLocationData.rotMatrix === undefined)
	{ resultGeoLocationData.rotMatrix = new Matrix4_(); }
	else
	{ resultGeoLocationData.rotMatrix.Identity(); }

	// Set inverseMatrices as undefined.
	resultGeoLocationData.tMatrixInv = undefined; // reset. is calculated when necessary.
	resultGeoLocationData.rotMatrixInv = undefined; // reset. is calculated when necessary.
	resultGeoLocationData.geoLocMatrixInv = undefined; // reset. is calculated when necessary.

	// 1rst, calculate the transformation matrix for the location.
	resultGeoLocationData.tMatrix = Utils_.calculateTransformMatrixAtWorldPosition(resultGeoLocationData.position, resultGeoLocationData.heading, resultGeoLocationData.pitch, resultGeoLocationData.roll, 
		resultGeoLocationData.geoLocMatrix, resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[14] = 0;
	
	// finally assing the pivotPoint.
	if (resultGeoLocationData.pivotPoint === undefined)
	{ resultGeoLocationData.pivotPoint = new Point3D_(); }

	resultGeoLocationData.pivotPoint.set(resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z);
	resultGeoLocationData.doEffectivePivotPointTranslation();
	
	return resultGeoLocationData;
};
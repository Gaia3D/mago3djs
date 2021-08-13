'use strict';

/**
 * ManagerUtils does some calculations about coordinates system of different earth coords.
 * 
 * @class ManagerUtils
 * @constructor 
 */
var ManagerUtils = function() 
{
	
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param octreesArray 변수
 * @param octree 변수
 * @returns result_idx
 */
ManagerUtils.getIndexToInsertBySquaredDistToEye = function(objectsArray, object, startIdx, endIdx) 
{
	// Note: the object must have "distToCamera" variable.
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	if (startIdx === undefined)
	{ startIdx = 0; }
	
	if (endIdx === undefined)
	{ endIdx = objectsArray.length-1; }
	
	var range = endIdx - startIdx;
	
	if (range <= 0)
	{ return 0; }
	
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;
		var octreesCount = objectsArray.length;
		while (!finished && i<=endIdx)
		{
			if (object.distToCamera < objectsArray[i].distToCamera)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{
			return idx;
		}
		else 
		{
			return endIdx+1;
		}
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		if (objectsArray[middleIdx].distToCamera > object.distToCamera)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return ManagerUtils.getIndexToInsertBySquaredDistToEye(objectsArray, object, newStartIdx, newEndIdx);
	}
};

/**
 * world coordinate to geographic coordinate.
 * @param {Point3D} point world coordinate.
 * @param {GeographicCoord|undefined} resultGeographicCoord Optional. result geographicCoord. if undefined, create GeographicCoord instance.
 * @param {MagoManager} magoManager worldwind mode removed, this args is not need. 
 * @returns {GeographicCoord} geographic coordinate object.
 */
ManagerUtils.pointToGeographicCoord = function(point, resultGeographicCoord) 
{
	if (!point) 
	{
		throw new Error('point is requred');
	}

	if (resultGeographicCoord === undefined)
	{ resultGeographicCoord = new GeographicCoord(); }
	
	var cartographic = Globe.CartesianToGeographicWgs84(point.x, point.y, point.z, cartographic);
	resultGeographicCoord.setLonLatAlt(cartographic.longitude, cartographic.latitude, cartographic.altitude);
	
	return resultGeographicCoord;
};

/**
 * geographic coordinate to world coordinate.
 * @param {number} longitude longitude.
 * @param {number} latitude latitude.
 * @param {number} altitude altitude.
 * @param {Point3D|undefined} resultWorldPoint Optional. result worldCoord. if undefined, create Point3D instance.
 * @returns {Point3D} world coordinate object.
 */
ManagerUtils.geographicCoordToWorldPoint = function(longitude, latitude, altitude, resultWorldPoint) 
{
	if (resultWorldPoint === undefined)
	{ resultWorldPoint = new Point3D(); }

	var cartesian = Globe.geographicToCartesianWgs84(longitude, latitude, altitude, undefined);
	resultWorldPoint.set(cartesian[0], cartesian[1], cartesian[2]);
	return resultWorldPoint;
};

/**
 * when node mapping type is boundingboxcenter, set pivotPointTraslation and create pivotPoint at geoLocationData
 * this function NO modifies the geographic coords.
 * "newPivotPoint" is in buildingCoords.
 * "newPivotPoint" is the desired position of the new origen of coords, for example:
 * in a building you can desire the center of the bbox as the origin of the coords.
 * @param {GeoLocationData} geoLocationData. Required.
 * @param {Point3D} newPivotPoint newPivotPoint.
 */
ManagerUtils.translatePivotPointGeoLocationData = function(geoLocationData, newPivotPoint) 
{
	if (geoLocationData === undefined)
	{ return; }

	var rawTranslation = new Point3D();
	rawTranslation.set(-newPivotPoint.x, -newPivotPoint.y, -newPivotPoint.z);

	geoLocationData.pivotPointTraslationLC = rawTranslation;
	geoLocationData.doEffectivePivotPointTranslation();
};

/**
 * this function calculates the transformation matrix for (x, y, z) coordinate, that has NO heading, pitch or roll rotations.
 * @param {Point3D} worldPosition worldPosition.
 * @param {Matrix4|undefined} resultGeoLocMatrix. Optional. result geolocation matrix. if undefined, create Matrix4 instance.
 * @returns {Matrix4} resultGeoLocMatrix. this matrix has NO heading, pitch or roll rotations.
 */
ManagerUtils.calculateGeoLocationMatrixAtWorldPosition = function(worldPosition, resultGeoLocMatrix) 
{
	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4(); }

	Globe.transformMatrixAtCartesianPointWgs84(worldPosition.x, worldPosition.y, worldPosition.z, resultGeoLocMatrix._floatArrays);
	
	return resultGeoLocMatrix;
};

/**
 * this function calculates the transformation matrix for (longitude, latitude, altitude) coordinate, that has NO heading, pitch or roll rotations.
 * @param {number} longitude longitude.
 * @param {number} latitude latitude.
 * @param {number} altitude altitude.
 * @param {Matrix4|undefined} resultGeoLocMatrix. Optional. result geolocation matrix. if undefined, create Matrix4 instance.
 * @returns {Matrix4} resultGeoLocMatrix. this matrix has NO heading, pitch or roll rotations.
 */
ManagerUtils.calculateGeoLocationMatrixAtLonLatAlt = function(longitude, latitude, altitude, resultGeoLocMatrix) 
{
	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4(); }
	
	var worldPosition = this.geographicCoordToWorldPoint(longitude, latitude, altitude, worldPosition);
	resultGeoLocMatrix = ManagerUtils.calculateGeoLocationMatrixAtWorldPosition(worldPosition, resultGeoLocMatrix);
	
	return resultGeoLocMatrix;
};

/**
 * This function calculates the "resultGeoLocMatrix" & "resultTransformMatrix".
 * @param {Point3D} worldPosition worldPosition.
 * @param {number} heading heading.
 * @param {number} pitch pitch.
 * @param {number} roll roll.
 * @param {Matrix4|undefined} resultGeoLocMatrix. Optional. result geolocation matrix. if undefined, create Matrix4 instance. this transformMatrix without the heading, pitch, roll rotations.
 * @param {Matrix4|undefined} resultTransformMatrix. Optional. result transform matrix. if undefined, create Matrix4 instance. this matrix including the heading, pitch, roll rotations.
 * @returns {Matrix4} resultTransformMatrix.
 */
ManagerUtils.calculateTransformMatrixAtWorldPosition = function(worldPosition, heading, pitch, roll, resultGeoLocMatrix, resultTransformMatrix) 
{
	var xRotMatrix = new Matrix4();  // created as identity matrix.
	var yRotMatrix = new Matrix4();  // created as identity matrix.
	var zRotMatrix = new Matrix4();  // created as identity matrix.
	
	if (heading !== undefined && heading !== 0)
	{ zRotMatrix.rotationAxisAngDeg(heading, 0.0, 0.0, 1.0); }

	if (pitch !== undefined && pitch !== 0)
	{ xRotMatrix.rotationAxisAngDeg(pitch, 1.0, 0.0, 0.0); }

	if (roll !== undefined && roll !== 0)
	{ yRotMatrix.rotationAxisAngDeg(roll, 0.0, 1.0, 0.0); }

	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4(); }  // created as identity matrix.
	
	if (resultTransformMatrix === undefined)
	{ resultTransformMatrix = new Matrix4(); }  // created as identity matrix.

	// 1rst, calculate the transformation matrix for the location.
	resultGeoLocMatrix = ManagerUtils.calculateGeoLocationMatrixAtWorldPosition(worldPosition, resultGeoLocMatrix);
	
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

/**
 * This function calculates all data and matrices for the location(longitude, latitude, altitude) and rotation(heading, pitch, roll).
 * @param {number} longitude Required. longitude.
 * @param {number} latitude Required. latitude.
 * @param {number} altitude altitude.
 * @param {number} heading heading. Unit is degree.
 * @param {number} pitch pitch. Unit is degree.
 * @param {number} roll roll. Unit is degree.
 * @param {GeoLocationData|undefined} resultGeoLocationData Optional. result geolocation matrix. if undefined, create GeoLocationData instance.
 * @param {MagoManager} magoManager for magoManager.globe
 * @returns {GeoLocationData} resultGeoLocationData.
 */
ManagerUtils.calculateGeoLocationData = function(longitude, latitude, altitude, heading, pitch, roll, resultGeoLocationData) 
{
	if (resultGeoLocationData === undefined) 
	{ 
		resultGeoLocationData = new GeoLocationData(); 
	}

	// 0) Position.**
	if (resultGeoLocationData.geographicCoord === undefined) 
	{ 
		resultGeoLocationData.geographicCoord = new GeographicCoord(); 
	}

	if (longitude !== undefined) 
	{ 
		resultGeoLocationData.geographicCoord.longitude = longitude; 
	}
	else 
	{ 
		longitude = resultGeoLocationData.geographicCoord.longitude; 
	}

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

	resultGeoLocationData.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, resultGeoLocationData.position);

	// High and Low values of the position.**
	if (resultGeoLocationData.positionHIGH === undefined)
	{ resultGeoLocationData.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
	if (resultGeoLocationData.positionLOW === undefined)
	{ resultGeoLocationData.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
	ManagerUtils.calculateSplited3fv([resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z], resultGeoLocationData.positionHIGH, resultGeoLocationData.positionLOW);

	// Determine the elevation of the position.**
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	//var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	if (resultGeoLocationData.tMatrix === undefined)
	{ resultGeoLocationData.tMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.tMatrix.Identity(); }

	if (resultGeoLocationData.geoLocMatrix === undefined)
	{ resultGeoLocationData.geoLocMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.geoLocMatrix.Identity(); }

	if (resultGeoLocationData.rotMatrix === undefined)
	{ resultGeoLocationData.rotMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.rotMatrix.Identity(); }

	// Set inverseMatrices as undefined.
	resultGeoLocationData.tMatrixInv = undefined; // reset. is calculated when necessary.
	resultGeoLocationData.rotMatrixInv = undefined; // reset. is calculated when necessary.
	resultGeoLocationData.geoLocMatrixInv = undefined; // reset. is calculated when necessary.

	// 1rst, calculate the transformation matrix for the location.
	resultGeoLocationData.tMatrix = ManagerUtils.calculateTransformMatrixAtWorldPosition(resultGeoLocationData.position, resultGeoLocationData.heading, resultGeoLocationData.pitch, resultGeoLocationData.roll, 
		resultGeoLocationData.geoLocMatrix, resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[14] = 0;
	
	// finally assing the pivotPoint.
	if (resultGeoLocationData.pivotPoint === undefined)
	{ resultGeoLocationData.pivotPoint = new Point3D(); }

	resultGeoLocationData.pivotPoint.set(resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z);
	resultGeoLocationData.doEffectivePivotPointTranslation();
	
	return resultGeoLocationData;
};

/**
 * This function calculates geolocation data use pixel point(calculated world point). 
 * When use Object Marker, this function called.
 * @param {number} absoluteX absoluteX.
 * @param {number} absoluteY absoluteY.
 * @param {number} absoluteZ absoluteZ.
 * @param {GeoLocationData|undefined} resultGeoLocationData Optional. result geolocation matrix. if undefined, create GeoLocationData instance.
 * @param {MagoManager} magoManager
 * @returns {GeoLocationData} resultGeoLocationData.
 */
ManagerUtils.calculateGeoLocationDataByAbsolutePoint = function(absoluteX, absoluteY, absoluteZ, resultGeoLocationData, magoManager) 
{
	if (resultGeoLocationData === undefined)
	{ resultGeoLocationData = new GeoLocationData(); }

	// 0) Position.**
	if (resultGeoLocationData.geographicCoord === undefined)
	{ resultGeoLocationData.geographicCoord = new GeographicCoord(); }
	
	if (magoManager.configInformation === undefined)
	{ return; }
	
	if (resultGeoLocationData.position === undefined)
	{ resultGeoLocationData.position = new Point3D(); }
		
	resultGeoLocationData.position.x = absoluteX;
	resultGeoLocationData.position.y = absoluteY;
	resultGeoLocationData.position.z = absoluteZ;
	
	//추후에 세슘의존성 버리는 코드로 대체 가능해 보임. 손수석님과 검토 필요.
	/*
	if (magoManager.isCesiumGlobe())
	{
		// *if this in Cesium:
		//resultGeoLocationData.position = Cesium.Cartesian3.fromDegrees(resultGeoLocationData.geographicCoord.longitude, resultGeoLocationData.geographicCoord.latitude, resultGeoLocationData.geographicCoord.altitude);
		// must find cartographic data.
		var cartographic = new Cesium.Cartographic();
		var cartesian = new Cesium.Cartesian3();
		cartesian.x = absoluteX;
		cartesian.y = absoluteY;
		cartesian.z = absoluteZ;
		cartographic = Cesium.Cartographic.fromCartesian(cartesian, magoManager.scene._globe._ellipsoid, cartographic);
		resultGeoLocationData.geographicCoord.longitude = cartographic.longitude * 180.0/Math.PI;
		resultGeoLocationData.geographicCoord.latitude = cartographic.latitude * 180.0/Math.PI;
		resultGeoLocationData.geographicCoord.altitude = cartographic.height;
	}
	*/

	resultGeoLocationData.geographicCoord = ManagerUtils.pointToGeographicCoord(new Point3D(absoluteX, absoluteY, absoluteZ));

	// High and Low values of the position.**
	if (resultGeoLocationData.positionHIGH === undefined)
	{ resultGeoLocationData.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
	if (resultGeoLocationData.positionLOW === undefined)
	{ resultGeoLocationData.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
	this.calculateSplited3fv([resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z], resultGeoLocationData.positionHIGH, resultGeoLocationData.positionLOW);

	// Determine the elevation of the position.**
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	//var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	if (resultGeoLocationData.tMatrix === undefined)
	{ resultGeoLocationData.tMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.tMatrix.Identity(); }

	if (resultGeoLocationData.geoLocMatrix === undefined)
	{ resultGeoLocationData.geoLocMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.geoLocMatrix.Identity(); }

	if (resultGeoLocationData.rotMatrix === undefined)
	{ resultGeoLocationData.rotMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.rotMatrix.Identity(); }

	// Set inverseMatrices as undefined.
	resultGeoLocationData.tMatrixInv = undefined; // reset. is calculated when necessary.
	resultGeoLocationData.rotMatrixInv = undefined; // reset. is calculated when necessary.
	resultGeoLocationData.geoLocMatrixInv = undefined; // reset. is calculated when necessary.

	// 1rst, calculate the transformation matrix for the location.
	resultGeoLocationData.tMatrix = ManagerUtils.calculateTransformMatrixAtWorldPosition(resultGeoLocationData.position, resultGeoLocationData.heading, resultGeoLocationData.pitch, resultGeoLocationData.roll, 
		resultGeoLocationData.geoLocMatrix, resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[14] = 0;
	
	// finally assing the pivotPoint.
	if (resultGeoLocationData.pivotPoint === undefined)
	{ resultGeoLocationData.pivotPoint = new Point3D(); }

	resultGeoLocationData.pivotPoint.set(resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z);
	resultGeoLocationData.doEffectivePivotPointTranslation();
	
	return resultGeoLocationData;
};

/**
 * This function calculates geolocation data use pixel point(calculated world point). 
 * When use Object Marker, this function called.
 * @param {number} absoluteX absoluteX.
 * @param {number} absoluteY absoluteY.
 * @param {number} absoluteZ absoluteZ.
 * @param {GeoLocationData|undefined} resultGeoLocationData Optional. result geolocation matrix. if undefined, create GeoLocationData instance.
 * @param {MagoManager} magoManager
 * @returns {GeoLocationData} resultGeoLocationData.
 */
ManagerUtils.calculateGeoLocationDataByAbsolutePoint__original = function(absoluteX, absoluteY, absoluteZ, resultGeoLocationData, magoManager) 
{
	if (resultGeoLocationData === undefined)
	{ resultGeoLocationData = new GeoLocationData(); }

	// 0) Position.**
	if (resultGeoLocationData.geographicCoord === undefined)
	{ resultGeoLocationData.geographicCoord = new GeographicCoord(); }
	
	if (magoManager.configInformation === undefined)
	{ return; }
	
	if (resultGeoLocationData.position === undefined)
	{ resultGeoLocationData.position = new Point3D(); }
		
	resultGeoLocationData.position.x = absoluteX;
	resultGeoLocationData.position.y = absoluteY;
	resultGeoLocationData.position.z = absoluteZ;
	
	//추후에 세슘의존성 버리는 코드로 대체 가능해 보임. 손수석님과 검토 필요.
	if (magoManager.isCesiumGlobe())
	{
		// *if this in Cesium:
		//resultGeoLocationData.position = Cesium.Cartesian3.fromDegrees(resultGeoLocationData.geographicCoord.longitude, resultGeoLocationData.geographicCoord.latitude, resultGeoLocationData.geographicCoord.altitude);
		// must find cartographic data.
		var cartographic = new Cesium.Cartographic();
		var cartesian = new Cesium.Cartesian3();
		cartesian.x = absoluteX;
		cartesian.y = absoluteY;
		cartesian.z = absoluteZ;
		cartographic = Cesium.Cartographic.fromCartesian(cartesian, magoManager.scene._globe._ellipsoid, cartographic);
		resultGeoLocationData.geographicCoord.longitude = cartographic.longitude * 180.0/Math.PI;
		resultGeoLocationData.geographicCoord.latitude = cartographic.latitude * 180.0/Math.PI;
		resultGeoLocationData.geographicCoord.altitude = cartographic.height;
	}

	// High and Low values of the position.**
	if (resultGeoLocationData.positionHIGH === undefined)
	{ resultGeoLocationData.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
	if (resultGeoLocationData.positionLOW === undefined)
	{ resultGeoLocationData.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
	this.calculateSplited3fv([resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z], resultGeoLocationData.positionHIGH, resultGeoLocationData.positionLOW);

	// Determine the elevation of the position.**
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	//var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	if (resultGeoLocationData.tMatrix === undefined)
	{ resultGeoLocationData.tMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.tMatrix.Identity(); }

	if (resultGeoLocationData.geoLocMatrix === undefined)
	{ resultGeoLocationData.geoLocMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.geoLocMatrix.Identity(); }

	if (resultGeoLocationData.geoLocMatrixInv === undefined)
	{ resultGeoLocationData.geoLocMatrixInv = new Matrix4(); }
	else
	{ resultGeoLocationData.geoLocMatrixInv.Identity(); }

	//---------------------------------------------------------

	if (resultGeoLocationData.tMatrixInv === undefined)
	{ resultGeoLocationData.tMatrixInv = new Matrix4(); }
	else
	{ resultGeoLocationData.tMatrixInv.Identity(); }

	if (resultGeoLocationData.rotMatrix === undefined)
	{ resultGeoLocationData.rotMatrix = new Matrix4(); }
	else
	{ resultGeoLocationData.rotMatrix.Identity(); }

	if (resultGeoLocationData.rotMatrixInv === undefined)
	{ resultGeoLocationData.rotMatrixInv = new Matrix4(); }
	else
	{ resultGeoLocationData.rotMatrixInv.Identity(); }

	var xRotMatrix = new Matrix4();  // created as identity matrix.
	var yRotMatrix = new Matrix4();  // created as identity matrix.
	var zRotMatrix = new Matrix4();  // created as identity matrix.

	if (resultGeoLocationData.heading !== undefined && resultGeoLocationData.heading !== 0)
	{
		zRotMatrix.rotationAxisAngDeg(resultGeoLocationData.heading, 0.0, 0.0, -1.0);
	}

	if (resultGeoLocationData.pitch !== undefined && resultGeoLocationData.pitch !== 0)
	{
		xRotMatrix.rotationAxisAngDeg(resultGeoLocationData.pitch, -1.0, 0.0, 0.0);
	}

	if (resultGeoLocationData.roll !== undefined && resultGeoLocationData.roll !== 0)
	{
		yRotMatrix.rotationAxisAngDeg(resultGeoLocationData.roll, 0.0, -1.0, 0.0);
	}
	
	if (magoManager.isCesiumGlobe())
	{
		// *if this in Cesium:
		Cesium.Transforms.eastNorthUpToFixedFrame(resultGeoLocationData.position, undefined, resultGeoLocationData.tMatrix._floatArrays);
		resultGeoLocationData.geoLocMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);// "geoLocMatrix" is the pure transformation matrix, without heading or pitch or roll.

		var zRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(resultGeoLocationData.tMatrix, zRotatedTMatrix);
		var zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
		var zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
		resultGeoLocationData.tMatrix = zxyRotatedTMatrix;
		
		// test.
		//var yRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(resultGeoLocationData.tMatrix, yRotatedTMatrix);
		//var yxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(yRotatedTMatrix, yxRotatedTMatrix);
		//var yxzRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(yxRotatedTMatrix, yxzRotatedTMatrix);
		//resultGeoLocationData.tMatrix = yxzRotatedTMatrix;
		// end test.---

		resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
		resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
		resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
		resultGeoLocationData.rotMatrix._floatArrays[14] = 0;

		// now, calculates the inverses.
		Cesium.Matrix4.inverse(resultGeoLocationData.tMatrix._floatArrays, resultGeoLocationData.tMatrixInv._floatArrays);
		Cesium.Matrix4.inverse(resultGeoLocationData.rotMatrix._floatArrays, resultGeoLocationData.rotMatrixInv._floatArrays);
		Cesium.Matrix4.inverse(resultGeoLocationData.geoLocMatrix._floatArrays, resultGeoLocationData.geoLocMatrixInv._floatArrays);
	}

	// finally assing the pivotPoint.
	if (resultGeoLocationData.pivotPoint === undefined)
	{ resultGeoLocationData.pivotPoint = new Point3D(); }

	resultGeoLocationData.pivotPoint.set(resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z);

	return resultGeoLocationData;
};

/**
 * 자릿수가 긴 숫자를 나머지와 몫으로 분리. gl에서는 float형밖에 처리 불가.
 * @example <caption>Example usage of calculateSplitedValues</caption>
 * ManagerUtils.calculateSplitedValues(4049653.5985745606, new SplitValue());
 * resultSplitValue.high = 3997696; // Math.floor(4049653.5985745606 / 65536.0) * 65536.0;
 * resultSplitValue.low = 51957.5985745606 // 4049653.5985745606 - 3997696;
 * @param {number} value Required. coordinate x or y or z.
 * @param {SplitValue} resultSplitValue Optional. result split value. if undefined, create SplitValue instance.
 * @returns {SplitValue} resultSplitValue.
 */
ManagerUtils.calculateSplitedValues = function(value, resultSplitValue)
{
	if (resultSplitValue === undefined)
	{ resultSplitValue = new SplitValue(); }

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

/**
 * 자릿수가 긴 숫자를 나머지(low)와 몫(high)으로 분리한 결과를 각각 배열로 생성. gl에서는 float형밖에 처리 불가.
 * @param {Point3D} point3fv Required.
 * @param {Float32Array} resultSplitPoint3fvHigh Optional. result split high value array. if undefined, set new Float32Array(3).
 * @param {Float32Array} resultSplitPoint3fvLow Optional. result split low value array. if undefined, set new Float32Array(3).
 * 
 * @see ManagerUtils#calculateSplitedValues
 */
ManagerUtils.calculateSplited3fv = function(point3fv, resultSplitPoint3fvHigh, resultSplitPoint3fvLow)
{
	if (point3fv === undefined)
	{ return undefined; }

	if (resultSplitPoint3fvHigh === undefined) // delete unnecesary. agree
	{ resultSplitPoint3fvHigh = new Float32Array(3); }// delete unnecesary. agree

	if (resultSplitPoint3fvLow === undefined)// delete unnecesary. agree
	{ resultSplitPoint3fvLow = new Float32Array(3); }// delete unnecesary. agree

	var posSplitX = new SplitValue();
	posSplitX = this.calculateSplitedValues(point3fv[0], posSplitX);
	var posSplitY = new SplitValue();
	posSplitY = this.calculateSplitedValues(point3fv[1], posSplitY);
	var posSplitZ = new SplitValue();
	posSplitZ = this.calculateSplitedValues(point3fv[2], posSplitZ);

	resultSplitPoint3fvHigh[0] = posSplitX.high;
	resultSplitPoint3fvHigh[1] = posSplitY.high;
	resultSplitPoint3fvHigh[2] = posSplitZ.high;

	resultSplitPoint3fvLow[0] = posSplitX.low;
	resultSplitPoint3fvLow[1] = posSplitY.low;
	resultSplitPoint3fvLow[2] = posSplitZ.low;
};

ManagerUtils.unpackDepth = function(rgba_depth)
{
	//var bit_shift = [0.000000059605, 0.000015258789, 0.00390625, 1.0];
	//return rgba_depth[0] * 0.000000059605 + rgba_depth[1] * 0.000015258789 + rgba_depth[2] * 0.00390625 + rgba_depth[3];

	// New pack-unpack.***
	//return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
	return rgba_depth[0] + rgba_depth[1] * 1.0 / 255.0 + rgba_depth[2] * 1.0 / 65025.0 + rgba_depth[3] * 1.0 / 16581375.0;
};

ManagerUtils.mod = function(x, y)
{
	return x - y * Math.floor(x/y);
};

ManagerUtils.packDepth = function(depth)
{
	// Note: Function for debug. Function no used in javaScript.***
	// Note: Function for debug. Function no used in javaScript.***
	// Note: Function for debug. Function no used in javaScript.***
	//--------------------------------------------------------------------------------------
	//const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);
	//const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); 
	////vec4 res = fract(depth * bit_shift); // Is not precise.
	//vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.
	//res -= res.xxyz * bit_mask;
	//return res; 
	
	// Note: Function for debug. Function no used in javaScript.***
	var bit_shift = [16777216.0, 65536.0, 256.0, 1.0];
	var bit_mask = [0.0, 0.00390625, 0.00390625, 0.00390625];

	// calculate value_A = depth * bit_shift * vec4(255).
	var value_A = [depth * bit_shift[0] * 255.0, depth * bit_shift[1] * 255.0, depth * bit_shift[2] * 255.0, depth * bit_shift[3] * 255.0];
	var value_B = [256.0, 256.0, 256.0, 256.0];

	var resAux = [( ManagerUtils.mod(value_A[0], value_B[0]) )/255.0, 
				  ( ManagerUtils.mod(value_A[1], value_B[1]) )/255.0, 
				  ( ManagerUtils.mod(value_A[2], value_B[2]) )/255.0, 
				  ( ManagerUtils.mod(value_A[3], value_B[3]) )/255.0];

	var resBitMasked = [resAux[0] * bit_mask[0], 
		resAux[0] * bit_mask[1], 
		resAux[1] * bit_mask[2], 
		resAux[2] * bit_mask[3]];

	var res = [resAux[0] - resBitMasked[0], 
		resAux[1] - resBitMasked[1], 
		resAux[2] - resBitMasked[2], 
		resAux[3] - resBitMasked[3]];

	return res;
};

/**
 * Calculates the pixel linear depth value.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {FBO} depthFbo Depth frameBuffer object.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {Number} linearDepth Returns the linear depth [0.0, 1.0] ranged value.
 */
ManagerUtils.calculatePixelLinearDepth = function(gl, pixelX, pixelY, depthFbo, magoManager) 
{
	if (depthFbo === undefined)
	{ depthFbo = magoManager.depthFboNeo; }

	if (!depthFbo) 
	{
		return;
	}

	if (depthFbo) 
	{
		depthFbo.bind(); 
	}

	// Now, read the pixel and find the pixel position.
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.
	gl.readPixels(pixelX, magoManager.sceneState.drawingBufferHeight[0] - pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);
	
	var floatDepthPixels = new Float32Array(([depthPixels[0]/256.0, depthPixels[1]/256.0, depthPixels[2]/256.0, depthPixels[3]/256.0]));
	var zDepth = ManagerUtils.unpackDepth(floatDepthPixels); // 0 to 256 range depth.
	var linearDepth = zDepth;// [0.0, 1.0] range depth.

	// Check if we are using logarithmic depth buffer.***
	
	if (magoManager.postFxShadersManager.bUseLogarithmicDepth)
	{
		linearDepth = zDepth * 1.0037;
		var sceneState = magoManager.sceneState;
		var far = sceneState.camera.frustum.far[0];

		var fcoef_half = sceneState.fCoef_logDepth[0]/2.0;
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z;
		// sceneState.fCoef_logDepth[0] = 2.0 / Math.log2(frustum0.far[0] + 1.0);

		var flogz = Math.pow(2.0, linearDepth/fcoef_half);
		var z = flogz - 1.0;
		linearDepth = z/far;
	}
	

	return linearDepth;
};

/**
 * Calculates the pixel linear depth value.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {webGlTexture} depthTex Depth frameBuffer object.
 * @param {webGlTexture} normalTex Depth frameBuffer object.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {Number} linearDepth Returns the linear depth [0.0, 1.0] ranged value.
 */
ManagerUtils.calculatePixelLinearDepthV2 = function (gl, pixelX, pixelY, depthTex, normalTex, magoManager) 
{
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.
 
	// 1rst, read normal & currentFrustum.***
	magoManager.framebufferAux.bind();
 
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depthTex, 0);
	gl.readPixels(pixelX, magoManager.sceneState.drawingBufferHeight[0] - pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);

	var floatDepthPixels = new Float32Array(([depthPixels[0]/255.0, depthPixels[1]/255.0, depthPixels[2]/255.0, depthPixels[3]/255.0]));
	var zDepth = ManagerUtils.unpackDepth(floatDepthPixels); // 0 to 256 range depth.
	var linearDepth = zDepth;// [0.0, 1.0] range depth.
 
	// swap normalTex & depthTex of the texturesMergerFbo to read the normal.***
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, normalTex, 0);
	gl.readPixels(pixelX, magoManager.sceneState.drawingBufferHeight[0] - pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);
	var floatNormalPixels = new Float32Array(([depthPixels[0]/255.0, depthPixels[1]/255.0, depthPixels[2]/255.0, depthPixels[3]/255.0]));
 
	// calculate the frustumIdx of the readed pixel.***
	var frustumIdx = Math.floor(floatNormalPixels[3]*100);
 
	// check frustumIdx. There are 2 type of frustumsIdx :  (geometry)0, 1, 2, 3 or (tinTerrain)10, 11, 12, 13 or (pointsCloud)20, 21, 22, 23.***
	while (frustumIdx >= 10)
	{ frustumIdx -= 10; }
 
	magoManager.framebufferAux.unbind();
 
	var near;
	var far;
	if (frustumIdx < magoManager.numFrustums)
	{
		near = magoManager.frustumVolumeControl.nearFarArray[frustumIdx*2];
		far = magoManager.frustumVolumeControl.nearFarArray[frustumIdx*2 + 1];
	}
 
	// Check if we are using logarithmic depth buffer.***
	if (magoManager.postFxShadersManager.bUseLogarithmicDepth)
	{
		linearDepth = zDepth;// * 1.0037;
		var sceneState = magoManager.sceneState;
		var fcoef_half = sceneState.fCoef_logDepth[0]/2.0;
		var flogz = Math.pow(2.0, linearDepth/fcoef_half);
		var z = flogz - 1.0;
		linearDepth = z/far;
	}
 
	return {linearDepth : linearDepth,
		normal4     : floatNormalPixels,
		frustumIdx  : frustumIdx,
		near        : near,
		far         : far };
};

/**
 * Calculates the pixel position in camera coordinates.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {Point3D} resultPixelPos The result of the calculation.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @param {options} options options.
 * @returns {Point3D} resultPixelPos The result of the calculation.
 */
ManagerUtils.calculatePixelPositionCamCoord = function (gl, pixelX, pixelY, resultPixelPos, depthFbo, frustumNear, frustumFar, magoManager, options) 
{
	var sceneState = magoManager.sceneState;

	if (frustumFar === undefined)
	{ frustumFar = sceneState.camera.frustum.far[0]; }

	if (frustumNear === undefined)
	{ frustumNear = 0.0; }
	
	var linearDepth;
	if (options)
	{
		// Check if exist pre-calculated linearDepth.
		if (options.linearDepth)
		{
			linearDepth = options.linearDepth;
		}
	}

	if (!linearDepth) 
	{
		//linearDepth = ManagerUtils.calculatePixelLinearDepth(gl, pixelX, pixelY, depthFbo, magoManager);
		//if (!linearDepth) 
		//{ return; }

		var texturesMergerFbo = magoManager.texturesManager.texturesMergerFbo;
		var depthTex = texturesMergerFbo.colorBuffersArray[0];
		var normalTex = texturesMergerFbo.colorBuffersArray[1];

		//var depthTex = magoManager.depthTex;
		//var normalTex = magoManager.normalTex;

		var resultObject = ManagerUtils.calculatePixelLinearDepthV2(gl, pixelX, pixelY, depthTex, normalTex, magoManager);

		if (resultObject.frustumIdx < magoManager.numFrustums)
		{
			linearDepth = resultObject.linearDepth;
			frustumFar = resultObject.far;
			frustumNear = resultObject.near;
		}
		else
		{
			return; // no valid linearDepth.
		}

	}
	var realZDepth = linearDepth * frustumFar; 
	

	// now, find the 3d position of the pixel in camCoord.*
	magoManager.resultRaySC = ManagerUtils.getRayCamSpace(pixelX, pixelY, magoManager.resultRaySC, magoManager);
	if (resultPixelPos === undefined)
	{ resultPixelPos = new Point3D(); }
	
	resultPixelPos.set(magoManager.resultRaySC[0] * realZDepth, magoManager.resultRaySC[1] * realZDepth, magoManager.resultRaySC[2] * realZDepth);// Original.

	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // delete this code from here. TODO:
	
	return resultPixelPos;
	
};

/**
 * Calculates the cameraCoord position in world coordinates.
 * @param {Point3D} cameraCoord Camera coordinate position.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {Point3D} resultPixelPos The result of the calculation.
 */
ManagerUtils.cameraCoordPositionToWorldCoord = function(camCoordPos, resultWorldPos, magoManager) 
{
	// now, must transform this pixelCamCoord to world coord.
	if (resultWorldPos === undefined)
	{ var resultWorldPos = new Point3D(); }

	var sceneState = magoManager.sceneState;
	var mvRelToEye_inv = sceneState.getModelViewRelToEyeMatrixInv();
	resultWorldPos = mvRelToEye_inv.transformPoint3D(camCoordPos, resultWorldPos);

	// now, add to resultPos the camera position.
	var camPosHIGH = sceneState.encodedCamPosHigh;
	var camPosLOW = sceneState.encodedCamPosLow;
	resultWorldPos.add(camPosLOW[0], camPosLOW[1], camPosLOW[2]); // this way is more precise.
	resultWorldPos.add(camPosHIGH[0], camPosHIGH[1], camPosHIGH[2]); // this way is more precise.

	return resultWorldPos;
};

/**
 * Detect depth in pixel
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {boolean}
 */
ManagerUtils.detectedDepth = function(pixelX, pixelY, magoManager) 
{
	var gl = magoManager.getGl();

	// Test the new method: depth + normal + frustumIdx.************************************************************************
	var texturesMergerFbo = magoManager.texturesManager.texturesMergerFbo;
	var depthTex = texturesMergerFbo.colorBuffer;
	var normalTex = texturesMergerFbo.colorBuffer1;
	var resultObject = ManagerUtils.calculatePixelLinearDepthV2(gl, pixelX, pixelY, depthTex, normalTex, magoManager);
	
	return (resultObject.frustumIdx < magoManager.numFrustums) ? true : false;
};

/**
 * Calculates the world coordinates in pixel position check gl's depth buffer.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {Point3D}
 */
ManagerUtils.screenCoordToWorldCoordUseDepthCheck = function(pixelX, pixelY, magoManager, options) 
{
	var worldCoordinate;
	var gl = magoManager.getGl();

	// Test the new method: depth + normal + frustumIdx.************************************************************************
	var texturesMergerFbo = magoManager.texturesManager.texturesMergerFbo;
	var depthTex = texturesMergerFbo.colorBuffer;
	var normalTex = texturesMergerFbo.colorBuffer1;
	
	var resultObject = ManagerUtils.calculatePixelLinearDepthV2(gl, pixelX, pixelY, depthTex, normalTex, magoManager);
	
	//var depthDetected = (resultObject.frustumIdx < magoManager.numFrustums) ? true : false;
	var depthDetected = true;
	var normal = new Point3D(resultObject.normal4[0], resultObject.normal4[1], resultObject.normal4[2]);
	var normalSquaredLength = normal.getSquaredModul();
	if (normalSquaredLength < 0.5)
	{ depthDetected = false; }

	if (!depthDetected && magoManager.isCesiumGlobe())
	{
		var scene = magoManager.scene;
		var camera = scene.frameState.camera;
		var ray = camera.getPickRay(new Cesium.Cartesian2(pixelX, pixelY));
		worldCoordinate = scene.globe.pick(ray, scene);
	}
	else 
	{
		var camCoord = MagoWorld.screenToCamCoord(pixelX, pixelY, magoManager, camCoord, resultObject);
		if (!camCoord)
		{
			worldCoordinate = undefined;
		} 
		else 
		{
			worldCoordinate = ManagerUtils.cameraCoordPositionToWorldCoord(camCoord, worldCoordinate, magoManager, resultObject);
		}
	}

	options = options ? options : {};
	var needHighPrecision = options.highPrecision;

	if (depthDetected && needHighPrecision)
	{
		// Test shooting laser mode:
		var camera = magoManager.sceneState.getCamera();
		var camPosWC = camera.getPosition();

		// Now, calculate startGeoCoord & endGeoCoord around the targetGeoCoord.
		var direction = new Point3D(worldCoordinate.x - camPosWC.x, worldCoordinate.y - camPosWC.y, worldCoordinate.z - camPosWC.z);
		direction.unitary();

		var dist = 10.0;
		var startWC = new Point3D(worldCoordinate.x - direction.x * dist, worldCoordinate.y - direction.y * dist, worldCoordinate.z - direction.z * dist);
		var endWC = new Point3D(worldCoordinate.x + direction.x * dist, worldCoordinate.y + direction.y * dist, worldCoordinate.z + direction.z * dist);

		var startGeoCoord = ManagerUtils.pointToGeographicCoord(startWC, undefined);
		var endGeoCoord = ManagerUtils.pointToGeographicCoord(endWC, undefined);
		var highPrecisionPositionWC = Camera.intersectPointByLaser(startGeoCoord, endGeoCoord, undefined, undefined, magoManager, undefined) ;

		if (highPrecisionPositionWC)
		{
			worldCoordinate = highPrecisionPositionWC;
		}
	}

	return worldCoordinate; // original.
};

/**
 * Calculates the pixel position in world coordinates.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {Point3D} resultPixelPos The result of the calculation.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {Point3D} resultPixelPos The result of the calculation.
 */
ManagerUtils.screenCoordToWorldCoord = function(gl, pixelX, pixelY, resultWCPos, depthFbo, frustumNear, frustumFar, magoManager) 
{
	if (magoManager.isCesiumGlobe())
	{
		// https://cesium.com/docs/cesiumjs-ref-doc/Globe.html
		
		var cesiumScene = magoManager.scene; 
		var cesiumGlobe = cesiumScene.globe;
		var cesiumCamera = cesiumScene.camera;
		var windowCoordinates = new Cesium.Cartesian2(pixelX, pixelY);
		var ray = cesiumCamera.getPickRay(windowCoordinates);
		var intersection = cesiumGlobe.pick(ray, cesiumScene);
		return intersection;
	}
	else/* if (magoManager.configInformation.basicGlobe === Constant.MAGOWORLD)*/
	{
		// todo:
		var camCoord = MagoWorld.screenToCamCoord(pixelX, pixelY, magoManager);
		return ManagerUtils.cameraCoordPositionToWorldCoord(camCoord, undefined, magoManager);
	}
};

/**
 * Calculates the pixel position in world coordinates.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {Point3D} resultPixelPos The result of the calculation.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {Point3D} resultPixelPos The result of the calculation.
 */
ManagerUtils.calculatePixelPositionWorldCoord = function(gl, pixelX, pixelY, resultPixelPos, depthFbo, frustumNear, frustumFar, magoManager) 
{
	var pixelPosCamCoord = new Point3D();
	
	if (frustumFar === undefined)
	{ frustumFar = magoManager.sceneState.camera.frustum.far[0]; }

	if (frustumNear === undefined)
	{ frustumNear = 0.0; }
	
	if (depthFbo === undefined)
	{ depthFbo = magoManager.depthFboNeo; }
	
	pixelPosCamCoord = ManagerUtils.calculatePixelPositionCamCoord(gl, pixelX, pixelY, pixelPosCamCoord, depthFbo, frustumNear, frustumFar, magoManager);

	if (resultPixelPos === undefined)
	{ var resultPixelPos = new Point3D(); }

	resultPixelPos = ManagerUtils.cameraCoordPositionToWorldCoord(pixelPosCamCoord, resultPixelPos, magoManager);
	return resultPixelPos;
};

/**
 * Calculates a world coordinate point to screen coordinate.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} worldCoordX x value of the point in world coordinate.
 * @param {Number} worldCoordY y value of the point in world coordinate.
 * @param {Number} worldCoordZ z value of the point in world coordinate.
 * @param {Point3D} resultPixelPos The result of the calculation.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {Point3D} resultPixelPos The result of the calculation.
 */
ManagerUtils.calculateWorldPositionToScreenCoord = function(gl, worldCoordX, worldCoordY, worldCoordZ, resultScreenCoord, magoManager)
{
	if (resultScreenCoord === undefined)
	{ resultScreenCoord = new Point3D(); }
	
	if (magoManager.pointSC === undefined)
	{ magoManager.pointSC = new Point3D(); }
	
	if (magoManager.pointSC2 === undefined)
	{ magoManager.pointSC2 = new Point3D(); }

	var sceneState = magoManager.sceneState;
	var camPosHIGH = sceneState.encodedCamPosHigh;
	var camPosLOW = sceneState.encodedCamPosLow;
	
	magoManager.pointSC.set(worldCoordX, worldCoordY, worldCoordZ);
	magoManager.pointSC.add(-camPosLOW[0], -camPosLOW[1], -camPosLOW[2]);
	magoManager.pointSC.add(-camPosHIGH[0], -camPosHIGH[1], -camPosHIGH[2]);
	
	// calculate the position in camera coords.
	var modelViewRelToEye = sceneState.modelViewRelToEyeMatrix;
	var pointSC2 = magoManager.pointSC2;
	
	pointSC2 = modelViewRelToEye.transformPoint3D(magoManager.pointSC, pointSC2);

	// now calculate the position in screen coords.
	var zDist = pointSC2.z;
	if (zDist > 0)
	{
		// the worldPoint is rear the camera.
		resultScreenCoord.set(-1, -1, 0);
		return resultScreenCoord;
	}
	
	// now calculate the width and height of the plane in zDist.
	//var fovyRad = sceneState.camera.frustum.fovyRad[0];
	
	var planeHeight = sceneState.camera.frustum.tangentOfHalfFovy[0]*zDist*2;
	var planeWidth = planeHeight * sceneState.camera.frustum.aspectRatio[0]; 
	var pixelX = -pointSC2.x * sceneState.drawingBufferWidth[0] / planeWidth;
	var pixelY = -(pointSC2.y) * sceneState.drawingBufferHeight[0] / planeHeight;

	pixelX += sceneState.drawingBufferWidth[0] / 2;
	pixelY += sceneState.drawingBufferHeight[0] / 2;
	pixelY = sceneState.drawingBufferHeight[0] - pixelY;
	resultScreenCoord.set(pixelX, pixelY, 0);
	
	return resultScreenCoord;
};

/**
 * Calculates the direction vector of a ray that starts in the camera position and
 * continues to the pixel position in camera space.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {Float32Array(3)} resultRay Result of the calculation.
 * @returns {Float32Array(3)} resultRay Result of the calculation.
 */
ManagerUtils.getRayCamSpace = function(pixelX, pixelY, resultRay, magoManager, frustumFar) 
{
	// in this function "ray" is a vector.
	var sceneState = magoManager.sceneState;
	var frustum = sceneState.camera.frustum;
	var frustum_far = 1.0;//frustum.far[0]; // unitary frustum far.

	if (frustumFar)
	{ frustum_far = frustumFar; }

	var aspectRatio = frustum.aspectRatio[0];
	var tangentOfHalfFovy = frustum.tangentOfHalfFovy[0]; 
	
	var hfar = 2.0 * tangentOfHalfFovy * frustum_far; //var hfar = 2.0 * Math.tan(fovy/2.0) * frustum_far;
	var wfar = hfar * aspectRatio;
	var mouseX = pixelX;
	var mouseY = sceneState.drawingBufferHeight[0] - pixelY;
	if (resultRay === undefined) 
	{ resultRay = new Float32Array(3); }
	resultRay[0] = wfar*((mouseX/sceneState.drawingBufferWidth[0]) - 0.5);
	resultRay[1] = hfar*((mouseY/sceneState.drawingBufferHeight[0]) - 0.5);
	resultRay[2] = - frustum_far;

	/*
	//var projectMatInv = sceneState.getProjectionMatrixInv();
	var projectMatInv = sceneState.projectionMatrix;
	var v4Pos = [resultRay[0], resultRay[1], resultRay[2], 1.0];
	var rayAux = new Point3D(resultRay[0], resultRay[1], resultRay[2]);
	//rayAux.unitary();
	var rayAuxProj = projectMatInv.transformPoint4D(v4Pos, undefined);

	resultRay[0] = rayAuxProj[0]/rayAuxProj[3];
	resultRay[1] = rayAuxProj[1]/rayAuxProj[3];
	resultRay[2] = rayAuxProj[2]/rayAuxProj[3];
	*/

	return resultRay;
};

/**
 * Calculates the direction vector of a ray that starts in the camera position and
 * continues to the pixel position in world space.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @returns {Line} resultRay
 */
ManagerUtils.getRayWorldSpace = function(gl, pixelX, pixelY, resultRay, magoManager) 
{
	// in this function the "ray" is a line.
	if (resultRay === undefined) 
	{ resultRay = new Line(); }
	
	// world ray = camPos + lambda*camDir.
	var camPos = magoManager.sceneState.camera.position;
	var rayCamSpace = new Float32Array(3);
	rayCamSpace = ManagerUtils.getRayCamSpace(pixelX, pixelY, rayCamSpace, magoManager);
	
	if (magoManager.pointSC === undefined)
	{ magoManager.pointSC = new Point3D(); }
	
	var pointSC = magoManager.pointSC;
	var pointSC2 = magoManager.pointSC2;
	
	pointSC.set(rayCamSpace[0], rayCamSpace[1], rayCamSpace[2]);

	// now, must transform this posCamCoord to world coord.
	var mvMatInv = magoManager.sceneState.getModelViewMatrixInv();
	pointSC2 = mvMatInv.rotatePoint3D(pointSC, pointSC2); // rayWorldSpace.
	pointSC2.unitary(); // rayWorldSpace.
	resultRay.setPointAndDir(camPos.x, camPos.y, camPos.z,       pointSC2.x, pointSC2.y, pointSC2.z);// original.

	return resultRay;
};

/**
 * 두 점을 연결한 선과 정북선 사이의 각도 구하기. 주로 모델이나 데이터의 헤딩을 설정하는데 사용.
 * @param {GeographicCoord} startGeographic 
 * @param {GeographicCoord} endGeographic 
 * @returns {number} heading
 */
ManagerUtils.getHeadingToNorthByTwoGeographicCoords = function(startGeographic, endGeographic, magoManager) 
{
	var firstGeoLocData = ManagerUtils.calculateGeoLocationData(startGeographic.longitude, startGeographic.latitude, 0, 0, 0, 0, firstGeoLocData, magoManager);

	var lastWorldCoord = ManagerUtils.geographicCoordToWorldPoint(endGeographic.longitude, endGeographic.latitude, 0, lastWorldCoord, magoManager);
	var lastLocalCoord3D = firstGeoLocData.worldCoordToLocalCoord(lastWorldCoord, lastLocalCoord3D);
	var lastLocalCoord2D = new Point2D(lastLocalCoord3D.x, lastLocalCoord3D.y);
	lastLocalCoord2D.unitary();
	var yAxis = new Point2D(0, 1);
	var heading = yAxis.angleDegToVector(lastLocalCoord2D);
	if (lastLocalCoord2D.x > 0) 
	{
		heading *= -1;
	}

	return heading;
};

/**
 * Using screen coordinate, return world coord, geographic coord, screen coord.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @returns {object} world coord, geographic coord, screen coord.
 */
ManagerUtils.getComplexCoordinateByScreenCoord = function(gl, pixelX, pixelY, depthFbo, frustumNear, frustumFar, magoManager) 
{
	var worldCoord = ManagerUtils.screenCoordToWorldCoord(magoManager.getGl(), pixelX, pixelY, worldCoord, undefined, undefined, undefined, magoManager);
	if (!worldCoord) 
	{
		return null;
	}
	var geographicCoord = ManagerUtils.pointToGeographicCoord(worldCoord, geographicCoord);
	
	return {
		screenCoordinate     : new Point2D(pixelX, pixelY),
		worldCoordinate      : worldCoord,
		geographicCoordinate : geographicCoord
	};
};

ManagerUtils.geographicToWkt = function(geographic, type) 
{
	var wkt = '';
	
	switch (type) 
	{
	case 'POINT' : {
		wkt = 'POINT (';
		wkt += geographic.longitude;
		wkt += ' ';
		wkt += geographic.latitude;
		wkt += ')';
		break;
	}
	case 'LINE' : {
		wkt = 'LINESTRING (';
		for (var i=0, len=geographic.length;i<len;i++) 
		{
			if (i>0) 
			{
				wkt += ',';
			}
			wkt += geographic[i].longitude;
			wkt += ' ';
			wkt += geographic[i].latitude;
		}
		wkt += ')';
		break;
	}
	case 'POLYGON' : {
		wkt = 'POLYGON ((';
		for (var i=0, len=geographic.length;i<len;i++) 
		{
			if (i>0) 
			{
				wkt += ',';
			}
			wkt += geographic[i].longitude;
			wkt += ' ';
			wkt += geographic[i].latitude;
		}
		wkt += ',';
		wkt += geographic[0].longitude;
		wkt += ' ';
		wkt += geographic[0].latitude;
		wkt += '))';
		break;
	}
	}

	function coordToString(coord, str) 
	{
		var text = str ? str : '';
		if (Array.isArray(coord)) 
		{
			for (var j=0, coordLen=coord.length;j<coordLen;j++) 
			{
				coordToString(coord[j], text);
			}
		}
		else 
		{
			if (text) 
			{
				text += ',';
			}
			text += coord.longitude;
			text += ' ';
			text += coord.latitude;
		}
		
		return text;
	}
	
	return wkt;
};
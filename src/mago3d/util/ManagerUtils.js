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
 * world coordinate to geographic coordinate.
 * @param {Point3D} point world coordinate.
 * @param {GeographicCoord|undefined} resultGeographicCoord Optional. result geographicCoord. if undefined, create GeographicCoord instance.
 * @param {MagoManager} magoManager worldwind mode removed, this args is not need. 
 * @return {GeographicCoord} geographic coordinate object.
 */
ManagerUtils.pointToGeographicCoord = function(point, resultGeographicCoord, magoManager) 
{
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
 * @param {MagoManager} magoManager worldwind mode removed, this args is not need. 
 * @return {Point3D} world coordinate object.
 */
ManagerUtils.geographicCoordToWorldPoint = function(longitude, latitude, altitude, resultWorldPoint, magoManager) 
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

	geoLocationData.pivotPointTraslation = rawTranslation;
	geoLocationData.doEffectivePivotPointTranslation();
};

/**
 * this function calculates the transformation matrix for (x, y, z) coordinate, that has NO heading, pitch or roll rotations.
 * @param {Point3D} worldPosition worldPosition.
 * @param {Matrix4|undefined} resultGeoLocMatrix. Optional. result geolocation matrix. if undefined, create Matrix4 instance.
 * @return {Matrix4} resultGeoLocMatrix. this matrix has NO heading, pitch or roll rotations.
 */
ManagerUtils.calculateGeoLocationMatrixAtWorldPosition = function(worldPosition, resultGeoLocMatrix, magoManager) 
{
	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4(); }

	if (magoManager.globe === undefined)
	{ magoManager.globe = new Globe(); }
	magoManager.globe.transformMatrixAtCartesianPointWgs84(worldPosition.x, worldPosition.y, worldPosition.z, resultGeoLocMatrix._floatArrays);
	
	return resultGeoLocMatrix;
};

/**
 * this function calculates the transformation matrix for (longitude, latitude, altitude) coordinate, that has NO heading, pitch or roll rotations.
 * @param {number} longitude longitude.
 * @param {number} latitude latitude.
 * @param {number} altitude altitude.
 * @param {Matrix4|undefined} resultGeoLocMatrix. Optional. result geolocation matrix. if undefined, create Matrix4 instance.
 * @return {Matrix4} resultGeoLocMatrix. this matrix has NO heading, pitch or roll rotations.
 */
ManagerUtils.calculateGeoLocationMatrixAtLonLatAlt = function(longitude, latitude, altitude, resultGeoLocMatrix, magoManager) 
{
	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4(); }
	
	var worldPosition = this.geographicCoordToWorldPoint(longitude, latitude, altitude, worldPosition, magoManager);
	resultGeoLocMatrix = ManagerUtils.calculateGeoLocationMatrixAtWorldPosition(worldPosition, resultGeoLocMatrix, magoManager);
	
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
 * @return {Matrix4} resultTransformMatrix.
 */
ManagerUtils.calculateTransformMatrixAtWorldPosition = function(worldPosition, heading, pitch, roll, resultGeoLocMatrix, resultTransformMatrix, magoManager) 
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
	resultGeoLocMatrix = ManagerUtils.calculateGeoLocationMatrixAtWorldPosition(worldPosition, resultGeoLocMatrix, magoManager);
	
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
 * @return {GeoLocationData} resultGeoLocationData.
 */
ManagerUtils.calculateGeoLocationData = function(longitude, latitude, altitude, heading, pitch, roll, resultGeoLocationData, magoManager) 
{
	if (resultGeoLocationData === undefined)
	{ resultGeoLocationData = new GeoLocationData(); }

	// 0) Position.********************************************************************************************
	if (resultGeoLocationData.geographicCoord === undefined)
	{ resultGeoLocationData.geographicCoord = new GeographicCoord(); }

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
	
	if (magoManager.configInformation === undefined)
	{ return; }

	resultGeoLocationData.position = this.geographicCoordToWorldPoint(longitude, latitude, altitude, resultGeoLocationData.position, magoManager);
	
	// High and Low values of the position.********************************************************************
	if (resultGeoLocationData.positionHIGH === undefined)
	{ resultGeoLocationData.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
	if (resultGeoLocationData.positionLOW === undefined)
	{ resultGeoLocationData.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
	this.calculateSplited3fv([resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z], resultGeoLocationData.positionHIGH, resultGeoLocationData.positionLOW);

	// Determine the elevation of the position.***********************************************************
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

	// Set inverseMatrices as undefined.***
	resultGeoLocationData.tMatrixInv = undefined; // reset. is calculated when necessary.***
	resultGeoLocationData.rotMatrixInv = undefined; // reset. is calculated when necessary.***
	resultGeoLocationData.geoLocMatrixInv = undefined; // reset. is calculated when necessary.***

	// 1rst, calculate the transformation matrix for the location.
	resultGeoLocationData.tMatrix = ManagerUtils.calculateTransformMatrixAtWorldPosition(resultGeoLocationData.position, resultGeoLocationData.heading, resultGeoLocationData.pitch, resultGeoLocationData.roll, 
		resultGeoLocationData.geoLocMatrix, resultGeoLocationData.tMatrix, magoManager);
	resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[14] = 0;
	
	// finally assing the pivotPoint.***
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
 * @return {GeoLocationData} resultGeoLocationData.
 */
ManagerUtils.calculateGeoLocationDataByAbsolutePoint = function(absoluteX, absoluteY, absoluteZ, resultGeoLocationData, magoManager) 
{
	if (resultGeoLocationData === undefined)
	{ resultGeoLocationData = new GeoLocationData(); }

	// 0) Position.********************************************************************************************
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
	if (magoManager.configInformation.geo_view_library === Constant.CESIUM)
	{
		// *if this in Cesium:
		//resultGeoLocationData.position = Cesium.Cartesian3.fromDegrees(resultGeoLocationData.geographicCoord.longitude, resultGeoLocationData.geographicCoord.latitude, resultGeoLocationData.geographicCoord.altitude);
		// must find cartographic data.***
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

	// High and Low values of the position.********************************************************************
	if (resultGeoLocationData.positionHIGH === undefined)
	{ resultGeoLocationData.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
	if (resultGeoLocationData.positionLOW === undefined)
	{ resultGeoLocationData.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
	this.calculateSplited3fv([resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z], resultGeoLocationData.positionHIGH, resultGeoLocationData.positionLOW);

	// Determine the elevation of the position.***********************************************************
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

	var xRotMatrix = new Matrix4();  // created as identity matrix.***
	var yRotMatrix = new Matrix4();  // created as identity matrix.***
	var zRotMatrix = new Matrix4();  // created as identity matrix.***

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
	
	if (magoManager.configInformation.geo_view_library === Constant.CESIUM)
	{
		// *if this in Cesium:
		Cesium.Transforms.eastNorthUpToFixedFrame(resultGeoLocationData.position, undefined, resultGeoLocationData.tMatrix._floatArrays);
		resultGeoLocationData.geoLocMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);// "geoLocMatrix" is the pure transformation matrix, without heading or pitch or roll.***

		var zRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(resultGeoLocationData.tMatrix, zRotatedTMatrix);
		var zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
		var zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
		resultGeoLocationData.tMatrix = zxyRotatedTMatrix;
		
		// test.***
		//var yRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(resultGeoLocationData.tMatrix, yRotatedTMatrix);
		//var yxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(yRotatedTMatrix, yxRotatedTMatrix);
		//var yxzRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(yxRotatedTMatrix, yxzRotatedTMatrix);
		//resultGeoLocationData.tMatrix = yxzRotatedTMatrix;
		// end test.---

		resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
		resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
		resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
		resultGeoLocationData.rotMatrix._floatArrays[14] = 0;

		// now, calculates the inverses.***
		Cesium.Matrix4.inverse(resultGeoLocationData.tMatrix._floatArrays, resultGeoLocationData.tMatrixInv._floatArrays);
		Cesium.Matrix4.inverse(resultGeoLocationData.rotMatrix._floatArrays, resultGeoLocationData.rotMatrixInv._floatArrays);
		Cesium.Matrix4.inverse(resultGeoLocationData.geoLocMatrix._floatArrays, resultGeoLocationData.geoLocMatrixInv._floatArrays);
	}

	// finally assing the pivotPoint.***
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
 * @return {SplitValue} resultSplitValue.
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








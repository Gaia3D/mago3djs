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

ManagerUtils.pointToGeographicCoord = function(point, resultGeographicCoord, magoManager) 
{
	if (resultGeographicCoord === undefined)
	{ resultGeographicCoord = new GeographicCoord(); }
	
	if (magoManager.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		var globe = magoManager.wwd.globe;
		var origin = new WorldWind.Position();
		origin = globe.computePositionFromPoint(point.x, point.y, point.z, origin);
		resultGeographicCoord.setLonLatAlt(origin.longitude, origin.latitude, origin.altitude);
	}
	else 
	{
		var cartographic = Globe.CartesianToGeographicWgs84(point.x, point.y, point.z, cartographic);
		resultGeographicCoord.setLonLatAlt(cartographic.longitude, cartographic.latitude, cartographic.altitude);
	}
	
	return resultGeographicCoord;
};

ManagerUtils.geographicCoordToWorldPoint = function(longitude, latitude, altitude, resultWorldPoint, magoManager) 
{
	if (resultWorldPoint === undefined)
	{ resultWorldPoint = new Point3D(); }

	if (magoManager.configInformation !== undefined && magoManager.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		var cartesian = Globe.geographicToCartesianWgs84(longitude, latitude, altitude, undefined);
		resultWorldPoint.set(cartesian[1], cartesian[2], cartesian[0]);
		return resultWorldPoint;
	}
	
	var cartesian = Globe.geographicToCartesianWgs84(longitude, latitude, altitude, undefined);
	resultWorldPoint.set(cartesian[0], cartesian[1], cartesian[2]);
	
	return resultWorldPoint;
};

ManagerUtils.translatePivotPointGeoLocationData = function(geoLocationData, newPivotPoint) 
{
	// this function NO modifies the geographic coords.***
	// "newPivotPoint" is in buildingCoords.***
	// "newPivotPoint" is the desired position of the new origen of coords, for example:
	// in a building you can desire the center of the bbox as the origin of the coords.***
	if (geoLocationData === undefined)
	{ return; }

	var rawTranslation = new Point3D();
	rawTranslation.set(-newPivotPoint.x, -newPivotPoint.y, -newPivotPoint.z);

	geoLocationData.pivotPointTraslation = rawTranslation;
	geoLocationData.doEffectivePivotPointTranslation();
};

ManagerUtils.calculateGeoLocationMatrixAtWorldPosition = function(worldPosition, resultGeoLocMatrix, magoManager) 
{
	// this function calculates the transformation matrix for (x, y, z) coordinate, that has NO heading, pitch or roll rotations.
	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4(); }

	if (magoManager.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		// * if this in webWorldWind:
		var xAxis = new WorldWind.Vec3(0, 0, 0),
			yAxis = new WorldWind.Vec3(0, 0, 0),
			zAxis = new WorldWind.Vec3(0, 0, 0);
		var tMatrix = WorldWind.Matrix.fromIdentity();
		
		WorldWind.WWMath.localCoordinateAxesAtPoint([worldPosition.x, worldPosition.y, worldPosition.z], magoManager.wwd.globe, xAxis, yAxis, zAxis);
				
		tMatrix.set(
			xAxis[0], yAxis[0], zAxis[0], worldPosition.x,
			xAxis[1], yAxis[1], zAxis[1], worldPosition.y,
			xAxis[2], yAxis[2], zAxis[2], worldPosition.z,
			0, 0, 0, 1);
		
		var tMatrixColMajorArray = WorldWind.Matrix.fromIdentity();
		tMatrixColMajorArray = tMatrix.columnMajorComponents(tMatrixColMajorArray);
		resultGeoLocMatrix.setByFloat32Array(tMatrixColMajorArray);
		return resultGeoLocMatrix;
	}

	if (magoManager.globe === undefined)
	{ magoManager.globe = new Globe(); }
	magoManager.globe.transformMatrixAtCartesianPointWgs84(worldPosition.x, worldPosition.y, worldPosition.z, resultGeoLocMatrix._floatArrays);
	
	return resultGeoLocMatrix;
};

ManagerUtils.calculateGeoLocationMatrixAtLonLatAlt = function(longitude, latitude, altitude, resultGeoLocMatrix, magoManager) 
{
	// this function calculates the transformation matrix for (longitude, latitude, altitude) coordinate, that has NO heading, pitch or roll rotations.
	if (resultGeoLocMatrix === undefined)
	{ resultGeoLocMatrix = new Matrix4(); }
	
	var worldPosition;
	worldPosition = this.geographicCoordToWorldPoint(longitude, latitude, altitude, worldPosition, magoManager);
	resultGeoLocMatrix = ManagerUtils.calculateGeoLocationMatrixAtWorldPosition(worldPosition, resultGeoLocMatrix, magoManager);
	
	return resultGeoLocMatrix;
};

ManagerUtils.calculateTransformMatrixAtWorldPosition = function(worldPosition, heading, pitch, roll, resultGeoLocMatrix, resultTransformMatrix, magoManager) 
{
	// This function calculates the "resultGeoLocMatrix" & "resultTransformMatrix".
	// note: "resultGeoLocMatrix" is the transformMatrix without the heading, pitch, roll rotations.
	// note: "resultTransformMatrix" is the transformMatrix including the heading, pitch, roll rotations.
	var xRotMatrix = new Matrix4();  // created as identity matrix.
	var yRotMatrix = new Matrix4();  // created as identity matrix.
	var zRotMatrix = new Matrix4();  // created as identity matrix.
	
	if (heading !== undefined && heading !== 0)
	{ zRotMatrix.rotationAxisAngDeg(heading, 0.0, 0.0, 1.0); }

	if (pitch !== undefined && pitch !== 0)
	{ xRotMatrix.rotationAxisAngDeg(pitch, 1.0, 0.0, 0.0); }

	if (roll !== undefined && roll !== 0)
	{ yRotMatrix.rotationAxisAngDeg(roll, 0.0, 1.0, 0.0); }

	/*
	if (heading !== undefined && heading !== 0)
	{ zRotMatrix.rotationAxisAngDeg(heading, 0.0, 0.0, -1.0); }

	if (pitch !== undefined && pitch !== 0)
	{ xRotMatrix.rotationAxisAngDeg(pitch, -1.0, 0.0, 0.0); }

	if (roll !== undefined && roll !== 0)
	{ yRotMatrix.rotationAxisAngDeg(roll, 0.0, -1.0, 0.0); }
	*/

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

ManagerUtils.calculateGeoLocationData = function(longitude, latitude, altitude, heading, pitch, roll, resultGeoLocationData, magoManager) 
{
	// This function calculates all data and matrices for the location(longitude, latitude, altitude) and rotation(heading, pitch, roll).
	// Note: Heading, pitch & roll are angles in degree.***
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
		
	if (magoManager.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		var globe = magoManager.wwd.globe;
		var resultCartographic = new WorldWind.Vec3(0, 0, 0);
		resultCartographic = globe.computePositionFromPoint(absoluteX, absoluteY, absoluteZ, resultCartographic);
		resultGeoLocationData.geographicCoord.longitude = resultCartographic.longitude;
		resultGeoLocationData.geographicCoord.latitude = resultCartographic.latitude;
		resultGeoLocationData.geographicCoord.altitude = resultCartographic.altitude;
	}
	else if (magoManager.configInformation.geo_view_library === Constant.CESIUM)
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
	
	if (magoManager.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		// * if this in webWorldWind:
		var xAxis = new WorldWind.Vec3(0, 0, 0),
			yAxis = new WorldWind.Vec3(0, 0, 0),
			zAxis = new WorldWind.Vec3(0, 0, 0);
		var rotMatrix = WorldWind.Matrix.fromIdentity();
		var tMatrix = WorldWind.Matrix.fromIdentity();
		
		WorldWind.WWMath.localCoordinateAxesAtPoint([resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z], magoManager.wwd.globe, xAxis, yAxis, zAxis);

		rotMatrix.set(
			xAxis[0], yAxis[0], zAxis[0], 0,
			xAxis[1], yAxis[1], zAxis[1], 0,
			xAxis[2], yAxis[2], zAxis[2], 0,
			0, 0, 0, 1); 
				
		tMatrix.set(
			xAxis[0], yAxis[0], zAxis[0], resultGeoLocationData.position.x,
			xAxis[1], yAxis[1], zAxis[1], resultGeoLocationData.position.y,
			xAxis[2], yAxis[2], zAxis[2], resultGeoLocationData.position.z,
			0, 0, 0, 1);
				
		var columnMajorArray = WorldWind.Matrix.fromIdentity(); 
		columnMajorArray = rotMatrix.columnMajorComponents(columnMajorArray); // no used.***
			
		var matrixInv = WorldWind.Matrix.fromIdentity();
		matrixInv.invertMatrix(rotMatrix);
		var columnMajorArrayAux_inv = WorldWind.Matrix.fromIdentity();
		var columnMajorArray_inv = matrixInv.columnMajorComponents(columnMajorArrayAux_inv); 
		
		var tMatrixColMajorArray = WorldWind.Matrix.fromIdentity();
		tMatrixColMajorArray = tMatrix.columnMajorComponents(tMatrixColMajorArray);
		resultGeoLocationData.tMatrix.setByFloat32Array(tMatrixColMajorArray);
		
		resultGeoLocationData.geoLocMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix); // "geoLocMatrix" is the pure transformation matrix, without heading or pitch or roll.***

		var zRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(resultGeoLocationData.tMatrix, zRotatedTMatrix);
		var zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
		var zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
		resultGeoLocationData.tMatrix = zxyRotatedTMatrix;

		resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
		resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
		resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
		resultGeoLocationData.rotMatrix._floatArrays[14] = 0;
		
		// now calculate the inverses of the matrices.***
		var tMatrixInv = WorldWind.Matrix.fromIdentity();
		tMatrixInv.invertMatrix(resultGeoLocationData.tMatrix._floatArrays);
		resultGeoLocationData.tMatrixInv.setByFloat32Array(tMatrixInv);
		
		var rotMatrixInv = WorldWind.Matrix.fromIdentity();
		rotMatrixInv.invertMatrix(resultGeoLocationData.rotMatrix._floatArrays);
		resultGeoLocationData.rotMatrixInv.setByFloat32Array(rotMatrixInv);
		
		var geoLocMatrixInv = WorldWind.Matrix.fromIdentity();
		geoLocMatrixInv.invertMatrix(resultGeoLocationData.geoLocMatrix._floatArrays);
		resultGeoLocationData.geoLocMatrixInv.setByFloat32Array(geoLocMatrixInv);
	}
	else if (magoManager.configInformation.geo_view_library === Constant.CESIUM)
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

ManagerUtils.calculateSplitedValues = function(value, resultSplitValue)
{
	if (resultSplitValue === undefined)
	{ resultSplitValue = new SplitValue(); }

	var doubleHigh;
	if (value >= 0.0) 
	{
		doubleHigh = Math.floor(value / 65536.0) * 65536.0;
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

ManagerUtils.calculateSplited3fv = function(point3fv, resultSplitPoint3fvHigh, resultSplitPoint3fvLow)
{
	if (point3fv === undefined)
	{ return undefined; }

	if (resultSplitPoint3fvHigh === undefined) // delete unnecesary.
	{ resultSplitPoint3fvHigh = new Float32Array(3); }// delete unnecesary.

	if (resultSplitPoint3fvLow === undefined)// delete unnecesary.
	{ resultSplitPoint3fvLow = new Float32Array(3); }// delete unnecesary.

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

/**
 * Calculates the pixel linear depth value.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} pixelX Screen x position of the pixel.
 * @param {Number} pixelY Screen y position of the pixel.
 * @param {FBO} depthFbo Depth frameBuffer object.
 * @param {MagoManager} magoManager Mago3D main manager.
 * @return {Number} linearDepth Returns the linear depth [0.0, 1.0] ranged value.
 */
ManagerUtils.calculatePixelLinearDepth = function(gl, pixelX, pixelY, depthFbo, magoManager) 
{
	//gl.depthRange(0, 1);
	//gl.frontFace(gl.CCW);

	if (depthFbo === undefined)
	{ depthFbo = magoManager.depthFboNeo; }
	
	if (depthFbo) 
	{
		depthFbo.bind(); // bind the existent last depthFramebuffer.
	}

	// Now, read the pixel and find the pixel position.
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(pixelX, magoManager.sceneState.drawingBufferHeight - pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);
	
	var zDepth = depthPixels[0]/(256.0*256.0*256.0) + depthPixels[1]/(256.0*256.0) + depthPixels[2]/256.0 + depthPixels[3]; // 0 to 256 range depth.***
	var linearDepth = zDepth / 256.0; // LinearDepth. Convert to [0.0, 1.0] range depth.***
	return linearDepth;
};






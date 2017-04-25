'use strict';

function ManagerUtils() {};

ManagerUtils.calculateBuildingPositionMatrix = function(neoBuilding) {
	// old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.***
	// old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.***
	// old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.***
	var metaData = neoBuilding.metaData;
	if( metaData == undefined
			|| metaData.geographicCoord.longitude == undefined
			|| metaData.geographicCoord.latitude == undefined
			|| metaData.geographicCoord.altitude == undefined ) return false;

	// 0) PositionMatrix.************************************************************************
	var position;
	if(neoBuilding.buildingPosition != undefined)
	{
		position = neoBuilding.buildingPosition;
	}
	else
	{
		position = Cesium.Cartesian3.fromDegrees(metaData.geographicCoord.longitude, metaData.geographicCoord.latitude, metaData.geographicCoord.altitude);
	}
	neoBuilding.buildingPosition = position;

	// High and Low values of the position.****************************************************
	//var splitValue = Cesium.EncodedCartesian3.encode(position); // no works.***
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);

	neoBuilding.buildingPositionHIGH = new Float32Array(3);
	neoBuilding.buildingPositionHIGH[0] = splitVelue_X.high;
	neoBuilding.buildingPositionHIGH[1] = splitVelue_Y.high;
	neoBuilding.buildingPositionHIGH[2] = splitVelue_Z.high;

	neoBuilding.buildingPositionLOW = new Float32Array(3);
	neoBuilding.buildingPositionLOW[0] = splitVelue_X.low;
	neoBuilding.buildingPositionLOW[1] = splitVelue_Y.low;
	neoBuilding.buildingPositionLOW[2] = splitVelue_Z.low;

	// Determine the elevation of the position.***********************************************************
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    //var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	neoBuilding.move_matrix = new Float32Array(16); // PositionMatrix.***
	neoBuilding.moveMatrixInv = new Float32Array(16); // Inverse of PositionMatrix.***
	neoBuilding.transfMat = new Matrix4();
	neoBuilding.transfMatInv = new Matrix4();
	Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, neoBuilding.move_matrix);
	neoBuilding.transfMat.setByFloat32Array(neoBuilding.move_matrix);
	neoBuilding.transfMat_inv = new Float32Array(16);
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.transfMat_inv);

	neoBuilding.move_matrix[12] = 0;
	neoBuilding.move_matrix[13] = 0;
	neoBuilding.move_matrix[14] = 0;
	neoBuilding.buildingPosition = position;
	// note: "neoBuilding.move_matrix" is only rotation matrix.***

	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.moveMatrixInv);
	neoBuilding.transfMatInv.setByFloat32Array(neoBuilding.moveMatrixInv);

	return true;
};

ManagerUtils.translatePivotPointGeoLocationData = function(geoLocationData, newPivotPoint) {
	// this function NO modifies the geographic coords.***
	// "newPivotPoint" is the desired position of the new origen of coords, for example:
	// in a building you can desire the center of the bbox as the origin of the coords.***
	if(geoLocationData == undefined)
		return;

	var rawTranslation = new Point3D();
	rawTranslation.set(-newPivotPoint.x, -newPivotPoint.y, -newPivotPoint.z);

	var traslationVector;
	var realBuildingPos;
	realBuildingPos = geoLocationData.tMatrix.transformPoint3D(newPivotPoint, realBuildingPos );
	traslationVector = geoLocationData.tMatrix.rotatePoint3D(rawTranslation, traslationVector );
	geoLocationData.position.x += traslationVector.x;
	geoLocationData.position.y += traslationVector.y;
	geoLocationData.position.z += traslationVector.z;
	//geoLocationData.positionHIGH;
	geoLocationData.aditionalTraslation = traslationVector;
	geoLocationData.positionLOW[0] += traslationVector.x;
	geoLocationData.positionLOW[1] += traslationVector.y;
	geoLocationData.positionLOW[2] += traslationVector.z;

	realBuildingPos.x += traslationVector.x;
	realBuildingPos.y += traslationVector.y;
	realBuildingPos.z += traslationVector.z;

	if(geoLocationData.pivotPoint == undefined)
		geoLocationData.pivotPoint = new Point3D();

	geoLocationData.pivotPoint.set(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
};

ManagerUtils.calculateGeoLocationData = function(longitude, latitude, altitude, heading, pitch, roll, resultGeoLocationData) {

	if(resultGeoLocationData == undefined)
		resultGeoLocationData = new GeoLocationData();

	// 0) Position.********************************************************************************************
	if(resultGeoLocationData.geographicCoord == undefined)
		resultGeoLocationData.geographicCoord = new GeographicCoord();

	if(longitude != undefined)
		resultGeoLocationData.geographicCoord.longitude = longitude;

	if(latitude != undefined)
		resultGeoLocationData.geographicCoord.latitude = latitude;

	if(altitude != undefined)
		resultGeoLocationData.geographicCoord.altitude = altitude;

	if(heading != undefined)
		resultGeoLocationData.heading = heading;

	if(pitch != undefined)
		resultGeoLocationData.pitch = pitch;

	if(roll != undefined)
		resultGeoLocationData.roll = roll;

	if(resultGeoLocationData.geographicCoord.longitude == undefined || resultGeoLocationData.geographicCoord.latitude == undefined)
		return;

	// *if this in Cesium:
	resultGeoLocationData.position = Cesium.Cartesian3.fromDegrees(resultGeoLocationData.geographicCoord.longitude, resultGeoLocationData.geographicCoord.latitude, resultGeoLocationData.geographicCoord.altitude);

	// High and Low values of the position.********************************************************************
	if(resultGeoLocationData.positionHIGH == undefined)
		resultGeoLocationData.positionHIGH = new Float32Array([0.0, 0.0, 0.0]);
	if(resultGeoLocationData.positionLOW == undefined)
		resultGeoLocationData.positionLOW = new Float32Array([0.0, 0.0, 0.0]);
	this.calculateSplited3fv([resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z], resultGeoLocationData.positionHIGH, resultGeoLocationData.positionLOW);

	// Determine the elevation of the position.***********************************************************
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    //var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	if(resultGeoLocationData.tMatrix == undefined)
		resultGeoLocationData.tMatrix = new Matrix4();
	else
		resultGeoLocationData.tMatrix.Identity();

	if(resultGeoLocationData.geoLocMatrix == undefined)
		resultGeoLocationData.geoLocMatrix = new Matrix4();
	else
		resultGeoLocationData.geoLocMatrix.Identity();

	if(resultGeoLocationData.geoLocMatrixInv == undefined)
		resultGeoLocationData.geoLocMatrixInv = new Matrix4();
	else
		resultGeoLocationData.geoLocMatrixInv.Identity();

	//---------------------------------------------------------

	if(resultGeoLocationData.tMatrixInv == undefined)
		resultGeoLocationData.tMatrixInv = new Matrix4();
	else
		resultGeoLocationData.tMatrixInv.Identity();

	if(resultGeoLocationData.rotMatrix == undefined)
		resultGeoLocationData.rotMatrix = new Matrix4();
	else
		resultGeoLocationData.rotMatrix.Identity();

	if(resultGeoLocationData.rotMatrixInv == undefined)
		resultGeoLocationData.rotMatrixInv = new Matrix4();
	else
		resultGeoLocationData.rotMatrixInv.Identity();

	var xRotMatrix = new Matrix4();  // created as identity matrix.***
	var yRotMatrix = new Matrix4();  // created as identity matrix.***
	var zRotMatrix = new Matrix4();  // created as identity matrix.***

	if(resultGeoLocationData.heading != undefined && resultGeoLocationData.heading != 0)
	{
		zRotMatrix.rotationAxisAngDeg(resultGeoLocationData.heading, 0.0, 0.0, -1.0);
	}

	if(resultGeoLocationData.pitch != undefined && resultGeoLocationData.pitch != 0)
	{
		xRotMatrix.rotationAxisAngDeg(resultGeoLocationData.pitch, -1.0, 0.0, 0.0);
	}

	if(resultGeoLocationData.roll != undefined && resultGeoLocationData.roll != 0)
	{
		yRotMatrix.rotationAxisAngDeg(resultGeoLocationData.roll, 0.0, -1.0, 0.0);
	}

	Cesium.Transforms.eastNorthUpToFixedFrame(resultGeoLocationData.position, undefined, resultGeoLocationData.tMatrix._floatArrays);
	resultGeoLocationData.geoLocMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);

	var zRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(resultGeoLocationData.tMatrix, zRotatedTMatrix);
	var zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
	var zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
	resultGeoLocationData.tMatrix = zxyRotatedTMatrix;

	resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[14] = 0;

	// now, calculates the inverses.***
	Cesium.Matrix4.inverse(resultGeoLocationData.tMatrix._floatArrays, resultGeoLocationData.tMatrixInv._floatArrays);
	Cesium.Matrix4.inverse(resultGeoLocationData.rotMatrix._floatArrays, resultGeoLocationData.rotMatrixInv._floatArrays);
	Cesium.Matrix4.inverse(resultGeoLocationData.geoLocMatrix._floatArrays, resultGeoLocationData.geoLocMatrixInv._floatArrays);

	// finally assing the pivotPoint.***
	if(resultGeoLocationData.pivotPoint == undefined)
		resultGeoLocationData.pivotPoint = new Point3D();

	resultGeoLocationData.pivotPoint.set(resultGeoLocationData.position.x, resultGeoLocationData.position.y, resultGeoLocationData.position.z);

	return resultGeoLocationData;
};

ManagerUtils.calculateSplitedValues = function(value, resultSplitValue)
{
	if(resultSplitValue == undefined)
		resultSplitValue = new SplitValue();

	var doubleHigh;
	if (value >= 0.0) {
		doubleHigh = Math.floor(value / 65536.0) * 65536.0;
		resultSplitValue.high = doubleHigh;
		resultSplitValue.low = value - doubleHigh;
	} else {
		doubleHigh = Math.floor(-value / 65536.0) * 65536.0;
		resultSplitValue.high = -doubleHigh;
		resultSplitValue.low = value + doubleHigh;
	}

	return resultSplitValue;
};

ManagerUtils.calculateSplited3fv = function(point3fv, resultSplitPoint3fvHigh, resultSplitPoint3fvLow)
{
	if(point3fv == undefined)
		return undefined;

	if(resultSplitPoint3fvHigh == undefined)
		resultSplitPoint3fvHigh = new Float32Array(3);

	if(resultSplitPoint3fvLow == undefined)
		resultSplitPoint3fvLow = new Float32Array(3);

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

ManagerUtils.getBuildingCurrentPosition = function(renderingMode, neoBuilding) {
	// renderingMode = 0 => assembled.***
	// renderingMode = 1 => dispersed.***

	if(neoBuilding == undefined) return undefined;

	var realBuildingPos;

	// 0 = assembled mode. 1 = dispersed mode.***
	if(renderingMode == 1) {
		if(neoBuilding.geoLocationDataAux == undefined) {
			var realTimeLocBlocksList = MagoConfig.getInformation().blockConfig.blocks;
			var newLocation = realTimeLocBlocksList[neoBuilding.buildingId];
			// must calculate the realBuildingPosition (bbox_center_position).***

			if(newLocation) {
				neoBuilding.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(newLocation.LONGITUDE, newLocation.LATITUDE, newLocation.ELEVATION, neoBuilding.geoLocationDataAux);

				//this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
				neoBuilding.point3dScratch.set(0.0, 0.0, 50.0);
				realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(neoBuilding.point3dScratch, realBuildingPos );
			} else {
				// use the normal data.***
				neoBuilding.point3dScratch = neoBuilding.bbox.getCenterPoint3d(neoBuilding.point3dScratch);
				realBuildingPos = neoBuilding.transfMat.transformPoint3D(neoBuilding.point3dScratch, realBuildingPos );
			}
		} else {
			//this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
			neoBuilding.point3dScratch.set(0.0, 0.0, 50.0);
			realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(neoBuilding.point3dScratch, realBuildingPos );
		}
	} else {
		neoBuilding.point3dScratch = neoBuilding.bbox.getCenterPoint3d(neoBuilding.point3dScratch);
		realBuildingPos = neoBuilding.transfMat.transformPoint3D(neoBuilding.point3dScratch, realBuildingPos );
	}

	return realBuildingPos;
};

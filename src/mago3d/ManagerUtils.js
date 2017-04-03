'use strict';

function ManagerUtils() {};

ManagerUtils.calculateBuildingPositionMatrix = function(neoBuilding) {
	var metaData = neoBuilding.metaData;
	if( metaData == undefined
			|| metaData.longitude == undefined 
			|| metaData.latitude == undefined 
			|| metaData.altitude == undefined ) return false;
	
	// 0) PositionMatrix.************************************************************************
	var position = Cesium.Cartesian3.fromDegrees(metaData.longitude, metaData.latitude, metaData.altitude);
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
	neoBuilding.move_matrix_inv = new Float32Array(16); // Inverse of PositionMatrix.***
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
	
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.move_matrix_inv);
	neoBuilding.transfMatInv.setByFloat32Array(neoBuilding.move_matrix_inv);
	
	return true;
};

ManagerUtils.calculateGeoLocationData = function(longitude, latitude, altitude, resultGeoLocationData) {
	
	if(resultGeoLocationData == undefined) resultGeoLocationData = new GeoLocationData();
	
	// 0) Position.********************************************************************************************
	resultGeoLocationData.longitude = longitude;
	resultGeoLocationData.latitude = latitude;
	resultGeoLocationData.elevation = altitude;
	
	resultGeoLocationData.position = Cesium.Cartesian3.fromDegrees(resultGeoLocationData.longitude, resultGeoLocationData.latitude, resultGeoLocationData.elevation);
	
	// High and Low values of the position.********************************************************************
	//var splitValue = Cesium.EncodedCartesian3.encode(position); // no works.***
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(resultGeoLocationData.position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(resultGeoLocationData.position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(resultGeoLocationData.position.z);
	
	resultGeoLocationData.positionHIGH = new Float32Array([splitVelue_X.high, splitVelue_Y.high, splitVelue_Z.high]);
	resultGeoLocationData.positionLOW = new Float32Array([splitVelue_X.low, splitVelue_Y.low, splitVelue_Z.low]);
	
	// Determine the elevation of the position.***********************************************************
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    //var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	resultGeoLocationData.tMatrix = new Matrix4();
	resultGeoLocationData.tMatrixInv = new Matrix4(); 
	resultGeoLocationData.rotMatrix = new Matrix4(); 
	resultGeoLocationData.rotMatrixInv = new Matrix4(); 
	
	Cesium.Transforms.eastNorthUpToFixedFrame(resultGeoLocationData.position, undefined, resultGeoLocationData.tMatrix._floatArrays);
	Cesium.Matrix4.inverse(resultGeoLocationData.tMatrix._floatArrays, resultGeoLocationData.tMatrixInv._floatArrays);
	
	resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[14] = 0;
	
	Cesium.Matrix4.inverse(resultGeoLocationData.rotMatrix._floatArrays, resultGeoLocationData.rotMatrixInv._floatArrays);

	return resultGeoLocationData;
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
				neoBuilding.point3d_scratch.set(0.0, 0.0, 50.0);
				realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(neoBuilding.point3d_scratch, realBuildingPos );
			} else {
				// use the normal data.***
				neoBuilding.point3d_scratch = neoBuilding.bbox.getCenterPoint3d(neoBuilding.point3d_scratch);
				realBuildingPos = neoBuilding.transfMat.transformPoint3D(neoBuilding.point3d_scratch, realBuildingPos );
			}
		} else {
			//this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
			neoBuilding.point3d_scratch.set(0.0, 0.0, 50.0);
			realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(neoBuilding.point3d_scratch, realBuildingPos );
		}
	} else {
		neoBuilding.point3d_scratch = neoBuilding.bbox.getCenterPoint3d(neoBuilding.point3d_scratch);
		realBuildingPos = neoBuilding.transfMat.transformPoint3D(neoBuilding.point3d_scratch, realBuildingPos );
	}
	
	return realBuildingPos;
};

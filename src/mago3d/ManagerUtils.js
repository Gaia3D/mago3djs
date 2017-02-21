'use strict';

var ManagerUtils = ManagerUtils || {};

ManagerUtils.calculateBuildingPositionMatrix = function(neoBuilding)
{
	var metaData = neoBuilding.metaData;
	if(metaData == undefined) return false;
	if(metaData.longitude == undefined || metaData.latitude == undefined || metaData.altitude == undefined ) {
		return false;
	}
	
	// 0) PositionMatrix.************************************************************************
	var position = Cesium.Cartesian3.fromDegrees(metaData.longitude, metaData.latitude, metaData.altitude);
	neoBuilding.buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	//var splitValue = Cesium.EncodedCartesian3.encode(position); // no works.***
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	neoBuilding.buildingPositionHIGH = new Float32Array([splitVelue_X.high, splitVelue_Y.high, splitVelue_Z.high]);
	neoBuilding.buildingPositionLOW = new Float32Array([splitVelue_X.low, splitVelue_Y.low, splitVelue_Z.low]);
	// End.-----------------------------------------------------------------------------------
	
	// Determine the elevation of the position.***********************************************************
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    //var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	neoBuilding.move_matrix = new Float32Array(16); // PositionMatrix.***
	neoBuilding.move_matrix_inv = new Float32Array(16); // Inverse of PositionMatrix.***
	
	Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, neoBuilding.move_matrix);
	neoBuilding.transfMat_inv = new Float32Array(16);
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.transfMat_inv);
	
	neoBuilding.move_matrix[12] = 0;
	neoBuilding.move_matrix[13] = 0;
	neoBuilding.move_matrix[14] = 0;
	neoBuilding.buildingPosition = position;
	// note: "neoBuilding.move_matrix" is only rotation matrix.***
	
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.move_matrix_inv);
	
	return true;
};

function ManagerUtils() {};

ManagerUtils.calculateBuildingPositionMatrix = function(neoBuilding)
{
	var metaData = neoBuilding.metaData;
	
	if(metaData == undefined)
		return false;
	
	if(metaData.longitude == undefined || metaData.latitude == undefined || metaData.altitude == undefined )
		return false;
	
	// 0) PositionMatrix.************************************************************************
	var position = Cesium.Cartesian3.fromDegrees(metaData.longitude, metaData.latitude, metaData.altitude);
	neoBuilding._buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	//var splitValue = Cesium.EncodedCartesian3.encode(position); // no works.***
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	neoBuilding._buildingPositionHIGH = new Float32Array(3);
	neoBuilding._buildingPositionHIGH[0] = splitVelue_X.high;
	neoBuilding._buildingPositionHIGH[1] = splitVelue_Y.high;
	neoBuilding._buildingPositionHIGH[2] = splitVelue_Z.high;
	
	neoBuilding._buildingPositionLOW = new Float32Array(3);
	neoBuilding._buildingPositionLOW[0] = splitVelue_X.low;
	neoBuilding._buildingPositionLOW[1] = splitVelue_Y.low;
	neoBuilding._buildingPositionLOW[2] = splitVelue_Z.low;
	// End.-----------------------------------------------------------------------------------
	
	// Determine the elevation of the position.***********************************************************
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    //var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	neoBuilding.move_matrix = new Float32Array(16); // PositionMatrix.***
	neoBuilding.move_matrix_inv = new Float32Array(16); // Inverse of PositionMatrix.***
	neoBuilding.f4dTransfMat = new Matrix4();
	neoBuilding.f4dTransfMatInv = new Matrix4();
	Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, neoBuilding.move_matrix);
	neoBuilding.f4dTransfMat.setByFloat32Array(neoBuilding.move_matrix);
	neoBuilding.transfMat_inv = new Float32Array(16);
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.transfMat_inv);
	
	neoBuilding.move_matrix[12] = 0;
	neoBuilding.move_matrix[13] = 0;
	neoBuilding.move_matrix[14] = 0;
	neoBuilding._buildingPosition = position;
	// note: "neoBuilding.move_matrix" is only rotation matrix.***
	
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.move_matrix_inv);
	neoBuilding.f4dTransfMatInv.setByFloat32Array(neoBuilding.move_matrix_inv);
	
	return true;
};
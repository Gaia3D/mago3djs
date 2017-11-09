'use strict';

/**
 * 변환 행렬 API
 * @class LocationAndRotationAPI
 */
var LocationAndRotationAPI = {};

LocationAndRotationAPI.changeLocationAndRotation = function(api, magoManager) 
{
	// 변환 행렬
	// find the building.***
	var buildingId = api.getDataKey();
	var buildingType = "structure";
	var building = this.getNeoBuildingByTypeId(buildingType, buildingId);

	this.changeLocationAndRotation(api.getDataKey(),
		parseFloat(api.getLatitude()),
		parseFloat(api.getLongitude()),
		parseFloat(api.getElevation()),
		parseFloat(api.getHeading()),
		parseFloat(api.getPitch()),
		parseFloat(api.getRoll()));
};
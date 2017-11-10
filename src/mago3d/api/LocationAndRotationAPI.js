'use strict';

/**
 * 변환 행렬 API
 * @class LocationAndRotationAPI
 */
var LocationAndRotationAPI = {};

LocationAndRotationAPI.changeLocationAndRotation = function(api, magoManager) 
{
//	var buildingId = api.getDataKey();
//	var buildingType = "structure";
//	var building = this.getNeoBuildingByTypeId(buildingType, buildingId);

	var changeHistory = new ChangeHistory();
	changeHistory.setProjectId(api.getProjectId());
	changeHistory.setDataKey(api.getDataKey());
	changeHistory.setLatitude(parseFloat(api.getLatitude()));
	changeHistory.setLongitude(parseFloat(api.getLongitude()));
	changeHistory.setElevation(parseFloat(api.getElevation()));
	changeHistory.setHeading(parseFloat(api.getHeading()));
	changeHistory.setPitch(parseFloat(api.getPitch()));
	changeHistory.setRoll(parseFloat(api.getRoll()));
	
	magoManager.changeLocationAndRotation(	api.getProjectId(),
		api.getDataKey(),
		parseFloat(api.getLatitude()),
		parseFloat(api.getLongitude()),
		parseFloat(api.getElevation()),
		parseFloat(api.getHeading()),
		parseFloat(api.getPitch()),
		parseFloat(api.getRoll()));
	
	// MagoConfig에 저장......?
};
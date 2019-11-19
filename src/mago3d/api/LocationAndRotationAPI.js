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
	
	var lat = api.getLatitude();
	var lon = api.getLongitude();
	var elevation = api.getElevation();
	var heading = api.getHeading();
	var pitch = api.getPitch();
	var roll = api.getRoll();


	magoManager.changeLocationAndRotation(	api.getProjectId(),
		api.getDataKey(),
		lat,
		lon,
		elevation,
		heading,
		pitch,
		roll,
		api.getAnimationOption()
	);
	
	// MagoConfig에 저장......?
};
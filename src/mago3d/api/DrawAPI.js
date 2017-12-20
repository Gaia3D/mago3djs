'use strict';

/**
 * Draw 관련 API를 담당하는 클래스
 * 원래는 이렇게 만들려고 한게 아니지만, legacy 파일이랑 이름, function 등이 중복되서 이렇게 만들었음
 * @class DrawAPI
 */
var DrawAPI = {};

DrawAPI.drawAppendData = function(api, magoManager) 
{
	magoManager.getObjectIndexFileTEST(api.getProjectId(), api.getProjectDataFolder());
};

DrawAPI.drawInsertIssueImage = function(api, magoManager) 
{
	// pin 을 표시
	if (magoManager.objMarkerSC === undefined || api.getDrawType() === 0) 
	{
		magoManager.objMarkerSC = new ObjectMarker();
		magoManager.objMarkerSC.geoLocationData.geographicCoord = new GeographicCoord();
		ManagerUtils.calculateGeoLocationData(parseFloat(api.getLongitude()), parseFloat(api.getLatitude()), parseFloat(api.getElevation()), 
			undefined, undefined, undefined, magoManager.objMarkerSC.geoLocationData, magoManager);
	}
	
	var objMarker = magoManager.objMarkerManager.newObjectMarker();
	
	magoManager.objMarkerSC.issue_id = api.getIssueId();
	magoManager.objMarkerSC.issue_type = api.getIssueType();
	magoManager.objMarkerSC.geoLocationData.geographicCoord.setLonLatAlt(parseFloat(api.getLongitude()), parseFloat(api.getLatitude()), parseFloat(api.getElevation()));
	
	objMarker.copyFrom(magoManager.objMarkerSC);
	magoManager.objMarkerSC = undefined;
};
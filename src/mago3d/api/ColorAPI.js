'use strict';

/**
 * color 처리 관련 도메인
 * @class ColorAPI
 */
var ColorAPI = {};

ColorAPI.changeColor = function(api, magoManager) 
{
	var projectId = api.getProjectId();
	var dataKey = api.getDataKey();
	var objectIds = api.getObjectIds();
	var property = api.getProperty();
	var color = api.getColor().split(",");
	var rgbColor = [ color[0]/255, color[1]/255, color[2]/255 ] ;
	
	var isExistObjectIds = false;
	if (objectIds !== null && objectIds.length !== 0) 
	{
		isExistObjectIds = true;
	}
	
	var changeHistorys = [];
	if (isExistObjectIds) 
	{
		for (var i=0, objectCount = objectIds.length; i<objectCount; i++) 
		{
			var changeHistory = new ChangeHistory();
			changeHistory.setProjectId(projectId);
			changeHistory.setDataKey(dataKey);
			changeHistory.setObjectId(objectIds[i]);
			changeHistory.setProperty(property);
			changeHistory.setRgbColor(rgbColor);
			
			changeHistorys.push(changeHistory);
		}
	}
	else 
	{
		var changeHistory = new ChangeHistory();
		changeHistory.setProjectId(projectId);
		changeHistory.setDataKey(dataKey);
		changeHistory.setObjectId(null);
		changeHistory.setProperty(property);
		changeHistory.setRgbColor(rgbColor);
		
		changeHistorys.push(changeHistory);
	}
	
	// 여기 구현
	// property 값이 isMain=true 와 같이 들어 갑니다. isMain을 뽑아서.... node에서 찾아서.... true 로 다 바꿔야 합니다.
};
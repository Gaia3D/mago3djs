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
	var propertyKey = null;
	var propertyValue = null;
	if (property !== null && property !== "") 
	{
		var properties = property.split("=");
		propertyKey = properties[0];
		propertyValue = properties[1];
	}
	var colorString = api.getColor();
	if (colorString === undefined || colorString === 0)
	{ return; }
	
	var color = api.getColor().split(",");
	var colorsValueCount = color.length;
	var alpha = 255.0;
	if (colorsValueCount === 4)
	{
		alpha = color[3]/255;
	}
	
	var rgbaColor = [ color[0]/255, color[1]/255, color[2]/255, alpha ] ;
	
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
			changeHistory.setPropertyKey(propertyKey);
			changeHistory.setPropertyValue(propertyValue);
			//changeHistory.setRgbColor(rgbColor);
			changeHistory.setColor(rgbaColor);
			
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
		changeHistory.setPropertyKey(propertyKey);
		changeHistory.setPropertyValue(propertyValue);
		//changeHistory.setRgbColor(rgbColor);
		changeHistory.setColor(rgbaColor);
		changeHistorys.push(changeHistory);
	}

	var changeHistory;
	var historiesCount = changeHistorys.length;
	for (var i=0; i<historiesCount; i++)
	{
		changeHistory = changeHistorys[i];
		magoManager.config.saveColorHistory(projectId, dataKey, changeHistory.getObjectId(), changeHistory);
	}
};
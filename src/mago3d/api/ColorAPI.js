'use strict';

/**
 * color 처리 관련 도메인
 * @class ColorAPI
 */
var ColorAPI = {};

ColorAPI.changeColor = function(api, magoManager) 
{
	var projectId = api.getProjectId();
	var objectIds = api.getObjectIds();
	var isExistObjectIds = false;
	if (objectIds !== null && objectIds.length !== 0) 
	{
		isExistObjectIds = true;
	}
	var colorBuilds = [];
	
		if (isExistObjectIds) 
		{
			for (var j=0, objectCount = objectIds.length; j<objectCount; j++) 
			{
				var projectLayer = new ProjectLayer();
				projectLayer.setProjectId(projectId);
				projectLayer.setBlockId(blockIds[i].trim());
				projectLayer.setObjectId(objectIds[j].trim());
				colorBuilds.push(projectLayer);
			}
		}
		else 
		{
			var projectLayer = new ProjectLayer();
			projectLayer.setProjectId(projectId);
			projectLayer.setBlockId(blockIds[i].trim());
			projectLayer.setObjectId(null);
			colorBuilds.push(projectLayer);
		}
	
	this.magoPolicy.setColorBuildings(colorBuilds);

	var rgbColor = api.getColor().split(",");
	var rgbArray = [ rgbColor[0]/255, rgbColor[1]/255, rgbColor[2]/255 ] ;
	this.magoPolicy.setColor(rgbArray);
	
	var buildingsCount = colorBuilds.length;
	for (var i=0; i<buildingsCount; i++)
	{
		//var projectAndBlockId = projectId + "_" + blockIds[i]; // old.***
		var projectAndBlockId = colorBuilds[i].projectId + "_" + colorBuilds[i].blockId;
		if (colorBuilds[i].objectId === null)
		{
			this.buildingColorChanged(projectAndBlockId, rgbArray);
		}
		else
		{
			this.objectColorChanged(projectAndBlockId, colorBuilds[i].objectId, rgbArray);
		}
		
	}
};
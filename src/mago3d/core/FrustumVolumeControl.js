'use strict';

/**
 * 카메라
 * @class FrustumVolumeControl
 */
var FrustumVolumeControl = function() 
{
	if (!(this instanceof FrustumVolumeControl)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.frustumVolumensMap = {};
};

FrustumVolumeControl.prototype.getFrustumVolumeCulling = function(key)
{
	// 1rst, check if exist. If no exist create it.***
	if (!this.frustumVolumensMap.hasOwnProperty(key))
	{
		this.frustumVolumensMap[key] = {};
		this.frustumVolumensMap[key].fullyIntersectedLowestTilesArray = [];
		this.frustumVolumensMap[key].partiallyIntersectedLowestTilesArray = [];
		this.frustumVolumensMap[key].visibleNodes = new VisibleObjectsController();
	}
	
	return this.frustumVolumensMap[key];
};

FrustumVolumeControl.prototype.initArrays = function()
{
	var frustumVolumeObject;
	for (var key in this.frustumVolumensMap)
	{
		frustumVolumeObject = this.frustumVolumensMap[key];
		frustumVolumeObject.fullyIntersectedLowestTilesArray.length = 0;
		frustumVolumeObject.partiallyIntersectedLowestTilesArray.length = 0;
		frustumVolumeObject.visibleNodes.initArrays();
	}
};
'use strict';

/**
 * Manage the objects which is shown at each volume of this frustum
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

/**
 * Find the specific volumn by the key of this.frustumVolumensMap
 * @param {Number} key
 * @returns {Frustum} 
 */
FrustumVolumeControl.prototype.getFrustumVolumeCulling = function(key)
{
	// 1rst, check if exist. If no exist create it.
	if (!this.frustumVolumensMap.hasOwnProperty(key))
	{
		this.frustumVolumensMap[key] = {};
		this.frustumVolumensMap[key].intersectedTilesArray = []; // todo: change name to "intersectedTilesArray".***
		this.frustumVolumensMap[key].visibleNodes = new VisibleObjectsController();
	}
	
	return this.frustumVolumensMap[key];
};

/**
 * Initiate and clear all the objects in the array
 */
FrustumVolumeControl.prototype.initArrays = function()
{
	var frustumVolumeObject;
	for (var key in this.frustumVolumensMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.frustumVolumensMap, key)) 
		{
			frustumVolumeObject = this.frustumVolumensMap[key];
			frustumVolumeObject.intersectedTilesArray.length = 0; // todo: change name to "intersectedTilesArray".***
			frustumVolumeObject.visibleNodes.initArrays();
		}
	}
};

/**
 * Returns the near & far considering all frustum partitions.
 */
FrustumVolumeControl.prototype.getTotalBoundingFrustum = function(resultBFrustum)
{
	resultBFrustum = {}; // init.
	
	var frustumVolumeObject;
	for (var key in this.frustumVolumensMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.frustumVolumensMap, key)) 
		{
			frustumVolumeObject = this.frustumVolumensMap[key];
			if (frustumVolumeObject.intersectedTilesArray.length > 0)
			{
				var bFrustumNear = frustumVolumeObject.visibleNodes.bFrustumNear;
				var bFrustumFar = frustumVolumeObject.visibleNodes.bFrustumFar;
				
				if (bFrustumNear !== undefined && bFrustumFar !== undefined)
				{
					if (resultBFrustum.bFrustumNear === undefined)
					{
						resultBFrustum.bFrustumNear = bFrustumNear;
					}
					else
					{
						if (bFrustumNear < resultBFrustum.bFrustumNear)
						{ resultBFrustum.bFrustumNear = bFrustumNear; }
					}
					
					if (resultBFrustum.bFrustumFar === undefined)
					{
						resultBFrustum.bFrustumFar = bFrustumFar;
					}
					else
					{
						if (bFrustumFar > resultBFrustum.bFrustumFar)
						{ resultBFrustum.bFrustumFar = bFrustumFar; }
					}
				}
			}
		}
	}
	
	return resultBFrustum;
};

/**
 * Returns the near & far considering all frustum partitions.
 */
FrustumVolumeControl.prototype.calculateBoundingFrustums = function(camera)
{
	var frustumVolumeObject;
	for (var key in this.frustumVolumensMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.frustumVolumensMap, key)) 
		{
			frustumVolumeObject = this.frustumVolumensMap[key];
			if (frustumVolumeObject.intersectedTilesArray.length > 0)
			{
				frustumVolumeObject.visibleNodes.calculateBoundingFrustum(camera);
			}
		}
	}
};









































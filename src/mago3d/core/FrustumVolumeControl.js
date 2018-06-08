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
	if(!this.frustumVolumensMap.hasOwnProperty(key))
	{
		this.frustumVolumensMap[key] = {};
		this.frustumVolumensMap[key].fullyIntersectedLowestTilesArray = [];
		this.frustumVolumensMap[key].partiallyIntersectedLowestTilesArray = [];
		this.frustumVolumensMap[key].lastIntersectedLowestTilesArray = [];
	}
	
	return this.frustumVolumensMap[key];
};
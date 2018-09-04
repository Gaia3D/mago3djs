'use strict';

/**
 * F4D LodBuildingData 클래스
 * 
 * @alias LodBuildingData
 * @class LodBuildingData
 */
var LodBuildingData = function() 
{
	if (!(this instanceof LodBuildingData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.lod;
	this.isModelRef;
	this.geometryFileName;
	this.textureFileName;
	//this.dataType; // no used yet.***
};
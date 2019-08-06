'use strict';

/**
 * This is a skin-type building.
 * @class SkinBuilding
 */
var SkinBuilding = function() 
{
	if (!(this instanceof SkinBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// SkinBuildings depends the MultiBuilding class object.***
	this.multiBuildingsOwner;
	
	this.indexRange;
	
	// This class can have lod textures.***
	
};
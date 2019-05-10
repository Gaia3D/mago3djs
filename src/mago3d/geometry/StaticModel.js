'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class StaticModel
 */
var StaticModel = function() 
{
	if (!(this instanceof StaticModel)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.guid;
	this.modelFullPath;
	this.neoBuilding; // F4D type data.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @class StaticModelsManager
 */
var StaticModelsManager = function() 
{
	if (!(this instanceof StaticModelsManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.staticModelsMap;
};

/**
 * @class StaticModelsManager
 */
/*
StaticModelsManager.prototype.addStaticModel = function(guid, staticModel)
{
	if(this.staticModelsMap === undefined)
		this.staticModelsMap = {};
	
	this.staticModelsMap[guid] = staticModel;
};
*/

/**
 * @class StaticModelsManager
 */
StaticModelsManager.prototype.getStaticModel = function(modelFullPath)
{
	var neoBuilding;
	
	if (this.staticModelsMap === undefined)
	{ this.staticModelsMap = {}; }
	
	neoBuilding = this.staticModelsMap[modelFullPath];
	if (neoBuilding === undefined)
	{
		// Create the neoBuilding.***
		neoBuilding = new NeoBuilding();
		this.staticModelsMap[modelFullPath] = neoBuilding;
	}
	
	return neoBuilding;
};






































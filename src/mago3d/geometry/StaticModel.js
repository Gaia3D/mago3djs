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
	//this.modelFullPath;
	this.buildingFolderName;
	this.projectFolderName;
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
 * Add StaticModel.
 * @param {String} guid.
 * @param {Object} staticModel.
 */
StaticModelsManager.prototype.addStaticModel = function(guid, staticModel)
{
	if (this.staticModelsMap === undefined)
	{ this.staticModelsMap = {}; }
	
	this.staticModelsMap[guid] = staticModel;
};

/**
 * Get StaticModel.
 * @param {String} projectId.
 * @return {Object|undefined} StaticModel.
 */
StaticModelsManager.prototype.getStaticModel = function(projectId)
{
	//var staticModel;
	//var neoBuilding;
	
	/*if (this.staticModelsMap === undefined)
	{ this.staticModelsMap = {}; }


	
	neoBuilding = this.staticModelsMap[modelFullPath];
	if (neoBuilding === undefined)
	{
		// Create the neoBuilding.***
		neoBuilding = new NeoBuilding();
		this.staticModelsMap[modelFullPath] = neoBuilding;
	}*/

	if (this.staticModelsMap === undefined)
	{ 
		throw new Error('StaticModel is not exist.');
	}

	var staticModel = this.staticModelsMap[projectId];
	if (staticModel === undefined)
	{
		throw new Error('StaticModel is not exist.');
	}
	return staticModel;
};






































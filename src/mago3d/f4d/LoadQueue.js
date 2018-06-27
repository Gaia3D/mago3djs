'use strict';

/**
 * LoadData
 * 
 * @alias LoadData
 * @class LoadData
 */
var LoadData = function() 
{
	if (!(this instanceof LoadData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// dataType:
	// 1. referencesArray.
	// 2. blocksArray.
	// 3. skinData. (octree's skinData & lod3,4,5 skinData).
	
	this.dataType;
	this.distToCam;
	this.lod;
	this.filePath;
	this.skinMesh;
};

/**
 * LoadQueue
 * 
 * @alias LoadQueue
 * @class LoadQueue
 */
var LoadQueue = function(magoManager) 
{
	if (!(this instanceof LoadQueue)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.magoManager;
	
	if(magoManager !== undefined)
		this.magoManager = magoManager;
	
	this.lowLodSkinDataMap = {};
	this.referencesToLoadMap = {};
};

LoadQueue.prototype.putLowLodSkinData = function(skinMesh, filePath, aValue)
{
	// "aValue" no used yet.***
	var loadData = new LoadData();
	loadData.dataType = 3;
	loadData.filePath = filePath;
	loadData.skinMesh = skinMesh;
	this.lowLodSkinDataMap[skinMesh.legoKey] = loadData;
};

LoadQueue.prototype.putReferences = function(references, filePath, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	//var key = octree.
	//this.referencesToLoadMap[key] = references;
};

LoadQueue.prototype.manageQueue = function()
{
	var readerWriter = this.magoManager.readerWriter;
	for(var key in this.lowLodSkinDataMap)
	{
		var loadData = this.lowLodSkinDataMap[key];
		var skinMesh = loadData.skinMesh;
		var filePath = loadData.filePath;
		readerWriter.getLegoArraybuffer(filePath, skinMesh, this.magoManager);
	}
};






























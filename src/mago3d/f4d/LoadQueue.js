'use strict';

/**
 * LoadData
 * @deprecated 삭제예정
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
	// 4. skinTexture.
	
	this.dataType;
	this.distToCam;
	this.lod;
	this.filePath;
	this.texFilePath;
	this.skinMesh;
	this.octree;
	this.texture;
};

LoadData.prototype.deleteObjects = function()
{
	// here deletes deletable objects.
	this.dataType = undefined;
	this.distToCam = undefined;
	this.lod = undefined;
	this.filePath = undefined;
	this.texFilePath = undefined;
	this.skinMesh = undefined;
	this.octree = undefined;
	this.texture = undefined;
};

/**
 * LoadQueue
 * @deprecated 삭제예정
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
	
	if (magoManager !== undefined)
	{ this.magoManager = magoManager; }
	
	this.lod2PCloudDataMap = {}; 

	this.tinTerrainDataMap = {};
};

LoadQueue.prototype.putLod2PCloudData = function(octree, filePath, texture, texFilePath, aValue)
{
	// "aValue" no used yet.
	octree.lego.fileLoadState = CODE.fileLoadState.IN_QUEUE;
	var loadData = new LoadData();
	loadData.filePath = filePath;
	loadData.octree = octree;
	
	loadData.texFilePath = texFilePath;
	loadData.texture = texture;
	
	this.lod2PCloudDataMap[filePath] = loadData;
};


LoadQueue.prototype.resetQueue = function()
{	
	for (var key in this.lod2PCloudDataMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.lod2PCloudDataMap, key))
		{
			var loadData = this.lod2PCloudDataMap[key];
			if (loadData.octree === undefined || loadData.octree.lego === undefined)
			{ continue; }
			
			loadData.octree.lego.fileLoadState = CODE.fileLoadState.READY;
		}
	}
	
	this.lod2PCloudDataMap = {};
};

LoadQueue.prototype.manageQueue = function()
{
	var maxFileLoad = 1;
	var readerWriter = this.magoManager.readerWriter;
	var gl = this.magoManager.sceneState.gl;
	var counter = 0;
	var remainLod2 = false;


	
	// Lod2 meshes, 1rst load texture..
	if (this.magoManager.fileRequestControler.isFullPlusLowLodImages())	
	{ 
		return; 
	}
	
	// pCloud data.
	counter = 0;
	for (var key in this.lod2PCloudDataMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.lod2PCloudDataMap, key))
		{
			var loadData = this.lod2PCloudDataMap[key];
			var octree = loadData.octree;
			var filePath = loadData.filePath;
			
			if (octree.lego !== undefined)
			{
				readerWriter.getOctreePCloudArraybuffer(filePath, octree, this.magoManager);
			}
			
			delete this.lod2PCloudDataMap[key];
			loadData.deleteObjects();
			loadData = undefined;
	
			counter++;
			if (counter > 4)
			{
				//this.lod2PCloudDataMap = {};
				remainLod2 = true;
				break;
			}
		}
	}
	
	this.resetQueue();
};
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
	
	this.lod2SkinDataMap = {}; // includes data & texture.***
	
	this.lowLodSkinDataMap = {};
	this.lowLodSkinTextureMap = {};

	this.referencesToLoadMap = {};
};

LoadQueue.prototype.putLod2SkinData = function(octree, filePath, texture, texFilePath, aValue)
{
	// "aValue" no used yet.***
	octree.lego.fileLoadState = CODE.fileLoadState.IN_QUEUE;
	var loadData = new LoadData();
	loadData.filePath = filePath;
	loadData.octree = octree;
	
	loadData.texFilePath = texFilePath;
	loadData.texture = texture;
	
	this.lod2SkinDataMap[filePath] = loadData;
};

LoadQueue.prototype.putLowLodSkinData = function(skinMesh, filePath, aValue)
{
	// "aValue" no used yet.***
	skinMesh.fileLoadState = CODE.fileLoadState.IN_QUEUE;
	
	var loadData = new LoadData();
	loadData.dataType = 3;
	loadData.filePath = filePath;
	loadData.skinMesh = skinMesh;
	this.lowLodSkinDataMap[skinMesh.legoKey] = loadData;
};

LoadQueue.prototype.putLowLodSkinTexture = function(filePath, texture, aValue)
{
	// "aValue" no used yet.***
	texture.fileLoadState = CODE.fileLoadState.IN_QUEUE;
	
	var loadData = new LoadData();
	loadData.dataType = 4;
	loadData.filePath = filePath;
	loadData.texture = texture;
	this.lowLodSkinTextureMap[filePath] = loadData;
};

LoadQueue.prototype.resetQueue = function()
{
	for(var key in this.lod2SkinDataMap)
	{
		var loadData = this.lod2SkinDataMap[key];
		loadData.octree.lego.fileLoadState = CODE.fileLoadState.READY;
	}
	
	this.lod2SkinDataMap = {};
	
	// Low lod meshes.***
	for(var key in this.lowLodSkinDataMap)
	{
		var loadData = this.lowLodSkinDataMap[key];
		loadData.skinMesh.fileLoadState = CODE.fileLoadState.READY;
	}
	
	this.lowLodSkinDataMap = {};
	
	for(var key in this.lowLodSkinTextureMap)
	{
		var loadData = this.lowLodSkinTextureMap[key];
		loadData.texture.fileLoadState = CODE.fileLoadState.READY;
	}
	
	this.lowLodSkinTextureMap = {};
};

LoadQueue.prototype.manageQueue = function()
{
	var maxFileLoad = 1;
	var readerWriter = this.magoManager.readerWriter;
	var gl = this.magoManager.sceneState.gl;
	var counter = 0;
	var remainLod2 = false;
	
	// Lod2 meshes, 1rst load texture.***.***
	counter = 0;
	for(var key in this.lod2SkinDataMap)
	{
		var loadData = this.lod2SkinDataMap[key];
		var octree = loadData.octree;
		var filePath = loadData.filePath;
		
		if(loadData.texture !== undefined && loadData.texture.fileLoadState === CODE.fileLoadState.READY)
			readerWriter.readLegoSimpleBuildingTexture(gl, loadData.texFilePath, loadData.texture, this.magoManager);
		
		readerWriter.getOctreeLegoArraybuffer(filePath, octree, this.magoManager);
		
		delete this.lod2SkinDataMap[key];

		counter++;
		if(counter > 4)
		{
			//this.lod2SkinDataMap = {};
			remainLod2 = true;
			break;
		}
	}
	
	
	if(remainLod2)
		return;
	
	// Low lod meshes.***
	counter = 0;
	for(var key in this.lowLodSkinDataMap)
	{
		var loadData = this.lowLodSkinDataMap[key];
		var skinMesh = loadData.skinMesh;
		var filePath = loadData.filePath;
		readerWriter.getLegoArraybuffer(filePath, skinMesh, this.magoManager);
		
		delete this.lowLodSkinDataMap[key];
		counter++;
		if(counter > maxFileLoad)
			break;
	}
	
	counter = 0;
	for(var key in this.lowLodSkinTextureMap)
	{
		var loadData = this.lowLodSkinTextureMap[key];
		var skinMesh = loadData.skinMesh;
		var filePath = loadData.filePath;
		readerWriter.readLegoSimpleBuildingTexture(gl, filePath, loadData.texture, this.magoManager);
		
		delete this.lowLodSkinTextureMap[key];
		counter++;
		if(counter > maxFileLoad)
			break;
	}
};






























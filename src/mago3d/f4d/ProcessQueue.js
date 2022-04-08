'use strict';

/**
 * ProcessQueue
 * 
 * @alias ProcessQueue
 * @class ProcessQueue
 */
var ProcessQueue = function() 
{
	if (!(this instanceof ProcessQueue)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.nodesToDeleteMap = {};
	this.nodesToDeleteModelReferencesMap = {};
	this.nodesToDeleteLessThanLod3Map = {};
	this.nodesToDeleteLessThanLod4Map = {};
	this.nodesToDeleteLessThanLod5Map = {};
	this.nodesToDeleteLodMeshMap = {}; // no used.
	this.tinTerrainsToDeleteMap = {};
	this.smartTilesToDeleteMap = {};

	// slow delete arrays.***
	this.nativeSlowDeleteArray = [];
	
	// Test.
	this.octreeToDeletePCloudsMap = {};
};

ProcessQueue.prototype.putSmartTileToDelete = function(smartTile, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (smartTile === undefined)
	{ return; }
	
	var key = smartTile.getId();
	this.smartTilesToDeleteMap[key] = smartTile;
};

ProcessQueue.prototype.eraseSmartTileToDelete = function(smartTile)
{
	// this erases the smartTile from the "smartTilesToDeleteMap".
	if (smartTile === undefined)
	{ return false; }
	
	var key = smartTile.getId();
	if (this.smartTilesToDeleteMap.hasOwnProperty(key)) 
	{
		delete this.smartTilesToDeleteMap[key];
		return true;
	}
	return false;
};

ProcessQueue.prototype.putOctreeToDeletePCloud = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (octree === undefined)
	{ return; }
	
	var key = octree.octreeKey;
	this.octreeToDeletePCloudsMap[key] = octree;
};

ProcessQueue.prototype.existOctreeToDeletePCloud = function(octree)
{
	if (octree === undefined)
	{ return false; }
	
	var key = octree.octreeKey;
	if (this.octreeToDeletePCloudsMap.hasOwnProperty(key)) 
	{
		return true;
	}
	return false;
};

ProcessQueue.prototype.eraseOctreeToDeletePCloud = function(octree)
{
	// this erases the octree from the "octreeToDeletePCloudsMap".
	if (octree === undefined)
	{ return false; }
	
	var key = octree.octreeKey;
	if (this.octreeToDeletePCloudsMap.hasOwnProperty(key)) 
	{
		delete this.octreeToDeletePCloudsMap[key];
		return true;
	}
	return false;
};

ProcessQueue.prototype.putNodeToDeleteLodMesh = function(node, aValue)
{
	if (node.isReferenceNode())
	{ return; }
	
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	this.nodesToDeleteLodMeshMap[key] = node;
	
	//this.nodesToDeleteLodMeshMap.set(node, aValue);
};

ProcessQueue.prototype.eraseNodeToDeleteLodMesh = function(node)
{
	// this erases the node from the "nodesToDeleteLessThanLod3Map".
	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	if (this.nodesToDeleteLodMeshMap.hasOwnProperty(key)) 
	{
		delete this.nodesToDeleteLodMeshMap[key];
		return true;
	}
	return false;
	//return this.nodesToDeleteLodMeshMap.delete(node);
};

ProcessQueue.prototype.putTinTerrainToDelete = function(tinTerrain, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (tinTerrain === undefined)
	{ return; }
	
	var key = tinTerrain.pathName;
	this.tinTerrainsToDeleteMap[key] = tinTerrain;
};

ProcessQueue.prototype.eraseTinTerrainToDelete = function(tinTerrain)
{
	// this erases the tinTerrain from the "tinTerrainsToDeleteMap".
	if (tinTerrain === undefined)
	{ return false; }
	
	var key = tinTerrain.pathName;
	if (this.tinTerrainsToDeleteMap.hasOwnProperty(key)) 
	{
		delete this.tinTerrainsToDeleteMap[key];
		return true;
	}
	return false;
};

ProcessQueue.prototype.putNodeToDeleteLessThanLod3 = function(node, aValue)
{
	if (node.isReferenceNode())
	{ return; }
	
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	this.nodesToDeleteLessThanLod3Map[key] = node;
};

ProcessQueue.prototype.eraseNodeToDeleteLessThanLod3 = function(node)
{
	// this erases the node from the "nodesToDeleteLessThanLod3Map".
	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	if (this.nodesToDeleteLessThanLod3Map.hasOwnProperty(key)) 
	{
		delete this.nodesToDeleteLessThanLod3Map[key];
		return true;
	}
	return false;
};

ProcessQueue.prototype.putNodeToDeleteLessThanLod4 = function(node, aValue)
{
	if (node.isReferenceNode())
	{ return; }
	
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	this.nodesToDeleteLessThanLod4Map[key] = node;
};

ProcessQueue.prototype.eraseNodeToDeleteLessThanLod4 = function(node)
{
	// this erases the node from the "nodesToDeleteLessThanLod4Map".
	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	if (this.nodesToDeleteLessThanLod4Map.hasOwnProperty(key)) 
	{
		delete this.nodesToDeleteLessThanLod4Map[key];
		return true;
	}
	return false;
};

ProcessQueue.prototype.putNodeToDeleteLessThanLod5 = function(node, aValue)
{
	if (node.isReferenceNode())
	{ return; }
	
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	this.nodesToDeleteLessThanLod5Map[key] = node;
};

ProcessQueue.prototype.eraseNodeToDeleteLessThanLod5 = function(node)
{
	// this erases the node from the "nodesToDeleteLessThanLod5Map".
	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	if (this.nodesToDeleteLessThanLod5Map.hasOwnProperty(key)) 
	{
		delete this.nodesToDeleteLessThanLod5Map[key];
		return true;
	}
	return false;
};

ProcessQueue.prototype.putNodeToDeleteModelReferences = function(node, aValue)
{
	// In this case check if the node is reference node type.
	if (node.isReferenceNode())
	{ return; }
	
	// this puts the node to the "nodesToDeleteModelReferencesMap".
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	this.nodesToDeleteModelReferencesMap[key] = node;
	//this.nodesToDeleteModelReferencesMap.set(node, aValue);
};

ProcessQueue.prototype.eraseNodeToDeleteModelReferences = function(node)
{
	// this erases the node from the "nodesToDeleteModelReferencesMap".
	if (!node || node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	if (this.nodesToDeleteModelReferencesMap.hasOwnProperty(key)) 
	{
		delete this.nodesToDeleteModelReferencesMap[key];
		return true;
	}
	return false;
	//return this.nodesToDeleteModelReferencesMap.delete(node);
};

ProcessQueue.prototype.putNodeToDelete = function(node, aValue)
{
	if (node.isReferenceNode())
	{ return; }
	
	// this puts the node to the "nodesToDeleteMap".
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }

	if (node.data === undefined || node.data.neoBuilding === undefined)
	{ return; }
	
	var key = node.data.neoBuilding.buildingId;
	this.nodesToDeleteMap[key] = node;
};

ProcessQueue.prototype.putNodesArrayToDelete = function(nodesToDeleteArray, aValue)
{
	if (nodesToDeleteArray === undefined)
	{ return; }
	
	// this puts the nodesToDeleteArray to the "nodesToDeleteArray".
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	var nodesToDeleteCount = nodesToDeleteArray.length;
	for (var i=0; i<nodesToDeleteCount; i++)
	{
		this.putNodeToDelete(nodesToDeleteArray[i], aValue);
	}
};

ProcessQueue.prototype.eraseNodeToDelete = function(node)
{
	// this erases the node from the "nodesToDeleteMap".
	var key = node.data.neoBuilding.buildingId;
	if (this.nodesToDeleteMap.hasOwnProperty(key)) 
	{
		delete this.nodesToDeleteMap[key];
		return true;
	}
	return false;
};

ProcessQueue.prototype.eraseNodesArrayToDelete = function(nodesToEraseArray)
{
	// this erases the node from the "nodesToDeleteMap".
	var key;
	var nodesCount = nodesToEraseArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		key = nodesToEraseArray[i].data.neoBuilding.buildingId;
		delete this.nodesToDeleteMap[key];
	}
};

ProcessQueue.prototype.clearAll = function()
{
	this.nodesToDeleteMap = {};
	this.nodesToDeleteModelReferencesMap = {};
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustumVolume 변수
 * @param neoVisibleBuildingsArray 변수
 * @param cameraPosition 변수
 * @returns neoVisibleBuildingsArray
 */
ProcessQueue.prototype.deleteNeoBuilding = function(gl, neoBuilding, magoManager) 
{
	// check if the neoBuilding id the selected building.
	var vboMemoryManager = magoManager.vboMemoryManager;

	var selectedBuildingArray = magoManager.selectionManager.getSelectedF4dBuildingArray();
	if (selectedBuildingArray.indexOf(neoBuilding) > -1)
	{
		magoManager.selectionManager.clearCurrents();
	}
	
	neoBuilding.deleteObjects(gl, vboMemoryManager);
	
};

ProcessQueue.prototype._slowDeleteNatives = function (magoManager)
{
	var slowDeletesCount = this.nativeSlowDeleteArray.length;
	if (slowDeletesCount > 0) 
	{
		var maxDeletesCount = 1;
		var vboMemManager = magoManager.vboMemoryManager;
		for (var i=0; i<maxDeletesCount; i++)
		{
			var native = this.nativeSlowDeleteArray.pop();
			native.deleteObjects(vboMemManager);
		}
	}
};

ProcessQueue.prototype.deleteSmartTiles = function (magoManager)
{
	var deletedCount = 0;
	var gl = magoManager.sceneState.gl;
	var node;
	var neoBuilding;
	var vboMemManager = magoManager.vboMemoryManager;

	for (var key in this.smartTilesToDeleteMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.smartTilesToDeleteMap, key))
		{
			var smartTile = this.smartTilesToDeleteMap[key];
			
			if (smartTile === undefined)
			{ continue; }

			if (this.eraseSmartTileToDelete(smartTile))
			{
				// Delete the smartTile.
				if (smartTile.nodesArray !== undefined)
				{
					var nodesCount = smartTile.nodesArray.length;
					for (var i=0; i<nodesCount; i++)
					{
						node = smartTile.nodesArray[i];

						if (!node.data) { continue; }

						neoBuilding = node.data.neoBuilding;

						if (neoBuilding === undefined)
						{ continue; }
					
						this.deleteNeoBuilding(gl, neoBuilding, magoManager);
						node.data.neoBuilding = undefined;
						//deletedCount++;
						//if (deletedCount >= 10)
						//{ break; }
					}
				}
				else
				{ smartTile.nodesArray = []; }
				
				smartTile.nodesArray.length = 0;
				if (smartTile.smartTileF4dSeedArray !== undefined)
				{
					var smartTileF4dSeedsCount = smartTile.smartTileF4dSeedArray.length;
					for (var i=0; i<smartTileF4dSeedsCount; i++)
					{
						smartTile.smartTileF4dSeedArray[i].fileLoadState = CODE.fileLoadState.READY;
					}
				}

				// delete natives that "isDeletableByFrustumCulling".***
				//if (smartTile.nativeObjects && smartTile.nativeObjects.generalObjectsArray) 
				{
					var nativesArray = smartTile.nativeObjects.generalObjectsArray;
					var nativeSeedArray = smartTile.nativeObjects.nativeSeedArray;
					var nativesCount = nativesArray.length;
					var nativesArrayAux = [];
					for (var i=0; i<nativesCount; i++)
					{
						var native = nativesArray[i];
						if (native.attributes.isDeletableByFrustumCulling) 
						{
							
							// delete this native.***
							//native.deleteObjects(vboMemManager);
							this.nativeSlowDeleteArray.push(native);
						}
						else 
						{
							nativesArrayAux.push(native);
						}
					}

					smartTile.nativeObjects.generalObjectsArray = nativesArrayAux;
					if (nativeSeedArray[0]) 
					{
						nativeSeedArray[0].status = KoreaBuildingSeed.STATUS.UNLOAD;
					}
				}
				
				deletedCount++;
				if (deletedCount >= 1)
				{ break; }
			}
		}
	}
};

ProcessQueue.prototype.manageDeleteQueue = function (magoManager)
{
	var gl = magoManager.sceneState.gl;
	var maxDeleteNodesCount = 8;
	var nodesToDeleteCount = Object.keys(this.nodesToDeleteMap).length;
	if (nodesToDeleteCount < maxDeleteNodesCount)
	{ maxDeleteNodesCount = nodesToDeleteCount; }
	
	var neoBuilding;
	var node;
	var rootNode;
	var deletedCount = 0;
	
	// incompatibility gulp.
	//for (var key of this.buildingsToDeleteMap.keys())
	//{
	//	this.deleteNeoBuilding(gl, key);
	//	this.buildingsToDeleteMap.delete(key);
	//	deletedCount += 1;
	//	if (deletedCount > maxDeleteBuildingsCount)
	//	{ break; }
	//}
	
	this.deleteSmartTiles(magoManager);
	this._slowDeleteNatives(magoManager);
	

	for (var key in this.nodesToDeleteMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.nodesToDeleteMap, key))
		{
			//node = nodesToDeleteArray[i];
			node = this.nodesToDeleteMap[key];
			
			if (node === undefined)
			{ continue; }

			neoBuilding = node.data.neoBuilding;
			if (this.eraseNodeToDelete(node))
			{
				if (neoBuilding === undefined)
				{ continue; }
			
				//var deleteMetaData = true;
				//if (key === 1)
				//{ deleteMetaData = false; }
				this.deleteNeoBuilding(gl, neoBuilding, magoManager);
				deletedCount++;
				if (deletedCount >= 10)
				{ break; }
			}
		}
	}
	
	// now delete modelReferences of lod2Octrees.
	var modelRefsDeletedCount = 0;
	for (var key in this.nodesToDeleteModelReferencesMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.nodesToDeleteModelReferencesMap, key))
		{
			//node = nodesToDeleteModelReferencesArray[i];
			node = this.nodesToDeleteModelReferencesMap[key];
			
			if (node.data === undefined)
			{ continue; }
		
			neoBuilding = node.data.neoBuilding;
			this.eraseNodeToDeleteModelReferences(node);
			if (neoBuilding === undefined)
			{ continue; }

			if (neoBuilding.octree)
			{
				neoBuilding.octree.deleteObjectsModelReferences(gl, magoManager.vboMemoryManager);
				neoBuilding.octree.deletePCloudObjects(gl, magoManager.vboMemoryManager);
			}
			if (neoBuilding.motherBlocksArray.length > 0 || neoBuilding.motherNeoReferencesArray.length > 0)
			{
				modelRefsDeletedCount ++;
			}
			neoBuilding.deleteObjectsModelReferences(gl, magoManager.vboMemoryManager);
			
			if (modelRefsDeletedCount > 10)
			{ break; }
		}
	}
	
	
	var deletedCount = 0;
	for (var key in this.nodesToDeleteLessThanLod3Map)
	{
		if (Object.prototype.hasOwnProperty.call(this.nodesToDeleteLessThanLod3Map, key))
		{
			node = this.nodesToDeleteLessThanLod3Map[key];
			//node = nodesToDeleteLod2Lod4Lod5Array[i];
			if (node.data === undefined)
			{ continue; }
		
			if (this.eraseNodeToDeleteLessThanLod3(node))
			{
				neoBuilding = node.data.neoBuilding;
				if (neoBuilding === undefined)
				{ continue; }
				
				if (neoBuilding.octree)
				{
					neoBuilding.octree.deleteObjectsModelReferences(gl, magoManager.vboMemoryManager);
					neoBuilding.octree.deletePCloudObjects(gl, magoManager.vboMemoryManager);
				}
				if (neoBuilding.motherBlocksArray.length > 0 || neoBuilding.motherNeoReferencesArray.length > 0)
				{
					modelRefsDeletedCount ++;
				}
					
				neoBuilding.deleteObjectsModelReferences(gl, magoManager.vboMemoryManager);
				neoBuilding.deleteObjectsLod2(gl, magoManager.vboMemoryManager);
				deletedCount++;
				
				if (deletedCount > 10)
				{ break; }
			}
		}
	}
	
	deletedCount = 0;
	for (var key in this.nodesToDeleteLessThanLod4Map)
	{
		if (Object.prototype.hasOwnProperty.call(this.nodesToDeleteLessThanLod4Map, key))
		{
			node = this.nodesToDeleteLessThanLod4Map[key];
			if (node.data === undefined)
			{ continue; }
		
			if (this.eraseNodeToDeleteLessThanLod4(node))
			{
				neoBuilding = node.data.neoBuilding;
				if (neoBuilding === undefined)
				{ continue; }
			
				neoBuilding.deleteObjectsModelReferences(gl, magoManager.vboMemoryManager);
				neoBuilding.deleteObjectsLod2(gl, magoManager.vboMemoryManager);
				neoBuilding.deleteObjectsLodMesh(gl, magoManager.vboMemoryManager, "lod3");
				deletedCount++;
				
				if (deletedCount > 10)
				{ break; }
			}
		}
	}
	
	deletedCount = 0;
	for (var key in this.nodesToDeleteLessThanLod5Map)
	{
		if (Object.prototype.hasOwnProperty.call(this.nodesToDeleteLessThanLod5Map, key))
		{
			node = this.nodesToDeleteLessThanLod5Map[key];
			if (node.data === undefined)
			{ continue; }
		
			if (this.eraseNodeToDeleteLessThanLod5(node))
			{
				neoBuilding = node.data.neoBuilding;
				if (neoBuilding === undefined)
				{ continue; }
			
				neoBuilding.deleteObjectsModelReferences(gl, magoManager.vboMemoryManager);
				neoBuilding.deleteObjectsLod2(gl, magoManager.vboMemoryManager);
				neoBuilding.deleteObjectsLodMesh(gl, magoManager.vboMemoryManager, "lod3");
				neoBuilding.deleteObjectsLodMesh(gl, magoManager.vboMemoryManager, "lod4");
				deletedCount++;
				
				if (deletedCount > 10)
				{ break; }
			}
		}
	}
	
	
	// now, delete lod0, lod1, lod2.
	// now, delete tinTerrains.
	var deletedCount = 0;
	for (var key in this.tinTerrainsToDeleteMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.tinTerrainsToDeleteMap, key))
		{
			var tinTerrain = this.tinTerrainsToDeleteMap[key];
			if (tinTerrain === undefined)
			{ continue; }
			
			if (this.eraseTinTerrainToDelete(tinTerrain))
			{
				// now, must erase from myOwner-childrenMap.
				delete tinTerrain.owner.childMap[tinTerrain.indexName];
				
				//if (tinTerrain.owner.childMap.length === 0)
				//{ tinTerrain.owner.childMap = undefined; }

				tinTerrain.deleteObjects(magoManager);
				tinTerrain = undefined;
				deletedCount++;
			}
			
			if (deletedCount > 20)
			{ break; }
		}
	}
	
	// PointsCloud.
	var deletedCount = 0;
	for (var key in this.octreeToDeletePCloudsMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.octreeToDeletePCloudsMap, key))
		{
			var octree = this.octreeToDeletePCloudsMap[key];
			if (octree === undefined)
			{ continue; }
			
			if (this.eraseOctreeToDeletePCloud(octree))
			{
				octree.deletePCloudObjects(gl, magoManager.vboMemoryManager);
				octree = undefined;
				deletedCount++;
			}
			
			if (deletedCount > 10000)
			{ break; }
		}
	}
};
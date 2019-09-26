'use strict';

/**
 * ParseQueue
 * 
 * @alias ParseQueue
 * @class ParseQueue
 */
var ParseQueue = function() 
{
	if (!(this instanceof ParseQueue)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// General objects.
	this.objectsToParseMap = {};
	
	// Particular objects.
	this.octreesLod0ReferencesToParseMap = {};
	this.octreesLod0ModelsToParseMap = {};
	this.octreesLod2LegosToParseMap = {};
	this.octreesPCloudToParseMap = {};
	this.octreesPCloudPartitionToParseMap = {}; 
	this.skinLegosToParseMap = {};
	this.tinTerrainsToParseMap = {};
	this.multiBuildingsToParseMap = {};
	
	this.maxNumParses = 10; // default 1.***
	
	// parse counters.***
	this.smartTileF4dParsesCount = 0;
	
	// Test for pCloudPartitions.***
	this.pCloudPartitionsParsed = 0;
	
	// Auxiliar vars.
	this.lowlodMeshesParsed = 0;

};

ParseQueue.prototype.putMultiBuildingsToParse = function(multiBuildings, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.multiBuildingsToParseMap[multiBuildings.id] = multiBuildings;
};

ParseQueue.prototype.eraseMultiBuildingsToParse = function(multiBuildings)
{
	if (multiBuildings === undefined)
	{ return; }
	
	var key = multiBuildings.id;
	if (this.multiBuildingsToParseMap.hasOwnProperty(key)) 
	{
		delete this.multiBuildingsToParseMap[key];
		return true;
	}
	return false;
};


ParseQueue.prototype.putTinTerrainToParse = function(tinTerrain, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.tinTerrainsToParseMap[tinTerrain.getPathName()] = tinTerrain;
};

ParseQueue.prototype.eraseTinTerrainToParse = function(tinTerrain)
{
	if (tinTerrain === undefined)
	{ return; }
	
	var key = tinTerrain.getPathName();
	if (this.tinTerrainsToParseMap.hasOwnProperty(key)) 
	{
		delete this.tinTerrainsToParseMap[key];
		return true;
	}
	return false;
};

ParseQueue.prototype.parseMultiBuildings = function(gl, nodesArray, magoManager)
{
	if (Object.keys(this.multiBuildingsToParseMap).length > 0)
	{
		var node;
		var maxParsesCount = this.maxNumParses;
		var nodesCount = nodesArray.length;
		for (var i=0; i<nodesCount; i++)
		{
			node = nodesArray[i];
			var multiBuildings = node.data.multiBuildings;
			if (this.eraseMultiBuildingsToParse(multiBuildings))
			{
				multiBuildings.parseData(magoManager);
			}
		}
	}
};

ParseQueue.prototype.parseArraySkins = function(gl, nodesArray, magoManager)
{
	if (Object.keys(this.skinLegosToParseMap).length > 0)
	{
		var node;
		var skinLego;
		var neoBuilding;
		var skinsParsedCount = 0;
		var maxParsesCount = this.maxNumParses;
		
		maxParsesCount = 40;
		
		var lod3buildingsCount = nodesArray.length;
		for (var i=0; i<lod3buildingsCount; i++)
		{
			node = nodesArray[i];
			neoBuilding = node.data.neoBuilding;
			
			if (neoBuilding === undefined || neoBuilding.lodMeshesMap === undefined)
			{ continue; }
		
		    // check the current lod of the building.***
			var currentBuildingLod = neoBuilding.currentLod;
			var lodIdx = currentBuildingLod;
			
			if (lodIdx < 0)
			{ continue; }// old.***
		
			var lodString = undefined;
			if (currentBuildingLod === 0)
			{ lodString = "lod0"; }
			else if (currentBuildingLod === 1)
			{ lodString = "lod1"; }
			else if (currentBuildingLod === 2)
			{ lodString = "lod2"; }
			else if (currentBuildingLod === 3)
			{ lodString = "lod3"; }
			else if (currentBuildingLod === 4)
			{ lodString = "lod4"; }
			else if (currentBuildingLod === 5)
			{ lodString = "lod5"; }

			if (lodString === undefined)
			{ continue; }
			
			///skinLego = neoBuilding.lodMeshesMap.get(lodString);
			skinLego = neoBuilding.lodMeshesMap[lodString];
			
			if (skinLego === undefined)
			{ continue; }
			
			if (this.eraseSkinLegosToParse(skinLego))
			{
				skinLego.parseArrayBuffer(skinLego.dataArrayBuffer, magoManager);
				skinLego.dataArrayBuffer = undefined;
				
				if(currentBuildingLod === 5 && skinLego.vbo_vicks_container.getVbosCount() > 0) {
					var posDataArray = skinLego.vbo_vicks_container.getVboKey(0).vboBufferPos.dataArray;
					node.data.onlyPosDataArray = posDataArray;
				}
				
				skinsParsedCount++;
			}
			if (skinsParsedCount > maxParsesCount)
			{ break; }
		}
		
		if (skinsParsedCount === 0)
		{
			for (var key in this.skinLegosToParseMap)
			{
				if (Object.prototype.hasOwnProperty.call(this.skinLegosToParseMap, key))
				{
					skinLego = this.skinLegosToParseMap[key];
				
					if (skinLego === undefined)
					{ continue; }
					if (this.eraseSkinLegosToParse(skinLego))
					{
						skinLego.parseArrayBuffer(skinLego.dataArrayBuffer, magoManager);
						skinLego.dataArrayBuffer = undefined;
						
						skinsParsedCount++;
					}
					if (skinsParsedCount > maxParsesCount)
					{ break; }	
				}
			}
		}
		
		
	}
};

ParseQueue.prototype.parseArrayOctreesPCloud = function(gl, octreesArray, magoManager)
{
	// Test function.***
	if (Object.keys(this.octreesPCloudToParseMap).length > 0)
	{
		var maxParsesCount = this.maxNumParses;
		var octreesParsedCount = 0;
		var lowestOctree;
		
		var octreesLod0Count = octreesArray.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = octreesArray[i];
			if (this.eraseOctreePCloudToParse(lowestOctree))
			{
				if (lowestOctree.lego === undefined)
				{ continue; }
				
				lowestOctree.lego.parsePointsCloudData(gl, lowestOctree.lego.dataArrayBuffer, magoManager);
				lowestOctree.lego.dataArrayBuffer = undefined;
				
				octreesParsedCount++;
			}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		
		if (octreesParsedCount === 0)
		{
			for (var key in this.octreesPCloudToParseMap)
			{
				if (Object.prototype.hasOwnProperty.call(this.octreesPCloudToParseMap, key))
				{
					lowestOctree = this.octreesPCloudToParseMap[key];
					if (this.eraseOctreePCloudToParse(lowestOctree))
					{
						if (lowestOctree.lego === undefined)
						{ continue; }
						
						lowestOctree.lego.parsePointsCloudData(lowestOctree.lego.dataArrayBuffer, gl, magoManager);
						lowestOctree.lego.dataArrayBuffer = undefined;
						
						octreesParsedCount++;
					}
					if (octreesParsedCount > maxParsesCount)
					{ break; }	
				}
				
			}
		}
		
		if (octreesParsedCount > 0)
		{
			if (this.selectionFbo)
			{ this.selectionFbo.dirty = true; }
		}
	}
};

ParseQueue.prototype.parseArrayOctreesPCloudPartition = function(gl, octreesArray, magoManager)
{
	// Test function.***
	if (Object.keys(this.octreesPCloudPartitionToParseMap).length > 0)
	{
		var maxParsesCount = this.maxNumParses;
		var octreesParsedCount = 0;
		var lowestOctree;
		
		var octreesLod0Count = octreesArray.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = octreesArray[i];
			
			// Check if has pCloudPartitions.***
			if (lowestOctree.pCloudPartitionsArray === undefined)
			{ continue; }
			
			var pCloudPartitionsCount = lowestOctree.pCloudPartitionsArray.length;
			for (var j=0; j<pCloudPartitionsCount; j++)
			{
				var pCloudPartition = lowestOctree.pCloudPartitionsArray[j];
				if (this.eraseOctreePCloudPartitionToParse(pCloudPartition))
				{
					pCloudPartition.parsePointsCloudData(gl, pCloudPartition.dataArrayBuffer, magoManager);
					pCloudPartition.dataArrayBuffer = undefined;
					octreesParsedCount++;
				}
			}
			
			//if (this.eraseOctreePCloudPartitionToParse(lowestOctree))
			//{
			//if (lowestOctree.lego === undefined)
			//{ continue; }
				
			//lowestOctree.lego.parsePointsCloudData(gl, lowestOctree.lego.dataArrayBuffer, magoManager);
			//lowestOctree.lego.dataArrayBuffer = undefined;
				
			//octreesParsedCount++;
			//}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		
		if (octreesParsedCount === 0)
		{
			for (var key in this.octreesPCloudPartitionToParseMap)
			{
				if (Object.prototype.hasOwnProperty.call(this.octreesPCloudPartitionToParseMap, key))
				{
					lowestOctree = this.octreesPCloudPartitionToParseMap[key];
					if (this.eraseOctreePCloudPartitionToParse(lowestOctree))
					{
						//if (lowestOctree.lego === undefined)
						//{ continue; }
						
						pCloudPartition.parsePointsCloudData(gl, pCloudPartition.dataArrayBuffer, magoManager);
						pCloudPartition.dataArrayBuffer = undefined;
						octreesParsedCount++;
					}
					if (octreesParsedCount > maxParsesCount)
					{ break; }	
				}
			}
		}
		
		if (octreesParsedCount > 0)
		{
			if (this.selectionFbo)
			{ this.selectionFbo.dirty = true; }
		}
	}
};

ParseQueue.prototype.parseArrayOctreesLod2Legos = function(gl, octreesArray, magoManager)
{
	if (Object.keys(this.octreesLod2LegosToParseMap).length > 0)
	{
		var maxParsesCount = this.maxNumParses;
		var octreesParsedCount = 0;
		var lowestOctree;
	
		var octreesLod0Count = octreesArray.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = octreesArray[i];
			if (this.eraseOctreeLod2LegosToParse(lowestOctree))
			{
				if (lowestOctree.lego === undefined)
				{ continue; }
				
				lowestOctree.lego.parseArrayBuffer(lowestOctree.lego.dataArrayBuffer, magoManager);
				lowestOctree.lego.dataArrayBuffer = undefined;
				
				octreesParsedCount++;
			}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		/*
		if (octreesParsedCount === 0)
		{
			for (var key in this.octreesLod2LegosToParseMap)
			{
				var lowestOctree = this.octreesLod2LegosToParseMap[key];
				if(this.eraseOctreeLod2LegosToParse(lowestOctree))
				{
					if (lowestOctree.lego === undefined)
					{ continue; }
					
					lowestOctree.lego.parseArrayBuffer(lowestOctree.lego.dataArrayBuffer, magoManager);
					lowestOctree.lego.dataArrayBuffer = undefined;
					
					octreesParsedCount++;
				}
				if (octreesParsedCount > maxParsesCount)
				{ break; }	

			}
		}
		*/
		if (octreesParsedCount > 0)
		{
			if (magoManager.selectionFbo)
			{ magoManager.selectionFbo.dirty = true; }
		}
	}
};

ParseQueue.prototype.parseArrayOctreesLod0Models = function(gl, octreesArray, magoManager)
{
	if (Object.keys(this.octreesLod0ModelsToParseMap).length > 0)
	{
		var maxParsesCount = this.maxNumParses;
		var octreesParsedCount = 0;
		// 1rst parse the currently closest lowestOctrees to camera.
		var neoBuilding;
		var headerVersion;
		var lowestOctree;
		
		var octreesLod0Count = octreesArray.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = octreesArray[i];
			
			// Temp code.******************************************
			neoBuilding = lowestOctree.neoBuildingOwner;
			headerVersion = neoBuilding.getHeaderVersion();
			// End temp code.---------------------------------------
			
			if (this.eraseOctreeLod0ModelsToParse(lowestOctree))
			{
				if (lowestOctree.neoReferencesMotherAndIndices === undefined)
				{ continue; }
				
				var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
				if (blocksList === undefined)
				{ continue; }
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				headerVersion = neoBuilding.getHeaderVersion();
				
				if (blocksList.dataArraybuffer === undefined)
				{ continue; }
			
				if (blocksList.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
				{ continue; }
				
				if (headerVersion[0] === "v")
				{
					// parse the beta version.***
					blocksList.parseBlocksList(blocksList.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherBlocksArray, magoManager);
				}
				else if (headerVersion === "0.0.1" || headerVersion === "0.0.2")
				{
					// parse versioned.***
					blocksList.parseBlocksListVersioned_v001(blocksList.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherBlocksArray, magoManager);
				}
				blocksList.dataArraybuffer = undefined;
				octreesParsedCount++;
			}

			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		/*
		if (octreesParsedCount === 0)
		{
			for (var key in this.octreesLod0ModelsToParseMap)
			{
				var lowestOctree = this.octreesLod0ModelsToParseMap[key];
				if(this.eraseOctreeLod0ModelsToParse(lowestOctree))
				{
					if (lowestOctree.neoReferencesMotherAndIndices === undefined)
					{ continue; }
					
					var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
					if (blocksList === undefined)
					{ continue; }
					
					if (blocksList.dataArraybuffer === undefined)
					{ continue; }
				
					if (blocksList.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
					{ continue; }
					
					neoBuilding = lowestOctree.neoBuildingOwner;
					headerVersion = neoBuilding.getHeaderVersion();
				
					if (headerVersion[0] === "v")
					{
						// parse the beta version.
						blocksList.parseBlocksList(blocksList.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherBlocksArray, magoManager);
					}
					else 
					{
						// parse versioned.
						blocksList.parseBlocksListVersioned(blocksList.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherBlocksArray, magoManager);
					}
					blocksList.dataArraybuffer = undefined;
					octreesParsedCount++;
					if (octreesParsedCount > maxParsesCount)
					{ break; }	
				}
				
			}
		}
		*/
		
		
		if (octreesParsedCount > 0)
		{
			if (magoManager.selectionFbo)
			{ magoManager.selectionFbo.dirty = true; }
		}
	}
};

ParseQueue.prototype.parseArrayOctreesLod0References = function(gl, octreesArray, magoManager)
{
	if (Object.keys(this.octreesLod0ReferencesToParseMap).length > 0)
	{
		var maxParsesCount = this.maxNumParses;
		var octreesParsedCount = 0;
		var lowestOctree;
		
		// 1rst parse the currently closest lowestOctrees to camera.
		var octreesLod0Count = octreesArray.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = octreesArray[i];
			if (this.parseOctreesLod0References(gl, lowestOctree, magoManager))
			{
				octreesParsedCount++;
			}

			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		/*
		if (octreesParsedCount === 0)
		{
			for (var key in this.octreesLod0ReferencesToParseMap)
			{
				var lowestOctree = this.octreesLod0ReferencesToParseMap[key];
				if(this.parseOctreesLod0References(gl, lowestOctree, magoManager))
				{
					octreesParsedCount++;
					if (octreesParsedCount > maxParsesCount)
					{ break; }
				}
			}
		}
		*/

		if (octreesParsedCount > 0)
		{
			if (magoManager.selectionFbo)
			{ magoManager.selectionFbo.dirty = true; }
		}
	}
};

ParseQueue.prototype.parseOctreesLod0References = function(gl, lowestOctree, magoManager)
{
	var parsed = false;
	if (this.eraseOctreeLod0ReferencesToParse(lowestOctree))
	{
		if (lowestOctree.neoReferencesMotherAndIndices === undefined)
		{ return false; }
		
		if (lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer === undefined)
		{ return false; }
	
		if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
		{ return false; }
		
		var neoBuilding = lowestOctree.neoBuildingOwner;
				
		var node = neoBuilding.nodeOwner;
		var rootNode;
		if (node)
		{ rootNode = node.getRoot(); }
		else
		{ rootNode = undefined; }
		
		if (rootNode === undefined)
		{ return false; }
		
		if (rootNode.data === undefined)
		{ return false; }
		
		var geoLocDataManager = rootNode.data.geoLocDataManager;
		
		if (geoLocDataManager === undefined)
		{ return false; }
	
		if (this.matrix4SC === undefined)
		{ this.matrix4SC = new Matrix4(); }
		
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		var headerVersion = neoBuilding.getHeaderVersion();
		this.matrix4SC.setByFloat32Array(buildingGeoLocation.rotMatrix._floatArrays);
		if (headerVersion[0] === "v")
		{
			// parse beta version.
			lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, 
				magoManager.readerWriter, neoBuilding, this.matrix4SC, magoManager);
		}
		else 
		{
			// parse vesioned.
			lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferencesVersioned(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, 
				magoManager.readerWriter, neoBuilding, this.matrix4SC, magoManager);
		}
		lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, buildingGeoLocation.rotMatrix);
		lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
		parsed = true;
	}
	
	return parsed;
};


ParseQueue.prototype.putOctreeLod0ReferencesToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod0ReferencesToParseMap[octree.octreeKey] = octree;
};

ParseQueue.prototype.eraseOctreeLod0ReferencesToParse = function(octree)
{
	var key = octree.octreeKey;
	if (this.octreesLod0ReferencesToParseMap.hasOwnProperty(key))
	{
		delete this.octreesLod0ReferencesToParseMap[key];
		return true;
	}
	return false;
};

ParseQueue.prototype.putOctreeLod0ModelsToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod0ModelsToParseMap[octree.octreeKey] = octree;
};

ParseQueue.prototype.eraseOctreeLod0ModelsToParse = function(octree)
{
	var key = octree.octreeKey;
	if (this.octreesLod0ModelsToParseMap.hasOwnProperty(key))
	{
		delete this.octreesLod0ModelsToParseMap[key];
		return true;
	}
	return false;
};

ParseQueue.prototype.putOctreeLod2LegosToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod2LegosToParseMap[octree.octreeKey] = octree;
};

ParseQueue.prototype.eraseOctreeLod2LegosToParse = function(octree)
{
	var key = octree.octreeKey;
	if (this.octreesLod2LegosToParseMap.hasOwnProperty(key))
	{
		delete this.octreesLod2LegosToParseMap[key];
		return true;
	}
	return false;
};

ParseQueue.prototype.putOctreePCloudToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesPCloudToParseMap[octree.octreeKey] = octree;
};

ParseQueue.prototype.eraseOctreePCloudToParse = function(octree)
{
	if (octree === undefined)
	{ return false; }
	
	var key = octree.octreeKey;
	if (this.octreesPCloudToParseMap.hasOwnProperty(key)) 
	{
		delete this.octreesPCloudToParseMap[key];
		return true;
	}
	return false;
};

ParseQueue.prototype.putOctreePCloudPartitionToParse = function(pCloudPartitionLego, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesPCloudPartitionToParseMap[pCloudPartitionLego.legoKey] = pCloudPartitionLego;
};

ParseQueue.prototype.eraseOctreePCloudPartitionToParse = function(pCloudPartitionLego)
{
	if (pCloudPartitionLego === undefined)
	{ return false; }
	
	var key = pCloudPartitionLego.legoKey;
	if (this.octreesPCloudPartitionToParseMap.hasOwnProperty(key)) 
	{
		delete this.octreesPCloudPartitionToParseMap[key];
		return true;
	}
	return false;
};

ParseQueue.prototype.putSkinLegosToParse = function(skinLego, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.skinLegosToParseMap[skinLego.legoKey] = skinLego;
};

ParseQueue.prototype.eraseSkinLegosToParse = function(skinLego)
{
	var key = skinLego.legoKey;
	if (this.skinLegosToParseMap.hasOwnProperty(key))
	{
		delete this.skinLegosToParseMap[key];
		return true;
	}
	return false;
};

ParseQueue.prototype.clearAll = function()
{
	this.octreesLod0ReferencesToParseMap = {};
	this.octreesLod0ModelsToParseMap = {};
	this.octreesLod2LegosToParseMap = {};
};

ParseQueue.prototype.eraseAny = function(octree)
{
	this.eraseOctreeLod0ReferencesToParse(octree);
	this.eraseOctreeLod0ModelsToParse(octree);
	this.eraseOctreeLod2LegosToParse(octree);
};

ParseQueue.prototype.initCounters = function()
{
	this.smartTileF4dParsesCount = 0;
	this.pCloudPartitionsParsed = 0;
};




















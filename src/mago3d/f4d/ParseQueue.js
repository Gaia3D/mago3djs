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

	this.octreesLod0ReferencesToParseMap = new Map();
	this.octreesLod0ModelsToParseMap = new Map();
	this.octreesLod2LegosToParseMap = new Map();
	//this.neoBuildingsHeaderToParseArray = new Map(); // no used yet.
};

ParseQueue.prototype.parseOctreesLod0References = function(gl, visibleObjControlerOctrees, magoManager, maxParsesCount)
{
	var neoBuilding;
	var lowestOctree;
	var headerVersion;
	var node;
	var rootNode;
	var geoLocDataManager;
	
	if (this.matrix4SC === undefined)
	{ this.matrix4SC = new Matrix4(); }
	
	var octreesParsedCount = 0;
	if (maxParsesCount === undefined)
	{ maxParsesCount = 20; }
	
	if (this.octreesLod0ReferencesToParseMap.size > 0)
	{
		// 1rst parse the currently closest lowestOctrees to camera.
		var octreesLod0Count = visibleObjControlerOctrees.currentVisibles0.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
			if (this.octreesLod0ReferencesToParseMap.delete(lowestOctree))
			{
				if (lowestOctree.neoReferencesMotherAndIndices === undefined)
				{ continue; }
				
				if (lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer === undefined)
				{ continue; }
			
				if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
				{ continue; }
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				if (node === undefined || node.data.nodeId !== neoBuilding.buildingId)
				{
					node = magoManager.hierarchyManager.getNodeByDataName("nodeId", neoBuilding.buildingId);
					rootNode = node.getRoot();
				}
				geoLocDataManager = rootNode.data.geoLocDataManager;
				
				//var buildingGeoLocation = neoBuilding.getGeoLocationData(); // old.***
				var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
				headerVersion = neoBuilding.getHeaderVersion();
				this.matrix4SC.setByFloat32Array(buildingGeoLocation.rotMatrix._floatArrays);
				if (headerVersion[0] === "v")
				{
					// parse beta version.
					lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherNeoReferencesArray, this.matrix4SC, magoManager);
				}
				else 
				{
					// parse vesioned.
					lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferencesVersioned(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherNeoReferencesArray, this.matrix4SC, magoManager);
				}
				lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, buildingGeoLocation.rotMatrix);
				lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
				octreesParsedCount++;
			}
			else 
			{
				// test else.
				if (lowestOctree.neoReferencesMotherAndIndices)
				{
					if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
					{ var hola = 0; }
				}
			}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		
		// if no parsed any octree, then parse some octrees of the queue.
		if (octreesParsedCount === 0)
		{
			var octreesArray = Array.from(this.octreesLod0ReferencesToParseMap.keys());
			for (var i=0; i<octreesArray.length; i++)
			{
				lowestOctree = octreesArray[i];
				this.octreesLod0ReferencesToParseMap.delete(lowestOctree);
				if (lowestOctree.neoReferencesMotherAndIndices === undefined)
				{ continue; }
				
				if (lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer === undefined)
				{ continue; }
			
				if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
				{ continue; }
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				
				if (node === undefined || node.data.nodeId !== neoBuilding.buildingId)
				{
					node = magoManager.hierarchyManager.getNodeByDataName("nodeId", neoBuilding.buildingId);
					rootNode = node.getRoot();
				}
				
				if(rootNode.data === undefined)
					continue;
				
				geoLocDataManager = rootNode.data.geoLocDataManager;
				
				if(geoLocDataManager === undefined)
					continue;
				
				var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
				headerVersion = neoBuilding.getHeaderVersion();
				//if(headerVersion == "undefinedv.0.0")
				this.matrix4SC.setByFloat32Array(buildingGeoLocation.rotMatrix._floatArrays);
				if (headerVersion[0] === "v")
				{
					// parse beta version.
					lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherNeoReferencesArray, this.matrix4SC, magoManager);
				}
				else 
				{
					// parse vesioned.
					lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferencesVersioned(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherNeoReferencesArray, this.matrix4SC, magoManager);
				}
				lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, buildingGeoLocation.rotMatrix);
				lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
				
				octreesParsedCount++;
				if (octreesParsedCount > maxParsesCount)
				{ break; }
			}
		}
	}
	
	if (octreesParsedCount > 0)
	{ return true; }
	else { return false; }
};

ParseQueue.prototype.putOctreeLod0ReferencesToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod0ReferencesToParseMap.set(octree, aValue);
};

ParseQueue.prototype.eraseOctreeLod0ReferencesToParse = function(octree)
{
	this.octreesLod0ReferencesToParseMap.delete(octree);
};

ParseQueue.prototype.putOctreeLod0ModelsToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod0ModelsToParseMap.set(octree, aValue);
};

ParseQueue.prototype.eraseOctreeLod0ModelsToParse = function(octree)
{
	this.octreesLod0ModelsToParseMap.delete(octree);
};

ParseQueue.prototype.putOctreeLod2LegosToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod2LegosToParseMap.set(octree, aValue);
};

ParseQueue.prototype.eraseOctreeLod2LegosToParse = function(octree)
{
	this.octreesLod2LegosToParseMap.delete(octree);
};

ParseQueue.prototype.clearAll = function()
{
	this.octreesLod0ReferencesToParseMap.clear();
	this.octreesLod0ModelsToParseMap.clear();
	this.octreesLod2LegosToParseMap.clear();
	
};




















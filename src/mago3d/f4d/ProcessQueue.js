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

	this.buildingsToDeleteMap = new Map();
	this.octreesToDeleteLod0Map = new Map(); // delete the lod0 data of the octrees.
};

ProcessQueue.prototype.putOctreeToDeleteLod0 = function(octree, aValue)
{
	// this puts the octree to the "octreesToDeleteLod0Map".
	// provisionally "aValue" can be anything.
	if (aValue == undefined)
	{ aValue = 0; }
	
	this.octreesToDeleteLod0Map.set(octree, aValue);
};

ProcessQueue.prototype.eraseOctreeToDeleteLod0 = function(octree)
{
	// this erases the octree from the "octreesToDeleteLod0Map".
	this.buildingsToDeleteMap.delete(octree);
};

ProcessQueue.prototype.putBuildingToDelete = function(building, aValue)
{
	// this puts the building to the "buildingsToDeleteMap".
	// provisionally "aValue" can be anything.
	if (aValue == undefined)
	{ aValue = 0; }
	
	this.buildingsToDeleteMap.set(building, aValue);
};

ProcessQueue.prototype.putBuildingsArrayToDelete = function(buildingsToDeleteArray, aValue)
{
	if (buildingsToDeleteArray == undefined)
	{ return; }
	
	// this puts the buildingsToDeleteArray to the "buildingsToDeleteMap".
	// provisionally "aValue" can be anything.
	if (aValue == undefined)
	{ aValue = 0; }
	
	var buildingsToDeleteCount = buildingsToDeleteArray.length;
	for (var i=0; i<buildingsToDeleteCount; i++)
	{
		this.putBuildingToDelete(buildingsToDeleteArray[i], aValue);
	}
};

ProcessQueue.prototype.eraseBuildingToDelete = function(building)
{
	// this erases the building from the "buildingsToDeleteMap".
	this.buildingsToDeleteMap.delete(building);
};

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

	this.nodesToDeleteMap = new Map();
	this.nodesToDeleteModelReferencesMap = new Map();
	this.nodesToDeleteLessThanLod3Map = new Map();
};

ProcessQueue.prototype.putNodeToDeleteLessThanLod3 = function(node, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.nodesToDeleteLessThanLod3Map.set(node, aValue);
};

ProcessQueue.prototype.eraseNodeToDeleteLessThanLod3 = function(node)
{
	// this erases the node from the "nodesToDeleteLessThanLod3Map".
	return this.nodesToDeleteLessThanLod3Map.delete(node);
};

ProcessQueue.prototype.putNodeToDeleteModelReferences = function(node, aValue)
{
	// this puts the node to the "nodesToDeleteModelReferencesMap".
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.nodesToDeleteModelReferencesMap.set(node, aValue);
};

ProcessQueue.prototype.eraseNodeToDeleteModelReferences = function(node)
{
	// this erases the node from the "nodesToDeleteModelReferencesMap".
	return this.nodesToDeleteModelReferencesMap.delete(node);
};

ProcessQueue.prototype.putNodeToDelete = function(node, aValue)
{
	// this puts the node to the "nodesToDeleteMap".
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.nodesToDeleteMap.set(node, aValue);
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
	return this.nodesToDeleteMap.delete(node);
};

ProcessQueue.prototype.clearAll = function()
{
	this.nodesToDeleteMap.clear();
	this.nodesToDeleteModelReferencesMap.clear();
};



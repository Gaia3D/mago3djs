'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VisibleObjectsController
 */
var VisibleObjectsController = function() 
{
	if (!(this instanceof VisibleObjectsController)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// This object works with FrustumVolumeControl.
	this.currentVisibles0 = []; 
	this.currentVisibles1 = []; 
	this.currentVisibles2 = []; 
	this.currentVisibles3 = []; 
	this.currentVisiblesAux = [];
	this.currentVisibleNativeObjects = {
		opaquesArray      : [],
		transparentsArray : []
	};
	this.currentVisiblesToPrepare = [];
};
VisibleObjectsController.prototype.initArrays = function() 
{
	this.currentVisibles0 = [];
	this.currentVisibles1 = [];
	this.currentVisibles2 = [];
	this.currentVisibles3 = [];
	this.currentVisiblesAux = [];
	this.currentVisibleNativeObjects = {
		opaquesArray      : [],
		transparentsArray : []
	};
	this.currentVisiblesToPrepare = [];
};
/**Clear all of the volumn's data */

VisibleObjectsController.prototype.clear = function() 
{
	this.currentVisibles0.length = 0;
	this.currentVisibles1.length = 0;
	this.currentVisibles2.length = 0;
	this.currentVisibles3.length = 0;
	this.currentVisiblesAux.length = 0;
	this.currentVisibleNativeObjects.opaquesArray.length = 0;
	this.currentVisibleNativeObjects.transparentsArray.length = 0;
	this.currentVisiblesToPrepare.length = 0;
};

/**
 * Make all volumns visible
 */
VisibleObjectsController.prototype.getAllVisibles = function() 
{
	var resultVisiblesArray = [].concat(this.currentVisibles0, this.currentVisibles1, this.currentVisibles2, this.currentVisibles3);
	return resultVisiblesArray;
};

/**
 * Make two volumns : 0, 1
 */
VisibleObjectsController.prototype.get01Visibles = function() 
{
	var resultVisiblesArray = [].concat(this.currentVisibles0, this.currentVisibles1);
	return resultVisiblesArray;
};

/**
 * Make two volumns : 0, 1
 */
VisibleObjectsController.prototype.hasRenderables = function() 
{
	if (this.currentVisibles0.length > 0 || 
		this.currentVisibles1.length > 0 || 
		this.currentVisibles2.length > 0 || 
		this.currentVisibles3.length > 0 || 
		this.currentVisiblesAux.length > 0 || 
		this.currentVisibleNativeObjects.opaquesArray.length > 0 ||
		this.currentVisibleNativeObjects.transparentsArray.length > 0)
	{ return true; }
	else
	{ return false; }
};

/**
 * Put the node to given node array
 * @param nodesArray
 * @param node
 */
VisibleObjectsController.prototype.putNativeObject = function(object) 
{
	// check if the object if opaque or transparent.
	var isOpaque = object.isOpaque();
	//var isOpaque = true;
	if (isOpaque)
	{
		this.currentVisibleNativeObjects.opaquesArray.push(object);
	}
	else 
	{
		this.currentVisibleNativeObjects.transparentsArray.push(object);
	}
};

/**
 * 
 */
VisibleObjectsController.prototype.getObjectIdxSortedByDist = function(objectsArray, startIdx, endIdx, object) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	var range = endIdx - startIdx;
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;

		while (!finished && i<=endIdx)
		{
			var anObject = objectsArray[i];
			if (object.distToCamera < anObject.distToCamera)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{ return idx; }
		else 
		{ return endIdx+1; }
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		var middleObject = objectsArray[middleIdx];
		if (middleObject.distToCamera > object.distToCamera)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getObjectIdxSortedByDist(objectsArray, newStartIdx, newEndIdx, object);
	}
};

/**
 * Put the object by distance from camera
 * @param {VisibleObjectsController}objectsArray
 * @param {Octree}object 
 */
VisibleObjectsController.prototype.putObjectToArraySortedByDist = function(objectsArray, object) 
{
	if (objectsArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = objectsArray.length - 1;
		var idx = this.getObjectIdxSortedByDist(objectsArray, startIdx, endIdx, object);
		               
		
		objectsArray.splice(idx, 0, object);
	}
	else 
	{
		objectsArray.push(object);
	}
};

/**
 * Get the index of the node which is in nodesArray
 * @param nodesArray
 * @param {Number} startIdx
 * @param {Number} endIdx
 * @param node
 */
VisibleObjectsController.prototype.getNodeIdxSortedByDist = function(nodesArray, startIdx, endIdx, node) 
{
	// Note: Function exclusive to use with Node class objects.
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	var neoBuilding = node.data.neoBuilding;
	var range = endIdx - startIdx;
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;

		while (!finished && i<=endIdx)
		{
			var aNode = nodesArray[i];
			if (node.data.distToCam < aNode.data.distToCam)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{ return idx; }
		else 
		{ return endIdx+1; }
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		var middleNode = nodesArray[middleIdx];
		if (middleNode.data.distToCam > node.data.distToCam)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getNodeIdxSortedByDist(nodesArray, newStartIdx, newEndIdx, node);
	}
};

/**
 * Put the node to given node array
 * @param nodesArray
 * @param node
 */
VisibleObjectsController.prototype.putNodeToArraySortedByDist = function(nodesArray, node) 
{
	// Note: Function exclusive to use with Node class objects.
	if (nodesArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = nodesArray.length - 1;
		var idx = this.getNodeIdxSortedByDist(nodesArray, startIdx, endIdx, node);
		
		nodesArray.splice(idx, 0, node);
	}
	else 
	{
		nodesArray.push(node);
	}
};

/**
 * Put the node to given node array
 * @param nodesArray
 * @param node
 */
VisibleObjectsController.prototype.putNodeByLod = function(node, lod) 
{
	if (lod === 0 || lod === 1) 
	{
		this.putNodeToArraySortedByDist(this.currentVisibles0, node);
	}
	else if (lod === 2) 
	{
		this.putNodeToArraySortedByDist(this.currentVisibles2, node);
	}
	else if (lod > 2) 
	{
		this.putNodeToArraySortedByDist(this.currentVisibles3, node);
	}
};
















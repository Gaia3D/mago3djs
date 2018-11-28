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
	
	this.currentVisibles0 = [];
	this.currentVisibles1 = [];
	this.currentVisibles2 = [];
	this.currentVisibles3 = [];
	this.currentVisiblesAux = [];
};

VisibleObjectsController.prototype.initArrays = function() 
{
	this.currentVisibles0 = [];
	this.currentVisibles1 = [];
	this.currentVisibles2 = [];
	this.currentVisibles3 = [];
	this.currentVisiblesAux = [];
};

VisibleObjectsController.prototype.clear = function() 
{
	this.currentVisibles0.length = 0;
	this.currentVisibles1.length = 0;
	this.currentVisibles2.length = 0;
	this.currentVisibles3.length = 0;
	this.currentVisiblesAux.length = 0;
};

/**
 */
VisibleObjectsController.prototype.getAllVisibles = function() 
{
	var resultVisiblesArray = [].concat(this.currentVisibles0, this.currentVisibles1, this.currentVisibles2, this.currentVisibles3);
	return resultVisiblesArray;
};

/**
 */
VisibleObjectsController.prototype.get01Visibles = function() 
{
	var resultVisiblesArray = [].concat(this.currentVisibles0, this.currentVisibles1);
	return resultVisiblesArray;
};

/**
 */
VisibleObjectsController.prototype.getNodeIdxSortedByDist = function(nodesArray, startIdx, endIdx, node) 
{
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
			var aNeoBuilding = nodesArray[i].data.neoBuilding;
			if (neoBuilding.distToCam < aNeoBuilding.distToCam)
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
		var middleNeoBuilding = nodesArray[middleIdx].data.neoBuilding;
		if (middleNeoBuilding.distToCam > neoBuilding.distToCam)
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
 */
VisibleObjectsController.prototype.putNodeToArraySortedByDist = function(nodesArray, node) 
{
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
















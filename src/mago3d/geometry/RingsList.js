'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class RingsList
*/
var RingsList = function() 
{
	if (!(this instanceof RingsList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.ringsArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
RingsList.prototype.newRing = function() 
{
	if (this.ringsArray === undefined)
	{ this.ringsArray = []; }
	
	var ring = new Ring();
	this.ringsArray.push(ring);
	
	return ring;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
RingsList.prototype.deleteObjects = function() 
{
	if (this.ringsArray)
	{
		var ringsCount = this.ringsArray.length;
		for (var i=0; i<ringsCount; i++)
		{
			this.ringsArray[i].deleteObjects();
			this.ringsArray[i] = undefined;
		}
		this.ringsArray = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
RingsList.prototype.getRingsCount = function() 
{
	if (this.ringsArray === undefined)
		return 0;

	return this.ringsArray.length;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
RingsList.prototype.getRing = function(idx) 
{
	if (this.ringsArray === undefined)
		return undefined;

	return this.ringsArray[idx];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
RingsList.prototype.getBoundingRectangle = function(resultBRect) 
{
	if (this.resultBRect === undefined)
		resultBRect = new BoundingRectangle();
	
	var ring;
	var currBRect;
	var ringsCount = this.getRingsCount();
	for(var i=0; i<ringsCount; i++)
	{
		ring = this.getRing(i);
		if(ring.polygon === undefined)
			ring.makePolygon();
		
		currBRect = ring.polygon.getBoundingRectangle(currBRect);
		if(i === 0)
			resultBRect.setInitByRectangle(currBRect);
		else{
			resultBRect.addRectangle(currBRect);
		}
	}

	return resultBRect;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
RingsList.prototype.intersectionWithSegment = function(segment) 
{
	// returns true if any ring's polygon intersects with "segment".***
	if(segment === undefined)
		return false;
	
	var intersects = false;
	var ringsCount = this.getRingsCount();
	var i=0;
	while(!intersects && i<ringsCount)
	{
		if(this.ringsArray[i].intersectionWithSegment(segment))
		{
			intersects = true;
		}
		i++;
	}
	
	return intersects;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
RingsList.getSortedRingsByDistToPoint = function(point, ringsArray, resultSortedObjectsArray) 
{
	if(point === undefined)
		return resultSortedObjectsArray;
	
	if(resultSortedObjectsArray === undefined)
		resultSortedObjectsArray = [];
	
	var objectsAuxArray = [];
	var ring;
	var ringPoint;
	var ringPointIdx;
	var squaredDist;
	var objectAux;
	var startIdx, endIdx, insertIdx;
	var ringsCount = ringsArray.length;
	for(var i=0; i<ringsCount; i++)
	{
		ring = ringsArray[i];
		if(ring.polygon === undefined)
			ring.makePolygon();
		ringPointIdx = ring.polygon.point2dList.getNearestPointIdxToPoint(point);
		ringPoint = ring.polygon.point2dList.getPoint(ringPointIdx);
		squaredDist = ringPoint.squareDistToPoint(point);
		objectAux = {};
		objectAux.ring = ring;
		objectAux.pointIdx = ringPointIdx;
		objectAux.squaredDist = squaredDist;
		
		startIdx = 0;
		endIdx = objectsAuxArray.length - 1;
		
		insertIdx = RingsList.getIndexToInsertBySquaredDist(objectsAuxArray, objectAux, startIdx, endIdx);
		objectsAuxArray.splice(insertIdx, 0, objectAux);
	}
	
	if(resultSortedObjectsArray === undefined)
		resultSortedObjectsArray = [];
	
	resultSortedObjectsArray.length = 0;
	
	var objectsCount = objectsAuxArray.length;
	for(var i=0; i<objectsCount; i++)
	{
		resultSortedObjectsArray.push(objectsAuxArray[i]);
	}
	
	return resultSortedObjectsArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns result_idx
 */
RingsList.getIndexToInsertBySquaredDist = function(objectsArray, object, startIdx, endIdx) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	
	var range = endIdx - startIdx;
	
	if(range <= 0)
		return 0;
	
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;
		//var objectsCount = objectsArray.length;
		while (!finished && i<=endIdx)
		{
			if (object.squaredDist < objectsArray[i].squaredDist)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{
			return idx;
		}
		else 
		{
			return endIdx+1;
		}
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		if (objectsArray[middleIdx].squaredDist > object.squaredDist)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getIndexToInsertBySquaredDist(objectsArray, object, newStartIdx, newEndIdx);
	}
};


















































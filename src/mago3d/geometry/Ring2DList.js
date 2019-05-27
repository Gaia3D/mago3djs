'use strict';
/**
 * Ring2D 의 리스트 {@link Ring2D}
 */
var Ring2DList = function() 
{
	if (!(this instanceof Ring2DList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * 폴리곤 배열
	 * @type {}
	 */
	this.ringsArray = [];

	/**
	 * 인덱스 리스트
	 * @type {}
	 */
	this.idxInList;
};

/**
 * Ring2D 를 생성하고 배열에 추가한다.
 * 
 * @return {Ring2D} 생성된 Ring2D 의 객체
 */
Ring2DList.prototype.newRing = function() 
{
	var ring = new Ring2D();
	this.ringsArray.push(ring);
	
	return ring;
};

/**
 * 주어진 Ring2D 를 배열에 추가한다.
 * 
 * @param {Ring2D} ring 추가할 Ring2D 객체
 */
Ring2DList.prototype.addRing = function(ring) 
{
	this.ringsArray.push(ring);
};

/**
 * 생성된 객체가 있다면 삭제하고 초기화 한다.
 */
Ring2DList.prototype.deleteObjects = function() 
{
	for (var i=0, len = this.ringsArray.length; i<len; i++)
	{
		this.ringsArray[i].deleteObjects();
		this.ringsArray[i] = undefined;
	}
	this.ringsArray = [];
};

/**
 * Ring2D 배열의 개수를 구한다.
 * 
 * @return {Number} 배열의 개수
 */
Ring2DList.prototype.getRingsCount = function() 
{
	return this.ringsArray.length;
};

/**
 * 주어진 객체의 인덱스값을 찾는다.
 * 
 * @param {Ring2D} ring Ring2D 객체
 * @return {Number} 인덱스값
 */
Ring2DList.prototype.getRingIndex = function(ring) 
{
	return this.ringsArray.indexOf(ring);
/*
	if (ring === undefined)
	{ return undefined; }

	var ringIdx;
	var ringsCount = this.getRingsCount();
	var find = false;
	var i=0; 
	while (!find && i<ringsCount)
	{
		if (this.getRing(i) === ring)
		{
			find = true;
			ringIdx = i;
		}
		i++;
	}
	
	return ringIdx;
*/
};

/**
 * 주어진 인덱스에 있는 Ring2D 객체를 가져온다.
 * 
 * @param {Number} index 가져올 Ring2D 객체의 인덱스값.
 * @return {Ring2D} <code>index</code> 위치의 Ring2D 객체
 * 
 * @see Ring2DList#getRingsCount
 */
Ring2DList.prototype.getRing = function(index) 
{
	return this.ringsArray[index];
};

/**
 * 
 */
Ring2DList.getBoundingRectangle = function(ringsArray, resultBRect) 
{
	if (this.resultBRect === undefined)
	{ resultBRect = new BoundingRectangle(); }
	
	var ring;
	var currBRect;
	var ringsCount = ringsArray.length;
	for (var i=0; i<ringsCount; i++)
	{
		ring = ringsArray[i];
		if (ring.polygon === undefined)
		{ ring.makePolygon(); }
		
		currBRect = ring.polygon.getBoundingRectangle(currBRect);
		if (i === 0)
		{ resultBRect.setInitByRectangle(currBRect); }
		else 
		{
			resultBRect.addRectangle(currBRect);
		}
	}

	return resultBRect;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Ring2DList.prototype.setIdxInList = function() 
{
	var ringsCount = this.ringsArray.length;
	for (var i=0; i<ringsCount; i++)
	{
		this.ringsArray[i].idxInList = i;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Ring2DList.prototype.intersectionWithSegment = function(segment) 
{
	// returns true if any ring's polygon intersects with "segment".***
	if (segment === undefined)
	{ return false; }
	
	var intersects = false;
	var ringsCount = this.getRingsCount();
	var i=0;
	while (!intersects && i<ringsCount)
	{
		if (this.ringsArray[i].intersectionWithSegment(segment))
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
Ring2DList.getSortedRingsByDistToPoint = function(point, ringsArray, resultSortedObjectsArray) 
{
	if (point === undefined)
	{ return resultSortedObjectsArray; }
	
	if (resultSortedObjectsArray === undefined)
	{ resultSortedObjectsArray = []; }
	
	var objectsAuxArray = [];
	var ring;
	var ringPoint;
	var ringPointIdx;
	var squaredDist;
	var objectAux;
	var startIdx, endIdx, insertIdx;
	var ringsCount = ringsArray.length;
	for (var i=0; i<ringsCount; i++)
	{
		ring = ringsArray[i];
		if (ring.polygon === undefined)
		{ ring.makePolygon(); }
		ringPointIdx = ring.polygon.point2dList.getNearestPointIdxToPoint(point);
		ringPoint = ring.polygon.point2dList.getPoint(ringPointIdx);
		squaredDist = ringPoint.squareDistToPoint(point);
		objectAux = {};
		objectAux.ring = ring;
		objectAux.ringIdx = i;
		objectAux.pointIdx = ringPointIdx;
		objectAux.squaredDist = squaredDist;
		
		startIdx = 0;
		endIdx = objectsAuxArray.length - 1;
		
		insertIdx = Ring2DList.getIndexToInsertBySquaredDist(objectsAuxArray, objectAux, startIdx, endIdx);
		objectsAuxArray.splice(insertIdx, 0, objectAux);
	}
	
	if (resultSortedObjectsArray === undefined)
	{ resultSortedObjectsArray = []; }
	
	resultSortedObjectsArray.length = 0;
	
	var objectsCount = objectsAuxArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		resultSortedObjectsArray.push(objectsAuxArray[i]);
	}
	
	return resultSortedObjectsArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns result_idx
 */
Ring2DList.getIndexToInsertBySquaredDist = function(objectsArray, object, startIdx, endIdx) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	
	var range = endIdx - startIdx;
	
	if (objectsArray.length === 0)
	{ return 0; }
	
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


















































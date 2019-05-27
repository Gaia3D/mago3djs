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
	 * @type {Ring2D[]}
	 */
	this.ringsArray = [];

	/**
	 * 인덱스 리스트
	 * @type {Number[]}
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
 * 주어진 Ring2D 배열의 각 폴리곤을 포함하는 경계 사각형을 구한다.
 * 
 * @param {Ring2D[]} ringsArray Ring2D 배열
 * @param {BoundingRectangle} resultBRect 폴리곤들을 포함하는 경계 사각형
 * @return {BoundingRectangle} 폴리곤들을 포함하는 경계 사각형 결과값
 */
Ring2DList.getBoundingRectangle = function(ringsArray, resultBRect) 
{
	if (resultBRect === undefined)
	{
		resultBRect = new BoundingRectangle();
	}
	
	var ring;
	var currBRect;
	for (var i=0, len = ringsArray.length; i<len; i++)
	{
		ring = ringsArray[i];
		if (ring.polygon !== undefined)
		{
			currBRect = ring.polygon.getBoundingRectangle(currBRect);
			resultBRect.addRectangle(currBRect);
		}
	}

	return resultBRect;
};

/**
 * Ring2D 배열에 대한 인덱스값을 idxInList 속성에 설정한다.
 */
Ring2DList.prototype.setIdxInList = function() 
{
	for (var i=0, len = this.ringsArray.length; i<len; i++)
	{
		this.ringsArray[i].idxInList = i;
	}
};

/**
 * TODO : 확인이 필요함
 */
Ring2DList.prototype.intersectionWithSegment = function(segment) 
{
	// returns true if any ring's polygon intersects with "segment".
	if (segment === undefined)
	{
		return false;
	}
	
	var i=0;
	var intersects = false;
	var ringsCount = this.getRingsCount();
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
 * 주어진 Ponint2D 와 각 Ring2D 의 거리를 기준으로 Ring2D 배열을 정렬한다.
 *
 * @param {Point2D} point 거리를 구하기 위해 주어진 포인트
 * @param {Ring2D[]} ringsArray 정렬을 하기 위한 Ring2D 배열
 * @param {Object[]} resultSortedObjectsArray 거리 기준으로 정렬된 결과값
 * @return {Object[]} 거리 기준으로 정렬된 결과값
 */
Ring2DList.getSortedRingsByDistToPoint = function(point, ringsArray, resultSortedObjectsArray) 
{
	if (point === undefined)
	{
		return resultSortedObjectsArray;
	}
	
	if (resultSortedObjectsArray === undefined)
	{
		resultSortedObjectsArray = [];
	}
	
	var objectsAuxArray = [];
	var ring;
	var ringPoint;
	var ringPointIdx;
	var squaredDist;
	var objectAux;
	var startIdx, endIdx, insertIdx;
	for (var i=0, len = ringsArray.length; i<len; i++)
	{
		ring = ringsArray[i];
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
		
		// TODO : getIndexToInsertBySquaredDist 함수를 getBinarySearchIndex 를 이용하여 구현하기
		insertIdx = Ring2DList.getIndexToInsertBySquaredDist(objectsAuxArray, objectAux, startIdx, endIdx);
		objectsAuxArray.splice(insertIdx, 0, objectAux);
	}
	
	for (var i=0, len = objectsAuxArray.length; i<len; i++)
	{
		resultSortedObjectsArray.push(objectsAuxArray[i]);
	}
	
	return resultSortedObjectsArray;
};

/**
 * 이진 탐색 방법을 통해 해당 객체가 추가될 인덱스 값을 찾는다.
 * - 탐색의 대상인 배열은 이미 정렬되어있어야 한다.
 * @param {Object[]} objectsArray 탐색하기 위한 배열
 * @param {Object} object 탐색 대상
 * @param {Number} startIdx 시작 인덱스값
 * @param {Number} endIdx 종료 인덱스값
 * @return {Number} 탐색 결과 인덱스
 */
Ring2DList.getIndexToInsertBySquaredDist = function(objectsArray, object, startIdx, endIdx) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	
	var range = endIdx - startIdx;
	
	if (objectsArray.length === 0)
	{
		return 0;
	}
	
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

/**
 * 이진 탐색 방법을 통해 해당 객체가 추가될 인덱스 값을 찾는다.
 * - 탐색의 대상인 배열은 이미 정렬되어있어야 한다.
 *
 * @param {Object[]} arr 탐색하기 위한 배열
 * @param {Object} x 탐색 대상
 * @param {Function} func 탐색 비교값
 * @return {Number} 탐색 결과 인덱스
 */
Ring2DList.getBinarySearchIndex = function (arr, x, func)
{
	var start = 0;
	var end = arr.length - 1;

	func = func || function (value) { return value; };

	// Iterate while start not meets end 
	while (start <= end)
	{
		// Find the mid index 
		var mid = Math.floor((start + end) / 2);

		if (func(arr[mid]) < func(x))
		{
			start = mid + 1;
		}
		else
		{
			end = mid - 1;
		}
	}

	return start;
};

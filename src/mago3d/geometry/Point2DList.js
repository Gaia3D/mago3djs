'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class Point2DList
*/
var Point2DList = function(x, y) 
{
	if (!(this instanceof Point2DList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.pointsArray;
};

Point2DList.prototype.deleteObjects = function()
{
	if(this.pointsArray === undefined)
		return;
	
	var pointsCount = this.pointsArray.length;
	for(var i=0; i<pointsCount; i++)
	{
		this.pointsArray[i].deleteObjects();
		this.pointsArray[i] = undefined;
	}
	this.pointsArray = undefined;
};

Point2DList.prototype.getPoint = function(idx)
{
	return this.pointsArray[idx];
};

Point2DList.prototype.getPointsCount = function()
{
	if(this.pointsArray === undefined)
		return 0;
	
	return this.pointsArray.length;
};

Point2DList.prototype.getPrevIdx = function(idx)
{
	var pointsCount = this.pointsArray.length;
	var prevIdx;
	
	if(idx === 0)
		prevIdx = pointsCount - 1;
	else
		prevIdx = idx - 1;

	return prevIdx;
};

Point2DList.prototype.getNextIdx = function(idx)
{
	var pointsCount = this.pointsArray.length;
	var nextIdx;
	
	if(idx === pointsCount - 1)
		nextIdx = 0;
	else
		nextIdx = idx + 1;

	return nextIdx;
};

Point2DList.prototype.getIdxOfPoint = function(point)
{
	var pointsCount = this.pointsArray.length;
	var i=0;
	var idx = -1;
	var found = false;
	while(!found && i<pointsCount)
	{
		if(this.pointsArray[i] === point)
		{
			found = true;
			idx = i;
		}
		i++;
	}
	
	return idx;
};

Point2DList.prototype.getSegment = function(idx, resultSegment)
{
	var currPoint = this.getPoint(idx);
	var nextIdx = this.getNextIdx(idx);
	var nextPoint = this.getPoint(nextIdx);
	
	if(resultSegment === undefined)
		resultSegment = new Segment2D(currPoint, nextPoint);
	else{
		resultSegment.setPoints(currPoint, nextPoint);
	}

	return resultSegment;
};



















































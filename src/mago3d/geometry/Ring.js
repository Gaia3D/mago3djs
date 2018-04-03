'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Ring
 */
var Ring = function() 
{
	if (!(this instanceof Ring)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.elemsArray;
	this.polygon; // auxiliar.***
};

/**
 * @class Ring
 */
Ring.prototype.deleteObjects = function()
{
	if(this.elemsArray !== undefined)
	{
		var elemsCount = this.elemsArray.length;
		for(var i=0; i<elemsCount; i++)
		{
			this.elemsArray[i].deleteObjects();
			this.elemsArray[i] = undefined;
		}
		this.elemsArray = undefined;
	}
	
	if(this.polygon !== undefined)
		this.polygon.deleteObjects();
	
	this.polygon = undefined;
};

/**
 * @class Ring
 */
Ring.prototype.newElement = function(elementTypeString)
{
	var elem;
	
	if (elementTypeString === "POLYLINE")
	{
		if (this.elemsArray === undefined)
		{ this.elemsArray = []; }
		
		elem = new PolyLine();
		this.elemsArray.push(elem);
	}
	else if (elementTypeString === "ARC")
	{
		if (this.elemsArray === undefined)
		{ this.elemsArray = []; }
		
		elem = new Arc();
		this.elemsArray.push(elem);
	}
	else if (elementTypeString === "RECTANGLE")
	{
		if (this.elemsArray === undefined)
		{ this.elemsArray = []; }
		
		elem = new Rectangle();
		this.elemsArray.push(elem);
	}
	
	return elem;
};

/**
 * returns the points array of the ring.
 * @class Ring
 */
Ring.prototype.makePolygon = function()
{
	this.polygon = this.getPolygon(this.polygon);
	return this.polygon;
};

/**
 * returns the points array of the ring.
 * @class Ring
 */
Ring.prototype.getPolygon = function(resultPolygon)
{
	if(resultPolygon === undefined)
		resultPolygon = new Polygon();
	
	if(resultPolygon.point2dList === undefined)
		resultPolygon.point2dList = new Point2DList();
	
	// reset polygon.***
	resultPolygon.point2dList.deleteObjects();
	resultPolygon.point2dList.pointsArray = this.getPoints(resultPolygon.point2dList.pointsArray);
	return resultPolygon;
};

/**
 * returns the points array of the ring.
 * @class Ring
 */
Ring.prototype.getPoints = function(resultPointsArray)
{
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	if (this.elemsArray === undefined)
	{ return resultPointsArray; }
	
	var elem;
	var elemsCount = this.elemsArray.length;
	for (var i=0; i<elemsCount; i++)
	{
		elem = this.elemsArray[i];
		elem.getPoints(resultPointsArray);
	}
	
	// finally check if the 1rst point and the last point are coincidents.***
	var totalPointsCount = resultPointsArray.length;
	if(totalPointsCount > 1)
	{
		var errorDist = 10E-8;
		var firstPoint = resultPointsArray[0];
		var lastPoint = resultPointsArray[totalPointsCount-1];
		if(firstPoint.isCoincidentToPoint(lastPoint, errorDist))
		{
			// delete the last point.***
			lastPoint = resultPointsArray.pop();
			lastPoint.deleteObjects();
			lastPoint = undefined;
		}
	}
	
	return resultPointsArray;
};








































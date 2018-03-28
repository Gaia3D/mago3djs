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
	this.polygon;
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
	
	return elem;
};

/**
 * returns the points array of the ring.
 * @class Ring
 */
Ring.prototype.makePolygon = function()
{
	this.polygon = this.getPolygon(this.polygon);
};

/**
 * returns the points array of the ring.
 * @class Ring
 */
Ring.prototype.getPolygon = function(resultPolygon)
{
	if(resultPolygon === undefined)
		resultPolygon = new Polygon();
	
	// reset polygon.***
	resultPolygon.deleteObjects();
	resultPolygon.verticesArray = this.getVertices(resultPolygon.verticesArray);
	return resultPolygon;
};

/**
 * returns the vertices array of the ring.
 * @class Ring
 */
Ring.prototype.getVertices = function(resultVerticesArray)
{
	if(resultVerticesArray === undefined)
		resultVerticesArray = [];
	
	var pointsArray;
	pointsArray = this.getPoints(pointsArray);
	
	var point;
	var vertex;
	var pointsCount = pointsArray.length;
	for(var i=0; i<pointsCount; i++)
	{
		point = pointsArray[i];
		vertex = new Vertex(point);
		resultVerticesArray.push(vertex);
	}
	
	return resultVerticesArray;
}

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
		var errorDist = 0.0001;
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








































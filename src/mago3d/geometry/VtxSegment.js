'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VtxSegment
 */
var VtxSegment = function(startVertex, endVertex) 
{
	if (!(this instanceof VtxSegment)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.startVertex;
	this.endVertex;
	
	if (startVertex)
	{ this.startVertex = startVertex; }
	
	if (endVertex)
	{ this.endVertex = endVertex; }
};

VtxSegment.prototype.setVertices = function(startVertex, endVertex)
{
	this.startVertex = startVertex;
	this.endVertex = endVertex;
};

VtxSegment.prototype.getDirection = function(resultDirection)
{
	// the direction is an unitary vector.***
	var resultDirection = this.getVector();
	
	if (resultDirection === undefined)
	{ return undefined; }
	
	resultDirection.unitary();
	return resultDirection;
};

VtxSegment.prototype.getVector = function(resultVector)
{
	if (this.startVertex === undefined || this.endVertex === undefined)
	{ return undefined; }
	
	var startPoint = this.startVertex.point3d;
	var endPoint = this.endVertex.point3d;
	
	if (startPoint === undefined || endPoint === undefined)
	{ return undefined; }
	
	resultVector = startPoint.getVectorToPoint(endPoint, resultVector);
	return resultVector;
};

VtxSegment.prototype.getLine = function(resultLine)
{
	if (resultLine === undefined)
	{ resultLine = new Line(); }
	
	var dir = this.getDirection(); // unitary direction.***
	var strPoint = this.startVertex.point3d;
	resultLine.setPointAndDir(strPoint.x, strPoint.y, strPoint.z, dir.x, dir.y, dir.z);
	return resultLine;
};

VtxSegment.prototype.getSquaredLength = function()
{
	return this.startVertex.point3d.squareDistToPoint(this.endVertex.point3d);
};

VtxSegment.prototype.getLength = function()
{
	return Math.sqrt(this.getSquaredLength());
};

VtxSegment.prototype.intersectionWithPoint = function(point, error)
{
	// check if the point intersects the vtxSegment's line.***
	var line = this.getLine();
	
	if (error === undefined)
	{ error = 10E-8; }
	
	if (!line.isCoincidentPoint(point, error))
	{ return Constant.INTERSECTION_OUTSIDE; } // no intersection.***
	
	//Constant.INTERSECTION_OUTSIDE = 0;
	//Constant.INTERSECTION_INTERSECT= 1;
	//Constant.INTERSECTION_INSIDE = 2;
	//Constant.INTERSECTION_POINT_A = 3;
	//Constant.INTERSECTION_POINT_B = 4;
	
	// now, check if is inside of the segment or if is coincident with any vertex of segment.***
	var distA = this.startVertex.point3d.distToPoint(point);
	var distB = this.endVertex.point3d.distToPoint(point);
	var distTotal = this.getLength();
	
	if (distA < error)
	{ return Constant.INTERSECTION_POINT_A; }
	
	if (distB < error)
	{ return Constant.INTERSECTION_POINT_B; }
	
	if (distA> distTotal || distB> distTotal)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	
	if (Math.abs(distA + distB - distTotal) < error)
	{ return Constant.INTERSECTION_INSIDE; }
	
};

















































'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class HalfEdge
 */
var HalfEdge = function() 
{
	if (!(this instanceof HalfEdge)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.startVertex;
	this.next;
	this.twin;
	this.face;
};

HalfEdge.prototype.deleteObjects = function()
{
	// Note: "HalfEdge" is NO-Owner of the contents, so, don't delete contents. Only set as "undefined".***
	this.startVertex = undefined;
	this.next = undefined;
	this.twin = undefined;
	this.face = undefined;
};

HalfEdge.prototype.setStartVertex = function(vertex)
{
	this.startVertex = vertex;
	vertex.outingHedge = this;
};

HalfEdge.prototype.setNext = function(hedge)
{
	this.next = hedge;
};

HalfEdge.prototype.setTwin = function(hedge)
{
	var isTwinable = HalfEdge.areTwinables(hedge, this);
	if (isTwinable)
	{
		this.twin = hedge;
		hedge.twin = this;
	}
	return isTwinable;
};

HalfEdge.prototype.setFace = function(face)
{
	this.face = face;
};

HalfEdge.prototype.getEndVertex = function()
{
	if (this.next === undefined)
	{ return undefined; }
	
	return this.next.startVertex;
};

HalfEdge.prototype.isFrontier = function()
{
	if (this.twin === undefined || this.twin === null)
	{ return true; }
	
	return false;
};

HalfEdge.prototype.getPrev = function()
{
	var currHedge = this;
	var prevHedge;
	var finished = false;
	while (!finished)
	{
		if (currHedge.next === this)
		{ return currHedge; }
		
		if (currHedge.next === undefined)
		{ return undefined; }
		
		currHedge = currHedge.next;
	}
	
	return undefined;
};

HalfEdge.areTwinables = function(hedgeA, hedgeB)
{
	// check if "hedgeA" is twinable with "hedgeB".***
	if (hedgeA.startVertex === hedgeB.getEndVertex())
	{
		if (hedgeA.getEndVertex() === hedgeB.startVertex)
		{ return true; }
	}
	
	return false;
};

HalfEdge.getHalfEdgesLoop = function(hedge, resultHedgesArray)
{
	if (hedge === undefined)
	{ return resultHedgesArray; }
	
	if (resultHedgesArray === undefined)
	{ resultHedgesArray = []; }
	
	resultHedgesArray.length = 0; // init the array.***
	
	var startHedge = hedge;
	var currHedge = hedge;
	var finished = false;
	while (!finished)
	{
		resultHedgesArray.push(currHedge);
		currHedge = currHedge.next;
		if (currHedge === startHedge || currHedge === undefined)
		{ finished = true; }
	}
	
	return resultHedgesArray;
};














































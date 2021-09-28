
'use strict';

/**
 * 특정 버텍스로 부터의 방향을 가진 테두리. 
 * 트윈과 넥스트를 함께 가지는 구조로 이뤄져있음.
 * 트윈은 해당 테두리의 반대 방향 테두리.
 * 넥스트는 현재 테두리의 다음 테두리. 방향은 같음.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class HalfEdge
 * @constructor
 */
var HalfEdge_ = function () 
{

	/**
	 * start vertex of this edge.
	 * @type {Vertex}
	 */
	this.startVertex;

	/**
	 * next edge of this edge.
	 * @type {HalfEdge}
	 */
	this.next;

	/**
	 * opposite direction edge of this edge.
	 * @type {HalfEdge}
	 */
	this.twin;

	/**
	 * the face of include this edge.
	 * @type {Face}
	 */
	this.face;
};

HalfEdge_.prototype.deleteObjects = function()
{
	this.startVertex = undefined;
	this.next = undefined;
	this.twin = undefined;
	this.face = undefined;
};

/**
 * set start vertex. this vertex's outingHedge set this edge.
 * @param {Vetex}
 */
HalfEdge_.prototype.setStartVertex = function(vertex)
{
	this.startVertex = vertex;
	vertex.outingHedge = this;
};

/**
 * set next hedge
 * @param {HalfEdge}
 */
HalfEdge_.prototype.setNext = function(hedge)
{
	this.next = hedge;
};

/**
 * if this param hedge is twinable this hedge, set twin hedge.
 * if twinable, param hedge.twin set this hedge.
 * @param {HalfEdge}
 * 
 * @see HalfEdge#areTwinables
 */
HalfEdge_.prototype.setTwin = function(hedge)
{
	var isTwinable = HalfEdge_.areTwinables(hedge, this);
	if (isTwinable)
	{
		this.twin = hedge;
		hedge.twin = this;
	}
	return isTwinable;
};

HalfEdge_.areTwinables = function(hedgeA, hedgeB)
{
	// check if "hedgeA" is twinable with "hedgeB".
	if (hedgeA.startVertex === hedgeB.getEndVertex())
	{
		if (hedgeA.getEndVertex() === hedgeB.startVertex)
		{ return true; }
	}
	
	return false;
};

HalfEdge_.prototype.getEndVertex = function()
{
	if (this.next === undefined)
	{ return undefined; }
	
	return this.next.startVertex;
};

/**
 * set Face.
 * @param {Face}
 */
HalfEdge_.prototype.setFace = function(face)
{
	this.face = face;
	this.face.hEdge = this;
};

HalfEdge_.getHalfEdgesLoop = function(hedge, resultHedgesArray)
{
	if (hedge === undefined)
	{ return resultHedgesArray; }
	
	if (resultHedgesArray === undefined)
	{ resultHedgesArray = []; }
	
	resultHedgesArray.length = 0; // init the array.
	
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
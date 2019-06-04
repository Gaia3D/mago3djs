
'use strict';

/**
 * 특정 버텍스로 부터의 방향을 가진 테두리. 
 * 트윈과 넥스트를 함께 가지는 구조로 이뤄져있음.
 * 트윈은 해당 테두리의 반대 방향 테두리.
 * 넥스트는 현재 테두리의 다음 테두리. 방향은 같음.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class HalfEdge
 */
var HalfEdge = function() 
{
	if (!(this instanceof HalfEdge)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

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

/**
 * delete all member.
 * Note: "HalfEdge" is NO-Owner of the contents, so, don't delete contents. Only set as "undefined".|
 */
HalfEdge.prototype.deleteObjects = function()
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
HalfEdge.prototype.setStartVertex = function(vertex)
{
	this.startVertex = vertex;
	vertex.outingHedge = this;
};

/**
 * set next hedge
 * @param {HalfEdge}
 */
HalfEdge.prototype.setNext = function(hedge)
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

/**
 * set Face.
 * @param {Face}
 */
HalfEdge.prototype.setFace = function(face)
{
	this.face = face;
};

/**
 * get end vertex.
 * @return {Vertex|undefined} if this next is undefined, can't get end vertex. so return undefined.
 */
HalfEdge.prototype.getEndVertex = function()
{
	if (this.next === undefined)
	{ return undefined; }
	
	return this.next.startVertex;
};

/**
 * is this hedge frontier?
 * @return {boolean} if this twin is undefined or null, return true;
 */
HalfEdge.prototype.isFrontier = function()
{
	if (this.twin === undefined || this.twin === null)
	{ return true; }
	
	return false;
};

/**
 * get prev hedge.
 * half edge의 next를 계속 찾아서 현재 edge와 특정 테두리의 next가 일치할때 특정테두리를 반환.
 * @deprecated not use
 * @return {HalfEdge|undefined}  if next is not define, return undefined.
 */
HalfEdge.prototype.getPrev = function()
{
	var currHedge = this;
	var prevHedge;
	var finished = false;
	while (!finished)
	{
		/**
		 * @todo check this compare is possible.
		 */
		if (currHedge.next === this)
		{ return currHedge; }
		
		if (currHedge.next === undefined)
		{ return undefined; }
		
		currHedge = currHedge.next;
	}
	
	return undefined;
};

/**
 * 매개변수로 받은 두 edge가 서로 twinable한 상황인지 체크.
 * @static
 * @param {HalfEdge} hedgeA
 * @param {HalfEdge} hedgeB
 * @return {boolean}  각각의 시작 vertex와 마지막 vertex가 동일한지 비교하여 둘다 동일 할 경우 true 반환.
 */
HalfEdge.areTwinables = function(hedgeA, hedgeB)
{
	// check if "hedgeA" is twinable with "hedgeB".
	if (hedgeA.startVertex === hedgeB.getEndVertex())
	{
		if (hedgeA.getEndVertex() === hedgeB.startVertex)
		{ return true; }
	}
	
	return false;
};

/**
 * 연결된 테두리들을 찾아 배열로 반환.
 * @static
 * @param {HalfEdge} hedge Required. if undefined, return original resultHedgesArray.
 * @param {Array|undefined} resultHedgesArray
 * @return {Array.<HalfEdge>}
 */
HalfEdge.getHalfEdgesLoop = function(hedge, resultHedgesArray)
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
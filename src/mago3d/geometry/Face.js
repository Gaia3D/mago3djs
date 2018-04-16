'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Face
 */
var Face = function() 
{
	if (!(this instanceof Face)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexArray;
	this.hEdge;
	this.planeNormal;
	this.surfaceOwner;
};

Face.prototype.getVerticesCount = function()
{
	if(this.vertexArray === undefined)
		return 0;

	return this.vertexArray.length;
};

Face.prototype.addVertex = function(vertex)
{
	if(this.vertexArray === undefined)
		this.vertexArray = [];
	
	this.vertexArray.push(vertex);
};

Face.prototype.getVertex = function(idx)
{
	if(this.vertexArray === undefined)
		return undefined;

	return this.vertexArray[idx];
};

Face.prototype.reverseSense = function()
{
	this.vertexArray.reverse();
};

Face.prototype.setColor = function(r, g, b, a)
{
	var vertex;
	var verticesCount = this.getVerticesCount();
	for(var i=0; i<verticesCount; i++)
	{
		vertex = this.getVertex(i);
		vertex.setColorRGBA(r, g, b, a);
	}
};

Face.prototype.calculateVerticesNormals = function()
{
	// provisionally calculate the plane normal and assign to the vertices.***
	var finished = false;
	var verticesCount = this.vertexArray.length;
	var i=0;
	while(!finished && i<verticesCount)
	{
		this.planeNormal = VertexList.getCrossProduct(i, this.vertexArray, this.planeNormal);
		if(this.planeNormal.x !== 0 || this.planeNormal.y !== 0 || this.planeNormal.z !== 0 )
		{
			finished = true;
		}
		i++;
	}
	this.planeNormal.unitary();
	var verticesCount = this.getVerticesCount();
	for(var i=0; i<verticesCount; i++)
	{
		this.vertexArray[i].setNormal(this.planeNormal.x, this.planeNormal.y, this.planeNormal.z);
	}
};

Face.prototype.getTrianglesConvex = function(resultTrianglesArray)
{
	// To call this method, the face must be convex.***
	if(this.vertexArray === undefined || this.vertexArray.length === 0)
		return resultTrianglesArray;
	
	if(resultTrianglesArray === undefined)
		resultTrianglesArray = [];
	
	var vertex0, vertex1, vertex2;
	var triangle;
	vertex0 = this.getVertex(0);
	var verticesCount = this.getVerticesCount();
	for(var i=1; i<verticesCount-1; i++)
	{
		vertex1 = this.getVertex(i);
		vertex2 = this.getVertex(i+1);
		triangle = new Triangle(vertex0, vertex1, vertex2);
		resultTrianglesArray.push(triangle);
	}
	
	return resultTrianglesArray;
};

Face.prototype.setTwinHalfEdge = function(hedge)
{
	var twined = false;
	var finished = false;
	var startHEdge = this.hEdge;
	var currHEdge = this.hEdge;
	while(!finished)
	{
		if(currHEdge.setTwin(hedge))
			return true;

		currHEdge = currHEdge.next;
		if(currHEdge === startHEdge)
			finished = true;
	}
	return twined;
};

Face.prototype.getFrontierHalfEdges = function(resultHedgesArray)
{
	var hedgesArray = this.getHalfEdgesLoop(undefined);
	if(hedgesArray === undefined)
		return resultHedgesArray;
	
	if(resultHedgesArray === undefined)
		resultHedgesArray = [];

	var hedgesCount = hedgesArray.length;
	var hedge;
	for(var i=0; i<hedgesCount; i++)
	{
		hedge = hedgesArray[i];
		if(hedge.isFrontier())
		{
			resultHedgesArray.push(hedge);
		}
	}
	return resultHedgesArray;
};

Face.prototype.getHalfEdgesLoop = function(resultHedgesArray)
{
	if(this.hEdge === undefined)
		return resultHedgesArray;
	
	resultHedgesArray = HalfEdge.getHalfEdgesLoop(this.hEdge, resultHedgesArray);
	return resultHedgesArray;
};

Face.prototype.setTwinFace = function(face)
{
	if(face === undefined)
		return false;
	
	if(this.hEdge === undefined || face.hEdge === undefined)
		return false;
	
	var hedgesArray = face.getHalfEdgesLoop(undefined);
	var hedgesCount = hedgesArray.length;
	var hedge;
	var twined = false;
	for(var i=0; i<hedgesCount; i++)
	{
		hedge = hedgesArray[i];
		if(this.setTwinHalfEdge(hedge))
			twined = true;
	}
	
	return twined;
};

Face.prototype.createHalfEdges = function(resultHalfEdgesArray)
{
	if(this.vertexArray === undefined || this.vertexArray.length === 0)
		return resultHalfEdgesArray;
	
	if(resultHalfEdgesArray === undefined)
		resultHalfEdgesArray = [];
	
	var vertex;
	var hedge;
	var verticesCount = this.getVerticesCount();
	
	// 1rst, create the half edges.***
	for(var i=0; i<verticesCount; i++)
	{
		vertex = this.getVertex(i);
		hedge = new HalfEdge();
		hedge.setStartVertex(vertex);
		hedge.setFace(this);
		resultHalfEdgesArray.push(hedge);
	}
	
	// now, for all half edges, set the nextHalfEdge.***
	var nextHedge;
	var nextIdx;
	for(var i=0; i<verticesCount; i++)
	{
		hedge = resultHalfEdgesArray[i];
		nextIdx = VertexList.getNextIdx(i, this.vertexArray);
		nextHedge = resultHalfEdgesArray[nextIdx];
		hedge.setNext(nextHedge);
	}
	
	// set a hedge for this face.***
	this.hEdge = resultHalfEdgesArray[0];
	
	return resultHalfEdgesArray;
};





















































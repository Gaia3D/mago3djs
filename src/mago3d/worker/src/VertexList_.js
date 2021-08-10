'use strict';

var VertexList_ = function() 
{
	this.vertexArray = [];
};

VertexList_.prototype.newVertex = function(point3d) 
{
	var vertex = new Vertex_(point3d);
	this.vertexArray.push(vertex);
	return vertex;
};

VertexList_.prototype.getVertex = function(idx) 
{
	return this.vertexArray[idx];
};

VertexList_.prototype.getVertexCount = function() 
{
	return this.vertexArray.length;
};

VertexList_.prototype.setIdxInList = function()
{
	VertexList_.setIdxInList(this.vertexArray);
};

VertexList_.setIdxInList = function(vertexArray)
{
	if (vertexArray === undefined)
	{ return; }
	
	for (var i = 0, vertexCount = vertexArray.length; i < vertexCount; i++) 
	{
		vertexArray[i].idxInList = i;
	}
};
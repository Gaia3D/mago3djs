'use strict';

var TrianglesList_ = function() 
{
	this.trianglesArray = [];
};

TrianglesList_.prototype.newTriangle = function(vertex0, vertex1, vertex2) 
{
	var triangle = new Triangle_(vertex0, vertex1, vertex2);
	this.trianglesArray.push(triangle);

	return triangle;
};

TrianglesList_.prototype.getTrianglesCount = function() 
{
	return this.trianglesArray.length;
};

TrianglesList_.prototype.getTriangle = function(index) 
{
	return this.trianglesArray[index];
};
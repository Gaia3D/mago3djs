'use strict';

/**
 * This feature consists of TriPolyhedron
 * Using this feature, we can save the lid, bottom, and side surface.
 * @class TriSurface
 */
var TriSurface = function() 
{
	if (!(this instanceof TriSurface)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexList;
	this.trianglesArray; //The array of triangles which consist of the surface
	this.trianglesList; 
};

TriSurface.prototype.newTriangle = function() 
{
	if (this.trianglesArray === undefined)
	{ this.trianglesArray = []; }
	
	var triangle = new Triangle();
	this.trianglesArray.push(triangle);
	return triangle;
};

TriSurface.prototype.invertTrianglesSenses = function() 
{
	var trianglesCount = this.trianglesArray.length;
	for (var i=0; i<trianglesCount; i++)
	{
		this.trianglesArray[i].invertSense();
	}
};



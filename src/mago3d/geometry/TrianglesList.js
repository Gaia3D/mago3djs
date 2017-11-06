'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class TrianglesList
 */
var TrianglesList= function() 
{
	if (!(this instanceof TrianglesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.trianglesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
TrianglesList.prototype.newTriangle = function() 
{
	if (this.trianglesArray === undefined)
	{ this.trianglesArray = []; }
	
	var triangle = new Triangle();
	this.trianglesArray.push(triangle);
	return triangle;
};
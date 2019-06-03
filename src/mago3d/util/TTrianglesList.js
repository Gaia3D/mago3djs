'use strict';
/**
 * 어떤 일을 하고 있습니까?
 * @class TTrianglesList
 */
var TTrianglesList = function() 
{
	if (!(this instanceof TTrianglesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.tTrianglesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns tTri
 */
TTrianglesList.prototype.newTTriangle = function() 
{
	var tTri = new TTriangle();
	this.tTrianglesArray.push(tTri);
	return tTri;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TTrianglesList.prototype.invertTrianglesSense= function() 
{
	for (var i = 0, triCount = this.tTrianglesArray.length; i < triCount; i++) 
	{
		this.tTrianglesArray[i].invert();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns tTrianglesArray[idx]
 */
TTrianglesList.prototype.getTTriangle = function(idx) 
{
	if (idx >= 0 && idx < this.tTrianglesArray.length) 
	{
		return this.tTrianglesArray[idx];
	}
	else
	{
		return undefined;
	}
};

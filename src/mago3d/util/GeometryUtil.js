'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ByteColor
 */
var ByteColor = function() 
{
	if (!(this instanceof ByteColor)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.ByteR = 0;
	this.ByteG = 0;
	this.ByteB = 0;
	this.ByteAlfa = 255;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ByteColor.prototype.destroy = function() 
{
	this.ByteR = null;
	this.ByteG = null;
	this.ByteB = null;
	this.ByteAlfa = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param byteRed 변수
 * @param byteGreen 변수
 * @param byteBlue 변수
 */
ByteColor.prototype.set = function(byteRed, byteGreen, byteBlue) 
{
	this.ByteR = byteRed;
	this.ByteG = byteGreen;
	this.ByteB = byteBlue;
};

/**
* 어떤 일을 하고 있습니까?
* @class Point2D
*/
var Point2D = function() 
{
	if (!(this instanceof Point2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.x = 0.0;
	this.y = 0.0;
	this.IdxInIist; // delete this.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Point3DAux
 */
var Point3DAux = function() 
{
	if (!(this instanceof Point3DAux)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	//this.IdxInIist;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class TTriangle
 */
var TTriangle = function() 
{
	if (!(this instanceof TTriangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mVertex1;
	this.mVertex2;
	this.mVertex3;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param vtx1 변수
 * @param vtx2 변수
 * @param vtx3 변수
 */
TTriangle.prototype.setVertices = function(vtx1, vtx2, vtx3) 
{
	this.mVertex1 = vtx1;
	this.mVertex2 = vtx2;
	this.mVertex3 = vtx3;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TTriangle.prototype.invert = function() 
{
	var vertexAux = this.mVertex2;
	this.mVertex2 = this.mVertex3;
	this.mVertex3 = vertexAux;
};

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

/**
 * 어떤 일을 하고 있습니까?
 * @class TTrianglesMatrix
 */
var TTrianglesMatrix = function() 
{
	if (!(this instanceof TTrianglesMatrix)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.tTrianglesListsArray = [];
	// SCRATX.*********************
	this.totalTTrianglesArraySC = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns tTrianglesList
 */
TTrianglesMatrix.prototype.newTTrianglesList = function() 
{
	var tTrianglesList = new TTrianglesList();
	this.tTrianglesListsArray.push(tTrianglesList);
	return tTrianglesList;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TTrianglesMatrix.prototype.invertTrianglesSense = function() 
{
	for (var i = 0, tTriListsCount = this.tTrianglesListsArray.length; i < tTriListsCount; i++) 
	{
		this.tTrianglesListsArray[i].invertTrianglesSense();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultTotalTTrianglesArray 변수
 * @returns resultTotalTTrianglesArray
 */
TTrianglesMatrix.prototype.getTotalTTrianglesArray = function(resultTotalTTrianglesArray) 
{
	for (var i = 0, tTriListsCount = this.tTrianglesListsArray.length; i < tTriListsCount; i++) 
	{
		for (var j = 0, tTrianglesCount = this.tTrianglesListsArray[i].tTrianglesArray.length; j < tTrianglesCount; j++) 
		{
			var tTriangle = this.tTrianglesListsArray[i].getTTriangle(j);
			resultTotalTTrianglesArray.push(tTriangle);
		}
	}

	return resultTotalTTrianglesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns shortArray
 */
TTrianglesMatrix.prototype.getVBOIndicesShortArray = function() 
{
	this.totalTTrianglesArraySC.length = 0;
	this.totalTTrianglesArraySC = this.getTotalTTrianglesArray(this.totalTTrianglesArraySC);

	var tTriangle;
	var tTrianglesCount = this.totalTTrianglesArraySC.length;
	var shortArray = new Uint16Array(tTrianglesCount * 3);
	for (var i = 0; i < tTrianglesCount; i++) 
	{
		tTriangle = this.totalTTrianglesArraySC[i];
		shortArray[i*3] = tTriangle.mVertex1.mIdxInList;
		shortArray[i*3+1] = tTriangle.mVertex2.mIdxInList;
		shortArray[i*3+2] = tTriangle.mVertex3.mIdxInList;
	}

	return shortArray;
};



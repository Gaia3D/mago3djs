
'use strict';
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
	// SCRATX.
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



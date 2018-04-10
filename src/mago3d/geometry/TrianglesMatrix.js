'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class TrianglesMatrix
 */
var TrianglesMatrix= function() 
{
	if (!(this instanceof TrianglesMatrix)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.trianglesListsArray;
};

TrianglesMatrix.prototype.deleteObjects = function()
{
	if(this.trianglesListsArray === undefined)
		return;
	
	var trianglesListsCount = this.trianglesListsArray.length;
	for(var i=0; i<trianglesListsCount; i++)
	{
		this.trianglesListsArray[i].deleteObjects();
		this.trianglesListsArray[i] = undefined;
	}
	this.trianglesListsArray = undefined;
};

TrianglesMatrix.prototype.getTrianglesList = function(idx)
{
	if(this.trianglesListsArray === undefined)
		return undefined;
	
	return this.trianglesListsArray[idx];
};

TrianglesMatrix.prototype.getTrianglesListsCount = function()
{
	if(this.trianglesListsArray === undefined)
		return 0;
	
	return this.trianglesListsArray.length;
};

TrianglesMatrix.prototype.newTrianglesList = function()
{
	if(this.trianglesListsArray === undefined)
		this.trianglesListsArray = [];
	
	var trianglesList = new TrianglesList();
	this.trianglesListsArray.push(trianglesList);
	return trianglesList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
TrianglesMatrix.prototype.assignVerticesIdx = function() 
{
	var trianglesListsCount = this.trianglesListsArray.length;
	for(var i=0; i<trianglesListsCount; i++)
	{
		this.trianglesListsArray[i].assignVerticesIdx();
	}
};

TrianglesMatrix.prototype.getVboFaceDataArray = function(resultVbo)
{
	// PROVISIONAL.***
	if(this.trianglesListsArray === undefined)
		return resultVbo;
	
	var indicesArray = [];
	
	var trianglesListsCount = this.trianglesListsArray.length;
	for(var i=0; i<trianglesListsCount; i++)
	{
		indicesArray = this.trianglesListsArray[i].getTrianglesIndicesArray(indicesArray);
	}
	
	resultVbo.idxVboDataArray = Int16Array.from(indicesArray);
	resultVbo.indicesCount = resultVbo.idxVboDataArray.length;
	
	return resultVbo;
};


















































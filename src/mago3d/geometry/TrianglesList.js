'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class TrianglesList
 */
var TrianglesList = function() 
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

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
TrianglesList.prototype.deleteObjects = function() 
{
	if (this.trianglesArray === undefined)
		return;
	
	var trianglesCount = this.trianglesArray.length;
	for(var i=0; i<trianglesCount; i++)
	{
		this.trianglesArray[i].deleteObjects();
		this.trianglesArray[i] = undefined;
	}
	this.trianglesArray = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
TrianglesList.prototype.getFaceDataArray = function(resultVbo) 
{
	if (this.trianglesArray === undefined)
		return resultVbo;
	
	var trianglesCount = this.trianglesArray.length;
	if(trianglesCount === 0)
		return resultVbo;
	
	if(resultVbo === undefined)
		resultVbo = new VBOVertexIdxCacheKey();

	var indicesArray = [];
	
	var triangle;
	for(var i=0; i<trianglesCount; i++)
	{
		triangle = this.trianglesArray[i];
		if(triangle.vtxIdx0 !== undefined && triangle.vtxIdx1 !== undefined && triangle.vtxIdx2 !== undefined )
		{
			indicesArray.push(triangle.vtxIdx0);
			indicesArray.push(triangle.vtxIdx1);
			indicesArray.push(triangle.vtxIdx2);
		}
	}
	resultVbo.idxVboDataArray = Int16Array.from(indicesArray);
	resultVbo.indicesCount = resultVbo.idxVboDataArray.length;
	return resultVbo;
};









































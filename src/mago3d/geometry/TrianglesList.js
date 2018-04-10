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
TrianglesList.prototype.newTriangle = function(vertex0, vertex1, vertex2) 
{
	if (this.trianglesArray === undefined)
	{ this.trianglesArray = []; }
	
	var triangle = new Triangle(vertex0, vertex1, vertex2);
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
	
	var trianglesCount = this.getTrianglesCount();
	for(var i=0; i<trianglesCount; i++)
	{
		this.trianglesArray[i].deleteObjects();
		this.trianglesArray[i] = undefined;
	}
	this.trianglesArray = undefined;
};

TrianglesList.prototype.getTrianglesCount = function() 
{
	if(this.trianglesArray === undefined)
		return 0;
	
	return this.trianglesArray.length;
};

TrianglesList.prototype.getTriangle = function(idx) 
{
	if(this.trianglesArray === undefined)
		return undefined;
	
	return this.trianglesArray[idx];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
TrianglesList.prototype.assignVerticesIdx = function() 
{
	var trianglesCount = this.getTrianglesCount();
	var trianglesArray = this.trianglesArray;
	for(var i=0; i<trianglesCount; i++)
	{
		trianglesArray[i].assignVerticesIdx();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
TrianglesList.getTrianglesIndicesArray = function(trianglesArray, indicesArray) 
{
	if(indicesArray === undefined)
		indicesArray = [];
	
	var trianglesCount = trianglesArray.length;
	for(var i=0; i<trianglesCount; i++)
	{
		trianglesArray[i].getIndicesArray(indicesArray);
	}
	
	return indicesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
TrianglesList.prototype.getNoRepeatedVerticesArray = function(resultVerticesArray) 
{
	if(resultVerticesArray === undefined)
		resultVerticesArray = [];
	
	// 1rst, assign vertexIdxInList for all used vertives.***
	var trianglesCount = this.getTrianglesCount();
	var triangle;
	var idxAux = 0;
	var vtx_0, vtx_1, vtx_2;
	for(var i=0; i<trianglesCount; i++)
	{
		triangle = this.getTriangle(i);
		vtx_0 = triangle.vertex0;
		vtx_1 = triangle.vertex1;
		vtx_2 = triangle.vertex2;
		
		vtx_0.setIdxInList(idxAux);
		idxAux++;
		vtx_1.setIdxInList(idxAux);
		idxAux++;
		vtx_2.setIdxInList(idxAux);
		idxAux++;
	}
	
	// now, make a map of unique vertices map using "idxInList" of vertices.***
	var verticesMap = {};
	for(var i=0; i<trianglesCount; i++)
	{
		triangle = this.getTriangle(i);
		vtx_0 = triangle.vertex0;
		vtx_1 = triangle.vertex1;
		vtx_2 = triangle.vertex2;
		
		verticesMap[vtx_0.getIdxInList().toString()] = vtx_0;
		verticesMap[vtx_1.getIdxInList().toString()] = vtx_1;
		verticesMap[vtx_2.getIdxInList().toString()] = vtx_2;
	}
	
	// finally make the unique vertices array.***
	var vertex;
	for (var key in verticesMap)
	{
		vertex = verticesMap[key];
		resultVerticesArray.push(vertex);
	}
	
	return resultVerticesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
TrianglesList.getVboFaceDataArray = function(trianglesArray, resultVbo) 
{
	// PROVISIONAL.***
	if (trianglesArray === undefined)
		return resultVbo;
	
	var trianglesCount = trianglesArray.length;
	if(trianglesCount === 0)
		return resultVbo;
	
	if(resultVbo === undefined)
		resultVbo = new VBOVertexIdxCacheKey();

	var indicesArray = TrianglesList.getTrianglesIndicesArray(trianglesArray, undefined);
	resultVbo.idxVboDataArray = Int16Array.from(indicesArray);
	resultVbo.indicesCount = resultVbo.idxVboDataArray.length;
	return resultVbo;
};









































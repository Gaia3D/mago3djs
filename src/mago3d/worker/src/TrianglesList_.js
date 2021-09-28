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

TrianglesList_.prototype.getNoRepeatedVerticesArray = function(vertices) 
{
	vertices = TrianglesList_.getNoRepeatedVerticesArray(this.trianglesArray, vertices);
	return vertices;
};

TrianglesList_.getVboFaceDataArray = function(triangles, result) 
{
	// TODO: 함수기능을 분리해야함.
	if (result === undefined)
	{ result = {}; }

	if (triangles === undefined)
	{ return result; }
	
	var trianglesCount = triangles.length;
	if (trianglesCount === 0)
	{ return result; }

	var indicesArray = TrianglesList_.getTrianglesIndicesArray(triangles, undefined);
	result.indicesArray = indicesArray;
	
	return result;
};

TrianglesList_.prototype.addTriangle = function(triangle) 
{
	this.trianglesArray.push(triangle);
};

TrianglesList_.getTrianglesIndicesArray = function(triangles, indices) 
{
	var trianglesCount = triangles.length;
	var indicesCount = trianglesCount * 3;
	
	if (indices === undefined)
	{ indices = new Uint16Array(indicesCount); }
	
	for (var i=0; i<trianglesCount; i++)
	{
		indices[i*3] = triangles[i].vtxIdx0;
		indices[i*3+1] = triangles[i].vtxIdx1;
		indices[i*3+2] = triangles[i].vtxIdx2;
	}
	
	return indices;
};

TrianglesList_.prototype.assignVerticesIdx = function() 
{
	TrianglesList_.assignVerticesIdx(this.trianglesArray);
};

/**
 * 버텍스 인덱스를 할당한다.
 * 
 * @param {Triangle[]} triangles 삼각형 클래스 배열
 */
TrianglesList_.assignVerticesIdx = function(triangles) 
{
	if (triangles === undefined)
	{ return; }
	
	var trianglesCount = triangles.length;
	var triangles = triangles;
	for (var i=0; i<trianglesCount; i++)
	{
		triangles[i].assignVerticesIdx();
	}
};

TrianglesList_.getNoRepeatedVerticesArray = function(triangles, vertices) 
{
	if (vertices === undefined)
	{ vertices = []; }
	
	// 1rst, assign vertexIdxInList for all used vertives.
	var triangle;
	var idxAux = 0;
	var vtx_0, vtx_1, vtx_2;

	var trianglesCount = triangles.length;
	for (var i=0; i<trianglesCount; i++)
	{
		triangle = triangles[i];
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
	
	// now, make a map of unique vertices map using "idxInList" of vertices.
	var verticesMap = {};
	for (var i=0; i<trianglesCount; i++)
	{
		triangle = triangles[i];
		vtx_0 = triangle.vertex0;
		vtx_1 = triangle.vertex1;
		vtx_2 = triangle.vertex2;
		
		verticesMap[vtx_0.getIdxInList().toString()] = vtx_0;
		verticesMap[vtx_1.getIdxInList().toString()] = vtx_1;
		verticesMap[vtx_2.getIdxInList().toString()] = vtx_2;
	}
	
	// finally make the unique vertices array.
	var vertex;
	for (var key in verticesMap)
	{
		if (Object.prototype.hasOwnProperty.call(verticesMap, key))
		{
			vertex = verticesMap[key];
			vertices.push(vertex);
		}
	}
	
	return vertices;
};
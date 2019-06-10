'use strict';

/**
 * Triangle 객체의 리스트
 * 
 * @class
 */
var TrianglesList = function() 
{
	if (!(this instanceof TrianglesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * Triangle 객체의 배열
	 * @type {Triangle[]}
	 */
	this.trianglesArray = [];
};

/**
 * Triangle을 생성하고, 배열에 추가한다.
 * 
 * @param {Vertex} vertex0 1번 버텍스
 * @param {Vertex} vertex1 2번 버텍스
 * @param {Vertex} vertex2 3번 버텍스
 * @returns {Triangle} 생성된 Triangle 객체
 */
TrianglesList.prototype.newTriangle = function(vertex0, vertex1, vertex2) 
{
	var triangle = new Triangle(vertex0, vertex1, vertex2);
	this.trianglesArray.push(triangle);

	return triangle;
};

/**
 * 주어진 Triangle을 배열에 추가한다.
 * 
 * @param {Triangle} triangle 추가할 Triangle 객체
 */
TrianglesList.prototype.addTriangle = function(triangle) 
{
	this.trianglesArray.push(triangle);
};

/**
 * 생성된 객체가 있다면 삭제하고, 초기화한다.
 */
TrianglesList.prototype.deleteObjects = function() 
{
	var trianglesCount = this.getTrianglesCount();
	for (var i=0; i<trianglesCount; i++)
	{
		this.trianglesArray[i].deleteObjects();
		this.trianglesArray[i] = undefined;
	}
	this.trianglesArray = [];
};

/**
 * Triangle 배열의 개수를 구한다.
 * 
 * @returns {Number} 배열의 개수
 */
TrianglesList.prototype.getTrianglesCount = function() 
{
	return this.trianglesArray.length;
};

/**
 * 주어진 인덱스에 있는 Triangle 객체를 가져온다.
 * 
 * @param {Number} index 가져올 Triangle 객체의 인덱스 값
 * @returns {Triangle} 주어진 인덱스 위치의 Triangle 객체
 */
TrianglesList.prototype.getTriangle = function(index) 
{
	return this.trianglesArray[index];
};

/**
 * 버텍스 인덱스를 할당한다.
 */
TrianglesList.prototype.assignVerticesIdx = function() 
{
	TrianglesList.assignVerticesIdx(this.trianglesArray);
};

/**
 * 버텍스 인덱스를 할당한다.
 * 
 * @param {Triangle[]} triangles 삼각형 클래스 배열
 */
TrianglesList.assignVerticesIdx = function(triangles) 
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

/**
 * 주어진 삼각형 클래스 배열의 버텍스 인덱스를 주어진 인텍스 배열에 설정한다.
 * 
 * @param {Triangle[]} triangles 삼각형 클래스 배열
 * @param {Uint16Array[]}  indices 버텍스 인덱스 배열
 * @returns {Uint16Array[]}  버텍스 인덱스 배열
 */
TrianglesList.getTrianglesIndicesArray = function(triangles, indices) 
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

/**
 * 삼각형 클래스 배열의 반복되지 않는 인덱스들을 주어진 인텍스 배열에 설정한다.
 * 
 * @param {Vertex[]} vertices 버텍스 배열
 * @returns {Vertex[]} 버텍스 배열
 */
TrianglesList.prototype.getNoRepeatedVerticesArray = function(vertices) 
{
	vertices = TrianglesList.getNoRepeatedVerticesArray(this.trianglesArray, vertices);
	return vertices;
};

/**
 * 주어진 삼각형 클래스 배열의 반복되지 않는 인덱스들을 주어진 인텍스 배열에 설정한다.
 * 
 * @param {Triangle[]} triangles 
 * @param {Vertex[]} vertices 버텍스 배열
 * @returns {Vertex[]} 버텍스 배열
 */
TrianglesList.getNoRepeatedVerticesArray = function(triangles, vertices) 
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

/**
 * 주어진 trianglesArray을 VBO face 형태의 버텍스 배열로 설정한다.
 * 
 * @param {Triangle[]} triangles 삼각형 클래스 배열
 * @param {VBOVertexIdxCacheKey} result 
 * @param {VboMemoryManager} vboMemManager 
 * @returns {VBOVertexIdxCacheKey}
 */
TrianglesList.getVboFaceDataArray = function(triangles, result, vboMemManager) 
{
	// TODO: 함수기능을 분리해야함.
	if (result === undefined)
	{ result = new VBOVertexIdxCacheKey(); }

	if (triangles === undefined)
	{ return result; }
	
	var trianglesCount = triangles.length;
	if (trianglesCount === 0)
	{ return result; }

	var indicesArray = TrianglesList.getTrianglesIndicesArray(triangles, undefined);
	result.setDataArrayIdx(indicesArray, vboMemManager);
	
	return result;
};

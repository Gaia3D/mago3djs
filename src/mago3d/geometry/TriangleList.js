'use strict';

/**
 * Triangle 객체의 리스트
 * 
 * @class TrianglesList
 */
var TrianglesList = function() 
{
	if (!(this instanceof TrianglesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * trianglesArray
	 * @type {Triangle[]}
	 */
	this.trianglesArray;
};

/**
 * Triangle을 생성하고, 배열에 추가한다.
 * 
 * @param {Vertex} vertex0
 * @param {Vertex} vertex1
 * @param {Vertex} vertex2
 * @returns {Triangle} triangle 생성된 Triangle 객체
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
 * 주어진 Triangle을 배열에 추가한다.
 * 
 * @param {Triangle} triangle 추가할 Triangle 객체
 */
TrianglesList.prototype.addTriangle = function(triangle) 
{
	if (this.trianglesArray === undefined)
	{ this.trianglesArray = []; }

	this.trianglesArray.push(triangle);
};

/**
 * 생성된 객체가 있다면 삭제하고, 초기화한다.
 */
TrianglesList.prototype.deleteObjects = function() 
{
	if (this.trianglesArray === undefined)
	{ return; }
	
	var trianglesCount = this.getTrianglesCount();
	for (var i=0; i<trianglesCount; i++)
	{
		this.trianglesArray[i].deleteObjects();
		this.trianglesArray[i] = undefined;
	}
	this.trianglesArray = undefined;
};

/**
 * Triangle 배열의 개수를 구한다.
 * 
 * @return {Number} 배열의 개수
 */
TrianglesList.prototype.getTrianglesCount = function() 
{
	if (this.trianglesArray === undefined)
	{ return 0; }
	
	return this.trianglesArray.length;
};

/**
 * 주어진 인덱스에 있는 Triangle 객체를 가져온다.
 * 
 * @param {number} idx 가져올 Triangle 객체의 인덱스 값
 * @return {Triangle} 주어진 인덱스 위치의 Triangle 객체
 */
TrianglesList.prototype.getTriangle = function(idx) 
{
	if (this.trianglesArray === undefined)
	{ return undefined; }
	
	return this.trianglesArray[idx];
};

/**
 * 버텍스 인덱스를 할당한다.
 */
TrianglesList.prototype.assignVerticesIdx = function() 
{
	if (this.trianglesArray === undefined)
	{ return; }
	
	TrianglesList.assignVerticesIdx(this.trianglesArray);
};

/**
 * 버텍스 인덱스를 할당한다.
 * 
 * @param {TraiangleArray[]}  Triangle 배열
 */
TrianglesList.assignVerticesIdx = function(trianglesArray) 
{
	if (trianglesArray === undefined)
	{ return; }
	
	var trianglesCount = trianglesArray.length;
	var trianglesArray = trianglesArray;
	for (var i=0; i<trianglesCount; i++)
	{
		trianglesArray[i].assignVerticesIdx();
	}
};

/**
 * 주어진 trianglesArray 배열을 인텍스 배열에 설정한다.
 * 
 * @param {trianglesArray[]} trianglesArray
 * @param {indicesArray[]}  인덱스 배열
 * @returns {indicesArray[]}  인덱스 배열
 */
TrianglesList.getTrianglesIndicesArray = function(trianglesArray, indicesArray) 
{
	// 1rst, calculate indices count.
	var trianglesCount = trianglesArray.length;
	var indicesCount = trianglesCount * 3;
	
	
	if (indicesArray === undefined)
	{ indicesArray = new Uint16Array(indicesCount); }
	
	var idx = 0;
	for (var i=0; i<trianglesCount; i++)
	{
		indicesArray[i*3] = trianglesArray[i].vtxIdx0;
		indicesArray[i*3+1] = trianglesArray[i].vtxIdx1;
		indicesArray[i*3+2] = trianglesArray[i].vtxIdx2;
	}
	
	return indicesArray;
};

/**
 * Triangle 배열을 Vertex 배열로 설정한다.
 * 
 * @param {trianglesArray[]} trianglesArray 
 * @returns {Vertex[]} 버텍스 배열
 */
TrianglesList.prototype.getNoRepeatedVerticesArray = function(resultVerticesArray) 
{
	resultVerticesArray = TrianglesList.getNoRepeatedVerticesArray(this.trianglesArray, resultVerticesArray);
	return resultVerticesArray;
};

/**
* 주어진 Triangle 배열을 Vertex 배열로 설정한다.

 * @param {trianglesArray[]} trianglesArray 
 * @param {Vertex[]} 버텍스 배열
 * @returns {Vertex[]} 버텍스 배열
 */
TrianglesList.getNoRepeatedVerticesArray = function(trianglesArray, resultVerticesArray) 
{
	if (resultVerticesArray === undefined)
	{ resultVerticesArray = []; }
	
	// 1rst, assign vertexIdxInList for all used vertives.
	var trianglesCount = trianglesArray.length;
	var triangle;
	var idxAux = 0;
	var vtx_0, vtx_1, vtx_2;
	for (var i=0; i<trianglesCount; i++)
	{
		triangle = trianglesArray[i];
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
		triangle = trianglesArray[i];
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
			resultVerticesArray.push(vertex);
		}
	}
	
	return resultVerticesArray;
};

/**
 * 주어진 trianglesArray을 VBO face 형태의 버텍스 배열로 설정한다.
 * 
 * @param {} trianglesArray
 * @param {} resultVbo 
 * @param {VboMemoryManager} vboMemManager 
 * @returns vertexArray[idx]
 */
TrianglesList.getVboFaceDataArray = function(trianglesArray, resultVbo, vboMemManager) 
{
	if (trianglesArray === undefined)
	{ return resultVbo; }
	
	var trianglesCount = trianglesArray.length;
	if (trianglesCount === 0)
	{ return resultVbo; }
	
	if (resultVbo === undefined)
	{ resultVbo = new VBOVertexIdxCacheKey(); }

	var indicesArray = TrianglesList.getTrianglesIndicesArray(trianglesArray, undefined);
	resultVbo.setDataArrayIdx(indicesArray, vboMemManager);
	
	return resultVbo;
};

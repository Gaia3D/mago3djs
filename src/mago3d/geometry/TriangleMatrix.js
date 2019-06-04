'use strict';


/**
 * Triangle 리스트의 배열
 * 
 * @class TrianglesMatrix
 */
var TrianglesMatrix= function() 
{
	if (!(this instanceof TrianglesMatrix)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * Triangle 리스트의 배열
	 * @type {trianglesList[]}
	 */
	this.trianglesListsArray;
};

/**
 * 생성된 객체가 있다면 삭제하고, 초기화한다.
 */
TrianglesMatrix.prototype.deleteObjects = function()
{
	if (this.trianglesListsArray === undefined)
	{ return; }
	
	var trianglesListsCount = this.trianglesListsArray.length;
	for (var i=0; i<trianglesListsCount; i++)
	{
		this.trianglesListsArray[i].deleteObjects();
		this.trianglesListsArray[i] = undefined;
	}
	this.trianglesListsArray = undefined;
};

/**
 * 주어진 인덱스에 있는 TrianglesList를 가져온다.
 * 
 * @param {number} idx 가져올 Triangle 리스트의 인덱스 값
 * @return {TrianglesList} 주어진 인덱스 위치의 TrianglesList
 */
TrianglesMatrix.prototype.getTrianglesList = function(idx)
{
	if (this.trianglesListsArray === undefined)
	{ return undefined; }
	
	return this.trianglesListsArray[idx];
};

/**
 * TrianglesList 배열의 개수를 구한다.
 * 
 * @return {Number} 배열의 개수
 */
TrianglesMatrix.prototype.getTrianglesListsCount = function()
{
	if (this.trianglesListsArray === undefined)
	{ return 0; }
	
	return this.trianglesListsArray.length;
};

/**
 * Triangle 객체의 리스트를 추가하고, 배열에 추가한다.
 *
 * @returns {TrianglesList} Triangle 객체의 리스트
 */
TrianglesMatrix.prototype.newTrianglesList = function()
{
	if (this.trianglesListsArray === undefined)
	{ this.trianglesListsArray = []; }
	
	var trianglesList = new TrianglesList();
	this.trianglesListsArray.push(trianglesList);
	return trianglesList;
};

/**
 * 버텍스 인덱스를 할당한다.
 */
TrianglesMatrix.prototype.assignVerticesIdx = function() 
{
	var trianglesListsCount = this.trianglesListsArray.length;
	for (var i=0; i<trianglesListsCount; i++)
	{
		this.trianglesListsArray[i].assignVerticesIdx();
	}
};

/**
 * 주어진 trianglesArray을 VBO face 형태의 버텍스 배열로 설정한다.
 * 
 * @param {} resultVbo 
 * @returns vertexArray[idx] VBO face 형태의 버텍스 배열
 */
TrianglesMatrix.prototype.getVboFaceDataArray = function(resultVbo)
{
	// PROVISIONAL.
	if (this.trianglesListsArray === undefined)
	{ return resultVbo; }
	
	var indicesArray = [];
	
	var trianglesListsCount = this.trianglesListsArray.length;
	for (var i=0; i<trianglesListsCount; i++)
	{
		indicesArray = this.trianglesListsArray[i].getTrianglesIndicesArray(indicesArray);
	}
	
	resultVbo.idxVboDataArray = Int16Array.from(indicesArray);
	resultVbo.indicesCount = resultVbo.idxVboDataArray.length;
	
	return resultVbo;
};


















































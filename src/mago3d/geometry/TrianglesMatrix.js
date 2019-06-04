'use strict';

/**
 * Triangle 리스트의 배열
 * 
 * @class
 * 
 * @see TrianglesMatrix
 * @see TrianglesList
 */
var TrianglesMatrix= function() 
{
	if (!(this instanceof TrianglesMatrix)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * Triangle 리스트의 배열
	 * @type {TrianglesList[]}
	 */
	this.trianglesListsArray = [];
};

/**
 * 생성된 객체가 있다면 삭제하고, 초기화한다.
 */
TrianglesMatrix.prototype.deleteObjects = function()
{
	var trianglesListsCount = this.trianglesListsArray.length;
	for (var i=0; i<trianglesListsCount; i++)
	{
		this.trianglesListsArray[i].deleteObjects();
		this.trianglesListsArray[i] = undefined;
	}
	this.trianglesListsArray = [];
};

/**
 * 주어진 인덱스에 있는 TrianglesList를 가져온다.
 * 
 * @param {Number} index 가져올 Triangle 리스트의 인덱스 값
 * @return {TrianglesList} 주어진 인덱스 위치의 TrianglesList
 */
TrianglesMatrix.prototype.getTrianglesList = function(index)
{
	return this.trianglesListsArray[index];
};

/**
 * TrianglesList 배열의 개수를 구한다.
 * 
 * @return {Number} 배열의 개수
 */
TrianglesMatrix.prototype.getTrianglesListsCount = function()
{
	return this.trianglesListsArray.length;
};

/**
 * Triangle 객체의 리스트를 추가하고, 배열에 추가한다.
 *
 * @return {TrianglesList} Triangle 객체의 리스트
 */
TrianglesMatrix.prototype.newTrianglesList = function()
{
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
 * @param {} result 
 * @return vertexArray[idx] VBO face 형태의 버텍스 배열
 */
TrianglesMatrix.prototype.getVboFaceDataArray = function(result)
{
	// TODO: 정확한 입출력 결과 타입을 알 수 없음.
	var indicesArray = [];
	var trianglesListsCount = this.trianglesListsArray.length;
	for (var i=0; i<trianglesListsCount; i++)
	{
		indicesArray = this.trianglesListsArray[i].getTrianglesIndicesArray(indicesArray);
	}
	
	result.idxVboDataArray = Int16Array.from(indicesArray);
	result.indicesCount = result.idxVboDataArray.length;
	
	return result;
};


















































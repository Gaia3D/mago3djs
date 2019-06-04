'use strict';

/**
 * Triangle(삼각형)를 생성하기 위한 클래스
 * 
 * @class Triangle
 *  
 * @param {Vertex} vertex0
 * @param {Vertex} vertex1
 * @param {Vertex} vertex2
 */
var Triangle= function(vertex0, vertex1, vertex2) 
{
	if (!(this instanceof Triangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * vertex0
	 * @type {Vertex}
	 * @default vertex0.
	 */
	this.vertex0;
	/**
	 * vertex1
	 * @type {Vertex}
	 * @default vertex1.
	 */
	this.vertex1;
	/**
	 * vertex2
	 * @type {Vertex}
	 * @default vertex2.
	 */
	this.vertex2;
	/**
	 * vtxIdx0
	 * @type {number}
	 * @default undefined.
	 */
	this.vtxIdx0;
	/**
	 * vtxIdx1
	 * @type {number}
	 * @default undefined.
	 */
	this.vtxIdx1;
	/**
	 * vtxIdx2
	 * @type {number}
	 * @default undefined.
	 */
	this.vtxIdx2;
	/**
	 * plainNormal
	 * @type {Point3D}
	 * @default undefined.
	 */	
	this.normal; 
	
	if (vertex0 !== undefined)
	{ this.vertex0 = vertex0; }
	
	if (vertex1 !== undefined)
	{ this.vertex1 = vertex1; }
	
	if (vertex2 !== undefined)
	{ this.vertex2 = vertex2; }
	
	this.hEdge;
};

/**
* 생성된 객체가 있다면 삭제하고 초기화 한다.
*/
Triangle.prototype.deleteObjects = function() 
{
	// the triangle no deletes vertices.
	if (this.vertex0)
	{
		this.vertex0 = undefined;
	}
	if (this.vertex1)
	{
		this.vertex1 = undefined;
	}
	if (this.vertex2)
	{
		this.vertex2 = undefined;
	}
	if (this.normal)
	{
		this.normal.deleteObjects();
		this.normal = undefined;
	}
	
	this.vtxIdx0 = undefined;
	this.vtxIdx1 = undefined;
	this.vtxIdx2 = undefined;
};

/**
 * Triangle의 각각의 Vertex 설정
 * 
 * @param {Vertex} vertex0
 * @param {Vertex} vertex1
 * @param {Vertex} vertex2
 */
Triangle.prototype.setVertices = function(vertex0, vertex1, vertex2) 
{
	this.vertex0 = vertex0;
	this.vertex1 = vertex1;
	this.vertex2 = vertex2;
};

/**
 * Vertex의 vertexList index를 가지고 와서 Vertex index 설정
 */
Triangle.prototype.assignVerticesIdx = function() 
{
	if (this.vertex0 === undefined || this.vertex1 === undefined || this.vertex2 === undefined)
	{ return; }
	
	this.vtxIdx0 = this.vertex0.getIdxInList();
	this.vtxIdx1 = this.vertex1.getIdxInList();
	this.vtxIdx2 = this.vertex2.getIdxInList();
};

/**
 * Triangle의 Vertex index를 인덱스 배열에 추가한다.
 * 
 * @param {indicesArray[]} 인덱스 배열
 * @return {indicesArray[]} 인덱스 배열 
 */
Triangle.prototype.getIndicesArray = function(indicesArray)
{
	if (indicesArray === undefined)
	{ indicesArray = []; }
	
	if (this.vtxIdx0 !== undefined && this.vtxIdx1 !== undefined && this.vtxIdx2 !== undefined )
	{
		indicesArray.push(this.vtxIdx0);
		indicesArray.push(this.vtxIdx1);
		indicesArray.push(this.vtxIdx2);
	}
	
	return indicesArray;
};

/**
 * invert triangle을 구한다.
 */
Triangle.prototype.invertSense = function() 
{
	var vertexAux = this.vertex1;
	this.vertex1 = this.vertex2;
	this.vertex2 = vertexAux;
	
	this.calculatePlaneNormal();
};

/**
 * PlaneNormal을 계산한다.
 */
Triangle.prototype.calculatePlaneNormal = function() 
{
	if (this.normal === undefined)
	{ this.normal = new Point3D(); }

	this.getCrossProduct(0, this.normal);
	this.normal.unitary();
};

/**
 * CrossProduct(벡터의 외적)를 계산한다.
 * 
 * @param {Number} idxVertex 
 * @param {Number} resultCrossProduct 
 * @returns {Number} resultCrossProduct
 */
Triangle.prototype.getCrossProduct = function(idxVertex, resultCrossProduct) 
{
	if (resultCrossProduct === undefined)
	{ resultCrossProduct = new Point3D(); }

	var currentPoint, prevPoint, nextPoint;

	if (idxVertex === 0)
	{
		currentPoint = this.vertex0.point3d;
		prevPoint = this.vertex2.point3d;
		nextPoint = this.vertex1.point3d;
	}
	else if (idxVertex === 1)
	{
		currentPoint = this.vertex1.point3d;
		prevPoint = this.vertex0.point3d;
		nextPoint = this.vertex2.point3d;
	}
	else if (idxVertex === 2)
	{
		currentPoint = this.vertex2.point3d;
		prevPoint = this.vertex1.point3d;
		nextPoint = this.vertex0.point3d;
	}

	var v1 = new Point3D();
	var v2 = new Point3D();

	v1.set(currentPoint.x - prevPoint.x,     currentPoint.y - prevPoint.y,     currentPoint.z - prevPoint.z);
	v2.set(nextPoint.x - currentPoint.x,     nextPoint.y - currentPoint.y,     nextPoint.z - currentPoint.z);

	v1.unitary();
	v2.unitary();

	resultCrossProduct = v1.crossProduct(v2, resultCrossProduct);

	return resultCrossProduct;
};

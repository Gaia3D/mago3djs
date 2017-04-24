'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Triangle
 */
var Triangle= function() {
	if(!(this instanceof Triangle)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertex0;
	this.vertex1;
	this.vertex2;
	this.normal;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Triangle.prototype.destroy = function() {

	this.vertex0 = undefined;
	this.vertex1 = undefined;
	this.vertex2 = undefined;
	this.normal = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point_1 변수
 * @param point_2 변수
 * @param point_3 변수
 */
Triangle.prototype.setVertices = function(vertex_0, vertex_1, vertex_2) {
	this.vertex0 = vertex_0;
	this.vertex1 = vertex_1;
	this.vertex2 = vertex_2;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point_1 변수
 */
Triangle.prototype.calculatePlaneNormal = function()
{
	if(this.normal == undefined)
		this.normal = new Point3D();

	this.getCrossProduct(0, this.normal);
	this.normal.unitary();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point_1 변수
 */
Triangle.prototype.getCrossProduct = function(idxVertex, resultCrossProduct)
{
	if(resultCrossProduct == undefined)
		resultCrossProduct = new Point3D();

	var currentPoint, prevPoint, nextPoint;

	if(idxVertex == 0)
	{
		currentPoint = this.vertex0.point3d;
		prevPoint = this.vertex2.point3d;
		nextPoint = this.vertex1.point3d;
	}
	else if(idxVertex == 1)
	{
		currentPoint = this.vertex1.point3d;
		prevPoint = this.vertex0.point3d;
		nextPoint = this.vertex2.point3d;
	}
	else if(idxVertex == 2)
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

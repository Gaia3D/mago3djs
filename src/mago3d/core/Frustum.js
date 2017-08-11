'use strict';

/**
 * 카메라
 * @class Frustum
 */
var Frustum = function() 
{
	if (!(this instanceof Frustum)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.near = new Float32Array([0.1]);
	this.far = new Float32Array([1000.0]);
	this.fovyRad = new Float32Array([0.8037]);
	this.fovRad = new Float32Array([1.047]);
	this.aspectRatio = new Float32Array([1.3584]);
	this.planesArray = [];
	this.dirty = true;
	
	for (var i=0; i<6; i++)
	{
		var plane = new Plane();
		this.planesArray.push(plane);
	}
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Frustum.prototype.intersectionSphere = function(sphere) 
{
	var intersects = false;
	for (var i=0; i<6; i++)
	{
		var intersectionType = this.planesArray[i].intersectionSphere(sphere);
		if (intersectionType === Constant.INTERSECTION_OUTSIDE)
		{ return Constant.INTERSECTION_OUTSIDE; }
		else if (intersectionType === Constant.INTERSECTION_INTERSECT)
		{ intersects = true; }
	}
	
	if (intersects)
	{ return Constant.INTERSECTION_INTERSECT; }
	else
	{ return Constant.INTERSECTION_INSIDE; }
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Frustum.prototype.calculateFrustumPlanes = function(sphere) 
{
	// 1rst, calculate the center points of near and far.
	// todo:
};





























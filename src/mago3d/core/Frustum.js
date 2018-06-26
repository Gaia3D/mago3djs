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
	this.tangentOfHalfFovy = new Float32Array([0.0]);
	this.fovRad = new Float32Array([1.047]);
	this.aspectRatio = new Float32Array([1.3584]);
	this.planesArray = [];
	this.dirty = true;
	
	// plane[0] = near, plane[1] = far.***
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
Frustum.prototype.copyParametersFrom = function(frustum) 
{
	this.near[0] = frustum.near[0];
	this.far[0] = frustum.far[0];
	this.fovyRad[0] = frustum.fovyRad[0];
	this.tangentOfHalfFovy[0] = frustum.tangentOfHalfFovy[0];
	this.fovRad[0] = frustum.fovRad[0];
	this.aspectRatio[0] = frustum.aspectRatio[0];
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Frustum.prototype.setNear = function(near) 
{
	this.near[0] = near;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Frustum.prototype.setFar = function(far) 
{
	this.far[0] = far;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Frustum.prototype.intersectionNearFarSphere = function(sphere) 
{
	var intersects = false;
	for (var i=0; i<2; i++)
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






























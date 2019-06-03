'use strict';

/**
 * Furstum used by camera
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
	this.fovyRad = new Float32Array([0.8037]); //vertical viewing angle
	this.tangentOfHalfFovy = new Float32Array([0.0]); // to get the length of the horizontal angle of fov
	this.fovRad = new Float32Array([1.047]);//horizontal viewing angle
	this.aspectRatio = new Float32Array([1.3584]);
	this.planesArray = [];
	this.dirty = true;
	
	// plane[0] = near, plane[1] = far.
	for (var i=0; i<6; i++)
	{
		var plane = new Plane();
		this.planesArray.push(plane);
	}
};

/**
 * copy the other frustum
 * @param {Frustum} frustum
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
 * Set the near of frustum by distance
 * @param near
 */
Frustum.prototype.setNear = function(near) 
{
	this.near[0] = near;
};

/**
 * Set the fart of frustum by distance
 * @param far
 */
Frustum.prototype.setFar = function(far) 
{
	this.far[0] = far;
};

/**
 * Check whether the bounding sphere of the feature is intersected with the near and far of the frustum for frustum culling
 * @param {Sphere} sphere
 * @returns {Boolean}
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
 * Check whether the bounding sphere of the feature is intersected with this frustum for frustum culling
 * @param {Sphere} sphere
 * @returns {Boolean}
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






























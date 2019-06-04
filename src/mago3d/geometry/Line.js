'use strict';

/**
 * This represents a line which can be shown as linear equation
 * @class Line
 * @param {Point3D} point the point which decides line
 * @param {Point3D} direction the vector of the direction which decides line
 */
var Line = function(point, direction) 
{
	if (!(this instanceof Line)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// (x,y,z) = (x0,y0,z0) + lambda * (u, v, w);
	if (point !== undefined)
	{ this.point = point; }
	else
	{ this.point = new Point3D(); }
	
	if (direction !== undefined)
	{ this.direction = direction; }
	else
	{ this.direction = new Point3D(); }
};

/**
 * Set a point and a direction of a linear equation
 * @param px 변수 the value of x coordi of the point
 * @param py 변수 the value of y coordi of the point
 * @param pz 변수 the value of z coordi of the point
 * @param dx 변수 the value of x coordi of the point which represents direction
 * @param dy 변수 the value of y coordi of the point which represents direction
 * @param dz 변수 the value of z coordi of the point which represents direction
 */
Line.prototype.setPointAndDir = function(px, py, pz, dx, dy, dz) 
{
	// Note: dx, dy, dz must be unitary.
	this.point.set(px, py, pz);
	this.direction.set(dx, dy, dz);
	this.direction.unitary();
};

/**
 * get the point which is projected as 2d plane(the plane which is represented by using x,y axis)
 * @param point the target point 
 * @param projectedPoint the projected point of the target point
 * @return projetedPoint
 */
Line.prototype.getProjectedPoint = function(point, projectedPoint) 
{
	if (projectedPoint === undefined)
	{ projectedPoint = new Point3D(); }
	
	var plane = new Plane();
	plane.setPointAndNormal(point.x, point.y, point.z, this.direction.x, this.direction.y, this.direction.z);
	projectedPoint = plane.intersectionLine(this, projectedPoint);
	
	return projectedPoint;
};

/**
 * Check whether the given point is on this line or not
 * @param {Point3D} point the given point
 * @param {Number} error the error rate which can be handdled
 * @return {Boolean} 
 */
Line.prototype.isCoincidentPoint = function(point, error) 
{
	if (point === undefined)
	{ return false; }
	
	var projectedPoint = this.getProjectedPoint(point);
	
	if (projectedPoint === undefined)
	{ return false; }
	
	if (error === undefined)
	{ error = 10E-8; }
	
	var squaredDist = projectedPoint.squareDistToPoint(point);
	
	if (squaredDist < error*error)
	{ return true; }
	
	return false;
};


















































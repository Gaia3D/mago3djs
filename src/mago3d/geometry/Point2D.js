'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class Point2D
* @constructor
*/
var Point2D = function(x, y) 
{
	if (!(this instanceof Point2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	if (x) { this.x = x; }
	else { this.x = 0.0; }
	if (y) { this.y = y; }
	else { this.y = 0.0; }
	
	this.ownerVertex3d; // Aux var. This will be used for this : this Point2D is the projected ownerVertex3d into 2D
	
	/**associated this property will be used to save topologic information */
	this.associated;
};

/**
 * delete the value of x and y coordi
 */
Point2D.prototype.deleteObjects = function() 
{
	this.x = undefined;
	this.y = undefined;
};

/**
 * set the value of the property 'associated'
 * @param {Point2D} associated
 */
Point2D.prototype.setAssociated = function(associated) 
{
	// aux test.
	this.associated.x = associated.x;
	this.associated.y = associated.y;
};

/**
 * get the value of the property 'associated'
 * @returns {Point2D} this.associated
 */
Point2D.prototype.getAssociated = function() 
{
	// aux test.
	return this.associated;	
};

/**
 * copy the value of other point
 * @param {Point2D} point2d
 */
Point2D.prototype.copyFrom = function(point2d) 
{
	this.x = point2d.x;
	this.y = point2d.y;
};

/**
 * change the sign of the values of point inversely
 */
Point2D.prototype.inverse = function() 
{
	this.x = -this.x;
	this.y = -this.y;
};

/**
 * set the value of x,y coordi of the point
 * @param {Number} x
 * @param {Number} y
 */
Point2D.prototype.set = function(x, y) 
{
	this.x = x;
	this.y = y;
};

Point2D.prototype.getX = function()
{
	return this.x;
};
Point2D.prototype.getY = function()
{
	return this.y;
};

/**
 * return the result of calculating (this.x*this.x + this.y*this.y) 
 * @returns this.x*this.x + this.y*this.y;
 */
Point2D.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y;
};

/**
 * return the result of calculating Math.sqrt(this.x*this.x + this.y*this.y);
 * @returns Math.sqrt(this.x*this.x + this.y*this.y);
 */
Point2D.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

/**
 * 
 * make unitary of the point
 */
Point2D.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
};

/**
 * Check whether the given line is parallel to this line or not
 * @param {Point2D} point
 * @returns {Boolean}
 */
Point2D.prototype.isParallelToPoint = function(point, err) 
{
	if (point === undefined)
	{ return false; }
	var zero = defaultValue(err, 10E-10);
	var angRad = this.angleRadToVector(point);
	
	// if angle is zero or 180 degree, then this is parallel to "line".
	if (angRad < zero || Math.abs(angRad - Math.PI) < zero)
	{ return true; }
	
	return false;
};

/**
 * prepare to calculate the Euclidean distance between this point and the other point.
 * @param {Number} point
 * @returns dx*dx + dy*dy
 */
Point2D.prototype.squareDistToPoint = function(point) 
{
	if (!point) { return; }
	var dx = this.x - point.x;
	var dy = this.y - point.y;

	return dx*dx + dy*dy;
};

/**
 * calculate the Euclidean distance between this point and the other point.
 * @param {Point2D} point the target
 * @returns the calculated Euclidan distance
 */
Point2D.prototype.distToPoint = function(point) 
{
	return Math.sqrt(this.squareDistToPoint(point));
};

/**
 * returns a perpendicular vector to left
 * @param {Point2D} resultPoint
 * @returns {Point2D} resultPoint
 */
Point2D.prototype.getLeft = function(resultPoint) 
{
	if (resultPoint === undefined)
	{ resultPoint = new Point2D(); }
	
	resultPoint.set(-this.y, this.x);
	return resultPoint;
};

/**
 * returns a perpendicular vector to right
 * @param {Point2D} resultPoint
 * @returns {Point2D} resultPoint
 */
Point2D.prototype.getRight = function(resultPoint) 
{
	if (resultPoint === undefined)
	{ resultPoint = new Point2D(); }
	
	resultPoint.set(this.y, -this.x);
	return resultPoint;
};

/**
 * Check whether this point and the other point are overlapped(coincident) or not 
 * @param {Point2D} point the point which will be checked whether the two points are coincident or not
 * @param {Number} errorDist allowed error range value of calculating distance. It can be from 0.1mm to 10E-8
 * @returns {Boolean} the flag which let us know whether they are coincident or not 
 */
Point2D.prototype.isCoincidentToPoint = function(point, errorDist) 
{
	var squareDist = this.distToPoint(point);
	var coincident = false;
	if (!errorDist) 
	{
		errorDist = 10E-8;
	}

	if (squareDist < errorDist*errorDist)
	{
		coincident = true;
	}

	return coincident;
};

/**
 * @param {Point2D} targetPoint this returns a vector that points to "targetPoint" from "this" 
 * @param {Point3D} resultVector the "resultVector" has the direction from "this" to "targetPoint", but is NOT normalized.
 * @returns {Point3D} resultVector
 */
Point2D.prototype.getVectorToPoint = function(targetPoint, resultVector) 
{
	if (targetPoint === undefined)
	{ return undefined; }
	
	if (resultVector === undefined)
	{ resultVector = new Point2D(); }
	
	resultVector.set(targetPoint.x - this.x, targetPoint.y - this.y);
	
	return resultVector;
};

/**
 * Calculate vector product
 * @param {Point2D} point the point which will be used at this calculate.
 * @returns {Number} calculated result
 */
Point2D.prototype.crossProduct = function(point) 
{
	return this.x * point.y - point.x * this.y;
};

/**
 * Calculate scalar production of vector
 * @param {Point2D} point the point which will be used at this calculate.
 * @returns {Number} calculated result
 */
Point2D.prototype.scalarProduct = function(point) 
{
	var scalarProd = this.x*point.x + this.y*point.y;
	return scalarProd;
};

/**
 */
Point2D.mix = function(point_a, point_b, factor, resultPoint) 
{
	if (!resultPoint)
	{ resultPoint = new Point2D(); }

	var xVal = point_a.x * (1.0 - factor) + point_b.x * factor;
	var yVal = point_a.y * (1.0 - factor) + point_b.y * factor;

	resultPoint.set(xVal, yVal);

	return resultPoint;
};

/**
 * Calculate the radian value of the angle of the two vectors
 * @param vector the target vector
 * @returns the angle of two vector
 */
Point2D.prototype.angleRadToVector = function(vector) 
{
	if (vector === undefined)
	{ return undefined; }
	
	//
	//var scalarProd = this.scalarProduct(vector);
	var myModul = this.getModul();
	var vecModul = vector.getModul();
	
	// calcule by cos.
	//var cosAlfa = scalarProd / (myModul * vecModul); 
	//var angRad = Math.acos(cosAlfa);
	//var angDeg = alfa * 180.0/Math.PI;
	//------------------------------------------------------
	var error = 10E-10;
	if (myModul < error || vecModul < error)
	{ return undefined; }
	
	return Math.acos(this.scalarProduct(vector) / (myModul * vecModul));
};

/**
 * Calculate the degree value of the angle of the two vectors
 * @param point 변수
 * @param resultPoint 변수
 * @returns resultPoint
 */
Point2D.prototype.angleDegToVector = function(vector) 
{
	if (vector === undefined)
	{ return undefined; }
	
	var angRad = this.angleRadToVector(vector);
	
	if (angRad === undefined)
	{ return undefined; }
		
	return angRad * 180.0/Math.PI;
};

















































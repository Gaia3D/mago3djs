'use strict';

var Point2D_ = function(x, y) 
{
	if (x !== undefined) { this.x = x; }
	else { this.x = 0.0; }
	if (y !== undefined) { this.y = y; }
	else { this.y = 0.0; }

	this.ownerVertex3d; // Aux var. This will be used for this : this Point2D is the projected ownerVertex3d into 2D
	
	/**associated this property will be used to save topologic information */
	this.associated;
};

Point2D_.prototype.set = function(x, y) 
{
	this.x = x;
	this.y = y;
};

Point2D_.prototype.deleteObjects = function() 
{
	this.x = undefined;
	this.y = undefined;
};

Point2D_.prototype.copyFrom = function(point2d) 
{
	this.x = point2d.x;
	this.y = point2d.y;
};

Point2D_.prototype.getVectorToPoint = function(targetPoint, resultVector) 
{
	if (targetPoint === undefined)
	{ return undefined; }
	
	if (!resultVector)
	{ resultVector = new Point2D_(); }
	
	resultVector.set(targetPoint.x - this.x, targetPoint.y - this.y);
	
	return resultVector;
};

Point2D_.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y;
};

Point2D_.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

Point2D_.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
};

Point2D_.prototype.crossProduct = function(point) 
{
	return this.x * point.y - point.x * this.y;
};

Point2D_.prototype.scalarProduct = function(point) 
{
	var scalarProd = this.x*point.x + this.y*point.y;
	return scalarProd;
};

Point2D_.prototype.squareDistToPoint = function(point) 
{
	if (!point) { return; }
	var dx = this.x - point.x;
	var dy = this.y - point.y;

	return dx*dx + dy*dy;
};

Point2D_.prototype.distToPoint = function(point) 
{
	return Math.sqrt(this.squareDistToPoint(point));
};

Point2D_.prototype.angleRadToVector = function(vector) 
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

Point2D_.prototype.isCoincidentToPoint = function(point, errorDist) 
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
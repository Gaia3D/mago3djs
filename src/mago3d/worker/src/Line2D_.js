'use strict';

var Line2D_ = function() 
{
	// (x,y) = (x0,y0) + lambda * (u, v);
	this.point = new Point2D_();
	this.direction = new Point2D_();
};

Line2D_.prototype.setPointAndDir = function(px, py, dx, dy) 
{
	this.point.set(px, py);
	this.direction.set(dx, dy);
	this.direction.unitary();
};

Line2D_.prototype.isParallelToLine = function(line) 
{
	if (line === undefined)
	{ return false; }
	
	var zero = 10E-10;
	
	// Method 1.***
	var angRad = this.direction.angleRadToVector(line.direction);
	// if angle is zero or 180 degree, then this is parallel to "line".
	if (angRad < zero || Math.abs(angRad - Math.PI) < zero)
	{ return true; }
	
	/*
	// Method 2.***
	// Another way is using the dot product.***
	var dotProd = this.direction.scalarProduct(line.direction);
	if (Math.abs(dotProd) < zero || Math.abs(dotProd - 1.0) < zero)
	{ return true; }
	*/
	return false;
};

Line2D_.prototype.intersectionWithLine = function(line, resultIntersectPoint) 
{
	if (line === undefined)
	{ return undefined; }
	
	// 1rst, check that this is not parallel to "line".
	if (this.isParallelToLine(line))
	{ return undefined; }
	
	// now, check if this or "line" are vertical or horizontal.
	var intersectX;
	var intersectY;
	
	var zero = 10E-10;
	if (Math.abs(this.direction.x) < zero)
	{
		// this is a vertical line.
		var slope = line.direction.y / line.direction.x;
		var b = line.point.y - slope * line.point.x;
		
		intersectX = this.point.x;
		intersectY = slope * this.point.x + b;
	}
	else if (Math.abs(this.direction.y) < zero)
	{
		// this is a horizontal line.
		// must check if the "line" is vertical.
		if (Math.abs(line.direction.x) < zero)
		{
			// "line" is vertical.
			intersectX = line.point.x;
			intersectY = this.point.y;
		}
		else 
		{
			var slope = line.direction.y / line.direction.x;
			var b = line.point.y - slope * line.point.x;
			
			intersectX = (this.point.y - b)/slope;
			intersectY = this.point.y;
		}	
	}
	else 
	{
		// this is oblique.
		if (Math.abs(line.direction.x) < zero)
		{
			// "line" is vertical.
			var mySlope = this.direction.y / this.direction.x;
			var myB = this.point.y - mySlope * this.point.x;
			intersectX = line.point.x;
			intersectY = intersectX * mySlope + myB;
		}
		else 
		{
			var mySlope = this.direction.y / this.direction.x;
			var myB = this.point.y - mySlope * this.point.x;
			
			var slope = line.direction.y / line.direction.x;
			var b = line.point.y - slope * line.point.x;
			
			intersectX = (myB - b)/ (slope - mySlope);
			intersectY = slope * intersectX + b;
		}
	}
	
	if (resultIntersectPoint === undefined)
	{ resultIntersectPoint = new Point2D_(); }
	
	resultIntersectPoint.set(intersectX, intersectY);
	return resultIntersectPoint;
};

Line2D_.prototype.getProjectedPoint = function(point, projectedPoint) 
{
	if (point === undefined)
	{ return undefined; }
	
	if (projectedPoint === undefined)
	{ projectedPoint = new Point2D_(); }
	
	var perpendicular = this.getPerpendicularLeft(point);
	projectedPoint = this.intersectionWithLine(perpendicular, projectedPoint);
	
	return projectedPoint;
};


Line2D_.prototype.getPerpendicularLeft = function(point) 
{
	var perpendicular = new Line2D_();
	
	if (point)
	{ perpendicular.point.set(point.x, point.y); }
	else
	{ perpendicular.point.set(this.point.x, this.point.y); }
	
	perpendicular.direction.set(-this.direction.y, this.direction.x);
	return perpendicular;
};

Line2D_.prototype.getRelativeSideOfPoint = function(point, error) 
{
	if (error === undefined)
	{ error = 10E-8; }

	var projectPoint = this.getProjectedPoint(point);

	var squaredDist = point.squareDistToPoint(projectPoint);
	
	if (squaredDist < error*error)
	{ return CODE_.relativePosition2D.COINCIDENT; }

	var vector = new Point2D_(point.x - projectPoint.x, point.y - projectPoint.y);
	vector.unitary();

	// gET OUR LEFT LINE.***
	var myLeft = this.getPerpendicularLeft(point);
	var scalar = myLeft.direction.scalarProduct(vector);

	if (scalar < 0.0) 
	{
		return CODE_.relativePosition2D.RIGHT;
	}
	else 
	{
		return CODE_.relativePosition2D.LEFT;
	}

	/*if ((Math.abs(vector.x-this.direction.y) < error) && (Math.abs(vector.y+this.direction.x) < error)) 
	{
		return CODE_.relativePosition2D.RIGHT;
	}
	else 
	{
		return CODE_.relativePosition2D.LEFT;
	}

	return CODE_.relativePosition2D.UNKNOWN;*/
};

Line2D_.prototype.isCoincidentPoint = function(point, error) 
{
	if (point === undefined)
	{ return false; }
	
	if (error === undefined)
	{ error = 10E-8; }
	
	var projectedPoint = this.getProjectedPoint(point, projectedPoint);
	
	var squaredDist = point.squareDistToPoint(projectedPoint);

	if (squaredDist < error*error)
	{ return true; }
	
	return false;
};
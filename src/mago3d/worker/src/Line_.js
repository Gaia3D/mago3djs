'use strict';

var Line_ = function(point, direction) 
{
	// (x,y,z) = (x0,y0,z0) + lambda * (u, v, w);
	if (point !== undefined)
	{ this.point = new Point3D_(point.x, point.y, point.z); }
	else
	{ this.point = new Point3D_(); }
	
	if (direction !== undefined)
	{ this.direction = direction; }
	else
	{ this.direction = new Point3D_(); }
};

Line_.prototype.setPointAndDir = function(px, py, pz, dx, dy, dz) 
{
	// Note: dx, dy, dz must be unitary.
	this.point.set(px, py, pz);
	this.direction.set(dx, dy, dz);
	this.direction.unitary();
};

Line_.prototype.set2Points = function(px, py, pz, px2, py2, pz2) 
{
	// Calculate the direction.
	var dir = new Point3D_(px2 - px, py2 - py, pz2 - pz);
	dir.unitary();

	this.setPointAndDir(px, py, pz, dir.x, dir.y, dir.z);
};
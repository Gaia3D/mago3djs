

var F4D_Line = function()
{
	// (x,y,z) = (x0,y0,z0) + lambda * (u, v, w);
	this.point = new f4d_point3d();
	this.direction = new f4d_point3d();
	
	
};

F4D_Line.prototype.setPointAndDir = function(px, py, pz, dx, dy, dz)
{
	this.point.set(px, py, pz);
	this.direction.set(dx, dy, dz);
	this.direction.unitary();
};
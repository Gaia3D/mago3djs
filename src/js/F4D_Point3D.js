

//***********************************************************************************************//
// Point3D.************************************************************************************* //
var f4d_point3d = function()
{
  this.x = 0.0;
  this.y = 0.0;
  this.z = 0.0;

};
  
f4d_point3d.prototype.destroy = function()
{
    this.x = null;
    this.y = null;
    this.z = null;

};

f4d_point3d.prototype.get_Modul = function()
{
	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z );
};

f4d_point3d.prototype.unitary = function()
{
	var modul = this.get_Modul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
};

f4d_point3d.prototype.crossProduct = function(point, resultPoint)
{
	if(resultPoint == undefined)
		resultPoint = new f4d_point3d();
	
	var px = point.x;
	var py = point.y;
	var pz = point.z;
	
	
	resultPoint.x = this.y*pz - py*this.z; 
	resultPoint.y = px*this.z - this.x*pz; 
	resultPoint.z = this.x*py - px*this.y;
	
	return resultPoint;
};

f4d_point3d.prototype.squareDistTo = function(px, py, pz)
{
    var dx = this.x - px;
    var dy = this.y - py;
    var dz = this.z - pz;
  
    return dx*dx + dy*dy + dz*dz;
};

f4d_point3d.prototype.set = function(_x, _y, _z)
{
	this.x = _x; this.y = _y; this.z = _z;
};

f4d_point3d.prototype.add = function(_x, _y, _z)
{
	this.x += _x; this.y += _y; this.z += _z;
};
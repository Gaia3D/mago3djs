'use strict';

var Vertex_ = function(position) 
{
	this.point3d;
	this.normal;
	this.texCoord;
	this.color4; // class: Color.
	this.outingHedge; // class: HalfEdge
	this.vertexType;
	this.idxInList;
	
	if (position)
	{ this.point3d = position; }
	else
	{
		this.point3d = new Point3D_();
	}
};

Vertex_.prototype.getPosition = function() 
{
	return this.point3d;
};
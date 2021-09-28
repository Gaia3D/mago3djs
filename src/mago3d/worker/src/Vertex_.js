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

Vertex_.prototype.deleteObjects = function() 
{
	if (this.point3d)
	{ this.point3d.deleteObjects(); }
	if (this.normal)
	{ this.normal.deleteObjects(); }
	if (this.texCoord)
	{ this.texCoord.deleteObjects(); }
	if (this.color4)
	{ this.color4.deleteObjects(); }
	
	this.point3d = undefined;
	this.normal = undefined;
	this.texCoord = undefined;
	this.color4 = undefined;
};

Vertex_.prototype.setVertexType = function (vertexType) 
{
	this.vertexType = vertexType;
};

Vertex_.prototype.setColorRGBA = function(r, g, b, alpha) 
{
	if (this.color4 === undefined) { this.color4 = new Color_(); }
	
	this.color4.setRGBA(r, g, b, alpha);
};

Vertex_.prototype.setIdxInList = function(idx) 
{
	this.idxInList = idx;
};

Vertex_.prototype.getIdxInList = function() 
{
	return this.idxInList;
};

Vertex_.prototype.setNormal = function(nx, ny, nz) 
{
	if (this.normal === undefined) { this.normal = new Point3D_(); }
	
	this.normal.set(nx, ny, nz);
};

Vertex_.prototype.copyFrom = function(vertex) 
{
	// copy position if exist.
	if (vertex.point3d)
	{
		if (this.point3d === undefined)
		{ this.point3d = new Point3D_(); }
		
		this.point3d.copyFrom(vertex.point3d);
	}
	
	// copy normal if exist.
	if (vertex.normal)
	{
		if (this.normal === undefined)
		{ this.normal = new Point3D_(); }
		
		this.normal.copyFrom(vertex.normal);
	}
	
	// copy texCoord if exist.
	if (vertex.texCoord)
	{
		if (this.texCoord === undefined)
		{ this.texCoord = new Point2D_(); }
		
		this.texCoord.copyFrom(vertex.texCoord);
	}
	
	// copy color4 if exist.
	if (vertex.color4)
	{
		if (this.color4 === undefined)
		{ this.color4 = new Color_(); }
		
		this.color4.copyFrom(vertex.color4);
	}
	
	this.vertexType = vertex.vertexType;
};



'use strict';

  
/**
 * 어떤 일을 하고 있습니까?
 * @class Vertex
 */
var Vertex = function(position) 
{
	if (!(this instanceof Vertex)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.point3d;
	this.normal; // class: Point3D.
	this.texCoord; // class: Point2D.
	this.color4; // class: Color.
	
	this.outingHedge; // class: HalfEdge
	//this.outingHalfEdgesArray; // Array [class: HalfEdge]. 
	this.vertexType; // 1 = important vertex.***
	this.idxInList; // auxiliar var.***
	
	if (position)
	{ this.point3d = position; }
	else
	{
		this.point3d = new Point3D();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
Vertex.prototype.deleteObjects = function() 
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

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
Vertex.prototype.getIdxInList = function() 
{
	return this.idxInList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
Vertex.prototype.setIdxInList = function(idx) 
{
	this.idxInList = idx;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
Vertex.prototype.copyFrom = function(vertex) 
{
	// copy position if exist.
	if (vertex.point3d)
	{
		if (this.point3d === undefined)
		{ this.point3d = new Point3D(); }
		
		this.point3d.copyFrom(vertex.point3d);
	}
	
	// copy normal if exist.
	if (vertex.normal)
	{
		if (this.normal === undefined)
		{ this.normal = new Point3D(); }
		
		this.normal.copyFrom(vertex.normal);
	}
	
	// copy texCoord if exist.
	if (vertex.texCoord)
	{
		if (this.texCoord === undefined)
		{ this.texCoord = new Point2D(); }
		
		this.texCoord.copyFrom(vertex.texCoord);
	}
	
	// copy color4 if exist.
	if (vertex.color4)
	{
		if (this.color4 === undefined)
		{ this.color4 = new Color(); }
		
		this.color4.copyFrom(vertex.color4);
	}
	
	this.vertexType = vertex.vertexType;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
Vertex.prototype.setPosition = function(x, y, z) 
{
	if (this.point3d === undefined)
	{ this.point3d = new Point3D(); }
	
	this.point3d.set(x, y, z);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param s 변수
 * @param t 변수
 */
Vertex.prototype.setTexCoord = function(s, t) 
{
	if (this.texCoord === undefined)
	{ this.texCoord = new Point2D(); }
	
	this.texCoord.set(s, t);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Vertex.prototype.setColorRGB = function(r, g, b) 
{
	if (this.color4 === undefined) { this.color4 = new Color(); }
	
	this.color4.setRGB(r, g, b);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Vertex.prototype.setColorRGBA = function(r, g, b, alpha) 
{
	if (this.color4 === undefined) { this.color4 = new Color(); }
	
	this.color4.setRGBA(r, g, b, alpha);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Vertex.prototype.setNormal = function(nx, ny, nz) 
{
	if (this.normal === undefined) { this.normal = new Point3D(); }
	
	this.normal.set(nx, ny, nz);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Vertex.prototype.getNormal = function() 
{
	if (this.normal === undefined) { this.normal = new Point3D(); }
	
	return this.normal;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Vertex.prototype.translate = function(dx, dy, dz) 
{
	this.point3d.add(dx, dy, dz);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Vertex.prototype.getOutingHEdges = function(resultHedgesArray) 
{
	if (resultHedgesArray === undefined)
	{ resultHedgesArray = []; }
	
	// todo:
	
	return resultHedgesArray;
};
















































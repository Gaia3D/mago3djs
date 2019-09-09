'use strict';

/**
 * Data structure with vertex information
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class Vertex
 * 
 * @param {Point3D} position vertex postion.
 */
var Vertex = function(position) 
{
	if (!(this instanceof Vertex)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * vertex 3d coordinate.
	 * @type {Point3D}
	 */
	this.point3d;

	/**
	 * vertex noraml.
	 * @type {Point3D}
	 */
	this.normal;

	/**
	 * 2d coordinate
	 * @type {Point2D}
	 */
	this.texCoord;

	/**
	 * vertex color
	 * @type {Color}
	 */
	this.color4; // class: Color.
	
	/**
	 * outingHedge
	 * @type {HalfEdge}
	 */
	this.outingHedge; // class: HalfEdge
	//this.outingHalfEdgesArray; // Array [class: HalfEdge]. 

	/**
	 * vertex type. 1 is important vertex.
	 * @type {Number}
	 */
	this.vertexType;

	/**
	 *  vertexList index
	 * @type {Number}
	 * 
	 * @see VertexList
	 */
	this.idxInList;
	

	if (position)
	{ this.point3d = position; }
	else
	{
		this.point3d = new Point3D();
	}
};

/**
 * vertex init.
 * all member set undifined;
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
 * get vertexList index
 * @returns {Number}
 */
Vertex.prototype.getIdxInList = function() 
{
	return this.idxInList;
};

/**
 * set vertexList index
 * @param {Number} idx index
 */
Vertex.prototype.setIdxInList = function(idx) 
{
	this.idxInList = idx;
};

/**
 * make vertex copy from another vertex. like clone.
 * @param {Vertex} vertex 
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
 * get this vertex point.
 * @returns {Point3D}
 */
Vertex.prototype.getPosition = function() 
{
	return this.point3d;
};

/**
 * set this vertex point. if this point3d undefined, set new Point3D instance.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Vertex.prototype.setPosition = function(x, y, z) 
{
	if (this.point3d === undefined)
	{ this.point3d = new Point3D(); }
	
	this.point3d.set(x, y, z);
};

/**
 * set this vertex texCoord. if this texCoord undefined, set new Point2D instance.
 * @param {Number} s
 * @param {Number} t
 */
Vertex.prototype.setTexCoord = function(s, t) 
{
	if (this.texCoord === undefined)
	{ this.texCoord = new Point2D(); }
	
	this.texCoord.set(s, t);
};

/**
 * set this vertex color exclude alpha. if this color4 undefined, set new Color instance.
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 */
Vertex.prototype.setColorRGB = function(r, g, b) 
{
	if (this.color4 === undefined) { this.color4 = new Color(); }
	
	this.color4.setRGB(r, g, b);
};

/**
 * set this vertex color include alpha. if this color4 undefined, set new Color instance.
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} alpha
 */
Vertex.prototype.setColorRGBA = function(r, g, b, alpha) 
{
	if (this.color4 === undefined) { this.color4 = new Color(); }
	
	this.color4.setRGBA(r, g, b, alpha);
};

/**
 * set this vertex normal. if this normal undefined, set new Point3D instance.
 * @param {Number} nx
 * @param {Number} ny
 * @param {Number} nz
 */
Vertex.prototype.setNormal = function(nx, ny, nz) 
{
	if (this.normal === undefined) { this.normal = new Point3D(); }
	
	this.normal.set(nx, ny, nz);
};

/**
 * get this vertex normal
 * @returns {Point3D} normal
 */
Vertex.prototype.getNormal = function() 
{
	if (this.normal === undefined) { this.normal = new Point3D(); }
	
	return this.normal;
};

/**
 * get this vertex normal
 * @returns {Point2D} normal
 */
Vertex.prototype.getTexCoord = function() 
{
	if (this.texCoord === undefined) { this.texCoord = new Point2D(); }
	
	return this.texCoord;
};

/**
 * vertex point translate. use add method.
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dz
 * @see Point3D#add
 */
Vertex.prototype.translate = function(dx, dy, dz) 
{
	this.point3d.add(dx, dy, dz);
};

/**
 * get vertex outinghedges. 
 * @deprecated
 * @param {Array} resultHedgesArray
 * @returns {Array} resultHedgesArray
 */
Vertex.prototype.getOutingHEdges = function(resultHedgesArray) 
{
	if (resultHedgesArray === undefined)
	{ resultHedgesArray = []; }
	
	// todo:
	
	return resultHedgesArray;
};

/**
 * get vertex intersected with plane. 
 * @static
 * @param {Vertex} vertex Required. 
 * @param {Plane} plane. 
 * @param {Point3D} projectionDirection projectionDirection must be unitary.
 * @param {Vertex} resultVertex Optional. 
 * @returns {Vertex} resultVertex
 */
Vertex.getProjectedOntoPlane = function(vertex, plane, projectionDirection, resultVertex)
{
	if (vertex === undefined)
	{ return resultVertex; }
	
	var position = vertex.getPosition();
	var line = new Line(position, projectionDirection);

	var intersectionPoint;
	intersectionPoint = plane.intersectionLine(line, intersectionPoint);
	
	if (resultVertex === undefined)
	{ resultVertex = new Vertex(); }
	
	// 1rst, copy from the original vertex.
	resultVertex.copyFrom(vertex);
	
	// Now, change only the position.
	resultVertex.setPosition(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
	
	return resultVertex;
};
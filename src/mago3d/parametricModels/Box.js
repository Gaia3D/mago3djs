'use strict';

/**
 * Box geometry.
 * @class Box
 */
var Box = function(width, length, height, name) 
{
	MagoRenderable.call(this);
	if (!(this instanceof Box)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// See MagoRenderable's members.
	// Initially, box centered at the center of the bottom.***
	this.mesh;
	this.centerPoint; // Usually (0,0,0).***
	this.width;
	this.length;
	this.height;
	this.owner;
	
	if (name !== undefined)
	{ this.name = name; }
	
	if (width !== undefined)
	{ this.width = width; }
	
	if (length !== undefined)
	{ this.length = length; }
	
	if (height !== undefined)
	{ this.height = height; }

};
Box.prototype = Object.create(MagoRenderable.prototype);
Box.prototype.constructor = Box;

/**
 * Returns the mesh.
 */
Box.prototype.getMesh = function()
{
	if (this.mesh === undefined)
	{
		this.mesh = this.makeMesh(this.width, this.length, this.height);
	}
	
	return this.mesh;
};

Box.prototype.moved = function()
{
	// do something.
};

/**
 * Makes the box mesh.
 * @param {Number} width
 * @param {Number} length
 * @param {Number} height 
 */
Box.prototype.makeMesh = function()
{
	var profileAux = new Profile2D();
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();

	var halfWidth = this.width * 0.5;
	var halLength = this.length * 0.5;
	var polyline = outerRing.newElement("POLYLINE");

	polyline.newPoint2d(-halfWidth, -halLength);
	polyline.newPoint2d(halfWidth, -halLength);
	polyline.newPoint2d(halfWidth, halLength);
	polyline.newPoint2d(-halfWidth, halLength);

	//var rect = outerRing.newElement("RECTANGLE");
	//rect.setCenterPosition(this.centerPoint.x, this.centerPoint.y);
	//rect.setDimensions(this.width, this.length);
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var extrusionDist = this.height;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;

	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.objectsArray.push(mesh);
	this.mesh = mesh;
	this.dirty = false;
	return mesh;
};





































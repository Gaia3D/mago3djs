'use strict';

/**
 * Box geometry.
 * @class Box
 */
var Box = function(width, length, height) 
{
	if (!(this instanceof Box)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// Initially, box centered at the center of the bottom.***
	this.mesh;
	this.centerPoint; // Usually (0,0,0).***
	this.width;
	this.length;
	this.height;
	this.owner;
	this.geoLocDataManager;
	
	if (width !== undefined)
	{ this.width = width; }
	
	if (length !== undefined)
	{ this.length = length; }
	
	if (height !== undefined)
	{ this.height = height; }

};

/**
 * Render this box feature
 * @param {MagoManager} magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 */
Box.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	if (this.mesh === undefined)
	{
		this.mesh = this.makeMesh(this.width, this.length, this.height);
		return;
	}
	
	// If exist geoLocDataManager, then set uniforms. TODO:.***
	
	this.mesh.render(magoManager, shader, renderType);
};

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

/**
 * Makes the box mesh.
 * @param {Number} width
 * @param {Number} length
 * @param {Number} height 
 */
Box.prototype.makeMesh = function(width, length, height)
{
	// check dimensions of the box.
	if (width !== undefined)
	{ this.width = width; }
	
	if (length !== undefined)
	{ this.length = length; }
	
	if (height !== undefined)
	{ this.height = height; }
	
	if (this.width === undefined)
	{ this.width = 1; }
	
	if (this.length === undefined)
	{ this.length = 1; }
	
	if (this.height === undefined)
	{ this.height = 1; }
	
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point3D(0, 0, 0); }

	
	var profileAux = new Profile2D();
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();
	var rect = outerRing.newElement("RECTANGLE");
	rect.setCenterPosition(this.centerPoint.x, this.centerPoint.y);
	rect.setDimensions(this.width, this.length);
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var extrusionDist = this.height;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;

	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	return mesh;
};





































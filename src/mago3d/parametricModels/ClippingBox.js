'use strict';

/**
 * ClippingBox geometry.
 * @class ClippingBox
 */
var ClippingBox = function(width, length, height, name) 
{
	MagoRenderable.call(this);
	if (!(this instanceof ClippingBox)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// Initially, box centered at the center of the bottom.***
	this.name;
	this.id;
	this.mesh;
	this.centerPoint; // Usually (0,0,0).***
	this.width;
	this.length;
	this.height;
	this.owner;
	this.geoLocDataManager;
	//MagoRenderable's member start
	this.color4; 
	this.tMat;
	this.tMatOriginal;
	//MagoRenderable's member end
	if (name !== undefined)
	{ this.name = name; }
	
	if (width !== undefined)
	{ this.width = width; }
	
	if (length !== undefined)
	{ this.length = length; }
	
	if (height !== undefined)
	{ this.height = height; }

};
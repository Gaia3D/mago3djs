'use strict';

/**
 * This is a material.
 * @class Material
 */
var Material = function(name) 
{
	if (!(this instanceof Material)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// this is under construction...
	// provisional data structure.
	this.id;
	this.name = name;
	if (this.name === undefined)
	{ this.name = "noName"; }
	
	this.diffuseTexture; // class Texture.
	this.color4;
};
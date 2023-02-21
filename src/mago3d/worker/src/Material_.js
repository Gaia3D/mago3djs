'use strict';
importScripts('./src/Texture_.js');
/**
 * This is a material
 * @class Material
*/
var Material_ = function(name, options)
{
	if (!(this instanceof Material_)) 
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

Material_.prototype.setDiffuseTextureUrl = function(url)
{
	if (this.diffuseTexture === undefined)
	{ this.diffuseTexture = new Texture_(); }

	this.diffuseTexture.url = url;

};

Material_.prototype.setColor4 = function(r, g, b, a)
{
	if (this.color4 === undefined)
	{ this.color4 = new Color(); }

	this.color4.setRGBA(r, g, b, a);
};
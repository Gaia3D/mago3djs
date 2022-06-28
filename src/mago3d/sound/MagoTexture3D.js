'use strict';

/**
 * @class MagoTexture3D
 */
var MagoTexture3D = function(options) 
{
	if (!(this instanceof MagoTexture3D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// The real 3D texture params.***
	this.texture3DXSize = 1024;
	this.texture3DYSize = 1024;
	this.texture3DZSize = 128;

	// The 3D texture into a mosaic texture matrix params. No special meaning var.***
	this.mosaicXCount = 1; // by default.
	this.mosaicYCount = 1; // by default.

	// Finally used texture sizes because of mosaicing.***
	this.finalTextureXSize;
	this.finalTextureZSize;
	this.finalSlicesCount = 1; // by default.***

	// Geometric params.***
	this.minMaxAltitudes = [0.0, 0.0]; // if exist.***

	this.texturesArray = [];

	if (options !== undefined)
	{
		if (options.texture3DXSize !== undefined)
		{
			this.texture3DXSize = options.texture3DXSize;
		}

		if (options.texture3DYSize !== undefined)
		{
			this.texture3DYSize = options.texture3DYSize;
		}

		if (options.texture3DZSize !== undefined)
		{
			this.texture3DZSize = options.texture3DZSize;
		}

		if (options.mosaicXCount !== undefined)
		{
			this.mosaicXCount = options.mosaicXCount;
		}

		if (options.mosaicYCount !== undefined)
		{
			this.mosaicYCount = options.mosaicYCount;
		}
	}
};

MagoTexture3D.prototype.deleteTextures = function (gl)
{
	var texCount = 0;
	if (this.texturesArray)
	{
		texCount = this.texturesArray.length;
	}
	for (var i=0; i<texCount; i++ )
	{
		gl.deleteTexture(this.texturesArray[i]);
	}

	this.texturesArray.length = 0;
};

MagoTexture3D.prototype.createTextures = function (gl)
{
	// 1rst, delete existent textures:
	this.deleteTextures(gl);

	var filter = gl.NEAREST;
	var texWrap = gl.CLAMP_TO_EDGE;
	var data = undefined;

	// 1rst, find the finally used texture size.***
	this.finalTextureXSize = this.mosaicXCount * this.texture3DXSize;
	this.finalTextureYSize = this.mosaicYCount * this.texture3DYSize;

	// now calculate the final slices count.***
	this.finalSlicesCount = Math.ceil(this.texture3DZSize / (this.mosaicXCount * this.mosaicYCount));

	for (var i=0; i<this.finalSlicesCount; i++)
	{
		var webglTex = Texture.createTexture(gl, filter, data, this.finalTextureXSize, this.finalTextureYSize, texWrap);
		this.texturesArray.push(webglTex);
	}
};

MagoTexture3D.prototype.getTexturesCount = function ()
{
	if (!this.texturesArray)
	{
		return 0;
	}

	return this.texturesArray.length;
};

MagoTexture3D.prototype.getTexture = function (idx)
{
	if (!this.texturesArray || this.texturesArray.length-1 < idx)
	{
		return null;
	}

	if (idx < 0)
	{
		return null;
	}

	return this.texturesArray[idx];
};

MagoTexture3D.prototype.copyParametersFrom = function (magoTexture3d)
{
	// this function copies the texture3d parameters from the input "magoTexture3d".***
	// The real 3D texture params.***
	this.texture3DXSize = magoTexture3d.texture3DXSize;
	this.texture3DYSize = magoTexture3d.texture3DYSize;
	this.texture3DZSize = magoTexture3d.texture3DZSize;

	// The 3D texture into a mosaic texture matrix params.***
	this.mosaicXCount = magoTexture3d.mosaicXCount; // by default.
	this.mosaicYCount = magoTexture3d.mosaicYCount; // by default.
};
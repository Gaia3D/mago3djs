'use strict';

/**
 * This draws a quad with the screen size.
 * @class ScreenQuad
 */
var ScreenQuad = function(vboMemManager, options) 
{
	if (!(this instanceof ScreenQuad)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vboCacheKey;

	var createTexCoordsBuffer = false;

	if(options)
	{
		if(options.createTexCoordsBuffer)
		{
			createTexCoordsBuffer = options.createTexCoordsBuffer;
		}
	}
	this.init(vboMemManager, createTexCoordsBuffer);
};

/**
 * 어떤 일을 하고 있습니까?
 */
ScreenQuad.prototype.init = function (vboMemManager, createTexCoordsBuffer) 
{
	var posDataArray = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]);
	this.vboCacheKey = new VBOVertexIdxCacheKey();
	var dimensions = 2;
	this.vboCacheKey.setDataArrayPos(posDataArray, vboMemManager, dimensions);

	if(createTexCoordsBuffer)
	{
		var texCoordsArray = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]);
		var dimensions = 2;
		this.vboCacheKey.setDataArrayTexCoord(texCoordsArray, vboMemManager, dimensions);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
ScreenQuad.prototype.render = function (magoManager, shader) 
{
	var gl = magoManager.getGl();
	if (!this.vboCacheKey.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return; }

	if(this.vboCacheKey.vboBufferTCoord)
	{
		if (!this.vboCacheKey.bindDataTexCoord(shader, magoManager.vboMemoryManager))
		{ return; }
	}
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
};
'use strict';

/**
 * This draws a quad with the screen size.
 * @class ScreenQuad
 */
var ScreenQuad = function(vboMemManager) 
{
	if (!(this instanceof ScreenQuad)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vboCacheKey;
	this.init(vboMemManager);
};

/**
 * 어떤 일을 하고 있습니까?
 */
ScreenQuad.prototype.init = function(vboMemManager) 
{
	var posDataArray = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]);
	this.vboCacheKey = new VBOVertexIdxCacheKey();
	var dimensions = 2;
	this.vboCacheKey.setDataArrayPos(posDataArray, vboMemManager, dimensions);
};

/**
 * 어떤 일을 하고 있습니까?
 */
ScreenQuad.prototype.render = function(magoManager, shader) 
{
	var gl = magoManager.getGl();
	if (!this.vboCacheKey.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return; }
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
};
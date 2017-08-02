'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Selection
 */
var Selection = function() 
{
	if (!(this instanceof Selection)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.drawing_height;
	this.drawing_width;
	this.GAIA_selectFrameBuffer;
	this.GAIA_selectRenderBuffer;
	this.GAIA_selectRttTexture;
	
	this.currentByteColorPicked = new Uint8Array(4);
	this.currentSelectedObj_idx = -1;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param drawingBufferWidth 변수
 * @param drawingBufferHeight 변수
 */
Selection.prototype.init = function(gl, drawingBufferWidth, drawingBufferHeight) 
{
	// http://www.webglacademy.com/courses.php?courses=0|1|20|2|3|4|23|5|6|7|10#10
	this.drawing_height = drawingBufferHeight;
	this.drawing_width = drawingBufferWidth;
	//this.lastCapturedColourMap = new Uint8Array(this.drawing_width * this.drawing_height * 4);
	this.GAIA_selectFrameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.GAIA_selectFrameBuffer);
	
	this.GAIA_selectRenderBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.GAIA_selectRenderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.drawing_width, this.drawing_height);

	this.GAIA_selectRttTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.GAIA_selectRttTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.drawing_width, this.drawing_height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.GAIA_selectRttTexture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.GAIA_selectRenderBuffer);
	
	// Finally...
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var Selection = function() {
	if(!(this instanceof Selection)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.drawingHeight;
	this.drawingWidth;
	this.selectFrameBuffer;
	this.selectRenderBuffer;
	this.selectRttTexture;
	
	this.currentByteColorPicked = new Uint8Array(4);
	this.currentSelectedObjIdx = -1;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param drawingBufferWidth 변수
 * @param drawingBufferHeight 변수
 */
Selection.prototype.init = function(gl, drawingBufferWidth, drawingBufferHeight) {
	// http://www.webglacademy.com/courses.php?courses=0|1|20|2|3|4|23|5|6|7|10#10
	this.drawingHeight = drawingBufferHeight;
	this.drawingWidth = drawingBufferWidth;
	//this.lastCapturedColourMap = new Uint8Array(this.drawingWidth * this.drawingHeight * 4);
	this.selectFrameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.selectFrameBuffer);
	
	this.selectRenderBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.selectRenderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16 , this.drawingWidth, this.drawingHeight);

	this.selectRttTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.selectRttTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.drawingWidth, this.drawingHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.selectRttTexture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.selectRenderBuffer);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};
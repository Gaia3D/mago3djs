




var f4d_selection = function()
{
	this.drawing_height = undefined;
	this.drawing_width = undefined;
	this.GAIA_selectFrameBuffer = undefined;
	this.GAIA_selectRenderBuffer = undefined;
	this.GAIA_selectRttTexture = undefined;
	
	this.currentByteColorPicked = new Uint8Array(4);
	this.currentSelectedObj_idx = -1;
	
};

f4d_selection.prototype.init = function(GL, drawingBufferWidth, drawingBufferHeight)
{
	// http://www.webglacademy.com/courses.php?courses=0|1|20|2|3|4|23|5|6|7|10#10
	this.drawing_height = drawingBufferHeight;
	this.drawing_width = drawingBufferWidth;
	//this.lastCapturedColourMap = new Uint8Array(this.drawing_width * this.drawing_height * 4);
	this.GAIA_selectFrameBuffer = GL.createFramebuffer();
	GL.bindFramebuffer(GL.FRAMEBUFFER, this.GAIA_selectFrameBuffer);
	
	this.GAIA_selectRenderBuffer = GL.createRenderbuffer();
	GL.bindRenderbuffer(GL.RENDERBUFFER, this.GAIA_selectRenderBuffer);
	GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16 , this.drawing_width, this.drawing_height);

	this.GAIA_selectRttTexture = GL.createTexture();
	GL.bindTexture(GL.TEXTURE_2D, this.GAIA_selectRttTexture);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, this.drawing_width, this.drawing_height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);

	GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this.GAIA_selectRttTexture, 0);
	GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, this.GAIA_selectRenderBuffer);
	
	// Finally...
	GL.bindTexture(GL.TEXTURE_2D, null);
	GL.bindRenderbuffer(GL.RENDERBUFFER, null);
	GL.bindFramebuffer(GL.FRAMEBUFFER, null);
};
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class FBO
 * @param gl 변수
 * @param width 변수
 * @param height 변수
 */
var FBO = function(gl, width, height) 
{
	if (!(this instanceof FBO)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.gl = gl;
	this.width = new Int32Array(1);
	this.height = new Int32Array(1);
	this.width[0] = width;
	this.height[0] = height;
	this.fbo = gl.createFramebuffer();
	this.depthBuffer = gl.createRenderbuffer();
	this.colorBuffer = gl.createTexture();
	this.dirty = true;
  
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.colorBuffer);  
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	//gl.generateMipmap(gl.TEXTURE_2D)

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width[0], height[0], 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
  
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width[0], height[0]);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorBuffer, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) 
	{
		throw "Incomplete frame buffer object.";
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};    

/**
 * 어떤 일을 하고 있습니까?
 */
FBO.prototype.bind = function() 
{
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
};

/**
 * 어떤 일을 하고 있습니까?
 */
FBO.prototype.unbind = function() 
{
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
};

/**
 * 어떤 일을 하고 있습니까?
 */
FBO.prototype.deleteObjects = function(gl) 
{
	if (this.depthBuffer)
	{ gl.deleteRenderbuffer(this.depthBuffer); }
	this.depthBuffer = undefined;
	
	if (this.colorBuffer)
	{ gl.deleteTexture(this.colorBuffer); }
	this.colorBuffer = undefined;
	
	if (this.fbo)
	{ gl.deleteFramebuffer(this.fbo); }
	this.fbo = undefined;
	
	
};

// static.***
FBO.createBuffer = function(gl, data) 
{
	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	return buffer;
};

FBO.bindFramebuffer = function(gl, framebuffer, texture) 
{
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	if (texture) 
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	}
};

FBO.bindAttribute = function(gl, buffer, attribute, numComponents) 
{
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(attribute);
	gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0);
};

FBO.bindTexture = function(gl, texture, unit) 
{
	gl.activeTexture(gl.TEXTURE0 + unit);
	gl.bindTexture(gl.TEXTURE_2D, texture);
};

















































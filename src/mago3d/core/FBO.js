'use strict';

/**
 * Frame Buffer Object
 * @class FBO
 * @constructor
 * 
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {Number} width Framebuffer width.
 * @param {Number} height Framebuffer height.
 */
var FBO = function(gl, width, height, options) 
{
	if (!(this instanceof FBO)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * WebGL rendering context.
	 * @type {WebGLRenderingContext}
	 * @default WebGLRenderingContext
	 */
	this.gl = gl;
	
	/**
	 * Framebuffer width.
	 * @type {Number}
	 * @default 0
	 */
	this.width = new Int32Array(1);
	
	/**
	 * Framebuffer height.
	 * @type {Number}
	 * @default 0
	 */
	this.height = new Int32Array(1);
	
	/**
	 * WebGL Framebuffer.
	 * @type {WebGLFramebuffer}
	 * @default WebGLFramebuffer
	 */
	this.fbo = gl.createFramebuffer();
	
	
	/**
	 * WebGL Renderbuffer.
	 * @type {WebGLRenderbuffer}
	 * @default WebGLRenderbuffer
	 */
	this.depthBuffer = gl.createRenderbuffer();
	
	/**
	 * WebGL texture.
	 * @type {WebGLTexture}
	 * @default WebGLTexture
	 */
	var colorBuffer;
	if (options)
	{
		if (options.colorBuffer !== undefined)
		{
			colorBuffer = options.colorBuffer;
		}
	}

	if (colorBuffer !== undefined)
	{ this.colorBuffer = colorBuffer; }
	else
	{ this.colorBuffer = gl.createTexture(); }
	
	/**
	 * Boolean var that indicates that the parameters must be updated.
	 * @type {Boolean}
	 * @default true
	 */
	this.dirty = true;
	
	// Init process.
	this.width[0] = width;
	this.height[0] = height;
  
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

FBO.prototype.setColorBuffer = function(colorBuffer) 
{
	
};

/**
 * Binds the framebuffer.
 */
FBO.prototype.bind = function() 
{
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
};

/**
 * Unbinds the framebuffer.
 */
FBO.prototype.unbind = function() 
{
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
};

/**
 * Deletes all objects.
 * @param gl
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

/**
 * Returns a new WebGL buffer.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {TypedArray} data Data array to bind.
 * @returns {WebGLBuffer} WebGL Buffer.
 */
FBO.createBuffer = function(gl, data) 
{
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	return buffer;
};

/**
 * Binds a framebuffer and texture to this instance
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {WebGLFramebuffer} framebuffer WebGL Framebuffer.
 * @param {WebGLTexture} texture WebGL Texture.
 */
FBO.bindFramebuffer = function(gl, framebuffer, texture) 
{
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	if (texture) 
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	}
};
/**
 * Binds the attribute of each 
 */
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

















































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
	options = options ? options : {};
	this.options = options;
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
	 * Framebuffer width scale.
	 * @type {Number}
	 * @default 1
	 */
	 this.widthScale = 1.0;
	
	 /**
	  * Framebuffer height scale.
	  * @type {Number}
	  * @default 1
	  */
	 this.heightScale = 1.0;
	
	/**
	 * WebGL Framebuffer.
	 * @type {WebGLFramebuffer}
	 * @default WebGLFramebuffer
	 */
	this.fbo = undefined;
	
	/**
	 * WebGL Renderbuffer.
	 * @type {WebGLRenderbuffer}
	 * @default WebGLRenderbuffer
	 */
	this.depthBuffer = undefined;
	
	/**
	 * WebGL texture.
	 * @type {WebGLTexture}
	 * @default WebGLTexture
	 */
	this.colorBuffer = undefined;

	/**
	 * WebGL texture.
	 * @type {WebGLTexture}
	 * @default WebGLTexture
	 */
	this.colorBuffer2 = undefined;
	
	/**
	 * Boolean var that indicates that the parameters must be updated.
	 * @type {Boolean}
	 * @default true
	 */
	this.dirty = true;

	this.numColorBuffers = 1; // init.
	this.colorBuffersArray = [];
	
	// Init process.
	this.width[0] = width;
	this.height[0] = height;

	if (options.multiRenderTarget)
	{
		this.multiRenderTarget = true;
	}

	if (options.numColorBuffers)
	{
		this.numColorBuffers = options.numColorBuffers;
	}

	if (options.matchCanvasSize)
	{
		var that = this;
		window.addEventListener('changeCanvasSize', function()
		{
			var canvas = that.gl.canvas;

			that.width[0] = canvas.offsetWidth;
			that.height[0] = canvas.offsetHeight;

			that.deleteObjects(that.gl);
			if (that.multiRenderTarget)
			{ that.initMRT(); }
			else
			{ that.init(); }
		}, false);
	}

	if (options.widthScale !== undefined)
	{
		this.widthScale = options.widthScale;
	}

	if (options.heightScale !== undefined)
	{
		this.heightScale = options.heightScale;
	}

	if (this.multiRenderTarget)
	{
		this.initMRT();
	}
	else 
	{
		this.init();
	}
};  

FBO.prototype.getWidth = function() 
{
	return Math.floor(this.width[0] * this.widthScale);
};

FBO.prototype.getHeight = function() 
{
	return Math.floor(this.height[0] * this.heightScale);
};

FBO.prototype.init = function() 
{
	var gl = this.gl;
	this.fbo = gl.createFramebuffer();
	this.depthBuffer = gl.createRenderbuffer();

	for (var i=0; i<this.numColorBuffers; i++)
	{
		var colorBuffer = gl.createTexture();
		this.colorBuffersArray[i] = colorBuffer;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, colorBuffer);    
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.getWidth(), this.getHeight(), 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.getWidth(), this.getHeight());
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorBuffer, 0);
	}

	this.colorBuffer = this.colorBuffersArray[0];

	// Finally bind the 1rst colorBuffer.***
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorBuffer, 0);
		
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) 
	{
		throw "Incomplete frame buffer object.";
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

FBO.prototype.init_original = function() 
{
	var gl = this.gl;
	this.fbo = gl.createFramebuffer();
	this.depthBuffer = gl.createRenderbuffer();

	for (var i=0; i<this.numColorBuffers; i++)
	{
		if (this.options.colorBuffer)
		{ this.colorBuffer = this.options.colorBuffer; }
		else
		{ this.colorBuffer = gl.createTexture(); }

		var colorBuffer = gl.createTexture();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.colorBuffer);    
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.getWidth(), this.getHeight(), 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.getWidth(), this.getHeight());
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
	
		var colorBuffer = this.colorBuffersArray[i];
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, this.colorBuffer, 0);
	}
	

	this.colorBuffersArray[0] = this.colorBuffer;
		
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) 
	{
		throw "Incomplete frame buffer object.";
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

FBO.prototype.initMRT = function() 
{
	var gl = this.gl;
	this.fbo = gl.createFramebuffer();
	this.depthBuffer = gl.createRenderbuffer();

	this.extbuffers = gl.getExtension("WEBGL_draw_buffers");

	this.colorBuffersArray.length = 0; // init.
	for (var i=0; i<this.numColorBuffers; i++)
	{
		var colorBuffer = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, colorBuffer);  // depthTex.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.getWidth(), this.getHeight(), 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
		this.colorBuffersArray.push(colorBuffer);
	}

	/////////////////////////////////////////////////////
	this.colorBuffer = this.colorBuffersArray[0];
	this.colorBuffer1 = this.colorBuffersArray[1];
	////////////////////////////////////////////////////
  
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.getWidth(), this.getHeight());
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

	for (var i=0; i<this.numColorBuffers; i++)
	{
		var colorBuffer = this.colorBuffersArray[i];
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT0_WEBGL + i, gl.TEXTURE_2D, colorBuffer, 0);
	}
	
	//this.extbuffers.drawBuffersWEBGL(
	//	[
	//		this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
	//		this.extbuffers.COLOR_ATTACHMENT1_WEBGL  // gl_FragData[1]
	//	]);
		

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) 
	{
		throw "Incomplete frame buffer object.";
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

FBO.prototype.setColorBuffer = function(colorBuffer) 
{
	this.colorBuffer = colorBuffer;
	var gl = this.gl;

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, colorBuffer);  
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.getWidth(), this.getHeight(), 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
  
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.getWidth(), this.getHeight());
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorBuffer, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) 
	{
		throw "Incomplete frame buffer object.";
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * Binds the framebuffer.
 */
FBO.prototype.bind = function() 
{
	var gl = this.gl;
	gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);

	//gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	//gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.getWidth(), this.getHeight());
	//gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
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
FBO.createBuffer = function(gl, data, dataTarget) 
{
	if (dataTarget === undefined)
	{
		dataTarget = gl.ARRAY_BUFFER;
	}
	var buffer = gl.createBuffer();
	gl.bindBuffer(dataTarget, buffer);
	gl.bufferData(dataTarget, data, gl.STATIC_DRAW);
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
 * Binds a framebuffer and texture to this instance
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {WebGLFramebuffer} framebuffer WebGL Framebuffer.
 * @param {WebGLTexture} texture WebGL Texture.
 * @param {WebGLTexture} texture2 WebGL Texture.
 * @param {extbuffers} extbuffers.
 */
FBO.bindFramebufferMRT = function(gl, framebuffer, texture, texture2, extbuffers) 
{
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	if (texture) 
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, texture, 0);
	}

	if (texture2) 
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, texture2, 0);
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


FBO.prototype.getAspectRatio = function()
{
	return this.getWidth() / this.getHeight();
};


















































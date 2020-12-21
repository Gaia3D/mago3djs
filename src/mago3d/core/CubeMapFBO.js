'use strict';

/**
 * Frame Buffer Object
 * @class CubeMapFBO
 * @constructor
 * 
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {Number} width Framebuffer width.
 * @param {Number} height Framebuffer height.
 */
var CubeMapFBO = function(gl, width, options) 
{
	if (!(this instanceof CubeMapFBO)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
    }
    
    // https://en.wikipedia.org/wiki/Cube_mapping
    // http://marcinignac.com/blog/pragmatic-pbr-hdr/

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
	 * WebGL Framebuffer.
	 * @type {WebGLFramebuffer}
	 * @default WebGLFramebuffer
	 */
	this.framebuffer = undefined;
	
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
	 * Boolean var that indicates that the parameters must be updated.
	 * @type {Boolean}
	 * @default true
	 */
	this.dirty = true;

	this.numColorBuffers = 1; // init.
	this.colorBuffersArray = [];
	
	// Init process.
	this.width[0] = width;

	if(options.multiRenderTarget)
	{
		this.multiRenderTarget = true;
	}

	if(options.numColorBuffers)
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
			if(that.multiRenderTarget)
			that.initMRT();
			else
			that.init();
		}, false);
	}

	if(this.multiRenderTarget)
	{
		this.initMRT();
	}
	else{
		this.init();
	}
}; 

CubeMapFBO.prototype.init = function() 
{
	var gl = this.gl;
	//this.fbo = gl.createFramebuffer();
	this.depthBuffer = gl.createRenderbuffer();

	if (this.options.colorBuffer)
	{ this.colorBuffer = this.options.colorBuffer; }
	else
    { this.colorBuffer = gl.createTexture(); }
    
    if(!this.colorBuffer)
    {
        var hola = 0;
    }

	gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.colorBuffer);    
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	////gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width[0], this.width[0], 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
  
	////gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	////gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width[0], this.height[0]);
    ////gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
    
    for (var face = 0; face < 6; face++)
    {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.RGBA, this.width[0], this.width[0], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

	this.framebuffer = [];
    for (var face = 0; face < 6; face++) 
    {
        this.framebuffer[face] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[face]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, this.colorBuffer, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthbuffer);

        var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER); // Check for errors
        if (e !== gl.FRAMEBUFFER_COMPLETE) throw "Cubemap framebuffer object is incomplete: " + e.toString();
    }

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

CubeMapFBO.prototype.initMRT = function() 
{
	var gl = this.gl;
	this.fbo = gl.createFramebuffer();
	this.depthBuffer = gl.createRenderbuffer();

	this.extbuffers = gl.getExtension("WEBGL_draw_buffers");

	this.colorBuffersArray.length = 0; // init.
	for(var i=0; i<this.numColorBuffers; i++)
	{
		var colorBuffer = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, colorBuffer);  // depthTex.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width[0], this.height[0], 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
		this.colorBuffersArray.push(colorBuffer);
	}

	/////////////////////////////////////////////////////
	this.colorBuffer = this.colorBuffersArray[0];
	this.colorBuffer1 = this.colorBuffersArray[1];
	////////////////////////////////////////////////////
  
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width[0], this.height[0]);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

	for(var i=0; i<this.numColorBuffers; i++)
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

CubeMapFBO.prototype.getModelViewProjectionMatrix = function(cubeFace, options) 
{
    if(!this.mvpMatrixArray)
    {
        // create the 6 mvpMatrices.
        var fovyRad = 90 * Math.PI/180;
        var aspectRatio = 1;
        var near = 0.01;
        var far = 1000.0;

        //resultProjectionMatrix._floatArrays = glMatrix.mat4.perspective(resultProjectionMatrix._floatArrays, frustum.fovyRad[0], frustum.aspectRatio[0], frustum.near[0], frustum.far[0]);
    }

    return this.mvpMatrixArray[cubeFace];
};
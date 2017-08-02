'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Pin
 *
 */
var Pin = function() 
{
	if (!(this instanceof Pin)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.texture; // default.***
	this.texturesArray = [];
	this.positionBuffer;
	this.texcoordBuffer;
	
};

Pin.prototype.createPin = function(gl)
{
	this.positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

	// Put a unit quad in the buffer
	var positionsPinQuad = [
		0, 0, 0,
		1, 0, 0,
		0, 1, 0,
		0, 1, 0,
		1, 0, 0,
		1, 1, 0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsPinQuad), gl.STATIC_DRAW);

	this.texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
	var texcoordsPinQuad = [
		0, 0,
		1, 0,
		0, 1,
		0, 1,
		1, 0,
		1, 1
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoordsPinQuad), gl.STATIC_DRAW);
	
};

Pin.prototype.createPinCenterBottom = function(gl)
{
	this.positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

	// Put a unit quad in the buffer
	var positionsPinQuad = [
		-0.5, 0, 0,
		0.5, 0, 0,
		-0.5, 1, 0,
		-0.5, 1, 0,
		0.5, 0, 0,
		0.5, 1, 0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsPinQuad), gl.STATIC_DRAW);

	this.texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
	var texcoordsPinQuad = [
		0, 0,
		1, 0,
		0, 1,
		0, 1,
		1, 0,
		1, 1
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoordsPinQuad), gl.STATIC_DRAW);
	
};
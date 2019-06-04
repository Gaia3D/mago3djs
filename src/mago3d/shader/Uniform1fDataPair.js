'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Uniform1fDataPair
 * @param gl 변수
 */
var Uniform1fDataPair = function(gl, uniformName) 
{
	if (!(this instanceof Uniform1fDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.floatValue; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
Uniform1fDataPair.prototype.bindUniform = function() 
{
	this.gl.uniform1f(this.uniformLocation, this.floatValue[0]);
};
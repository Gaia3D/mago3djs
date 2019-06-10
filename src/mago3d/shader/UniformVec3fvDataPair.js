'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class UniformVec3fvDataPair
 * @param gl 변수
 */
var UniformVec3fvDataPair = function(gl, uniformName) 
{
	if (!(this instanceof UniformVec3fvDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.vec3fv; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
UniformVec3fvDataPair.prototype.bindUniform = function() 
{
	this.gl.uniform3fv(this.uniformLocation, this.vec3fv);
};
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class UniformVec4fvDataPair
 * @param gl 변수
 */
var UniformVec4fvDataPair = function(gl, uniformName) 
{
	if (!(this instanceof UniformVec4fvDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.vec4fv; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
UniformVec4fvDataPair.prototype.bindUniform = function() 
{
	this.gl.uniform4fv(this.uniformLocation, this.vec4fv);
};

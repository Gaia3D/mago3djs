'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class UniformMatrix4fvDataPair
 * @param gl 변수
 */
var UniformMatrix4fvDataPair = function(gl, uniformName) 
{
	if (!(this instanceof UniformMatrix4fvDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.matrix4fv; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
UniformMatrix4fvDataPair.prototype.bindUniform = function() 
{
	this.gl.uniformMatrix4fv(this.uniformLocation, false, this.matrix4fv);
};
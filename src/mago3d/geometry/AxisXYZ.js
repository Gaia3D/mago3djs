'use strict';

/**
 * 선
 * @class AxisXYZ
 */
var AxisXYZ = function() 
{
	if (!(this instanceof AxisXYZ)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.xLength = 60;
	this.yLength = 60;
	this.zLength = 60;
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.vboKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
};

AxisXYZ.prototype.setDimension = function(xLength, yLength, zLength)
{
	this.xLength = xLength;
	this.yLength = yLength;
	this.zLength = zLength;
};

AxisXYZ.prototype.getVboKeysContainer = function()
{
	return this.vbo_vicks_container;
};

AxisXYZ.prototype.getVbo = function(resultVboKey)
{
	if(resultVboKey === undefined)
		resultVboKey = new VBOVertexIdxCacheKey();
	
	if (resultVboKey.posVboDataArray === undefined)
	{ resultVboKey.posVboDataArray = []; }

	if (resultVboKey.colVboDataArray === undefined)
	{ resultVboKey.colVboDataArray = []; }

	if (resultVboKey.norVboDataArray === undefined)
	{ resultVboKey.norVboDataArray = []; }

	var positions = [];
	var normals = [];
	var colors = [];
	
	// xAxis.***
	positions.push(0,0,0, this.xLength,0,0);
	colors.push(255,0,0,255, 255,0,0,255);
	normals.push(0,0,255, 0,0,255);
	
	// yAxis.***
	positions.push(0,0,0, 0,this.yLength,0);
	colors.push(0,255,0,255, 0,255,0,255);
	normals.push(0,0,255, 0,0,255);
	
	// zAxis.***
	positions.push(0,0,0, 0,0,this.zLength);
	colors.push(0,0,255,255, 0,0,255,255);
	normals.push(255,0,0, 255,0,0);

	resultVboKey.posVboDataArray = Float32Array.from(positions);
	resultVboKey.colVboDataArray = Int8Array.from(colors);
	resultVboKey.norVboDataArray = Int8Array.from(normals);
	
	resultVboKey.vertexCount = 6;
	
	return resultVboKey;
};
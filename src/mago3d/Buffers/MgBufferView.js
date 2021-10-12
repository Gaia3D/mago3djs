'use strict';

/**
 * @class MgBufferView
 * @constructor 
 */
var MgBufferView = function () 
{
	if (!(this instanceof MgBufferView)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mgBuffer;
	this.byteOffset = 0;
	this.byteLength = undefined;
	this.byteStride = 0;
	this.target = undefined; // GL.ARRAY_BUFFER, GL.ELEMENT_ARRAY_BUFFER.

	this.name = undefined;

	// auxiliar vars. Used before to create the MgBuffer.***
	// Temporarily, the mgBufferView can have the bufferData.***
	this.aux_auxMgBuffer;
    
};

MgBufferView.prototype.setMgBuffer = function (mgBuffer)
{
	this.mgBuffer = mgBuffer;
};

MgBufferView.prototype.setByteOffset = function (byteOffset)
{
	this.byteOffset = byteOffset;
};

MgBufferView.prototype.setByteLength = function (byteLength)
{
	this.byteLength = byteLength;
};

MgBufferView.prototype.setAuxMgBuffer = function (auxMgBuffer)
{
	this.aux_auxMgBuffer = auxMgBuffer;
};
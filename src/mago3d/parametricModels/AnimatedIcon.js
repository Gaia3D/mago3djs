'use strict';

/**
 * @class AnimatedIcon
 */
var AnimatedIcon = function(options) 
{
	if (!(this instanceof AnimatedIcon)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// https://imgbin.com/png/FWMR7jaC/animation-walk-cycle-png

	this._itineraryManager;
	this._fileLoadState = CODE.fileLoadState.READY;
	this._filePath;
	this._mosaicTexture;
	this._mosaicTexColumnsCount;
	this._mosaicTexRowsCount;
	this._isPrepared = false;

	this.positionBuffer;
	this.texcoordBuffer;


	if (options !== undefined)
	{
		if (options.filePath)
		{
			this._filePath = options.filePath;
		}
	}
};

AnimatedIcon.prototype.getPositionBuffer = function(gl)
{
	if (this.positionBuffer === undefined)
	{
		// Create buffers.***
		this.positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

		// Put a unit quad in the buffer
		var positionsPinQuad = new Float32Array(16);
		
		var i =0;
		var point3d = new Point3D(0, 0, 0);
		positionsPinQuad[i*16] = point3d.x;
		positionsPinQuad[i*16+1] = point3d.y;
		positionsPinQuad[i*16+2] = point3d.z;
		positionsPinQuad[i*16+3] = 1; // order.
		
		positionsPinQuad[i*16+4] = point3d.x;
		positionsPinQuad[i*16+5] = point3d.y;
		positionsPinQuad[i*16+6] = point3d.z;
		positionsPinQuad[i*16+7] = -1; // order.
		
		positionsPinQuad[i*16+8] = point3d.x;
		positionsPinQuad[i*16+9] = point3d.y;
		positionsPinQuad[i*16+10] = point3d.z;
		positionsPinQuad[i*16+11] = 2; // order.
		
		positionsPinQuad[i*16+12] = point3d.x;
		positionsPinQuad[i*16+13] = point3d.y;
		positionsPinQuad[i*16+14] = point3d.z;
		positionsPinQuad[i*16+15] = -2; // order.
			
		gl.bufferData(gl.ARRAY_BUFFER, positionsPinQuad, gl.STATIC_DRAW);

		this.texcoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
		var texcoordsPinQuad = [
			0, 0,
			1, 0,
			0, 1,
			1, 1
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoordsPinQuad), gl.STATIC_DRAW);
	}

	return this.positionBuffer;
};

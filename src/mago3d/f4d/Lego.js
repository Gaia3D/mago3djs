'use strict';

/**
 * F4D Lego 클래스
 * 
 * @alias Lego
 * @class Lego
 */
var Lego = function() 
{
	if (!(this instanceof Lego)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArrayBuffer;
	this.selColor4;
};

/**
 * F4D Lego 자료를 읽는다
 * 
 * @param {any} gl 
 * @param {any} readWriter 
 * @param {any} dataArraybuffer 
 * @param {any} bytesReaded 
 */
Lego.prototype.parseArrayBuffer = function(gl, readWriter, dataArraybuffer, bytesReaded)
{
	this.parseLegoData(dataArraybuffer);
};

/**
 * F4D Lego 자료를 읽는다
 * 
 * @param {ArrayBuffer} buffer 
 */
Lego.prototype.parseLegoData = function(buffer)
{
	if (this.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)	{ return; }

	var stream = new DataStream(buffer, 0, DataStream.LITTLE_ENDIAN);
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	var bbox = new BoundingBox();
	var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();

	// BoundingBox
	bbox.minX = stream.readFloat32();
	bbox.minY = stream.readFloat32();
	bbox.minZ = stream.readFloat32();
	bbox.maxX = stream.readFloat32();
	bbox.maxY = stream.readFloat32();
	bbox.maxZ = stream.readFloat32();

	// VBO(Position Buffer) - x,y,z
	var numPositions = stream.readUint32();
	var positionBuffer = stream.readFloat32Array(numPositions * 3);
	// console.log(numPositions + " Positions = " + positionBuffer[0]);

	vboCacheKey.vertexCount = numPositions;
	vboCacheKey.posVboDataArray = positionBuffer;

	// VBO(Normal Buffer) - i,j,k
	var hasNormals = stream.readUint8();
	if (hasNormals) 
	{
		var numNormals = stream.readUint32();
		var normalBuffer = stream.readInt8Array(numNormals * 3);
		// console.log(numNormals + " Normals = " + normalBuffer[0]);

		vboCacheKey.norVboDataArray = normalBuffer;
	}

	// VBO(Color Buffer) - r,g,b,a
	var hasColors = stream.readUint8();
	if (hasColors)
	{
		var numColors = stream.readUint32();
		var colorBuffer = stream.readUint8Array(numColors * 4);
		// console.log(numColors + " Colors = " + colorBuffer[0]);

		vboCacheKey.colVboDataArray = colorBuffer;
	}

	// VBO(TextureCoord Buffer) - u,v
	var hasTexCoords = stream.readUint8();
	if (hasTexCoords)
	{
		var dataType = stream.readUint16();
		var numCoords = stream.readUint32();
		var coordBuffer = stream.readFloat32Array(numCoords * 2);
		// console.log(numCoords + " Coords = " + coordBuffer[0]);

		vboCacheKey.tcoordVboDataArray = coordBuffer;
	}

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};

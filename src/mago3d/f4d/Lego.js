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

/*
Lego.prototype.parseArrayBuffer = function(gl, readWriter, dataArraybuffer, bytesReaded) 
{
	if (this.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) 
	{
		// file loaded.***
		this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

		// 1rst, read bbox.***
		var bbox = new BoundingBox();
		bbox.minX = new Float32Array(dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.minY = new Float32Array(dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.minZ = new Float32Array(dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

		bbox.maxX = new Float32Array(dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.maxY = new Float32Array(dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.maxZ = new Float32Array(dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

		var vbo_vi_cacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();

		// 1) Positions.************************************************************************************************
		var vertexCount = readWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var verticesFloatValuesCount = vertexCount * 3;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + 4 * verticesFloatValuesCount;
		vbo_vi_cacheKey.posVboDataArray = new Float32Array(dataArraybuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.***

		vbo_vi_cacheKey.vertexCount = vertexCount;

		// 2) Normals.*****************************************************************************************************
		var hasNormals = readWriter.readUInt8(dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if (hasNormals) 
		{
			vertexCount = readWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var normalsByteValuesCount = vertexCount * 3;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 1 * normalsByteValuesCount;
			vbo_vi_cacheKey.norVboDataArray = new Int8Array(dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1 * normalsByteValuesCount; // updating data.***
		}

		// 3) Colors.*******************************************************************************************************
		var hasColors = readWriter.readUInt8(dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if (hasColors) 
		{
			vertexCount = readWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var colorsByteValuesCount = vertexCount * 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1 * colorsByteValuesCount;
			vbo_vi_cacheKey.colVboDataArray = new Uint8Array(dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1 * colorsByteValuesCount; // updating data.***
		}

		// 4) TexCoord.****************************************************************************************************
		var hasTexCoords = readWriter.readUInt8(dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if (hasTexCoords)
		{
			var dataType = readWriter.readUInt16(dataArraybuffer, bytesReaded, bytesReaded+2); bytesReaded += 2;
			vertexCount = readWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var texcoordsValuesCount = vertexCount * 2;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 4 * texcoordsValuesCount;
			vbo_vi_cacheKey.tcoordVboDataArray = new Float32Array(dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 4 * texcoordsValuesCount; // updating data.***
		}

		this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	}

	return bytesReaded;
};
*/

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
	//console.log(numPositions + " Positions = " + positionBuffer);

	vboCacheKey.vertexCount = numPositions;
	vboCacheKey.posVboDataArray = positionBuffer;

	// VBO(Normal Buffer) - i,j,k
	var hasNormals = stream.readUint8();
	if (hasNormals) 
	{
		var numNormals = stream.readUint32();
		var normalBuffer = stream.readInt8Array(numNormals * 3);
		//console.log(numNormals + " Normals = " + normalBuffer);

		vboCacheKey.norVboDataArray = normalBuffer;
	}

	// VBO(Color Buffer) - r,g,b,a
	var hasColors = stream.readUint8();
	if (hasColors)
	{
		var numColors = stream.readUint32();
		var colorBuffer = stream.readUint8Array(numColors * 4);
		//console.log(numColors + " Colors = " + colorBuffer);

		vboCacheKey.colVboDataArray = colorBuffer;
	}

	// VBO(TextureCoord Buffer) - u,v
	var hasTexCoords = stream.readUint8();
	if (hasTexCoords)
	{
		var dataType = stream.readUint16();
		var numCoords = stream.readUint32();
		var coordBuffer = stream.readFloat32Array(numCoords * 2);
		//console.log(numCoords + " Coords = " + coordBuffer);

		vboCacheKey.tcoordVboDataArray = coordBuffer;
	}

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};

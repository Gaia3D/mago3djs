'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Lego
 */
var Lego = function() {
	if(!(this instanceof Lego)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	//this.dataArraybuffer; // binary data.***
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArrayBuffer;
	this.selColor4;
};

Lego.prototype.parseArrayBuffer = function(gl, readWriter, dataArraybuffer, bytesReaded) {
	if(this.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
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
		if(hasNormals) {
			vertexCount = readWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var normalsByteValuesCount = vertexCount * 3;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 1 * normalsByteValuesCount;
			vbo_vi_cacheKey.norVboDataArray = new Int8Array(dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1 * normalsByteValuesCount; // updating data.***
		}

		// 3) Colors.*******************************************************************************************************
		var hasColors = readWriter.readUInt8(dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasColors) {
			vertexCount = readWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var colorsByteValuesCount = vertexCount * 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1 * colorsByteValuesCount;
			vbo_vi_cacheKey.colVboDataArray = new Uint8Array(dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1 * colorsByteValuesCount; // updating data.***
		}

		// 4) TexCoord.****************************************************************************************************
		readWriter.readUInt8(dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;

		this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	}

	return bytesReaded;
};

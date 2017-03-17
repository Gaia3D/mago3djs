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
};

Lego.prototype.parseArrayBuffer = function(gl, f4dReadWriter, dataArraybuffer, bytesReaded) {
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
		var vertexCount = f4dReadWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var verticesFloatValues_count = vertexCount * 3;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + 4*verticesFloatValues_count;
		vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(dataArraybuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + 4*verticesFloatValues_count; // updating data.***
		
		vbo_vi_cacheKey.vertexCount = vertexCount;
		
		// 2) Normals.*****************************************************************************************************
		var hasNormals = f4dReadWriter.readUInt8(dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasNormals) {
			vertexCount = f4dReadWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var normalsByteValues_count = vertexCount * 3;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 1*normalsByteValues_count;
			vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1*normalsByteValues_count; // updating data.***
		}
		
		// 3) Colors.*******************************************************************************************************
		var hasColors = f4dReadWriter.readUInt8(dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasColors) {
			vertexCount = f4dReadWriter.readUInt32(dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var colorsByteValues_count = vertexCount * 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1*colorsByteValues_count;
			vbo_vi_cacheKey.col_vboDataArray = new Uint8Array(dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1*colorsByteValues_count; // updating data.***
		}
		
		// 4) TexCoord.****************************************************************************************************
		var hasTexCoord = f4dReadWriter.readUInt8(dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		// TODO:
//		if(hasTexCoord) {
//		}
		
		this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	}
	
	return bytesReaded;
};
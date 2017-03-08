'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var Block = function() {
	if(!(this instanceof Block)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// This has "VertexIdxVBOArraysContainer" because the "indices" cannot to be greater than 65000, because indices are short type.***
	this.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer(); // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".***
	this.mIFCEntityType = -1;
	this.isSmallObj = false;
	this.radius = 10;  
	this.vertex_count = 0; // only for test.*** delete this.***
	
	this.lego; // legoBlock.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
var BlocksList = function() {
	if(!(this instanceof BlocksList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.name = "";
	this.blocksArray;
	// 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***
	this.fileLoadState = 0;
	this.dataArraybuffer; // file loaded data, that is no parsed yet.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns block
 */
BlocksList.prototype.newBlock = function() {
	if(this.blocksArray == undefined) this.blocksArray = [];
	
	var block = new Block();
	this.blocksArray.push(block);
	return block;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.getBlock = function(idx) {
	if(this.blocksArray == undefined) return null;
	
	var block = null;
	if(idx >= 0 && idx <this.blocksArray.length) {
		return this.blocksArray[idx];
	}
	return block;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.parseArrayBuffer = function(gl, arrayBuffer, readWriter) {
	this.fileLoadState = 3;// 3 = parsing started.***
	var bytesReaded = 0;
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); 
	bytesReaded += 4;
	
	for(var i=0; i<blocksCount; i++) {
		var block = this.newBlock();
		  
		// 1rst, read bbox.***
		var bbox = new BoundingBox();
		bbox.minX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.minY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.minZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		  
		bbox.maxX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.maxY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.maxZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		
		var maxLength = bbox.getMaxLength();
		if(maxLength < 1.0) block.isSmallObj = true;
		else block.isSmallObj = false;
		
		block.radius = maxLength/2.0;
		
		// New for read multiple vbo datas (indices cannot superate 65535 value).***
		var vboDatasCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
		bytesReaded += 4;
		for(var j=0; j<vboDatasCount; j++) {
		
			// 1) Positions array.***************************************************************************************
			var vertex_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			var verticesFloatValues_count = vertex_count * 3;
			
			block.vertex_count = vertex_count;

			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 4*verticesFloatValues_count;

			var vbo_vi_cacheKey = block.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
			vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
			
			/*
			vbo_vi_cacheKey.MESH_VERTEX_cacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_VERTEX_cacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
			  */
			bytesReaded = bytesReaded + 4*verticesFloatValues_count; // updating data.***
			 
			// 2) Normals.************************************************************************************************
			vertex_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			var normalByteValues_count = vertex_count * 3;
			//Test.***********************
			//for(var j=0; j<normalByteValues_count; j++)
			//{
			//	var value_x = readWriter.readInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
			//}
			startBuff = bytesReaded;
			endBuff = bytesReaded + 1*normalByteValues_count;
			
			vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
			/*
			vbo_vi_cacheKey.MESH_NORMAL_cacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_NORMAL_cacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, new Int8Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
			  */
			bytesReaded = bytesReaded + 1*normalByteValues_count; // updating data.***
			
			// 3) Indices.*************************************************************************************************
			var shortIndicesValues_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 2*shortIndicesValues_count;
			  
			vbo_vi_cacheKey.idx_vboDataArray = new Int16Array(arrayBuffer.slice(startBuff, endBuff));
			/*
			vbo_vi_cacheKey.MESH_FACES_cacheKey= gl.createBuffer ();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_vi_cacheKey.MESH_FACES_cacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
			 */ 
			bytesReaded = bytesReaded + 2*shortIndicesValues_count; // updating data.***
			vbo_vi_cacheKey.indices_count = shortIndicesValues_count;  
		}
	}
	this.fileLoadState = 4; // 4 = parsing finished.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.parseArrayBufferAsimetricVersion = function(gl, arrayBuffer, readWriter) {
	this.fileLoadState = 3;// 3 = parsing started.***
	var bytesReaded = 0;
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); 
	bytesReaded += 4;
	
	for(var i=0; i<blocksCount; i++) {
		var block = this.newBlock();
		  
		// 1rst, read bbox.***
		var bbox = new BoundingBox();
		bbox.minX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.minY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.minZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		  
		bbox.maxX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.maxY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.maxZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		
		var maxLength = bbox.getMaxLength();
		if(maxLength < 1.0) block.isSmallObj = true;
		else block.isSmallObj = false;
		
		block.radius = maxLength/2.0;
		
		// New for read multiple vbo datas (indices cannot superate 65535 value).***
		var vboDatasCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
		bytesReaded += 4;
		for(var j=0; j<vboDatasCount; j++) {
		
			// 1) Positions array.***************************************************************************************
			var vertex_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			var verticesFloatValues_count = vertex_count * 3;
			
			block.vertex_count = vertex_count;

			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 4*verticesFloatValues_count;

			var vbo_vi_cacheKey = block.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
			vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
			
			/*
			vbo_vi_cacheKey.MESH_VERTEX_cacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_VERTEX_cacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
			  */
			bytesReaded = bytesReaded + 4*verticesFloatValues_count; // updating data.***
			 
			// 2) Normals.************************************************************************************************
			vertex_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			var normalByteValues_count = vertex_count * 3;
			//Test.***********************
			//for(var j=0; j<normalByteValues_count; j++)
			//{
			//	var value_x = readWriter.readInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
			//}
			startBuff = bytesReaded;
			endBuff = bytesReaded + 1*normalByteValues_count;
			
			vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
			/*
			vbo_vi_cacheKey.MESH_NORMAL_cacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_NORMAL_cacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, new Int8Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
			  */
			bytesReaded = bytesReaded + 1*normalByteValues_count; // updating data.***
			
			// 3) Indices.*************************************************************************************************
			var shortIndicesValues_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 2*shortIndicesValues_count;
			  
			vbo_vi_cacheKey.idx_vboDataArray = new Int16Array(arrayBuffer.slice(startBuff, endBuff));
			/*
			vbo_vi_cacheKey.MESH_FACES_cacheKey= gl.createBuffer ();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_vi_cacheKey.MESH_FACES_cacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
			 */ 
			bytesReaded = bytesReaded + 2*shortIndicesValues_count; // updating data.***
			vbo_vi_cacheKey.indices_count = shortIndicesValues_count;  
		}
		
		// in asimetricVersion must load the block's lego.***
		if(block.lego == undefined)
			block.lego = new Lego();
		
		block.lego.fileLoadState = 2; // data is loaded with the blockModel.***
		bytesReaded = block.lego.parseArrayBuffer(gl, readWriter, arrayBuffer, bytesReaded);
		
		// test.
		block.lego = null;
	}
	this.fileLoadState = 4; // 4 = parsing finished.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
var BlocksListsContainer = function() {
	if(!(this instanceof BlocksListsContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.blocksListsArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blocksList_name 변수
 * @returns blocksList
 */
BlocksListsContainer.prototype.newBlocksList = function(blocksList_name) {
	var blocksList = new BlocksList();
	blocksList.name = blocksList_name;
	this.blocksListsArray.push(blocksList);
	return blocksList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blockList_name 변수
 * @returns blocksList
 */
BlocksListsContainer.prototype.getBlockList = function(blockList_name) {
	var blocksListsCount = this.blocksListsArray.length;
  	var found = false;
  	var i=0;
  	var blocksList = null;
  	while(!found && i<blocksListsCount) {
  		var currentBlocksList = this.blocksListsArray[i];
  		if(currentBlocksList.name == blockList_name) {
  			found = true;
  			blocksList = currentBlocksList;
  		}
  		i++;
  	}
  	return blocksList;
};

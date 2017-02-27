'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var Block = function() {
	if(!(this instanceof Block)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// This has "VertexIdxVBOArraysContainer" because the "indices" cannot to be greater than 65000, because indices are short type.***
	this._vbo_VertexIdx_CacheKeys_Container = new VBOVertexIdxCacheKeysContainer(); // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".***
	this.mIFCEntityType = -1;
	this.isSmallObj = false;
	  
	this.vertex_count = 0; // only for test.*** delete this.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
var BlocksList = function() {
	if(!(this instanceof BlocksList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this._name = "";
	this._blocksArray;
	this.fileLoadState = 0; // 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***
	this.dataArraybuffer; // file loaded data, that is no parsed yet.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns block
 */
BlocksList.prototype.newBlock = function() {
	if(this._blocksArray == undefined)
		this._blocksArray = [];
	
	var block = new Block();
	this._blocksArray.push(block);
	return block;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.getBlock = function(idx) {
	if(this._blocksArray == undefined)
		return null;
	
	var block = null;
	  
	if(idx >= 0 && idx <this._blocksArray.length) {
		block = this._blocksArray[idx];
	}
	return block;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.parseArrayBuffer = function(GL, arrayBuffer, f4dReadWriter) {
	this.fileLoadState = 3;// 3 = parsing started.***
	var bytes_readed = 0;
	var blocks_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	for(var i=0; i<blocks_count; i++)
	{
		var block = this.newBlock();
		  
		  
		// 1rst, read bbox.***
		var bbox = new BoundingBox();
		bbox._minX = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
		bbox._minY = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
		bbox._minZ = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
		  
		bbox._maxX = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
		bbox._maxY = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
		bbox._maxZ = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
		
		var maxLength = bbox.getMaxLength();
		if(maxLength < 1.0)
			block.isSmallObj = true;
		else
			block.isSmallObj = false;
		
		// New for read multiple vbo datas (indices cannot superate 65535 value).***
		var vboDatasCount = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<vboDatasCount; j++)
		{
		
			// 1) Positions array.***************************************************************************************
			var vertex_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			var verticesFloatValues_count = vertex_count * 3;
			
			block.vertex_count = vertex_count;

			var startBuff = bytes_readed;
			var endBuff = bytes_readed + 4*verticesFloatValues_count;

			var vbo_vi_cacheKey = block._vbo_VertexIdx_CacheKeys_Container.newVBOVertexIdxCacheKey();
			vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
			
			/*
			vbo_vi_cacheKey.MESH_VERTEX_cacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_VERTEX_cacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
			  */
			bytes_readed = bytes_readed + 4*verticesFloatValues_count; // updating data.***
			 
			// 2) Normals.************************************************************************************************
			vertex_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			var normalByteValues_count = vertex_count * 3;
			//Test.***********************
			//for(var j=0; j<normalByteValues_count; j++)
			//{
			//	var value_x = f4dReadWriter.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			//}
			startBuff = bytes_readed;
			endBuff = bytes_readed + 1*normalByteValues_count;
			
			vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
			/*
			vbo_vi_cacheKey.MESH_NORMAL_cacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_NORMAL_cacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, new Int8Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
			  */
			bytes_readed = bytes_readed + 1*normalByteValues_count; // updating data.***
			
			// 3) Indices.*************************************************************************************************
			var shortIndicesValues_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			startBuff = bytes_readed;
			endBuff = bytes_readed + 2*shortIndicesValues_count;
			  
			vbo_vi_cacheKey.idx_vboDataArray = new Int16Array(arrayBuffer.slice(startBuff, endBuff));
			/*
			vbo_vi_cacheKey.MESH_FACES_cacheKey= GL.createBuffer ();
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, vbo_vi_cacheKey.MESH_FACES_cacheKey);
			GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
			 */ 
			bytes_readed = bytes_readed + 2*shortIndicesValues_count; // updating data.***
			vbo_vi_cacheKey.indices_count = shortIndicesValues_count;  
			
		}
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
	this._BlocksListsArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blocksList_name 변수
 * @returns f4d_blocksList
 */
BlocksListsContainer.prototype.newBlocksList = function(blocksList_name) {
	var f4d_blocksList = new BlocksList();
	f4d_blocksList._name = blocksList_name;
	this._BlocksListsArray.push(f4d_blocksList);
	return f4d_blocksList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blockList_name 변수
 * @returns blocksList
 */
BlocksListsContainer.prototype.getBlockList = function(blockList_name) {
	var blocksLists_count = this._BlocksListsArray.length;
  	var found = false;
  	var i=0;
  	var blocksList = null;
  	while(!found && i<blocksLists_count)
  	{
  		var current_blocksList = this._BlocksListsArray[i];
  		if(current_blocksList._name == blockList_name)
  		{
  			found = true;
  			blocksList =current_blocksList;
  		}
  		i++;
  	}
  	return blocksList;
};

'use strict';

/**
 * 블럭 모델
 * @class Block
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
 * 블럭이 가지는 데이터 삭제
 * @returns block
 */
Block.prototype.deleteObjects = function(gl) {

	this.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl);
	this.vBOVertexIdxCacheKeysContainer = undefined;
	this.mIFCEntityType = undefined;
	this.isSmallObj = undefined;
	this.radius = undefined;  
	this.vertex_count = undefined; // only for test.*** delete this.***
	
	if(this.lego) this.lego.deleteGlObjects(gl);
	
	this.lego = undefined;
};

/**
 * 블록 목록
 * @class BlocksList
 */
var BlocksList = function() {
	if(!(this instanceof BlocksList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.name = "";
	this.blocksArray;
	// 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArraybuffer; // file loaded data, that is no parsed yet.***
};

/**
 * 새 블록 생성
 * @returns block
 */
BlocksList.prototype.newBlock = function() {
	if(this.blocksArray == undefined) this.blocksArray = [];
	
	var block = new Block();
	this.blocksArray.push(block);
	return block;
};

/**
 * 블록 획득
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.getBlock = function(idx) {
	if(this.blocksArray == undefined) return null;
	
	if(idx >= 0 && idx <this.blocksArray.length) {
		return this.blocksArray[idx];
	}
	return null;
};

/**
 * 블록을 삭제
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.deleteGlObjects = function(gl) {
	if(this.blocksArray == undefined) return;
	
	for(var i=0, blocksCount = this.blocksArray.length; i<blocksCount; i++) {
		var block = this.blocksArray[i];
		block.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl);
		block.vBOVertexIdxCacheKeysContainer = undefined; // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".***
		block.mIFCEntityType = undefined;
		block.isSmallObj = undefined;
		block.radius = undefined;  
		block.vertex_count = undefined; // only for test.*** delete this.***
		if(block.lego) {
			block.lego.vbo_vicks_container.deleteGlObjects(gl);
			block.lego.vbo_vicks_container = undefined;
		}
		block.lego = undefined; // legoBlock.***
		this.blocksArray[i] = undefined;
	}
	this.blocksArray = undefined;
	this.name = undefined;
	this.fileLoadState = undefined;
	this.dataArraybuffer = undefined; // file loaded data, that is no parsed yet.***
};

/**
 * 블록리스트 버퍼를 파싱
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.parseArrayBuffer = function(gl, arrayBuffer, readWriter) {
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
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
			vbo_vi_cacheKey.indicesCount = shortIndicesValues_count;  
			
			// TEST.***
			//****************************************************************************************************AAA
			/*
			this.vbo_vi_cacheKey_aux = vbo_vi_cacheKey;
			if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined)
			{
				this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.pos_vboDataArray, gl.STATIC_DRAW);
				//this.vbo_vi_cacheKey_aux.pos_vboDataArray = undefined;
				this.vbo_vi_cacheKey_aux.pos_vboDataArray = null;
				
			}
			
			if(this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined)
			{
				this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.nor_vboDataArray, gl.STATIC_DRAW);
				//this.vbo_vi_cacheKey_aux.nor_vboDataArray = undefined;
				this.vbo_vi_cacheKey_aux.nor_vboDataArray = null;
					
			}
			
			if(this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
			{
				this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idx_vboDataArray, gl.STATIC_DRAW);
				//this.vbo_vi_cacheKey_aux.idx_vboDataArray = undefined;
				this.vbo_vi_cacheKey_aux.idx_vboDataArray = null;
					
			}
			*/
		}
	}
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.parseArrayBufferAsimetricVersion = function(gl, arrayBuffer, readWriter, motherBlocksArray) {
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); 
	bytesReaded += 4;
	
	for(var i=0; i<blocksCount; i++) {
		//var block = this.newBlock(); // old.***
		var block = new Block();
		var blockIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
		bytesReaded += 4;
		block.idx = blockIdx;
		
		// check if block exist.***
		if(motherBlocksArray[blockIdx]) {
			bytesReaded += 4*6; // boundingBox.***
			// New for read multiple vbo datas (indices cannot superate 65535 value).***
			var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			for(var j=0; j<vboDatasCount; j++) {
				// 1) Positions array.***************************************************************************************
				var vertex_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
				bytesReaded += 4;
				var verticesFloatValues_count = vertex_count * 3;
				
				block.vertex_count = vertex_count;

				var startBuff = bytesReaded;
				var endBuff = bytesReaded + 4*verticesFloatValues_count;
				bytesReaded = bytesReaded + 4*verticesFloatValues_count; // updating data.***
				 
				// 2) Normals.************************************************************************************************
				vertex_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
				bytesReaded += 4;
				var normalByteValues_count = vertex_count * 3;
				bytesReaded = bytesReaded + 1*normalByteValues_count; // updating data.***
				
				// 3) Indices.*************************************************************************************************
				var shortIndicesValues_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
				bytesReaded += 4;
				var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1);
				bytesReaded += 1;
				bytesReaded = bytesReaded + sizeLevels * 4;
				bytesReaded = bytesReaded + sizeLevels * 2;
				/* khj(20170331)
				var bigTrianglesShortIndicesValues_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
				bytesReaded += 4;
				*/
				bytesReaded = bytesReaded + 2*shortIndicesValues_count; // updating data.*** 
			}
			
			// in asimetricVersion must load the block's lego.***
			/* khj(20170331)
			if(block.lego == undefined) block.lego = new Lego();
			
			block.lego.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			bytesReaded = block.lego.parseArrayBuffer(gl, readWriter, arrayBuffer, bytesReaded);
			
			// provisionally delete lego.***
			block.lego.vbo_vicks_container.deleteGlObjects(gl);
			block.lego.vbo_vicks_container = undefined;
			block.lego = undefined;
			*/
			
			continue;
		}
		motherBlocksArray[blockIdx] = block;
		 
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
		if(maxLength < 0.9) block.isSmallObj = true;
		else block.isSmallObj = false;
		
		block.radius = maxLength/2.0;
		
		bbox.deleteObjects();
		bbox = undefined;
		
		// New for read multiple vbo datas (indices cannot superate 65535 value).***
		var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
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
			var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1);
			bytesReaded +=1;
			var sizeThresholds = [];
			for(var k = 0; k < sizeLevels; k++)
			{
				sizeThresholds.push(new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)));
				bytesReaded += 4;
			}
			var indexMarkers = [];
			for(var k = 0; k < sizeLevels; k++)
			{
				indexMarkers.push(readWriter.readUInt16(arrayBuffer, bytesReaded, bytesReaded+2));
				bytesReaded += 2;
			}
			var bigTrianglesShortIndicesValues_count = indexMarkers[sizeLevels-1];
			/* khj(20170331)
			var bigTrianglesShortIndicesValues_count = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			*/
			vbo_vi_cacheKey.bigTrianglesIndicesCount = bigTrianglesShortIndicesValues_count;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 2*shortIndicesValues_count;
			  
			vbo_vi_cacheKey.idx_vboDataArray = new Int16Array(arrayBuffer.slice(startBuff, endBuff));
			/*
			vbo_vi_cacheKey.MESH_FACES_cacheKey= gl.createBuffer ();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_vi_cacheKey.MESH_FACES_cacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
			 */ 
			bytesReaded = bytesReaded + 2*shortIndicesValues_count; // updating data.***
			vbo_vi_cacheKey.indicesCount = shortIndicesValues_count;  
		}
		
		// in asimetricVersion must load the block's lego.***
		/* khj(20170331)
		if(block.lego == undefined) block.lego = new Lego();
		
		block.lego.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		bytesReaded = block.lego.parseArrayBuffer(gl, readWriter, arrayBuffer, bytesReaded);
		
		// provisionally delete lego.***
		block.lego.vbo_vicks_container.deleteGlObjects(gl);
		block.lego.vbo_vicks_container = undefined;
		block.lego = undefined;
		*/
	}
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};

/**
 * 블록 컨테이너
 * @class BlocksListsContainer
 */
var BlocksListsContainer = function() {
	if(!(this instanceof BlocksListsContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.blocksListsArray = [];
};

/**
 * 새 블록 리스트를 생성
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
 * 블록 리스트 획득
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
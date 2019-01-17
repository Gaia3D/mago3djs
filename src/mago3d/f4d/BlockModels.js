'use strict';

/**
 * 블럭 모델
 * @class Block
 */
var Block = function() 
{
	if (!(this instanceof Block)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// This has "VertexIdxVBOArraysContainer" because the "indices" cannot to be greater than 65000, because indices are short type.***
	this.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer(); // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".***
	this.mIFCEntityType = -1;
	this.isSmallObj = false;
	this.radius = 10;
	this.vertexCount = 0; // only for test.*** delete this.***

	this.lego; // legoBlock.***
};

/**
 * 블럭이 가지는 데이터 삭제
 * @returns block
 */
Block.prototype.deleteObjects = function(gl, vboMemManager) 
{

	this.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl, vboMemManager);
	this.vBOVertexIdxCacheKeysContainer = undefined;
	this.mIFCEntityType = undefined;
	this.isSmallObj = undefined;
	this.radius = undefined;
	this.vertexCount = undefined; // only for test.*** delete this.***

	if (this.lego) { this.lego.deleteGlObjects(gl); }

	this.lego = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param 
  * @returns {boolean} returns if the Block is ready to render.
 */
Block.prototype.isReadyToRender = function(neoReference, magoManager, maxSizeToRender) 
{
	if (maxSizeToRender && (this.radius < maxSizeToRender))
	{ return false; }
	
	if (magoManager.isCameraMoving && this.radius < magoManager.smallObjectSize && magoManager.objectSelected !== neoReference)
	{ return false; }

	return true;
};
//****************************************************************************************************
//****************************************************************************************************

/**
 * 블록 목록
 * @class BlocksList
 */
var BlocksList = function() 
{
	if (!(this instanceof BlocksList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.name = "";
	this.blocksArray;
	// 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArraybuffer; // file loaded data, that is no parsed yet.***
	this.xhr; // file request.***
};

/**
 * 새 블록 생성
 * @returns block
 */
BlocksList.prototype.newBlock = function() 
{
	if (this.blocksArray === undefined) { this.blocksArray = []; }

	var block = new Block();
	this.blocksArray.push(block);
	return block;
};

/**
 * 블록 획득
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.getBlock = function(idx) 
{
	if (this.blocksArray === undefined) { return null; }

	if (idx >= 0 && idx < this.blocksArray.length) 
	{
		return this.blocksArray[idx];
	}
	return null;
};

/**
 * 블록을 삭제
 * @param idx 변수
 * @returns block
 */
BlocksList.prototype.deleteGlObjects = function(gl, vboMemManager) 
{
	if(this.xhr !== undefined)
	{
		this.xhr.abort();
		this.xhr = undefined;
	}
	
	if (this.blocksArray === undefined) { return; }

	for (var i = 0, blocksCount = this.blocksArray.length; i < blocksCount; i++ ) 
	{
		var block = this.blocksArray[i];
		block.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl, vboMemManager);
		block.vBOVertexIdxCacheKeysContainer = undefined; // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".***
		block.mIFCEntityType = undefined;
		block.isSmallObj = undefined;
		block.radius = undefined;
		block.vertexCount = undefined; // only for test.*** delete this.***
		if (block.lego) 
		{
			block.lego.vbo_vicks_container.deleteGlObjects(gl, vboMemManager);
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
 * 블록리스트 버퍼를 파싱(비대칭적)
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {arrayBuffer} arrayBuffer Binary data to parse.
 * @param {ReadWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array} motherBlocksArray Global blocks array.
 */
BlocksList.prototype.stepOverBlockVersioned = function(arrayBuffer, bytesReaded, readWriter) 
{
	var vertexCount;
	var verticesFloatValuesCount;
	var normalByteValuesCount;
	var shortIndicesValuesCount;
	var sizeLevels;
	var startBuff, endBuff;
	
	var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	bytesReaded += 4;
	for ( var j = 0; j < vboDatasCount; j++ ) 
	{
		// 1) Positions array.
		vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		verticesFloatValuesCount = vertexCount * 3;
		startBuff = bytesReaded;
		endBuff = bytesReaded + 4 * verticesFloatValuesCount;
		bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.***

		// 2) Normals.
		vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		normalByteValuesCount = vertexCount * 3;
		bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.***

		// 3) Indices.
		shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1);bytesReaded += 1;
		bytesReaded = bytesReaded + sizeLevels * 4;
		bytesReaded = bytesReaded + sizeLevels * 4;
		bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.***
	}
	
	return bytesReaded;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {arrayBuffer} arrayBuffer Binary data to parse.
 * @param {ReadWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array} motherBlocksArray Global blocks array.
 */
BlocksList.prototype.parseBlockVersioned = function(arrayBuffer, bytesReaded, block, readWriter, magoManager) 
{
	var posByteSize;
	var norByteSize;
	var idxByteSize;
	var classifiedPosByteSize;
	var classifiedNorByteSize;
	var classifiedIdxByteSize;
	var startBuff, endBuff;
	var vboMemManager = magoManager.vboMemoryManager;
	
	var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	// test.***
	if (vboDatasCount > 12)
	{ var hola = 0; }
	
	for ( var j = 0; j < vboDatasCount; j++ ) 
	{
		// 1) Positions array.
		var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		
		if (vertexCount > 200000)
		{ var hola = 0; }
		
		var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
		
		var verticesFloatValuesCount = vertexCount * 3;
		block.vertexCount = vertexCount;
		startBuff = bytesReaded;
		endBuff = bytesReaded + 4 * verticesFloatValuesCount;
		var posDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
		vboViCacheKey.setDataArrayPos(posDataArray, vboMemManager);

		bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.***
		
		// 2) Normals.
		vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var normalByteValuesCount = vertexCount * 3;
		startBuff = bytesReaded;
		endBuff = bytesReaded + 1 * normalByteValuesCount;
		var norDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
		vboViCacheKey.setDataArrayNor(norDataArray, vboMemManager);

		bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.***
		
		// 3) Indices.
		var shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		idxByteSize = shortIndicesValuesCount;
		classifiedIdxByteSize = vboMemManager.getClassifiedBufferSize(idxByteSize);

		var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded +=1;
		var sizeThresholds = [];
		for ( var k = 0; k < sizeLevels; k++ )
		{
			sizeThresholds.push(new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))); bytesReaded += 4;
		}
		var indexMarkers = [];
		for ( var k = 0; k < sizeLevels; k++ )
		{
			indexMarkers.push(readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4)); bytesReaded += 4;
		}
		var bigTrianglesShortIndicesValues_count = indexMarkers[sizeLevels-1];
		vboViCacheKey.bigTrianglesIndicesCount = bigTrianglesShortIndicesValues_count;
		startBuff = bytesReaded;
		endBuff = bytesReaded + 2 * shortIndicesValuesCount;
		var idxDataArray = new Uint16Array(arrayBuffer.slice(startBuff, endBuff));
		vboViCacheKey.setDataArrayIdx(idxDataArray, vboMemManager);

		bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.***
	}
	
	return bytesReaded;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {arrayBuffer} arrayBuffer Binary data to parse.
 * @param {ReadWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array} motherBlocksArray Global blocks array.
 */
BlocksList.prototype.parseBlocksListVersioned = function(arrayBuffer, readWriter, motherBlocksArray, magoManager) 
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	var startBuff, endBuff;
	var posByteSize, norByteSize, idxByteSize;
	var vboMemManager = magoManager.vboMemoryManager;
	var classifiedPosByteSize = 0, classifiedNorByteSize = 0, classifiedIdxByteSize = 0;
	var gl = magoManager.sceneState.gl;
	var succesfullyGpuDataBinded = true;
	
	// read the version.
	var versionLength = 5;
	var version = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+versionLength)));
	bytesReaded += versionLength;
	
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
	for ( var i = 0; i< blocksCount; i++ ) 
	{
		var blockIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		
		// Check if block exist.
		if (motherBlocksArray[blockIdx]) 
		{
			// The block exists, then read data but no create a new block.
			bytesReaded += 4 * 6; // boundingBox.
			// step over vbo datas of the model.
			bytesReaded = this.stepOverBlockVersioned(arrayBuffer, bytesReaded, readWriter) ;
			
			// read lego if exist. (note: lego is exactly same of a model, is a mesh).
			var existLego = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
			if (existLego)
			{
				bytesReaded = this.stepOverBlockVersioned(arrayBuffer, bytesReaded, readWriter) ;
			}
			
			continue;
		}
		
		// The block doesn't exist, so creates a new block and read data.
		var block = new Block();
		block.idx = blockIdx;
		motherBlocksArray[blockIdx] = block;

		// 1rst, read bbox.
		var bbox = new BoundingBox();
		bbox.minX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.minY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.minZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

		bbox.maxX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.maxY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.maxZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

		var maxLength = bbox.getMaxLength();
		if (maxLength < 0.5) { block.isSmallObj = true; }
		else { block.isSmallObj = false; }

		block.radius = maxLength/2.0;

		//bbox.deleteObjects();
		//bbox = undefined;
		
		bytesReaded = this.parseBlockVersioned(arrayBuffer, bytesReaded, block, readWriter, magoManager) ;
		
		// now bind vbo buffer datas.
		var vboDatasCount = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
		for (var j=0; j<vboDatasCount; j++)
		{
			var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[j];
			
			if (!vboViCacheKey.isReadyPositions(gl, magoManager.vboMemoryManager))
			{ succesfullyGpuDataBinded = false; }
			if (!vboViCacheKey.isReadyNormals(gl, magoManager.vboMemoryManager))
			{ succesfullyGpuDataBinded = false; }
			if (!vboViCacheKey.isReadyFaces(gl, magoManager.vboMemoryManager))
			{ succesfullyGpuDataBinded = false; }
		}
		
		// parse lego if exist.
		var existLego = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if (existLego)
		{
			if (block.lego === undefined)
			{ 
				// TODO : this is no used. delete this.***
				block.lego = new Lego(); 
			}
			
			bytesReaded = this.parseBlockVersioned(arrayBuffer, bytesReaded, block.lego, readWriter, magoManager) ;
		}

	}
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	return succesfullyGpuDataBinded;
};


/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {arrayBuffer} arrayBuffer Binary data to parse.
 * @param {ReadWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array} motherBlocksArray Global blocks array.
 */
BlocksList.prototype.parseBlocksList = function(arrayBuffer, readWriter, motherBlocksArray, magoManager) 
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
	
	var startBuff, endBuff;
	var posByteSize, norByteSize, idxByteSize;
	var vboMemManager = magoManager.vboMemoryManager;
	var classifiedPosByteSize = 0, classifiedNorByteSize = 0, classifiedIdxByteSize = 0;
	var gl = magoManager.sceneState.gl;
	var succesfullyGpuDataBinded = true;

	for ( var i = 0; i< blocksCount; i++ ) 
	{
		var blockIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		
		// Check if block exist.
		if (motherBlocksArray[blockIdx]) 
		{
			// The block exists, then read data but no create a new block.
			bytesReaded += 4 * 6; // boundingBox.
			// Read vbo datas (indices cannot superate 65535 value).
			var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			
			for ( var j = 0; j < vboDatasCount; j++ ) 
			{
				// 1) Positions array.
				var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var verticesFloatValuesCount = vertexCount * 3;
				startBuff = bytesReaded;
				endBuff = bytesReaded + 4 * verticesFloatValuesCount;
				bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.***

				// 2) Normals.
				vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var normalByteValuesCount = vertexCount * 3;
				bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.***

				// 3) Indices.
				var shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
				
				bytesReaded = bytesReaded + sizeLevels * 4;
				bytesReaded = bytesReaded + sizeLevels * 4;
				bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.***
			}
			// Pendent to load the block's lego.***
			continue;
		}
		
		// The block doesn't exist, so creates a new block and read data.
		var block = new Block();
		block.idx = blockIdx;
		motherBlocksArray[blockIdx] = block;
		
		// 1rst, read bbox.
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
		if (maxLength < 0.5) { block.isSmallObj = true; }
		else { block.isSmallObj = false; }

		block.radius = maxLength/2.0;

		bbox.deleteObjects();
		bbox = undefined;

		// New for read multiple vbo datas (indices cannot superate 65535 value).***
		var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
		bytesReaded += 4;
		for ( var j = 0; j < vboDatasCount; j++ ) 
		{
			// 1) Positions array.
			var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			var verticesFloatValuesCount = vertexCount * 3;
			var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
			
			block.vertexCount = vertexCount;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 4 * verticesFloatValuesCount;
			var posDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
			vboViCacheKey.setDataArrayPos(posDataArray, vboMemManager);

			bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.***
			
			// 2) Normals.
			vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
			var normalByteValuesCount = vertexCount * 3;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 1 * normalByteValuesCount;
			var norDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
			vboViCacheKey.setDataArrayNor(norDataArray, vboMemManager);
			
			bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.***
			
			// 3) Indices.
			var shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);

			bytesReaded += 4;
			var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1);
			bytesReaded +=1;
			var sizeThresholds = [];
			for ( var k = 0; k < sizeLevels; k++ )
			{
				sizeThresholds.push(new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)));
				bytesReaded += 4;
			}
			var indexMarkers = [];
			for ( var k = 0; k < sizeLevels; k++ )
			{
				indexMarkers.push(readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4));
				bytesReaded += 4;
			}
			var bigTrianglesShortIndicesValues_count = indexMarkers[sizeLevels-1];
			vboViCacheKey.bigTrianglesIndicesCount = bigTrianglesShortIndicesValues_count;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 2 * shortIndicesValuesCount;
			var idxDataArray = new Uint16Array(arrayBuffer.slice(startBuff, endBuff));
			vboViCacheKey.setDataArrayIdx(idxDataArray, vboMemManager);

			bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.***

			
			// test.
			if (!vboViCacheKey.isReadyPositions(gl, magoManager.vboMemoryManager))
			{ succesfullyGpuDataBinded = false; }
			if (!vboViCacheKey.isReadyNormals(gl, magoManager.vboMemoryManager))
			{ succesfullyGpuDataBinded = false; }
			if (!vboViCacheKey.isReadyFaces(gl, magoManager.vboMemoryManager))
			{ succesfullyGpuDataBinded = false; }
		}

		// Pendent to load the block's lego.***
	}
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	return succesfullyGpuDataBinded;
};

/**
 * 블록 컨테이너
 * @class BlocksListsContainer
 */
var BlocksListsContainer = function() 
{
	if (!(this instanceof BlocksListsContainer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.blocksListsArray = [];
};

/**
 * 새 블록 리스트를 생성
 * @param blocksListName 변수
 * @returns blocksList
 */
BlocksListsContainer.prototype.newBlocksList = function(blocksListName) 
{
	var blocksList = new BlocksList();
	blocksList.name = blocksListName;
	this.blocksListsArray.push(blocksList);
	return blocksList;
};

/**
 * 블록 리스트 획득
 * @param blockList_name 변수
 * @returns blocksList
 */
BlocksListsContainer.prototype.getBlockList = function(blockList_name) 
{
	var blocksListsCount = this.blocksListsArray.length;
	var found = false;
	var i=0;
	var blocksList = null;
	while (!found && i<blocksListsCount) 
	{
		var currentBlocksList = this.blocksListsArray[i];
		if (currentBlocksList.name === blockList_name) 
		{
			found = true;
			blocksList = currentBlocksList;
		}
		i++;
	}
	return blocksList;
};

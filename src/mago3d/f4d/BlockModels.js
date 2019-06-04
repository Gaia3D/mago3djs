'use strict';

/**
 * 블럭 모델
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class Block
 * 
 * 아래 문서의 1.3 Models Folder의 항목 참조
 * @link https://github.com/Gaia3D/F4DConverter/blob/master/doc/F4D_SpecificationV1.pdf
 */
var Block = function() 
{
	if (!(this instanceof Block)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * This has "VertexIdxVBOArraysContainer" because the "indices" cannot to be greater than 65000, because indices are short type.
	 * Change this for "vbo_VertexIdx_CacheKeys_Container__idx"
	 * @type {VBOVertexIdxCacheKeysContainer}
	 */
	this.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer();

	/**
	 * @deprecated
	 * @type {number}
	 * @default -1
	 */
	this.mIFCEntityType = -1;

	/**
	 * small object flag. 
	 * if bbox.getMaxLength() < 0.5, isSmallObj = true
	 * 
	 * @type {Boolean} 
	 * @default false
	 */
	this.isSmallObj = false;

	/**
	 * block radius
	 * 일반적으로 bbox.getMaxLength() / 2.0 로 선언됨.
	 * 
	 * @type {Boolean} 
	 * @default 10
	 */
	this.radius = 10;


	/**
	 * only for test.delete this.
	 * @deprecated
	 */
	this.vertexCount = 0;

	/**
	 * 각각의 사물중 복잡한 모델이 있을 경우 Lego로 처리
	 * 현재는 사용하지 않으나 추후에 필요할 수 있어서 그대로 둠.
	 * legoBlock.
	 * @type {Lego}
	 */
	this.lego;
};

/**
 * block 초기화. gl에서 해당 block 및 lego 삭제
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {VboManager} vboMemManager 
 */
Block.prototype.deleteObjects = function(gl, vboMemManager) 
{
	this.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl, vboMemManager);
	this.vBOVertexIdxCacheKeysContainer = undefined;
	this.mIFCEntityType = undefined;
	this.isSmallObj = undefined;
	this.radius = undefined;
	this.vertexCount = undefined; // only for test. delete this.

	if (this.lego) { this.lego.deleteGlObjects(gl); }

	this.lego = undefined;
};

/**
 * render할 준비가 됬는지 체크
 * @param {NeoReference} neoReference magoManager의 objectSelected와 비교 하기 위한 neoReference 객체
 * @param {MagoManager} magoManager 
 * @param {Number} maxSizeToRender block의 radius와 비교하기 위한 ref number.
 * @return {Boolean} block의 radius가 maxSizeToRender보다 크고, block의 radius가 magoManager의 보다 크고, 카메라가 움직이고 있지 않고, magoManager의 objectSelected와 neoReference가 같을 경우 true 반환
 */ 
Block.prototype.isReadyToRender = function(neoReference, magoManager, maxSizeToRender) 
{
	if (maxSizeToRender && (this.radius < maxSizeToRender))
	{ return false; }
	
	if (magoManager.isCameraMoving && this.radius < magoManager.smallObjectSize && magoManager.objectSelected !== neoReference)
	{ return false; }

	return true;
};

//*
//*

/**
 * 블록의 내용이 엄청 많아서 나눠서 받아야 할 경우 사용하기 위한 객체. 현재는 미구현 상태. 추후 f4d v0.0.2 이상부터 적용 될 예정
 * @deprecated
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class BlocksArrayPartition
 */
var BlocksArrayPartition = function(version) 
{
	if (!(this instanceof BlocksArrayPartition)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArraybuffer; // file loaded data, that is no parsed yet.

};

/**
 * 블록 리스트 객체
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class BlocksList
 * 
 * @param {String} version
 */
var BlocksList = function(version) 
{
	// This class is created in "Octree.prototype.prepareModelReferencesListData = function(magoManager) ".
	if (!(this instanceof BlocksList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * 블록 리스트 명
	 * @type {string}
	 * @default ''
	 */
	this.name = "";

	/**
	 * f4d 버전
	 * @type {string}
	 * @default ''
	 */
	this.version;

	/**
	 * 블락 리스트
	 * @type {Array.<Block>}
	 * @default ''
	 */
	this.blocksArray;
	// 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.

	/**
	 *  block file load state. Default is 0(READY)
	 * "READY"            : 0,
	 * "LOADING_STARTED"  : 1,
	 * "LOADING_FINISHED" : 2,
	 * "PARSE_STARTED"    : 3,
	 * "PARSE_FINISHED"   : 4,
	 * "IN_QUEUE"         : 5,
	 * "LOAD_FAILED"      : 6
	 * @type {Number}
	 */
	this.fileLoadState = CODE.fileLoadState.READY;

	/**
	 * block data array buffer.
	 * file loaded data, that is no parsed yet.
	 * @type {ArrayBuffer}
	 */
	this.dataArraybuffer;
	/**
	 * file request.
	 */
	this.xhr;
	
	if (version !== undefined)
	{ this.version = version; }
	

	/**
	 * BlocksArrayPartition 리스트 관련 변수들.
	 * f4d 버전 0.0.2 이후 부터 사용 계획있음 현재는 개발중
	 */
	this.blocksArrayPartitionsCount;
	this.blocksArrayPartitionsArray;
	this.blocksArrayPartitionsMasterPathName;
};

/**
 * 새 블록 생성 후 blocksArray에 푸쉬 및 반환
 * 
 * @returns {Block}
 */
BlocksList.prototype.newBlock = function() 
{
	if (this.blocksArray === undefined) { this.blocksArray = []; }

	var block = new Block();
	this.blocksArray.push(block);
	return block;
};

/**
 * 인덱스에 해당하는 블록 획득
 * @param {Number} idx
 * @returns {Block|null}
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
 * 블록 리스트 초기화. gl에서 해당 블록 리스트의 블록 및 lego 삭제
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {VboManager} vboMemManager 
 */
BlocksList.prototype.deleteGlObjects = function(gl, vboMemManager) 
{
	if (this.xhr !== undefined)
	{
		this.xhr.abort();
		this.xhr = undefined;
	}
	
	if (this.blocksArray === undefined) { return; }

	for (var i = 0, blocksCount = this.blocksArray.length; i < blocksCount; i++ ) 
	{
		var block = this.blocksArray[i];
		block.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl, vboMemManager);
		block.vBOVertexIdxCacheKeysContainer = undefined; // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".
		block.mIFCEntityType = undefined;
		block.isSmallObj = undefined;
		block.radius = undefined;
		block.vertexCount = undefined; // only for test. delete this.
		if (block.lego) 
		{
			block.lego.vbo_vicks_container.deleteGlObjects(gl, vboMemManager);
			block.lego.vbo_vicks_container = undefined;
		}
		block.lego = undefined; // legoBlock.
		this.blocksArray[i] = undefined;
	}
	this.blocksArray = undefined;
	this.name = undefined;
	this.fileLoadState = undefined;
	this.dataArraybuffer = undefined; // file loaded data, that is no parsed yet.
};

/**
 * 사용하지 않는 부분들 계산하기 위한 파싱과정. stepOver
 * 파싱을 위한 파싱..
 * 블록리스트 버퍼를 파싱(비대칭적)하는 과정.
 * F4D 버전이 0.0.1일 경우 사용
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {ArrayBuffer} arrayBuffer Binary data to parse.
 * @param {Number} bytesReaded readed bytes.
 * @param {ReaderWriter} readWriter Helper to read inside of the arrayBuffer.
 */
BlocksList.prototype.stepOverBlockVersioned = function(arrayBuffer, bytesReaded, readWriter) 
{
	var vertexCount;
	var verticesFloatValuesCount;
	var normalByteValuesCount;
	var shortIndicesValuesCount;
	var sizeLevels;
	var startBuff, endBuff;
	
	/**
	 * Spec document Table 3-1
	 * vboCount
	 */
	var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	bytesReaded += 4;
	for ( var j = 0; j < vboDatasCount; j++ ) 
	{
		// 1) Positions array.
		/**
		 * Spec document Table 3-2
		 * vertexCount
		 */
		vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		verticesFloatValuesCount = vertexCount * 3;
		startBuff = bytesReaded;
		endBuff = bytesReaded + 4 * verticesFloatValuesCount;
		bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.

		// 2) Normals.
		/**
		 * Spec document Table 3-2
		 * normalCount
		 */
		vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		normalByteValuesCount = vertexCount * 3;
		bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.

		// 3) Indices.
		/**
		 * Spec document Table 3-2
		 * indexCount
		 */
		shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1);bytesReaded += 1;
		bytesReaded = bytesReaded + sizeLevels * 4;
		bytesReaded = bytesReaded + sizeLevels * 4;
		bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.
	}
	
	return bytesReaded;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * vboData 파싱 부분
 * Spec document Table 3-1
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {ArrayBuffer} arrayBuffer Binary data to parse.
 * @param {Number} bytesReaded 지금까지 읽은 바이트 길이
 * @param {Block} block 정보를 담을 block.
 * @param {ReaderWriter} readWriter
 * @param {MagoManager} magoManager
 * 
 * @see VBOVertexIdxCacheKey#readPosNorIdx
 */
BlocksList.prototype.parseBlockVersioned = function(arrayBuffer, bytesReaded, block, readWriter, magoManager) 
{
	/*var posByteSize;
	var norByteSize;
	var idxByteSize;
	var classifiedPosByteSize;
	var classifiedNorByteSize;
	var classifiedIdxByteSize;
	var startBuff, endBuff;*/
	var vboMemManager = magoManager.vboMemoryManager;
	
	var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	
	for ( var j = 0; j < vboDatasCount; j++ ) 
	{
		var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
		bytesReaded = vboViCacheKey.readPosNorIdx(arrayBuffer, readWriter, vboMemManager, bytesReaded);
		block.vertexCount = vboViCacheKey.vertexCount;

	}
	
	return bytesReaded;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * F4D 버전이 0.0.1일 경우 사용
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {ArrayBuffer} arrayBuffer Binary data to parse.
 * @param {ReaderWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array.<Block>} motherBlocksArray Global blocks array.
 * @param {MagoManager} magoManager
 */
BlocksList.prototype.parseBlocksListVersioned_v001 = function(arrayBuffer, readWriter, motherBlocksArray, magoManager) 
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	/*var startBuff, endBuff;
	var vboMemManager = magoManager.vboMemoryManager;
	var posByteSize, norByteSize, idxByteSize;
	var classifiedPosByteSize = 0, classifiedNorByteSize = 0, classifiedIdxByteSize = 0;
	var gl = magoManager.sceneState.gl;*/
	var succesfullyGpuDataBinded = true;
	
	// read the version.
	var versionLength = 5;
	//var version = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+versionLength)));
	bytesReaded += versionLength;
	
	/**
	 * modelCount
	 */
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
	for ( var i = 0; i< blocksCount; i++ ) 
	{
		/**
		 * modelIndex
		 */
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
		
		// parse lego if exist.
		var existLego = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if (existLego)
		{
			if (block.lego === undefined)
			{ 
				// TODO : this is no used. delete this.
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
 * F4D 버전이 0.0.2일 경우 사용
 * 매개변수로 arrayBuffer 전달받지 않고 blocksArrayPartition에 있는 arrayBuffer를 이용.
 * 
 * @param {ReaderWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array.<Block>} motherBlocksArray Global blocks array.
 * @param {MagoManager} magoManager
 */
BlocksList.prototype.parseBlocksListVersioned_v002 = function(readWriter, motherBlocksArray, magoManager) 
{
	// 1rst, find the blocksArrayPartition to parse.
	var blocksArrayPartitionsCount = this.blocksArrayPartitionsArray.length;
	var blocksArrayPartition = this.blocksArrayPartitionsArray[blocksArrayPartitionsCount-1];
	if (blocksArrayPartition.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{ return; }
	
	var arrayBuffer = blocksArrayPartition.dataArraybuffer;
	blocksArrayPartition.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	var vboMemManager = magoManager.vboMemoryManager;
	/*var startBuff, endBuff;
	var posByteSize, norByteSize, idxByteSize;
	var classifiedPosByteSize = 0, classifiedNorByteSize = 0, classifiedIdxByteSize = 0;
	var gl = magoManager.sceneState.gl;*/
	var succesfullyGpuDataBinded = true;
	
	// read the version.
	//var versionLength = 5;
	//var version = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+versionLength)));
	//bytesReaded += versionLength;
	
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
	for ( var i = 0; i< blocksCount; i++ ) 
	{
		var blockIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var block;
		
		// Check if block exist.
		if (motherBlocksArray[blockIdx]) 
		{
			block = motherBlocksArray[blockIdx];
		}
		else 
		{
			// The block doesn't exist, so creates a new block and read data.
			block = new Block();
			block.idx = blockIdx;
			motherBlocksArray[blockIdx] = block;
		}
		
		// Now, read the blocks vbo's idx.
		var vboIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		
		if (vboIdx === 0)
		{
			// Only if the vboIdx = 0 -> read the bbox.
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
		}
		
		// check if the vbo exists.
		var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[vboIdx];
		if (vboViCacheKey === undefined)
		{
			// Now, read the vbo (Pos-Nor-Idx).
			vboViCacheKey = new VBOVertexIdxCacheKey();
			block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[vboIdx] = vboViCacheKey;
			bytesReaded = vboViCacheKey.readPosNorIdx(arrayBuffer, readWriter, vboMemManager, bytesReaded);
			block.vertexCount = vboViCacheKey.vertexCount;
		}
		else 
		{
			// step over.
			if (blocksCount > 1)
			{ bytesReaded = vboViCacheKey.stepOverPosNorIdx(arrayBuffer, readWriter, vboMemManager, bytesReaded); }
		}

		//bbox.deleteObjects();
		//bbox = undefined;
		
		//bytesReaded = this.parseBlockVersioned(arrayBuffer, bytesReaded, block, readWriter, magoManager) ;
		
		// parse lego if exist.
		//var existLego = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		//if (existLego)
		//{
		//	if (block.lego === undefined)
		//	{ 
		//		// TODO : this is no used. delete this.
		//		block.lego = new Lego(); 
		//	}
		//	
		//	bytesReaded = this.parseBlockVersioned(arrayBuffer, bytesReaded, block.lego, readWriter, magoManager) ;
		//}

	}
	blocksArrayPartition.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED; // test.
	return succesfullyGpuDataBinded;
};


/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * This function parses the geometry data from binary arrayBuffer.
 * @deprecated f4d 0.0.1 이전 버전에서 사용
 * 
 * @param {ArrayBuffer} arrayBuffer Binary data to parse.
 * @param {ReaderWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array.<Block>} motherBlocksArray Global blocks array.
 */
BlocksList.prototype.parseBlocksList = function(arrayBuffer, readWriter, motherBlocksArray, magoManager) 
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
	
	var vboMemManager = magoManager.vboMemoryManager;
	var startBuff, endBuff;
	/*var posByteSize, norByteSize, idxByteSize;
	var classifiedPosByteSize = 0, classifiedNorByteSize = 0, classifiedIdxByteSize = 0;
	var gl = magoManager.sceneState.gl;*/
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
				bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.

				// 2) Normals.
				vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var normalByteValuesCount = vertexCount * 3;
				bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.

				// 3) Indices.
				var shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
				
				bytesReaded = bytesReaded + sizeLevels * 4;
				bytesReaded = bytesReaded + sizeLevels * 4;
				bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.
			}
			// Pendent to load the block's lego.
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

		// New for read multiple vbo datas (indices cannot superate 65535 value).
		var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
		bytesReaded += 4;
		for ( var j = 0; j < vboDatasCount; j++ ) 
		{
			var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
			bytesReaded = vboViCacheKey.readPosNorIdx(arrayBuffer, readWriter, vboMemManager, bytesReaded);
			block.vertexCount = vboViCacheKey.vertexCount;
		}

		// Pendent to load the block's lego.
	}
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	return succesfullyGpuDataBinded;
};

/**
 * 블록리스트의 blocksArrayPartition정보를 할당 및 체크.
 * F4D 버전이 0.0.2일 경우 사용
 * 
 * @param {MagoManager} magoManager
 * @param {MagoManager} octreeOwner
 */
BlocksList.prototype.prepareData = function(magoManager, octreeOwner) 
{
	if (this.version === "0.0.1")
	{
		// Provisionally this function is into octree.prepareModelReferencesListData(...).
	}
	else if (this.version === "0.0.2")
	{
		// Check the current loading state.
		if (this.blocksArrayPartitionsArray === undefined)
		{ this.blocksArrayPartitionsArray = []; }
		
		var currPartitionsCount = this.blocksArrayPartitionsArray.length;
		if (currPartitionsCount === 0)
		{
			// Proceed to load the 1rst partition.
			var partitionIdx = 0;
			var filePathInServer = this.blocksArrayPartitionsMasterPathName + partitionIdx.toString();
			var blocksArrayPartition = new BlocksArrayPartition();
			this.blocksArrayPartitionsArray.push(blocksArrayPartition);
			magoManager.readerWriter.getNeoBlocksArraybuffer_partition(filePathInServer, octreeOwner, blocksArrayPartition, magoManager);
		}
		else
		{
			// Check the last partition.
			var lastBlocksArrayPartition = this.blocksArrayPartitionsArray[currPartitionsCount-1];
			if (lastBlocksArrayPartition.fileLoadState === CODE.fileLoadState.PARSE_FINISHED)
			{
				if (currPartitionsCount < this.blocksArrayPartitionsCount)
				{
					// Proceed to load another partition.
					var partitionIdx = currPartitionsCount;
					var filePathInServer = this.blocksArrayPartitionsMasterPathName + partitionIdx.toString();
					var blocksArrayPartition = new BlocksArrayPartition();
					this.blocksArrayPartitionsArray.push(blocksArrayPartition);
					magoManager.readerWriter.getNeoBlocksArraybuffer_partition(filePathInServer, octreeOwner, blocksArrayPartition, magoManager);
				}
			}
		}
	
	}
};
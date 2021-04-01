'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ReaderWriter
 */
var ReaderWriter = function(policy) 
{
	if (!(this instanceof ReaderWriter)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	//this.geometryDataPath = "/F4D_GeometryData";
	var serverPolicy = policy;
	if (serverPolicy !== undefined)
	{ this.geometryDataPath = serverPolicy.geo_data_path; }
	
	if (!this.geometryDataPath) { this.geometryDataPath = '/f4d'; }

	this.geometrySubDataPath;

	this.j_counter;
	this.k_counter;
	this.referencesList_requested = 0;
	this.blocksList_requested = 0;
	this.blocksListPartitioned_requested = 0;
	this.octreesSkinLegos_requested = 0;
	this.skinLegos_requested = 0;
	this.pCloudPartitionsMother_requested = 0;
	this.pCloudPartitions_requested = 0;
	this.smartTileF4d_requested = 0;

	this.gl;
	this.incre_latAng = 0.001;
	this.incre_longAng = 0.001;
	this.GAIA3D__offset_latitude = -0.001;
	this.GAIA3D__offset_longitude = -0.001;
	this.GAIA3D__counter = 0;

	// Var for reading files.
	this.uint32;
	this.uint16;
	this.int16;
	this.float32;
	this.float16;
	this.int8;
	this.int8_value;
	this.max_color_value = 126;

	this.startBuff;
	this.endBuff;

	this.filesReadings_count = 0;

	// SCRATCH.*** 
	this.temp_var_to_waste;
	this.countSC;
	this.xSC;
	this.ySC;
	this.zSC;
	this.point3dSC = new Point3D();
	this.bboxSC = new BoundingBox();
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 부호없는 정수값에 대한 배열의 0번째 값을 돌려줌
 */
ReaderWriter.prototype.getCurrentDataPath = function() 
{
	var currentDataPath;
	
	if (this.geometrySubDataPath !== undefined && this.geometrySubDataPath !== "")
	{
		currentDataPath = this.geometryDataPath + "/" + this.geometrySubDataPath;
	}
	else
		
	{
		currentDataPath = this.geometryDataPath;
	}
	
	return currentDataPath;
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 부호없는 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns uint32[0]
 */
ReaderWriter.prototype.readUInt32 = function(buffer, start, end) 
{
	var uint32 = new Uint32Array(buffer.slice(start, end));
	return uint32[0];
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 부호없는 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns uint32[0]
 */
ReaderWriter.readUInt32 = function(buffer, start, end) 
{
	var uint32 = new Uint32Array(buffer.slice(start, end));
	return uint32[0];
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns int32[0]
 */
ReaderWriter.prototype.readInt32 = function(buffer, start, end) 
{
	var int32 = new Int32Array(buffer.slice(start, end));
	return int32[0];
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns int32[0]
 */
ReaderWriter.readInt32 = function(buffer, start, end) 
{
	var int32 = new Int32Array(buffer.slice(start, end));
	return int32[0];
};

/**
 * 버퍼에서 데이터를 읽어서 16비트 부호없는 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns uint16[0]
 */
ReaderWriter.prototype.readUInt16 = function(buffer, start, end) 
{
	var uint16 = new Uint16Array(buffer.slice(start, end));
	return uint16[0];
};

/**
 * 버퍼에서 데이터를 읽어서 16비트 부호없는 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns uint16[0]
 */
ReaderWriter.readUInt16 = function(buffer, start, end) 
{
	var uint16 = new Uint16Array(buffer.slice(start, end));
	return uint16[0];
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns int16[0]
 */
ReaderWriter.prototype.readInt16 = function(buffer, start, end) 
{
	var int16 = new Int16Array(buffer.slice(start, end));
	return int16[0];
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns int16[0]
 */
ReaderWriter.readInt16 = function(buffer, start, end) 
{
	var int16 = new Int16Array(buffer.slice(start, end));
	return int16[0];
};

/**
 * 버퍼에서 데이터를 읽어서 64비트 float값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns float64[0]
 */
ReaderWriter.prototype.readFloat64 = function(buffer, start, end) 
{
	var float64 = new Float64Array(buffer.slice(start, end));
	return float64[0];
};

/**
 * 버퍼에서 데이터를 읽어서 64비트 float값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns float64[0]
 */
ReaderWriter.readFloat64 = function(buffer, start, end) 
{
	var float64 = new Float64Array(buffer.slice(start, end));
	return float64[0];
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 float값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns float32[0]
 */
ReaderWriter.prototype.readFloat32 = function(buffer, start, end) 
{
	var float32 = new Float32Array(buffer.slice(start, end));
	return float32[0];
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 float값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns float32[0]
 */
ReaderWriter.readFloat32 = function(buffer, start, end) 
{
	var float32 = new Float32Array(buffer.slice(start, end));
	return float32[0];
};

/**
 * 버퍼에서 데이터를 읽어서 32비트 부호없는 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns float16[0]
 */
ReaderWriter.prototype.readFloat16 = function(buffer, start, end) 
{
	var float16 = new Float32Array(buffer.slice(start, end));
	return float16[0];
};

/**
 * 버퍼에서 데이터를 읽어서 8비트 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns int8[0]
 */
ReaderWriter.prototype.readInt8 = function(buffer, start, end) 
{
	var int8 = new Int8Array(buffer.slice(start, end));
	return int8[0];
};

/**
 * 버퍼에서 데이터를 읽어서 8비트 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns int8[0]
 */
ReaderWriter.readInt8 = function(buffer, start, end) 
{
	var int8 = new Int8Array(buffer.slice(start, end));
	return int8[0];
};

/**
 * 버퍼에서 데이터를 읽어서 8비트 부호없는 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns uint8[0]
 */
ReaderWriter.prototype.readUInt8 = function(buffer, start, end) 
{
	var uint8 = new Uint8Array(buffer.slice(start, end));
	return uint8[0];
};

/**
 * 버퍼에서 데이터를 읽어서 8비트 부호없는 정수값에 대한 배열의 0번째 값을 돌려줌
 * @param buffer 복사할 버퍼
 * @param start 시작 바이트 인덱스
 * @param end 끝 바이트 인덱스
 * @returns uint8[0]
 */
ReaderWriter.readUInt8 = function(buffer, start, end) 
{
	var uint8 = new Uint8Array(buffer.slice(start, end));
	return uint8[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns int8_value
 */
ReaderWriter.prototype.readInt8ByteColor = function(buffer, start, end) 
{
	var int8 = new Int8Array(buffer.slice(start, end));
	var int8_value = int8[0];

	if (int8_value > max_color_value) { int8_value = max_color_value; }

	if (int8_value < 0) { int8_value += 256; }

	return int8_value;
};




function loadWithXhr_deprecated(fileName, xhr, timeOut) 
{
	// 1) 사용될 jQuery Deferred 객체를 생성한다.
	var deferred = $.Deferred();
	
	if (xhr === undefined)
	{ xhr = new XMLHttpRequest(); }
	
	xhr.open("GET", fileName, true);
	xhr.responseType = "arraybuffer";
	if (timeOut !== undefined)
	{ xhr.timeout = timeOut; } // time in milliseconds
	  
	// 이벤트 핸들러를 등록한다.
	xhr.onload = function() 
	{
		if (xhr.status < 200 || xhr.status >= 300) 
		{
			deferred.reject(xhr.status);
			return;
		}
		else 
		{
			// 3.1) DEFERRED를 해결한다. (모든 done()...을 동작시킬 것이다.)
			deferred.resolve(xhr.response);
		} 
	};
	
	xhr.ontimeout = function (e) 
	{
		// XMLHttpRequest timed out.***
		deferred.reject(-1);
	};
	
	xhr.onerror = function(e) 
	{
		console.log("Invalid XMLHttpRequest response type.");
		deferred.reject(xhr.status);
	};

	// 작업을 수행한다.
	xhr.send(null);
	
	// 참고: jQuery.ajax를 사용할 수 있었고 해야할 수 있었다.
	// 참고: jQuery.ajax는 Promise를 반환하지만 다른 Deferred/Promise를 사용하여 애플리케이션에 의미있는 구문으로 감싸는 것은 언제나 좋은 생각이다.
	// ---- /AJAX 호출 ---- //
	  
	// 2) 이 deferred의 promise를 반환한다.
	return deferred.promise();
};

ReaderWriter.prototype.getNeoBlocksArraybuffer = function(fileName, lowestOctree, magoManager, options) 
{
	magoManager.fileRequestControler.modelRefFilesRequestedCount += 1;
	var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
	blocksList.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var xhr;
	//xhr = new XMLHttpRequest();
	blocksList.xhr = xhr; // possibility to cancel.***
	
	var parseImmediately = false;
	if (options !== undefined)
	{
		if (options.parseImmediately !== undefined)
		{ parseImmediately = options.parseImmediately; }
	}
	
	this.blocksList_requested++;
	
	loadWithXhr(fileName, xhr).then(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			blocksList.dataArraybuffer = arrayBuffer;
			blocksList.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			arrayBuffer = null;
			
			if (parseImmediately)
			{
				// parse immediately.
				ParseQueue.parseArrayOctreesLod0Models(lowestOctree, magoManager);
			}
			else 
			{
				magoManager.parseQueue.putOctreeLod0ModelsToParse(lowestOctree);
			}
		}
		else 
		{
			blocksList.fileLoadState = 500;
		}
	}, 
	function(status) 
	{
		console.log("Invalid XMLHttpRequest status = " + status);
		if (status === 0) { blocksList.fileLoadState = 500; }
		else if (status === -1) { blocksList.fileLoadState = CODE.fileLoadState.READY; }
		else { blocksList.fileLoadState = status; }
	}).finally(function() 
	{
		magoManager.readerWriter.blocksList_requested--;
		magoManager.fileRequestControler.modelRefFilesRequestedCount -= 1;
		if (magoManager.fileRequestControler.modelRefFilesRequestedCount < 0) { magoManager.fileRequestControler.modelRefFilesRequestedCount = 0; }
	});
};

ReaderWriter.prototype.getNeoBlocksArraybuffer_partition = function(fileName, lowestOctree, blocksArrayPartition, magoManager) 
{
	magoManager.fileRequestControler.modelRefFilesRequestedCount += 1;
	blocksArrayPartition.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var xhr;
	
	this.blocksListPartitioned_requested++;
	
	loadWithXhr(fileName, xhr).then(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			blocksArrayPartition.dataArraybuffer = arrayBuffer;
			blocksArrayPartition.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			arrayBuffer = null;
			
			
			magoManager.parseQueue.putOctreeLod0ModelsToParse(lowestOctree);
		}
		else 
		{
			blocksArrayPartition.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("Invalid XMLHttpRequest status = " + status);
		if (status === 0) { blocksArrayPartition.fileLoadState = 500; }
		else if (status === -1) { blocksArrayPartition.fileLoadState = CODE.fileLoadState.READY; }
		else { blocksArrayPartition.fileLoadState = status; }
	}).finally(function() 
	{
		magoManager.readerWriter.blocksListPartitioned_requested--;
		//magoManager.fileRequestControler.modelRefFilesRequestedCount -= 1;
		if (magoManager.fileRequestControler.blocksListPartitioned_requested < 0) { magoManager.fileRequestControler.blocksListPartitioned_requested = 0; }
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param fileName 파일명
 * @param magoManager 변수
 */
ReaderWriter.prototype.getNeoReferencesArraybuffer = function(fileName, lowestOctree, magoManager, options) 
{
	if (lowestOctree.neoReferencesMotherAndIndices === undefined)
	{ return; }
	
	magoManager.fileRequestControler.modelRefFilesRequestedCount += 1;
	lowestOctree.neoReferencesMotherAndIndices.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var xhr;
	//xhr = new XMLHttpRequest();
	lowestOctree.neoReferencesMotherAndIndices.xhr = xhr;
	var parseImmediately = false;
	if (options !== undefined)
	{
		if (options.parseImmediately !== undefined)
		{ parseImmediately = options.parseImmediately; }
	}
	
	this.referencesList_requested++;
	loadWithXhr(fileName, xhr).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			var neoRefsList = lowestOctree.neoReferencesMotherAndIndices;
			if (neoRefsList)
			{
				neoRefsList.dataArraybuffer = arrayBuffer;
				neoRefsList.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				if (parseImmediately)
				{
					// parse immediately.
					ParseQueue.parseOctreesLod0References(lowestOctree, magoManager);
				}
				else 
				{
					magoManager.parseQueue.putOctreeLod0ReferencesToParse(lowestOctree);
				}
			}
			arrayBuffer = null;
			
		}
		else 
		{
			lowestOctree.neoReferencesMotherAndIndices.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) 
		{ lowestOctree.neoReferencesMotherAndIndices.fileLoadState = CODE.fileLoadState.LOAD_FAILED; }
		else if (status === -1) 
		{ lowestOctree.neoReferencesMotherAndIndices.fileLoadState = CODE.fileLoadState.READY; }
		else 
		{ lowestOctree.neoReferencesMotherAndIndices.fileLoadState = status; }
	}).finally(function() 
	{
		magoManager.readerWriter.referencesList_requested--;
		magoManager.fileRequestControler.modelRefFilesRequestedCount -= 1;
		if (magoManager.fileRequestControler.modelRefFilesRequestedCount < 0) { magoManager.fileRequestControler.modelRefFilesRequestedCount = 0; }
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param fileName 파일명
 * @param magoManager 변수
 */
ReaderWriter.prototype.getOctreeLegoArraybuffer = function(fileName, lowestOctree, magoManager) 
{
	if (lowestOctree.lego === undefined)
	{ return; }
	this.octreesSkinLegos_requested ++;
	magoManager.fileRequestControler.filesRequestedCount += 1;
	lowestOctree.lego.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	
	var xhr = new XMLHttpRequest();
	lowestOctree.lego.xhr = xhr;
	
	loadWithXhr(fileName, xhr).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			if (lowestOctree.lego)
			{
				lowestOctree.lego.dataArrayBuffer = arrayBuffer;
				lowestOctree.lego.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				magoManager.parseQueue.putOctreeLod2LegosToParse(lowestOctree);
			}
			else 
			{
				lowestOctree = undefined;
			}
			arrayBuffer = null;
		}
		else 
		{
			lowestOctree.lego.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { lowestOctree.lego.fileLoadState = 500; }
		else { lowestOctree.lego.fileLoadState = status; }
	}).finally(function() 
	{
		magoManager.readerWriter.octreesSkinLegos_requested --;
		magoManager.fileRequestControler.filesRequestedCount -= 1;
		if (magoManager.fileRequestControler.filesRequestedCount < 0) { magoManager.fileRequestControler.filesRequestedCount = 0; }
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param fileName 파일명
 * @param magoManager 변수
 */
ReaderWriter.prototype.getOctreePCloudArraybuffer = function(fileName, lowestOctree, magoManager) 
{
	if (lowestOctree.lego === undefined)
	{ return; }
	
	magoManager.fileRequestControler.filesRequestedCount += 1;
	lowestOctree.lego.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	
	loadWithXhr(fileName).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			if (lowestOctree.lego)
			{
				lowestOctree.lego.dataArrayBuffer = arrayBuffer;
				lowestOctree.lego.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				magoManager.parseQueue.putOctreePCloudToParse(lowestOctree);
			}
			else 
			{
				lowestOctree = undefined;
			}
			arrayBuffer = null;
		}
		else 
		{
			lowestOctree.lego.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { lowestOctree.lego.fileLoadState = 500; }
		else { lowestOctree.lego.fileLoadState = status; }
	}).finally(function() 
	{
		magoManager.fileRequestControler.filesRequestedCount -= 1;
		if (magoManager.fileRequestControler.filesRequestedCount < 0) { magoManager.fileRequestControler.filesRequestedCount = 0; }
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param fileName 파일명
 * @param magoManager 변수
 */
ReaderWriter.prototype.getOctreePCloudPartitionArraybuffer = function(fileName, lowestOctree, pCloudPartitionLego, magoManager) 
{
	pCloudPartitionLego.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var octreeDepth = lowestOctree.octree_level;
	if (octreeDepth === 0)
	{ magoManager.readerWriter.pCloudPartitionsMother_requested++; }
	else
	{ magoManager.readerWriter.pCloudPartitions_requested ++; }
	
	loadWithXhr(fileName).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			if (lowestOctree && pCloudPartitionLego)
			{
				pCloudPartitionLego.dataArrayBuffer = arrayBuffer;
				pCloudPartitionLego.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				//magoManager.parseQueue.putOctreePCloudPartitionToParse(pCloudPartitionLego); // NO. Old. Now parse directly.***
			}
			arrayBuffer = null;
		}
		else 
		{
			pCloudPartitionLego.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { pCloudPartitionLego.fileLoadState = 500; }
		else { pCloudPartitionLego.fileLoadState = status; }
	}).finally(function() 
	{
		if (octreeDepth === 0)
		{
			magoManager.readerWriter.pCloudPartitionsMother_requested --;
			if (magoManager.readerWriter.pCloudPartitionsMother_requested < 0)
			{ magoManager.readerWriter.pCloudPartitionsMother_requested = 0; }
		}
		else
		{
			
			magoManager.readerWriter.pCloudPartitions_requested--;
			if (magoManager.readerWriter.pCloudPartitions_requested < 0)
			{ magoManager.readerWriter.pCloudPartitions_requested = 0; }
		}
	
		//magoManager.readerWriter.pCloudPartitions_requested--;
		//if (magoManager.readerWriter.pCloudPartitions_requested < 0)
		//{ magoManager.readerWriter.pCloudPartitions_requested = 0; }
	});
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param fileName 파일명
 * @param magoManager 변수
 */
ReaderWriter.prototype.getLegoArraybuffer = function(fileName, legoMesh, magoManager) 
{
	this.skinLegos_requested++;
	//magoManager.fileRequestControler.filesRequestedCount += 1;
	magoManager.fileRequestControler.lowLodDataRequestedCount += 1;
	legoMesh.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	
	var xhr;
	//xhr = new XMLHttpRequest();
	legoMesh.xhr = xhr;
	
	loadWithXhr(fileName, xhr).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			if (legoMesh)
			{
				legoMesh.dataArrayBuffer = arrayBuffer;
				legoMesh.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				magoManager.parseQueue.putSkinLegosToParse(legoMesh);
			}
			arrayBuffer = null;
		}
		else 
		{
			legoMesh.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { legoMesh.fileLoadState = 500; }
		//else { legoMesh.fileLoadState = status; }
		else 
		{ 
			legoMesh.fileLoadState = -1; 
		}
	}).finally(function() 
	{
		magoManager.readerWriter.skinLegos_requested--;
		//magoManager.fileRequestControler.filesRequestedCount -= 1;
		magoManager.fileRequestControler.lowLodDataRequestedCount -= 1;
		//if (magoManager.fileRequestControler.filesRequestedCount < 0) { magoManager.fileRequestControler.filesRequestedCount = 0; }
		if (magoManager.fileRequestControler.lowLodDataRequestedCount < 0) { magoManager.fileRequestControler.lowLodDataRequestedCount = 0; }
	});
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param {string} fileName 파일명
 * @param {MagoManager} magoManager 파일 처리를 담당
 */
ReaderWriter.prototype.getObjectIndexFileSmartTileF4d = function(fileName, projectFolderName, magoManager) 
{
	loadWithXhr(fileName).then(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			if (magoManager.smartTileManager === undefined)
			{
				magoManager.smartTileManager = new SmartTileManager();
			}
			var smartTileManager = magoManager.smartTileManager;
			smartTileManager.parseSmartTilesF4dIndexFile(arrayBuffer, projectFolderName, magoManager);
			
			arrayBuffer = undefined;
		}
		else 
		{
			// Error.***
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
	}).finally(function() 
	{
		//	For the moment, do nothing.***
	});
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param {string} fileName 파일명
 * @param {MagoManager} magoManager 파일 처리를 담당
 */
ReaderWriter.prototype.getSmartTileF4d = function(fileName, smartTileF4dSeed, smartTileOwner, magoManager) 
{
	this.smartTileF4d_requested ++;
	smartTileF4dSeed.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	loadWithXhr(fileName).then(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			smartTileF4dSeed.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			// put smartTileOwner into parse queue.***
			smartTileF4dSeed.dataArrayBuffer = arrayBuffer;
			//smartTileOwner.parseSmartTileF4d(arrayBuffer);
			arrayBuffer = undefined;
		}
		else 
		{
			// Error.***
			smartTileF4dSeed.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
		}
		
		magoManager.readerWriter.smartTileF4d_requested --;
		if (magoManager.readerWriter.smartTileF4d_requested < 0)
		{ magoManager.readerWriter.smartTileF4d_requested = 0; }
	},
	function(status) 
	{
		console.log("xhr status = " + status);
	}).finally(function() 
	{
		//	For the moment, do nothing.***
		
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param fileName 파일명
 * @param magoManager 변수
 */
ReaderWriter.prototype.getMultiBuildingsDataArrayBuffer = function(fileName, multiBuildings, magoManager) 
{
	// Function to load multiBuildings data.
	this.skinLegos_requested++;
	magoManager.fileRequestControler.multiBuildingsDataRequestedCount += 1;
	multiBuildings.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var xhr;
	loadWithXhr(fileName, xhr).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			if (multiBuildings)
			{
				multiBuildings.dataArrayBuffer = arrayBuffer;
				multiBuildings.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				magoManager.parseQueue.putMultiBuildingsToParse(multiBuildings, 0);
			}
			arrayBuffer = null;
		}
		else 
		{
			multiBuildings.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { multiBuildings.fileLoadState = 500; }
		else 
		{ 
			multiBuildings.fileLoadState = -1; 
		}
	}).finally(function() 
	{
		magoManager.fileRequestControler.multiBuildingsDataRequestedCount -= 1;
		if (magoManager.fileRequestControler.multiBuildingsDataRequestedCount < 0) { magoManager.fileRequestControler.multiBuildingsDataRequestedCount = 0; }
	});
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param gl gl context
 * @param {string} fileName 파일명
 * @param {MagoManager} magoManager 파일 처리를 담당
 * @param {BuildingSeedList} buildingSeedList 빌딩 씨앗 리스트
 * @param {string} projectId 프로젝트 아이디.
 */
ReaderWriter.prototype.getObjectIndexFileForSmartTile = function(fileName, magoManager, buildingSeedList, projectId) 
{
	loadWithXhr(fileName).then(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			//buildingSeedList.dataArrayBuffer = arrayBuffer;
			//buildingSeedList.parseBuildingSeedArrayBuffer();
			
			var buildingSeedMap = new BuildingSeedMap();
			buildingSeedMap.dataArrayBuffer = arrayBuffer;
			buildingSeedMap.parseBuildingSeedArrayBuffer();
			magoManager.makeSmartTile(buildingSeedMap, projectId);
			arrayBuffer = null;
		}
		else 
		{
			// blocksList.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		//		if(status === 0) blocksList.fileLoadState = 500;
		//		else blocksList.fileLoadState = status;
	}).finally(function() 
	{
		//		magoManager.fileRequestControler.filesRequestedCount -= 1;
		//		if(magoManager.fileRequestControler.filesRequestedCount < 0) magoManager.fileRequestControler.filesRequestedCount = 0;
	});
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param gl gl context
 * @param {string} fileName 파일명
 * @param {MagoManager} magoManager 파일 처리를 담당
 * @param {string} projectId 프로젝트 아이디.
 * @param {Array<string>} newDataKeys 추가할 데이터 키 목록
 * @param {Array<object> | object} f4dObject 추가할 데이터 object.
 */
ReaderWriter.prototype.getObjectIndexFileForData = function(fileName, magoManager, projectId, newDataKeys, f4dObject) 
{
	loadWithXhr(fileName).then(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			var buildingSeedList = new BuildingSeedList(); 
			buildingSeedList.dataArrayBuffer = arrayBuffer;
			buildingSeedList.parseBuildingSeedArrayBuffer();

			var buildingSeedMap = {};
			var buildingSeedsCount = buildingSeedList.buildingSeedArray.length;
			for (var i=0; i<buildingSeedsCount; i++)
			{
				var buildingSeed = buildingSeedList.buildingSeedArray[i];
				var buildingId = buildingSeed.buildingId;

				if (newDataKeys.indexOf(buildingId) >= 0) 
				{
					buildingSeedMap[buildingId] = buildingSeed;	
				}
				
			}
			var seedCnt = Object.keys(buildingSeedMap).length;

			//object 인덱스파일에 새로운 데이터에 대한 정보가 없으면 에러 발생.
			if (seedCnt !== newDataKeys.length) 
			{
				throw new Error('ObjectIndexFile is not ready. Please make objectIndexFile and try add data.'); 
			}
			
			magoManager.makeSmartTile(buildingSeedMap, projectId, f4dObject, buildingSeedMap);
			arrayBuffer = null;
		}
		else 
		{
			// blocksList.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		//		if(status === 0) blocksList.fileLoadState = 500;
		//		else blocksList.fileLoadState = status;
	}).finally(function() 
	{
		//		magoManager.fileRequestControler.filesRequestedCount -= 1;
		//		if(magoManager.fileRequestControler.filesRequestedCount < 0) magoManager.fileRequestControler.filesRequestedCount = 0;
	});
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param gl gl context
 * @param fileName 파일명
 * @param readerWriter 파일 처리를 담당
 * @param neoBuildingsList object index 파일을 파싱한 정보를 저장할 배열
 */
ReaderWriter.prototype.getObjectIndexFile = function(fileName, readerWriter, neoBuildingsList, magoManager) 
{
	loadWithXhr(fileName).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			readerWriter.parseObjectIndexFile(arrayBuffer, neoBuildingsList);
			arrayBuffer = null;
			magoManager.createDeploymentGeoLocationsForHeavyIndustries();
		}
		else 
		{
			//			blocksList.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		//		if(status === 0) blocksList.fileLoadState = 500;
		//		else blocksList.fileLoadState = status;
	}).finally(function() 
	{
		//		magoManager.fileRequestControler.filesRequestedCount -= 1;
		//		if(magoManager.fileRequestControler.filesRequestedCount < 0) magoManager.fileRequestControler.filesRequestedCount = 0;
	});
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param arrayBuffer object index file binary data
 * @param neoBuildingsList object index 파일을 파싱한 정보를 저장할 배열
 */
ReaderWriter.prototype.parseObjectIndexFile = function(arrayBuffer, neoBuildingsList) 
{
	var bytesReaded = 0;
	var buildingNameLength;
	var longitude;
	var latitude;
	var altitude;

	var buildingsCount = this.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	bytesReaded += 4;
	for (var i =0; i<buildingsCount; i++) 
	{
		// read the building location data.***
		var neoBuilding = neoBuildingsList.newNeoBuilding();
		if (neoBuilding.metaData === undefined) 
		{
			neoBuilding.metaData = new MetaData();
		}

		if (neoBuilding.metaData.geographicCoord === undefined)
		{ neoBuilding.metaData.geographicCoord = new GeographicCoord(); }

		if (neoBuilding.metaData.bbox === undefined) 
		{
			neoBuilding.metaData.bbox = new BoundingBox();
		}

		buildingNameLength = this.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
		bytesReaded += 4;
		var buildingName = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ buildingNameLength)));
		bytesReaded += buildingNameLength;

		longitude = this.readFloat64(arrayBuffer, bytesReaded, bytesReaded+8); bytesReaded += 8;
		latitude = this.readFloat64(arrayBuffer, bytesReaded, bytesReaded+8); bytesReaded += 8;
		altitude = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;

		neoBuilding.bbox = new BoundingBox();
		neoBuilding.bbox.minX = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		neoBuilding.bbox.minY = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		neoBuilding.bbox.minZ = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		neoBuilding.bbox.maxX = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		neoBuilding.bbox.maxY = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		neoBuilding.bbox.maxZ = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;

		// create a building and set the location.***
		neoBuilding.buildingId = buildingName.substr(4, buildingNameLength-4);
		neoBuilding.buildingType = "basicBuilding";
		neoBuilding.buildingFileName = buildingName;
		neoBuilding.metaData.geographicCoord.setLonLatAlt(longitude, latitude, altitude);
	}

	neoBuildingsList.neoBuildingsArray.reverse();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param fileName 변수
 * @param neoBuilding 변수
 * @param readerWriter 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.getNeoHeaderAsimetricVersion = function(gl, fileName, neoBuilding, readerWriter, magoManager) 
{
	function Utf8ArrayToStr(array) 
	{
		var out, i, len, c;
		var char2, char3;

		out = "";
		len = array.length;
		i = 0;
		while (i < len) 
		{
			c = array[i++];
			switch (c >> 4)
			{ 
			case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
				// 0xxxxxxx
				out += String.fromCharCode(c);
				break;
			case 12: case 13:
				// 110x xxxx   10xx xxxx
				char2 = array[i++];
				out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
				break;
			case 14:
				// 1110 xxxx  10xx xxxx  10xx xxxx
				char2 = array[i++];
				char3 = array[i++];
				out += String.fromCharCode(((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0));
				break;
			}
		}

		return out;
	};

	//BR_Project._f4d_header_readed = true;
	magoManager.fileRequestControler.headerFilesRequestedCount += 1;
	neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_STARTED;

	loadWithXhr(fileName).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			var bytesReaded = 0;
			neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			neoBuilding.headerDataArrayBuffer = arrayBuffer;
			////neoBuilding.parseHeader(arrayBuffer, bytesReaded) ;
			arrayBuffer = undefined;
		}
		else 
		{
			neoBuilding.metaData.fileLoadState = 500;
			arrayBuffer = undefined;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { neoBuilding.metaData.fileLoadState = 500; }
		else { neoBuilding.metaData.fileLoadState = status; }
	}).finally(function() 
	{
		magoManager.fileRequestControler.headerFilesRequestedCount -= 1;
		if (magoManager.fileRequestControler.headerFilesRequestedCount < 0) { magoManager.fileRequestControler.headerFilesRequestedCount = 0; }
	});
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param filePath_inServer 변수
 * @param f4dTex 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.readTexture = function(gl, filePath_inServer, f4dTex, magoManager) 
{
	f4dTex.loadStarted = true;
	//f4dTex.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	f4dTex.texImage = new Image();
	f4dTex.texImage.onload = function() 
	{
		f4dTex.loadFinished = true;
		//f4dTex.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;

		if (magoManager.backGround_fileReadings_count > 0 ) { magoManager.backGround_fileReadings_count -=1; }
	};

	f4dTex.texImage.onerror = function() 
	{
		// doesn't exist or error loading
		f4dTex.loadStarted = false;
		if (magoManager.backGround_fileReadings_count > 0 ) { magoManager.backGround_fileReadings_count -=1; }
		return;
	};

	f4dTex.texImage.src = filePath_inServer;
};

ReaderWriter.prototype.decodeTGA = function(arrayBuffer) 
{
	// code from toji.***
	var content = new Uint8Array(arrayBuffer),
		contentOffset = 18 + content[0],
		imagetype = content[2], // 2 = rgb, only supported format for now
		width = content[12] + (content[13] << 8),
		height = content[14] + (content[15] << 8),
		bpp = content[16], // should be 8,16,24,32
		
		bytesPerPixel = bpp / 8,
		bytesPerRow = width * 4,
		data, i, j, x, y;

	if (!width || !height) 
	{
		console.error("Invalid dimensions");
		return null;
	}

	if (imagetype !== 2) 
	{
		console.error("Unsupported TGA format:", imagetype);
		return null;
	}

	data = new Uint8Array(width * height * 4);
	i = contentOffset;

	// Oy, with the flipping of the rows...
	for (y = height-1; y >= 0; --y) 
	{
		for (x = 0; x < width; ++x, i += bytesPerPixel) 
		{
			j = (x * 4) + (y * bytesPerRow);
			data[j] = content[i+2];
			data[j+1] = content[i+1];
			data[j+2] = content[i+0];
			data[j+3] = (bpp === 32 ? content[i+3] : 255);
		}
	}

	return {
		width  : width,
		height : height,
		data   : data
	};
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param filePath_inServer 변수
 * @param texture 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.readNeoReferenceTexture = function(gl, filePath_inServer, texture, neoBuilding, magoManager) 
{
	// Must know the fileExtension.***
	var extension = filePath_inServer.split('.').pop();
	
	if (extension === "tga" || extension === "TGA" || extension === "Tga")
	{
		texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
		loadWithXhr(filePath_inServer).then(function(response) 
		{
			var arrayBuffer = response;
			if (arrayBuffer) 
			{
				// decode tga.***
				// Test with tga decoder from https://github.com/schmittl/tgajs
				var tga = new TGA();
				tga.load(arrayBuffer);
				texture.texId = gl.createTexture();
				// End decoding.---------------------------------------------------
				
				//var tga = magoManager.readerWriter.decodeTGA(arrayBuffer); // old code.
				//if(tga) {
				//    gl.bindTexture(gl.TEXTURE_2D, texture.texId);
				//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tga.width, tga.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, tga.data);
				//    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				//	gl.generateMipmap(gl.TEXTURE_2D);
				//	texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED; // file load finished.***
				//}
				
				// example values of tga.header
				// alphaBits 0
				// bytePerPixel 3
				// colorMapDepth 0
				// colorMapIndex 0
				// colorMapLength 0
				// colorMapType 0
				// flags 32
				// hasColorMap false
				// hasEncoding false
				// height 2048
				// idLength 0
				// imageType 2
				// isGreyColor false
				// offsetX 0
				// offsetY 0
				// origin 2
				// pixelDepth 24
				// width 2048
				
				if (tga) 
				{
					var rgbType;
					if (tga.header.bytePerPixel === 3)
					{
						rgbType = gl.RGB;
						
						// test change rgb to bgr.***
						/*
						var imageDataLength = tga.imageData.length;
						var pixelsCount = imageDataLength/3;
						var r, g, b;
						for(var i=0; i<pixelsCount; i++)
						{
							r = tga.imageData[i*3];
							g = tga.imageData[i*3+1];
							b = tga.imageData[i*3+2];
							
							tga.imageData[i*3] = b;
							tga.imageData[i*3+1] = g;
							tga.imageData[i*3+2] = r;
						}
						*/
					}
					else if (tga.header.bytePerPixel === 4)
					{
						rgbType = gl.RGBA;
						
						// test change rgb to bgr.***
						
						var imageDataLength = tga.imageData.length;
						var pixelsCount = imageDataLength/4;
						var r, g, b, a;
						for (var i=0; i<pixelsCount; i++)
						{
							r = tga.imageData[i*4];
							g = tga.imageData[i*4+1];
							b = tga.imageData[i*4+2];
							a = tga.imageData[i*4+3];
							
							tga.imageData[i*4] = b;
							tga.imageData[i*4+1] = g;
							tga.imageData[i*4+2] = r;
							tga.imageData[i*4+3] = a;
						}
						
					}
					
					
					if (tga.imageData !== undefined && tga.imageData.length > 0 && texture.texId !== undefined)
					{
						gl.bindTexture(gl.TEXTURE_2D, texture.texId);
						gl.texImage2D(gl.TEXTURE_2D, 0, rgbType, tga.header.width, tga.header.height, 0, rgbType, gl.UNSIGNED_BYTE, tga.imageData);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
						gl.generateMipmap(gl.TEXTURE_2D);
						texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED; // file load finished.***
						gl.bindTexture(gl.TEXTURE_2D, null);
					}
				}
			}
		},
		function(status) 
		{
			if (neoBuilding)
			{
				console.log("xhr status = " + status);
				if (status === 0) { neoBuilding.metaData.fileLoadState = 500; }
				else { neoBuilding.metaData.fileLoadState = status; }
			}
		}).finally(function() 
		{
			magoManager.backGround_fileReadings_count -= 1;
			if (magoManager.backGround_fileReadings_count < 0) { magoManager.backGround_fileReadings_count = 0; }
		});
	}
	else 
	{
		var neoRefImage = new Image();
		texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED; // file load started.***
		
		//magoManager.backGround_fileReadings_count ++;
		neoRefImage.onload = function() 
		{
			// is possible that during loading image the building was deleted. Then return.
			if (texture.texId === undefined)
			{
				texture.texId = gl.createTexture();
			}
			
			// if "texture.texId" exist then bind it.
			handleTextureLoaded(gl, neoRefImage, texture.texId);
			texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED; // file load finished.***

			if (magoManager.backGround_fileReadings_count > 0 ) 
			{ magoManager.backGround_fileReadings_count -=1; }
		};

		neoRefImage.onerror = function() 
		{
			// doesn't exist or error loading
			return;
		};
		neoRefImage.src = filePath_inServer;
	}	
};

ReaderWriter.loadBinaryData = function(fileName, dataContainer, weatherLayer) 
{
	dataContainer.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	
	loadWithXhr(fileName).then(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			dataContainer.dataArraybuffer = arrayBuffer;
			dataContainer.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			arrayBuffer = null;
			
			weatherLayer.parseData(dataContainer);
		}
		else 
		{
			dataContainer.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("Invalid XMLHttpRequest status = " + status);
		if (status === 0) { dataContainer.fileLoadState = 500; }
		else { dataContainer.fileLoadState = status; }
	}).finally(function() 
	{
		
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param filePath_inServer 변수
 * @param texture 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 */
ReaderWriter.loadImage = function (gl, filePath_inServer, texture) 
{
	// Must know the fileExtension.***
	//var extension = filePath_inServer.split('.').pop();
	
	var image = new Image();
	texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED; // file load started.***
	
	image.onload = function() 
	{
		// is possible that during loading image the building was deleted. Then return.
		if (texture.texId === undefined)
		{
			return;
		}
		
		texture.imageWidth = image.width;
		texture.imageHeight = image.height;
		
		function createTexture(_gl, filter, data, width, height) 
		{
			var textureAux = _gl.createTexture();
			_gl.bindTexture(_gl.TEXTURE_2D, textureAux);
			_gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, filter);
			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, filter);
			if (data instanceof Uint8Array) 
			{
				_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, width, height, 0, _gl.RGBA, _gl.UNSIGNED_BYTE, data);
			}
			else 
			{
				_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, data);
				//_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_SHORT_4_4_4_4, data);
			}
			_gl.bindTexture(_gl.TEXTURE_2D, null);
			//_gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
			return textureAux;
		}

		//texture.texId = createTexture(gl, gl.LINEAR, image);
		texture.texId = createTexture(gl, gl.NEAREST, image);
		texture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED; // file load finished.***
	};

	image.onerror = function() 
	{
		// doesn't exist or error loading
		return;
	};
	image.src = filePath_inServer;
		
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param filePath_inServer 변수
 * @param texture 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.readLegoSimpleBuildingTexture = function(gl, filePath_inServer, texture, magoManager, flip_y_texCoord) 
{
	var neoRefImage = new Image();
	texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	magoManager.fileRequestControler.lowLodImagesRequestedCount += 1;

	neoRefImage.onload = function() 
	{
		if (texture.texId === undefined) 
		{ texture.texId = gl.createTexture(); }

		if (flip_y_texCoord === undefined)
		{ flip_y_texCoord = true; }
		
		handleTextureLoaded(gl, neoRefImage, texture.texId, flip_y_texCoord);
		texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		
		magoManager.fileRequestControler.lowLodImagesRequestedCount -= 1;

		if (magoManager.backGround_fileReadings_count > 0 ) { magoManager.backGround_fileReadings_count -=1; }
		if (magoManager.fileRequestControler.lowLodImagesRequestedCount < 0) { magoManager.fileRequestControler.lowLodImagesRequestedCount = 0; }
	};

	neoRefImage.onerror = function() 
	{
		if (texture.texId === undefined) 
		{
			texture.texId = gl.createTexture();
			// Test wait for texture to load.********************************************
			gl.bindTexture(gl.TEXTURE_2D, texture.texId);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255])); // clear grey
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		
		texture.fileLoadState = CODE.fileLoadState.READY;
		
		magoManager.fileRequestControler.lowLodImagesRequestedCount -= 1;
		if (magoManager.fileRequestControler.lowLodImagesRequestedCount < 0) { magoManager.fileRequestControler.lowLodImagesRequestedCount = 0; }
	};

	neoRefImage.src = filePath_inServer;
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param fileName 변수
 * @param terranTile 변수
 * @param readerWriter 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.getTileArrayBuffer = function(gl, fileName, terranTile, readerWriter, magoManager) 
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	terranTile.fileReading_started = true;
	//	magoManager.fileRequestControler.backGround_fileReadings_count += 1;
	//	blocksList.fileLoadState = CODE.fileLoadState.LOADING_STARTED;

	loadWithXhr(fileName).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			//var BR_Project = new BRBuildingProject(); // Test.***
			//readerWriter.readF4D_Header(gl, arrayBuffer, BR_Project ); // Test.***
			terranTile.fileArrayBuffer = arrayBuffer;
			terranTile.fileReading_finished = true;

			if (magoManager.backGround_fileReadings_count > 0 ) { magoManager.backGround_fileReadings_count -=1; }
			//			blocksList.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			arrayBuffer = null;
		}
		else 
		{
			//			blocksList.fileLoadState = 500;
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
		//		if(status === 0) blocksList.fileLoadState = 500;
		//		else blocksList.fileLoadState = status;
	}).finally(function() 
	{
		//		magoManager.fileRequestControler.filesRequestedCount -= 1;
		//		if(magoManager.fileRequestControler.filesRequestedCount < 0) magoManager.fileRequestControler.filesRequestedCount = 0;
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param filePath_inServer 변수
 * @param pCloud 변수
 * @param readerWriter 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.loadTINTerrain = function(fileName, tinTerrain, magoManager) 
{
	//magoManager.fileRequestControler.modelRefFilesRequestedCount += 1;
	tinTerrain.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	magoManager.fileRequestControler.tinTerrainFilesRequested +=1;
	
	loadWithXhr(fileName).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			tinTerrain.dataArrayBuffer = arrayBuffer;
			tinTerrain.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			//magoManager.parseQueue.putTinTerrainToParse(lowestOctree); // todo.***
			arrayBuffer = undefined;
		}
		else 
		{
			tinTerrain.fileLoadState = 500;
		}
	}, function(status) 
	{
		tinTerrain.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
		//console.log("xhr status = " + status);
		//if (status === 0) { lowestOctree.neoReferencesMotherAndIndices.fileLoadState = 500; }
		//else { lowestOctree.neoReferencesMotherAndIndices.fileLoadState = status; }
	}).finally(function() 
	{
		magoManager.fileRequestControler.tinTerrainFilesRequested -= 1;
		if (magoManager.fileRequestControler.tinTerrainFilesRequested < 0) { magoManager.fileRequestControler.tinTerrainFilesRequested = 0; }
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param imageArrayBuffer 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.imageFromArrayBuffer = function(gl, imageArrayBuffer, texture, magoManager, flip_y_texCoords) 
{
	// example: allowedFileTypes = ["image/png", "image/jpeg", "image/gif"];
	var blob = new Blob( [ imageArrayBuffer ], { type: "image/png" } );
	var urlCreator = window.URL || window.webkitURL;
	var imagenUrl = urlCreator.createObjectURL(blob);
	var imageFromArray = new Image();

	imageFromArray.onload = function () 
	{
		if (flip_y_texCoords === undefined)
		{ flip_y_texCoords = false; }
		
		if (texture.texId === undefined)
		{ texture.texId = gl.createTexture(); }
		handleTextureLoaded(gl, imageFromArray, texture.texId, flip_y_texCoords);
		texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		imageArrayBuffer = null;
	};

	imageFromArray.onerror = function() 
	{
		return;
	};

	imageFromArray.src = imagenUrl;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param filePath_inServer 변수
 * @param texture 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.loadWMSImage = function(gl, filePath_inServer, texture, magoManager, flip_y_texCoords) 
{
	texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var readWriter = this;
	magoManager.fileRequestControler.tinTerrainTexturesRequested += 1;
	loadWithXhr(filePath_inServer).then(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			if (flip_y_texCoords === undefined)
			{ flip_y_texCoords = false; }

			var blob = new Blob( [ arrayBuffer ], { type: "image/png" } );
			var urlCreator = window.URL || window.webkitURL;
			var imagenUrl = urlCreator.createObjectURL(blob);
			var imageFromArray = new Image();

			imageFromArray.onload = function () 
			{
				if (texture.texId === undefined)
				{ texture.texId = gl.createTexture(); }

				gl.bindTexture(gl.TEXTURE_2D, texture.texId);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip_y_texCoords); // if need vertical mirror of the image.
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageFromArray); // Original.
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.bindTexture(gl.TEXTURE_2D, null);

				texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				arrayBuffer = null;
			};

			imageFromArray.onerror = function() 
			{
				return;
			};

			imageFromArray.src = imagenUrl;
		}
		
	}, function(status) 
	{
		console.log(status);
		texture.texId = 'failed';
		texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		
	}).finally(function() 
	{
		magoManager.backGround_fileReadings_count -= 1;
		if (magoManager.backGround_fileReadings_count < 0) { magoManager.backGround_fileReadings_count = 0; }
		
		magoManager.fileRequestControler.tinTerrainTexturesRequested -= 1;
		if (magoManager.fileRequestControler.tinTerrainTexturesRequested < 0) { magoManager.fileRequestControler.tinTerrainTexturesRequested = 0; }
	});
		
};

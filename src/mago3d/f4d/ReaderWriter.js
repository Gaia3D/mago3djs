'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ReaderWriter
 */
var ReaderWriter = function() 
{
	if (!(this instanceof ReaderWriter)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	//this.geometryDataPath = "/F4D_GeometryData";
	var serverPolicy = MagoConfig.getPolicy();
	if (serverPolicy !== undefined)
	{ this.geometryDataPath = serverPolicy.geo_data_path; }
	
	this.geometrySubDataPath;

	this.j_counter;
	this.k_counter;
	this.referencesList_requested = 0;
	this.blocksList_requested = 0;
	this.blocksListPartitioned_requested = 0;
	this.octreesSkinLegos_requested = 0;
	this.skinLegos_requested = 0;
	this.pCloudPartitions_requested = 0;

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

function loadWithXhr(fileName, xhr, timeOut) 
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

ReaderWriter.prototype.getNeoBlocksArraybuffer = function(fileName, lowestOctree, magoManager) 
{
	magoManager.fileRequestControler.modelRefFilesRequestedCount += 1;
	var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
	blocksList.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var xhr;
	//xhr = new XMLHttpRequest();
	blocksList.xhr = xhr; // possibility to cancel.***
	
	this.blocksList_requested++;
	
	loadWithXhr(fileName, xhr).done(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			blocksList.dataArraybuffer = arrayBuffer;
			blocksList.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			arrayBuffer = null;
			
			
			magoManager.parseQueue.putOctreeLod0ModelsToParse(lowestOctree);
		}
		else 
		{
			blocksList.fileLoadState = 500;
		}
	}).fail(function(status) 
	{
		console.log("Invalid XMLHttpRequest status = " + status);
		if (status === 0) { blocksList.fileLoadState = 500; }
		else if (status === -1) { blocksList.fileLoadState = CODE.fileLoadState.READY; }
		else { blocksList.fileLoadState = status; }
	}).always(function() 
	{
		magoManager.readerWriter.blocksList_requested--;
		magoManager.fileRequestControler.modelRefFilesRequestedCount -= 1;
		if (magoManager.fileRequestControler.modelRefFilesRequestedCount < 0) { magoManager.fileRequestControler.modelRefFilesRequestedCount = 0; }
	});
};

ReaderWriter.prototype.getNeoBlocksArraybuffer_partition = function(fileName, lowestOctree, magoManager) 
{
	magoManager.fileRequestControler.modelRefFilesRequestedCount += 1;
	//var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
	//blocksList.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	//var xhr;
	////xhr = new XMLHttpRequest();
	//blocksList.xhr = xhr; // possibility to cancel.***
	
	this.blocksListPartitioned_requested++;
	
	loadWithXhr(fileName, xhr).done(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			blocksList.dataArraybuffer = arrayBuffer;
			blocksList.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			arrayBuffer = null;
			
			
			magoManager.parseQueue.putOctreeLod0ModelsToParse(lowestOctree);
		}
		else 
		{
			blocksList.fileLoadState = 500;
		}
	}).fail(function(status) 
	{
		console.log("Invalid XMLHttpRequest status = " + status);
		if (status === 0) { blocksList.fileLoadState = 500; }
		else if (status === -1) { blocksList.fileLoadState = CODE.fileLoadState.READY; }
		else { blocksList.fileLoadState = status; }
	}).always(function() 
	{
		magoManager.readerWriter.blocksListPartitioned_requested--;
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
ReaderWriter.prototype.getNeoReferencesArraybuffer = function(fileName, lowestOctree, magoManager) 
{
	if (lowestOctree.neoReferencesMotherAndIndices === undefined)
	{ return; }
	
	magoManager.fileRequestControler.modelRefFilesRequestedCount += 1;
	lowestOctree.neoReferencesMotherAndIndices.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var xhr;
	//xhr = new XMLHttpRequest();
	lowestOctree.neoReferencesMotherAndIndices.xhr = xhr;
	
	this.referencesList_requested++;
	loadWithXhr(fileName, xhr).done(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			var neoRefsList = lowestOctree.neoReferencesMotherAndIndices;
			if (neoRefsList)
			{
				neoRefsList.dataArraybuffer = arrayBuffer;
				neoRefsList.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				magoManager.parseQueue.putOctreeLod0ReferencesToParse(lowestOctree);
			}
			arrayBuffer = null;
			
		}
		else 
		{
			lowestOctree.neoReferencesMotherAndIndices.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
		}
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) 
		{ lowestOctree.neoReferencesMotherAndIndices.fileLoadState = CODE.fileLoadState.LOAD_FAILED; }
		else if (status === -1) 
		{ lowestOctree.neoReferencesMotherAndIndices.fileLoadState = CODE.fileLoadState.READY; }
		else 
		{ lowestOctree.neoReferencesMotherAndIndices.fileLoadState = status; }
	}).always(function() 
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
	
	loadWithXhr(fileName, xhr).done(function(response) 
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
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { lowestOctree.lego.fileLoadState = 500; }
		else { lowestOctree.lego.fileLoadState = status; }
	}).always(function() 
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
	
	loadWithXhr(fileName).done(function(response) 
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
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { lowestOctree.lego.fileLoadState = 500; }
		else { lowestOctree.lego.fileLoadState = status; }
	}).always(function() 
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
	magoManager.readerWriter.pCloudPartitions_requested++;
	
	loadWithXhr(fileName).done(function(response) 
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
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { pCloudPartitionLego.fileLoadState = 500; }
		else { pCloudPartitionLego.fileLoadState = status; }
	}).always(function() 
	{
		magoManager.readerWriter.pCloudPartitions_requested--;
		if (magoManager.readerWriter.pCloudPartitions_requested < 0)
		{ magoManager.readerWriter.pCloudPartitions_requested = 0; }
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
	
	loadWithXhr(fileName, xhr).done(function(response) 
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
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { legoMesh.fileLoadState = 500; }
		//else { legoMesh.fileLoadState = status; }
		else 
		{ 
			legoMesh.fileLoadState = -1; 
		}
	}).always(function() 
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
 * @param gl gl context
 * @param fileName 파일명
 * @param readerWriter 파일 처리를 담당
 * @param neoBuildingsList object index 파일을 파싱한 정보를 저장할 배열
 */
ReaderWriter.prototype.getObjectIndexFileForSmartTile = function(fileName, magoManager, buildingSeedList, projectId) 
{
	loadWithXhr(fileName).done(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			buildingSeedList.dataArrayBuffer = arrayBuffer;
			buildingSeedList.parseBuildingSeedArrayBuffer();
			
			magoManager.makeSmartTile(buildingSeedList, projectId);
			arrayBuffer = null;
			//MagoConfig.setObjectIndex("append", );
		}
		else 
		{
			// blocksList.fileLoadState = 500;
		}
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		//		if(status === 0) blocksList.fileLoadState = 500;
		//		else blocksList.fileLoadState = status;
	}).always(function() 
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
	loadWithXhr(fileName).done(function(response) 
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
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		//		if(status === 0) blocksList.fileLoadState = 500;
		//		else blocksList.fileLoadState = status;
	}).always(function() 
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

	loadWithXhr(fileName).done(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			if (neoBuilding.metaData === undefined) 
			{
				neoBuilding.metaData = new MetaData();
			}
			
			var metaData = neoBuilding.metaData;
			var bytesReaded = metaData.parseFileHeaderAsimetricVersion(arrayBuffer, readerWriter);
			
			// Now, make the neoBuilding's octree.***
			if (neoBuilding.octree === undefined) { neoBuilding.octree = new Octree(undefined); }
			neoBuilding.octree.neoBuildingOwnerId = neoBuilding.buildingId;
			neoBuilding.octree.octreeKey = neoBuilding.buildingId + "_" + neoBuilding.octree.octree_number_name;
			
			// now, parse octreeAsimetric or octreePyramid (check metadata.projectDataType).***
			if (metaData.projectDataType === 5)
			{ bytesReaded = neoBuilding.octree.parsePyramidVersion(arrayBuffer, readerWriter, bytesReaded, neoBuilding); }
			else
			{ bytesReaded = neoBuilding.octree.parseAsimetricVersion(arrayBuffer, readerWriter, bytesReaded, neoBuilding); }

			metaData.oct_min_x = neoBuilding.octree.centerPos.x - neoBuilding.octree.half_dx;
			metaData.oct_max_x = neoBuilding.octree.centerPos.x + neoBuilding.octree.half_dx;
			metaData.oct_min_y = neoBuilding.octree.centerPos.y - neoBuilding.octree.half_dy;
			metaData.oct_max_y = neoBuilding.octree.centerPos.y + neoBuilding.octree.half_dy;
			metaData.oct_min_z = neoBuilding.octree.centerPos.z - neoBuilding.octree.half_dz;
			metaData.oct_max_z = neoBuilding.octree.centerPos.z + neoBuilding.octree.half_dz;
			
			// now parse materialsList of the neoBuilding.
			//var ver0 = neoBuilding.metaData.version[0];
			//var ver1 = neoBuilding.metaData.version[2];
			//var ver2 = neoBuilding.metaData.version[4];
			
			if (metaData.version === "0.0.1" || metaData.version === "0.0.2")
			{
				// read materials list.
				var materialsCount = readerWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				for (var i=0; i<materialsCount; i++)
				{
					var textureTypeName = "";
					var textureImageFileName = "";

					// Now, read the texture_type and texture_file_name.***
					var texture_type_nameLegth = readerWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
					for (var j=0; j<texture_type_nameLegth; j++) 
					{
						textureTypeName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)));bytesReaded += 1; // for example "diffuse".***
					}

					var texture_fileName_Legth = readerWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
					var charArray = new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ texture_fileName_Legth)); bytesReaded += texture_fileName_Legth;
					var decoder = new TextDecoder('utf-8');
					textureImageFileName = decoder.decode(charArray);
					
					if (texture_fileName_Legth > 0)
					{
						var texture = new Texture();
						texture.textureTypeName = textureTypeName;
						texture.textureImageFileName = textureImageFileName;
						
						if (neoBuilding.texturesLoaded === undefined)
						{ neoBuilding.texturesLoaded = []; }
						
						neoBuilding.texturesLoaded.push(texture);
					}
				}
				
				// read geometry type data.***
				var lod;
				var nameLength;
				var lodBuildingDatasCount = (new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)))[0];bytesReaded += 1;
				if (lodBuildingDatasCount !== undefined)
				{
					neoBuilding.lodBuildingDatasMap = {};
					
					for (var i =0; i<lodBuildingDatasCount; i++)
					{
						var lodBuildingData = new LodBuildingData();
						lodBuildingData.lod = (new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)))[0];bytesReaded += 1;
						lodBuildingData.isModelRef = (new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)))[0];bytesReaded += 1;
						
						if (lodBuildingData.lod === 2)
						{
							// read the lod2_textureFileName.***
							nameLength = (new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)))[0];bytesReaded += 1;
							lodBuildingData.textureFileName = "";
							for (var j=0; j<nameLength; j++) 
							{
								lodBuildingData.textureFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)));bytesReaded += 1; 
							}
						}
						
						if (!lodBuildingData.isModelRef)
						{
							nameLength = (new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)))[0];bytesReaded += 1;
							lodBuildingData.geometryFileName = "";
							for (var j=0; j<nameLength; j++) 
							{
								lodBuildingData.geometryFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)));bytesReaded += 1; 
							}
							
							nameLength = (new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)))[0];bytesReaded += 1;
							lodBuildingData.textureFileName = "";
							for (var j=0; j<nameLength; j++) 
							{
								lodBuildingData.textureFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)));bytesReaded += 1; 
							}
						}
						neoBuilding.lodBuildingDatasMap[lodBuildingData.lod] = lodBuildingData;
					}

				}
			}

			metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;

			//BR_Project._f4d_header_readed_finished = true;
			arrayBuffer = undefined;
		}
		else 
		{
			neoBuilding.metaData.fileLoadState = 500;
			arrayBuffer = undefined;
		}
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		if (status === 0) { neoBuilding.metaData.fileLoadState = 500; }
		else { neoBuilding.metaData.fileLoadState = status; }
	}).always(function() 
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
		loadWithXhr(filePath_inServer).done(function(response) 
		{
			var arrayBuffer = response;
			if (arrayBuffer) 
			{
				// decode tga.***
				// Test with tga decoder from https://github.com/schmittl/tgajs
				var tga = new TGA();
				tga.load(arrayBuffer);
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
					else 
					{
						var hola = 0;

					}
				}
			}
		}).fail(function(status) 
		{
			if (neoBuilding)
			{
				console.log("xhr status = " + status);
				if (status === 0) { neoBuilding.metaData.fileLoadState = 500; }
				else { neoBuilding.metaData.fileLoadState = status; }
			}
		}).always(function() 
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
				return;
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
	
	loadWithXhr(fileName).done(function(response) 
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
	}).fail(function(status) 
	{
		console.log("Invalid XMLHttpRequest status = " + status);
		if (status === 0) { dataContainer.fileLoadState = 500; }
		else { dataContainer.fileLoadState = status; }
	}).always(function() 
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
ReaderWriter.loadImage = function(gl, filePath_inServer, texture) 
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
		
		function createTexture(_gl, filter, data, width, height) 
		{
			var textureAux = _gl.createTexture();
			_gl.bindTexture(_gl.TEXTURE_2D, textureAux);
			//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
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
			}
			_gl.bindTexture(_gl.TEXTURE_2D, null);
			//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
			return textureAux;
		}

		texture.texId = createTexture(gl, gl.LINEAR, image);
		texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED; // file load finished.***
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
ReaderWriter.prototype.readLegoSimpleBuildingTexture = function(gl, filePath_inServer, texture, magoManager) 
{
	var neoRefImage = new Image();
	texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	magoManager.fileRequestControler.lowLodImagesRequestedCount += 1;

	neoRefImage.onload = function() 
	{
		if (texture.texId === undefined) 
		{ texture.texId = gl.createTexture(); }

		handleTextureLoaded(gl, neoRefImage, texture.texId);
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

	loadWithXhr(fileName).done(function(response) 
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
	}).fail(function(status) 
	{
		console.log("xhr status = " + status);
		//		if(status === 0) blocksList.fileLoadState = 500;
		//		else blocksList.fileLoadState = status;
	}).always(function() 
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
	
	loadWithXhr(fileName).done(function(response) 
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
	}).fail(function(status) 
	{
		tinTerrain.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
		//console.log("xhr status = " + status);
		//if (status === 0) { lowestOctree.neoReferencesMotherAndIndices.fileLoadState = 500; }
		//else { lowestOctree.neoReferencesMotherAndIndices.fileLoadState = status; }
	}).always(function() 
	{
		//magoManager.fileRequestControler.modelRefFilesRequestedCount -= 1;
		//if (magoManager.fileRequestControler.modelRefFilesRequestedCount < 0) { magoManager.fileRequestControler.modelRefFilesRequestedCount = 0; }
	});
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param imageArrayBuffer 변수
 * @param magoManager 변수
 */
ReaderWriter.prototype.imageFromArrayBuffer = function(gl, imageArrayBuffer, texture, magoManager) 
{
	// example: allowedFileTypes = ["image/png", "image/jpeg", "image/gif"];
	var blob = new Blob( [ imageArrayBuffer ], { type: "image/png" } );
	var urlCreator = window.URL || window.webkitURL;
	var imagenUrl = urlCreator.createObjectURL(blob);
	var imageFromArray = new Image();

	imageFromArray.onload = function () 
	{
		if (texture.texId === undefined)
		{ texture.texId = gl.createTexture(); }
		handleTextureLoaded(gl, imageFromArray, texture.texId);
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
ReaderWriter.prototype.loadWMSImage = function(gl, filePath_inServer, texture, magoManager) 
{
	texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
	var readWriter = this;
	loadWithXhr(filePath_inServer).done(function(response) 
	{
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			readWriter.imageFromArrayBuffer(gl, arrayBuffer, texture, magoManager);
		}
	}).fail(function(status) 
	{
		var hola = 0;
		
	}).always(function() 
	{
		magoManager.backGround_fileReadings_count -= 1;
		if (magoManager.backGround_fileReadings_count < 0) { magoManager.backGround_fileReadings_count = 0; }
	});
		
};

ReaderWriter.prototype.handleTextureLoaded = function(gl, image, texture) 
{
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
	//var gl = viewer.scene.context._gl;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
};

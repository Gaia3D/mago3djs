'use strict';

var worker = self;

worker.onmessage = function (e) 
{
    var dataArrayBuffer = e.data.dataArrayBuffer;
	var bytesReaded = 0;
    var prefix = 'F4D_';
    var enc = new TextDecoder("utf-8");
	
	// parse smartTileF4d.***
	var bytesReaded = 0;
	var smartTileType = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	// smartTileType = 2 -> smartTile with "lod" included. Load "smartTiles_lod5", "smartTiles_lod4" or "smartTiles_lod3".

	var buildingsCount = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	//magoManager.emit(MagoManager.EVENT_TYPE.SMARTTILELOADSTART, {tile: this, timestamp: new Date()});
    var buildingsArray = new Array(buildingsCount);

	//var smartTilePathInfo = magoManager.f4dController.smartTilePathInfo;
	for (var i=0; i<buildingsCount; i++)
	{
        var buildingData = {};

        // read projectId.************************************************************************************************************
		buildingData.projectId = "";
		var wordLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		buildingData.projectId = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ wordLength))) ;bytesReaded += wordLength;
		
		// read buildingId.************************************************************************************************************
		buildingData.buildingId = "";
		wordLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		buildingData.buildingId = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ wordLength))) ;bytesReaded += wordLength;
		buildingData.buildingId = buildingData.buildingId.startsWith(prefix) ? buildingData.buildingId.substr(4, buildingData.buildingId.length-4) : buildingData.buildingId;

        // read metaData (header).****************************************************************************************************
        var metadataByteSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + metadataByteSize;
		buildingData.neoBuildingHeaderData = dataArrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + metadataByteSize; // updating data.

        // Read lodMeshes.************************************************************************************************************
        var lodString = "lod5"; // default.
		if (smartTileType === 2)
		{
			// NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".***
			var lod = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
			lodString = "lod" + lod.toString();
		}
        buildingData.lodString = lodString;

		var lodNameLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		buildingData.lodName = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ lodNameLength))) ;bytesReaded += lodNameLength;
		
		// read lod5/4/3 mesh data.
		var lod5meshSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + lod5meshSize;
		buildingData.lowLodMeshDataArray = dataArrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + lod5meshSize; // updating data.

		// read lod5/4/3 image.
		var lod5ImageSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var byteSize = 1;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + byteSize * lod5ImageSize;
		buildingData.lodBuildingTextureData = dataArrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + byteSize * lod5ImageSize; // updating data.

		// read geographicCoord.
        buildingData.longitude = (new Float64Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	    buildingData.latitude = (new Float64Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	    buildingData.altitude = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;

		// read euler angles degree.
        buildingData.rotX = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
        buildingData.rotY = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
        buildingData.rotZ = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;

		// Read dataId & dataGroup.
		buildingData.dataId = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		buildingData.dataGroupId = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;

		// read data_name.
        var externInfo = {};
		var dataName;
		var endMark = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
		if(endMark > 0)
		{
			var dataKeyLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
			var dataKey = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataKeyLength))) ;bytesReaded += dataKeyLength;
			var dataNameLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
			var dataName = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataNameLength))) ;bytesReaded += dataNameLength;
			endMark = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
		}

		// Now, read attributtes.
		while (endMark > 0)
		{
			// There are more data.
			// 0 = there are not next data.***
			// 1 = bool
			// 2 = char
			// 3 = short
			// 4 = int
			// 5 = string
			// 6 = float
			// 50 = keyValueDatasList.

			// 1rst, read the stringKey.
			var dataKeyLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
			var dataKey = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataKeyLength))) ;bytesReaded += dataKeyLength;

			if (endMark === 1) // the next data is bool type data.***
			{
				// read the bool value.
				var boolValue = (new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
				// Put the readed data into externInfo.***
				externInfo[dataKey] = boolValue ? true : false;
			}
			else if (endMark === 2) // the next data is char type data.***
			{
				// read the char value.
				var charValue = (new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;

				// Put the readed data into externInfo.***
				externInfo[dataKey] = charValue;
			}
			else if (endMark === 3) // the next data is short type data.***
			{
				// read the short value.
				var shortValue = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
				// Put the readed data into externInfo.***
				externInfo[dataKey] = shortValue;
			}
			else if (endMark === 4) // the next data is int type data.***
			{
				// read the int value.
				var intValue = (new Uint32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
				// Put the readed data into externInfo.***
				externInfo[dataKey] = intValue;
			}
			else if (endMark === 5) // the next data is string type data.***
			{
				// read the string value.
				var dataValueLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
				var charArray = new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataValueLength)); bytesReaded += dataValueLength;
				var decoder = new TextDecoder('utf-8');
				var dataValueUtf8 = decoder.decode(charArray);
				
				// Put the readed data into externInfo.***
				externInfo[dataKey] = dataValueUtf8;
			}
			else if (endMark === 6) // the next data is float type data.***
			{
				// read the float value.
				var floatValue = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
				// Put the readed data into externInfo.***
				externInfo[dataKey] = floatValue;
			}
			
			endMark = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
		}
        buildingData.externInfo = externInfo;
        buildingsArray[i] = buildingData;
    }

    worker.postMessage({parsedSmartTile : 
        {
            buildingsArray : buildingsArray, 
            smartTileType : smartTileType
        },
        info: e.data.info});
		
}
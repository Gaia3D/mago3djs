'use strict';

var worker = self;

// Pass object by reference from/to webworker
// https://developers.redhat.com/blog/2014/05/20/communicating-large-objects-with-web-workers-in-javascript/

worker.onmessage = function (e) 
{
    var dataArrayBuffer = e.data.dataArrayBuffer;
	var bytesReaded = 0;

    // BoundingBox.
	//bytesReaded = bbox.readData(buffer, bytesReaded);
    var bboxSize = new Float32Array(6);
    bboxSize[0] = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	bboxSize[1] = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	bboxSize[2] = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	bboxSize[3] = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	bboxSize[4] = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	bboxSize[5] = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;

	// VBO(Position Buffer) - x,y,z
	var numPositions = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	var byteSize = 4;
	var startBuff = bytesReaded;
	var endBuff = bytesReaded + byteSize * numPositions * 3;
	var posDataArray = new Float32Array(dataArrayBuffer.slice(startBuff, endBuff));
	//vboCacheKey.setDataArrayPos(posDataArray, vboMemManager);
	bytesReaded = bytesReaded + byteSize * numPositions * 3; // updating data.
	
	// VBO(Normal Buffer) - i,j,k
    var norDataArray;
	var hasNormals = (new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasNormals)
	{
		var numNormals = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		byteSize = 1;
		startBuff = bytesReaded;
		endBuff = bytesReaded + byteSize * numNormals * 3;
		norDataArray = new Int8Array(dataArrayBuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + byteSize * numNormals * 3; // updating data.
	}

	// VBO(Color Buffer) - r,g,b,a
    var colDataArray;
	var hasColors = (new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasColors)
	{
		var numColors = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		byteSize = 1;
		startBuff = bytesReaded;
		endBuff = bytesReaded + byteSize * numColors * 4;
		colDataArray = new Uint8Array(dataArrayBuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + byteSize * numColors * 4; // updating data.
	}

	// VBO(TextureCoord Buffer) - u,v
    var texCoordDataArray;
	var hasTexCoords = (new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasTexCoords)
	{
		var dataType = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		var numCoords = (new Uint32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		byteSize = 4;
		startBuff = bytesReaded;
		endBuff = bytesReaded + byteSize * numCoords * 2;
		texCoordDataArray = new Float32Array(dataArrayBuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + byteSize * numCoords * 2; // updating data.
	}

	var parsedLego = {
		texCoordsArray       : texCoordDataArray,   
		posDataArray      : posDataArray,
		norDataArray : norDataArray,
		colDataArray  : colDataArray,
		info: e.data.info,
		bboxSize : bboxSize
	};

	var transferBuffers = [];

	if(parsedLego.texCoordsArray)
	{
		transferBuffers.push(parsedLego.texCoordsArray.buffer);
	}

	if(parsedLego.posDataArray)
	{
		transferBuffers.push(parsedLego.posDataArray.buffer);
	}

	if(parsedLego.norDataArray)
	{
		transferBuffers.push(parsedLego.norDataArray.buffer);
	}

	if(parsedLego.colDataArray)
	{
		transferBuffers.push(parsedLego.colDataArray.buffer);
	}

    worker.postMessage(parsedLego, transferBuffers);
};
'use strict';

/**
 * @class MgBuffer
 * @constructor 
 */
var MgBuffer = function (options) 
{
	if (!(this instanceof MgBuffer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.uri = undefined;
	this.dataLength = undefined;
	this.name = undefined;
	this.glType = undefined;
	this.dataDimensions;
	this.dataTarget;

	this.mgOwner;

	if (options)
	{
		if (options.name)
		{
			this.name = options.name;
		}

		if (options.mgOwner)
		{
			this.mgOwner = options.mgOwner;
		}
	}

	this.bufferData = undefined; // raw data blob.
	this.glBuffer; // webGl object.
};

/**
 * Returns the glType of the array
 */
MgBuffer.getGlTypeOfArray = function (dataArray) 
{
	var glType = -1;
	if (dataArray.constructor === Float32Array)
	{ glType = 5126; } // gl.FLOAT.
	else if (dataArray.constructor === Int16Array)
	{ glType = 5122; } // gl.SHORT.
	else if (dataArray.constructor === Uint16Array)
	{ glType = 5123; } // gl.UNSIGNED_SHORT.
	else if (dataArray.constructor === Int8Array)
	{ glType = 5120; } // gl.BYTE.
	else if (dataArray.constructor === Uint8Array)
	{ glType = 5121; } // gl.UNSIGNED_BYTE.
	
	return glType;
};
 
/**
  * Returns typedArray
  */
MgBuffer.newTypedArray = function(arrayLength, glType) 
{
	var typedArray;
	if (glType === 5126)// gl.FLOAT.
	{ typedArray = new Float32Array(arrayLength); }
	else if (glType === 5122)// gl.SHORT.
	{ typedArray = new Int16Array(arrayLength); }
	else if (glType === 5123)// gl.UNSIGNED_SHORT.
	{ typedArray = new Uint16Array(arrayLength); }
	else if (glType === 5120)// gl.BYTE.
	{ typedArray = new Int8Array(arrayLength); }
	else if (glType === 5121)// gl.UNSIGNED_BYTE.
	{ typedArray = new Uint8Array(arrayLength); }
		
	return typedArray;
};
 
/**
  * Returns the byteSize of the glType.
  */
MgBuffer.getByteSizeByGlType = function(glType) 
{
	if (glType === 5126)// gl.FLOAT.
	{ return 4; }
	else if (glType === 5122)// gl.SHORT.
	{ return 2; }
	else if (glType === 5123)// gl.UNSIGNED_SHORT.
	{ return 2; }
	else if (glType === 5120)// gl.BYTE.
	{ return 1; }
	else if (glType === 5121)// gl.UNSIGNED_BYTE.
	{ return 1; }
		
	return undefined;
};

MgBuffer.getCopyTypedArray = function(originalArray) 
{
	//var glType = MgBuffer.getGlTypeOfArray(originalArray);
	//var destinationArray = MgBuffer.newTypedArray(originalArray.length, glType);
	//destinationArray.set(originalArray);
	//return destinationArray;
	return originalArray.slice();
};

MgBuffer._newTypedArray = function (length, glType)
{
	var newArray;
	if (glType === 5126)// gl.FLOAT.
	{
		newArray = new Float32Array(length);
	}
	else if (glType === 5122)// gl.SHORT.
	{
		newArray = new Int16Array(length);
	}
	else if (glType === 5123)// gl.UNSIGNED_SHORT.
	{
		newArray = new Uint16Array(length);
	}
	else if (glType === 5120)// gl.BYTE.
	{
		newArray = new Int8Array(length);
	}
	else if (glType === 5121)// gl.UNSIGNED_BYTE.
	{
		newArray = new Uint8Array(length);
	}

	return newArray;
};

MgBuffer.prototype.setBufferData = function (bufferData)
{
	this.glType = MgBuffer.getGlTypeOfArray(bufferData);
	this.bufferData = bufferData;
	this.dataLength = bufferData.length;
};

MgBuffer.prototype.getElementsCount = function ()
{
	if (this.dataLength === undefined)
	{
		this.dataLength = this.bufferData.length;
	}
	return this.dataLength / this.dataDimensions;
};

MgBuffer.makeMgBufferFromMgBufferViewsArray = function (mgBufferViewsArray, resultMgBuffer, elemsCountsArray)
{
	var mgBufferViewsCount = mgBufferViewsArray.length;
	if (mgBufferViewsCount === 0)
	{
		return;
	}

	if (!resultMgBuffer)
	{
		resultMgBuffer = new MgBuffer();
	}

	// must calculate the total length of all mgBuffers.***
	if (!resultMgBuffer.bufferData)
	{
		resultMgBuffer.bufferData = [];
	}
	var totalLength = 0;
	var mgBufferAux = mgBufferViewsArray[0].aux_auxMgBuffer;

	var glType = MgBuffer.getGlTypeOfArray(mgBufferAux.bufferData); // take the "glType" from the 1rst mgBufferView.
	var byteSize = MgBuffer.getByteSizeByGlType(glType);
	var dataTarget = mgBufferAux.dataTarget;
	for (var i=0; i<mgBufferViewsCount; i++)
	{
		var mgBufferAux = mgBufferViewsArray[i].aux_auxMgBuffer;
		totalLength += mgBufferAux.bufferData.length;
	}

	var newArray = MgBuffer._newTypedArray(totalLength, glType);
	var currentLength = 0;
	var posOffset = 0; // must calculate the positionOffset. // use elemsCountsArray.***

	for (var i=0; i<mgBufferViewsCount; i++)
	{
		var mgBufferView = mgBufferViewsArray[i];
		var mgBufferAux = mgBufferView.aux_auxMgBuffer;
		var attribName = mgBufferAux.name;
		// Now set the bufferViewParameters.***
		mgBufferView.setMgBuffer(resultMgBuffer);
		mgBufferView.setByteOffset(currentLength * byteSize);
		mgBufferView.setByteLength(mgBufferAux.bufferData.length * byteSize);

		// Now, set the newArray.***
		if (attribName === "INDICE")
		{
			// Must recalculate indices.***
			// Must know the mgBufferViewOwner.***
			
			var dataArray = mgBufferAux.bufferData;
			var dataLength = dataArray.length;
			var glType = MgBuffer.getGlTypeOfArray(dataArray);
			var recalculatedIndices = MgBuffer.newTypedArray(dataLength, glType);
			
			if (i > 0)
			{
				posOffset += elemsCountsArray[i-1];
			}
			for (var j=0; j<dataLength; j++)
			{
				recalculatedIndices[j] = dataArray[j] + posOffset;
			}
			newArray.set(recalculatedIndices, currentLength);
		}
		else
		{
			newArray.set(mgBufferAux.bufferData, currentLength);
		}
		
		currentLength += mgBufferAux.bufferData.length;

		// now, delete the aux_bufferData.***
		delete mgBufferAux.bufferData;
	}

	resultMgBuffer.bufferData = newArray;
	resultMgBuffer.dataLength = totalLength;
	resultMgBuffer.glType = glType;
	resultMgBuffer.dataTarget = dataTarget;
	return resultMgBuffer;
};

MgBuffer.bindBuffer = function (gl, dataTarget, glBuffer, vertexAttribLocation, dataDimensions, dataGlType, bNormalized, dataStride, dataOffSet)
{
	if (vertexAttribLocation < 0)
	{
		gl.disableVertexAttribArray(vertexAttribLocation);
		return false;
	}

	if (dataStride === undefined)
	{
		dataStride = 0;
	}

	if (dataOffSet === undefined)
	{
		dataOffSet = 0;
	}

	gl.enableVertexAttribArray(vertexAttribLocation);
	gl.bindBuffer(dataTarget, glBuffer);
	gl.vertexAttribPointer(vertexAttribLocation, dataDimensions, dataGlType, bNormalized, dataStride, dataOffSet);
	return true;
};
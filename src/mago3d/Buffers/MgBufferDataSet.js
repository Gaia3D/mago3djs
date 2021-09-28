'use strict';

/**
 * @class MgBufferDataSet
 * @constructor 
 */
var MgBufferDataSet = function (options) 
{
	if (!(this instanceof MgBufferDataSet)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// Here stores vboDataArray of all attributes, as "POSITION3", "NORMAL3", "TEXCOORD2", "COLOR4", "INDICE" or other custom.
	this.buffersMap = {};
	this.bHasIndices;
	this.mgOwner;
	this.mgBufferViewSet;

	if (options)
	{
		if (options.mgOwner)
		{
			this.mgOwner = options.mgOwner;
		}
	}
};

MgBufferDataSet.prototype.getOrNewMgBuffer = function(attributeName)
{
	if (!this.buffersMap[attributeName])
	{
		this.buffersMap[attributeName] = new MgBuffer({mgOwner: this});
	}

	return this.buffersMap[attributeName];
};

MgBufferDataSet.prototype.setBufferData = function(bufferData, attributeName)
{
	var mgBuffer = this.getOrNewMgBuffer(attributeName);
	mgBuffer.setBufferData(bufferData);

};

MgBufferDataSet.prototype.getMgBuffer = function (attributeName)
{
	return this.buffersMap[attributeName];
};

MgBufferDataSet.makeMgBufferDataSetFromMgBufferViewSetArray = function (mgBufferViewSetArray, resultMgBufferDataSet)
{
	var map_attrib_mgBufferViewsArray = {};
	var mgBufferViewSetsCount = mgBufferViewSetArray.length;
	for (var i=0; i<mgBufferViewSetsCount; i++)
	{
		var mgBufferViewSet = mgBufferViewSetArray[i];

		// do a collection of each mgBuffers.
		var bufferViewsMap = mgBufferViewSet.bufferViewsMap;
		for (var key in bufferViewsMap) 
		{
			if (bufferViewsMap.hasOwnProperty(key)) 
			{
				var mgBufferView = mgBufferViewSet.getMgBufferView(key);
				if (!map_attrib_mgBufferViewsArray[key])
				{
					map_attrib_mgBufferViewsArray[key] = [];
				}
				map_attrib_mgBufferViewsArray[key].push(mgBufferView);
			}
		}
	}

	// Now, for each attribute, merge the dataArrays.***
	if (!resultMgBufferDataSet)
	{
		resultMgBufferDataSet = new MgBufferDataSet();
	}

	// make the mgBufferViewSet for the "resultMgBufferDataSet".
	resultMgBufferDataSet.mgBufferViewSet = new MgBufferViewSet();
	var mgBufferViewSetTotal = resultMgBufferDataSet.mgBufferViewSet;
	for (var key in map_attrib_mgBufferViewsArray) 
	{
		if (map_attrib_mgBufferViewsArray.hasOwnProperty(key)) 
		{
			var mgBufferViewsArray = map_attrib_mgBufferViewsArray[key];
			
			var mgBuffer = resultMgBufferDataSet.getOrNewMgBuffer(key);
			mgBuffer = MgBuffer.makeMgBufferFromMgBufferViewsArray(mgBufferViewsArray, mgBuffer);

			// Set the mgBufferView for the total mgBuferViewSet.***
			var mgBufferViewTotal = mgBufferViewSetTotal.getOrNewMgBufferView(key);
			var glType = mgBuffer.glType;
			var byteSize = MgBuffer.getByteSizeByGlType(glType);
			var dataLegth = mgBuffer.dataLength;
			mgBufferViewTotal.setMgBuffer(mgBuffer);
			mgBufferViewTotal.setByteOffset(0);
			mgBufferViewTotal.setByteLength(dataLegth * byteSize);

			var hola = 0;
		}
	}

	var hola = 0;
	return resultMgBufferDataSet;
};

MgBufferDataSet.prototype.bindBuffers = function (gl, shader)
{
	var mgBufferViewSetTotal = this.mgBufferViewSet;
	var bufferViewsMap = mgBufferViewSetTotal.bufferViewsMap;
	for (var key in bufferViewsMap) 
	{
		// "key" is the attribute name.
		if (bufferViewsMap.hasOwnProperty(key)) 
		{
			var mgBufferView = mgBufferViewSetTotal.getMgBufferView(key);
			var mgBuffer = mgBufferView.mgBuffer;

			// 1rst, check if exist "glBuffer" of the mgBuffer.
			if (!mgBuffer.glBuffer)
			{
				// create a webglBuffer.***
				mgBuffer.glBuffer = FBO.createBuffer(gl, mgBuffer.bufferData);
				//FBO.createBuffer = function (gl, data) {
				//	var buffer = gl.createBuffer();
				//	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
				//	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
				//	return buffer;
				//  };
			}

			// Now, bind buffer.***
			// need the attribute location of the shader.***
			var attribLocation = shader.getAttribLocation(key);
			//gl.bindBuffer(this.dataTarget, this.key); // data target = gl.ARRAY_BUFFER.
			//gl.vertexAttribPointer(vertexAttribIndex, this.dataDimensions, this.dataGlType, this.normalized, this.dataStride, this.dataOffSet);
			var hola = 0;
		}
	}
};
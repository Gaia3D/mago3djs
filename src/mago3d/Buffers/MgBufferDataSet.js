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
	this.materialId = -1;
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

MgBufferDataSet.prototype.setMaterialId = function(matId)
{
	this.materialId = matId;
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
	// In this function makes an unique MgBufferDataSet from multiple mgBuffers.***
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

	//******************************************************************************************************************
	// If exist "INDICE" array, then, must recalculate the indices into the global indicesArray.
	// 1rst, must know the currentElemsCount, to use when add indices.***
	// currentElemsCount = currVertexCount = currNormalsCount = currTexCoordsCount = currColorsCount.***
	// We use the vertexCount as currElemsCount.***
	// elemsCount cannot be higher than 65535.***
	var vertexMgBufferViewsArray = map_attrib_mgBufferViewsArray.POSITION3;
	var mgBuffViewsCount = vertexMgBufferViewsArray.length;
	var elemsCountsArray = [];
	for (var i=0; i<mgBuffViewsCount; i++)
	{
		var posBufferWiew = vertexMgBufferViewsArray[i];
		var elemsCount = posBufferWiew.aux_auxMgBuffer.getElementsCount();
		elemsCountsArray.push(elemsCount);
	}

	//-------------------------------------------------------------------------------------------------------------------

	// Now, for each attribute, merge the dataArrays.***
	if (!resultMgBufferDataSet)
	{
		resultMgBufferDataSet = new MgBufferDataSet();
	}

	// make the mgBufferViewSet for the "resultMgBufferDataSet".
	resultMgBufferDataSet.mgBufferViewSet = new MgBufferViewSet();
	var mgBufferViewSetTotal = resultMgBufferDataSet.mgBufferViewSet;
	var elemsCount = 0;// necessary var for indices_array.***
	for (var key in map_attrib_mgBufferViewsArray) 
	{
		if (map_attrib_mgBufferViewsArray.hasOwnProperty(key)) 
		{
			var mgBufferViewsArray = map_attrib_mgBufferViewsArray[key];
			
			var mgBuffer = resultMgBufferDataSet.getOrNewMgBuffer(key);
			mgBuffer = MgBuffer.makeMgBufferFromMgBufferViewsArray(mgBufferViewsArray, mgBuffer, elemsCountsArray);

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
				mgBuffer.glBuffer = FBO.createBuffer(gl, mgBuffer.bufferData, mgBuffer.dataTarget);
			}

			// Now, bind buffer.***
			var indicesCount = 0;
			if (key === "INDICE")
			{
				gl.bindBuffer(mgBuffer.dataTarget, mgBuffer.glBuffer);
				indicesCount = mgBuffer.dataLength;
			}
			else
			{
				// need the attribute location of the shader.***
				var attribLocation = shader.getAttribLocation(key);
				var dataTarget = mgBuffer.dataTarget; //gl.ARRAY_BUFFER;
				var dataDimensions = 3;
				var dataGlType = mgBuffer.glType;
				var bNormalized = false;
				var dataStride;
				var dataOffSet;
				MgBuffer.bindBuffer(gl, dataTarget, mgBuffer.glBuffer, attribLocation, dataDimensions, dataGlType, bNormalized, dataStride, dataOffSet);
				var hola = 0;
			}

			
		}
	}

	// provisionally do render here.***
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
	gl.uniform4fv(shader.oneColor4_loc, [0.25, 0.5, 0.95, 1.0]);
	//var vertices_count = mgBuffer.dataLength / dataDimensions;
	//gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	
	gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0);
};
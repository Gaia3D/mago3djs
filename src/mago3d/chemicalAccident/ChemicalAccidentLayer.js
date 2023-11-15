'use strict';

/**
 * @class PollutionTimeSlice
 */
var ChemicalAccidentTimeSlice = function(options) 
{
	 if (!(this instanceof ChemicalAccidentTimeSlice)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this._fileLoadState = CODE.fileLoadState.READY;
	 this._filePath;
	 this._jsonFile;
	 this._isPrepared = false;
	 this._glTexture;
	 this.owner = undefined;

	 this._texture3dCreated = false;
	 this._texture3d;
	 this._mosaicTexture; // note : the mosaicTexture is a Texture3D too.***
	 this._texture2dAux;	// aux texture.***

	 // uniforms.***
	this.uMinMaxAltitudeSlices = undefined; // the uniform (vec2) is limited to 32.***

	 if (options !== undefined)
	 {
		if (options.filePath)
		{
			this._filePath = options.filePath;
		}

		if (options.owner)
		{
			this.owner = options.owner;
		}
	 }
};

ChemicalAccidentTimeSlice.prototype.getTotalMinMaxAltitudes = function ()
{
	var dataSlicesArray = this._jsonFile.dataSlices;
	var dataSlicesCount = dataSlicesArray.length;
	var resultTotalMinMaxAltitudes = new Float32Array(2);
	resultTotalMinMaxAltitudes[0] = dataSlicesArray[0].minAltitude;
	resultTotalMinMaxAltitudes[1] = dataSlicesArray[dataSlicesCount-1].maxAltitude;
	return resultTotalMinMaxAltitudes;
};

ChemicalAccidentTimeSlice.loadTexture = function (imagePath, texture, magoManager, flip_y_texCoord)
{
	var imageToLoad = new Image();
	texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;

	imageToLoad.onload = function() 
	{
		var gl = magoManager.getGl();
		
		if (texture.texId !== undefined && texture.texId !== null) 
		{ 
			gl.deleteTexture(texture.texId);
		}
		
		if (flip_y_texCoord === undefined)
		{ flip_y_texCoord = false; }
		
		texture.imageWidth = imageToLoad.width;
		texture.imageHeight = imageToLoad.height;

		var texWrap = gl.CLAMP_TO_EDGE;
		var filter = gl.NEAREST;
		var bPremultiplyAlphaWebgl = false;

		texture.texId = Texture.createTexture(gl, filter, imageToLoad, texture.imageWidth, texture.imageHeight, texWrap, bPremultiplyAlphaWebgl);
		texture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
	};

	imageToLoad.onerror = function() 
	{
		texture.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
	};
	imageToLoad.crossOrigin = "Anonymous";
	imageToLoad.src = imagePath;
};

ChemicalAccidentTimeSlice.prototype._prepare = function ()
{
	if (this._isPrepared)
	{
		return true;
	}

	if (this._fileLoadState === CODE.fileLoadState.READY)
	{
		this._fileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;

		loadWithXhr(this._filePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that._fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that._jsonFile = res;
		});
	}

	if (this._fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	if (this.uMinMaxAltitudeSlices === undefined)
	{
		this.uMinMaxAltitudeSlices = new Float32Array(2 * 32); // 32 is the max slices count.***

		// make the minmaxAltitudeSlices.***
		var dataSlicesArray = this._jsonFile.dataSlices;
		var dataSlicesCount = dataSlicesArray.length;
		for (var i=0; i<dataSlicesCount; i++)
		{
			var dataSlice = dataSlicesArray[i];
			this.uMinMaxAltitudeSlices[i*2] = dataSlice.minAltitude;
			this.uMinMaxAltitudeSlices[i*2+1] = dataSlice.maxAltitude;
		}
	}

	// load the mosaicTexture.***
	if (this._mosaicTexture === undefined)
	{
		this._mosaicTexture = new MagoTexture3D();
	}

	if (this._texture2dAux === undefined)
	{
		this._texture2dAux = new Texture();
	}

	if (this._texture2dAux.fileLoadState === CODE.fileLoadState.READY)
	{
		this._texture2dAux.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		var mosaicTextureFolderPath = this.owner.chemicalAccidentManager._geoJsonIndexFileFolderPath;
		var mosaicTextureFilePath = mosaicTextureFolderPath + "\\" + this._jsonFile.mosaicTextureFileName;
		var flip_y_texCoord = false;

		var byteDataArray = this._jsonFile.byteData; // embeded data.***
		var mosaicTexWidth = this._jsonFile.width;
		var mosaicTexHeight = this._jsonFile.height;

		// check if exist embeded data.***
		if (byteDataArray === undefined)
		{
			// load the mosaicTexture from file.***
			ChemicalAccidentTimeSlice.loadTexture(mosaicTextureFilePath, this._texture2dAux, this.owner.chemicalAccidentManager.magoManager, flip_y_texCoord);
			return false;
		}
		else 
		{
			var dataLength = byteDataArray.length;
			var uint8Array = new Uint8Array(dataLength); // rgba.***
			for (var i=0; i<dataLength; i++)
			{
				uint8Array[i] = byteDataArray[i];
			}

			// make texture with the embedded data into json file.***
			var magoManager = this.owner.chemicalAccidentManager.magoManager;
			var gl = magoManager.getGl();
			
			var texWrap = gl.CLAMP_TO_EDGE;
			var filter = gl.NEAREST;
			var bPremultiplyAlphaWebgl = false;

			this._texture2dAux.texId = Texture.createTexture(gl, filter, uint8Array, mosaicTexWidth, mosaicTexHeight, texWrap, bPremultiplyAlphaWebgl);
			this._texture2dAux.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;

			this._jsonFile.byteData = undefined; // free memory.***

			this._mosaicTexture.texturesArray.push(this._texture2dAux.texId);
			this._mosaicTexture.finalTextureXSize = mosaicTexWidth;
			this._mosaicTexture.finalTextureYSize = mosaicTexHeight;
			this._mosaicTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
			this._isPrepared = true;
		}

		return false;
	}

	if (this._texture2dAux.fileLoadState === CODE.fileLoadState.LOAD_FAILED )
	{
		return false;
	}
	
	// check if the mosaicTexture is loaded.***
	if (this._texture2dAux.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED )
	{
		return false;
	}

	if (this._texture2dAux.fileLoadState === CODE.fileLoadState.BINDING_FINISHED && this._mosaicTexture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		this._mosaicTexture.texturesArray.push(this._texture2dAux.texId);
		this._texture2dAux.texId = undefined;
		this._mosaicTexture.finalTextureXSize = this._mosaicTexture.mosaicXCount * this._texture2dAux.imageWidth;
		this._mosaicTexture.finalTextureYSize = this._mosaicTexture.mosaicYCount * this._texture2dAux.imageHeight;
		this._mosaicTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
		this._isPrepared = true;
	}


	return false;
};

/**
 * 
 *This function returns a uint8array from an arraybuffer.
 */
ChemicalAccidentTimeSlice.getUint8ArrayRGBAFromArrayBuffer = function(arrayBuffer)
{
	 var uint8Array = new Uint8Array(arrayBuffer.length * 4); // rgba.***
	 var dataLength = arrayBuffer.length;
	 for (var i=0; i<dataLength; i++)
	 {
		 var value = arrayBuffer[i];
		 var encodedRgba = ManagerUtils.packDepth(value);
 
		 uint8Array[i*4] = encodedRgba[0] * 255;
		 uint8Array[i*4+1] = encodedRgba[1] * 255;
		 uint8Array[i*4+2] = encodedRgba[2] * 255;
		 uint8Array[i*4+3] = encodedRgba[3] * 255;
	 }

	 
	 return uint8Array;
};

ChemicalAccidentTimeSlice.prototype.getMinMaxPollutionValues = function ()
{
	if (this.minMaxPollutionValues === undefined)
	{
		this.minMaxPollutionValues = new Float32Array(2);
		this.minMaxPollutionValues[0] = this._jsonFile.minValue;
		this.minMaxPollutionValues[1] = this._jsonFile.maxValue;
	}

	return this.minMaxPollutionValues;
};

ChemicalAccidentTimeSlice.prototype._makeTextures = function (gl, minmaxPollutionValues)
{
	if (!this._texture3dCreated)
	{
		var slicesCount = this._jsonFile.dataSlices.length;

		var someSlice = this._jsonFile.dataSlices[0];

		this._mosaicTexture.mosaicXCount = this._jsonFile.mosaicColumnsCount;
		this._mosaicTexture.mosaicYCount = this._jsonFile.mosaicRowsCount;
		this._mosaicTexture.texture3DXSize = someSlice.width;
		this._mosaicTexture.texture3DYSize = someSlice.height;
		this._mosaicTexture.texture3DZSize = slicesCount; 

		this._texture3dCreated = true;
	}

	return this._texture3dCreated;
};

//------------------------------------------------------------------------------------------------------------

//************************************************************************************************************
//************************************************************************************************************
/**
 * @class ChemicalAccidentLayer
 */
var ChemicalAccidentLayer = function(options) 
{
	if (!(this instanceof ChemicalAccidentLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.chemicalAccidentManager = undefined;
	this.geographicExtent;

	this._geoJsonIndexFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonIndexFile;
	this._geoJsonIndexFilePath;
	this._geoJsonIndexFileFolderPath;
	this._allLayersArePrepared = false;

	this._animationState = CODE.processState.NO_STARTED; 
	this._animationStartTime = 0;
	this._totalAnimTime;
	this._increTime;

	this._timeSlicesArray;

	this._isPrepared = false;
	//this._terrainSamplingState = CODE.processState.NO_STARTED;

	this._mosaicTexMetaDataFileNamesArray;
	this._metadataFolderPath;

	// object to render.***
	this.simulationBox = undefined;
	this.vboKeysContainer;
	this.volumeDepthFBO = undefined;
	this.screenFBO = undefined;

	

	if (options)
	{
		if (options.mosaicTexMetaDataFileNames)
		{
			this._mosaicTexMetaDataFileNamesArray = options.mosaicTexMetaDataFileNames;
		}

		if (options.chemicalAccidentManager)
		{
			this.chemicalAccidentManager = options.chemicalAccidentManager;
		}

		if (options.timeInterval_min !== undefined)
		{
			this.timeInterval_min = options.timeInterval_min;
		}

		if (options.timeSlicesCount !== undefined)
		{
			this.timeSlicesCount = options.timeSlicesCount;
		}

		if (options.timeSliceFileNames !== undefined)
		{
			this.timeSliceFileNames = options.timeSliceFileNames;
		}

		if (options.metadataFolderPath !== undefined)
		{
			this._metadataFolderPath = options.metadataFolderPath;
		}
	}

};

ChemicalAccidentLayer.prototype.getTotalAnimationTimeMinutes = function ()
{
	var timeInterval_min = this.timeInterval_min;
	var timeSlicesCount = this._timeSlicesArray.length;
	var totalAnimTimeMinutes = timeInterval_min * timeSlicesCount;
	return totalAnimTimeMinutes;
};

ChemicalAccidentLayer.prototype._load_indexFile = function (indexFilePath)
{
	if (this._geoJsonIndexFileLoadState === CODE.fileLoadState.READY)
	{
		this._geoJsonIndexFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._geoJsonIndexFilePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that._geoJsonIndexFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that._geoJsonIndexFile = res;
		});
	}
};


ChemicalAccidentLayer.prototype._makeSimulationBox = function ()
{
	// make the depth box.***
	// the depth box is used for volumetric rendering. The depthBox renders rearFaces & frontFaces, so
	// creates the volumetric zone.***
	//-------------------------------------------------------------------------------------------------

	// 1. Calculate the rectangle in local coord.***
	var magoManager = this.chemicalAccidentManager.magoManager;

	var geoJsonIndexFile = this.chemicalAccidentManager._geoJsonIndexFile;
	var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;

	// must find the 4 geoCoords of the rectangle.***
	var widthMeters = geoJsonIndexFile.width_km * 1000.0;
	var heightMeters = geoJsonIndexFile.height_km * 1000.0;
	var semiWidthMeters = widthMeters / 2.0;
	var semiHeightMeters = heightMeters / 2.0;

	// create the local rectangle.***
	var pointsLCArray = [];

	// leftDown corner.***
	var point3d = new Point2D(-semiWidthMeters, -semiHeightMeters);
	pointsLCArray.push(point3d);

	// rightDown corner.***
	point3d = new Point2D(semiWidthMeters, -semiHeightMeters);
	pointsLCArray.push(point3d);

	// rightUp corner.***
	point3d = new Point2D(semiWidthMeters, semiHeightMeters);
	pointsLCArray.push(point3d);

	// leftUp corner.***
	point3d = new Point2D(-semiWidthMeters, semiHeightMeters);
	pointsLCArray.push(point3d);

	var profile2d = Profile2D.fromPoint2DArray(pointsLCArray);

	// take the 1rst timeSlice:
	var timeSlice = this._timeSlicesArray[0];
	var totalMinMaxAltitudes = timeSlice.getTotalMinMaxAltitudes();
	var extrusionDist = totalMinMaxAltitudes[1] - totalMinMaxAltitudes[0];
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var bIncludeBottomCap = undefined;
	var bIncludeTopCap = undefined;
	var surfIndepMesh = Modeler.getExtrudedMesh(profile2d, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);

	// now make the renderable object of the simulationBox.***
	if (!this.simulationBox)
	{
		this.simulationBox = new RenderableObject();
	}
	this.simulationBox.geoLocDataManager = new GeoLocationDataManager();
	var geoLocDataOfBox = this.simulationBox.geoLocDataManager.newGeoLocationData();
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();

	geoLocDataOfBox.copyFrom(geoLocData);

	this.simulationBox.objectsArray.push(surfIndepMesh);
	var hola = 0;
};

ChemicalAccidentLayer.prototype._getVolumeDepthFBO = function()
{
	//      +-----------+-----------+
	//      |           |           | 
	//      |   tex_0   |   tex_1   |
	//      |           |           |
	//      +-----------+-----------+
	// Note : the width of fbo must be the double of the screen width.***
	if (!this.volumeDepthFBO)
	{
		var magoManager = this.chemicalAccidentManager.magoManager;
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0] * 2; // double of the screen width.***
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.volumeDepthFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 4}); 
	}

	return this.volumeDepthFBO;
};

ChemicalAccidentLayer.prototype._getScreenFBO = function(magoManager)
{
	// This is a screen size FBO.***
	if (!this.screenFBO)
	{
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0]; 
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.screenFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 4}); 
	}

	return this.screenFBO;
};

ChemicalAccidentLayer.prototype._renderDepthVolume = function ()
{
	// Render depth 2 times:
	// 1- render the rear faces.
	// 2- render the front faces.
	//-------------------------------
	var magoManager = this.chemicalAccidentManager.magoManager;
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();
	var extbuffers = magoManager.extbuffers;

	// Now, render the windPlane.
	if (!this.visibleObjControler)
	{
		this.visibleObjControler = new VisibleObjectsController();
	}

	//this.simulationBox = this._getSimulationBox(magoManager);

	if (this.simulationBox)
	{ this.visibleObjControler.currentVisibleNativeObjects.opaquesArray[0] = this.simulationBox; }

	// Bind FBO.***
	//      +-----------------+----------------+
	//      |                 |                | 
	//      |   front depth   |   rear depth   |
	//      |                 |                |
	//      +-----------------+----------------+
	// Note : the width of fbo must be the double of the screen width.***

	// Front Face.***************************************************************************************************************************
	var doubleFBO = this._getVolumeDepthFBO(magoManager);

	this.simulBoxdoubleDepthTex = doubleFBO.colorBuffersArray[1];
	this.simulBoxDoubleNormalTex = doubleFBO.colorBuffersArray[2];

	//var currentShader = magoManager.postFxShadersManager.getShader("gBuffer"); 
	//magoManager.postFxShadersManager.useProgram(currentShader);
	//gl.uniform1i(currentShader.clippingType_loc, 0);

	doubleFBO.bind();
	gl.viewport(0, 0, doubleFBO.width[0]/2, doubleFBO.height[0]);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, doubleFBO.colorBuffersArray[0], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, doubleFBO.colorBuffersArray[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, doubleFBO.colorBuffersArray[2], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, doubleFBO.colorBuffersArray[3], 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex (front).
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
	  ]);

	//if (magoManager.isFarestFrustum())// === 2)
	if (magoManager.currentFrustumIdx === 2)
	{
		gl.clearColor(0, 0, 0, 0);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
	}

	gl.clear(gl.DEPTH_BUFFER_BIT);

	var renderType = 1;
	gl.frontFace(gl.CCW);
	magoManager.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControler);

	// End front face.---------------------------------------------------------------------------------------------------------------------------

	// Rear Face.***************************************************************************************************************************
	gl.viewport(doubleFBO.width[0]/2, 0, doubleFBO.width[0]/2, doubleFBO.height[0]);


	var renderType = 1;
	gl.frontFace(gl.CW);
	magoManager.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControler);
	// End rear face.---------------------------------------------------------------------------------------------------------------------------

	// unbind fbo.***
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);
	doubleFBO.unbind();

	// Return to main framebuffer.************************
	// return default values:
	gl.frontFace(gl.CCW);
	/*
	magoManager.bindMainFramebuffer();

	// unbind mago colorTextures:
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
	]);
	*/
};

ChemicalAccidentLayer.prototype._makeTextures = function (gl, minmaxPollutionValues)
{
	var allTimeSlicesTexturesMade = true;
	var timeSlicesCount = this._timeSlicesArray.length;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		if (!timeSlice._makeTextures(gl, minmaxPollutionValues))
		{
			allTimeSlicesTexturesMade = false;
		}
	}

	return allTimeSlicesTexturesMade;

};

ChemicalAccidentLayer.prototype.render = function ()
{
	// render the depthBox.***
	if (this.simulationBox === undefined)
	{
		this._makeSimulationBox();
	}

	if (this.renderCounter === undefined)
	{
		this.renderCounter = 0;
	}

	this.renderCounter += 1;

	var magoManager = this.chemicalAccidentManager.magoManager;
	var gl = magoManager.getGl();

	// animation time control.***
	var timeSlicesCount = this._timeSlicesArray.length;
	var totalAnimTime = this.chemicalAccidentManager._totalAnimTime; 
	var increTime = this.chemicalAccidentManager._increTime;

	var timeFactor = increTime / totalAnimTime;
	var f = timeFactor * timeSlicesCount;
	var ffract = f - Math.floor(f); // this is the interpolation factor between currTex & nextTex.***
	var texIdxCurr = Math.floor(f);

	if (texIdxCurr > this._timeSlicesArray.length - 1)
	{
		texIdxCurr = this._timeSlicesArray.length - 1;
	}
	else if (texIdxCurr < 0 )
	{
		texIdxCurr = 0;
	}

	this.chemicalAccidentManager.counterAux; // test.***

	if (this.chemicalAccidentManager.counterAux === 0)
	{
		this.testCurrIdx = texIdxCurr;
		
	}
	else 
	{
		//this.testCurrIdx = 1024; // test hardcode.***
		if (this.counterTest === undefined)
		{
			this.counterTest = this.renderCounter;
		}
	}

	//if (this.chemicalAccidentManager.counterAux === 0)
	//{
	//	return;
	//}

	// test check.************************************************************************************************************
	/*
	var imageWidth = 450;
	var imageHeight = 450;
	var dataSize = imageWidth * imageHeight * 4;
	if (this.pixelsData === undefined)
	{
		this.pixelsData = new Uint8Array(dataSize);  // Un arreglo de 4 bytes para almacenar los valores RGBA de un píxel
	}
	var testTimeSlice = this._timeSlicesArray[this.testCurrIdx];
	var webGlTex = testTimeSlice._mosaicTexture.getTexture( 0 );
	
	gl.bindTexture(gl.TEXTURE_2D, webGlTex);
	gl.readPixels(0, 0, imageWidth, imageHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.pixelsData);
	gl.bindTexture(gl.TEXTURE_2D, null);

	var totalDataR = 0;
	var totalDataG = 0;
	var totalDataB = 0;
	var totalDataA = 0;
	for (var i=0; i<dataSize; i+=4)
	{
		totalDataR += this.pixelsData[i];
		totalDataG += this.pixelsData[i+1];
		totalDataB += this.pixelsData[i+2];
		totalDataA += this.pixelsData[i+3];
	}

	if (totalDataR !== 0 || totalDataG !== 0 || totalDataB !== 0 || totalDataA !== 51637500)
	{ 
		var hola = 0; 
	}

	if (totalDataR === 0 && totalDataG === 0 && totalDataB === 0 && totalDataA === 0)
	{ 
		var hola = 0; 
	}
	*/
	// end test check.************************************************************************************************************
		

	//if (texIdxCurr >= timeSlicesCount)
	////{
	//	texIdxCurr = timeSlicesCount - 1;
	//}

	//var texIdxNext = texIdxCurr + 1;
	//if (texIdxNext >= timeSlicesCount)
	//{
	//	texIdxNext = texIdxCurr;
	//}

	// end animation time control.---

	this._renderDepthVolume();
	
	// Now, do volumetric render with the mosaic textures 3d.***
	
	var chemicalAccidentManager = this.chemicalAccidentManager;
	var sceneState = magoManager.sceneState;
	
	var fbo = this._getScreenFBO(magoManager);
	var extbuffers = fbo.extbuffers;

	this.volumRenderTex = fbo.colorBuffersArray[0];

	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);

	var screenQuad = chemicalAccidentManager.getQuadBuffer();
	var shader = magoManager.postFxShadersManager.getShader("volumetric"); // (waterQuadVertVS, chemicalAccidentVolumRenderFS)
	magoManager.postFxShadersManager.useProgram(shader);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, fbo.colorBuffersArray[0], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, fbo.colorBuffersArray[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, fbo.colorBuffersArray[2], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, fbo.colorBuffersArray[3], 0);

	// Test:
	this.volumRenderTex = fbo.colorBuffersArray[0];

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] 
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3]
	  ]);

	//if (magoManager.isFarestFrustum())// === 2)
	if (magoManager.currentFrustumIdx === 2)
	{
		gl.clearColor(0, 0, 0, 0);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
	}

	gl.clear(gl.DEPTH_BUFFER_BIT);

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos_loc, 2);

	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);

	
	var testTimeSlice = this._timeSlicesArray[this.testCurrIdx];
	var refTex3D = testTimeSlice._mosaicTexture; // a reference texture3D, to take parameters for the shader.***

	// bind uniforms.***
	shader.bindUniformGenerals();

	var screenQuad = chemicalAccidentManager.getQuadBuffer();

	// bind screenQuad positions.
	FBO.bindAttribute(gl, screenQuad.posBuffer, shader.a_pos_loc, 2);

	
	gl.uniform1iv(shader.u_texSize_loc, [refTex3D.texture3DXSize, refTex3D.texture3DYSize, refTex3D.texture3DZSize]); // The original texture3D size.***
	gl.uniform1iv(shader.u_mosaicSize_loc, [refTex3D.mosaicXCount, refTex3D.mosaicYCount, refTex3D.finalSlicesCount]); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(shader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);
	var minMaxPollutionValues = this.getMinMaxPollutionValues();
	gl.uniform2fv(shader.u_minMaxPollutionValues_loc, [minMaxPollutionValues[0], minMaxPollutionValues[1]]);
	
	gl.uniform1f(shader.u_airEnvirontmentPressure_loc, 0); // delete this. no necessary.***
	gl.uniform2fv(shader.u_screenSize_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	gl.uniform2fv(shader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
	gl.uniform3fv(shader.u_voxelSizeMeters_loc, [this.oneVoxelSizeInMeters[0], this.oneVoxelSizeInMeters[1], this.oneVoxelSizeInMeters[2]]); // The one voxel size in meters.***

	var geoLocDataManager = this.simulationBox.geoLocDataManager;
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var simulBoxMatInv = geoLocData.getRotMatrixInv();
	gl.uniformMatrix4fv(shader.u_simulBoxTMat_loc, false, geoLocData.rotMatrix._floatArrays);
	gl.uniformMatrix4fv(shader.u_simulBoxTMatInv_loc, false, simulBoxMatInv._floatArrays);
	gl.uniform3fv(shader.u_simulBoxPosHigh_loc, geoLocData.positionHIGH);
	gl.uniform3fv(shader.u_simulBoxPosLow_loc, geoLocData.positionLOW);

	var bboxLC = this.simulationBox.getBoundingBoxLC();
	gl.uniform3fv(shader.u_simulBoxMinPosLC_loc, [bboxLC.minX, bboxLC.minY, bboxLC.minZ]);
	gl.uniform3fv(shader.u_simulBoxMaxPosLC_loc, [bboxLC.maxX, bboxLC.maxY, bboxLC.maxZ]);

	// uMinMaxAltitudeSlices is a vec2 array.***
	gl.uniform2fv(shader.uMinMaxAltitudeSlices_loc, testTimeSlice.uMinMaxAltitudeSlices);

	
	// bind textures.***
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.simulBoxdoubleDepthTex); 

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.simulBoxDoubleNormalTex); 

	// provisionally take the 1rst timeSlice.***
	var testTimeSlice = this._timeSlicesArray[this.testCurrIdx];


	gl.activeTexture(gl.TEXTURE2);
	var webGlTex = testTimeSlice._mosaicTexture.getTexture( 0 );

	gl.bindTexture(gl.TEXTURE_2D, webGlTex); 

	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex); 

	gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.normalTex); 

	// Draw screenQuad:
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);

	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	fbo.unbind();

};

ChemicalAccidentLayer.prototype.getContaminationValue = function(posWC, currTime)
{
	// posWC = position in world coordinates.***
	if (!this._prepareLayer())
	{
		return undefined;
	}

	var contaminationValue = 0.0;

	// convert posWC to posLC.***
	var geoLocDataManager = this.simulationBox.geoLocDataManager;
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var posLC = geoLocData.worldCoordToLocalCoord(posWC, undefined);

	var hola = 0;

};

ChemicalAccidentLayer.prototype.getMinMaxPollutionValues = function ()
{
	if (this.minMaxPollutionValues === undefined)
	{
		this.minMaxPollutionValues = new Float32Array(2); 

		var timeSliceCount = this._timeSlicesArray.length;
		for (var i=0; i<timeSliceCount; i++)
		{
			var timeSlice = this._timeSlicesArray[i];
			var minMaxValues = timeSlice.getMinMaxPollutionValues();
			if (i === 0)
			{
				this.minMaxPollutionValues[0] = minMaxValues[0];
				this.minMaxPollutionValues[1] = minMaxValues[1];
			}
			else
			{
				if (minMaxValues[0] < this.minMaxPollutionValues[0])
				{ this.minMaxPollutionValues[0] = minMaxValues[0]; }
	
				if (minMaxValues[1] > this.minMaxPollutionValues[1])
				{ this.minMaxPollutionValues[1] = minMaxValues[1]; }
			}
		}
	}	
	
	return this.minMaxPollutionValues;
};

ChemicalAccidentLayer.prototype._prepareLayer = function ()
{
	if (this._isPrepared)
	{
		return true;
	}

	// check if all timeSliceFiles are loaded.***
	if (this._timeSlicesArray === undefined)
	{
		this._timeSlicesArray = [];
	}

	if (this._timeSlicesArray.length === 0)
	{
		// start to load files.***
		var timeSliceFileNamesCount = this._mosaicTexMetaDataFileNamesArray.length;
		for (var i=0; i<timeSliceFileNamesCount; i++)
		{
			var filePath = this._metadataFolderPath + "\\" + this._mosaicTexMetaDataFileNamesArray[i];
			var options = {
				filePath : filePath,
				owner    : this
			};
			var timeSlice = new ChemicalAccidentTimeSlice(options);
			this._timeSlicesArray.push(timeSlice);
		}

		return false;
	}

	// now, check if all timeSlices are ready.***
	var isPrepared = true;
	var timeSlicesCount = this._timeSlicesArray.length;
	var counterAux = 0;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		if (!timeSlice._prepare())
		{
			isPrepared = false;
			counterAux++;
		}

		if (counterAux > 2)
		{ break; }
	}

	if (!isPrepared)
	{
		return false;
	}

	


	// create a voxelizer.***
	if (!this.voxelizer)
	{
		// The voxelizer here is used to make the mosaicTexture from textures3D.***
		// note : the mosaicTexture is Texture3D too.***
		var options = {};
		this.voxelizer = new Voxelizer(options);
	}

	if (!this.oneVoxelSizeInMeters)
	{
		this.oneVoxelSizeInMeters = new Float32Array([1.0, 1.0, 1.0]);

		var someSlice3D = this._timeSlicesArray[0];

		var geoJsonIndexFile = this.chemicalAccidentManager._geoJsonIndexFile;
		var widthMeters = geoJsonIndexFile.height_km * 1000.0;
		var heightMeters = geoJsonIndexFile.width_km * 1000.0;

		// take any slice2d to get columnsCount and rowsCount.***
		var slice2d = someSlice3D._jsonFile.dataSlices[0];
		var columnsCount = slice2d.width;
		var rowsCount = slice2d.height;

		this.oneVoxelSizeInMeters[0] = widthMeters / columnsCount;
		this.oneVoxelSizeInMeters[1] = heightMeters / rowsCount;
		this.oneVoxelSizeInMeters[2] = this.oneVoxelSizeInMeters[0]; // in z direction is the same.***
	}

	// Now make the textures3D.***
	if (!this._allTimeSlicesTextures3DReady)
	{
		if (this.minMaxPollutionValues === undefined)
		{
			this.minMaxPollutionValues = new Float32Array(2); 
		}
		var someSlice3D = this._timeSlicesArray[0];
		this.minMaxPollutionValues[0] = someSlice3D._jsonFile.minValue;
		this.minMaxPollutionValues[1] = someSlice3D._jsonFile.maxValue;

		var magoManager = this.chemicalAccidentManager.magoManager;
		var gl = magoManager.sceneState.gl;
		//var minmaxPollutionValues = this.getMinMaxPollutionValues();
		this._makeTextures(gl, this.minMaxPollutionValues);
	}
	

	// Now, make the surface mesh.***
	if (this._timeSlicesArray.length === 0)
	{
		return false;
	}

	if (this._terrainSampled === undefined)
	{
		this._terrainSampled = false;
	}

	if (this.geoLocDataManager === undefined)
	{
		// Now, calculate the geoCoord of the centerPos.***
		var geoJsonIndexFile = this.chemicalAccidentManager._geoJsonIndexFile;
		var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;

		this.geoLocDataManager = new GeoLocationDataManager();

		var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
		if (geoLocData === undefined)
		{
			geoLocData = this.geoLocDataManager.newGeoLocationData("default");
		}

		var heading = 0.0;
		var pitch = 0.0;
		var roll = 0.0;

		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);
	}

	// make the depth box.***
	// the depth box is used for volumetric rendering. The depthBox renders rearFaces & frontFaces, so
	// creates the volumetric zone.***
	if (!this.simulationBox)
	{
		this._makeSimulationBox();
	}




	// If all process are finished, then set isPrepared as true.***
	this._isPrepared = true;

	return this._isPrepared;
};
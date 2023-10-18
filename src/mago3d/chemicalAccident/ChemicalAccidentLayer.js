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

	this._isPrepared = true;

	return this._isPrepared;
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
		this._texture3d = new MagoTexture3D();
		this._mosaicTexture = new MagoTexture3D();

		var slicesCount = 15; // test hardcoding.***

		// set texture3d params.***
		this._texture3d.texture3DXSize = this._jsonFile.columnsCount;
		this._texture3d.texture3DYSize = this._jsonFile.rowsCount;
		this._texture3d.texture3DZSize = slicesCount; // test HARDCODING.***

		// The 3D texture into a mosaic texture matrix params.***
		var result = Voxelizer.getMosaicColumnsAndRows(this._texture3d.texture3DXSize, this._texture3d.texture3DYSize, this._texture3d.texture3DZSize);
		var mosaicXCount = result.numColumns;
		var mosaicYCount = result.numRows;
		this._mosaicTexture.mosaicXCount = mosaicXCount;
		this._mosaicTexture.mosaicYCount = mosaicYCount;
		this._mosaicTexture.texture3DXSize = this._jsonFile.columnsCount;
		this._mosaicTexture.texture3DYSize = this._jsonFile.rowsCount;
		this._mosaicTexture.texture3DZSize = slicesCount; // slices count = 1.***
		this._mosaicTexture.finalTextureXSize = this._mosaicTexture.mosaicXCount * this._texture3d.texture3DXSize;
		this._mosaicTexture.finalTextureYSize = this._mosaicTexture.mosaicYCount * this._texture3d.texture3DYSize;
		this._mosaicTexture.createTextures(gl);

		// Now, create the textures using the data of jsonFile.***
		// Must transform textureData(array) to Uint8Array type data.***
		var minValue = this._jsonFile.minValue;
		var maxValue = this._jsonFile.maxValue;
		var minValueTotal = minmaxPollutionValues[0];
		var maxValueTotal = minmaxPollutionValues[1];
		var valueRange = maxValue - minValue;
		var valueTotalRange = maxValueTotal - minValueTotal;

		var dataLength = this._jsonFile.values.length;
		for (var i=0; i<dataLength; i++)
		{
			var value = this._jsonFile.values[i];
			var realValue = value * valueRange + minValue;

			var quantizedValue = (realValue - minValueTotal) / valueTotalRange;
			//var encodedRgba = ManagerUtils.packDepth(value);
	
			this._jsonFile.values[i] = quantizedValue;
		}

		var textureData = ChemicalAccidentTimeSlice.getUint8ArrayRGBAFromArrayBuffer(this._jsonFile.values);

		
		// Do hard coding for test.***
		// test : use "textureData" for all slices.***
		var texSlicesCount = this._texture3d.texture3DZSize;
		for (var i=0; i<texSlicesCount; i++)
		{
			this._texture3d.createTexture(gl, i, textureData);
		}
		//----------------------------------------------------------

		// Now, make the mosaicTexture.***
		var magoManager = this.owner.chemicalAccidentManager.magoManager;
		this._mosaicTexture = Voxelizer.prototype.makeMosaicTexture3DFromRealTexture3D(magoManager, this._texture3d, this._mosaicTexture);

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

	// object to render.***
	this.simulationBox = undefined;
	this.vboKeysContainer;
	this.volumeDepthFBO = undefined;
	this.screenFBO = undefined;

	if (options)
	{
		if (options.chemicalAccidentManager)
		{
			this.chemicalAccidentManager = options.chemicalAccidentManager;
		}

		if (options.altitude !== undefined)
		{
			this.altitude = options.altitude;
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

		if (options.timeSliceFileFolderPath !== undefined)
		{
			this.timeSliceFileFolderPath = options.timeSliceFileFolderPath;
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
	var extrusionDist = 100 * timeSlice._texture3d.texture3DZSize; // z slices count.***
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

	var magoManager = this.chemicalAccidentManager.magoManager;

	// animation time control.***
	var timeSlicesCount = this._timeSlicesArray.length;
	var totalAnimTime = this.chemicalAccidentManager._totalAnimTime; 
	var increTime = this.chemicalAccidentManager._increTime;

	var timeFactor = increTime / totalAnimTime;
	var f = timeFactor * timeSlicesCount;
	var ffract = f - Math.floor(f); // this is the interpolation factor between currTex & nexTex.***
	var texIdxCurr = Math.floor(f);

	if (texIdxCurr > this._timeSlicesArray.length - 1)
	{
		texIdxCurr = this._timeSlicesArray.length - 1;
	}
	else if (texIdxCurr < 0 )
	{
		texIdxCurr = 0;
	}

	this.testCurrIdx = texIdxCurr;

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
	var gl = magoManager.getGl();
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

	
	var testTimeSlice = this._timeSlicesArray[texIdxCurr];
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

	
	
	// bind textures.***
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.simulBoxdoubleDepthTex); 
	//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex); 

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.simulBoxDoubleNormalTex); 

	// provisionally take the 1rst timeSlice.***
	var testTimeSlice = this._timeSlicesArray[texIdxCurr];

	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, testTimeSlice._mosaicTexture.getTexture( 0 )); 

	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex); 

	gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.normalTex); 


	//gl.activeTexture(gl.TEXTURE5);
	//gl.bindTexture(gl.TEXTURE_2D, this.airVelocity_B.getTexture( 0 )); 

	//gl.activeTexture(gl.TEXTURE6);
	//gl.bindTexture(gl.TEXTURE_2D, this.maxPressureMosaicTexture3d_A.getTexture( 0 ));

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
	

	/*
	uniform sampler2D simulationBoxDoubleDepthTex;
	uniform sampler2D simulationBoxDoubleNormalTex; // used to calculate the current frustum idx.***
	uniform sampler2D airPressureMosaicTex;

	////uniform vec3 encodedCameraPositionMCHigh;
	////uniform vec3 encodedCameraPositionMCLow;
	////uniform float tangentOfHalfFovy;
	////uniform float aspectRatio;
	*/
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
		var timeSliceFileNamesCount = this.timeSliceFileNames.length;
		for (var i=0; i<timeSliceFileNamesCount; i++)
		{
			var filePath = this.timeSliceFileFolderPath + "\\" + this.timeSliceFileNames[i];
			var options = {
				filePath : filePath,
				owner    : this
			};
			var timeSlice = new ChemicalAccidentTimeSlice(options);
			this._timeSlicesArray.push(timeSlice);
		}
	}

	// now, check if all timeSlices are ready.***
	var isPrepared = true;
	var timeSlicesCount = this._timeSlicesArray.length;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		if (!timeSlice._prepare())
		{
			isPrepared = false;
		}
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

		var geoJsonIndexFile = this.chemicalAccidentManager._geoJsonIndexFile;
		var widthMeters = geoJsonIndexFile.height_km * 1000.0;
		var heightMeters = geoJsonIndexFile.width_km * 1000.0;

		// take any timeSlice to get columnsCount and rowsCount.***
		var timeSlice = this._timeSlicesArray[0];
		var columnsCount = timeSlice._jsonFile.columnsCount;
		var rowsCount = timeSlice._jsonFile.rowsCount;

		this.oneVoxelSizeInMeters[0] = widthMeters / columnsCount;
		this.oneVoxelSizeInMeters[1] = heightMeters / rowsCount;
		this.oneVoxelSizeInMeters[2] = this.oneVoxelSizeInMeters[0]; // in z direction is the same.***
		
	}

	// Now make the textures3D.***
	if (!this._allTimeSlicesTextures3DReady)
	{
		var magoManager = this.chemicalAccidentManager.magoManager;
		var gl = magoManager.sceneState.gl;
		var minmaxPollutionValues = this.getMinMaxPollutionValues();
		this._makeTextures(gl, minmaxPollutionValues);
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
'use strict';

/**
 * @class AirPollutionTimeSlice
 */
var AirPollutionTimeSlice = function(options) 
{
	 if (!(this instanceof AirPollutionTimeSlice)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this._fileLoadState = CODE.fileLoadState.READY;
	 this._filePath;
	 this._jsonFile;
	 this._isPrepared = false;
	 this._texture = undefined;
	 this._glTexture;
	 this.owner = undefined;

	 this._texture3dCreated = false;
	 this._texture3d;
	 this._mosaicTexture; // note : the mosaicTexture is a Texture3D too.***
	 this._mosaicTexFilePath;

	 this._startUnixTimeMiliseconds;
	 this._endUnixTimeMiliseconds;

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

		if (options.mosaicTexFilePath)
		{
			this._mosaicTexFilePath = options.mosaicTexFilePath;
		}

		if (options.startUnixTimeMiliseconds !== undefined)
		{
			this._startUnixTimeMiliseconds = options.startUnixTimeMiliseconds;
		}

		if (options.endUnixTimeMiliseconds !== undefined)
		{
			this._endUnixTimeMiliseconds = options.endUnixTimeMiliseconds;
		}
	 }
};

AirPollutionTimeSlice.prototype._prepare = function ()
{
	if (this._isPrepared)
	{
		return true;
	}

	if (this._texture === undefined)
	{
		this._texture = new Texture();
		this._texture.fileLoadState = CODE.fileLoadState.READY;
	}

	if (this._texture.fileLoadState === CODE.fileLoadState.READY)
	{
		this._texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		TexturesManager.loadTexture(this._mosaicTexFilePath, this._texture, this.owner.airPollutionManager.magoManager, false);
		//loadWithXhr(this._filePath, undefined, undefined, 'json', 'GET').done(function(res) 
		//{
		//	that._texture = CODE.fileLoadState.LOADING_FINISHED;
		//	//that._jsonFile = res;
		//});
	}

	if (this._texture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return false;
	}

	if (this.uMinMaxAltitudeSlices === undefined)
	{
		this.uMinMaxAltitudeSlices = new Float32Array(2 * 32); // 32 is the max slices count.***

		// make the minmaxAltitudeSlices.***
		// hardcoding. there are 7 levels : 0, 10, 20, 30, 60, 100, 200.***
		this.uMinMaxAltitudeSlices[0] = 0.0; // hardcoding
		this.uMinMaxAltitudeSlices[1] = 10.0;// hardcoding
		this.uMinMaxAltitudeSlices[2] = 10.0;// hardcoding
		this.uMinMaxAltitudeSlices[3] = 20.0;// hardcoding
		this.uMinMaxAltitudeSlices[4] = 20.0;// hardcoding
		this.uMinMaxAltitudeSlices[5] = 30.0;// hardcoding
		this.uMinMaxAltitudeSlices[6] = 30.0;// hardcoding
		this.uMinMaxAltitudeSlices[7] = 60.0;// hardcoding
		this.uMinMaxAltitudeSlices[8] = 60.0;// hardcoding
		this.uMinMaxAltitudeSlices[9] = 100.0;// hardcoding
		this.uMinMaxAltitudeSlices[10] = 100.0;// hardcoding
		this.uMinMaxAltitudeSlices[11] = 200.0;// hardcoding
		this.uMinMaxAltitudeSlices[12] = 200.0;// hardcoding
		this.uMinMaxAltitudeSlices[13] = 400.0;// hardcoding

	}

	this._isPrepared = true;

	return this._isPrepared;
};

AirPollutionTimeSlice.prototype._makeTextures = function (gl, minmaxPollutionValues)
{
	if (!this._texture3dCreated)
	{
		this._texture3d = new MagoTexture3D();
		this._mosaicTexture = new MagoTexture3D();

		this._mosaicTexture.texturesArray.push(this._texture.texId);
		this._texture.texId = undefined;
		this._mosaicTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;

		var slicesCount = 7; // test hardcoding.***
		var geoJsonIndexFile = this.owner.airPollutionManager._geoJsonIndexFile;
		var texWidth = geoJsonIndexFile.layers[0].textureWidth;
		var texHeight = geoJsonIndexFile.layers[0].textureHeight;
		var mosaicXCount = geoJsonIndexFile.mosaicColumnsCount;
		var mosaicYCount = geoJsonIndexFile.mosaicRowsCount;

		// set texture3d params.***
		this._texture3d.texture3DXSize = texWidth;
		this._texture3d.texture3DYSize = texHeight;
		this._texture3d.texture3DZSize = slicesCount;

		
		this._mosaicTexture.mosaicXCount = mosaicXCount;
		this._mosaicTexture.mosaicYCount = mosaicYCount;
		this._mosaicTexture.texture3DXSize = texWidth;
		this._mosaicTexture.texture3DYSize = texHeight;
		this._mosaicTexture.texture3DZSize = slicesCount; // slices count = 1.***
		this._mosaicTexture.finalTextureXSize = this._mosaicTexture.mosaicXCount * this._texture3d.texture3DXSize;
		this._mosaicTexture.finalTextureYSize = this._mosaicTexture.mosaicYCount * this._texture3d.texture3DYSize;


		this._texture3dCreated = true;
	}

	return this._texture3dCreated;
};

//-----------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------

/**
 * @class AirPollutionLayer
 */
var AirPollutionLayer = function(options) 
{
	 if (!(this instanceof AirPollutionLayer)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this.airPollutionManager = undefined;
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

	this.timeSeries;
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
		if (options.airPollutionManager)
		{
			this.airPollutionManager = options.airPollutionManager;
		}

		if (options.timeSeries)
		{
			this.timeSeries = options.timeSeries;
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

AirPollutionLayer.prototype._makeTextures = function (gl, minmaxPollutionValues)
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

AirPollutionLayer.prototype._makeSimulationBox = function ()
{
	// make the depth box.***
	// the depth box is used for volumetric rendering. The depthBox renders rearFaces & frontFaces, so
	// creates the volumetric zone.***
	//-------------------------------------------------------------------------------------------------

	// 1. Calculate the rectangle in local coord.***
	var magoManager = this.airPollutionManager.magoManager;

	var geoJsonIndexFile = this.airPollutionManager._geoJsonIndexFile;
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
	var oneVoxelSizeMeters = this.oneVoxelSizeInMeters[2];
	var extrusionDist = oneVoxelSizeMeters * (timeSlice._texture3d.texture3DZSize); // z slices count.***
	extrusionDist = 200.0; // hardcoding.***
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
};

AirPollutionLayer.prototype._getScreenFBO = function(magoManager)
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

AirPollutionLayer.prototype._getVolumeDepthFBO = function()
{
	//      +-----------+-----------+
	//      |           |           | 
	//      |   tex_0   |   tex_1   |
	//      |           |           |
	//      +-----------+-----------+
	// Note : the width of fbo must be the double of the screen width.***
	if (!this.volumeDepthFBO)
	{
		var magoManager = this.airPollutionManager.magoManager;
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0] * 2; // double of the screen width.***
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.volumeDepthFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 4}); 
	}

	return this.volumeDepthFBO;
};

AirPollutionLayer.prototype._renderDepthVolume = function ()
{
	// Render depth 2 times:
	// 1- render the rear faces.
	// 2- render the front faces.
	//-------------------------------
	var magoManager = this.airPollutionManager.magoManager;
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

AirPollutionLayer.prototype.getTimeSliceIdxByCurrentUnixTimeMiliseconds = function (currUnixTimeMiliseconds)
{
	var timeSlicesCount = this._timeSlicesArray.length;
	var timeSliceIdx = -1;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		if (currUnixTimeMiliseconds >= timeSlice._startUnixTimeMiliseconds && currUnixTimeMiliseconds <= timeSlice._endUnixTimeMiliseconds)
		{
			timeSliceIdx = i;
			break;
		}
	}

	return timeSliceIdx;
};

AirPollutionLayer.prototype.render = function ()
{
	// render the depthBox.***
	if (this.simulationBox === undefined)
	{
		this._makeSimulationBox();
	}

	var magoManager = this.airPollutionManager.magoManager;
	var animTimeController = magoManager.animationTimeController;
	var gl = magoManager.getGl();

	var texIdxCurr = this.getTimeSliceIdxByCurrentUnixTimeMiliseconds(animTimeController._currentUnixTimeMilisec);

	// animation time control.***
	var timeSlicesCount = this._timeSlicesArray.length;
	// var totalAnimTime = this.airPollutionManager._totalAnimTime; 
	// var increTime = this.airPollutionManager._increTime;

	// var timeFactor = increTime / totalAnimTime;
	// var f = timeFactor * timeSlicesCount;
	// var ffract = f - Math.floor(f); // this is the interpolation factor between currTex & nexTex.***
	// var texIdxCurr = Math.floor(f);
	var ffract = 0.5;
	var texIdxNext = texIdxCurr + 1;
	if (texIdxNext >= timeSlicesCount)
	{
		texIdxNext = texIdxCurr;
	}

	if (texIdxCurr > this._timeSlicesArray.length - 1)
	{
		texIdxCurr = this._timeSlicesArray.length - 1;
	}
	else if (texIdxCurr < 0 )
	{
		texIdxCurr = 0;
	}

	this.testCurrIdx = texIdxCurr;

	//this.testCurrIdx = 50;

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
	
	var airPollutionManager = this.airPollutionManager;
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();
	var fbo = this._getScreenFBO(magoManager);
	var extbuffers = fbo.extbuffers;

	this.volumRenderTex = fbo.colorBuffersArray[0];

	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);

	var screenQuad = airPollutionManager.getQuadBuffer();
	var shader = magoManager.postFxShadersManager.getShader("volumetricAirPollution"); // (waterQuadVertVS, chemicalAccidentVolumRenderFS)
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

	var screenQuad = airPollutionManager.getQuadBuffer();

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
	gl.uniform3fv(shader.u_simulBoxMaxPosLC_loc, [bboxLC.maxX, bboxLC.maxY, bboxLC.maxZ]);// 
	
	
	// bind textures.***
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.simulBoxdoubleDepthTex); 
	//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex); 

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.simulBoxDoubleNormalTex); 

	// provisionally take the 1rst timeSlice.***
	var testTimeSlice = this._timeSlicesArray[this.testCurrIdx];
	var timeSliceNext = this._timeSlicesArray[texIdxNext];

	// uMinMaxAltitudeSlices is a vec2 array.***
	gl.uniform2fv(shader.uMinMaxAltitudeSlices_loc, testTimeSlice.uMinMaxAltitudeSlices);

	// Test rendering only 1 slice.******************************************************
	//var testTimeSlice = this._timeSlicesArray[8];
	//var timeSliceNext = this._timeSlicesArray[8];
	//************************************************************************************

	gl.activeTexture(gl.TEXTURE2); // CURRENT time slice.***
	gl.bindTexture(gl.TEXTURE_2D, testTimeSlice._mosaicTexture.getTexture( 0 )); 

	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex); 

	gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.normalTex); 

	gl.activeTexture(gl.TEXTURE5); // NEXT time slice.***
	gl.bindTexture(gl.TEXTURE_2D, timeSliceNext._mosaicTexture.getTexture( 0 )); 


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

AirPollutionLayer.prototype.getMinMaxPollutionValues = function ()
{
	return [0.0, this.airPollutionManager._geoJsonIndexFile.pollutionMaxValue];
};

AirPollutionLayer.prototype._prepareLayer = function ()
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
		// // start to load files.***
		// var geoJsonIndexFile = this.chemicalAccidentManager._geoJsonIndexFile;
		// var year = geoJsonIndexFile.year;
		// var month = geoJsonIndexFile.month - 1; // month is 0 to 11.***
		// var day = geoJsonIndexFile.day;
		// var hour = geoJsonIndexFile.hour;
		// var minute = geoJsonIndexFile.minute;
		// var second = geoJsonIndexFile.second;
		// var millisecond = geoJsonIndexFile.millisecond;

		// var timeIncrementMilisecond = 0;
		// var timeInterval = geoJsonIndexFile.timeInterval;
		// var timeIntervalUnits = geoJsonIndexFile.timeIntervalUnits;

		// if (timeIntervalUnits === "minutes" || timeIntervalUnits === "minute")
		// {
		// 	timeIncrementMilisecond = timeInterval * 60 * 1000;
		// }

		// var date = new Date(year, month, day, hour, minute, second, millisecond);
		// var startUnixTimeMiliseconds = date.getTime();

		// var timeSliceFileNamesCount = geoJsonIndexFile.mosaicTexMetaDataJsonArray.length;
		// for (var i=0; i<timeSliceFileNamesCount; i++)
		// {
		// 	var timeSliceStartUnixTimeMiliseconds = startUnixTimeMiliseconds + i * timeIncrementMilisecond;
		// 	var timeSliceEndUnixTimeMiliseconds = timeSliceStartUnixTimeMiliseconds + timeIncrementMilisecond;
		// 	var options = {
		// 		owner                    : this,
		// 		startUnixTimeMiliseconds : timeSliceStartUnixTimeMiliseconds,
		// 		endUnixTimeMiliseconds   : timeSliceEndUnixTimeMiliseconds
		// 	};
		// 	var timeSlice = new ChemicalAccidentTimeSlice(options);
		// 	timeSlice._jsonFile = geoJsonIndexFile.mosaicTexMetaDataJsonArray[i];
		// 	timeSlice._fileLoadState = CODE.fileLoadState.LOADING_FINISHED;

		// 	this._timeSlicesArray.push(timeSlice);
		// }

		var geoJsonIndexFile = this.airPollutionManager._geoJsonIndexFile;
		var year = geoJsonIndexFile.year;
		var month = geoJsonIndexFile.month - 1; // month is 0 to 11.***
		var day = geoJsonIndexFile.day;
		var hour = geoJsonIndexFile.hour;
		var minute = geoJsonIndexFile.minute;
		var second = geoJsonIndexFile.second;
		var millisecond = 0;

		var timeIncrementMilisecond = 24 * 60 * 60 * 1000; // 1 day.***
		var date = new Date(year, month, day, hour, minute, second, millisecond);
		var startUnixTimeMiliseconds = date.getTime();


		var timeSeriesCount = this.timeSeries.length;
		for (var i=0; i<timeSeriesCount; i++)
		{
			var timeSliceStartUnixTimeMiliseconds = startUnixTimeMiliseconds + i * timeIncrementMilisecond;
		 	var timeSliceEndUnixTimeMiliseconds = timeSliceStartUnixTimeMiliseconds + timeIncrementMilisecond;
			var timeSerie = this.timeSeries[i];
			var mosaicTexFilePath = this.timeSliceFileFolderPath + "\\" + timeSerie.mosaicTexFileName;
			var options = {
				mosaicTexFilePath        : mosaicTexFilePath,
				owner                    : this,
				startUnixTimeMiliseconds : timeSliceStartUnixTimeMiliseconds,
				endUnixTimeMiliseconds   : timeSliceEndUnixTimeMiliseconds
			};
			var timeSlice = new AirPollutionTimeSlice(options);
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

		var geoJsonIndexFile = this.airPollutionManager._geoJsonIndexFile;
		var widthMeters = geoJsonIndexFile.height_km * 1000.0;
		var heightMeters = geoJsonIndexFile.width_km * 1000.0;

		// take any timeSlice to get columnsCount and rowsCount.***
		var texWidth = this.airPollutionManager._geoJsonIndexFile.layers[0].textureWidth;
		var texHeight = this.airPollutionManager._geoJsonIndexFile.layers[0].textureHeight;

		var timeSlice = this._timeSlicesArray[0];
		var columnsCount = texWidth;
		var rowsCount = texHeight;

		this.oneVoxelSizeInMeters[0] = widthMeters / columnsCount;
		this.oneVoxelSizeInMeters[1] = heightMeters / rowsCount;
		this.oneVoxelSizeInMeters[2] = this.oneVoxelSizeInMeters[0]; // in z direction is the same.***
		
	}
	

	// Now make the textures3D.***
	if (!this._allTimeSlicesTextures3DReady)
	{
		var magoManager = this.airPollutionManager.magoManager;
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
		var geoJsonIndexFile = this.airPollutionManager._geoJsonIndexFile;
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
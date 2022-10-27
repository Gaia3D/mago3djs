'use strict';

/**
 * @class ItineraryLayer
 */
var ItineraryLayer = function(options) 
{
	 if (!(this instanceof ItineraryLayer)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 // https://imgbin.com/png/FWMR7jaC/animation-walk-cycle-png

	 this._itineraryManager;
	 this._fileLoadState = CODE.fileLoadState.READY;
	 this._filePath;
	 this._jsonFile;
	 this._isPrepared = false;
	 this.vectorMesh;
	 this._walkingManCurrentPosition;
	 this._animationStartTime = 0;

	 this._animatedIcon;
	 this._walkingManMosaicTexture;
	 this._walkingManMosaicTexturePath;

	 if (options !== undefined)
	 {
		if (options.filePath)
		{
			this._filePath = options.filePath;
		}
	 }
};

ItineraryLayer.prototype._prepare = function ()
{
	if (this._isPrepared)
	{
		return true;
	}

	// check if json file is loaded.***
	if (this._fileLoadState === CODE.fileLoadState.READY)
	{
		// load the json file.***
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

	// vbos.***
	if (this._makingMeshProcess === undefined)
	{
		this._makingMeshProcess = CODE.processState.NO_STARTED;
	}

	if (this._makingMeshProcess === CODE.processState.NO_STARTED)
	{
		if (this.geoLocDataManager === undefined)
		{ this.geoLocDataManager = new GeoLocationDataManager(); }

		var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
		if (geoLocData === undefined)
		{
			geoLocData = this.geoLocDataManager.newGeoLocationData("default");
		}

		var magoManager = this._itineraryManager.magoManager;
		
		var heading = 0.0;
		var pitch = 0.0;
		var roll = 0.0;
		var centerGeoCoord = this._jsonFile.centerGeographicCoord;
		centerGeoCoord.altitude = 100.0; // test.!!!!!!!!!!
		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);

		var pointsFloat32Array = new Float32Array(this._jsonFile.localPositions);
		// now, convert the positions floatArray to points3d array.***
		var points3dArray = Point3DList.float32ArrayToPoints3DArray(pointsFloat32Array, undefined);
		var options = {};

		this.vectorMesh = VectorMesh.getVectorMeshItineraryFromPoints3dLCArray(points3dArray, geoLocData, magoManager, options);
		
		// Provisionally set a random color.***
		Color.getColorPastelRGBRandom(this.vectorMesh.color4);

		// Now, calculate the velocity for all segments of the itinerary.***
		this._segmentsInfoArray = [];
		var nodesCount = this._jsonFile.nodes.length;
		for (var i=0; i<nodesCount - 1; i++)
		{
			var nodeCurr = this._jsonFile.nodes[i];
			var nodeNext = this._jsonFile.nodes[i + 1];
			var jsonDateCurr = nodeCurr.date;
			var jsonDateNext = nodeNext.date;

			// calculate the time difference in seconds.***
			var dateCurr = new Date();
			dateCurr.setFullYear(jsonDateCurr.year);
			dateCurr.setMonth(jsonDateCurr.month);
			dateCurr.setDate(jsonDateCurr.day);
			dateCurr.setHours(jsonDateCurr.hour);
			dateCurr.setMinutes(jsonDateCurr.minute);

			var dateNext = new Date();
			dateNext.setFullYear(jsonDateNext.year);
			dateNext.setMonth(jsonDateNext.month);
			dateNext.setDate(jsonDateNext.day);
			dateNext.setHours(jsonDateNext.hour);
			dateNext.setMinutes(jsonDateNext.minute);

			var diffTimeSeconds = (dateNext.getTime() - dateCurr.getTime()) / 1000.0;

			// now calculate the distance between nodes. use local positions.***
			var posCurr = new Point3D(points3dArray[i].x, points3dArray[i].y, points3dArray[i].z);
			var posNext = new Point3D(points3dArray[i + 1].x, points3dArray[i + 1].y, points3dArray[i + 1].z);

			var dist = posCurr.distToPoint(posNext);
			var vel_metersSec = dist / diffTimeSeconds;

			this._segmentsInfoArray[i] = {
				dist               : dist,
				diffTimeSec        : diffTimeSeconds,
				velocity_metersSec : vel_metersSec,
				startPosLC         : posCurr,
				endPosLC           : posNext
			};

			var hola = 0;
		}

		// The process finished.***
		this._makingMeshProcess = CODE.processState.FINISHED;
		
		return false;
	}

	if (this._animatedIcon === undefined)
	{
		var options = {

		};
		this._animatedIcon = new AnimatedIcon(options);

		// this._walkingManMosaicTexture;
		var mosaicTexPath = "";
	}

	this._isPrepared = true;
	return this._isPrepared;
};

ItineraryLayer.prototype.render = function (thickLineShader)
{
	// check if is prepared.***
	if (!this._prepare())
	{
		return false;
	}
	var magoManager = this._itineraryManager.magoManager;

	if (this._animationStartTime === 0) 
	{
		this._animationStartTime = magoManager.getCurrentTime();
	}

	var gl = magoManager.getGl();
	var streamLine = this.vectorMesh;

	gl.uniform4fv(thickLineShader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
	gl.uniform1i(thickLineShader.colorType_loc, 0);
	gl.uniform1f(thickLineShader.thickness_loc, streamLine.thickness);

	var renderType = 1;

	var geoLocData = streamLine.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, thickLineShader);
	streamLine.render(magoManager, thickLineShader, renderType);
	
	
};

ItineraryLayer.prototype._getWalkingManPositionLC_forIncreTimeSec = function (diffTimeSec, result_walkingManPosLC)
{
	// given a diffTime in seconds, this function returns the position of the walkingMan.***
	var segmentsCount = this._segmentsInfoArray.length;
	var segmentFound = false;
	var i=0;
	var currDiffTimeSec = diffTimeSec;

	if (result_walkingManPosLC === undefined)
	{
		result_walkingManPosLC = new Point3D();
	}

	while (!segmentFound && i<segmentsCount)
	{
		var segmentInfo = this._segmentsInfoArray[i];
		var segmentLength = segmentInfo.dist;
		var segmentVel = segmentInfo.velocity_metersSec;
		var segmentDiffTimeSec = segmentInfo.diffTimeSec;

		// Now, check, with the velocity & diffTimeSec, if the walkingMan moved all segment dist.***
		var currDist = segmentVel * currDiffTimeSec;

		if (currDist > segmentLength)
		{
			// the walkingMan has moved through all currentSegment.***
			// re-set the diffTimeSec for the next segment.***
			currDiffTimeSec -= segmentDiffTimeSec;

		}
		else
		{
			// the walkingMan is on this segment.***
			segmentFound = true;

			// Now, we need the currPosLC & nextPosLC to interpolate the walkingManPosLC.***
			var segStartPosLC = segmentInfo.startPosLC;
			var segEndPosLC = segmentInfo.endPosLC;

			var dir = segStartPosLC.getVectorToPoint(segEndPosLC, undefined);
			dir.unitary();

			if (result_walkingManPosLC === undefined)
			{
				result_walkingManPosLC = new Point3D();
			}

			result_walkingManPosLC.set(segStartPosLC.x + dir.x * currDist, segStartPosLC.y + dir.y * currDist, segStartPosLC.z + dir.z * currDist);
		}
		
		i++;
	}

	if (!segmentFound)
	{
		// set position as endPoint of the last segement.***
		var segmentInfo = this._segmentsInfoArray[segmentsCount - 1];
		var segEndPosLC = segmentInfo.endPosLC;
		result_walkingManPosLC.set(segEndPosLC.x, segEndPosLC.y, segEndPosLC.z);
	}

	return result_walkingManPosLC;
};

ItineraryLayer.prototype.renderWalkingMan = function ()
{
	// render a point & the walkingMan.***
	// check if is prepared.***
	if (!this._prepare())
	{
		return false;
	}

	if (this._segmentsInfoArray === undefined || this._segmentsInfoArray.length === 0)
	{
		return false;
	}

	


	var magoManager = this._itineraryManager.magoManager;
	if (this._animationStartTime === undefined || this._animationStartTime === 0) 
	{
		this._animationStartTime = magoManager.getCurrentTime();
	}

	
	var gl = magoManager.getGl();

	// calculate the current position into the itinerary using the currentTime.***
	var currTime = magoManager.getCurrentTime();
	var diffTime = currTime - this._animationStartTime;
	var diffTimeSec = diffTime / 1000.0 * 1000.0; // test value.***

	var currWalkingManPosLC = this._getWalkingManPositionLC_forIncreTimeSec(diffTimeSec);

	if (currWalkingManPosLC === undefined)
	{
		return false;
	}
	
	// Render a point.************************************************************************************************
	var sceneState = magoManager.sceneState;

	var shaderLocal = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); // (PointCloudVS, PointCloudSsaoFS)
	magoManager.postFxShadersManager.useProgram(shaderLocal);
	
	shaderLocal.disableVertexAttribArrayAll();
	shaderLocal.resetLastBuffersBinded();
	shaderLocal.enableVertexAttribArray(shaderLocal.position3_loc);
	shaderLocal.bindUniformGenerals();
	
	gl.uniform1i(shaderLocal.bPositionCompressed_loc, false);
	gl.uniform1i(shaderLocal.bUse1Color_loc, true);
	gl.uniform4fv(shaderLocal.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.
	gl.uniform1f(shaderLocal.fixPointSize_loc, 5.0);
	gl.uniform1i(shaderLocal.bUseFixPointSize_loc, 1);
	gl.uniform1f(shaderLocal.externalAlpha_loc, 1.0);

	/////////////////////////////////////////////////////////////
	var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
	//gl.uniform1i(shaderLocal.bUseColorCodingByHeight_loc, true);
	//gl.uniform1f(shaderLocal.minHeight_rainbow_loc, parseInt(pCloudSettings.minHeightRainbow));
	//gl.uniform1f(shaderLocal.maxHeight_rainbow_loc, parseInt(pCloudSettings.maxHeightRainbow));
	gl.uniform1f(shaderLocal.maxPointSize_loc, parseInt(pCloudSettings.maxPointSize));
	gl.uniform1f(shaderLocal.minPointSize_loc, parseInt(pCloudSettings.minPointSize));
	gl.uniform1f(shaderLocal.pendentPointSize_loc, parseInt(pCloudSettings.pendentPointSize));
	gl.uniform1i(shaderLocal.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(shaderLocal.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1f(shaderLocal.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform2fv(shaderLocal.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
	gl.uniform1i(shaderLocal.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	///////////////////////////////////////////////////////////////////
	
	// 1rst, render the walkingManPoint.***
	var geoLocData = this.vectorMesh.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, shaderLocal);

	// create a vboKey for the walkingMan's local position.***
	if (this._WM_vboKeysContainer === undefined)
	{
		this._WM_vboKeysContainer = new VBOVertexIdxCacheKeysContainer();
		var vbo = this._WM_vboKeysContainer.newVBOVertexIdxCacheKey();
	}

	// set current walkingPositionLC.***
	var posVboDataArray = new Float32Array(3);
	posVboDataArray[0] = currWalkingManPosLC.x;
	posVboDataArray[1] = currWalkingManPosLC.y;
	posVboDataArray[2] = currWalkingManPosLC.z;
	
	var vbo = this._WM_vboKeysContainer.getVboKey(0); // there are only one.***
	vbo.deleteGlObjects(magoManager.vboMemoryManager);
	vbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager);

	if (!vbo.bindDataPosition(shaderLocal, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo.vertexCount);

	// Now, render the walkingMan.***


	/*
	// Render pClouds.
	var geoCoord;
	var geoCoordsCount = this.geographicCoordsArray.length;
	for (var i=0; i<geoCoordsCount; i++)
	{
		geoCoord = this.geographicCoordsArray[i];
		////geoCoord.renderPoint(magoManager, shaderLocal, gl, renderType);
		
		//var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
		//buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
		
		//var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
		//if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		//{ return false; }

		//gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);

	}
	*/

	/*
	// Check if exist selectedGeoCoord.
	var currSelected = magoManager.selectionManager.getSelectedGeneral();
	if (currSelected !== undefined && currSelected.constructor.name === "GeographicCoord")
	{
		gl.uniform4fv(shaderLocal.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.
		gl.uniform1f(shaderLocal.fixPointSize_loc, 10.0);
		currSelected.renderPoint(magoManager, shaderLocal, gl, renderType);
	}
	
	shaderLocal.disableVertexAttribArrayAll();
	gl.enable(gl.DEPTH_TEST);
	
	// Write coords.
	
	var canvas = magoManager.getObjectLabel();
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.font = "bold 13px Arial";
	ctx.fillStyle = "black";
	ctx.strokeStyle = "white";

	var gl = magoManager.sceneState.gl;
	var worldPosition;
	var screenCoord;
	for (var i=0; i<geoCoordsCount; i++)
	{
		geoCoord = this.geographicCoordsArray[i];
		var geoLocDataManager = geoCoord.getGeoLocationDataManager();
		var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		worldPosition = geoLoc.position;
		screenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord, magoManager);
		screenCoord.x += 15;
		screenCoord.y -= 15;
		//var geoCoords = geoLoc.geographicCoord;
		if (screenCoord.x >= 0 && screenCoord.y >= 0)
		{
			var word = "lon: " + geoCoord.longitude.toFixed(6);
			ctx.strokeText(word, screenCoord.x, screenCoord.y);
			ctx.fillText(word, screenCoord.x, screenCoord.y);

			word = "lat: " + geoCoord.latitude.toFixed(6);
			ctx.strokeText(word, screenCoord.x, screenCoord.y + 15.0);
			ctx.fillText(word, screenCoord.x, screenCoord.y + 15.0);

			word = "alt: " + geoCoord.altitude.toFixed(6);
			ctx.strokeText(word, screenCoord.x, screenCoord.y + 30.0);
			ctx.fillText(word, screenCoord.x, screenCoord.y + 30.0);
		}
	}
	
	ctx.restore();
	*/
	
	// return the current shader.
	//magoManager.postFxShadersManager.useProgram(shader);

	var hola = 0;
};
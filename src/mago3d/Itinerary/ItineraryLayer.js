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
	 this._totalItineraryTimeSec;

	 this._animatedIcon;

	 this._WM_vboKeysContainer;

	 // sampling data. position, color, etc.***
	 this._samplingDataObj;
	 this._samplingData_vboKeysContainer;
	 
	 this._timeScale = 2000.0; // to simulate fast.***
	 this._lineThickness = 4.0;
	 this._thickLineColor;

	 if (options !== undefined)
	 {
		if (options.filePath)
		{
			this._filePath = options.filePath;
		}

		if (options.lineThickness)
		{
			this._lineThickness = options.lineThickness;
		}

		if (options.jsonFile)
		{
			this._jsonFile = options.jsonFile;

			// in this case set this._fileLoadState as CODE.fileLoadState.LOADING_FINISHED;
			this._fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		}

		if (options.thickLineColor)
		{
			this._thickLineColor = new Color(options.thickLineColor.r, options.thickLineColor.g, options.thickLineColor.b, options.thickLineColor.a);
		}
	 }
};

ItineraryLayer.prototype.deleteObjects = function (vboMemManager)
{
	this._itineraryManager = undefined;
	this._fileLoadState = undefined;
	this._filePath = undefined;

	// delete json object.***
	for (var variableKey in this._jsonFile)
	{
		if (this._jsonFile.hasOwnProperty(variableKey))
		{
			delete this._jsonFile[variableKey];
		}
	}
	this._jsonFile = undefined;

	this._isPrepared = undefined;

	if (this.vectorMesh)
	{
		this.vectorMesh.deleteObjects(vboMemManager);
		this.vectorMesh = undefined;
	}

	this._walkingManCurrentPosition = undefined;
	this._animationStartTime = undefined;
	this._totalItineraryTimeSec = undefined;

	if (this._animatedIcon)
	{
		this._animatedIcon.deleteObjects(vboMemManager);
		this._animatedIcon = undefined;
	}
	
	if (this._WM_vboKeysContainer)
	{
		this._WM_vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
		this._WM_vboKeysContainer = undefined;
	}

	// sampling data. position, color, etc.***
	this._samplingDataObj = undefined; // delete objects of _samplingDataObj. : todo:

	if (this._samplingData_vboKeysContainer)
	{
		this._samplingData_vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
		this._samplingData_vboKeysContainer = undefined;
	}
	
	this._timeScale = undefined; // to simulate fast.***
	this._lineThickness = undefined;

	if (this._thickLineColor)
	{
		this._thickLineColor.deleteObjects();
		this._thickLineColor = undefined;
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
		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);

		var pointsFloat32Array = new Float32Array(this._jsonFile.localPositions);
		// now, convert the positions floatArray to points3d array.***
		var points3dArray = Point3DList.float32ArrayToPoints3DArray(pointsFloat32Array, undefined);
		var options = {};

		this.vectorMesh = VectorMesh.getVectorMeshItineraryFromPoints3dLCArray(points3dArray, geoLocData, magoManager, options);
		this.vectorMesh.thickness = this._lineThickness;
		
		// Provisionally set a random color.***
		if (this._thickLineColor === undefined)
		{
			this._thickLineColor = new Color();
			Color.getColorPastelRGBRandom(this._thickLineColor);
		}
		//Color.getColorPastelRGBRandom(this.vectorMesh.color4);
		if (this.vectorMesh.color4 === undefined)
		{
			this.vectorMesh.color4 = new Color();
		}
		this.vectorMesh.color4.setRGB(this._thickLineColor.r, this._thickLineColor.g, this._thickLineColor.b);

		// Now, calculate the velocity for all segments of the itinerary.***
		this._segmentsInfoArray = [];
		var nodesCount = this._jsonFile.nodes.length;
		this._totalItineraryTimeSec = 0.0;
		for (var i=0; i<nodesCount - 1; i++)
		{
			var nodeCurr = this._jsonFile.nodes[i];
			var nodeNext = this._jsonFile.nodes[i + 1];
			var jsonDateCurr = nodeCurr.date;
			var jsonDateNext = nodeNext.date;

			// calculate the time difference in seconds.***
			var dateCurr = new Date();
			dateCurr.setFullYear(jsonDateCurr.year);
			dateCurr.setMonth(jsonDateCurr.month - 1);
			dateCurr.setDate(jsonDateCurr.day);
			dateCurr.setHours(jsonDateCurr.hour);
			dateCurr.setMinutes(jsonDateCurr.minute);
			var currUnixTimeMillisec = dateCurr.getTime();

			var dateNext = new Date();
			dateNext.setFullYear(jsonDateNext.year);
			dateNext.setMonth(jsonDateNext.month - 1);
			dateNext.setDate(jsonDateNext.day);
			dateNext.setHours(jsonDateNext.hour);
			dateNext.setMinutes(jsonDateNext.minute);
			var nextUnixTimeMillisec = dateNext.getTime();

			var diffTimeSeconds = (nextUnixTimeMillisec - currUnixTimeMillisec) / 1000.0;

			// now calculate the distance between nodes. use local positions.***
			var posCurr = new Point3D(points3dArray[i].x, points3dArray[i].y, points3dArray[i].z);
			var posNext = new Point3D(points3dArray[i + 1].x, points3dArray[i + 1].y, points3dArray[i + 1].z);

			var dist = posCurr.distToPoint(posNext);
			var vel_metersSec = dist / diffTimeSeconds;

			this._segmentsInfoArray[i] = {
				dist                : dist,
				unixTimeMillisecond : currUnixTimeMillisec,
				diffTimeSec         : diffTimeSeconds,
				velocity_metersSec  : vel_metersSec,
				startPosLC          : posCurr,
				endPosLC            : posNext
			};

			if (diffTimeSeconds < 0.0)
			{
				var hola = 0;
			}

			this._totalItineraryTimeSec += diffTimeSeconds;

			if (this._totalItineraryTimeSec < 0.0)
			{
				var hola = 0;
			}

			var hola = 0;
		}

		// The process finished.***
		this._makingMeshProcess = CODE.processState.FINISHED;
		
		return false;
	}

	if (this._animatedIcon === undefined)
	{
		// no used yet, but in the future must to be used sure.***
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

	var gl = magoManager.getGl();
	var streamLine = this.vectorMesh;

	gl.uniform4fv(thickLineShader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
	gl.uniform1i(thickLineShader.colorType_loc, 0);
	gl.uniform1f(thickLineShader.thickness_loc, streamLine.thickness);

	var renderType = 1;

	var geoLocData = streamLine.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, thickLineShader);
	streamLine.render(magoManager, thickLineShader, renderType);
	
	return true;
};

ItineraryLayer.prototype._getWalkingManPositionLC_forIncreTimeSec = function (diffTimeSec, result_walkingManPosLC)
{
	// given a diffTime in seconds, this function returns the position of the walkingMan.***
	if (this._segmentsInfoArray === undefined || this._segmentsInfoArray.length === 0)
	{
		return undefined;
	}

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
		var currDist = segmentVel * currDiffTimeSec;

		if (segmentDiffTimeSec < currDiffTimeSec)
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

			if (currDist < 1e-12)
			{
				// the walkingMan is stopped.***
				if (result_walkingManPosLC === undefined)
				{
					result_walkingManPosLC = new Point3D();
				}

				result_walkingManPosLC.set(segStartPosLC.x, segStartPosLC.y, segStartPosLC.z);
			}
			else
			{
				var dir = segStartPosLC.getVectorToPoint(segEndPosLC, undefined);
				dir.unitary();

				if (result_walkingManPosLC === undefined)
				{
					result_walkingManPosLC = new Point3D();
				}

				result_walkingManPosLC.set(segStartPosLC.x + dir.x * currDist, segStartPosLC.y + dir.y * currDist, segStartPosLC.z + dir.z * currDist);
			}
			
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


ItineraryLayer.prototype._getWalkingManPositionWC_forIncreTimeSec = function (diffTimeSec, result_walkingManPosWC)
{
	// given a diffTime in seconds, this function returns the position of the walkingMan.***
	// 1rst, find the posLC. Then calculate posWC.***
	var walkingManPosLC = this._getWalkingManPositionLC_forIncreTimeSec(diffTimeSec, undefined);

	if (walkingManPosLC === undefined)
	{
		return undefined;
	}

	if (this.vectorMesh === undefined)
	{
		return undefined;
	}

	if (result_walkingManPosWC === undefined)
	{
		result_walkingManPosWC = new Point3D();
	}

	// 2nd, calculate posWC.***
	var geoLocData = this.vectorMesh.geoLocDataManager.getCurrentGeoLocationData();
	result_walkingManPosWC = geoLocData.localCoordToWorldCoord(walkingManPosLC, result_walkingManPosWC);

	return result_walkingManPosWC;
};


ItineraryLayer.prototype._getSegmentIdx_forUnixTimeMillisec = function (unixTimeMillisec)
{
	if (this._segmentsInfoArray === undefined || this._segmentsInfoArray.length === 0)
	{
		return undefined;
	}

	var segmentsCount = this._segmentsInfoArray.length;
	var segmentFound = false;
	var i=0;

	var segmentInfoLast = this._segmentsInfoArray[segmentsCount - 1];
	var segmentUnixTimeMillisecLast = segmentInfoLast.unixTimeMillisecond;

	if (unixTimeMillisec > segmentUnixTimeMillisecLast)
	{
		return segmentsCount - 1;
	}

	while (!segmentFound && i<segmentsCount - 1)
	{
		var segmentInfo = this._segmentsInfoArray[i];
		var segmentInfoNext = this._segmentsInfoArray[i + 1];
		var segmentUnixTimeMillisec = segmentInfo.unixTimeMillisecond;
		var segmentUnixTimeMillisecNext = segmentInfoNext.unixTimeMillisecond;

		if (segmentUnixTimeMillisec < unixTimeMillisec && unixTimeMillisec < segmentUnixTimeMillisecNext)
		{
			segmentFound = true;
			return i;
		}
		
		i++;
	}

	return -1;
};

ItineraryLayer.prototype._getWalkingManPositionLC_forUnixTimeMillisec = function (unixTimeMillisec, result_walkingManPosLC)
{
	// given a diffTime in seconds, this function returns the position of the walkingMan.***
	if (this._segmentsInfoArray === undefined || this._segmentsInfoArray.length === 0)
	{
		return undefined;
	}

	var segmentsCount = this._segmentsInfoArray.length;
	var segmentFound = true;
	var i=0;

	if (result_walkingManPosLC === undefined)
	{
		result_walkingManPosLC = new Point3D();
	}

	var currSegmentIdx = this._getSegmentIdx_forUnixTimeMillisec(unixTimeMillisec);

	if (currSegmentIdx === -1)
	{
		segmentFound = false;
	}

	if (segmentFound)
	{
		var segmentInfo = this._segmentsInfoArray[currSegmentIdx];
		var segmentLength = segmentInfo.dist;
		var segmentVel = segmentInfo.velocity_metersSec;
		var segmentDiffTimeSec = segmentInfo.diffTimeSec;
		var segmentUnixTimeMillisec = segmentInfo.unixTimeMillisecond;
		var currDiffTimeSec = (unixTimeMillisec - segmentUnixTimeMillisec) / 1000.0;

		var currDist = segmentVel * currDiffTimeSec;

		var segStartPosLC = segmentInfo.startPosLC;
		var segEndPosLC = segmentInfo.endPosLC;

		if (currDist < 1e-12)
		{
			// the walkingMan is stopped.***
			if (result_walkingManPosLC === undefined)
			{
				result_walkingManPosLC = new Point3D();
			}

			result_walkingManPosLC.set(segStartPosLC.x, segStartPosLC.y, segStartPosLC.z);
		}
		else
		{
			var dir = segStartPosLC.getVectorToPoint(segEndPosLC, undefined);
			dir.unitary();

			if (result_walkingManPosLC === undefined)
			{
				result_walkingManPosLC = new Point3D();
			}

			result_walkingManPosLC.set(segStartPosLC.x + dir.x * currDist, segStartPosLC.y + dir.y * currDist, segStartPosLC.z + dir.z * currDist);
		}
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


ItineraryLayer.prototype._getWalkingManPositionWC_forUnixTimeMillisec = function (unixTimeMillisec, result_walkingManPosWC)
{
	// given a diffTime in seconds, this function returns the position of the walkingMan.***
	// 1rst, find the posLC. Then calculate posWC.***
	var walkingManPosLC = this._getWalkingManPositionLC_forUnixTimeMillisec(unixTimeMillisec, undefined);

	if (walkingManPosLC === undefined)
	{
		return undefined;
	}

	if (this.vectorMesh === undefined)
	{
		return undefined;
	}

	if (result_walkingManPosWC === undefined)
	{
		result_walkingManPosWC = new Point3D();
	}

	// 2nd, calculate posWC.***
	var geoLocData = this.vectorMesh.geoLocDataManager.getCurrentGeoLocationData();
	result_walkingManPosWC = geoLocData.localCoordToWorldCoord(walkingManPosLC, result_walkingManPosWC);

	return result_walkingManPosWC;
};

ItineraryLayer.prototype._getDiffTimeSec = function (currTime)
{
	// This function returns the time difference between animationStartTime & current time.***
	var diffTime = currTime - this._animationStartTime;
	var diffTimeSec = diffTime / 1000.0;
	diffTimeSec *= this._timeScale; // test value. TEST. TEST. TEST. TEST.***
	return diffTimeSec;
};

ItineraryLayer.prototype.getTotalItineraryTime = function ()
{
	if (this._totalItineraryTimeSec === undefined)
	{
		// calculate it.***
		//this._segmentsInfoArray[i] = {
		//	dist               : dist,
		//	diffTimeSec        : diffTimeSeconds,
		//	velocity_metersSec : vel_metersSec,
		//	startPosLC         : posCurr,
		//	endPosLC           : posNext
		//};
		this._totalItineraryTimeSec = 0;
		var segmentsCount = this._segmentsInfoArray.length;
		for (var i=0; i<segmentsCount; i++)
		{
			this._totalItineraryTimeSec += this._segmentsInfoArray[i].diffTimeSec;
		}
	}

	return this._totalItineraryTimeSec;
};

ItineraryLayer.prototype.sampleWeatherPollution = function (currTime, pollutionLayer)
{
	if (this.vectorMesh === undefined)
	{
		return false;
	}

	// 1rst, need currentPosition of the walkingMan.***
	var diffTimeSec = this._getDiffTimeSec(currTime);
	var totalItineraryTimeSec = this.getTotalItineraryTime();
	if (diffTimeSec > totalItineraryTimeSec)
	{
		return false;
	}

	var currPosWC = this._getWalkingManPositionWC_forIncreTimeSec(diffTimeSec, undefined);

	if (currPosWC === undefined)
	{
		return false;
	}
	
	var pollutionValue = pollutionLayer.getPollutionValue(currPosWC, currTime);

	if (pollutionValue === undefined)
	{
		return false;
	}

	var pollutionMinMaxValue = pollutionLayer._getMinMaxQuantizedValues();

	if (pollutionMinMaxValue === undefined)
	{
		return false;
	}

	if (this._lastSamplingTime === undefined)
	{
		this._lastSamplingTime = 0;
	}

	if (diffTimeSec - this._lastSamplingTime < this._itineraryManager._samplingDataIncrementTimeMilisec)
	{
		return false;
	}
	else
	{
		this._lastSamplingTime = diffTimeSec;
	}

	// now, store the sampled data.***
	// this._samplingDataObj;
	// this._samplingData_vboKeysContainer;
	if (this._samplingDataObj === undefined)
	{
		this._samplingDataObj = {};
	}

	// calculate the local position respect to "geoLocData = this.vectorMesh.geoLocDataManager.getCurrentGeoLocationData()"
	var geoLocData = this.vectorMesh.geoLocDataManager.getCurrentGeoLocationData();
	var posLC = geoLocData.worldCoordToLocalCoord(currPosWC, undefined);

	if (this._samplingDataObj.posLC_floatArray === undefined)
	{
		this._samplingDataObj.posLC_floatArray = [];
	}

	this._samplingDataObj.posLC_floatArray.push(posLC.x, posLC.y, posLC.z);

	// now, convert pollutionValue to color by legend.***
	var polutionQuantized = (pollutionValue - pollutionMinMaxValue[0]) / (pollutionMinMaxValue[1] - pollutionMinMaxValue[0]);

	if (this._samplingDataObj.color4_uIntArray === undefined)
	{
		this._samplingDataObj.color4_uIntArray = [];
	}

	if (this._samplingDataObj.valuesArray === undefined)
	{
		this._samplingDataObj.valuesArray = [];
	}

	if (this._samplingDataObj.timesArray === undefined)
	{
		this._samplingDataObj.timesArray = [];
	}

	if (this._samplingDataObj.positionWCArray === undefined)
	{
		this._samplingDataObj.positionWCArray = [];
	}

	this._samplingDataObj.timesArray.push(diffTimeSec);

	this._samplingDataObj.valuesArray.push(pollutionValue);
	this._samplingDataObj.positionWCArray.push(currPosWC);

	var hotToCold = false;
	var color4RGBA = Color.getRainbowColor_byHeight(polutionQuantized,  0.0, 0.08, hotToCold);

	this._samplingDataObj.color4_uIntArray.push(Math.floor(color4RGBA.r*255), Math.floor(color4RGBA.g*255), Math.floor(color4RGBA.b*255), Math.floor(color4RGBA.a*255));

	// Now make vbo. 1rst delete existing vbo bcos another sample point was added.***
	if (this._samplingData_vboKeysContainer === undefined)
	{
		this._samplingData_vboKeysContainer = new VBOVertexIdxCacheKeysContainer();
		var vbo = this._samplingData_vboKeysContainer.newVBOVertexIdxCacheKey();
	}
	var magoManager = this._itineraryManager.magoManager;
	var samplingVbo = this._samplingData_vboKeysContainer.getVboKey(0);
	var posVboDataArray = new Float32Array(this._samplingDataObj.posLC_floatArray); 
	var colorVboDataArray = new Uint8Array(this._samplingDataObj.color4_uIntArray);
	samplingVbo.deleteGlObjects(magoManager.vboMemoryManager);
	samplingVbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager);
	samplingVbo.setDataArrayCol(colorVboDataArray, magoManager.vboMemoryManager);

	return true;
};

ItineraryLayer.prototype.sampleChemicalContamination = function (currUnixTimeMillisec, chemContaminationLayer)
{
	if (this.vectorMesh === undefined)
	{
		return false;
	}

	// 1rst, need currentPosition of the walkingMan.***
	// var diffTimeSec = this._getDiffTimeSec(currTime);
	// var totalItineraryTimeSec = this.getTotalItineraryTime();
	// if (diffTimeSec > totalItineraryTimeSec)
	// {
	// 	return false;
	// }

	var currPosWC = this._getWalkingManPositionWC_forUnixTimeMillisec(currUnixTimeMillisec, undefined);

	if (currPosWC === undefined)
	{
		return false;
	}
	
	var pollutionValue = chemContaminationLayer.getContaminationValue(currPosWC, currUnixTimeMillisec);

	if (pollutionValue === undefined)
	{
		return false;
	}

	var pollutionMinMaxValue = chemContaminationLayer.getMinMaxPollutionValues();

	if (pollutionMinMaxValue === undefined)
	{
		return false;
	}

	if (this._lastSamplingTime === undefined)
	{
		this._lastSamplingTime = 0;
	}

	if (diffTimeSec - this._lastSamplingTime < this._itineraryManager._samplingDataIncrementTimeMilisec)
	{
		return false;
	}
	else
	{
		this._lastSamplingTime = diffTimeSec;
	}

	// now, store the sampled data.***
	// this._samplingDataObj;
	// this._samplingData_vboKeysContainer;
	if (this._samplingDataObj === undefined)
	{
		this._samplingDataObj = {};
	}

	// calculate the local position respect to "geoLocData = this.vectorMesh.geoLocDataManager.getCurrentGeoLocationData()"
	var geoLocData = this.vectorMesh.geoLocDataManager.getCurrentGeoLocationData();
	var posLC = geoLocData.worldCoordToLocalCoord(currPosWC, undefined);

	if (this._samplingDataObj.posLC_floatArray === undefined)
	{
		this._samplingDataObj.posLC_floatArray = [];
	}

	this._samplingDataObj.posLC_floatArray.push(posLC.x, posLC.y, posLC.z);

	// now, convert pollutionValue to color by legend.***
	var polutionQuantized = (pollutionValue - pollutionMinMaxValue[0]) / (pollutionMinMaxValue[1] - pollutionMinMaxValue[0]);

	if (this._samplingDataObj.color4_uIntArray === undefined)
	{
		this._samplingDataObj.color4_uIntArray = [];
	}

	if (this._samplingDataObj.valuesArray === undefined)
	{
		this._samplingDataObj.valuesArray = [];
	}

	if (this._samplingDataObj.timesArray === undefined)
	{
		this._samplingDataObj.timesArray = [];
	}

	if (this._samplingDataObj.positionWCArray === undefined)
	{
		this._samplingDataObj.positionWCArray = [];
	}

	this._samplingDataObj.timesArray.push(diffTimeSec);

	this._samplingDataObj.valuesArray.push(pollutionValue);
	this._samplingDataObj.positionWCArray.push(currPosWC);

	var hotToCold = false;
	var color4RGBA = Color.getRainbowColor_byHeight(polutionQuantized,  0.0, 0.08, hotToCold);

	this._samplingDataObj.color4_uIntArray.push(Math.floor(color4RGBA.r*255), Math.floor(color4RGBA.g*255), Math.floor(color4RGBA.b*255), Math.floor(color4RGBA.a*255));

	// Now make vbo. 1rst delete existing vbo bcos another sample point was added.***
	if (this._samplingData_vboKeysContainer === undefined)
	{
		this._samplingData_vboKeysContainer = new VBOVertexIdxCacheKeysContainer();
		var vbo = this._samplingData_vboKeysContainer.newVBOVertexIdxCacheKey();
	}
	var magoManager = this._itineraryManager.magoManager;
	var samplingVbo = this._samplingData_vboKeysContainer.getVboKey(0);
	var posVboDataArray = new Float32Array(this._samplingDataObj.posLC_floatArray); 
	var colorVboDataArray = new Uint8Array(this._samplingDataObj.color4_uIntArray);
	samplingVbo.deleteGlObjects(magoManager.vboMemoryManager);
	samplingVbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager);
	samplingVbo.setDataArrayCol(colorVboDataArray, magoManager.vboMemoryManager);

	return true;
};

ItineraryLayer.prototype.getSampledData = function ()
{
	return this._samplingDataObj;
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
	if (this._animationStartTime === undefined) 
	{
		this._animationStartTime = 0;
	}

	
	var gl = magoManager.getGl();

	// calculate the current position into the itinerary using the currentTime.***
	//var currTime = magoManager.getCurrentTime();
	var currTime = magoManager.animationTimeController.getCurrentTimeMilisec();
	var diffTimeSec = this._getDiffTimeSec(currTime);

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
	gl.uniform4fv(shaderLocal.oneColor4_loc, [0.1, 1.0, 0.1, 1.0]); //.
	gl.uniform1f(shaderLocal.fixPointSize_loc, 10.0);
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

	gl.depthRange(0.0, 0.1);

	gl.drawArrays(gl.POINTS, 0, vbo.vertexCount);

	// Now, render the pollution sampling data.***
	// this._samplingDataObj.posLC_floatArray
	// this._samplingDataObj.color4_uIntArray
	var renderSmpledData = true;
	if (this._samplingDataObj === undefined)
	{
		renderSmpledData = false;
	}

	if (this._samplingData_vboKeysContainer === undefined)
	{
		renderSmpledData = false;
	}

	if (renderSmpledData)
	{
		var samplingVbo = this._samplingData_vboKeysContainer.getVboKey(0);

		if (!samplingVbo.bindDataPosition(shaderLocal, magoManager.vboMemoryManager))
		{ 
			gl.depthRange(0.0, 1.0);
			return false; 
		}

		if (!samplingVbo.bindDataColor(shaderLocal, magoManager.vboMemoryManager))
		{ 
			shaderLocal.disableVertexAttribArray(shaderLocal.color4_loc);
			gl.uniform1i(shaderLocal.bUse1Color_loc, true);
			
		}
		else 
		{
			shaderLocal.enableVertexAttribArray(shaderLocal.color4_loc);
			gl.uniform1i(shaderLocal.bUse1Color_loc, false);
		}

		gl.depthRange(0.0, 0.1);

		gl.drawArrays(gl.POINTS, 0, samplingVbo.vertexCount);
	}

	// return gl settings.***
	gl.depthRange(0.0, 1.0);
	
	// return the current shader.
	//magoManager.postFxShadersManager.useProgram(shader);

	var hola = 0;
};
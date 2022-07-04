'use strict';

/**
 * @class WeatherStation
 */
var WeatherStation = function (magoManager, options) 
{
	if (!(this instanceof WeatherStation)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.provisional_geometryDataPath;
	this.windVolumesArray;
	this.dustVolumesArray;

	this.windLayersArray; // old.***
	this.tempLayersArray; // old.***
	this.precipitLayersArray; // old.***
	this.dustLayersArray; // old.***
	
	this.focusedWindLayerIdx;
	this.windDisplayBox; 
	this.displayBox;
	
	this.magoManager = magoManager;

	// Enumerations.
	this.WIND_MAXPARTICLES_INSCREEN = 1500;
	this.WIND_STREAMLINES_NUMPOINTS = 250;
	this.windDisplayMode = "NORMAL"; // "NORMAL", "OVERTERRAIN"
	this.speedFactor = 1; // no use this.***

	// wind params.
	this.windThickness = 2.5;
	this.windDefaultAnimationSpeed = 1;

	if (options)
	{
		if (options.windDisplayMode)
		{
			this.windDisplayMode = options.windDisplayMode;
		}

		if (options.WIND_MAXPARTICLES_INSCREEN)
		{
			this.WIND_MAXPARTICLES_INSCREEN = options.WIND_MAXPARTICLES_INSCREEN;
		}

		if (options.WIND_STREAMLINES_NUMPOINTS)
		{
			this.WIND_STREAMLINES_NUMPOINTS = options.WIND_STREAMLINES_NUMPOINTS;
		}

		if (options.speedFactor)
		{
			this.speedFactor = options.speedFactor;
		}
	}
};

WeatherStation.prototype.setWindThickness = function(windThickness)
{
	this.windThickness = windThickness;
};

WeatherStation.prototype.getWindLayersCount = function()
{
	if (this.windLayersArray === undefined)
	{ return 0; }
	
	return this.windLayersArray.length;
};

WeatherStation.prototype.getWindLayer = function(idx)
{
	if (this.windLayersArray === undefined)
	{ return undefined; }
	
	return this.windLayersArray[idx];
};

WeatherStation.prototype.getWindVolume = function(idx)
{
	if (this.windVolumesArray === undefined)
	{ return undefined; }
	
	return this.windVolumesArray[idx];
};

WeatherStation.prototype.newWindLayer = function(options)
{
	if (this.windLayersArray === undefined)
	{ this.windLayersArray = []; }
	
	var windLayer = new WindLayer(options);
	windLayer.weatherStation = this;
	this.windLayersArray.push(windLayer);
	return windLayer;
};

WeatherStation.prototype.newWindVolume = function(options)
{
	if (this.windVolumesArray === undefined)
	{ this.windVolumesArray = []; }

	if (options)
	{
		if (options.animationSpeed === undefined)
		{
			// AnimationSpeed by default is 1. If want to render faster, try to set animationSpeed = 2 or animationSpeed = 3.***
			options.animationSpeed = this.windDefaultAnimationSpeed;
		}
	}

	var windVolume = new WindVolume(options);
	windVolume.weatherStation = this;
	this.windVolumesArray.push(windVolume);
	return windVolume;
};

WeatherStation.prototype.deleteDustVolumes = function()
{
	// This function deletes all dust volumes.
	if (this.dustVolumesArray)
	{
		var dustVolumesCount = this.dustVolumesArray.length;
		for (var i=0; i<dustVolumesCount; i++)
		{
			this.dustVolumesArray[i].deleteObjects(this.magoManager);
			this.dustVolumesArray[i] = undefined;
		}

		this.dustVolumesArray = undefined;
	}
};

WeatherStation.prototype.deleteWindVolumes = function()
{
	// This function deletes all dust volumes.
	if (this.windVolumesArray)
	{
		var windVolumesCount = this.windVolumesArray.length;
		for (var i=0; i<windVolumesCount; i++)
		{
			this.windVolumesArray[i].deleteObjects(this.magoManager);
			this.windVolumesArray[i] = undefined;
		}

		this.windVolumesArray = undefined;
	}
};

WeatherStation.prototype.deleteAllVolumes = function()
{
	this.deleteWindVolumes();
	this.deleteDustVolumes();
};

WeatherStation.prototype.newDustVolume = function(options)
{
	if (this.dustVolumesArray === undefined)
	{ this.dustVolumesArray = []; }
	
	var dustVolume = new DustVolume(options);
	dustVolume.weatherStation = this;
	this.dustVolumesArray.push(dustVolume);
	return dustVolume;
};

WeatherStation.prototype.getSmokeTexture = function()
{
	// smokeTexture for dust-rendering.
	if (this.smokeTexture === undefined)
	{
		var gl = this.magoManager.getGl();
		this.smokeTexture = new Texture();
		this.smokeTexture.texId = gl.createTexture();
	}

	if (this.smokeTexture.fileLoadState === CODE.fileLoadState.READY)
	{
		var magoManager = this.magoManager;
		var gl = magoManager.getGl();
		//C:\git\repository\mago3djs\images\ko
    	var filePath_inServer = "\\images\\ko" + "\\smoke.png";
		ReaderWriter.loadImage(gl, filePath_inServer, this.smokeTexture);
		return false;
	}

	if (this.smokeTexture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
	{
		return this.smokeTexture;
	}

	return false;
};

WeatherStation.prototype.newTemperatureLayer = function()
{
	if (this.tempLayersArray === undefined)
	{ this.tempLayersArray = []; }
	
	var tempLayer = new TemperatureLayer();
	tempLayer.weatherStation = this;
	this.tempLayersArray.push(tempLayer);
	return tempLayer;
};

WeatherStation.prototype.newPrecipitationLayer = function()
{
	if (this.precipitLayersArray === undefined)
	{ this.precipitLayersArray = []; }
	
	var precipLayer = new PrecipitationLayer();
	precipLayer.weatherStation = this;
	this.precipitLayersArray.push(precipLayer);
	return precipLayer;
};

/**
 * Get the index of the altitude
 * @param numbersArray
 * @param {Number} startIdx
 * @param {Number} endIdx
 * @param number
 */
WeatherStation.binarySearch_layersByAltitude = function(altitudesArray, altitude, startIdx, endIdx) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	if (startIdx === undefined)
	{ startIdx = 0; }
	if (endIdx === undefined)
	{ endIdx = altitudesArray.length-1; }

	var range = endIdx - startIdx;
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;

		while (!finished && i<=endIdx)
		{
			if (altitude < altitudesArray[i])
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{ return idx; }
		else 
		{ return endIdx+1; }
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		var middleValue = altitudesArray[middleIdx];
		if (middleValue > altitude)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return WeatherStation.binarySearch_layersByAltitude(altitudesArray, altitude, newStartIdx, newEndIdx);
	}
};

WeatherStation.prototype.test_createTemperaturaLayerExample = function(magoManager)
{
	var gl = magoManager.sceneState.gl;
	
	if (this.provisional_geometryDataPath === undefined)
	{ this.provisional_geometryDataPath = magoManager.readerWriter.geometryDataPath; }
	
	if (this.tempLayersArray === undefined || this.tempLayersArray.length === 0)
	{
		var tempLayer = this.newTemperatureLayer();
		tempLayer.init(gl, magoManager);
		
		// test make cutting planes.***
		tempLayer.test_makeCuttingPlane(magoManager);
		
		// make the physical mesh.***
		tempLayer.test_makeGeometryFromData(magoManager);
	}
	
	// Test for temperatureMeshes.**********************************
	var tempeLayersCount = 0;
	
	if (this.tempLayersArray)
	{ tempeLayersCount = this.tempLayersArray.length; }
	
	for (var i=0; i<tempeLayersCount; i++)
	{
		var tempLayer = this.tempLayersArray[i];
		if (tempLayer.meshesArray === undefined)
		{
			tempLayer.test_makeGeometryFromData(magoManager);
		}
	}
};

WeatherStation.prototype.test_createPrecipitationLayerExample = function(magoManager)
{
	if (this.precipitLayersArray === undefined)
	{ 
		if (this.provisional_geometryDataPath === undefined)
		{ this.provisional_geometryDataPath = magoManager.readerWriter.geometryDataPath; }

		var precipLayer = this.newPrecipitationLayer();
		
		// 1rst load precipitation data.***
		precipLayer.init(); // here loads a test data.***
		
	}
	
	// Test for temperatureMeshes.**********************************
	var precipLayersCount = 0;
	
	if (this.precipitLayersArray)
	{ precipLayersCount = this.precipitLayersArray.length; }
	
	for (var i=0; i<precipLayersCount; i++)
	{
		var precipLayer = this.precipitLayersArray[i];
		if (precipLayer.meshesArray === undefined)
		{
			precipLayer.test_makeGeometryFromData(magoManager);
		}
	}
};

WeatherStation.prototype.test_createWindLayerExample = function(magoManager)
{
	var gl = magoManager.sceneState.gl;
	
	if (this.provisional_geometryDataPath === undefined)
	{ this.provisional_geometryDataPath = magoManager.readerWriter.geometryDataPath; }
	
	if (this.windLayersArray === undefined || this.windLayersArray.length === 0)
	{
		var geometryDataPath = this.provisional_geometryDataPath;
		
		var options = {
			name              : "earth",
			speedFactor       : 0.2,
			dropRate          : 0.03,
			dropRateBump      : 0.01,
			numParticles      : 65536,
			layerAltitude     : 6000.0,
			windMapFileName   : "wind_025",
			windMapFolderPath : geometryDataPath +"/volumRenderingTest/wind_iSuSok"
		};
		
		var options = {
			name              : "JeJu Island",
			speedFactor       : 2.0,
			dropRate          : 0.003,
			dropRateBump      : 0.001,
			numParticles      : 65536/16,
			layerAltitude     : 1000.0,
			windMapFileName   : "OBS-QWM_2016062000.grib2_wind_000",
			windMapFolderPath : geometryDataPath +"/JeJu_wind_20191127"
		};
		
		
		var windLayer = this.newWindLayer(options);
		windLayer.init(gl);
		
		//windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude); // for 2d texture rendering mode.***
		
		// test a fragment of earth.*******************************************************************
		// Temple a sud_est de corea.***
		/*
		var minLon = 129.28786819982201;
		var minLat = 35.83359921813443;
		var maxLon = 129.29425212290536;
		var maxLat = 35.83835487485899;
		var altitude = 200;
		*/
		
		// Seoul.***
		/*
		var minLon = 126.87599414117341;
		var minLat = 37.4619380986301;
		var maxLon = 127.13467878686347;
		var maxLat = 37.609881001668334;
		var altitude = 200;
		*/
		
		//windLayer.createEarthRegion(minLon, minLat, maxLon, maxLat, altitude, magoManager); // original.***
		//windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude, magoManager); // original.***
		// End test.-----------------------------------------------------------------------------------
		
	}
};

WeatherStation.prototype.renderWindMultiLayers = function(magoManager)
{
	if (this.windLayersArray === undefined)
	{ return; }
	
	if (this.windLayersArray.length === 0 )
	{ return; }


	if (this.focusedWindLayerIdx === undefined)
	{ this.focusedWindLayerIdx = 0; }
	
	var gl;
	var windLayer;
	var windLayersCount = this.windLayersArray.length;
	for (var i=windLayersCount-1; i>= 0; i--)
	{
		windLayer = this.windLayersArray[i];
		if (windLayer.isReadyToRender())
		{
			windLayer.renderMode3D(magoManager);
			
			gl = windLayer.gl;
			FBO.bindTexture(gl, windLayer.windMapTexture.texId, 0);
			windLayer.updateParticlesPositions(magoManager); 
			//break;
		}
		else 
		{
			windLayer.prepareWindLayer();
		}
	}
	
	//if (windLayer !== undefined && windLayer.windMapTexture !== undefined)
	//{
	//	if (windLayer.windMapTexture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
	//	{ 
	//		FBO.bindTexture(gl, windLayer.windMapTexture.texId, 0);
	//		windLayer.updateParticlesPositions(magoManager); 
	//	}
	//}
};

WeatherStation.prototype.renderWeather = function(magoManager)
{
	// Render all active weather type.

	// provisionally render test.
	//if (this.dustVolumesArray)
	//{
	//	// render dust layers.
	//	this.renderDust3D(magoManager);
	//}

	if (this.dustVolumesArray)
	{
		// render dust layers.
		this.renderDust3D(magoManager);
	}

	if (this.windVolumesArray)
	{
		this.renderWind3D(magoManager);
		//this.renderWindLayerDisplayPlanes(magoManager); // old.
	}
	/*
	if (this.tempLayersArray)
	{ 
		var renderType = 1;
		var shader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
		var gl = magoManager.getGl();
		//magoManager.postFxShadersManager.useProgram(shader);
		shader.useProgram(shader);
		var identityMat = new Matrix4();
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, identityMat._floatArrays);
		gl.uniform3fv(shader.buildingPosHIGH_loc, [0.0, 0.0, 0.0]);
		gl.uniform3fv(shader.buildingPosLOW_loc, [0.0, 0.0, 0.0]);
		shader.enableVertexAttribArray(shader.color4_loc);
		gl.uniform1i(shader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.
		gl.enable(gl.BLEND);

		var tempeLayersCount = this.tempLayersArray.length; 
		for (var i=0; i<tempeLayersCount; i++)
		{
			var tempLayer = this.tempLayersArray[i];
			if (tempLayer.meshesArray === undefined)
			{
				tempLayer.test_makeGeometryFromData(magoManager);
				
			}
			else
			{
				tempLayer.renderMesh(magoManager, shader, renderType);
			}
		}

		magoManager.postFxShadersManager.useProgram(null);
		shader.disableVertexAttribArray(shader.color4_loc);
	}
	*/
	
};

WeatherStation.prototype.renderWeatherORT = function(magoManager)
{
	//if (this.dustVolumesArray)
	//{
	//	// render dust layers.
	//	this.renderDust3D(magoManager);
	//}

	if (this.windVolumesArray)
	{
		this.renderWind3D(magoManager);
		//this.renderWindLayerDisplayPlanes(magoManager); // old.
	}

};

WeatherStation.prototype.renderWeatherTransparents = function(magoManager)
{
	// Render all active weather type.

	// provisionally render test.
	
	
};

WeatherStation.prototype.renderWeatherTransparentsORT = function(magoManager)
{
	// Render all active weather type.

	// provisionally render test.
	
	
};

WeatherStation.prototype.renderDust3D = function(magoManager)
{
	// StreamLines wind version.***
	if (magoManager.currentFrustumIdx > 2)
	{ return; }
	
	// DisplayVolumeBox.***
	if (this.dustVolumesArray === undefined || this.dustVolumesArray.length === 0)
	{ return; }
	
	var dustVolumesCount = this.dustVolumesArray.length;
	for (var i=0; i<dustVolumesCount; i++)
	{
		if ( i > 0)
		{
			// try to eliminate the windDisplayBox.
			if (this.dustVolumesArray[i].dustDisplayBox)
			{
				this.dustVolumesArray[i].dustDisplayBox.setOneColor(0.2, 0.7, 0.8, 0.0);
			}
		}
		//this.dustVolumesArray[i].renderMode3D(magoManager);
		this.dustVolumesArray[i].renderModeTexture(magoManager);
	}
	return;
};

WeatherStation.prototype.renderWind3D = function (magoManager)
{
	// StreamLines wind version.***
	if (magoManager.currentFrustumIdx > 2)
	{ return; }
	
	// DisplayVolumeBox.***
	if (this.windVolumesArray === undefined || this.windVolumesArray.length === 0)
	{ return; }

	var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

	var windVolumesCount = this.windVolumesArray.length;
	for (var i=0; i<windVolumesCount; i++)
	{
		if ( i > 0)
		{
			// try to eliminate the windDisplayBox.
			if (this.windVolumesArray[i].windDisplayBox)
			{
				this.windVolumesArray[i].windDisplayBox.setOneColor(0.2, 0.7, 0.8, 0.0);
			}
		}

		if (bUseMultiRenderTarget)
		{
			this.windVolumesArray[i].renderMode3DThickLines(magoManager);
		}
		else 
		{
			this.windVolumesArray[i].renderMode3DThickLinesORT(magoManager);
		}
	}
	return;
};

WeatherStation.prototype.renderWindLayerDisplayPlanes = function(magoManager)
{
	if (magoManager.currentFrustumIdx > 2)
	{ return; }
	
	// DisplayVolumeBox + 3 displayPlanes.***
	if (this.windVolumesArray === undefined || this.windVolumesArray.length === 0)
	{ return; }
	
	var windVolumesCount = this.windVolumesArray.length;
	for (var i=0; i<windVolumesCount; i++)
	{
		if ( i > 0)
		{
			// try to eliminate the windDisplayBox.
			if (this.windVolumesArray[i].windDisplayBox)
			{
				this.windVolumesArray[i].windDisplayBox.setOneColor(0.2, 0.7, 0.8, 0.0);
			}
		}
		this.windVolumesArray[i].renderMode3DThickLines(magoManager);
	}
	return;
};

WeatherStation.prototype.loadWindGeoJson = function (geoJsonFilePath)
{
	// This is the geoJson version. 2021.
	// Create a windVolume & load the wind-geoJson.
	if (!geoJsonFilePath)
	{ return false; }

	// calculate the geoJsonFileFolderPath.***
	var geoJsonFileFolderPath = "";
	try 
	{ 
		var urlInstance = new URL(geoJsonFilePath, self.location.href);
		var splitted = urlInstance.pathname.split('/');
		var spilttedsCount = splitted.length;
		for (var i=0; i<spilttedsCount-1; i++)
		{
			var word = splitted[i];
			if (word.length > 0)
			{
				geoJsonFileFolderPath += "/";
				geoJsonFileFolderPath += word;

			}
		}

		var options = {
			geoJsonFilePath       : geoJsonFilePath,
			geoJsonFileFolderPath : geoJsonFileFolderPath
		};
		var windVolume = this.newWindVolume(options);
	}
	catch (err) 
	{
		throw new Error(err);
	}
};

/**
 * add wind 
 * @param {object} geoJson geojson type object
 */
WeatherStation.prototype.addWind = function(geoJson, options)
{
	// This is the geoJson version. 2021.
	// Create a windVolume
	if (!geoJson)
	{ return false; }

	/**
	 * TODO : validation geojson
	 */

	 //validationGeosjon();
	 if (!options)
	 {
		options = {};
	 }
	 options.geoJsonFile = geoJson;

	var windVolume = this.newWindVolume(options);
	return windVolume;
};

WeatherStation.prototype.loadDustGeoJson = function(geoJsonFilePath)
{
	// This is the geoJson version. 2021.
	// Create a windVolume & load the wind-geoJson.
	if (!geoJsonFilePath)
	{ return false; }

	// calculate the geoJsonFileFolderPath.***
	var geoJsonFileFolderPath = "";
	try 
	{
		var urlInstance = new URL(geoJsonFilePath, self.location.href);
		var splitted = urlInstance.pathname.split('/');
		var spilttedsCount = splitted.length;
		for (var i=0; i<spilttedsCount-1; i++)
		{
			var word = splitted[i];
			if (word.length > 0)
			{
				geoJsonFileFolderPath += "/";
				geoJsonFileFolderPath += word;

			}
		}

		var options = {
			geoJsonFilePath       : geoJsonFilePath,
			geoJsonFileFolderPath : geoJsonFileFolderPath
		};
		var dustVolume = this.newDustVolume(options);
	}
	catch (err) 
	{
		throw new Error(err);
	}
};

/**
 * add dust 
 * @param {object} geoJson geojson type object
 */
WeatherStation.prototype.addDust = function(geoJson)
{
	// This is the geoJson version. 2021.
	// Create a windVolume
	if (!geoJson)
	{ return false; }

	/**
	 * TODO : validation geojson
	 */

	 //validationGeosjon();

	var options = {
		geoJsonFile: geoJson
	};
	var windVolume = this.newDustVolume(options);
	return windVolume;
};

WeatherStation.prototype.test_loadDustData3d = function(magoManager, dustMapFileNamesArray, dustMapFilesFolderPath)
{
	var dustLayer = new DustLayer();
	var hola = 0;

	if (this.dustLayersArray === undefined)
	{ this.dustLayersArray = []; }

	this.dustLayersArray.push(dustLayer);
};

WeatherStation.prototype.test_renderTemperatureLayer = function(magoManager)
{
	this.test_createTemperaturaLayerExample(magoManager);
	
	if (this.tempLayersArray === undefined)
	{ return; }
	
	if (this.tempLayersArray.length === 0 )
	{ return; }
	
	var tempLayer = this.tempLayersArray[0];
	tempLayer.render(magoManager);

};

WeatherStation.prototype.test_renderTemperatureMesh = function(magoManager, shader, renderType)
{
	this.test_createTemperaturaLayerExample(magoManager);
	
	if (this.tempLayersArray === undefined)
	{ return; }
	
	if (this.tempLayersArray.length === 0 )
	{ return; }

	var tempLayer = this.tempLayersArray[0];
	tempLayer.renderMesh(magoManager, shader, renderType);
};

WeatherStation.prototype.test_renderPrecipitationMesh = function(magoManager, shader, renderType)
{
	this.test_createPrecipitationLayerExample(magoManager);
	
	if (this.precipitLayersArray === undefined)
	{ return; }
	
	if (this.precipitLayersArray.length === 0 )
	{ return; }

	var precipLayer = this.precipitLayersArray[0];
	precipLayer.renderMesh(magoManager, shader, renderType);
};




































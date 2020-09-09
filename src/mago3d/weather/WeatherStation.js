'use strict';

/**
 * @class WeatherStation
 */
var WeatherStation = function() 
{
	if (!(this instanceof WeatherStation)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.provisional_geometryDataPath;
	this.windLayersArray;
	this.windVolumesArray;
	this.tempLayersArray;
	this.precipitLayersArray;
	this.dustLayersArray;
	
	this.focusedWindLayerIdx;
	this.windDisplayBox;
	
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
	
	var windVolume = new WindVolume(options);
	windVolume.weatherStation = this;
	this.windVolumesArray.push(windVolume);
	return windVolume;
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

WeatherStation.prototype.renderDust = function(magoManager)
{
	if (!this.dustLayersArray)
	{ return; }

	
};

WeatherStation.prototype.renderWeather = function(magoManager)
{
	// Render all active weather type.

	// provisionally render test.
	if (this.dustLayersArray)
	{
		// render dust layers.
		this.renderDust(magoManager);
	}

	if (this.windVolumesArray)
	{
		this.renderWindLayerDisplayPlanes(magoManager);
	}

	if (!this.windTest)
	{
		// load jeju wind data.***
		var geometryDataPath = magoManager.readerWriter.geometryDataPath;
		var windDataFilesNamesArray = ["OBS-QWM_2016062000.grib2_wind_000", "OBS-QWM_2016062001.grib2_wind_000", "OBS-QWM_2016062002.grib2_wind_000", "OBS-QWM_2016062003.grib2_wind_000",
			"OBS-QWM_2016062004.grib2_wind_000", "OBS-QWM_2016062005.grib2_wind_000", "OBS-QWM_2016062006.grib2_wind_000", "OBS-QWM_2016062007.grib2_wind_000",
			"OBS-QWM_2016062008.grib2_wind_000", "OBS-QWM_2016062009.grib2_wind_000", "OBS-QWM_2016062010.grib2_wind_000", "OBS-QWM_2016062011.grib2_wind_000",
			"OBS-QWM_2016062012.grib2_wind_000", "OBS-QWM_2016062013.grib2_wind_000", "OBS-QWM_2016062014.grib2_wind_000", "OBS-QWM_2016062015.grib2_wind_000",
			"OBS-QWM_2016062016.grib2_wind_000", "OBS-QWM_2016062017.grib2_wind_000", "OBS-QWM_2016062018.grib2_wind_000", "OBS-QWM_2016062019.grib2_wind_000",
			"OBS-QWM_2016062020.grib2_wind_000", "OBS-QWM_2016062021.grib2_wind_000", "OBS-QWM_2016062022.grib2_wind_000", "OBS-QWM_2016062023.grib2_wind_000"];
			
		//var windMapFilesFolderPath = geometryDataPath +"/JeJu_wind_Airport";
		var windMapFilesFolderPath = geometryDataPath +"/JeJu_wind_20200908"; // all jeju island.***
		//var windMapFilesFolderPath = geometryDataPath +"/JeJu_wind_GolfPark_NineBridge1";
		
		//this.test_loadWindData3d(magoManager, windDataFilesNamesArray, windMapFilesFolderPath);
		this.test_createTemperaturaLayerExample(magoManager);
		this.windTest = true;
	}

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
	
	
};

WeatherStation.prototype.renderWindLayerDisplayPlanes = function(magoManager)
{
	// DisplayVolumeBox + 3 displayPlanes.***
	if (this.windVolumesArray === undefined || this.windVolumesArray.length === 0)
	{ return; }
	
	var windVolumesCount = this.windVolumesArray.length;
	for (var i=0; i<windVolumesCount; i++)
	{
		if ( i > 0)
		{
			// try to eliminame the windDisplayBox.
			if (this.windVolumesArray[i].windDisplayBox)
			{
				this.windVolumesArray[i].windDisplayBox.setOneColor(0.2, 0.7, 0.8, 0.0);
			}
		}
		this.windVolumesArray[i].renderWindLayerDisplayPlanes(magoManager);
	}
	return;
};

WeatherStation.prototype.test_loadWindData3d = function(magoManager, windMapFileNamesArray, windMapFilesFolderPath)
{
	// Provisionally hardCoding.***
	var gl = magoManager.getGl();
	var geometryDataPath = magoManager.readerWriter.geometryDataPath;
	this.altitudeAux = 0.0;
	
	// test windVolume.
	var windVolume = this.newWindVolume();
	windVolume.loadWindData3d(magoManager, windMapFileNamesArray, windMapFilesFolderPath);
	/*
	var windVolume = this.newWindVolume();
	windVolume.loadWindData3d(magoManager, windMapFileNamesArray, windMapFilesFolderPath);
	
	var windVolume = this.newWindVolume();
	windVolume.loadWindData3d(magoManager, windMapFileNamesArray, windMapFilesFolderPath);
	*/
};

WeatherStation.prototype.test_loadDustData3d = function(magoManager, dustMapFileNamesArray, dustMapFilesFolderPath)
{
	var dustLayer = new DustLayer();
	var hola = 0;

	if (this.dustLayersArray === undefined)
	{ this.dustLayersArray = []; }

	this.dustLayersArray.push(dustLayer);
};

WeatherStation.prototype.test_renderWindLayer = function(magoManager)
{
	this.test_createWindLayerExample(magoManager);
	
	if (this.windLayersArray === undefined)
	{ return; }
	
	if (this.windLayersArray.length === 0 )
	{ return; }
	
	var gl;
	var windLayersCount = this.windLayersArray.length;
	for (var i=0; i<windLayersCount; i++)
	{
		if (i < windLayersCount-1)
		{ continue; }
		
		var windLayer = this.windLayersArray[i];
		//windLayer.render(magoManager);
		windLayer.renderMode3D(magoManager);
		gl = windLayer.gl;
	}
	
	for (var i=0; i<windLayersCount; i++)
	{
		if (i < windLayersCount-1)
		{ continue; }
		
		var windLayer = this.windLayersArray[i];
		if (windLayer.windMapTexture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
		{ continue; }
		
		FBO.bindTexture(gl, windLayer.windMapTexture.texId, 0);
		//FBO.bindTexture(gl, windLayer.particlesPositionTexture0, 1);
		//windLayer.renderWindScreen();	
		windLayer.updateParticlesPositions(magoManager);
	}
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

WeatherStation.prototype.test_renderCuttingPlanes = function(magoManager, renderType)
{
	var boolAux = false;
	if (!boolAux)
	{ return; }
	
	if (this.tempLayersArray === undefined)
	{ return; }
	
	if (this.tempLayersArray.length === 0 )
	{ return; }
	
	var tempLayer = this.tempLayersArray[0];
	
	// render cuttingPlanes if exist.***
	var gl = magoManager.sceneState.gl;
	var shader;
	if (renderType === 2) // colorCoding.***
	{
		shader = magoManager.postFxShadersManager.getShader("modelRefColorCoding"); 
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();
		
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.enableVertexAttribArray(shader.position3_loc);
		shader.disableVertexAttribArray(shader.normal3_loc);
		shader.disableVertexAttribArray(shader.color4_loc); 
	}
	else if (renderType === 0)
	{
		shader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();
		
		// test: in depth, set frustumFar = 1000.***
		//var frustumFarLoc = shader.uniformsMapGeneral["frustumFar"].uniformLocation;
		//gl.uniform1f(frustumFarLoc, new Float32Array([1000.0]));
		//if(shader.uniformsMapGeneral["frustumFar"].floatValue !== 1000)
		//	var hola = 0;
		
		shader.enableVertexAttribArray(shader.position3_loc);
	}
	else if (renderType === 1)
	{
		shader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
		magoManager.postFxShadersManager.useProgram(shader);
		shader.bindUniformGenerals();
		
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.enableVertexAttribArray(shader.position3_loc);
		shader.enableVertexAttribArray(shader.normal3_loc);
		shader.disableVertexAttribArray(shader.color4_loc); 
	}
	
	gl.uniform1i(shader.bApplySpecularLighting_loc, false);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.noiseTexture);
	gl.activeTexture(gl.TEXTURE2); 
	gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
		
	tempLayer.test_renderCuttingPlanes(magoManager, shader, renderType);
};



































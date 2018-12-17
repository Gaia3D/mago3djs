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
	this.tempLayersArray;
};

WeatherStation.prototype.newWindLayer = function()
{
	if (this.windLayersArray === undefined)
	{ this.windLayersArray = []; }
	
	var windLayer = new WindLayer();
	windLayer.weatherStation = this;
	this.windLayersArray.push(windLayer);
	return windLayer;
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
		
		var altitudeIncrement = 40000.0;
		var altitude = 16000.0;
		var filePath_inServer = geometryDataPath +"/volumRenderingTest/wind_iSuSok/wind_025.png"; // mes aprop a terra.***
		//var filePath_inServer = geometryDataPath +"/volumRenderingTest/wind_iSuSok/wind_000.png";
		var windLayer = this.newWindLayer();
		var screenTexWidth = 1024;
		var screenTexHeight = 1024;
		
		screenTexWidth = 1024 * 2;
		screenTexHeight = 1024 * 2;
		
		windLayer.init(gl, filePath_inServer, screenTexWidth, screenTexHeight);
		//windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude); // original.***
		
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
		windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude, magoManager); // original.***
		// End test.-----------------------------------------------------------------------------------
		
		/*
		altitude += altitudeIncrement;
		filePath_inServer = geometryDataPath +"/volumRenderingTest/wind_iSuSok/wind_019.png";
		windLayer = this.weatherStation.newWindLayer();
		windLayer.init(gl, filePath_inServer);
		windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude, magoManager);
		
		altitude += altitudeIncrement;
		filePath_inServer = geometryDataPath +"/volumRenderingTest/wind_iSuSok/wind_021.png";
		windLayer = this.weatherStation.newWindLayer();
		windLayer.init(gl, filePath_inServer);
		windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude, magoManager);
		
		altitude += altitudeIncrement;
		filePath_inServer = geometryDataPath +"/volumRenderingTest/wind_iSuSok/wind_019.png";
		windLayer = this.weatherStation.newWindLayer();
		windLayer.init(gl, filePath_inServer);
		windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude, magoManager);
		
		altitude += altitudeIncrement;
		filePath_inServer = geometryDataPath +"/volumRenderingTest/wind_iSuSok/wind_017.png";
		windLayer = this.weatherStation.newWindLayer();
		windLayer.init(gl, filePath_inServer);
		windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude, magoManager);
		
		altitude += altitudeIncrement;
		filePath_inServer = geometryDataPath +"/volumRenderingTest/wind_iSuSok/wind_015.png";
		windLayer = this.weatherStation.newWindLayer();
		windLayer.init(gl, filePath_inServer);
		windLayer.createEarthRegion(undefined, undefined, undefined, undefined, altitude, magoManager);
		*/
	}
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
		var windLayer = this.windLayersArray[i];
		windLayer.render(magoManager);
		gl = windLayer.gl;
	}
	
	for (var i=0; i<windLayersCount; i++)
	{
		var windLayer = this.windLayersArray[i];
		if(windLayer.windMapTexture.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
			continue;
		
		FBO.bindTexture(gl, windLayer.windMapTexture.texId, 0);
		FBO.bindTexture(gl, windLayer.particlesPositionTexture0, 1);
		windLayer.renderWindScreen();	
		windLayer.updateParticlesPositions();
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

WeatherStation.prototype.test_renderCuttingPlanes = function(magoManager, renderType)
{
	if (this.tempLayersArray === undefined)
	{ return; }
	
	if (this.tempLayersArray.length === 0 )
	{ return; }
	
	var tempLayer = this.tempLayersArray[0];
	
	// render cuttingPlanes if exist.***
	var gl = magoManager.sceneState.gl;
	var shader;
	if(renderType === 2) // colorCoding.***
	{
		shader = magoManager.postFxShadersManager.getShader("modelRefColorCoding"); 
		shader.useProgram();
		shader.bindUniformGenerals();
		
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.enableVertexAttribArray(shader.position3_loc);
		shader.disableVertexAttribArray(shader.normal3_loc);
		shader.disableVertexAttribArray(shader.color4_loc); 
	}
	else if(renderType === 0)
	{
		shader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		shader.useProgram();
		shader.bindUniformGenerals();
		
		// test: in depth, set frustumFar = 1000.***
		//var frustumFarLoc = shader.uniformsMapGeneral["frustumFar"].uniformLocation;
		//gl.uniform1f(frustumFarLoc, new Float32Array([1000.0]));
		//if(shader.uniformsMapGeneral["frustumFar"].floatValue !== 1000)
		//	var hola = 0;
		
		shader.enableVertexAttribArray(shader.position3_loc);
	}
	else if(renderType === 1)
	{
		shader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
		shader.useProgram();
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



































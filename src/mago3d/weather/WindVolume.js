'use strict';

/**
 * @class WindVolume
 */
var WindVolume = function(options) 
{
	if (!(this instanceof WindVolume)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.windLayersArray;
	this.weatherStation;
	this.extrusionHeight;
	
	// Box & plane.
	this.windDisplayBox;
	this.windDisplayPlane;
	this.windDisplayPlanesArray = [];
};

WindVolume.prototype.getWindLayersCount = function()
{
	if (this.windLayersArray === undefined)
	{ return 0; }
	
	return this.windLayersArray.length;
};

WindVolume.prototype.getWindLayer = function(idx)
{
	if (this.windLayersArray === undefined)
	{ return undefined; }
	
	return this.windLayersArray[idx];
};

WindVolume.prototype.newWindLayer = function(options)
{
	if (this.windLayersArray === undefined)
	{ this.windLayersArray = []; }
	
	var windLayer = new WindLayer(options);
	windLayer.weatherStation = this.weatherStation;
	windLayer.windVolume = this;
	this.windLayersArray.push(windLayer);
	return windLayer;
};

WindVolume.prototype.createWindDisplayPlane = function(magoManager)
{
	// 1rst, create a geoCoordsList.
	var someWindLayer = this.windLayersArray[0];
	var geoExtent = someWindLayer.geoExtent;
	if (!geoExtent)
	{ return false; }
	
	var minGeoCoord = geoExtent.minGeographicCoord;
	var maxGeoCoord = geoExtent.maxGeographicCoord;
	
	//minLon -= 0.00195;
	//maxLon += 0.00195;
	
	var minLon = minGeoCoord.longitude;
	var maxLon = maxGeoCoord.longitude;
	var minLat = minGeoCoord.latitude;
	var maxLat = maxGeoCoord.latitude;
	var minAlt = minGeoCoord.altitude;
	var maxAlt = maxGeoCoord.altitude;
	
	
	var geoCoordsList = new GeographicCoordsList();
	geoCoordsList.newGeoCoord(minLon, minLat, minAlt);
	geoCoordsList.newGeoCoord(maxLon, minLat, minAlt);
	geoCoordsList.newGeoCoord(maxLon, maxLat, minAlt);
	geoCoordsList.newGeoCoord(minLon, maxLat, minAlt);
	
	var extrusionHeight = 0.1;
	var bLoop = true;
	
	var displayPlanesCount = 1;
	for (var i=0; i<displayPlanesCount; i++)
	{
		var windDisplayPlane = geoCoordsList.getExtrudedMeshRenderableObject(extrusionHeight, bLoop, undefined, magoManager, undefined);
		windDisplayPlane.setOneColor(0.8, 0.7, 0.2, 0.0);
		windDisplayPlane.setWireframeColor(0.2, 0.3, 0.4, 1.0);
		windDisplayPlane.attributes.isMovable = true;
		windDisplayPlane.attributes.movementInAxisZ = true;

		windDisplayPlane.attributes.minAltitude = this.getMinAltitude();
		windDisplayPlane.attributes.maxAltitude = this.getMaxAltitude();
		
		windDisplayPlane.attributes.name = "windDisplayPlane";
		windDisplayPlane.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0);
		if (windDisplayPlane.options === undefined)
		{ windDisplayPlane.options = {}; }
		
		windDisplayPlane.options.renderWireframe = true;
		windDisplayPlane.options.renderShaded = true; // bcos must be selectable.
		windDisplayPlane.options.depthMask = false;
		var depth = 10;
		magoManager.modeler.addObject(windDisplayPlane, depth);
		
		this.windDisplayPlanesArray.push(windDisplayPlane);
	}
	
	return true;

};

WindVolume.prototype.createWindDisplayBox = function(magoManager)
{
	// 1rst, create a geoCoordsList.
	var windLayerLowest = this.windLayersArray[0];
	var windLayerHighest = this.windLayersArray[this.windLayersArray.length-1];
	var geoExtent = windLayerLowest.geoExtent;
	
	if (!geoExtent)
	{ return false; }
	
	var minGeoCoord = geoExtent.minGeographicCoord;
	var maxGeoCoord = geoExtent.maxGeographicCoord;
	
	var minLon = minGeoCoord.longitude;
	var maxLon = maxGeoCoord.longitude;
	var minLat = minGeoCoord.latitude;
	var maxLat = maxGeoCoord.latitude;
	var minAlt = minGeoCoord.altitude;
	var maxAlt = maxGeoCoord.altitude;
	

	var geoCoordsList = new GeographicCoordsList();
	geoCoordsList.newGeoCoord(minLon, minLat, minAlt);
	geoCoordsList.newGeoCoord(maxLon, minLat, minAlt);
	geoCoordsList.newGeoCoord(maxLon, maxLat, minAlt);
	geoCoordsList.newGeoCoord(minLon, maxLat, minAlt);

	var extrusionHeight = windLayerHighest.windData.height_above_ground - windLayerLowest.windData.height_above_ground;
	var bLoop = true;
	this.windDisplayBox = geoCoordsList.getExtrudedMeshRenderableObject(extrusionHeight, bLoop, undefined, magoManager, undefined);
	this.windDisplayBox.setOneColor(0.2, 0.7, 0.8, 0.2);
	this.windDisplayBox.attributes.isMovable = false;
	this.windDisplayBox.attributes.isSelectable = false;
	this.windDisplayBox.attributes.name = "windDisplayBox";
	this.windDisplayBox.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0); // selectedColor fully transparent.
	if (this.windDisplayBox.options === undefined)
	{ this.windDisplayBox.options = {}; }
	
	this.windDisplayBox.options.renderWireframe = true;
	this.windDisplayBox.options.renderShaded = true;
	this.windDisplayBox.options.depthMask = false;
	var depth = 10;
	magoManager.modeler.addObject(this.windDisplayBox, depth);
	
	return true;
};

WindVolume.prototype.createdElemsForDisplayBox = function(magoManager)
{
	if (this.windDisplayBox === undefined)
	{ 
		if (this.createWindDisplayBox(magoManager))
		{
			if (this.windDisplayPlanesArray.length === 0)
			{ this.createWindDisplayPlane(magoManager); }
		}			
	}
};

WindVolume.prototype.loadWindData3d = function(magoManager, windMapFileNamesArray, windMapFilesFolderPath)
{
	// Provisionally hardCoding.***
	var gl = magoManager.getGl();
	var geometryDataPath = magoManager.readerWriter.geometryDataPath;
	this.altitudeAux = 0.0;
	
	var filesCount = windMapFileNamesArray.length;
	for (var i=0; i<filesCount; i++)
	{
		this.altitudeAux += 10.0;

		/*
		var options = {
			name              : "JeJu Island",
			speedFactor       : 2.0,
			dropRate          : 0.003,
			dropRateBump      : 0.001,
			numParticles      : 65536/8,
			layerAltitude     : this.altitudeAux,
			windMapFileName   : windMapFileNamesArray[i],
			windMapFolderPath : windMapFilesFolderPath
		};
		*/
		
		// for golfPark one hole.
		var options = {
			name              : "JeJu Island",
			speedFactor       : 2.0,
			dropRate          : 0.003,
			dropRateBump      : 0.001,
			numParticles      : 65536/16,
			layerAltitude     : this.altitudeAux,
			windMapFileName   : windMapFileNamesArray[i],
			windMapFolderPath : windMapFilesFolderPath
		};
		
		var firstWindLayer;
		if (this.getWindLayersCount() > 0)
		{
			// maintain the 1rst windLayer.
			firstWindLayer = this.getWindLayer(0);
		}

		var windLayer = this.newWindLayer(options);
		windLayer.init(gl, magoManager);
		
		if (firstWindLayer !== undefined)
		{
			windLayer.particlesPositionTexturesArray = firstWindLayer.particlesPositionTexturesArray;
		}
	}
};

WindVolume.prototype.prepareWindVolume = function(magoManager)
{
	if (this.allWindLayersAreReady === undefined)
	{ this.allWindLayersAreReady = false; }
	
	if (!this.allWindLayersAreReady)
	{
		var ready = true;
		var windLayersCount = this.windLayersArray.length;
		for (var i=0; i< windLayersCount; i++)
		{
			var windLayer = this.windLayersArray[i];
			if (!windLayer.isReadyToRender())
			{
				windLayer.prepareWindLayer();
				ready = false;
			}
		}
		this.allWindLayersAreReady = ready;
	}
	
	return this.allWindLayersAreReady;
};

WindVolume.prototype.getMaxAltitude = function()
{
	var maxAltitude;
	var windLayersCount = this.windLayersArray.length;
	for (var i=0; i< windLayersCount; i++)
	{
		var windLayer = this.windLayersArray[i];
		if (i === 0)
		{
			maxAltitude = windLayer.windData.height_above_ground;
		}
		else
		{
			if (windLayer.windData.height_above_ground > maxAltitude)
			{ maxAltitude = windLayer.windData.height_above_ground; }
		}
	}
	
	return maxAltitude;
};

WindVolume.prototype.getMinAltitude = function()
{
	var minAltitude;
	var windLayersCount = this.windLayersArray.length;
	for (var i=0; i< windLayersCount; i++)
	{
		var windLayer = this.windLayersArray[i];
		if (i === 0)
		{
			minAltitude = windLayer.windData.height_above_ground;
		}
		else 
		{
			if (windLayer.windData.height_above_ground < minAltitude)
			{ minAltitude = windLayer.windData.height_above_ground; }
		}
	}
	
	return minAltitude;
};

WindVolume.prototype.getNearestWindLayerByAltitude = function(altitude)
{
	var resultWindLayer;
	var windLayersCount = this.windLayersArray.length;
	for (var i=0; i< windLayersCount-1; i++)
	{
		var windLayer = this.windLayersArray[i];
		var windLayerAbove = this.windLayersArray[i+1];
		
		if (altitude > windLayer.windData.height_above_ground && altitude < windLayerAbove.windData.height_above_ground)
		{
			resultWindLayer = windLayer;
			break;
		}
		
		if (i === 0 && altitude < windLayer.windData.height_above_ground)
		{
			resultWindLayer = windLayer;
			break;
		}
		else if (i === windLayersCount-2 && altitude > windLayerAbove.windData.height_above_ground)
		{
			resultWindLayer = windLayerAbove;
			break;
		}
	}
	
	if (!resultWindLayer)
	{ resultWindLayer = this.windLayersArray[0]; }
	
	return resultWindLayer;
};



WindVolume.prototype.renderMode3DThickLines = function(magoManager)
{
	if (this.thickLinesReady === undefined || this.thickLinesReady === false)
	{
		// Take the geoCoord of a golfHoleFlag:
		var altitude = 50.0;
		//altitude = 86;
		
		var options = {};
		options.speedFactor = 2.0*0.0000001;
		options.numPoints = 10;
		
		// Obtain the velocity in this geoCoord.
		var windLayer = this.getNearestWindLayerByAltitude(altitude);
		
		//var geoCoord = new GeographicCoord(126.40310387701689, 33.34144078912163, altitude);
		//var geoCoordsArray = windLayer.getTrajectory(geoCoord, undefined, magoManager, options);
		//var renderableObject = GeographicCoordsList.getRenderableObjectOfGeoCoordsArray(geoCoordsArray, magoManager);
		//magoManager.modeler.addObject(renderableObject, 15);
		
		// Test random points.
		var minLonRad = windLayer.geoExtent.getMinLongitudeRad();
		var minLatRad = windLayer.geoExtent.getMinLatitudeRad();
		var maxLonRad = windLayer.geoExtent.getMaxLongitudeRad();
		var maxLatRad = windLayer.geoExtent.getMaxLatitudeRad();
		var minAlt = windLayer.geoExtent.getMinAltitude();
		var maxAlt = windLayer.geoExtent.getMaxAltitude();
		var lonRadRange = maxLonRad - minLonRad;
		var latRadRange = maxLatRad - minLatRad;
		var radToDeg = 180/Math.PI;
		var optionsThickLine = {};
		optionsThickLine.startColor = new Color(0.6, 0.99, 0.99, 0.0);
		optionsThickLine.endColor = new Color(0.7, 0.9, 0.99, 1.0);
		for (var i=0; i< 40; i++)
		{
			var lon = Math.random() * (maxLonRad - minLonRad) + minLonRad;
			var lat = Math.random() * (maxLatRad - minLatRad) + minLatRad;
			
			var geoCoord = new GeographicCoord(lon*radToDeg, lat*radToDeg, altitude);
			var geoCoordsArray = windLayer.getTrajectory(geoCoord, undefined, magoManager, options);
			var renderableObject = GeographicCoordsList.getRenderableObjectOfGeoCoordsArray(geoCoordsArray, magoManager, optionsThickLine);
			magoManager.modeler.addObject(renderableObject, 10);
		}
			
		this.thickLinesReady = true;
	}
};

WindVolume.prototype.renderWindLayerDisplayPlanes = function(magoManager)
{
	if (this.windLayersArray === undefined)
	{ return; }
	
	if (this.windLayersArray.length === 0 )
	{ return; }

	// In this point, must check & prepare windLayers.***
	if (!this.prepareWindVolume())
	{ return; }

	if (this.windDisplayBox === undefined)
	{ 
		this.createdElemsForDisplayBox(magoManager); 
		return;
	}
	
	

	// Calculate the total wind data.
	if (this.windData === undefined)
	{
		this.windData = {};
	
		var windLayersCount = this.windLayersArray.length;
	
		for (var i=0; i< windLayersCount; i++)
		{
			var windLayer = this.windLayersArray[i];
			if (windLayer.windData)
			{
				if (i===0)
				{
					this.windData.uMin = windLayer.windData.uMin;
					this.windData.vMin = windLayer.windData.vMin;
					this.windData.uMax = windLayer.windData.uMax;
					this.windData.vMax = windLayer.windData.vMax;
					this.windData.height = windLayer.windData.height;
					this.windData.width = windLayer.windData.width;
				}
				else
				{
					if (windLayer.windData.uMin < this.windData.uMin)
					{ this.windData.uMin = windLayer.windData.uMin; }
				
					if (windLayer.windData.vMin < this.windData.vMin)
					{ this.windData.vMin = windLayer.windData.vMin; }
				
					if (windLayer.windData.uMax > this.windData.uMax)
					{ this.windData.uMax = windLayer.windData.uMax; }
				
					if (windLayer.windData.vMax > this.windData.vMax)
					{ this.windData.vMax = windLayer.windData.vMax; }
				
				}
			}
		}
	}
	
	// Test.*********************
	//this.renderMode3DThickLines(magoManager);
	// End test.------------------
	
	var gl = magoManager.getGl();
	var windDisplayPlanesCount = this.windDisplayPlanesArray.length;
	for (var a=0; a<windDisplayPlanesCount; a++)
	{
		var windDisplayPlane = this.windDisplayPlanesArray[a];
		var windLayer;
		var windLayersCount = this.windLayersArray.length;
		
		for (var i=windLayersCount-1; i>= 0; i--)
		{
			// check windLayer's altitude.***
			var layerAltitude = 10;
			if (this.windDisplayBox)
			{
				var geoLocData = windDisplayPlane.geoLocDataManager.getCurrentGeoLocationData();
				layerAltitude = geoLocData.geographicCoord.altitude;
			}

			windLayer = this.getNearestWindLayerByAltitude(layerAltitude);
			if (windLayer)
			{
				windLayer.windDisplayPlane = windDisplayPlane;
				
				if (windLayer.isReadyToRender())
				{
					windLayer.renderMode3D(magoManager);
					gl = windLayer.gl;
					break;
				}
				else 
				{
					windLayer.prepareWindLayer();
				}
			}
		}
		if (windLayer !== undefined && windLayer.windMapTexture !== undefined)
		{
			if (windLayer.windMapTexture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
			{ 
				FBO.bindTexture(gl, windLayer.windMapTexture.texId, 0);
				windLayer.updateParticlesPositions(magoManager); 
			}
		}
	}
};




























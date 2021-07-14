'use strict';

/**
 * @class WindVolume
 */
var WindVolume = function (options) 
{
	if (!(this instanceof WindVolume)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.windLayersArray;
	this._windLayersAltitudesArray; // use this to find the nearest windLayer by altitude.
	this.weatherStation;
	this.extrusionHeight;
	
	// Box & plane.
	this.windDisplayBox;
	this.windDisplayPlane;
	this.windDisplayPlanesArray = [];
	

	// data.
	this._geoJsonFile;
	this._geoJsonFilePath;
	this._geoJsonFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonFileFolderPath;

	// streamLines.***
	this.streamLinesArray;

	// Animation state controls.
	this._animationState = 1; // 0= paused. 1= play.
	this._particesGenerationType = 3; // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox. 3= altitudePlane

	// Particles generator.
	this._particlesGeneratorBoxesArray;

	if(options)
	{
		if(options.geoJsonFile)
		{
			this.setWindGeoJson(options.geoJsonFile);
		}

		if(options.geoJsonFilePath)
		{
			this._geoJsonFilePath = options.geoJsonFilePath;
		}

		if(options.geoJsonFileFolderPath)
		{
			this._geoJsonFileFolderPath = options.geoJsonFileFolderPath;
		}
	}
};

WindVolume.prototype.switchAnimationState = function()
{
	if(this._animationState === 0)
	this._animationState = 1;
	else if(this._animationState ===1)
	this._animationState = 0;
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

WindVolume.prototype.deleteObjects = function(magoManager)
{
	if(this.windLayersArray)
	{
		var windlayersCount = this.windLayersArray.length;
		for(var i=0; i<windlayersCount; i++)
		{
			this.windLayersArray[i].deleteObjects(magoManager);
			this.windLayersArray[i] = undefined;
		}
	}

	this.windLayersArray = undefined;

	this._windLayersAltitudesArray = undefined; // use this to find the nearest windLayer by altitude.
	this.weatherStation = undefined;
	this.extrusionHeight = undefined;
	
	// Box & plane.
	var vboMemManager = magoManager.vboMemoryManager;
	if(this.windDisplayBox)
	{
		this.windDisplayBox.deleteObjects(vboMemManager);

		// Must delete the box from smartTiles.
		magoManager.modeler.removeObject(this.windDisplayBox);
	}
	this.windDisplayBox = undefined;

	this.windDisplayPlane = undefined;
	if(this.windDisplayPlanesArray)
	{
		var displayPlanesCount = this.windDisplayPlanesArray.length;
		for(var i=0; i<displayPlanesCount; i++)
		{
			this.windDisplayPlanesArray[i].deleteObjects(vboMemManager);

			// Must delete the box from smartTiles.
			magoManager.modeler.removeObject(this.windDisplayPlanesArray[i]);
			this.windDisplayPlanesArray[i] = undefined;
		}
	}
	this.windDisplayPlanesArray = undefined;
	

	// data.
	delete this._geoJsonFile;
	this._geoJsonFilePath = undefined;
	this._geoJsonFileLoadState = undefined;
	this._geoJsonFileFolderPath = undefined;

	// streamLines.***
	if(this.streamLinesArray)
	{
		var linesCount = this.streamLinesArray.length;
		for(var i=0; i<linesCount; i++)
		{
			this.streamLinesArray[i].deleteObjects(vboMemManager);
			this.streamLinesArray[i] = undefined;
		}
	}
	this.streamLinesArray = undefined;

	// Animation state controls.
	this._animationState = undefined; // 0= paused. 1= play.
	this._particesGenerationType = undefined; // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox. 3= altitudePlane

	// Particles generator.
	if(this._particlesGeneratorBoxesArray)
	{
		var boxesCount = this._particlesGeneratorBoxesArray.length;
		for(var i=0; i<boxesCount; i++)
		{
			this._particlesGeneratorBoxesArray[i].deleteObjects(vboMemManager);

			// Must delete the box from smartTiles.
			magoManager.modeler.removeObject(this._particlesGeneratorBoxesArray[i]);
			this._particlesGeneratorBoxesArray[i] = undefined;
		}
	}
	this._particlesGeneratorBoxesArray = undefined;
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

WindVolume.prototype.createWindParticlesCreatorBox = function(magoManager)
{
	// 1rst, create a geoCoordsList.
	var geoExtent = this.getGeographicExtent();
	if (!geoExtent)
	{ return false; }

	// Create the particlesGenerator in the middle of windVolume.
	var midGeoCoord = geoExtent.getMidPoint(undefined);
	var minGeoCoord = geoExtent.minGeographicCoord;
	var maxGeoCoord = geoExtent.maxGeographicCoord;
	
	var minLon = minGeoCoord.longitude;
	var maxLon = maxGeoCoord.longitude;
	var minLat = minGeoCoord.latitude;
	var maxLat = maxGeoCoord.latitude;
	var minAlt = minGeoCoord.altitude;
	var maxAlt = maxGeoCoord.altitude;

	// Test with box.***
	var width = 50.0;
	var length = 50.0;
	var height = 50.0;
	var name = "particlesGenerator";
	var initialGeoCoord = new GeographicCoord(midGeoCoord.longitude, midGeoCoord.latitude, minAlt + 10.0);
	var box = new Box(width, length, height, name);
	box.setGeographicPosition(initialGeoCoord, 0, 0, 0);
	box.attributes.isMovable = true;
	box.options = {};
	var depth = 6;
	magoManager.modeler.addObject(box, depth);

	if(!this._particlesGeneratorBoxesArray)
	this._particlesGeneratorBoxesArray = [];

	this._particlesGeneratorBoxesArray.push(box);
	
	return true;
};

WindVolume.prototype.createWindDisplayPlane = function(magoManager)
{
	// 1rst, create a geoCoordsList.
	var geoExtent = this.getGeographicExtent();
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

	minAlt = 35.0;
	
	
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

		// Test.*******************************************************************
		//if (windDisplayPlane.attributes.maxAltitude < 1000.0)
		//{ windDisplayPlane.attributes.maxAltitude = 2000.0; }
		//-------------------------------------------------------------------------
		
		windDisplayPlane.attributes.name = "windDisplayPlane";
		windDisplayPlane.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0);
		if (windDisplayPlane.options === undefined)
		{ windDisplayPlane.options = {}; }
		
		windDisplayPlane.options.renderWireframe = true;
		windDisplayPlane.options.renderShaded = true; // bcos must be selectable.
		windDisplayPlane.options.depthMask = false;
		var depth = 5;
		magoManager.modeler.addObject(windDisplayPlane, depth);
		
		this.windDisplayPlanesArray.push(windDisplayPlane);
	}
	return true;
};

WindVolume.prototype.getGeographicExtent = function()
{
	if(!this.geoExtent)
	{
		// use geoJson to calculate the geoExtent.
		var features = this._geoJsonFile.features;
		var layersCount = features.length;
		if(layersCount > 0)
		{
			var layer;
			layer = features[0]; // take the first layer, to set the bbox.
			var bbox = new BoundingBox();
			bbox.initXYZData(layer.bbox[0], layer.bbox[1], layer.bbox[2]);
			for(var i=0; i<layersCount; i++)
			{
				layer = features[i];

				// calculate windVolume-bbox.
				var layerBBox = layer.bbox;
				bbox.addXYZData(layerBBox[0], layerBBox[1], layerBBox[2]);
				bbox.addXYZData(layerBBox[3], layerBBox[4], layerBBox[5]);
			}

			// calculate the geoExtent of the windVolume.
			this.geoExtent = new GeographicExtent(bbox.minX, bbox.minY, bbox.minZ,  bbox.maxX, bbox.maxY, bbox.maxZ);
		}
	}

	return this.geoExtent;
};

WindVolume.prototype.createWindDisplayBox = function(magoManager)
{
	// 1rst, create a geoCoordsList.
	//var windLayerLowest = this.windLayersArray[0];
	//var windLayerHighest = this.windLayersArray[this.windLayersArray.length-1];
	//var geoExtent = windLayerLowest.getGeographicExtent();
	
	var geoExtent = this.getGeographicExtent();
	if (!geoExtent)
	{ 
		return false; 
	}
	
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

	//var extrusionHeight = windLayerHighest.windData.height_above_ground - windLayerLowest.windData.height_above_ground;
	var extrusionHeight = maxAlt - minAlt;

	
	var bLoop = true;
	this.windDisplayBox = geoCoordsList.getExtrudedMeshRenderableObject(extrusionHeight, bLoop, undefined, magoManager, undefined);
	this.windDisplayBox.setOneColor(0.2, 0.7, 0.8, 0.05);
	this.windDisplayBox.attributes.isMovable = false;
	this.windDisplayBox.attributes.isSelectable = false;
	this.windDisplayBox.attributes.name = "windDisplayBox";
	this.windDisplayBox.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0); // selectedColor fully transparent.
	if (this.windDisplayBox.options === undefined)
	{ this.windDisplayBox.options = {}; }
	
	this.windDisplayBox.options.renderWireframe = true;
	this.windDisplayBox.options.renderShaded = true;
	this.windDisplayBox.options.depthMask = false;
	var depth = 4;
	magoManager.modeler.addObject(this.windDisplayBox, depth);
	
	return true;
};

WindVolume.prototype._createdElemsForDisplayBox = function(magoManager)
{
	if (this.windDisplayBox === undefined)
	{ 
		if (this.createWindDisplayBox(magoManager))
		{
			if (this.windDisplayPlanesArray.length === 0)
			{ this.createWindDisplayPlane(magoManager); }

			//this.createWindParticlesCreatorBox(magoManager);
		}			
	}
};

WindVolume.prototype.setWindGeoJson = function (windGeoJson)
{
	if(!windGeoJson)
	{
		return;
	}

	this._geoJsonFile = windGeoJson;
	this._geoJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;

	if(this._geoJsonFile.style && this._geoJsonFile.style.colorRamp)
	{
		// make a colorRamp.
		this.colorRamp = new ColorRamp(this._geoJsonFile.style.colorRamp);
	}
};

WindVolume.prototype.loadWindGeoJson = function ()
{
	// This is the geoJson version. 2021.
	if(this._geoJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this._geoJsonFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._geoJsonFilePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that.setWindGeoJson(res);
		});
	}
};

WindVolume.prototype.prepareVolume = function(magoManager)
{
	// We need:
	// 1- geoJson file.
	// 2- wind-layers.
	//-------------------------------------------
	// 1rst, check if the geoJson is loaded.***
	if(!this._prepareWindGeoJson())
	{
		return false;
	}

	// Now, check if windLayers are prepared.***
	if(!this._prepareWindLayers())
	{
		return false;
	}

	if (this.windDisplayBox === undefined)
	{ 
		this._createdElemsForDisplayBox(magoManager); 
		return false;
	}

	return true;
};

WindVolume.prototype.getMaxAltitude = function()
{
	var geoExtent = this.getGeographicExtent();
	if(geoExtent)
	{
		return geoExtent.maxGeographicCoord.altitude;
	} 

	return undefined;
};

WindVolume.prototype.getMinAltitude = function()
{
	var geoExtent = this.getGeographicExtent();
	if(geoExtent)
	{
		return geoExtent.minGeographicCoord.altitude;
	} 

	return undefined;
};

WindVolume.prototype.getNearestWindLayerByAltitude = function(altitude)
{
	if(!this._windLayersAltitudesArray)
	{
		// Make windLayersAltitudesArray to find the nearest windLayer.
		return;
	}

	var idx = WeatherStation.binarySearch_layersByAltitude(this._windLayersAltitudesArray, altitude);
	var windLayer = this.windLayersArray[idx];
	return windLayer;
};

WindVolume.prototype._getRayIntersectionWithVolume = function(screenX, screenY, magoManager)
{
	// this function returns a segment that is the intersection of the ray with the windVolume.
	var gl = magoManager.getGl();
	var linearDepth;
	var frustumFar, frustumNear;
	var normal4;
	var resultRaySC = ManagerUtils.getRayCamSpace(screenX, screenY, undefined, magoManager);

	// 1rst, intersect the REAR FACE.************************************************************
	var windVolumeRearFBO = this._getVolumeRearFBO();
	var depthTex = windVolumeRearFBO.colorBuffersArray[1];
	var normalTex = windVolumeRearFBO.colorBuffersArray[2];
	var resultObject = ManagerUtils.calculatePixelLinearDepthV2(gl, screenX, screenY, depthTex, normalTex, magoManager);
	if(resultObject.frustumIdx < magoManager.numFrustums)
	{
		linearDepth = resultObject.linearDepth;
		frustumFar = resultObject.far;
		frustumNear = resultObject.near;
		normal4 = resultObject.normal4;
	}

	// check if the ray intersects the volume:
	if(normal4[0] + normal4[1] + normal4[2] < 0.1)
	{
		// if there are no intersection with the rear face, then ther are no intersection.
		return undefined;
	}

	var realZDepth = linearDepth * frustumFar; 

	// now, find the 3d position of the pixel in camCoord.*
	var posCC_rear = new Point3D(resultRaySC[0] * realZDepth, resultRaySC[1] * realZDepth, resultRaySC[2] * realZDepth); 

	// 2nd, intersect the FRONT FACE.************************************************************
	var windVolumeFrontFBO = this._getVolumeFrontFBO();
	depthTex = windVolumeFrontFBO.colorBuffersArray[1];
	normalTex = windVolumeFrontFBO.colorBuffersArray[2];
	resultObject = ManagerUtils.calculatePixelLinearDepthV2(gl, screenX, screenY, depthTex, normalTex, magoManager);
	if(resultObject.frustumIdx < magoManager.numFrustums)
	{
		linearDepth = resultObject.linearDepth;
		frustumFar = resultObject.far;
		frustumNear = resultObject.near;
		normal4 = resultObject.normal4;
	}

	var posCC_front;
	if(normal4[0] + normal4[1] + normal4[2] < 0.1)
	{
		// The camera is inside of the volume, so there are no intersection with front face.
		// Considere posCC_front = (0, 0, 0) = cameraPosCC.
		posCC_front = new Point3D(0,0,0); 
	}
	else
	{
		realZDepth = linearDepth * frustumFar; 

		// now, find the 3d position of the pixel in camCoord.*
		posCC_front = new Point3D(resultRaySC[0] * realZDepth, resultRaySC[1] * realZDepth, resultRaySC[2] * realZDepth); 
	}

	// Now, return the result segment.
	return new Segment3D(posCC_front, posCC_rear);
};

WindVolume.prototype.newWindStreamLine = function (magoManager)
{
	var optionsThickLine = {};
	optionsThickLine.startColor = new Color(0.8, 1.0, 1.0, 1.0);
	optionsThickLine.endColor = new Color(0.8, 1.0, 1.0, 1.0);
	optionsThickLine.numPoints = this.weatherStation.WIND_STREAMLINES_NUMPOINTS;

	var sceneState = magoManager.sceneState;
	var screenWidth = sceneState.drawingBufferWidth[0];
	var screenHeight = sceneState.drawingBufferHeight[0];

	if (this._particesGenerationType === 1) // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox. 3= altitudePlane
	{
		var screenX = Math.floor(Math.random() * screenWidth);
		var screenY = Math.floor(Math.random() * screenHeight);

		var segment = this._getRayIntersectionWithVolume(screenX, screenY, magoManager);
		if (segment)
		{
			var farRandom = Math.random();
			var dir = segment.getDirection();
			var lengthRandom = segment.getLength() * farRandom;
			var strP = segment.startPoint3d;

			// posCC = startPoint + dir * farRandom * length.
			var posCC = new Point3D(strP.x + dir.x * lengthRandom, strP.y + dir.y * lengthRandom, strP.z + dir.z * lengthRandom );// Original.***
			//var posCC = new Point3D(segment.endPoint3d.x, segment.endPoint3d.y, segment.endPoint3d.z );
			
			// now, convert posCC to posWC.
			var posWC = ManagerUtils.cameraCoordPositionToWorldCoord(posCC, undefined, magoManager);

			// now calculate geoCoord of posWC.
			var geoCoord = ManagerUtils.pointToGeographicCoord(posWC, undefined);

			var renderableObject = this._getWindStreamLine(geoCoord, magoManager, optionsThickLine);
			return renderableObject;
		}
	}
	else if (this._particesGenerationType === 2) // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox.
	{
		// Check if exist particlesGeneratorBoxes.
		if(this._particlesGeneratorBoxesArray && this._particlesGeneratorBoxesArray.length > 0)
		{
			// Provisionally take the 1rst.
			var pGeneratorBox = this._particlesGeneratorBoxesArray[0];
			var geoLocData = pGeneratorBox.geoLocDataManager.getCurrentGeoLocationData();

			var geoCoord = geoLocData.geographicCoord;
			var randomLon = (0.5 - Math.random()) * 0.001;
			var randomLat = (0.5 - Math.random()) * 0.001;
			var randomAlt = (Math.random()) * 50.0;
			var geoCoordSemiRandom = new GeographicCoord(geoCoord.longitude + randomLon, geoCoord.latitude + randomLat, geoCoord.altitude + randomAlt);

			var renderableObject = this._getWindStreamLine(geoCoordSemiRandom, magoManager, optionsThickLine);
			return renderableObject;
		}
	}
	if (this._particesGenerationType === 3) // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox. 3= altitudePlane
	{
		var screenX = Math.floor(Math.random() * screenWidth);
		var screenY = Math.floor(Math.random() * screenHeight);

		var segment = this._getRayIntersectionWithVolume(screenX, screenY, magoManager);
		if (segment)
		{
			var farRandom = Math.random();
			var dir = segment.getDirection();
			var lengthRandom = segment.getLength() * farRandom;
			var strP = segment.startPoint3d;

			// posCC = startPoint + dir * farRandom * length.
			//var posCC = new Point3D(strP.x + dir.x * lengthRandom, strP.y + dir.y * lengthRandom, strP.z + dir.z * lengthRandom );// Original.***
			var posCC = new Point3D(segment.endPoint3d.x, segment.endPoint3d.y, segment.endPoint3d.z );
			
			// now, convert posCC to posWC.
			var posWC = ManagerUtils.cameraCoordPositionToWorldCoord(posCC, undefined, magoManager);

			// now calculate geoCoord of posWC.
			var geoCoord = ManagerUtils.pointToGeographicCoord(posWC, undefined);

			var renderableObject = this._getWindStreamLine(geoCoord, magoManager, optionsThickLine);
			return renderableObject;
		}
	}

	return undefined;
};

WindVolume.prototype.newWindStreamLine_oneLayer = function(magoManager)
{
	var altitude = 80.0;
	//altitude = 86;
	
	//var options = {};
	//options.speedFactor = 2.0*0.0000001;
	//options.numPoints = 600;
	
	// Obtain the velocity in this geoCoord.
	var windLayer = this.getNearestWindLayerByAltitude(altitude);
	if(!windLayer)// || !windLayer.windPlaneFBO)
	{
		return;
	}

	// 1rst, render the wind plane depth.
	//windLayer.renderWindPlaneDepth(magoManager); // depth wind-plane needed when update particles positions.
	
	//var geoCoord = new GeographicCoord(126.40310387701689, 33.34144078912163, altitude);
	//var geoCoordsArray = windLayer.getTrajectory(geoCoord, undefined, magoManager, options);
	//var renderableObject = GeographicCoordsList.getRenderableObjectOfGeoCoordsArray(geoCoordsArray, magoManager);
	//magoManager.modeler.addObject(renderableObject, 15);
	
	// Test random points.
	var geoExtent = windLayer.getGeographicExtent();
	var minLonRad = geoExtent.getMinLongitudeRad();
	var minLatRad = geoExtent.getMinLatitudeRad();
	var maxLonRad = geoExtent.getMaxLongitudeRad();
	var maxLatRad = geoExtent.getMaxLatitudeRad();
	var minAlt = geoExtent.getMinAltitude();
	var maxAlt = geoExtent.getMaxAltitude();
	var lonRadRange = maxLonRad - minLonRad;
	var latRadRange = maxLatRad - minLatRad;
	var radToDeg = 180/Math.PI;
	var optionsThickLine = {};
	optionsThickLine.startColor = new Color(0.8, 1.0, 1.0, 1.0);
	optionsThickLine.endColor = new Color(0.8, 1.0, 1.0, 1.0);
	optionsThickLine.numPoints = 300;

	var sceneState = magoManager.sceneState;
	var screenWidth = sceneState.drawingBufferWidth[0];
	var screenHeight = sceneState.drawingBufferHeight[0];

	var screenX = Math.floor(Math.random() * screenWidth);
	var screenY = Math.floor(Math.random() * screenHeight);

	// now check the windPlaneDepth in the screenCoord.
	var windPlaneFBO = windLayer.getWindPlaneFBO(magoManager);
	var depthTex = windPlaneFBO.colorBuffersArray[1];
	var normalTex = windPlaneFBO.colorBuffersArray[2];
	
	var gl = magoManager.getGl();
	var resultObject = ManagerUtils.calculatePixelLinearDepthV2(gl, screenX, screenY, depthTex, normalTex, magoManager);

	var linearDepth;
	var frustumFar, frustumNear;
	if(resultObject.frustumIdx < magoManager.numFrustums)
	{
		linearDepth = resultObject.linearDepth;
		frustumFar = resultObject.far;
		frustumNear = resultObject.near;
	}

	var realZDepth = linearDepth * frustumFar; 

	// now, find the 3d position of the pixel in camCoord.*
	var resultRaySC = ManagerUtils.getRayCamSpace(screenX, screenY, undefined, magoManager);
	var posCC = new Point3D(); 
	posCC.set(resultRaySC[0] * realZDepth, resultRaySC[1] * realZDepth, resultRaySC[2] * realZDepth);// Original.

	// now, convert posCC to posWC.
	var posWC = ManagerUtils.cameraCoordPositionToWorldCoord(posCC, undefined, magoManager);

	// now calculate geoCoord of posWC.
	var geoCoord = ManagerUtils.pointToGeographicCoord(posWC, undefined);
	var windPlaneAltitude = windLayer.windData.height_above_ground;
	if (Math.abs(geoCoord.altitude - windPlaneAltitude) > 50.0)
	{
		return undefined;
	}

	geoCoord.altitude = altitude;

	// Check if intersects with the geoExtent.
	if(geoExtent.intersects2dWithGeoCoord(geoCoord))
	{
		var renderableObject = this._getWindStreamLine_oneLayer(geoCoord, windLayer, magoManager, optionsThickLine);
		return renderableObject;
	}

	return undefined;
};

WindVolume.prototype._prepareWindGeoJson = function()
{
	if(this._geoJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this.loadWindGeoJson();
		return false;
	}
	else if(this._geoJsonFileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	return true;
};

WindVolume.prototype._prepareWindLayers = function()
{
	if(!this._geoJsonFile)
	{
		return false;
	}

	if (this.windLayersArray === undefined)
	{
		this.windLayersArray = [];

		var geoJsonFileFolderPath = this._geoJsonFileFolderPath;
		var features = this._geoJsonFile.features;
		var layersCount = features.length;
		if(layersCount > 0)
		{
			this._windLayersAltitudesArray = new Array(layersCount);
			var layer;
			layer = features[0]; // take the frist layer, to set the bbox.
			var bbox = new BoundingBox();
			bbox.initXYZData(layer.bbox[0], layer.bbox[1], layer.bbox[2]);
			for(var i=0; i<layersCount; i++)
			{
				layer = features[i];
				var options = {
					geoJsonFile : layer,
					geoJsonFileFolderPath : geoJsonFileFolderPath
				};
				var windLayer = this.newWindLayer(options);

				// calculate windVolume-bbox.
				var layerBBox = layer.bbox;
				bbox.addXYZData(layerBBox[0], layerBBox[1], layerBBox[2]);
				bbox.addXYZData(layerBBox[3], layerBBox[4], layerBBox[5]);

				// make windLayerAltitudesArray.
				this._windLayersAltitudesArray[i] = layerBBox[2];
			}

			// calculate the geoExtent of the windVolume.
			if(!this.geoExtent)
			{
				// use geoJson to calculate the geoExtent.
				this.geoExtent = new GeographicExtent(bbox.minX, bbox.minY, bbox.minZ,  bbox.maxX, bbox.maxY, bbox.maxZ);
			}
			else
			{
				this.geoExtent.setExtent(bbox.minX, bbox.minY, bbox.minZ,  bbox.maxX, bbox.maxY, bbox.maxZ);
			}
		}

		return false;
	}

	if(!this._allWindLayersPrepared)
	{
		var allLayersPrepared = true;
		var layersCount = this.windLayersArray.length;
		for(var i=0; i<layersCount; i++)
		{
			var windLayer = this.windLayersArray[i];

			if(!windLayer.prepareWindLayer())
			{
				allLayersPrepared = false;
			}
		}
		
		if(allLayersPrepared)
		{
			this._allWindLayersPrepared = true;
		}

		return false;
	}

	return true;
};

WindVolume.prototype._getVolumeFrontFBO = function(magoManager)
{
	if(!this.volumeFrontFBO)
	{
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0];
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.volumeFrontFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 4}); 
	}

	return this.volumeFrontFBO;
};

WindVolume.prototype._getVolumeRearFBO = function(magoManager)
{
	if(!this.volumeRearFBO)
	{
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0];
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.volumeRearFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 4}); 
	}

	return this.volumeRearFBO;
};

WindVolume.prototype.renderDepthWindVolume = function(magoManager)
{
	// Render depth 2 times:
	// 1- render the rear faces.
	// 2- render the front faces.
	//-------------------------------

	// This function renders the wind-layer depth texture.
	// Provisionally wind-layer is a rectangle3d.
	// renderDepth of the "this.windDisplayPlane".
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();
	var extbuffers = magoManager.extbuffers;

	// Now, render the windPlane.
	if(!this.visibleObjControler)
	{
		this.visibleObjControler = new VisibleObjectsController();
	}

	if(this.windDisplayBox)
	{ this.visibleObjControler.currentVisibleNativeObjects.opaquesArray[0] = this.windDisplayBox; }

	// When render rear, add the lowestWindLayer.***
	if(this.windDisplayPlanesArray && this.windDisplayPlanesArray.length > 0)
	{
		var windDisplayPlane = this.windDisplayPlanesArray[0];
		this.visibleObjControler.currentVisibleNativeObjects.opaquesArray[1] = windDisplayPlane;
	}

	// Front Face.***************************************************************************************************************************
	var windVolumeFrontFBO = this._getVolumeFrontFBO(magoManager);
	windVolumeFrontFBO.bind();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, windVolumeFrontFBO.colorBuffersArray[0], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, windVolumeFrontFBO.colorBuffersArray[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, windVolumeFrontFBO.colorBuffersArray[2], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, windVolumeFrontFBO.colorBuffersArray[3], 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex (front).
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
	  ]);

	if (magoManager.currentFrustumIdx === 2)
	{
		gl.clearColor(0, 0, 0, 1);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
	}

	var renderType = 1;
	gl.frontFace(gl.CCW);
	magoManager.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControler);

	// Test:
	magoManager.windVolumeFrontDepthTex = windVolumeFrontFBO.colorBuffersArray[1];
	magoManager.windVolumeFrontNormalTex = windVolumeFrontFBO.colorBuffersArray[2];
	// End front face.---------------------------------------------------------------------------------------------------------------------------

	// Rear Face.***************************************************************************************************************************
	var windVolumeRearFBO = this._getVolumeRearFBO(magoManager);
	windVolumeRearFBO.bind();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, windVolumeRearFBO.colorBuffersArray[0], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, windVolumeRearFBO.colorBuffersArray[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, windVolumeRearFBO.colorBuffersArray[2], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, windVolumeRearFBO.colorBuffersArray[3], 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex (front).
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
	  ]);

	if (magoManager.currentFrustumIdx === 2)
	{
		gl.clearColor(0, 0, 0, 1);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
	}

	var renderType = 1;
	gl.frontFace(gl.CW);
	magoManager.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControler);

	// Test:
	magoManager.windVolumeRearDepthTex = windVolumeRearFBO.colorBuffersArray[1];
	magoManager.windVolumeRearNormalTex = windVolumeRearFBO.colorBuffersArray[2];

	// End rear face.---------------------------------------------------------------------------------------------------------------------------

	// Return to main framebuffer.************************
	// return default values:
	gl.frontFace(gl.CCW);

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
};

WindVolume.prototype.renderMode3DThickLines = function (magoManager)
{
	if (!this.prepareVolume(magoManager))
	{ return; }

	if(!this.streamLinesArray)
	{ this.streamLinesArray = []; }

	var currStreamLinesCount = this.streamLinesArray.length;

	// Render the windVolume-depth (rear & front).***
	this.renderDepthWindVolume(magoManager);
	
	if (currStreamLinesCount < this.weatherStation.WIND_MAXPARTICLES_INSCREEN && magoManager.currentFrustumIdx === 0)// && this.counterAux > 5)
	{
		for(var i=0; i<3; i++)
		{
			var streamLine = this.newWindStreamLine(magoManager);
			if(streamLine)
			{
				this.streamLinesArray.push(streamLine);	
			}
		}
	}
	
	var extbuffers = magoManager.extbuffers;
	var gl = magoManager.getGl();
	magoManager.bindMainFramebuffer();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.depthTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.normalTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
		]);
	//-------------------------------------------------------------------------------------------------------------
			  
	var gl = magoManager.getGl();
	var renderType = 1;
	var sceneState = magoManager.sceneState;

	// Now render the streamLines (thickLines).
	// change shader. use "thickLines" shader.
	var thickLineShader = magoManager.postFxShadersManager.getShader("windStreamThickLine"); 
	thickLineShader.useProgram();
	thickLineShader.bindUniformGenerals();
	
	gl.uniform4fv(thickLineShader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
	gl.uniform1i(thickLineShader.colorType_loc, 0);
	gl.uniform2fv(thickLineShader.viewport_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	gl.uniform1f(thickLineShader.thickness_loc, this.weatherStation.windThickness);

	gl.uniform1i(thickLineShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(thickLineShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1i(thickLineShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);

	//gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.disable(gl.CULL_FACE);
	gl.enable(gl.BLEND);

	gl.enableVertexAttribArray(thickLineShader.prev_loc);
	gl.enableVertexAttribArray(thickLineShader.current_loc);
	gl.enableVertexAttribArray(thickLineShader.next_loc);
	
	
	var vectorTypeObjectsCount = this.streamLinesArray.length;
	var streamLine;
	var streamLinesArrayAux = [];

	var options = {
		animationState : this._animationState
	};

	for (var i=0; i<vectorTypeObjectsCount; i++)
	{
		streamLine = this.streamLinesArray[i];
		var geoLocData = streamLine.geoLocDataManager.getCurrentGeoLocationData();
		geoLocData.bindGeoLocationUniforms(gl, thickLineShader);
		streamLine.render(magoManager, thickLineShader, options);

		if(streamLine.finished)
		{
			// this stream line finished.
			streamLine.deleteObjects(magoManager.vboMemoryManager);
			streamLine = undefined;
			
		}
		else
		{
			streamLinesArrayAux.push(streamLine);
		}
	}

	this.streamLinesArray = streamLinesArrayAux;
	
	// return to the current shader.
	gl.useProgram(null);
	gl.enable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
	
};

WindVolume.prototype.renderMode3DThickLines_oneLayer = function(magoManager)
{
	if (this.windLayersArray === undefined)
	{ return; }
	
	if (this.windLayersArray.length === 0 )
	{ return; }

	// In this point, must check & prepare windLayers.***
	if (!this.prepareVolume())
	{ return; }

	if (this.windDisplayBox === undefined)
	{ 
		this._createdElemsForDisplayBox(magoManager); 
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

	//**********************************************************************************************************************
	//**********************************************************************************************************************
	//**********************************************************************************************************************
	// Try to render wind plane depth.***
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
			var layerAltitude = 150;
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
					//windLayer.renderMode3D(magoManager);
					//gl = windLayer.gl;
					//break;
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
				// Render the wind plane depth.
				windLayer.renderWindPlaneDepth(magoManager); // depth wind-plane needed when update particles positions.

				//if (magoManager.isFarestFrustum())
				//{
				//	FBO.bindTexture(gl, windLayer.windMapTexture.texId, 0);
				//	windLayer.updateParticlesPositions(magoManager); 
				//}
			}
		}
	}
	//----------------------------------------------------------------------------------------------------------------------------
	//----------------------------------------------------------------------------------------------------------------------------
	//----------------------------------------------------------------------------------------------------------------------------

	if(!this.streamLinesArray)
	{
		this.streamLinesArray = [];
	}
	

	if(this.streamLinesArray.length < 1000 && magoManager.currentFrustumIdx === 0)// && this.counterAux > 5)
	{
		for(var i=0; i<3; i++)
		{
			var streamLine = this.newWindStreamLine(magoManager);
			if(streamLine)
			{
				this.streamLinesArray.push(streamLine);	
			}
		}
	}

	
	var extbuffers = magoManager.extbuffers;
		magoManager.scene._context._currentFramebuffer._bind();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.depthTex, 0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.normalTex, 0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

			extbuffers.drawBuffersWEBGL([
				extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
				extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
				extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
				extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
			  ]);
		/*
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
	//-------------------------------------------------------------------------------------------------------------

	var gl = magoManager.getGl();
	var renderType = 1;
	var sceneState = magoManager.sceneState;

	// Now render the streamLines (thickLines).
	// change shader. use "thickLines" shader.
	var thickLineShader = magoManager.postFxShadersManager.getShader("windStreamThickLine"); 
	thickLineShader.useProgram();
	thickLineShader.bindUniformGenerals();
	
	gl.uniform4fv(thickLineShader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
	gl.uniform1i(thickLineShader.colorType_loc, 0);
	gl.uniform2fv(thickLineShader.viewport_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	gl.uniform1f(thickLineShader.thickness_loc, 2.5);

	gl.uniform1i(thickLineShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(thickLineShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1i(thickLineShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);

	//gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.disable(gl.CULL_FACE);
	gl.enable(gl.BLEND);
	//gl.depthMask(false);

	gl.enableVertexAttribArray(thickLineShader.prev_loc);
	gl.enableVertexAttribArray(thickLineShader.current_loc);
	gl.enableVertexAttribArray(thickLineShader.next_loc);
	
	
	var vectorTypeObjectsCount = this.streamLinesArray.length;
	var streamLine;
	var streamLinesArrayAux = [];
	//this.streamLinesFinishedArray.length = 0;// init.

	for (var i=0; i<vectorTypeObjectsCount; i++)
	{
		streamLine = this.streamLinesArray[i];
		var geoLocData = streamLine.geoLocDataManager.getCurrentGeoLocationData();
		geoLocData.bindGeoLocationUniforms(gl, thickLineShader);
		streamLine.render(magoManager, thickLineShader);

		if(streamLine.finished)
		{
			// this stream line finished.
			streamLine.deleteObjects(magoManager.vboMemoryManager);
			streamLine = undefined;
			
		}
		else
		{
			streamLinesArrayAux.push(streamLine);
		}
	}

	this.streamLinesArray = streamLinesArrayAux;
	
	// return to the current shader.
	gl.useProgram(null);
	gl.enable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
	gl.depthMask(true);

};

WindVolume.prototype._getTrajectoryInLocalCoordinates = function(startGeoCoord, magoManager, options)
{
	// Obtain the velocity in this geoCoord.
	var geoExtent = this.getGeographicExtent();

	// 1rst, check if the geoCoord is inside of this windLayer range.
	if (!geoExtent.intersects2dWithGeoCoord(startGeoCoord))
	{ return undefined; }

	var minLonRad = geoExtent.getMinLongitudeRad();
	var minLatRad = geoExtent.getMinLatitudeRad();
	var maxLonRad = geoExtent.getMaxLongitudeRad();
	var maxLatRad = geoExtent.getMaxLatitudeRad();
	var lonRadRange = maxLonRad - minLonRad;
	var latRadRange = maxLatRad - minLatRad;

	// Calculate the texCoord of the "geoCoord".
	var currLon = startGeoCoord.getLongitudeRad();
	var currLat = startGeoCoord.getLatitudeRad();
	var currAlt = startGeoCoord.getAltitude();

	// Test to calculate speedFactor by globeRadius.**********************************************************
	var midLat = geoExtent.getCenterLatitude();
	var radius = Globe.radiusAtLatitudeDeg(midLat);
	var distortion = Math.cos(midLat * Math.PI/180);
	var meterToLon = 1.0 / (radius * distortion);
	var meterToLat = 1.0 / radius;

	var speedFactor = 1.0;
	var xSpeedFactor = speedFactor;
	var ySpeedFactor = speedFactor;
	var zSpeedFactor = speedFactor;
	//---------------------------------------------------------------------------------------------------
	
	var numPoints = 20;
	
	if (options)
	{
		//if (options.speedFactor !== undefined)
		//{ speedFactor = options.speedFactor; }
		
		if (options.numPoints !== undefined)
		{ numPoints = options.numPoints; }
	}

	var resultPointsLCArray = []; 

	var pointLC = new Point3D();
	//resultPointsLCArray.push(pointLC); // push the 1rst pointLC.***

	var curXinMeters = 0.0;
	var curYinMeters = 0.0;
	var curZinMeters = 0.0;
	var offsetXinMeters;
	var offsetYinMeters;
	var offsetZinMeters;
	
	// Create a lineString with numPoints.***
	var windLayersCount = this.windLayersArray.length;
	var speedDown;
	var speedUp;
	var velocity3d;
	var zFactor;
	for (var i=0; i<numPoints; i++)
	{
		var s = (currLon - minLonRad)/lonRadRange;
		var t = (currLat - minLatRad)/latRadRange;

		if(s > 1.0 || t > 1.0 || s < 0.0 || t < 0.0)
		{
			// Considere process finished.***
			return resultPointsLCArray;
		}
		
		// now, with "currAlt" find the 2 windLayers.
		var idxUp = WeatherStation.binarySearch_layersByAltitude(this._windLayersAltitudesArray, currAlt);
		if(idxUp >= windLayersCount)
		{ idxUp = windLayersCount - 1; }
		else if(idxUp < 0)
		{ idxUp = 0; }
		var idxDown = (idxUp - 1) < 0 ? 0 : idxUp - 1;

		//idxDown = 7;
		//idxUp = 7;
		var windLayerDown = this.windLayersArray[idxDown];
		var windLayerUp = this.windLayersArray[idxUp];

		// calculate the altDiff of "currAlt" with "windLayerDown".
		var downLayerAltitude = windLayerDown.getAltitude();
		var upLayerAltitude = windLayerUp.getAltitude();
		var altDiffLayers = upLayerAltitude - downLayerAltitude;
		var altDiffRelToDownLayer = currAlt - downLayerAltitude;
		if (idxUp === idxDown)
		{
			zFactor = 1.0;
		}
		else
		{
			zFactor = altDiffRelToDownLayer / altDiffLayers;
		}

		speedDown = windLayerDown.getVelocityVector3d_biLinearInterpolation(s, t, speedDown, magoManager);
		speedUp = windLayerUp.getVelocityVector3d_biLinearInterpolation(s, t, speedUp, magoManager);

		// now, do weight-interpolation.
		velocity3d = Point3D.mix(speedDown, speedUp, zFactor, velocity3d);
		//velocity3d = windLayerDown.getVelocityVector3d_biLinearInterpolation(s, t, velocity3d, magoManager);

		

		// calculate currLon & currLat.
		var distortion = Math.cos((minLatRad + currLat * latRadRange ));

		offsetXinMeters = velocity3d.x / distortion * xSpeedFactor;
		offsetYinMeters = velocity3d.y * ySpeedFactor;
		offsetZinMeters = velocity3d.z * zSpeedFactor;

		curXinMeters += offsetXinMeters;
		curYinMeters += offsetYinMeters;
		curZinMeters += offsetZinMeters;

		var pointLC = new Point3D(curXinMeters, curYinMeters, curZinMeters);
		resultPointsLCArray.push(pointLC); // push the 1rst pointLC.

		if(options.velocitiesArray)
		{
			options.velocitiesArray.push(velocity3d);
		}

		// Now, calculate geoCoord for next point.
		currLon += offsetXinMeters * meterToLon;
		currLat += offsetYinMeters * meterToLat;
		currAlt += offsetZinMeters;

		if(Math.abs(velocity3d.x) + Math.abs(velocity3d.y) + Math.abs(velocity3d.z) < 0.002)
		{
			return resultPointsLCArray;
		}
		
	}
	
	
	return resultPointsLCArray;
};

WindVolume.prototype._getWindStreamLine = function (startGeoCoord, magoManager, options)
{	
	// 1rst, make points3dList relative to the 1rst_geoCoord.
	if (options === undefined)
	{
		options = {};
	}

	if (options.thickness === undefined)
	{ options.thickness = 2.0; }

	if (options.color === undefined)
	{ options.color = new Color(1.0, 0.3, 0.3, 1.0); }

	// check the colorRamp.***
	if(this.colorRamp)
	{
		// need velocities array.
		if(options.velocitiesArray === undefined)
		{ options.velocitiesArray = []; }
	}
	

	// Make pointsLC rel to startGeoCoord.
	var points3dLCArray = this._getTrajectoryInLocalCoordinates(startGeoCoord, magoManager, options);

	if(!points3dLCArray || points3dLCArray.length < 2)
	{
		return undefined;
	}

	points3dLCArray.reverse();

	var geoLoc = ManagerUtils.calculateGeoLocationData(startGeoCoord.longitude, startGeoCoord.latitude, startGeoCoord.altitude, 0, 0, 0, undefined);

	var vectorMesh = new VectorMeshWind(options);
	
	var optionsThickLine = {
		colorType: "alphaGradient"
	};

	// If exist this.colorRamp, then create colorsArray.*****************************************************************************
	if(this.colorRamp)
	{
		options.colorsArray = []; // create colors array.***

		var valuesCount = options.velocitiesArray.length;
		var color; 
		var vel, speed;
		var minSpeed = 1000000.0;
		var maxSpeed = -100.0;
		for(var i=0; i<valuesCount; i++)
		{
			vel = options.velocitiesArray[i];
			speed = vel.getModul();
			color = this.colorRamp.getInterpolatedColor(speed);
			options.colorsArray.push(color);

			if(speed > maxSpeed)
			{
				maxSpeed = speed;
			}
			else if(speed < minSpeed)
			{
				minSpeed = speed;
			}
		}
	}



	vectorMesh.vboKeysContainer = Point3DList.getVboThickLines(magoManager, points3dLCArray, vectorMesh.vboKeysContainer, options);
	vectorMesh.geoLocDataManager = new GeoLocationDataManager();
	vectorMesh.geoLocDataManager.addGeoLocationData(geoLoc);
	vectorMesh.objectType = MagoRenderable.OBJECT_TYPE.VECTORMESH;

	// Now, create a customVbo.
	var pointsCount = points3dLCArray.length;
	var indicesDataArray = new Float32Array(pointsCount*4);
	for(var i=0; i<pointsCount*4; i++)
	{
		indicesDataArray[i] = i.toFixed(0);
	}

	var vbo = vectorMesh.vboKeysContainer.getVboKey(0);
	var vboMemManager = magoManager.vboMemoryManager;
	var dimensions = 1;
	var name = "indices";
	var attribLoc = 4;
	vbo.setDataArrayCustom(indicesDataArray, vboMemManager, dimensions, name, attribLoc);

	// calculate vectorMesh "BoundingSphereWC".***********************************************
	/*
	vectorMesh.boundingSphereWC = new BoundingSphere();
	var positionWC = geoLoc.position;
	var bboxLC = Point3DList.getBoundingBoxOfPoints3DArray(points3dLCArray, undefined);
	var radiusAprox = bboxLC.getRadiusAprox();
	vectorMesh.boundingSphereWC.setCenterPoint(positionWC.x, positionWC.y, positionWC.z);
	vectorMesh.boundingSphereWC.setRadius(radiusAprox);
	*/
	// End calculating boundingSphereWC.------------------------------------------------------
	return vectorMesh;
};

WindVolume.prototype._getWindStreamLine_oneLayer = function(geoCoordsArray, magoManager, options)
{
	if (geoCoordsArray === undefined || geoCoordsArray.length === 0)
	{ return undefined; }
	
	// 1rst, make points3dList relative to the 1rst_geoCoord.
	// To do this, calculate middleGeoCoord.
	var geoExtent = GeographicCoordsList.getGeographicExtent(geoCoordsArray, undefined);
	var firstGeoCoord = geoExtent.getMidPoint(undefined);
	var geoLoc = ManagerUtils.calculateGeoLocationData(firstGeoCoord.longitude, firstGeoCoord.latitude, firstGeoCoord.altitude, 0, 0, 0, undefined);
	
	// Transform geoCoords to posWC.
	var geoCoordsCount = geoCoordsArray.length;
	var pointsWCArray = new Array(geoCoordsCount);
	
	for(var i=0; i<geoCoordsCount; i++)
	{
		var cartesian = Globe.geographicToCartesianWgs84(geoCoordsArray[i].longitude, geoCoordsArray[i].latitude, geoCoordsArray[i].altitude, undefined);
		var posWC = new Point3D(cartesian[0], cartesian[1], cartesian[2]);
		pointsWCArray[i] = posWC;
	}

	// now, convert posWC to posLC.
	var points3dLCArray = new Array(geoCoordsCount);
	for(var i=0; i<geoCoordsCount; i++)
	{
		points3dLCArray[i] = geoLoc.getTransformedRelativePosition(pointsWCArray[i], points3dLCArray[i]);
	}

	//var points3dLCArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLoc, geoCoordsArray, undefined);
	
	// Now, for each point, set attributes by speed & others.
	
	
	// Create a vectorMesh.
	if (options === undefined)
	{
		options = {};
	}

	if (options.thickness === undefined)
	{ options.thickness = 2.0; }

	if (options.color === undefined)
	{ options.color = new Color(1.0, 0.3, 0.3, 1.0); }

	var vectorMesh = new VectorMeshWind(options);
	
	var optionsThickLine = {
		colorType: "alphaGradient"
	};
	vectorMesh.vboKeysContainer = Point3DList.getVboThickLines(magoManager, points3dLCArray, vectorMesh.vboKeysContainer, options);
	vectorMesh.geoLocDataManager = new GeoLocationDataManager();
	vectorMesh.geoLocDataManager.addGeoLocationData(geoLoc);
	vectorMesh.objectType = MagoRenderable.OBJECT_TYPE.VECTORMESH;

	// Now, create a customVbo.
	var pointsCount = points3dLCArray.length;
	var indicesDataArray = new Float32Array(pointsCount*4);
	for(var i=0; i<pointsCount*4; i++)
	{
		indicesDataArray[i] = i.toFixed(0);
	}

	var vbo = vectorMesh.vboKeysContainer.getVboKey(0);
	var vboMemManager = magoManager.vboMemoryManager;
	var dimensions = 1;
	var name = "indices";
	var attribLoc = 4;
	vbo.setDataArrayCustom(indicesDataArray, vboMemManager, dimensions, name, attribLoc);

	// calculate vectorMesh "BoundingSphereWC".***********************************************
	/*
	vectorMesh.boundingSphereWC = new BoundingSphere();
	var positionWC = geoLoc.position;
	var bboxLC = Point3DList.getBoundingBoxOfPoints3DArray(points3dLCArray, undefined);
	var radiusAprox = bboxLC.getRadiusAprox();
	vectorMesh.boundingSphereWC.setCenterPoint(positionWC.x, positionWC.y, positionWC.z);
	vectorMesh.boundingSphereWC.setRadius(radiusAprox);
	*/
	// End calculating boundingSphereWC.------------------------------------------------------
	return vectorMesh;
};

WindVolume.prototype.renderWindLayerDisplayPlanes = function(magoManager)
{
	// old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.***
	// old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.***
	// old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.*** old.***
	if (this.windLayersArray === undefined)
	{ return; }
	
	if (this.windLayersArray.length === 0 )
	{ return; }

	// In this point, must check & prepare windLayers.***
	if (!this.prepareVolume())
	{ return; }

	if (this.windDisplayBox === undefined)
	{ 
		this._createdElemsForDisplayBox(magoManager); 
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
					//windLayer.renderMode3D(magoManager);
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
				// Render the wind plane depth.
				windLayer.renderWindPlaneDepth(magoManager); // depth wind-plane needed when update particles positions.

				if (magoManager.isFarestFrustum())
				{
					//FBO.bindTexture(gl, windLayer.windMapTexture.texId, 0);
					//windLayer.updateParticlesPositions(magoManager); 
				}
			}
		}
	}

	
	
};




























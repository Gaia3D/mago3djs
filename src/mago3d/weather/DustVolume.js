'use strict';

/**
 * @class DustVolume
 */
var DustVolume = function(options) 
{
	if (!(this instanceof DustVolume)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.dustLayersArray;
	this._dustLayersAltitudesArray; // use this to find the nearest windLayer by altitude.
	this.weatherStation;
	this.extrusionHeight;
	
	// Box & plane.
	this.dustDisplayBox;
	this.dustDisplayPlane;
	this.dustDisplayPlanesArray = [];
	

	// data.
	this._geoJsonFile;
	this._geoJsonFilePath;
	this._geoJsonFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonFileFolderPath;

	// dust particles-lines array. 
	this.particlesArray;

	// Animation state controls.
	this._animationState = 1; // 0= paused. 1= play.
	this._particesGenerationType = 1; // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox.

	// Particles generator.
	this._particlesGeneratorBoxesArray;

	if(options)
	{
		if(options.geoJsonFile)
		{
			this._geoJsonFile = options.geoJsonFile;
			this._geoJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;;
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

DustVolume.prototype.loadDustGeoJson = function()
{
	// This is the geoJson version. 2021.
	if(this._geoJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this._geoJsonFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._geoJsonFilePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that._geoJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that._geoJsonFile = res;
		});
	}
};

DustVolume.prototype._prepareDustGeoJson = function()
{
	if(this._geoJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this.loadDustGeoJson();
		return false;
	}
	else if(this._geoJsonFileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	return true;
};

DustVolume.prototype.deleteObjects = function(magoManager)
{
	// This function deletes all dustLayers.
	if(this.dustLayersArray)
	{
		var dustlayersCount = this.dustLayersArray.length;
		for(var i=0; i<dustlayersCount; i++)
		{
			this.dustLayersArray[i].deleteObjects(magoManager);
			this.dustLayersArray[i] = undefined;
		}
	}

	this.dustLayersArray = undefined;

	// now, delete others objects.
	this._dustLayersAltitudesArray = undefined; // use this to find the nearest windLayer by altitude.
	this.weatherStation = undefined;
	this.extrusionHeight = undefined;
	
	// Box & plane.
	var vboMemManager = magoManager.vboMemoryManager;
	if(this.dustDisplayBox)
	{
		this.dustDisplayBox.deleteObjects(vboMemManager);

		// Must delete the box from smartTiles.
		magoManager.modeler.removeObject(this.dustDisplayBox);
	}
	this.dustDisplayBox = undefined;

	this.dustDisplayPlane = undefined;
	if(this.dustDisplayPlanesArray)
	{
		var displayPlanesCount = this.dustDisplayPlanesArray.length;
		for(var i=0; i<displayPlanesCount; i++)
		{
			this.dustDisplayPlanesArray[i].deleteObjects(vboMemManager);

			// Must delete the box from smartTiles.
			magoManager.modeler.removeObject(this.dustDisplayPlanesArray[i]);
			this.dustDisplayPlanesArray[i] = undefined;
		}
	}
	this.dustDisplayPlanesArray = undefined;
	

	// data.
	this._geoJsonFile;
	this._geoJsonFilePath;
	this._geoJsonFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonFileFolderPath;

	// dust particles-lines array. 
	this.particlesArray;

	// Animation state controls.
	this._animationState = 1; // 0= paused. 1= play.
	this._particesGenerationType = 1; // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox.

	// Particles generator.
	this._particlesGeneratorBoxesArray;
};

DustVolume.prototype.newDustLayer = function(options)
{
	if (this.dustLayersArray === undefined)
	{ this.dustLayersArray = []; }
	
	var dustLayer = new DustLayer(options);
	dustLayer.weatherStation = this.weatherStation;
	dustLayer.dustVolume = this;
	this.dustLayersArray.push(dustLayer);
	return dustLayer;
};

DustVolume.prototype._prepareDustLayers = function()
{
	if(!this._geoJsonFile)
	{
		return false;
	}

	if (this.dustLayersArray === undefined)
	{
		this.dustLayersArray = [];

		var geoJsonFileFolderPath = this._geoJsonFileFolderPath;
		var features = this._geoJsonFile.features;
		var layersCount = features.length;
		if(layersCount > 0)
		{
			this._dustLayersAltitudesArray = new Array(layersCount);
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
				var dustLayer = this.newDustLayer(options);

				// calculate windVolume-bbox.
				var layerBBox = layer.bbox;
				bbox.addXYZData(layerBBox[0], layerBBox[1], layerBBox[2]);
				bbox.addXYZData(layerBBox[3], layerBBox[4], layerBBox[5]);

				// make dustLayerAltitudesArray.
				this._dustLayersAltitudesArray[i] = layerBBox[2];
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

	if(!this._allDustLayersPrepared)
	{
		var allLayersPrepared = true;
		var layersCount = this.dustLayersArray.length;
		for(var i=0; i<layersCount; i++)
		{
			var dustLayer = this.dustLayersArray[i];

			if(!dustLayer.prepareDustLayer())
			{
				allLayersPrepared = false;
			}
		}
		
		if(allLayersPrepared)
		{
			this._allDustLayersPrepared = true;
		}

		return false;
	}

	return true;
};

DustVolume.prototype.getGeographicExtent = function()
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

DustVolume.prototype.createDustDisplayBox = function(magoManager)
{
	// 1rst, create a geoCoordsList.
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
	this.dustDisplayBox = geoCoordsList.getExtrudedMeshRenderableObject(extrusionHeight, bLoop, undefined, magoManager, undefined);
	this.dustDisplayBox.setOneColor(0.2, 0.7, 0.8, 0.05);
	this.dustDisplayBox.attributes.isMovable = false;
	this.dustDisplayBox.attributes.isSelectable = false;
	this.dustDisplayBox.attributes.name = "dustDisplayBox";
	this.dustDisplayBox.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0); // selectedColor fully transparent.
	if (this.dustDisplayBox.options === undefined)
	{ this.dustDisplayBox.options = {}; }
	
	this.dustDisplayBox.options.renderWireframe = true;
	this.dustDisplayBox.options.renderShaded = true;
	this.dustDisplayBox.options.depthMask = false;
	var depth = 4;
	magoManager.modeler.addObject(this.dustDisplayBox, depth);
	
	return true;
};

DustVolume.prototype.createDustDisplayPlane = function(magoManager)
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
		var dustDisplayPlane = geoCoordsList.getExtrudedMeshRenderableObject(extrusionHeight, bLoop, undefined, magoManager, undefined);
		this.dustDisplayPlaneForTexture = geoCoordsList.getRenderableObjectPolygon(undefined, undefined);
		dustDisplayPlane.setOneColor(0.8, 0.7, 0.2, 0.0);
		dustDisplayPlane.setWireframeColor(0.2, 0.3, 0.4, 1.0);
		dustDisplayPlane.attributes.isMovable = true;
		dustDisplayPlane.attributes.movementInAxisZ = true;

		// Do altitudes limitation.***
		dustDisplayPlane.attributes.minAltitude = this.getMinAltitude();
		dustDisplayPlane.attributes.maxAltitude = this.getMaxAltitude();
		
		dustDisplayPlane.attributes.name = "dustDisplayPlane";
		dustDisplayPlane.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0);
		if (dustDisplayPlane.options === undefined)
		{ dustDisplayPlane.options = {}; }
		
		dustDisplayPlane.options.renderWireframe = true;
		dustDisplayPlane.options.renderShaded = true; // bcos must be selectable.
		dustDisplayPlane.options.depthMask = false;
		var depth = 5;
		magoManager.modeler.addObject(dustDisplayPlane, depth);
		
		this.dustDisplayPlanesArray.push(dustDisplayPlane);

		// Make texCoords for "this.dustDisplayPlaneForTexture".
		if(this.dustDisplayPlaneForTexture)
		{
			var mesh = this.dustDisplayPlaneForTexture.getObject(0); // there are only 1 object.
			mesh.calculateTexCoordsBox(undefined);
		}
		/*
		// Test to create a speechBubble of the plane.************************************************************
		var bubbleWidth = 128;
		var bubbleHeight = 128;
		var textSize = 24;

		var target = {
			nativeId  : dustDisplayPlane._guid,
			nativeObject : dustDisplayPlane
		};
	
		var commentTextOption = {
			pixel       : textSize,
			color       : 'blue',
			borderColor : 'blue',
			text        : '권재현바보'
		};
	
		var speechBubbleOptions = {
			width             : bubbleWidth,
			height            : bubbleHeight,
			commentTextOption : commentTextOption,
			bubbleColor       : {r: 1, g: 1, b: 1}
		};
	
		var options = {
			speechBubbleOptions : speechBubbleOptions,
			target              : target
		};
	
		magoManager.objMarkerManager.newObjectMarkerSpeechBubble(options, magoManager.objMarkerManager);
		// End the speechBubble test.-------------------------------------------------------------------------------
		*/
	}
	return true;
};

DustVolume.prototype.getMaxAltitude = function()
{
	var geoExtent = this.getGeographicExtent();
	if(geoExtent)
	{
		return geoExtent.maxGeographicCoord.altitude;
	} 

	return undefined;
};

DustVolume.prototype.getMinAltitude = function()
{
	var geoExtent = this.getGeographicExtent();
	if(geoExtent)
	{
		return geoExtent.minGeographicCoord.altitude;
	} 

	return undefined;
};

DustVolume.prototype._createdElemsForDisplayBox = function(magoManager)
{
	if (this.dustDisplayBox === undefined)
	{ 
		if (this.createDustDisplayBox(magoManager))
		{
			if (this.dustDisplayPlanesArray.length === 0)
			{ this.createDustDisplayPlane(magoManager); }
		}			
	}
};

DustVolume.prototype.prepareVolume = function(magoManager)
{
	// We need:
	// 1- geoJson file.
	// 2- wind-layers.
	//-------------------------------------------
	// 1rst, check if the geoJson is loaded.***
	if(!this._prepareDustGeoJson())
	{
		return false;
	}

	// Now, check if windLayers are prepared.***
	if(!this._prepareDustLayers())
	{
		return false;
	}
	
	if (this.dustDisplayBox === undefined)
	{ 
		this._createdElemsForDisplayBox(magoManager); 
		return false;
	}
	

	return true;
};

DustVolume.prototype._getVolumeFrontFBO = function(magoManager)
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

DustVolume.prototype._getVolumeRearFBO = function(magoManager)
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

DustVolume.prototype.renderDepthDustVolume = function(magoManager)
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

	if(this.dustDisplayBox)
	{ this.visibleObjControler.currentVisibleNativeObjects.opaquesArray[0] = this.dustDisplayBox; }

	// When render rear, add the lowestWindLayer.***
	if(this.dustDisplayPlanesArray && this.dustDisplayPlanesArray.length > 0)
	{
		var dustDisplayPlane = this.dustDisplayPlanesArray[0];
		this.visibleObjControler.currentVisibleNativeObjects.opaquesArray[1] = dustDisplayPlane;
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

DustVolume.prototype._getRayIntersectionWithVolume = function(screenX, screenY, magoManager)
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

DustVolume.prototype.getDustDensityInGeographicCoord = function(geoCoord)
{
	// 1rst, find the 2 dustlayers to interpolate.
	if(!geoCoord)
	return undefined;

	var altitude = geoCoord.altitude;
};

DustVolume.prototype._get2LayersInfoByAltitude = function(altitude)
{
	var idxUp = WeatherStation.binarySearch_layersByAltitude(this._dustLayersAltitudesArray, altitude, undefined, undefined);
	var dustLayersCount = this.dustLayersArray.length;
	if(idxUp >= dustLayersCount)
	{ idxUp = dustLayersCount - 1; }
	else if(idxUp < 0)
	{ idxUp = 0; }
	var idxDown = (idxUp - 1) < 0 ? 0 : idxUp - 1;

	var dustLayerDown = this.dustLayersArray[idxDown];
	var dustLayerUp = this.dustLayersArray[idxUp];

	// calculate the altDiff of "altitude" with "windLayerDown".
	var downLayerAltitude = dustLayerDown.getAltitude();
	var upLayerAltitude = dustLayerUp.getAltitude();
	var altDiffLayers = upLayerAltitude - downLayerAltitude;
	var altDiffRelToDownLayer = altitude - downLayerAltitude;
	var zFactor;
	if (idxUp === idxDown)
	{
		zFactor = 1.0;
	}
	else
	{
		zFactor = altDiffRelToDownLayer / altDiffLayers;
	}

	var resultObj = {
		idxUp : idxUp,
		idxDown : idxDown,
		zFactor : zFactor
	};

	return resultObj;
};

DustVolume.prototype._getDustConcentration = function(geoCoord, magoManager)
{
	var geoExtent = this.getGeographicExtent();

	// 1rst, check if the geoCoord is inside of this windLayer range.
	if (!geoExtent.intersects2dWithGeoCoord(geoCoord))
	{ return undefined; }

	var minLonRad = geoExtent.getMinLongitudeRad();
	var minLatRad = geoExtent.getMinLatitudeRad();
	var maxLonRad = geoExtent.getMaxLongitudeRad();
	var maxLatRad = geoExtent.getMaxLatitudeRad();
	var lonRadRange = maxLonRad - minLonRad;
	var latRadRange = maxLatRad - minLatRad;

	// Calculate the texCoord of the "geoCoord".
	var currLon = geoCoord.getLongitudeRad();
	var currLat = geoCoord.getLatitudeRad();
	var currAlt = geoCoord.getAltitude();

	// Find the 2 layers to interpolate.
	var info = this._get2LayersInfoByAltitude(currAlt);
	var zFactor = info.zFactor;

	var dustLayerDown = this.dustLayersArray[info.idxDown];
	var dustLayerUp = this.dustLayersArray[info.idxUp];

	//var dustLayerUp = this.dustLayersArray[info.idxDown]; // delete this.
	

	// Test. get concentration with no interpolation.
	var s = (currLon - minLonRad)/lonRadRange;
	var t = (currLat - minLatRad)/latRadRange;

	if(s > 1.0 || t > 1.0 || s < 0.0 || t < 0.0)
	{
		return undefined;
	}

	var concent_up = dustLayerUp.getConcentration_biLinearInterpolation(s, t, magoManager);
	var concent_down = dustLayerDown.getConcentration_biLinearInterpolation(s, t, magoManager);

	var concent = concent_down * (1.0 - zFactor) + concent_down * zFactor;
	return concent;
};

DustVolume.prototype.newDustParticle = function(magoManager)
{
	var optionsThickLine = {};
	optionsThickLine.startColor = new Color(0.8, 1.0, 1.0, 1.0);
	optionsThickLine.endColor = new Color(0.8, 1.0, 1.0, 1.0);
	optionsThickLine.numPoints = 300;

	var sceneState = magoManager.sceneState;
	var screenWidth = sceneState.drawingBufferWidth[0];
	var screenHeight = sceneState.drawingBufferHeight[0];

	var dustParticle;
	if (this._particesGenerationType === 1) // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox.
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

			// now, check the dustConcentration in the "geoCoord".
			var dustConcentration = this._getDustConcentration(geoCoord, magoManager);
			
			if(dustConcentration > 0.0)
			{
				// Create a dust-particle.
				dustParticle = {
					posWC : posWC,
					geoCoord : geoCoord,
					dustConcentration : dustConcentration
				}; // provisionally is an object.
			}
		}

		return dustParticle;
	}
	else if (this._particesGenerationType === 2) // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox.
	{
		// TODO: TODO: TODO: TODO: TODO: TODO: TODO:
		// Check if exist particlesGeneratorBoxes.
		/*
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
		*/
	}

	return undefined;
};

DustVolume.prototype.renderModeTexture = function(magoManager)
{
	if (!this.prepareVolume(magoManager))
	{ return; }

	if(!this.dustDisplayPlaneForTexture)
	{ return; }

	if(!this.dustDisplayPlanesArray)
	{ return; }

	var gl = magoManager.getGl();
	var extbuffers = magoManager.extbuffers;
	
	magoManager.bindMainFramebuffer();
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.depthTex, 0);
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.normalTex, 0);
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.NONE, // gl_FragData[1] - depthTex
		extbuffers.NONE, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
		]);
	//-------------------------------------------------------------------------------------------------------------

	var sceneState = magoManager.sceneState;

	// Now render the streamLines (thickLines).
	// change shader. use "thickLines" shader.
	var shader = magoManager.postFxShadersManager.dustTextureModeShader; 
	shader.useProgram();
	shader.bindUniformGenerals();

	gl.uniformMatrix4fv(shader.modelViewMatrix4RelToEye_loc, false, sceneState.modelViewRelToEyeMatrix._floatArrays);
	gl.uniformMatrix4fv(shader.modelViewProjectionMatrix4RelToEye_loc, false, sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	
	gl.uniform4fv(shader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
	gl.uniform1i(shader.colorType_loc, 0);
	gl.uniform2fv(shader.viewport_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	gl.uniform1f(shader.thickness_loc, 2.5);

	gl.uniform1i(shader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(shader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1i(shader.uFrustumIdx_loc, magoManager.currentFrustumIdx);

	//gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
	//gl.blendFunc(gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA); // Original.***
	gl.disable(gl.CULL_FACE);
	gl.enable(gl.BLEND);

	gl.uniform3fv(shader.cameraPosHIGH_loc, sceneState.encodedCamPosHigh);
	gl.uniform3fv(shader.cameraPosLOW_loc, sceneState.encodedCamPosLow);
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);


	var frustum = sceneState.camera.frustum;
	gl.uniform1f(shader.uNear_loc, frustum.near[0]);
	gl.uniform1f(shader.uFar_loc, frustum.far[0]);

	//gl.activeTexture(gl.TEXTURE0);
	//gl.bindTexture(gl.TEXTURE_2D, smokeTex.texId);  // silhouette depth texture.***
	var currAlt = this.dustDisplayPlanesArray[0].geoLocDataManager.getCurrentGeoLocationData().geographicCoord.altitude;
	var info = this._get2LayersInfoByAltitude(currAlt);
	var zFactor = info.zFactor;

	var dustLayerDown = this.dustLayersArray[info.idxDown];
	var dustLayerUp = this.dustLayersArray[info.idxUp];

	gl.uniform2fv(shader.uDustConcentMinMax_up_loc, dustLayerUp.getMinMaxConcentration());
	gl.uniform2fv(shader.uDustConcentMinMax_down_loc, dustLayerDown.getMinMaxConcentration());

	gl.uniform2fv(shader.u_tex_res_loc, [dustLayerDown.dustMapTexture.imageWidth, dustLayerDown.dustMapTexture.imageHeight]);
	gl.uniform1f(shader.uZFactor_loc, zFactor);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, dustLayerDown.dustMapTexture.texId);  // silhouette depth texture.***
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, dustLayerUp.dustMapTexture.texId);  // silhouette depth texture.***
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	// now, check the altitude of the displayPlane.
	var altitude = 0.0;

	if(this.dustDisplayPlanesArray.length > 0)
	{
		var dustDisplayPlane = this.dustDisplayPlanesArray[0];
		var geoLocData = dustDisplayPlane.geoLocDataManager.getCurrentGeoLocationData();
		var geographicCoord = geoLocData.geographicCoord;
		altitude = geographicCoord.altitude;
	}

	var renderType = 1;
	var glPrimitive = undefined;
	var bIsSelected = false;
	this.dustDisplayPlaneForTexture.render(magoManager, shader, renderType, glPrimitive, bIsSelected);

	//----------------------------------------------------------------------------------------------
	// return to the current shader.
	gl.useProgram(null);
	gl.enable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
};

DustVolume.prototype.renderMode3D = function(magoManager)
{
	if (!this.prepareVolume(magoManager))
	{ return; }

	// test.&****************
	var smokeTex = this.weatherStation.getSmokeTexture();
	if(!smokeTex)
	{ return; }

	if(!this.particlesArray)
	{ this.particlesArray = []; }

	
	// Render the windVolume-depth (rear & front).***
	this.renderDepthDustVolume(magoManager);
	
	if (this.particlesArray.length < 3000 && magoManager.currentFrustumIdx === 0)// && this.counterAux > 5)
	{
		for(var i=0; i<3; i++)
		{
			var dustParticle = this.newDustParticle(magoManager);
			if(dustParticle)
			{
				this.particlesArray.push(dustParticle);	
			}
		}
	}
	var gl = magoManager.getGl();
	var extbuffers = magoManager.extbuffers;
	
	magoManager.bindMainFramebuffer();
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.depthTex, 0);
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.normalTex, 0);
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.NONE, // gl_FragData[1] - depthTex
		extbuffers.NONE, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
		]);
	//-------------------------------------------------------------------------------------------------------------
			
	var gl = magoManager.getGl();
	var renderType = 1;
	var sceneState = magoManager.sceneState;

	// Now render the streamLines (thickLines).
	// change shader. use "thickLines" shader.
	var shader = magoManager.postFxShadersManager.dustParticleShader; 
	shader.useProgram();
	shader.bindUniformGenerals();

	gl.uniformMatrix4fv(shader.modelViewMatrix4RelToEye_loc, false, sceneState.modelViewRelToEyeMatrix._floatArrays);
	gl.uniformMatrix4fv(shader.modelViewProjectionMatrix4RelToEye_loc, false, sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	
	gl.uniform4fv(shader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
	gl.uniform1i(shader.colorType_loc, 0);
	gl.uniform2fv(shader.viewport_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	gl.uniform1f(shader.thickness_loc, 2.5);

	gl.uniform1i(shader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(shader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1i(shader.uFrustumIdx_loc, magoManager.currentFrustumIdx);

	//gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
	//gl.blendFunc(gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA); // Original.***
	gl.disable(gl.CULL_FACE);
	gl.enable(gl.BLEND);

	gl.uniform3fv(shader.cameraPosHIGH_loc, sceneState.encodedCamPosHigh);
	gl.uniform3fv(shader.cameraPosLOW_loc, sceneState.encodedCamPosLow);
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
	gl.uniform2fv(shader.uDustConcentMinMax_loc, [0.0, 18.0]);

	var frustum = sceneState.camera.frustum;
	gl.uniform1f(shader.uNear_loc, frustum.near[0]);
	gl.uniform1f(shader.uFar_loc, frustum.far[0]);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, smokeTex.texId);  // silhouette depth texture.***
	
	var particlesCount = this.particlesArray.length;
	var dustParticle;

	

	var options = {
		animationState : this._animationState
	};

	var vboMemManager = magoManager.vboMemoryManager;
	for (var i=0; i<particlesCount; i++)
	{
		dustParticle = this.particlesArray[i];
		var vboKeysContainer = dustParticle.vboKeysContainer;
		var geoCoord = dustParticle.geoCoord;
		// check if exist vbo.
		if(!vboKeysContainer)
		{
			// create vbo.
			// provisionally the posLC = (0, 0, 0).
			if (dustParticle.vboKeysContainer === undefined)
			{ dustParticle.vboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
			
			var posVboDataArray = new Float32Array([0.0, 0.0, 0.0]);
			var vbo = dustParticle.vboKeysContainer.newVBOVertexIdxCacheKey();
			vbo.setDataArrayPos(posVboDataArray, vboMemManager);
			continue;
		}

		if(!geoCoord.geoLocDataManager)
		{
			geoCoord.makeDefaultGeoLocationData();
			continue;
		}

		var geoLocDataManager = geoCoord.geoLocDataManager;
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		//buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

		gl.uniform1f(shader.uDustConcentration_loc, dustParticle.dustConcentration);

		var vboKey = vboKeysContainer.vboCacheKeysArray[0];
		if (!vboKey) 
		{ continue; }
		
		// Positions.
		if (!vboKey.bindDataPosition(shader, vboMemManager))
		{ continue; }
		
		gl.drawArrays(gl.POINTS, 0, vboKey.vertexCount);
		//var geoLocData = streamLine.geoLocDataManager.getCurrentGeoLocationData();
		//geoLocData.bindGeoLocationUniforms(gl, shader);
		//streamLine.render(magoManager, shader, options);

		//if(streamLine.finished)
		//{
		//	// this stream line finished.
		//	streamLine.deleteObjects(magoManager.vboMemoryManager);
		//	streamLine = undefined;	
		//}
		//else
		//{
		//	streamLinesArrayAux.push(streamLine);
		//}
	}

	//this.streamLinesArray = streamLinesArrayAux;
	
	// return to the current shader.
	gl.useProgram(null);
	gl.enable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
	
};
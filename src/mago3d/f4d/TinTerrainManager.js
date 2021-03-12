'use strict';

/**
 * @class TinTerrainManager
 */
var TinTerrainManager = function(magoManager, options) 
{
	if (!(this instanceof TinTerrainManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.ready = true;
	this.maxDepth = 17;
	//this.maxDepth = 3; // test.
	this.currentVisibles_terrName_geoCoords_map = {}; // current visible terrains map[terrainPathName, geographicCoords].
	this.currentTerrainsMap = {}; // current terrains (that was created) map[terrainPathName, tinTerrain].
	
	this.visibleTilesArray = [];
	this.noVisibleTilesArray = [];

	this.visibleSeaTilesArray = [];
	this.noVisibleSeaTilesArray = [];
	
	// TinTerrainQuadTrees.
	this.tinTerrainsQuadTreeAsia; // Use if this imageryType = CODE.imageryType.CRS84.
	this.tinTerrainsQuadTreeAmerica; // Use if this imageryType = CODE.imageryType.CRS84.
	this.tinTerrainQuadTreeMercator; // Use if this imageryType = CODE.imageryType.WEB_MERCATOR.
	
	// Elevation model or plain ellipsoid.
	// terrainType = 'plain' -> terrainPlainModel. CODE.magoEarthTerrainType.PLAIN
	// terrainType = 'elevation' -> terrainElevationModel. CODE.magoEarthTerrainType.ELEVATION
	// terrainType = 'realtime' -> real time terrainElevationModel. CODE.magoEarthTerrainType.REALTIME
	var policy = magoManager.config.getPolicy();
	this.terrainType = defaultValue(policy.terrainType, CODE.magoEarthTerrainType.PLAIN);
	this.terrainValue = policy.terrainValue;
	this.terrainReady = false;
	this.terrainTilesInfo;
	this.selectable = true;

	this.magoManager = magoManager;
	var gl = magoManager.getGl();
	//this.texturesMergerFbo = new FBO(gl, new Float32Array([256]), new Float32Array([256]));
	this.texturesMergerFbo = gl.createFramebuffer();

	if (this.terrainType !== CODE.magoEarthTerrainType.PLAIN && !this.terrainValue)
	{
		throw new Error('If use elevation model, require terrain value.');
	}

	if (options)
	{
		if (options.createSea !== undefined)
		{ this.bRenderSea = options.createSea; }

		if (options.terrainSelectable !== undefined)
		{ this.selectable = options.terrainSelectable; }

		if (options.maxDepth !== undefined)
		{ this.maxDepth = options.maxDepth; }
	}
	
	//CODE.imageryType = {
	//"UNKNOWN"      : 0,
	//"CRS84"        : 1,
	//"WEB_MERCATOR" : 2
	//};
	this.imageryType = CODE.imageryType.WEB_MERCATOR; // Test.***
	//this.imageryType = CODE.imageryType.CRS84; // Test.***

	this.imagerys = [];
	if (options.layers && Array.isArray(options.layers)) 
	{
		for (var i=0, len=options.layers.length;i<len;i++)
		{
			var layer = options.layers[i];
			if (layer instanceof WMSLayer || layer instanceof XYZLayer)
			{
				this.addImageryLayer(layer);
			}
		}
	}

	this.textureParsedTerrainMap = {};
	this.textureDecodedTerrainMap = {};
	this.textureIdCntMap = {};
	this.textureIdDeleteMap = {};
	this.bRenderSea = true;

	// Vars to maintain syncronization between this & tinTerrains.
	this.renderingFase = 0;
	this.layersStyleId = 0;
	this.objToClampToTerrainStyleId = 0;

	// Objects to clampToTerrain.
	this.objectsToClampToTerrainArray;

	// Max textureGuaranteedDepth.
	this.maxTextureGuranteedDepth = 1;

	this.init();
	this.makeTinTerrainWithDEMIndex(); // provisional.
	
	//https://www.ngdc.noaa.gov/mgg/global/global.html here there are geotiff of land & ocean 1arc-minute. All earth. size : 21600 x 10800.
};
TinTerrainManager.INFO_FILE = 'terrainTiles-info.json';

TinTerrainManager.prototype.deleteAll = function()
{
	// delete all terrains.***
	this.maxTextureGuranteedDepth = 0;
	if (this.tinTerrainsQuadTreeAsia)
	{
		this.tinTerrainsQuadTreeAsia.deleteObjects(this.magoManager);
	}
	if (this.tinTerrainsQuadTreeAmerica)
	{
		this.tinTerrainsQuadTreeAmerica.deleteObjects(this.magoManager);
	}
	if (this.tinTerrainQuadTreeMercator)
	{
		this.tinTerrainQuadTreeMercator.deleteObjects(this.magoManager);
	}
};

TinTerrainManager.prototype.getImageryLayers = function()
{
	return this.imagerys;
};

TinTerrainManager.prototype.imageryLayersChanged = function()
{
	// Call this function when imagery layers added, erased, deleted or changed.
	// must remake the texturemaster of tinTerrains.
	this.layersStyleId += 1;
	if (this.layersStyleId > 1000000)
	{ this.layersStyleId = 0; }
};

TinTerrainManager.prototype.objectsClampToTerrainChanged = function()
{
	// Call this function when imagery layers added, erased, deleted or changed.
	// must remake the texturemaster of tinTerrains.
	this.objToClampToTerrainStyleId += 1;
	if (this.objToClampToTerrainStyleId > 1000000)
	{ this.objToClampToTerrainStyleId = 0; }
};

TinTerrainManager.prototype.addObjectToClampToTerrain = function(object)
{
	if (this.objectsToClampToTerrainArray === undefined)
	{ this.objectsToClampToTerrainArray = []; }

	this.objectsToClampToTerrainArray.push(object);

	// An objectToClampToTerrain is not a imageryLayer, but this objects must be merged into
	// textureMaster, so call "imageryLayersChanged".
	this.objectsClampToTerrainChanged();
};
TinTerrainManager.prototype.removeObjectToClampToTerrain = function(object)
{
	this.objectsToClampToTerrainArray = this.objectsToClampToTerrainArray.filter(function(obj)
	{
		return obj !== object;
	});

	// An objectToClampToTerrain is not a imageryLayer, but this objects must be merged into
	// textureMaster, so call "imageryLayersChanged".
	this.imageryLayersChanged();
};

TinTerrainManager.prototype.prepareObjectToClampToTerrain = function()
{
	var objectsToClampToTerrain = this.objectsToClampToTerrainArray;
	if (objectsToClampToTerrain && objectsToClampToTerrain.length > 0)
	{
		// check if objects intersects with this tile.
		var objToClampCount = objectsToClampToTerrain.length;
		for (var i=0; i<objToClampCount; i++)
		{
			var objToClamp = objectsToClampToTerrain[i];
			if (objToClamp instanceof MagoRectangle)
			{
				if (objToClamp.texture === undefined)
				{
					// load texture 1rst.
					objToClamp.texture = new Texture();
					objToClamp.texture.setActiveTextureType(2);
					var style = objToClamp.style;
					if (style)
					{
						//clampToTerrain: true
						//fillColor: "#00FF00"
						var imageUrl = style.imageUrl;//: "/images/materialImages/factoryRoof.jpg"
						objToClamp.texture.url = imageUrl;
						var flipYTexCoord = false;
						TexturesManager.loadTexture(imageUrl, objToClamp.texture, this.magoManager, flipYTexCoord);
					}
				}
				else if (!(objToClamp.texture.texId instanceof WebGLTexture))
				{
					// there are 2 possibilities.
					// 1- there are a blob.
					// 2- there are a imageUrl.
					if (objToClamp.texture.blob)
					{
						// load by blob.
						TexturesManager.newWebGlTextureByBlob(gl, objToClamp.texture.blob, objToClamp.texture);
					}
					else if (objToClamp.texture.url)
					{
						// load by url.
						TexturesManager.loadTexture(objToClamp.texture.url, objToClamp.texture, this.magoManager, flipYTexCoord);
					}
				}
			}
		} 
	}
};

TinTerrainManager.prototype.getIntersectedObjectToClampToTerrain = function(geoExtent, resultObjectsArray)
{
	var objectsToClampToTerrain = this.objectsToClampToTerrainArray;
	if (objectsToClampToTerrain && objectsToClampToTerrain.length > 0)
	{
		// check if objects intersects with this tile.
		var objToClampCount = objectsToClampToTerrain.length;
		for (var i=0; i<objToClampCount; i++)
		{
			var objToClamp = objectsToClampToTerrain[i];
			if (objToClamp instanceof MagoRectangle)
			{
				
				var minGeoCoord = objToClamp.minGeographicCoord;
				var maxGeoCoord = objToClamp.maxGeographicCoord;
				var objMinLon = minGeoCoord.longitude;
				var objMinLat = minGeoCoord.latitude;
				var objMaxLon = maxGeoCoord.longitude;
				var objMaxLat = maxGeoCoord.latitude;
				var objGeoExtent = new GeographicExtent(objMinLon, objMinLat, minGeoCoord.altitude, objMaxLon, objMaxLat, maxGeoCoord.altitude);
				if (objGeoExtent.intersects2dWithGeoExtent(geoExtent))
				{
					
					if (objToClamp.texture === undefined)
					{
						// load texture 1rst.
						objToClamp.texture = new Texture();
						objToClamp.texture.setActiveTextureType(2);
						var style = objToClamp.style;
						if (style)
						{
							//clampToTerrain: true
							//fillColor: "#00FF00"
							var imageUrl = style.imageUrl;//: "/images/materialImages/factoryRoof.jpg"
							objToClamp.texture.url = imageUrl;
							var flipYTexCoord = false;
							TexturesManager.loadTexture(imageUrl, objToClamp.texture, this.magoManager, flipYTexCoord);
						}

						//continue;
					}
					else if (!(objToClamp.texture.texId instanceof WebGLTexture))
					{
						// there are 2 possibilities.
						// 1- there are a blob.
						// 2- there are a imageUrl.
						if (objToClamp.texture.blob)
						{
							// load by blob.
							TexturesManager.newWebGlTextureByBlob(gl, objToClamp.texture.blob, objToClamp.texture);
						}
						else if (objToClamp.texture.url)
						{
							// load by url.
							TexturesManager.loadTexture(objToClamp.texture.url, objToClamp.texture, this.magoManager, flipYTexCoord);
						}
						//continue;
					}
					

					// calculate the relative texCoords of the rectangle.
					var thisMinLon = geoExtent.minGeographicCoord.longitude;
					var thisMinLat = geoExtent.minGeographicCoord.latitude;
					var thisMaxLon = geoExtent.maxGeographicCoord.longitude;
					var thisMaxLat = geoExtent.maxGeographicCoord.latitude;
					var thisLonRange = thisMaxLon - thisMinLon;
					var thisLatRange = thisMaxLat - thisMinLat;

					var minS = (objMinLon - thisMinLon)/thisLonRange;
					var minT = (objMinLat - thisMinLat)/thisLatRange;

					var maxS = (objMaxLon - thisMinLon)/thisLonRange;
					var maxT = (objMaxLat - thisMinLat)/thisLatRange;

					objToClamp.texture.temp_clampToTerrainTexCoord = new Float32Array([minS, minT, maxS, maxT]);

					//if (objToClamp.texture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
					{ 
						if (resultObjectsArray === undefined)
						{ resultObjectsArray = []; }

						resultObjectsArray.push(objToClamp); 
					}
				}
			}
		} 
	}

	return resultObjectsArray;
};

TinTerrainManager.prototype.getTerrainType = function()
{
	return this.terrainType;
};

TinTerrainManager.prototype.setMaxDepth = function(maxDepth)
{
	this.maxDepth = maxDepth;
};

TinTerrainManager.prototype.init = function()
{
	if (this.imageryType === CODE.imageryType.WEB_MERCATOR)
	{
		this.tinTerrainQuadTreeMercator = new TinTerrain(undefined); // Main object.
		//1.4844222297453322
		//var latDeg = 1.4844222297453322 *180/Math.PI;
		//https://en.wikipedia.org/wiki/Web_Mercator_projection
		//https://en.wikipedia.org/wiki/Mercator_projection
		var webMercatorMaxLatRad = 2*Math.atan(Math.pow(Math.E, Math.PI)) - (Math.PI/2);
		var webMercatorMaxLatDeg = webMercatorMaxLatRad * 180/Math.PI; // = 85.0511287798...
		
		// All earth.
		var minLon = -180;
		var minLat = -90;
		var minAlt = 0;
		var maxLon = 180;
		var maxLat = 90;
		var maxAlt = 0;

		minLat = -webMercatorMaxLatDeg; 
		maxLat = webMercatorMaxLatDeg; 
		
		this.tinTerrainQuadTreeMercator.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
		this.tinTerrainQuadTreeMercator.setWebMercatorExtent(-1, -Math.PI, 1, Math.PI); // unitary extension.***
		this.tinTerrainQuadTreeMercator.X = 0;
		this.tinTerrainQuadTreeMercator.Y = 0;
		this.tinTerrainQuadTreeMercator.indexName = "RU";
		this.tinTerrainQuadTreeMercator.tinTerrainManager = this;
		
		// do imagery test.
		// set imagery initial geoExtent (in mercator coords).
		
		// Full extent. https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
	}
	else
	{
		// CRS84.
		this.tinTerrainsQuadTreeAsia = new TinTerrain(undefined); // Main object.
		this.tinTerrainsQuadTreeAmerica = new TinTerrain(undefined); // Main object.
		
		// Asia side.
		var minLon = 0;
		var minLat = -90;
		var minAlt = 0;
		var maxLon = 180;
		var maxLat = 90;
		var maxAlt = 0;
		
		this.tinTerrainsQuadTreeAsia.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
		this.tinTerrainsQuadTreeAsia.setWebMercatorExtent(0, -Math.PI, 1, Math.PI); // unitary extension.***
		this.tinTerrainsQuadTreeAsia.X = 1;
		this.tinTerrainsQuadTreeAsia.Y = 0;
		this.tinTerrainsQuadTreeAsia.indexName = "RU";
		this.tinTerrainsQuadTreeAsia.tinTerrainManager = this;
		
		// America side.
		minLon = -180;
		minLat = -90;
		minAlt = 0;
		maxLon = 0;
		maxLat = 90;
		maxAlt = 0;

		this.tinTerrainsQuadTreeAmerica.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
		this.tinTerrainsQuadTreeAmerica.setWebMercatorExtent(-1, -Math.PI, 0, Math.PI); // unitary extension.***
		this.tinTerrainsQuadTreeAmerica.X = 0;
		this.tinTerrainsQuadTreeAmerica.Y = 0;
		this.tinTerrainsQuadTreeAmerica.indexName = "LU";
		this.tinTerrainsQuadTreeAmerica.tinTerrainManager = this;
		
		// do imagery test.
		// set imagery initial geoExtent (in mercator coords).
		
		// Full extent. https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
	}
	
	this.makeDistanceLimitByDepth();

	this.loadTerrainMeta();
};

TinTerrainManager.prototype.loadTerrainMeta = function() 
{
	var that = this;
	if (that.terrainType === CODE.magoEarthTerrainType.PLAIN)
	{
		that.terrainReady = true;
		return;
	}

	if (that.terrainType === CODE.magoEarthTerrainType.ELEVATION && that.terrainValue && !that.terrainReady) 
	{
		var infoPath = that.terrainValue + TinTerrainManager.INFO_FILE;
		var infoPromise = loadWithXhr(infoPath, undefined, undefined, 'json');

		infoPromise.then(function(e)
		{
			/**
			 * TODO : INFO JSON VALIDATE 추가해야함.
			 */
			that.terrainTilesInfo = e;
			that.terrainReady = true;
		});

		infoPromise.catch(function() 
		{
			console.warn('Invalid or not exist ' + TinTerrainManager.INFO_FILE);
			that.terrainType = CODE.magoEarthTerrainType.PLAIN;
			that.terrainReady = true;
		});
		/*
		infoPromise.done(function(e)
		{
			
		},
		function(f)
		{
			
		});
		*/
	}
};

TinTerrainManager.prototype.makeTinTerrainWithDEMIndex = function()
{
	// Provisional.
	// Makes a index of tiles that has DEM data in the server.
	this.tinTerrainWithDEMIndex = [];
	this.tinTerrainWithDEMIndex[0] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[1] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[2] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[3] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[4] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[5] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[6] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[7] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[8] = { minX: 213, minY: 94, maxX: 222, maxY: 105 };
	this.tinTerrainWithDEMIndex[9] = { minX: 425, minY: 189, maxX: 443, maxY: 211 };
	this.tinTerrainWithDEMIndex[10] = { minX: 852, minY: 376, maxX: 885, maxY: 423 };
	this.tinTerrainWithDEMIndex[11] = { minX: 1705, minY: 753, maxX: 1770, maxY: 844 };
	this.tinTerrainWithDEMIndex[12] = { minX: 3412, minY: 1506, maxX: 3539, maxY: 1689 };
	this.tinTerrainWithDEMIndex[13] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[14] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[15] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[16] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[17] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[18] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[19] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[20] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
};

TinTerrainManager.prototype.makeDistanceLimitByDepth = function()
{
	if (this.distLimitByDepth === undefined)
	{ this.distLimitByDepth = []; }
		
	// For each depth, there are a limit distance.***
	this.distLimitByDepth[0] = 100000000; 
	this.distLimitByDepth[1] = 40000000; 
	this.distLimitByDepth[2] = 20000000; 
	this.distLimitByDepth[3] = 12000000; 
	this.distLimitByDepth[4] = 6000000; 
	this.distLimitByDepth[5] = 3000000; 
	this.distLimitByDepth[6] = 1000000; 
	this.distLimitByDepth[7] = 600000; 
	this.distLimitByDepth[8] = 200000; 
	this.distLimitByDepth[9] = 100000; 
	this.distLimitByDepth[10] = 60000; 
	this.distLimitByDepth[11] = 30000; 
	this.distLimitByDepth[12] = 9000; 
	this.distLimitByDepth[13] = 6000; 
	this.distLimitByDepth[14] = 4000; 
	this.distLimitByDepth[15] = 2000; 
	this.distLimitByDepth[16] = 800; 
	this.distLimitByDepth[17] = 400; 
	this.distLimitByDepth[18] = 200; 
	this.distLimitByDepth[19] = 100; 
	this.distLimitByDepth[20] = 50; 

	//for (var i = 19; i>=0; i--)
	//{
	//	this.distLimitByDepth[i] = this.distLimitByDepth[i+1]*2; 
	//}

	/*
	var count = this.distLimitByDepth.length;
	for (var i=0; i<count; i++)
	{
		this.distLimitByDepth[i] *= 1.5;
	}
	*/
};

TinTerrainManager.prototype.getTexCorrection = function(depth)
{
	if (this.texCorrection === undefined)
	{
		this.texCorrection = [];
		
		this.texCorrection[0] = 0.003;
		this.texCorrection[1] = 0.003;
		this.texCorrection[2] = 0.003;
		this.texCorrection[3] = 0.003;
		this.texCorrection[4] = 0.003;
		this.texCorrection[5] = 0.003;
		this.texCorrection[6] = 0.003;
		this.texCorrection[7] = 0.003;
		this.texCorrection[8] = 0.003;
		this.texCorrection[9] = 0.003;
		this.texCorrection[10] = 0.003;
		this.texCorrection[11] = 0.003;
		this.texCorrection[12] = 0.003;
		this.texCorrection[13] = 0.003;
		this.texCorrection[14] = 0.002;
		this.texCorrection[15] = 0.002;
		this.texCorrection[16] = 0.002;
		this.texCorrection[17] = 0.002;
		this.texCorrection[18] = 0.002;
		this.texCorrection[19] = 0.002;
		this.texCorrection[20] = 0.002;
		this.texCorrection[21] = 0.002;
		this.texCorrection[22] = 0.002;
	}
	
	return this.texCorrection[depth];
};


TinTerrainManager.prototype.doFrustumCulling = function(frustum, camera, magoManager, maxDepth)
{
	if (maxDepth === undefined)
	{ maxDepth = this.maxDepth; }

	//if (magoManager.fileRequestControler.tinTerrainFilesRequested >= 4 || magoManager.fileRequestControler.tinTerrainTexturesRequested >= 2)
	//{ return; }


	var camPos = camera.position;
	//var camElevation = camera.getCameraElevation();
	//var camTarget = camera.getTargetPositionAtDistance(camElevation/2, undefined);
	//camPos = camTarget;
	//camPos.camElevation = camElevation;
	var canDoFrustumCulling = false;
	if (this.cameraLastPosition === undefined)
	{ 
		this.cameraLastPosition = new Point3D(0.0, 0.0, 0.0); 
	}

	if (this.cameraLastTime === undefined)
	{ 
		this.cameraLastTime = magoManager.getCurrentTime(); 
	}

	if (this.cameraStopped === undefined)
	{
		this.cameraStopped = true;
	}

	var dist = camPos.distToPoint(this.cameraLastPosition);
	if (dist < 4.0)
	{
		var timeDiff = magoManager.getCurrentTime() - this.cameraLastTime;
		if (!this.cameraStopped && timeDiff > 500)
		{
			this.cameraStopped = true;
		}

		if (this.cameraStopped)
		{
			canDoFrustumCulling = true;
			this.cameraLastTime = magoManager.getCurrentTime();
		}
		
	}
	else
	{
		canDoFrustumCulling = false;
		this.cameraStopped = false;
	}

	this.cameraLastPosition.set(camPos.x, camPos.y, camPos.z);

	if (!canDoFrustumCulling)
	{ return; }
		

	// Test.
	//var sceneState = magoManager.sceneState;
	//var drawingBufferWidth = sceneState.drawingBufferWidth[0];
	//var drawingBufferHeight = sceneState.drawingBufferHeight[0];
	//var pixelPosWC = ManagerUtils.calculatePixelPositionWorldCoord(magoManager.getGl(), drawingBufferWidth/2, drawingBufferHeight, undefined, undefined, undefined, undefined, magoManager);
	//camPos = pixelPosWC;
	
	this.visibleTilesArray.length = 0; 
	this.noVisibleTilesArray.length = 0; 
	this.visibleTilesArrayMap = [];
	if (this.imageryType === CODE.imageryType.WEB_MERCATOR)
	{
		this.tinTerrainQuadTreeMercator.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArrayMap, this.noVisibleTilesArray);
	}
	else 
	{
		this.tinTerrainsQuadTreeAsia.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArrayMap, this.noVisibleTilesArray);
		this.tinTerrainsQuadTreeAmerica.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArrayMap, this.noVisibleTilesArray);
	}

	// now, put all tinTerrains into "this.visibleTilesArray".
	//for (var depth = 0; depth <= this.maxDepth; depth++) 
	for (var depth = this.maxDepth; depth >=0; depth--) 
	{
		var visibleTilesArray = this.visibleTilesArrayMap[depth];
		if (visibleTilesArray && visibleTilesArray.length > 0)
		{
			[].push.apply(this.visibleTilesArray, visibleTilesArray);
		}
	}
};

/**
 * Prepare tinTerrains.
 */
TinTerrainManager.prototype.prepareVisibleTinTerrains = function(magoManager) 
{
	var tinTerrain;

	if (!this.visibleTilesArrayMap)
	{ return; }

	if (this.tinTerrainQuadTreeMercator.childMap)
	{
		if (this.tinTerrainQuadTreeMercator.childMap.LU) { this.tinTerrainQuadTreeMercator.childMap.LU.prepareTinTerrainForward(magoManager, this); }
		if (this.tinTerrainQuadTreeMercator.childMap.LD) { this.tinTerrainQuadTreeMercator.childMap.LD.prepareTinTerrainForward(magoManager, this); }
		if (this.tinTerrainQuadTreeMercator.childMap.RU) { this.tinTerrainQuadTreeMercator.childMap.RU.prepareTinTerrainForward(magoManager, this); }
		if (this.tinTerrainQuadTreeMercator.childMap.RD) { this.tinTerrainQuadTreeMercator.childMap.RD.prepareTinTerrainForward(magoManager, this); }
	}
	//return;

	// For the visible tinTerrains prepare its.
	// Preparing rule: First prepare the tinTerrain-owner if the owner is no prepared yet.
	//for (var depth = 0; depth <= this.maxDepth; depth++) 
	for (var depth = 0; depth <= this.maxDepth; depth++) 
	{
			
		// 2nd, for all terrains that exist, if there are not in the visiblesMap, then delete its.
		// Deleting rule: If a tinTerrain has children, then delete first the children.
		var deletedCount = 0;
		var noVisiblesTilesCount = this.noVisibleTilesArray.length;
		for (var i=0; i<noVisiblesTilesCount; i++)
		{
			tinTerrain = this.noVisibleTilesArray[i];
			if (tinTerrain !== undefined)
			{
				if (tinTerrain.depth > 2)
				{
					tinTerrain.deleteTinTerrain(magoManager);
					deletedCount++;
				}
			}
			
			if (deletedCount > 50)
			{ break; }
		}
		
	}
};

/**
 * Prepare tinTerrains.
 */
TinTerrainManager.prototype.prepareVisibleTinTerrainsTextures = function(magoManager) 
{
	var tinTerrain;

	if (!this.visibleTilesArrayMap)
	{ return; }

	// Now, nearToFar, prepare texture if is meshPrepared.
	for (var depth = this.maxDepth; depth > 0; depth--) 
	{
		if (magoManager.fileRequestControler.tinTerrainTexturesRequested >= 5)
		{ break; }

		var visibleTilesArray = this.visibleTilesArrayMap[depth];
		if (visibleTilesArray && visibleTilesArray.length > 0)
		{
			//*********************************************************
			var visiblesTilesCount = visibleTilesArray.length;
			if (this.terrainType === CODE.magoEarthTerrainType.PLAIN) // PlainTerrain.
			{
				for (var i=0; i<visiblesTilesCount; i++)
				{
					tinTerrain = visibleTilesArray[i];
					if (tinTerrain.isMeshPrepared())
					{
						if (tinTerrain.prepareTexture(tinTerrain.texture, this.imagerys, magoManager, this) > 0)
						{ break; }
					}
				}
			}
			else if (this.terrainType === CODE.magoEarthTerrainType.ELEVATION)// ElevationTerrain.
			{
				var maxProcessCounter = 0;
				for (var i=0; i<visiblesTilesCount; i++)
				{
					tinTerrain = visibleTilesArray[i];
					if (tinTerrain.isVisible())
					{
						if (tinTerrain.prepareTexture(tinTerrain.texture, this.imagerys, magoManager, this) > 0)
						{ break; }
					}

					if (magoManager.fileRequestControler.tinTerrainTexturesRequested >= 6)
					{ break; }

				}
			}
			else if (this.terrainType === CODE.magoEarthTerrainType.REALTIME)// Real time ElevationTerrain.
			{
				var maxProcessCounter = 0;
				for (var i=0; i<visiblesTilesCount; i++)
				{
					tinTerrain = visibleTilesArray[i];
					if (!tinTerrain.prepareTinTerrainRealTimeElevation(magoManager, this))
					{ maxProcessCounter += 1; }
				
					if (maxProcessCounter > 5)
					{ break; }
				}
			}
			
		}
	}

};

TinTerrainManager.prototype.getAltitudes = function(geoCoordsArray, resultGeoCoordsArray) 
{
	var geoCoordsCount = geoCoordsArray.length;
	for (var i=0; i<geoCoordsCount; i++)
	{
		var geoCoord = geoCoordsArray[i];
		
		//this.visibleTilesArray
	}
};

TinTerrainManager.prototype.render = function (magoManager, bDepth, renderType, shader) 
{
	var sceneState = magoManager.sceneState;
	var gl = sceneState.gl;
	var currentShader;
	if (shader)
	{ currentShader = shader; }
	else
	{ currentShader = magoManager.postFxShadersManager.getShader("tinTerrain"); }

	
	currentShader.resetLastBuffersBinded();
	magoManager.postFxShadersManager.useProgram(currentShader);
	currentShader.enableVertexAttribArray(currentShader.position3_loc);
	if (bDepth)
	{ currentShader.disableVertexAttribArray(currentShader.texCoord2_loc); }
	else
	{ currentShader.enableVertexAttribArray(currentShader.texCoord2_loc); }
	//gl.disableVertexAttribArray(currentShader.normal3_loc);
	//gl.disableVertexAttribArray(currentShader.color4_loc);
	
	currentShader.bindUniformGenerals();
	magoManager.test__makingTerrainByAltitudesImage = 0;
	
	if (renderType === 0)
	{
		//var tex = magoManager.texturesStore.getTextureAux1x1(); // provisional.
		gl.activeTexture(gl.TEXTURE0); 
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	if (this.identityMat === undefined)
	{ this.identityMat = new Matrix4(); }
	
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
	gl.uniform1i(currentShader.uRenderType_loc, 1);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);

	if (renderType === 1)
	{
		var tex = magoManager.texturesStore.getTextureAux1x1(); // provisional.

		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, null);
	
		gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture. Initially set as texture color type.***
		gl.uniform4fv(currentShader.oneColor4_loc, [0.5, 0.5, 0.5, 1.0]);
		gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
		gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, this.identityMat._floatArrays);
		gl.uniform1i(currentShader.bApplyCaustics_loc, false);

		// shader.altitude_loc
		gl.uniform1i(currentShader.bExistAltitudes_loc, false);
		
		var flipTexCoordY = true;

		if (magoManager.isCesiumGlobe())
		{ flipTexCoordY = false; }

		gl.uniform1i(currentShader.textureFlipYAxis_loc, flipTexCoordY); // false for cesium, true for magoWorld.
		gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
		
		gl.activeTexture(gl.TEXTURE2); // difusseTex.
	}
	else if (renderType === 2)
	{
		gl.uniform1i(currentShader.bApplySpecularLighting_loc, false);
		gl.uniform1i(currentShader.uRenderType_loc, 2);
	}

	
	var succesfullyRenderedTilesArray = [];

	gl.depthRange(0, 1);

	// Render-Forward from tilesDepth = 1.***
	if (this.tinTerrainQuadTreeMercator.childMap)
	{
		if (this.tinTerrainQuadTreeMercator.childMap.LU) { this.tinTerrainQuadTreeMercator.childMap.LU.renderForward(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
		if (this.tinTerrainQuadTreeMercator.childMap.LD) { this.tinTerrainQuadTreeMercator.childMap.LD.renderForward(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
		if (this.tinTerrainQuadTreeMercator.childMap.RU) { this.tinTerrainQuadTreeMercator.childMap.RU.renderForward(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
		if (this.tinTerrainQuadTreeMercator.childMap.RD) { this.tinTerrainQuadTreeMercator.childMap.RD.renderForward(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
	}
	
	gl.depthRange(0, 1);
	gl.depthFunc(gl.LEQUAL);
	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc); 
	currentShader.disableVertexAttribArray(currentShader.position3_loc); 
	currentShader.disableVertexAttribArray(currentShader.normal3_loc); 
	currentShader.disableVertexAttribArray(currentShader.color4_loc); 
	magoManager.postFxShadersManager.useProgram(null);

	this.renderingFase +=1;
	if (this.renderingFase > 1000000)
	{ this.renderingFase = 0; }
};

/**
 * Add imagery layer.
 * @param {imageryLayer} layer
 */
TinTerrainManager.prototype.addImageryLayer = function(layer) 
{
	var that = this;
	layer.on(TextureLayer.EVENT_TYPE.CHANGEOPACITY, function(e)
	{
	    that.imageryLayersChanged();
	});
	layer.on(TextureLayer.EVENT_TYPE.CHANGESHOW, function(e)
	{
	    that.imageryLayersChanged();
	});
	this.imagerys.push(layer);
	this.imageryLayersChanged();
};

/**
 * 텍스처 등록 갯수 관리
 * @param {number} textureId
 */
TinTerrainManager.prototype.addTextureId = function(textureId) 
{
	if (!this.textureIdCntMap[textureId]) 
	{
		this.textureIdCntMap[textureId] = 0;
	}
	this.textureIdCntMap[textureId] += 1;
};
/**
 * 텍스처 제거 목록 등록
 * @param {number} textureId
 */
TinTerrainManager.prototype.addDeleteTextureId = function(textureId) 
{
	if (!this.textureIdDeleteMap[textureId]) 
	{
		this.textureIdDeleteMap[textureId] = 0;
	}
	this.textureIdDeleteMap[textureId] += 1;
};
/**
 * 텍스처 제거 맵에 등록된 텍스처를 제거
 * @param {Texture} texture
 */
TinTerrainManager.prototype.eraseTexture = function(texture, magoManager)
{
	var gl = magoManager.sceneState.gl;
	
	var id = texture.imagery._id;
	texture.deleteObjects(gl);
	this.addDeleteTextureId(id);

	this.clearMap(id);
	this.imageryLayersChanged();
};
/**
 * 텍스처 제거 맵에 등록된 텍스처를 제거
 * @param {Texture} texture
 */
TinTerrainManager.prototype.clearMap = function(id)
{
	if (this.textureIdDeleteMap[id] === this.textureIdCntMap[id]) 
	{
		delete this.textureIdDeleteMap[id];
		delete this.textureIdCntMap[id];
	}

	this.imageryLayersChanged();
};
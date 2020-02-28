'use strict';

var CesiumViewerInit = function(containerId, serverPolicy, options, legacyViewer) 
{
	if (!Cesium) 
	{
		throw new Error('if basicGlobe is Cesium, add Cesium Library');
	}
	this.options = options || {};
	this.DEFALUT_IMAGE = "ESRI World Imagery";
	this.DEFALUT_TERRAIN = "WGS84 Ellipsoid";

	ViewerInit.call(this, containerId, serverPolicy);

	//this.viewer = (legacyViewer instanceof Cesium.Viewer) ? legacyViewer : null;	
};
CesiumViewerInit.prototype = Object.create(ViewerInit.prototype);
CesiumViewerInit.prototype.constructor = CesiumViewerInit;

CesiumViewerInit.prototype.init = function() 
{
	this.setCanvasEventHandler();

	this.options.animation = this.options.animation || false;
	this.options.timeline = this.options.timeline || false;

	this.geoserverProviderBuild();

	this.options.shouldAnimate = false;
	this.viewer = new Cesium.Viewer(this.targetId, this.options);

	this.postProcessDataProvider();
	this.initMagoManager();
	//this.setEventHandler();

	if (this.policy.initCameraEnable) 
	{ 
		var destination;

		var lon = parseFloat(this.policy.initLatitude);
		var lat = parseFloat(this.policy.initLongitude);
		var height = parseFloat(this.policy.initAltitude);
		var duration = parseInt(this.policy.initDuration);

		if (isNaN(lon) || isNaN(lat) || isNaN(height)) 
		{
			throw new Error('Longitude, Latitude, Height must number type.');
		}

		if (isNaN(duration)) { duration = 3; }
		destination = Cesium.Cartesian3.fromDegrees(lat, lon, height);

		this.viewer.camera.flyTo({
			destination : destination,
			duration    : duration
		}); 
	}
};
CesiumViewerInit.prototype.setCanvasEventHandler = function() 
{
	var canvas = document.getElementById(this.targetId);
	canvas.addEventListener('webglcontextlost', function(e) 
	{
		console.log(e);
	}, false);
    
	canvas.addEventListener('webglcontextrestored', function(e) 
	{
		console.log(e); 
	}, false);
};

CesiumViewerInit.prototype.geoserverProviderBuild = function() 
{
	var policy = this.policy;
	var online = policy.online;
	var geoserverEnable = policy.geoserverEnable;

	if (!online && !geoserverEnable) 
	{
		throw new Error('If your env is offline, must use geoserver.');
	}

	//geoserver 이용시 false로 변경. 현재는 안 쓸 경우 true로 해야함.
	this.options.baseLayerPicker = true;

	if (geoserverEnable && policy.geoserverImageproviderEnable) 
	{
		this.geoserverImageProviderBuild();
	}

	if (geoserverEnable && policy.geoserverTerrainproviderEnable) 
	{
		this.geoserverTerrainProviderBuild();
	}

	if (policy.cesiumIonToken !== null && policy.cesiumIonToken !== "") 
	{
		Cesium.Ion.defaultAccessToken = policy.cesiumIonToken;
		this.DEFALUT_TERRAIN = "Cesium World Terrain";
	}
};

CesiumViewerInit.prototype.geoserverImageProviderBuild = function() 
{
	var policy = this.policy;
	var geoserver = MagoConfig.getGeoserver();
    
	if (!policy.geoserverImageproviderEnable) 
	{
		//throw new Error('If you use geoserver, geoserverImageproviderEnable must true. Do you want change true auto?');
		policy.geoserverImageproviderEnable = true;
	}
    
	var wmsUrl;
	if (!policy.geoserverImageproviderUrl && geoserver) 
	{
		wmsUrl = geoserver.getDataRequestUrl();
	}

	wmsUrl = policy.geoserverImageproviderUrl;

	if (!wmsUrl) 
	{
		throw new Error('If use geoserverImageprovider, geoserverImageproviderUrl is required or input geoserverDataUrl and geoserverDataWorkspace.');
	}

	var wmsLayer = policy.geoserverImageproviderLayerName;
	if (!wmsLayer) 
	{
		throw new Error('If use geoserverImageprovider, geoserverImageproviderLayerName is required.');
	}

	// Cesium.WebMapServiceImageryProvider.DefaultParameters
	var version = (geoserver && geoserver.getWmsVersion()) ?  geoserver.getWmsVersion() : "1.1.1";
	var style = policy.geoserverImageproviderStyleName ? policy.geoserverImageproviderStyleName : '';
	var format = policy.geoserverImageproviderParametersFormat ? policy.geoserverImageproviderStyleName : 'image/jpeg';
	var tileWidth = policy.geoserverImageproviderParametersWidth ? policy.geoserverImageproviderParametersWidth : 256;
	var tileHeight = policy.geoserverImageproviderParametersHeight ? policy.geoserverImageproviderParametersHeight : 256;

	var param = {
		service : "WMS",
		version : version,
		request : "GetMap",
		styles  : style,
		format  : format
	};

	var imageryProvider = new Cesium.WebMapServiceImageryProvider({
		url                : wmsUrl,
		layers             : wmsLayer,
		parameters         : param,
		tileWidth          : tileWidth, 
		tileHeight         : tileHeight,
		enablePickFeatures : false
	});

	this.options.imageryProvider = imageryProvider;
	this.options.baseLayerPicker = false;
};

CesiumViewerInit.prototype.geoserverTerrainProviderBuild = function() 
{
	if (!Cesium.GeoserverTerrainProvider) 
	{
		throw new Error('If you want use GeoserverTerrainProvider, GeoserverTerrainProvider plugin required.');
	}

	var policy = this.policy;

	var terrainParam = {
		service: 'WMTS'
	};
	var terrainUrl = policy.geoserverTerrainproviderUrl;
    
	if (!terrainUrl) 
	{
		throw new Error('If use geoserverTerrainproviderEnable, geoserverTerrainproviderUrl is required.');
	}

	var terrainLayerName = policy.geoserverTerrainproviderLayerName;
	var terrainStyleName = policy.geoserverTerrainproviderStyleName;

	terrainParam.url = terrainUrl;
	terrainParam.layerName = terrainLayerName;
	terrainParam.styleName = terrainStyleName;
	terrainParam.maxLevel = 13;

	this.options.terrainProvider = new Cesium.GeoserverTerrainProvider(terrainParam);
};

CesiumViewerInit.prototype.postProcessDataProvider = function() 
{
	// TODO : 제거 필수!! 세슘의 카메라 매트릭스를 강제로 변환시키기 위하여 우주크기만한 엔티티를 추가.
	this.viewer.entities.add({
		name     : "mago3D",
		position : Cesium.Cartesian3.fromDegrees(37.521168, 126.924185, 3000.0),
		box      : {
			dimensions : new Cesium.Cartesian3(300000.0*1000.0, 300000.0*1000.0, 300000.0*1000.0), // dimensions : new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
			fill       : true,
			material   : Cesium.Color.BLUE,
			outline    : false
		}
	});

	if (!this.options.imageryProvider) 
	{
		var imageryProvider = null;
		var imageryProviderViewModels = this.viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
		for (var i in imageryProviderViewModels) 
		{
			if (!imageryProviderViewModels.hasOwnProperty(i))	{ continue; }

			var provider = imageryProviderViewModels[i];
			if (provider.name === this.DEFALUT_IMAGE)
			{
				imageryProvider = provider;
				break;
			}
		}
		if (imageryProvider) { this.viewer.baseLayerPicker.viewModel.selectedImagery = imageryProvider; }
	}

	if (!this.options.terrainProvider) 
	{
		if (this.policy.initDefaultTerrain !== null && this.policy.initDefaultTerrain !== "") 
		{
			this.DEFALUT_TERRAIN = this.policy.initDefaultTerrain;
		}
    
		var terrainProvider = null;
		var terrainProviderViewModels = this.viewer.baseLayerPicker.viewModel.terrainProviderViewModels;
		for (var i in terrainProviderViewModels) 
		{
			if (!terrainProviderViewModels.hasOwnProperty(i))	{ continue; }
			var provider = terrainProviderViewModels[i];
			if (provider.name === this.DEFALUT_TERRAIN) 
			{
				terrainProvider = provider;
				break;
			}
		}
		if (terrainProvider) { this.viewer.baseLayerPicker.viewModel.selectedTerrain = terrainProvider; }
	}
};

CesiumViewerInit.prototype.initMagoManager = function() 
{
	var scene;
	var serverPolicy = this.policy;
	var viewer = this.viewer;
	
	this.viewer.scene.magoManager = new MagoManager();
	this.viewer.scene.magoManager.sceneState.textureFlipYAxis = false;

	this.viewer.camera.frustum.fov = Cesium.Math.PI_OVER_THREE*1.8;
	if (serverPolicy.initDefaultFov > 0) 
	{
		this.viewer.camera.frustum.fov = Cesium.Math.PI_OVER_THREE * serverPolicy.initDefaultFov;
	}

	var gl = this.viewer.scene.context._gl;

	this.viewer.scene.magoManager.postFxShadersManager.gl = gl;
	this.viewer.scene.magoManager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
	this.viewer.scene.magoManager.createDefaultShaders(gl);// A1-Use this.***
	this.viewer.scene.magoManager.scene = this.viewer.scene;

	var magoManager = this.viewer.scene.magoManager;
	this.magoManager = magoManager;
	scene = this.viewer.scene;
	
	this.viewer.scene.globe.depthTestAgainstTerrain = false;
	this.viewer.scene.logarithmicDepthBuffer = false; //do not use logarithmic buffer
	this.viewer.scene.highDynamicRange = false; //do not use high dynamic range
	
	viewer.camera.changed.addEventListener(function(e)
	{
		magoManager.cameraChanged(e);
	});
	viewer.camera.moveEnd.addEventListener(function()
	{
		magoManager.cameraMoveEnd();
	});
	viewer.camera.moveStart.addEventListener(function()
	{
		magoManager.cameraMoveStart();
	});
	//this.magoManager.init(gl);
};

CesiumViewerInit.prototype.setEventHandler = function() 
{
	var magoManager = this.magoManager;
	var scene = magoManager.scene;
	var viewer = this.viewer;

	this.viewer.scene.magoManager.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
	
	magoManager.handler.setInputAction(function(click) 
	{
		magoManager.mouseActionLeftDown(click.position.x, click.position.y);
	}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

	magoManager.handler.setInputAction(function(click) 
	{
		magoManager.mouseActionMiddleDown(click.position.x, click.position.y);
	}, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
    
	magoManager.handler.setInputAction(function(click) 
	{
		magoManager.mouseActionRightDown(click.position.x, click.position.y);
	}, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.mouseActionMove(movement.startPosition, movement.endPosition);
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.mouseActionLeftUp(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.LEFT_UP);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.mouseActionMiddleUp(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.MIDDLE_UP);
    
	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.mouseActionRightUp(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.RIGHT_UP);
    
	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.mouseActionLeftClick(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.mouseActionLeftDoubleClick(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.mouseActionRightClick(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

	 
	this.viewer.clock.onTick.addEventListener(function(clock) 
	{
		magoManager.cameraFPV.update(magoManager);
	});
};
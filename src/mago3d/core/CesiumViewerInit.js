'use strict';

var CesiumViewerInit = function(containerId, serverPolicy, options, legacyViewer) 
{
	if (!window.Cesium) 
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

	//GEOSERVER BASE LAYER, GEOSERVER TERRAIN SET
	this.providerBuild();

	this.options.shouldAnimate = false;
	this.options.baseLayerPicker = false;
	this.viewer = new Cesium.Viewer(this.targetId, this.options);

	this.postProcessDataProvider();
	this.initMagoManager();
	//this.setEventHandler();
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

CesiumViewerInit.prototype.providerBuild = function() 
{
	var policy = this.policy;
	var online = policy.online;
	var geoserverEnable = policy.geoserverEnable;
	var terrainType = policy.terrainType;

	if (!online && !geoserverEnable) 
	{
		throw new Error('If your env is offline, must use geoserver.');
	}

	//geoserver 이용시 false로 변경. 현재는 안 쓸 경우 true로 해야함.
	

	if (geoserverEnable && policy.geoserverImageproviderEnable) 
	{
		this.geoserverImageProviderBuild();
	}

	if (geoserverEnable && terrainType === CODE.cesiumTerrainType.GEOSERVER) 
	{
		this.geoserverTerrainProviderBuild();
	}

	
	if (policy.cesiumIonToken && policy.cesiumIonToken.length > 0) 
	{
		Cesium.Ion.defaultAccessToken = policy.cesiumIonToken;
	}
	var terrainType = policy.terrainType;
	var terrainValue = policy.terrainValue;
	if (terrainType !== CODE.cesiumTerrainType.GEOSERVER && !this.options.terrainProvider) 
	{
		this.options.terrainProvider = new Cesium.EllipsoidTerrainProvider();
		switch (terrainType) 
		{
		case CODE.cesiumTerrainType.CESIUM_ION_DEFAULT :{
			if (policy.cesiumIonToken && policy.cesiumIonToken.length > 0) 
			{
				this.options.terrainProvider = new Cesium.CesiumTerrainProvider({
					url: Cesium.IonResource.fromAssetId(1)
				});
			}
			break;
		}
		case CODE.cesiumTerrainType.CESIUM_ION_CDN :{
			if (policy.cesiumIonToken || policy.cesiumIonToken.length > 0) 
			{
				this.options.terrainProvider = new Cesium.CesiumTerrainProvider({
					url: Cesium.IonResource.fromAssetId(parseInt(terrainValue))
				});
			}
			break;
		}
		case CODE.cesiumTerrainType.CESIUM_CUSTOMER :{
			this.options.terrainProvider = new Cesium.CesiumTerrainProvider({
				url: terrainValue
			});
			break;
		}
		}
	}
	
	if (!this.options.imageryProvider) 
	{
		this.options.imageryProvider = new Cesium.ArcGisMapServerImageryProvider({
			url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
		});
	}
};

CesiumViewerInit.prototype.geoserverImageProviderBuild = function() 
{
	var policy = this.policy;
	var geoserver = this.config.getGeoserver();
    
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
	var format = policy.geoserverImageproviderParametersFormat ? policy.geoserverImageproviderParametersFormat : 'image/jpeg';
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

	var terrainUrl = policy.terrainValue;
    
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
	var viewer =this.viewer; 
	// TODO : 제거 필수!! 세슘의 카메라 매트릭스를 강제로 변환시키기 위하여 우주크기만한 엔티티를 추가.
	addSpaceBox(viewer);

	viewer.entities.collectionChanged.addEventListener(function(c,ar,ra,ca) {
		if(c.values.length === 0) {
			addSpaceBox(viewer);
		}
	});
	function addSpaceBox(v) {
		v.entities.add({
			name     : "mago3D",
			position : Cesium.Cartesian3.fromDegrees(37.521168, 126.924185, 3000.0),
			box      : {
				dimensions : new Cesium.Cartesian3(300000.0*1000.0, 300000.0*1000.0, 300000.0*1000.0), // dimensions : new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
				fill       : true,
				material   : Cesium.Color.BLUE,
				outline    : false
			}
		});
	}

	if (!this.options.imageryProvider) 
	{
		var imageryProvider = null;
		if (this.viewer.baseLayerPicker) 
		{
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
		else 
		{
			this.viewer.imageryLayers.removeAll();
			this.viewer.imageryLayers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
				url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
			}), 0);
		}
	}
	//삭제예정. 깔끔하게 삭제하는 법 생각좀하고..
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
	
	this.viewer.scene.magoManager = new MagoManager(this.config);
	this.viewer.scene.magoManager.sceneState.textureFlipYAxis = false;

	this.viewer.camera.frustum.fov = Cesium.Math.PI_OVER_THREE;
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

	scene.globe.terrainProviderChanged.addEventListener(function(e)
	{
		var hierarchyManager = magoManager.hierarchyManager;
		var projects = hierarchyManager.projectsMap;
		for (var j in projects) 
		{
			if (projects.hasOwnProperty(j)) 
			{
				var project = projects[j];
				for (var k in project) 
				{
					if (project.hasOwnProperty(k)) 
					{
						var node = project[k];
						if (node instanceof Mago3D.Node && node.data.attributes.isPhysical === true) 
						{
							if (node.isNeedValidHeight(magoManager)) { magoManager._needValidHeightNodeArray.push(node); }
						}
					}
				}
			}
		}

		for(var j=0,len=magoManager.modeler.objectsArray.length;j<len;j++)
		{
			var object = magoManager.modeler.objectsArray[j];
			if (object.isNeedValidHeight(magoManager)) { magoManager._needValidHeightNativeArray.push(object); }
		}
	});
	
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
		
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.LEFTDOWN, click.position, magoManager));
		//magoManager.mouseActionLeftDown(click.position.x, click.position.y);
	}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

	magoManager.handler.setInputAction(function(click) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.MIDDLEDOWN, click.position, magoManager));
		//magoManager.mouseActionMiddleDown(click.position.x, click.position.y);
	}, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
    
	magoManager.handler.setInputAction(function(click) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.RIGHTDOWN, click.position, magoManager));
		//magoManager.mouseActionRightDown(click.position.x, click.position.y);
	}, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.MOUSEMOVE, movement, magoManager));
		//magoManager.mouseActionMove(movement.startPosition, movement.endPosition);
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.LEFTUP, movement.position, magoManager));
		//magoManager.mouseActionLeftUp(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.LEFT_UP);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.MIDDLEUP, movement.position, magoManager));
		//magoManager.mouseActionMiddleUp(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.MIDDLE_UP);
    
	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.RIGHTUP, movement.position, magoManager));
		//magoManager.mouseActionRightUp(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.RIGHT_UP);
    
	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.CLICK, movement.position, magoManager));
		//magoManager.mouseActionLeftClick(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.DBCLICK, movement.position, magoManager));
		//magoManager.mouseActionLeftDoubleClick(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

	magoManager.handler.setInputAction(function(movement) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.RIGHTCLICK, movement.position, magoManager));
		//magoManager.mouseActionRightClick(movement.position.x, movement.position.y);
	}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

	magoManager.handler.setInputAction(function(delta) 
	{
		magoManager.handleBrowserEvent(new BrowserEvent(MagoManager.EVENT_TYPE.WHEEL, {delta: delta}, magoManager));
	}, Cesium.ScreenSpaceEventType.WHEEL);

	window.addEventListener('resize', function(event)
	{

		magoManager.isCameraMoved = true;
	}, false);
	 
	this.viewer.clock.onTick.addEventListener(function(clock) 
	{
		magoManager.cameraFPV.update(magoManager);
	});
};
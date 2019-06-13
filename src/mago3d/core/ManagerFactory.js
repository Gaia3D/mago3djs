'use strict';

/**
 * Factory method 패턴을 사용해서 cesium, worldwind 등을 wrapping 해 주는 클래스
 * @class ManagerFactory
 *
 * @param viewer 타 시스템과의 연동의 경우 view 객체가 생성되어서 넘어 오는 경우가 있음
 * @param containerId 뷰에서 표시할 위치 id
 * @param serverPolicy policy json object
 * @param projectIdArray json object map에 저장하기 위한 key
 * @param projectDataArray data json object
 * @param projectDataFolderArray f4d data folder path
 * @param imagePath 이미지 경로
 * @return api
 */
var ManagerFactory = function(viewer, containerId, serverPolicy, projectIdArray, projectDataArray, projectDataFolderArray, imagePath) 
{
	if (!(this instanceof ManagerFactory)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	var magoManager = null;
	var scene = null;
	var magoManagerState = CODE.magoManagerState.INIT;
	
	//var startMousePosition = null;
	//var nowMousePosition = null;

	// 환경 설정
	MagoConfig.init(serverPolicy, projectIdArray, projectDataArray);
	
	// 카메라 행동 설정
	function disableCameraMotion(state)
	{
		viewer.scene.screenSpaceCameraController.enableRotate = state;
		viewer.scene.screenSpaceCameraController.enableZoom = state;
		viewer.scene.screenSpaceCameraController.enableLook = state;
		viewer.scene.screenSpaceCameraController.enableTilt = state;
		viewer.scene.screenSpaceCameraController.enableTranslate = state;
	}
	
	// 이벤트 확장
	function addMouseAction() 
	{
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

		//var mousePosition;
		magoManager.handler.setInputAction(function(movement) 
		{
			//magoManager.mouseActionMove(movement.endPosition.x, movement.endPosition.y);
			//mousePosition = movement.endPosition;
			if (magoManager.mouseLeftDown) 
			{
				if (movement.startPosition.x !== movement.endPosition.x || movement.startPosition.y !== movement.endPosition.y) 
				{
					magoManager.manageMouseDragging(movement.startPosition.x, movement.startPosition.y);
					magoManager.cameraMoved();
				}
			}
			else
			{
				magoManager.mouseDragging = false;
				disableCameraMotion(true);
				if (magoManager.mouseMiddleDown || magoManager.mouseRightDown)
				{
					magoManager.isCameraMoving = true;
					magoManager.cameraMoved();
				}
			}
			
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		/*
		// disable wheel for cesium.
		var handler = magoManager.scene.screenSpaceCameraController._aggregator._eventHandler;
        handler.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL);
        for ( var modifierName in Cesium.KeyboardEventModifier) 
        {
            if (Cesium.KeyboardEventModifier.hasOwnProperty(modifierName)) 
            {
                var modifier = Cesium.KeyboardEventModifier[modifierName];
                if (modifier !== undefined) 
                {
                    handler.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL, modifier);
                }
            }
        }
		
		// make mago wheel.
		magoManager.handler.setInputAction(function (wheelZoomAmount) {
			var cameraHeight, directionToZoom, zoomAmount;
			if (mousePosition) {
				cameraHeight = viewer.scene.globe.ellipsoid.cartesianToCartographic(viewer.camera.position).height || Number.MAX_VALUE;
				directionToZoom = viewer.camera.getPickRay(mousePosition).direction;
				zoomAmount = wheelZoomAmount * cameraHeight / 1000;
				
				if(wheelZoomAmount > magoManager.TEST_maxWheelZoomAmount)
					magoManager.TEST_maxWheelZoomAmount = wheelZoomAmount;
				
				if(zoomAmount > magoManager.TEST_maxZoomAmount)
					magoManager.TEST_maxZoomAmount = zoomAmount;
				
				if(cameraHeight < 1000)
				{
					if(wheelZoomAmount > 100)
						wheelZoomAmount = 100;
					
					if(zoomAmount > 80)
						zoomAmount = 80;
				}
				if(directionToZoom.x > 1 || directionToZoom.y > 1 || directionToZoom.z > 1 )
					var hola =0;
				
				viewer.camera.position.x = viewer.camera.position.x + directionToZoom.x * zoomAmount;
				viewer.camera.position.y = viewer.camera.position.y + directionToZoom.y * zoomAmount;
				viewer.camera.position.z = viewer.camera.position.z + directionToZoom.z * zoomAmount;
				//viewer.camera.move(directionToZoom, zoomAmount);
			}
		}, Cesium.ScreenSpaceEventType.WHEEL);
		*/
		magoManager.handler.setInputAction(function(movement) 
		{
			magoManager.mouseActionLeftUp(movement.position.x, movement.position.y);
			// display current mouse position
			var pickPosition = {lat: null, lon: null, alt: null};
			var position = magoManager.scene.camera.pickEllipsoid(movement.position);
			if (position)
			{
				var cartographicPosition = Cesium.Cartographic.fromCartesian(position);
				pickPosition.lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
				pickPosition.lon = Cesium.Math.toDegrees(cartographicPosition.longitude);
				pickPosition.alt = cartographicPosition.height;
			}
			if (MagoConfig.getPolicy().geo_callback_enable === "true") 
			{
				if (serverPolicy.geo_callback_clickposition !== '') 
				{
					clickPositionCallback(serverPolicy.geo_callback_clickposition, pickPosition);
				}
			}
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
	}

	// cesium을 구현체로서 이용
	function initWwwMago(manager, gl) 
	{
		//var viewport = manager.wwd.viewport;
		//manager.selection.init(gl, viewport.width, viewport.height);
		manager.postFxShadersManager.gl = gl;
		manager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
		manager.createDefaultShaders(gl);// A1-Use this.***

		// object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
		//manager.getObjectIndexFile(); // old.***
		//viewer.scene.magoManager.getObjectIndexFile();
		if (projectIdArray !== null && projectIdArray.length > 0) 
		{
			for (var i=0; i<projectIdArray.length; i++) 
			{
				var projectDataFolder = projectDataFolderArray[i];
				var projectData = projectDataArray[i];
				if (!(projectData.data_key === projectDataFolder && projectData.attributes.isReference))
				{
					manager.getObjectIndexFile(projectIdArray[i], projectDataFolder);
				}
			}
		}
	}

	// cesium을 구현체로서 이용
	function drawCesium() 
	{
		var gl = viewer.scene.context._gl;
		//viewer.scene.magoManager.selection.init(gl, viewer.scene.drawingBufferWidth, viewer.scene.drawingBufferHeight);
		viewer.scene.magoManager.postFxShadersManager.gl = gl;
		viewer.scene.magoManager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
		viewer.scene.magoManager.createDefaultShaders(gl);// A1-Use this.***
		viewer.scene.magoManager.scene = viewer.scene;

		// Start postRender version.***********************************************
		magoManager = viewer.scene.magoManager;
		scene = viewer.scene;
		//scene.copyGlobeDepth = true;
		viewer.scene.globe.depthTestAgainstTerrain = true;
		viewer.scene.logarithmicDepthBuffer = false; //do not use logarithmic buffer
		viewer.scene.highDynamicRange = false; //do not use high dynamic range
		// object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
		//viewer.scene.magoManager.getObjectIndexFile();
		if (projectIdArray !== null && projectIdArray.length > 0) 
		{
			for (var i=0; i<projectIdArray.length; i++) 
			{
				var projectDataFolder = projectDataFolderArray[i];
				var projectData = projectDataArray[i];
				if (!(projectData.data_key === projectDataFolder && projectData.attributes.isReference))
				{
					viewer.scene.magoManager.getObjectIndexFile(projectIdArray[i], projectDataFolder);
				}
			}
		}
		viewer.scene.magoManager.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
		addMouseAction();
		viewer.clock.onTick.addEventListener(function(clock) 
		{
			magoManager.cameraFPV.update(magoManager);
		});
	}
	
	// magoworld을 구현체로서 이용
	function drawMagoWorld() 
	{
		var gl = viewer.magoManager.sceneState.gl;
		var manager = viewer.magoManager;
		manager.vboMemoryManager.gl = gl;
		manager.postFxShadersManager.gl = gl;
		manager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
		manager.createDefaultShaders(gl);// A1-Use this.***
		//viewer.renderTest();
	};

	// 실제 화면에 object를 rendering 하는 메인 메서드
	function draw() 
	{
		if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM) 
		{
			drawCesium();
		}
		else if (MagoConfig.getPolicy().geo_view_library === Constant.WORLDWIND) 
		{
			//initWwwMago();
		}
		else if (MagoConfig.getPolicy().geo_view_library === Constant.MAGOWORLD) 
		{
			drawMagoWorld();
		}
	}

	/**
	 * add Layers
	 */
	function addImageryLayers() 
	{
		var provider = new Cesium.WebMapServiceImageryProvider({
			url                : MagoConfig.getPolicy().geo_server_add_url,
			layers             : MagoConfig.getPolicy().geo_server_add_layers,
			enablePickFeatures : false,
			parameters         : {
				service     : MagoConfig.getPolicy().geo_server_add_parameters_service,
				version     : MagoConfig.getPolicy().geo_server_add_parameters_version,
				request     : MagoConfig.getPolicy().geo_server_add_parameters_request,
				transparent : MagoConfig.getPolicy().geo_server_add_parameters_transparent,
				//tiled : MagoConfig.getPolicy().backgroundProvider.parameters.tiled,
				format      : MagoConfig.getPolicy().geo_server_add_parameters_format
				//				time : MagoConfig.getPolicy().backgroundProvider.parameters.time,
				//		    	rand : MagoConfig.getPolicy().backgroundProvider.parameters.rand,
				//		    	asdf : MagoConfig.getPolicy().backgroundProvider.parameters.asdf
			}
			//,proxy: new Cesium.DefaultProxy('/proxy/')
		});

		//		if(index) viewer.imageryLayers.addImageryProvider(provider, index);
		viewer.imageryLayers.addImageryProvider(provider);
	}

	/**
	 * zoomTo 할 Entity
	 * @returns entities
	 */
	function initEntity() 
	{
		return viewer.entities.add({
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

	// terrain 적용 유무를 설정
	function initTerrain() 
	{
		/*		if(MagoConfig.getPolicy().geoConfig.initTerrain.enable) {
			var terrainProvider = new Cesium.CesiumTerrainProvider({
				url : MagoConfig.getPolicy().geoConfig.initTerrain.url,
				requestWaterMask: MagoConfig.getPolicy().geoConfig.initTerrain.requestWaterMask,
				requestVertexNormals: MagoConfig.getPolicy().geoConfig.initTerrain.requestVertexNormals
			});
			viewer.terrainProvider = terrainProvider;
		}*/
	}

	// 최초 로딩시 이동할 카메라 위치
	function initCamera() 
	{
		viewer.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(parseFloat(MagoConfig.getPolicy().geo_init_longitude),
				parseFloat(MagoConfig.getPolicy().geo_init_latitude),
				parseFloat(MagoConfig.getPolicy().geo_init_height)),
			duration: parseInt(MagoConfig.getPolicy().geo_init_duration)
		});
	}

	// deploy 타입 적용
	function initRenderMode() 
	{
		var api = new API("renderMode");
		magoManager.callAPI(api);

		if (MagoConfig.getPolicy().geo_time_line_enable === "false") 
		{
			// visible <---> hidden
			$(viewer._animation.container).css("visibility", "hidden");
			$(viewer._timeline.container).css("visibility", "hidden");
			viewer.forceResize();
		}
	}
	
	var DEFALUT_IMAGE = "ESRI World Imagery";
	var DEFALUT_TERRAIN = "WGS84 Ellipsoid";
	
	// pick baseLayer
	function setDefaultDataset() 
	{
		// WGS84 Ellipsoide
		if (MagoConfig.getPolicy().geo_init_default_terrain !== null && MagoConfig.getPolicy().geo_init_default_terrain !== "") 
		{
			DEFALUT_TERRAIN = MagoConfig.getPolicy().geo_init_default_terrain;
		}
		
		// search default imageryProvider from baseLayerPicker
		var imageryProvider = null;
		var imageryProviderViewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels; 
		for (var i in imageryProviderViewModels) 
		{
			if (!imageryProviderViewModels.hasOwnProperty(i))	{ continue; }

			var provider = imageryProviderViewModels[i];
			if (provider.name === DEFALUT_IMAGE) 
			{
				imageryProvider = provider;
				break;
			}
		}
		if (imageryProvider) { viewer.baseLayerPicker.viewModel.selectedImagery = imageryProvider; }
	  
		// search default terrainProvider from baseLayerPicker
		var terrainProvider = null;
		var terrainProviderViewModels = viewer.baseLayerPicker.viewModel.terrainProviderViewModels;
		for (var i in terrainProviderViewModels) 
		{
			if (!terrainProviderViewModels.hasOwnProperty(i))	{ continue; }
			var provider = terrainProviderViewModels[i];
			if (provider.name === DEFALUT_TERRAIN) 
			{
				terrainProvider = provider;
				break;
			}
		}
		if (terrainProvider) { viewer.baseLayerPicker.viewModel.selectedTerrain = terrainProvider; }
	}

	if (serverPolicy.geo_view_library === null ||
		serverPolicy.geo_view_library === '' ||
		serverPolicy.geo_view_library === Constant.CESIUM) 
	{
		// webgl lost events.******************************************
		var canvas = document.getElementById(containerId);
		canvas.addEventListener('webglcontextlost', function(e) 
		{
			console.log(e);
		}, false);
		
		canvas.addEventListener('webglcontextrestored', function(e) 
		{
		  console.log(e); 
		}, false);
		//-------------------------------------------------------------
		
		if (serverPolicy.geo_server_enable === "true" && serverPolicy.geo_server_url !== null && serverPolicy.geo_server_url !== '') 
		{
			var imageryProvider = new Cesium.WebMapServiceImageryProvider({
				url                : serverPolicy.geo_server_url,
				layers             : serverPolicy.geo_server_layers,
				enablePickFeatures : false,
				parameters         : {
					service     : serverPolicy.geo_server_parameters_service,
					version     : serverPolicy.geo_server_parameters_version,
					request     : serverPolicy.geo_server_parameters_request,
					transparent : serverPolicy.geo_server_parameters_transparent,
					format      : serverPolicy.geo_server_parameters_format
				}//,
				//proxy: new Cesium.DefaultProxy('/proxy/')
			});
			var options = {imageryProvider: imageryProvider, baseLayerPicker: false};
			if (viewer === null) { viewer = new Cesium.Viewer(containerId, options); }
		}
		else 
		{
			if (serverPolicy.geo_cesium_ion_token !== null && serverPolicy.geo_cesium_ion_token !== "") 
			{
				Cesium.Ion.defaultAccessToken = serverPolicy.geo_cesium_ion_token;
				DEFALUT_TERRAIN = "Cesium World Terrain";
			}
			if (viewer === null) { viewer = new Cesium.Viewer(containerId, {shouldAnimate: true}); }
			// 기본 지도 설정
			setDefaultDataset();
		}
			
		viewer.scene.magoManager = new MagoManager();
		viewer.scene.magoManager.sceneState.textureFlipYAxis = false;
		viewer.camera.frustum.fov = Cesium.Math.PI_OVER_THREE*1.8;
		//viewer.camera.frustum.near = 0.1;
		if (MagoConfig.getPolicy().geo_init_default_fov > 0) 
		{
			viewer.camera.frustum.fov = Cesium.Math.PI_OVER_THREE * MagoConfig.getPolicy().geo_init_default_fov;
		}

		// Layers 추가 적용
		if (serverPolicy.geo_server_enable === "true" && serverPolicy.geo_server_add_url !== null && serverPolicy.geo_server_add_url !== '') 
		{ 
			addImageryLayers(); 
		}
			
		draw();
		// build을 rendering 할 위치
		initEntity();
		// terrain 적용 여부
		/*if() {
				initTerrain();
			}*/
		// 최초 로딩시 카메라 이동 여부
		if (serverPolicy.geo_init_camera_enable === "true") { initCamera(); }
		// render Mode 적용
		initRenderMode();
	}
	else if (serverPolicy.geo_view_library === Constant.WORLDWIND) 
	{
			
		// Tell World Wind to log only warnings and errors.
		WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

		// set to canvas the current gl.***
		var canvas = document.getElementById(containerId);
			
		var wwd;
		if (serverPolicy.geo_server_enable === "true" && serverPolicy.geo_server_url !== null && serverPolicy.geo_server_url !== '') 
		{
			wwd = new WorldWind.WorldWindow(containerId, new WorldWind.ZeroElevationModel());
				
			// Web Map Service information
			var serviceAddress = serverPolicy.geo_server_url + "?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";

			// Named layer displaying Average Temperature data
			var layerName = "mago3d";

			// Called asynchronously to parse and create the WMS layer
			var createLayer = function (xmlDom) 
			{
				// Create a WmsCapabilities object from the XML DOM
				var wms = new WorldWind.WmsCapabilities(xmlDom);
				// Retrieve a WmsLayerCapabilities object by the desired layer name
				var wmsLayerCapabilities = wms.getNamedLayer(layerName);
				// Form a configuration object from the WmsLayerCapability object
				var wmsConfig = WorldWind.WmsLayer.formLayerConfiguration(wmsLayerCapabilities);
				// Modify the configuration objects title property to a more user friendly title
				wmsConfig.title = "imageProvider";
				// Create the WMS Layer from the configuration object
				var wmsLayer = new WorldWind.WmsLayer(wmsConfig);

				// Add the layers to WorldWind and update the layer manager
				wwd.addLayer(wmsLayer);
			};

			// Called if an error occurs during WMS Capabilities document retrieval
			var logError = function (jqXhr, text, exception) 
			{
				console.log("There was a failure retrieving the capabilities document: " + text + " exception: " + exception);
			};

			$.get(serviceAddress).done(createLayer).fail(logError);
		}
		else 
		{
			// Create the World Window.
			wwd = new WorldWind.WorldWindow(containerId);
			//wwd.depthBits = 32;
				
			var layers = [
				{layer: new WorldWind.BMNGLayer(), enabled: true},
				{layer: new WorldWind.BMNGLandsatLayer(), enabled: false},
				{layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
				{layer: new WorldWind.OpenStreetMapImageLayer(null), enabled: false},
				{layer: new WorldWind.CompassLayer(), enabled: false},
				{layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
				{layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
			];

			for (var l = 0; l < layers.length; l++) 
			{
				layers[l].layer.enabled = layers[l].enabled;
				wwd.addLayer(layers[l].layer);
			}
		}

		// Now set up to handle highlighting.
		//var highlightController = new WorldWind.HighlightController(wwd);

		magoManager = new MagoManager();
		magoManager.wwd = wwd;
		magoManager.sceneState.textureFlipYAxis = true;
			
		var newRenderableLayer = new WorldWind.RenderableLayer();
		newRenderableLayer.displayName = "F4D tiles";
		newRenderableLayer.inCurrentFrame = true; // Test.***
		wwd.addLayer(newRenderableLayer);
			
		//newRenderableLayer.addRenderable(f4d_wwwLayer);// old.***
		newRenderableLayer.addRenderable(magoManager);
		// End Create a layer to hold the f4dBuildings.-------------------------------------------------------

		var gl = wwd.drawContext.currentGlContext;
		initWwwMago(magoManager, gl);

		// Click event. 
		// The common gesture-handling function.
		var handleClick = function (recognizer) 
		{
			// Obtain the event location.
			//magoManager.mouse_x = event.layerX,
			//magoManager.mouse_y = event.layerY;
			//magoManager.bPicking = true;
				
			// Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
			// relative to the upper left corner of the canvas rather than the upper left corner of the page.
			//var pickList = wwd.pick(wwd.canvasCoordinates(x, y));

			// If only one thing is picked and it is the terrain, use a go-to animator to go to the picked location.
			/*
				if (pickList.objects.length === 1 && pickList.objects[0].isTerrain) {
					var position = pickList.objects[0].position;
					//wwd.goTo(new WorldWind.Location(position.latitude, position.longitude));
					//wwd.goTo(new WorldWind.Position(37.48666, 127.05618, 500));
					wwd.goToOriented(new WorldWind.Position(37.48666, 127.05618, 500.0), 120.0, 80.0);
				}
				*/
		};

		// Listen for mouse clicks.
		var clickRecognizer = new WorldWind.ClickRecognizer(wwd, handleClick);
		clickRecognizer.button = 0;  //left mouse button
			
		var mouseDownEvent = function(event) 
		{
			if (event.button === 0) 
			{ 
				magoManager.mouseActionLeftDown(event.layerX, event.layerY); 
			}
			else if (event.button === 1) 
			{ 
				magoManager.mouseActionMiddleDown(event.layerX, event.layerY); 
			}
			else if (event.button === 2) 
			{ 
				magoManager.mouseActionRightDown(event.layerX, event.layerY); 
			}
		};
		wwd.addEventListener("mousedown", mouseDownEvent, false);
			
		var mouseUpEvent = function(event) 
		{
			if (event.button === 0) 
			{ 
				magoManager.mouseActionLeftUp(event.layerX, event.layerY);
			}
			else if (event.button === 1) 
			{ 
				magoManager.mouseActionMiddleUp(event.layerX, event.layerY);
			}
			else if (event.button === 2) 
			{ 
				magoManager.mouseActionRightUp(event.layerX, event.layerY);
			}

			// display current mouse position
				
			var terrainObject;
			var pickPosition = {lat: null, lon: null, alt: null};
			var pickPoint = wwd.canvasCoordinates(event.layerX, event.layerY);
			if (pickPoint[0] >= 0 && pickPoint[0] < wwd.canvas.width &&
					pickPoint[1] >= 0 && pickPoint[1] < wwd.canvas.height)
			{
				terrainObject = wwd.pickTerrain(pickPoint).terrainObject();
				var terrainPosition = terrainObject ? terrainObject.position : null;
				if (terrainPosition !== null)
				{
					pickPosition.lat = terrainPosition.latitude;
					pickPosition.lon = terrainPosition.longitude;
					pickPosition.alt = terrainPosition.altitude;	
				}
			}
			if (MagoConfig.getPolicy().geo_callback_enable === "true") 
			{
				if (serverPolicy.geo_callback_clickposition !== '') 
				{
					clickPositionCallback(serverPolicy.geo_callback_clickposition, pickPosition);
				}
			}
		};
		wwd.addEventListener("mouseup", mouseUpEvent, false);
			
		var mouseMoveEvent = function(event) 
		{
			magoManager.mouse_x = event.layerX,
			magoManager.mouse_y = event.layerY;
			if (magoManager.mouseLeftDown) 
			{ 
				magoManager.manageMouseDragging(event.layerX, event.layerY); 
				magoManager.cameraMoved();
			}
			else if (magoManager.mouseMiddleDown || magoManager.mouseRightDown) 
			{ 
				magoManager.cameraMoved();
			}
				
		};
		wwd.addEventListener("mousemove", mouseMoveEvent, false);
		
		
		wwd.goToAnimator.travelTime = MagoConfig.getPolicy().geo_init_duration * 1000;
		wwd.goTo(new WorldWind.Position(MagoConfig.getPolicy().geo_init_latitude, MagoConfig.getPolicy().geo_init_longitude, MagoConfig.getPolicy().geo_init_height));
	}
	if (serverPolicy.geo_view_library === Constant.MAGOWORLD) 
	{
		var canvas = document.getElementById(containerId);
		var glAttrs = {antialias: false, stencil: true};
		var gl = canvas.getContext("webgl", glAttrs);
		if (!gl)
		{ gl = canvas.getContext("experimental-webgl", glAttrs); }
		
		// Problem: canvas-width initially is 300 and canvas-height = 150.***
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
		
		magoManager = new MagoManager();
		var sceneState = magoManager.sceneState;
		sceneState.textureFlipYAxis = true;
		sceneState.gl = gl;
		sceneState.drawingBufferWidth[0] = canvas.clientWidth;
		sceneState.drawingBufferHeight[0] = canvas.clientHeight;
		sceneState.camera.frustum.aspectRatio = canvas.clientWidth/canvas.clientHeight;
		sceneState.camera.frustum.fovRad[0] = Math.PI/3*1.8;
		sceneState.camera.frustum.fovyRad[0] = sceneState.camera.frustum.fovRad[0]/sceneState.camera.frustum.aspectRatio;
		sceneState.camera.frustum.tangentOfHalfFovy[0] = Math.tan(sceneState.camera.frustum.fovyRad[0]/2);
		
		
		// initial camera position.***
		sceneState.camera.position.set(0.0, 0.0, 10000000.0);
		sceneState.camera.direction.set(0.0, 0.0, -1.0);
		sceneState.camera.up.set(0.0, 1.0, 0.0);
		
		// test init camera position.***
		//sphere.r = 6378137.0;
		sceneState.encodedCamPosHigh[0] = 0;
		sceneState.encodedCamPosHigh[1] = 0;
		sceneState.encodedCamPosHigh[2] = 10000000.0;
		
		sceneState.encodedCamPosLow[0] = 0;
		sceneState.encodedCamPosLow[1] = 0;
		sceneState.encodedCamPosLow[2] = 0;

		
		viewer = new MagoWorld(magoManager);
		magoManager.magoWorld = viewer;
		magoManager.globe = new Globe();
		// init matrices.***
		viewer.updateModelViewMatrixByCamera(sceneState.camera);
		//magoManager.upDateSceneStateMatrices(sceneState);
		
		// event listener.***
		canvas.addEventListener('mousedown', function(event)
		{
			viewer.mousedown(event);			
		}, false);
		
		canvas.addEventListener('mouseup', function(event)
		{
			viewer.mouseup(event);			
		}, false);
		
		canvas.addEventListener('mousewheel', function(event)
		{
			viewer.mousewheel(event); 
		}, false);
		
		canvas.addEventListener('mousemove', function(event)
		{
			viewer.mousemove(event);
		}, false);
		
		canvas.addEventListener('click', function(event)
		{
			viewer.mouseclick(event);
		}, false);
		
		canvas.addEventListener('resize', function(event)
		{
			var hola = 0; // no works.***
		}, false);
		
		canvas.addEventListener('keydown', function(event) // no works.***
		{
			viewer.keydown(event); // no works.***
		}, false);

		
		draw();
	}

	// 이미지 경로
	magoManager.magoPolicy.imagePath = imagePath;
	magoManagerState = CODE.magoManagerState.READY;

	// KeyPressEvents.**************************************
	document.addEventListener('keydown', function(event) 
	{
		// get current building selected
		if (magoManager.magoPolicy.issueInsertEnable)	{ return; }
		
		magoManager.keyDown(event.keyCode);

		var selectedBuilding = magoManager.buildingSelected;	
		if (selectedBuilding === undefined) 	{ return; }

		var nodeSelected = magoManager.selectionManager.currentNodeSelected;
		if (nodeSelected === undefined)
		{ return; }
		var rootNodeSelected = nodeSelected.getRoot();
		var geoLocationData = rootNodeSelected.data.geoLocDataManager.getCurrentGeoLocationData();
		if (geoLocationData === undefined)		{ return; }

		if (magoManager.magoPolicy.objectMoveMode === CODE.moveMode.ALL)
		{
			var increDeg = 3.0;
			var currentHeading = geoLocationData.heading || 0;
			var currentPitch = geoLocationData.pitch || 0;
			var currentRoll = geoLocationData.roll || 0;
			
			var increDist = 0.2;
			var currentAlt = geoLocationData.geographicCoord.altitude || 0;
			var displayData = false;
			
			// For Heading
			if (event.keyCode === 'Q'.charCodeAt(0))
			{
				currentHeading += increDeg;
				displayData = true;
			}
			else if (event.keyCode === 'A'.charCodeAt(0))
			{
				currentHeading -= increDeg;
				displayData = true;
			}
			
			// For Pitch
			if (event.keyCode === 'W'.charCodeAt(0))
			{
				currentPitch += increDeg;
				displayData = true;
			}
			else if (event.keyCode === 'S'.charCodeAt(0))
			{
				currentPitch -= increDeg;
				displayData = true;
			}

			// For Roll
			if (event.keyCode === 'E'.charCodeAt(0))
			{
				currentRoll += increDeg;
				displayData = true;
			}
			else if (event.keyCode === 'D'.charCodeAt(0))
			{
				currentRoll -= increDeg;
				displayData = true;
			}
			
			// For Altitude
			if (event.keyCode === 'Z'.charCodeAt(0))
			{
				currentAlt += increDist;
				displayData = true;
			}
			else if (event.keyCode === 'X'.charCodeAt(0))
			{
				currentAlt -= increDist;
				displayData = true;
			}
			
			

			if (displayData)
			{
				magoManager.changeLocationAndRotationNode(nodeSelected, geoLocationData.geographicCoord.latitude, geoLocationData.geographicCoord.longitude, 
					currentAlt, currentHeading, currentPitch, currentRoll); 
			}
		}

	}, false);
	
	// TODO API 객체를 생성해서 하나의 parameter로 전달하는 방식이 좀 더 깔끔할거 같지만 성능적인 부분에서 조금은 투박할거 같아서 일단 이렇게 처리
	return {
		// api gateway 역할
		callAPI: function(api) 
		{
		    if (api.getReturnable()) 
			{
		        return magoManager.callAPI(api);
			}
			else 
			{
				magoManager.callAPI(api);
			}
		},
		// flyTo: function(issueId, issueType, longitude, latitude, height, duration)
		// {
		// 	if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM)
		// 	{
		// 		viewer.camera.flyTo({
		// 			destination: Cesium.Cartesian3.fromDegrees(parseFloat(longitude),
		// 				parseFloat(latitude),
		// 				parseFloat(height) + 10),
		// 			duration: parseInt(duration)
		// 		});
		// 	}
		// 	else
		// 	{
		// 		wwd.goToAnimator.travelTime = duration * 1000;
		// 		wwd.goTo(new WorldWind.Position(parseFloat(latitude), parseFloat(longitude), parseFloat(height) + 50));
		// 	}
		// 	// pin을 그림
		// 	if (issueId !== null && issueType !== undefined)
		// 	{
		// 		var api = new API("drawInsertIssueImage");
		// 		api.setDrawType(0);
		// 		api.setIssueId(issueId);
		// 		api.setIssueType(issueType);
		// 		api.setDataKey(null);
		// 		api.setLatitude(latitude);
		// 		api.setLongitude(longitude);
		// 		api.setElevation(height);
		// 		magoManager.callAPI(api);
		// 	}
		// },
		// magoManager 상태
		getViewer: function()
		{
			return viewer;
		},
		getMagoManagerState: function() 
		{
			return magoManagerState;
		},
		getMagoManager: function() 
		{
			return magoManager;
		}
	};
};

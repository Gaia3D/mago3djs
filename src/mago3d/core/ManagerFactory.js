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
 * @param options View 생성을 위한 기타 옵션
 * @returns api
 */
var ManagerFactory = function(viewer, containerId, serverPolicy, projectIdArray, projectDataArray, projectDataFolderArray, imagePath, options) 
{
	if (!(this instanceof ManagerFactory)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	var magoManager = null;
	var scene = null;
	var magoManagerState = CODE.magoManagerState.INIT;
	var _options = options || {};
	_options.animation = _options.animation || false;
	_options.timeline = _options.timeline || false;

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
		if (serverPolicy.geo_tile_path && serverPolicy.geo_tile_path !== "") 
		{
			viewer.scene.magoManager.getObjectIndexFileSmartTileF4d(serverPolicy.geo_tile_path);
		}

		viewer.scene.magoManager.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
		addMouseAction();
		viewer.clock.onTick.addEventListener(function(clock) 
		{
			magoManager.cameraFPV.update(magoManager);
		});

		viewer.camera.changed.addEventListener(function(e)
		{
			magoManager.cameraChanged(e);
		});
		viewer.camera.moveEnd.addEventListener(function(e)
		{
			magoManager.cameraMoveEnd(e);
		});
		viewer.camera.moveStart.addEventListener(function(e)
		{
			magoManager.cameraMoveStart(e);
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
		if (MagoConfig.getPolicy().basicGlobe === Constant.CESIUM) 
		{
			drawCesium();
		}
		else if (MagoConfig.getPolicy().basicGlobe === Constant.MAGOWORLD) 
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
			url        : MagoConfig.getPolicy().geo_server_add_url,
			layers     : MagoConfig.getPolicy().geo_server_add_layers,
			parameters : {
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
			destination: Cesium.Cartesian3.fromDegrees(parseFloat(MagoConfig.getPolicy().initLatitude),
				parseFloat(MagoConfig.getPolicy().initLongitude),
				parseFloat(MagoConfig.getPolicy().initHeight)),
			duration: parseInt(MagoConfig.getPolicy().initDuration)
		});
	}

	// deploy 타입 적용
	function initRenderMode() 
	{
		var api = new API("renderMode");
		magoManager.callAPI(api);

		// if (MagoConfig.getPolicy().geo_time_line_enable === "false") 
		// {
		// 	// visible <---> hidden
		// 	$(viewer._animation.container).css("visibility", "hidden");
		// 	$(viewer._timeline.container).css("visibility", "hidden");
		// 	viewer.forceResize();
		// }
	}
	
	var DEFALUT_IMAGE = "ESRI World Imagery";
	var DEFALUT_TERRAIN = "WGS84 Ellipsoid";
	
	// pick baseLayer
	function setDefaultDataset() 
	{
		// WGS84 Ellipsoide
		if (MagoConfig.getPolicy().initDefaultTerrain !== null && MagoConfig.getPolicy().initDefaultTerrain !== "") 
		{
			DEFALUT_TERRAIN = MagoConfig.getPolicy().initDefaultTerrain;
		}
		
		if (viewer === undefined || viewer.baseLayerPicker === undefined)  { return; }

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


	//start
	if (serverPolicy.basicGlobe === null ||
		serverPolicy.basicGlobe === '' ||
		serverPolicy.basicGlobe === Constant.CESIUM) 
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
				url        : serverPolicy.geo_server_url,
				layers     : serverPolicy.geo_server_layers,
				parameters : {
					service     : serverPolicy.geo_server_parameters_service,
					version     : serverPolicy.geo_server_parameters_version,
					request     : serverPolicy.geo_server_parameters_request,
					transparent : serverPolicy.geo_server_parameters_transparent,
					format      : serverPolicy.geo_server_parameters_format
				},
				enablePickFeatures: false//,
				//proxy: new Cesium.DefaultProxy('/proxy/')
			});
			// var options = {imageryProvider: imageryProvider, baseLayerPicker: false};
			_options.imageryProvider = imageryProvider;
			_options.baseLayerPicker = false;
			if (viewer === null) { viewer = new Cesium.Viewer(containerId, _options); }
		}
		else 
		{
			if (serverPolicy.cesiumIonToken !== null && serverPolicy.cesiumIonToken !== "") 
			{
				Cesium.Ion.defaultAccessToken = serverPolicy.cesiumIonToken;
				DEFALUT_TERRAIN = "Cesium World Terrain";
			}

			_options.shouldAnimate = false;
			if (viewer === null) { viewer = new Cesium.Viewer(containerId, _options); }
			// 기본 지도 설정
			setDefaultDataset();
		}
			
		viewer.scene.magoManager = new MagoManager();
		viewer.scene.magoManager.sceneState.textureFlipYAxis = false;
		viewer.camera.frustum.fov = Cesium.Math.PI_OVER_THREE*1.8;
		if (MagoConfig.getPolicy().initDefaultFov > 0) 
		{
			viewer.camera.frustum.fov = Cesium.Math.PI_OVER_THREE * MagoConfig.getPolicy().initDefaultFov;
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
		if (serverPolicy.initCameraEnable) { initCamera(); }
		// render Mode 적용
		initRenderMode();
	}
	else if (serverPolicy.geo_view_library === Constant.MAGOWORLD) 
	{
		var canvas = document.getElementById(containerId);
		var glAttrs = {antialias          : true, 
			stencil            : true,
			premultipliedAlpha : false};
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
		sceneState.camera.frustum.aspectRatio[0] = canvas.clientWidth/canvas.clientHeight;
		sceneState.camera.frustum.fovRad[0] = Math.PI/3*1.8;
		sceneState.camera.frustum.fovyRad[0] = sceneState.camera.frustum.fovRad[0]/sceneState.camera.frustum.aspectRatio;
		sceneState.camera.frustum.tangentOfHalfFovy[0] = Math.tan(sceneState.camera.frustum.fovyRad[0]/2);
		
		// initial camera position.***
		sceneState.camera.position.set(-7586937.743019165, 10881859.054284709, 5648264.99911627);
		sceneState.camera.direction.set(0.5307589970384617, -0.7598419113077192, -0.3754132585133587);
		sceneState.camera.up.set(0.23477224008249162, -0.29380469331271475, 0.9265855321012102);
		
		// test init camera position.***
		//sphere.r = 6378137.0;
		sceneState.encodedCamPosHigh[0] = -7536640;
		sceneState.encodedCamPosHigh[1] = 10878976;
		sceneState.encodedCamPosHigh[2] = 5636096;
		
		sceneState.encodedCamPosLow[0] = -50297.7421875;
		sceneState.encodedCamPosLow[1] = 2883.05419921875;
		sceneState.encodedCamPosLow[2] = 12168.9990234375;

		
		viewer = new MagoWorld(magoManager);
		magoManager.magoWorld = viewer;
		magoManager.globe = new Globe();
		// init matrices.***
		viewer.updateModelViewMatrixByCamera(sceneState.camera);
		//magoManager.upDateSceneStateMatrices(sceneState);
		
		// Create the tinTerrains(MagoEarth).***
		magoManager.tinTerrainManager = new TinTerrainManager();
		
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
			// TODO:
			console.log("resize");
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

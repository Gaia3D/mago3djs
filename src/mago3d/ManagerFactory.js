'use strict';

/**
 * Factory method 패턴을 사용해서 cesium, worldwind 등을 wrapping 해 주는 클래스
 * @class ManagerFactory
 *
 * @param viewer 타 시스템과의 연동의 경우 view 객체가 생성되어서 넘어 오는 경우가 있음
 * @param containerId 뷰에서 표시할 위치 id
 * @param serverPolicy policy json object
 * @param serverData data json object
 * @param imagePath 이미지 경로
 * @return api
 */
var ManagerFactory = function(viewer, containerId, serverPolicy, serverData, imagePath) {
	if(!(this instanceof ManagerFactory)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	var magoManager = null;
	var scene = null;
	
	//var startMousePosition = null;
	//var nowMousePosition = null;

	// 환경 설정
	MagoConfig.init(serverPolicy, serverData);
	
	if(serverPolicy.geo_view_library === null
			|| serverPolicy.geo_view_library === ''
			|| serverPolicy.geo_view_library === Constant.CESIUM) {
		
		if(viewer === null) viewer = new Cesium.Viewer(containerId);

		// 기본 지도 설정
		setDefaultDataset();

		viewer.scene.magoManager = new MagoManager();
		viewer.scene.magoManager.sceneState.textureFlipYAxis = false;
		viewer.camera.frustum.fov = Cesium.Math.PI_OVER_THREE*1.8;

		// background provider 적용
		if(serverPolicy.geo_server_enable == "true") backgroundProvider();
		
		draw();
		// build을 rendering 할 위치
		initEntity();
		// terrain 적용 여부
		/*if() {
			initTerrain();
		}*/
		// 최초 로딩시 카메라 이동 여부
		if(serverPolicy.geo_init_camera_enable == "true") initCamera();
		// render Mode 적용
		initRenderMode();
	} else if(serverPolicy.geo_view_library === Constant.WORLDWIND) {
		
		// Tell World Wind to log only warnings and errors.
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

		// set to canvas the current gl.***
		var canvas = document.getElementById(containerId);
		// Create the World Window.
        var wwd = new WorldWind.WorldWindow(containerId);
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

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
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

		// Click event. Is different to anothers event handlers.******************************************************
		// The common gesture-handling function.
		var handleClick = function (recognizer) {
			// Obtain the event location.
			magoManager.mouse_x = event.layerX,
			magoManager.mouse_y = event.layerY;
			magoManager.bPicking = true;
			
			// Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
			// relative to the upper left corner of the canvas rather than the upper left corner of the page.
			//var pickList = wwd.pick(wwd.canvasCoordinates(x, y));

			// If only one thing is picked and it is the terrain, use a go-to animator to go to the picked location.
			/*
			if (pickList.objects.length == 1 && pickList.objects[0].isTerrain) {
				var position = pickList.objects[0].position;
				//wwd.goTo(new WorldWind.Location(position.latitude, position.longitude));
				//wwd.goTo(new WorldWind.Position(37.48666, 127.05618, 500));
				wwd.goToOriented(new WorldWind.Position(37.48666, 127.05618, 500.0), 120.0, 80.0);
			}
			*/
		};

		// Listen for mouse clicks.
		var clickRecognizer = new WorldWind.ClickRecognizer(wwd, handleClick);
		
		var mouseDownEvent = function(event) {
			if(event.button == 0) magoManager.mouseLeftDown = true;
			magoManager.isCameraMoving = true;
			magoManager.mouse_x = event.layerX,
			magoManager.mouse_y = event.layerY;
		};
		wwd.addEventListener("mousedown", mouseDownEvent, false);
		
		var mouseUpEvent = function(event) {
			if(event.button == 0) magoManager.mouseLeftDown = false;
			magoManager.isCameraMoving = false;
		};
		wwd.addEventListener("mouseup", mouseUpEvent, false);
		
		var mouseMoveEvent = function(event) {
			magoManager.mouse_x = event.layerX,
			magoManager.mouse_y = event.layerY;
			if(magoManager.mouseLeftDown) magoManager.manageMouseMove(event.layerX, event.layerY);
			
		};
		wwd.addEventListener("mousemove", mouseMoveEvent, false);
	
		wwd.goToAnimator.travelTime = MagoConfig.getPolicy().geo_init_duration * 1000;
		wwd.goTo(new WorldWind.Position(MagoConfig.getPolicy().geo_init_latitude, MagoConfig.getPolicy().geo_init_longitude, MagoConfig.getPolicy().geo_init_height));
	}
	
	// 이미지 경로
	magoManager.magoPolicy.imagePath = imagePath;

	// 실제 화면에 object를 rendering 하는 메인 메서드
	function draw() {
		if(MagoConfig.getPolicy().geo_view_library === Constant.CESIUM) {
			drawCesium();
		} else if(MagoConfig.getPolicy().geo_view_library === Constant.WORLDWIND) {
			//initWwwMago();
		}
	}
	
	// cesium을 구현체로서 이용
	function initWwwMago(magoManager, gl) {
		var viewport = magoManager.wwd.viewport;
		magoManager.selection.init(gl, viewport.width, viewport.height);
		magoManager.shadersManager.createDefaultShader(gl);
		magoManager.postFxShadersManager.gl = gl;
		magoManager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
		magoManager.createDefaultShaders(gl);// A1-Use this.***

		// Start postRender version.***********************************************
		// object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
		magoManager.getObjectIndexFile();
		//viewer.scene.magoManager.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
		//addMouseAction();
	}

	// cesium을 구현체로서 이용
	function drawCesium() {
		var gl = viewer.scene.context._gl;
		viewer.scene.magoManager.selection.init(gl, viewer.scene.drawingBufferWidth, viewer.scene.drawingBufferHeight);
		viewer.scene.magoManager.shadersManager.createDefaultShader(gl);
		viewer.scene.magoManager.postFxShadersManager.gl = gl;
		viewer.scene.magoManager.postFxShadersManager.createDefaultShaders(gl); // A1-OLD.***
		viewer.scene.magoManager.createDefaultShaders(gl);// A1-Use this.***
		viewer.scene.magoManager.scene = viewer.scene;

		// Start postRender version.***********************************************
		magoManager = viewer.scene.magoManager;
		scene = viewer.scene;
		//scene.copyGlobeDepth = true;
		viewer.scene.globe.depthTestAgainstTerrain = true;

		// object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
		viewer.scene.magoManager.getObjectIndexFile();
		viewer.scene.magoManager.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
		addMouseAction();
	}

	// 뭐하는 메서드 인가?
	function disableCameraMotion(state){
		viewer.scene.screenSpaceCameraController.enableRotate = state;
		viewer.scene.screenSpaceCameraController.enableZoom = state;
		viewer.scene.screenSpaceCameraController.enableLook = state;
		viewer.scene.screenSpaceCameraController.enableTilt = state;
		viewer.scene.screenSpaceCameraController.enableTranslate = state;
	}

	// 이벤트 확장
	function addMouseAction() {
		magoManager.handler.setInputAction(function(click) {
			magoManager.dateSC = new Date();
			magoManager.startTimeSC = magoManager.dateSC.getTime();
			//secondsUsed = this.currentTimeSC - this.startTimeSC;

			magoManager.mouse_x = click.position.x;
			magoManager.mouse_y = click.position.y;
			magoManager.mouseLeftDown = true;
			
			//nowMousePosition = startMousePosition = Cesium.Cartesian3.clone(click.position);
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

		magoManager.handler.setInputAction(function(click) {
			magoManager.dateSC = new Date();
			magoManager.startTimeSC = magoManager.dateSC.getTime();
			//secondsUsed = this.currentTimeSC - this.startTimeSC;

			magoManager.mouse_x = click.position.x;
			magoManager.mouse_y = click.position.y;
			magoManager.mouseMiddleDown = true;
		}, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);

		magoManager.handler.setInputAction(function(movement) {
			if(magoManager.mouseLeftDown) {
				if(movement.startPosition.x != movement.endPosition.x || movement.startPosition.y != movement.endPosition.y) {
					magoManager.manageMouseMove(movement.startPosition.x, movement.startPosition.y);
				}
			} else{
				magoManager.mouseDragging = false;
				disableCameraMotion(true);
				if(magoManager.mouseMiddleDown)
				{
					magoManager.isCameraMoving = true;
				}
			}
			//nowMousePosition = movement.endPosition;
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

		magoManager.handler.setInputAction(function(movement) {
			// if picked
			//vm.pickedPolygon = false;
			//disableCameraMotion(true)
			magoManager.isCameraMoving = false;
			magoManager.mouseLeftDown = false;
			magoManager.mouseDragging = false;
			magoManager.selObjMovePlane = undefined;
			magoManager.mustCheckIfDragging = true;
			magoManager.thereAreStartMovePoint = false;
			disableCameraMotion(true);

			magoManager.dateSC = new Date();
			magoManager.currentTimeSC = magoManager.dateSC.getTime();
			var miliSecondsUsed = magoManager.currentTimeSC - magoManager.startTimeSC;
			//if(miliSecondsUsed < 500) // original.***
			if(miliSecondsUsed < 1000) {
				if(magoManager.mouse_x == movement.position.x && magoManager.mouse_y == movement.position.y) {
					magoManager.bPicking = true;
					//var gl = scene.context._gl;
					//f4d_topManager.objectSelected = f4d_topManager.getSelectedObjectPicking(scene, f4d_topManager.currentRenderablesNeoRefListsArray);
				}
			}
	    }, Cesium.ScreenSpaceEventType.LEFT_UP);

		magoManager.handler.setInputAction(function(movement) {
			// if picked
			//vm.pickedPolygon = false;
			//disableCameraMotion(true)
			magoManager.isCameraMoving = false;
			magoManager.mouseMiddleDown = false;
			magoManager.mouseDragging = false;
			magoManager.selObjMovePlane = undefined;
			magoManager.mustCheckIfDragging = true;
			magoManager.thereAreStartMovePoint = false;
			disableCameraMotion(true);

			magoManager.dateSC = new Date();
			magoManager.currentTimeSC = magoManager.dateSC.getTime();
			var miliSecondsUsed = magoManager.currentTimeSC - magoManager.startTimeSC;
			if(miliSecondsUsed < 500) {
				if(magoManager.mouse_x == movement.position.x && magoManager.mouse_y == movement.position.y) {
					magoManager.bPicking = true;
					//var gl = scene.context._gl;
					//f4d_topManager.objectSelected = f4d_topManager.getSelectedObjectPicking(scene, f4d_topManager.currentRenderablesNeoRefListsArray);
				}
			}
	    }, Cesium.ScreenSpaceEventType.MIDDLE_UP);
	}

	// KeyPressEvents.**************************************
	document.addEventListener('keydown', function(e) {
		setKey(e);
	}, false);

	function setKey(event) {
		var increDeg = 3.0;
		if (event.key === "q" || event.key === "Q") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;	
			if(selectedBuilding != undefined) {
				var geoLocationData = selectedBuilding.geoLocDataManager.geoLocationDataArray[0];
				if(geoLocationData != undefined) {
					if(geoLocationData.heading == undefined) geoLocationData.heading = 0; 
					var currentHeading = geoLocationData.heading;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, geoLocationData.latitude, geoLocationData.longitude, geoLocationData.elevation,
					currentHeading+increDeg, geoLocationData.pitch, geoLocationData.roll);
				}
			}
		} else if (event.key === "a" || event.key === "A") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined) {
				var geoLocationData = selectedBuilding.geoLocDataManager.geoLocationDataArray[0];
				if(geoLocationData != undefined) {
					if(geoLocationData.heading == undefined) geoLocationData.heading = 0; 
					var currentHeading = geoLocationData.heading;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, geoLocationData.latitude, geoLocationData.longitude, geoLocationData.elevation,
					currentHeading-increDeg, geoLocationData.pitch, geoLocationData.roll);
				}
			}
		} else if (event.key === "w" || event.key === "W") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined) {
				var geoLocationData = selectedBuilding.geoLocDataManager.geoLocationDataArray[0];
				if(geoLocationData != undefined) {
					if(geoLocationData.pitch == undefined) geoLocationData.pitch = 0; 
					var currentPitch = geoLocationData.pitch;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, geoLocationData.latitude, geoLocationData.longitude, geoLocationData.elevation,
					geoLocationData.heading, currentPitch+increDeg, geoLocationData.roll);
				}
			}
		} else if (event.key === "s" || event.key === "S") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined) {
				var geoLocationData = selectedBuilding.geoLocDataManager.geoLocationDataArray[0];
				if(geoLocationData != undefined) {
					if(geoLocationData.pitch == undefined) geoLocationData.pitch = 0; 
					var currentPitch = geoLocationData.pitch;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, geoLocationData.latitude, geoLocationData.longitude, geoLocationData.elevation,
					geoLocationData.heading, currentPitch-increDeg, geoLocationData.roll);
				}
			}
		} else if (event.key === "e" || event.key === "E") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined) {		
				var geoLocationData = selectedBuilding.geoLocDataManager.geoLocationDataArray[0];
				if(geoLocationData != undefined) {
					if(geoLocationData.roll == undefined) geoLocationData.roll = 0; 
					var currentRoll = geoLocationData.roll;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, geoLocationData.latitude, geoLocationData.longitude, geoLocationData.elevation,
					geoLocationData.heading, geoLocationData.pitch, currentRoll+increDeg);
				}
			}
		} else if (event.key === "d" || event.key === "D") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined) {
				var geoLocationData = selectedBuilding.geoLocDataManager.geoLocationDataArray[0];
				if(geoLocationData != undefined) {
					if(geoLocationData.roll == undefined) geoLocationData.roll = 0; 
					var currentRoll = geoLocationData.roll;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, geoLocationData.latitude, geoLocationData.longitude, geoLocationData.elevation,
					geoLocationData.heading, geoLocationData.pitch, currentRoll-increDeg);
				}
			}
		}
	}

	// world wind 구현체를 이용
	function drawWorldWind() {
	}

	/**
	 * background provider
	 */
	function backgroundProvider() {
		var provider = new Cesium.WebMapServiceImageryProvider({
			url : MagoConfig.getPolicy().geo_server_url,
			layers : MagoConfig.getPolicy().geo_server_layers,
			parameters : {
				service : MagoConfig.getPolicy().geo_server_parameters_service,
				version : MagoConfig.getPolicy().geo_server_parameters_version,
				request : MagoConfig.getPolicy().geo_server_parameters_request,
				transparent : MagoConfig.getPolicy().geo_server_parameters_transparent,
				//tiled : MagoConfig.getPolicy().backgroundProvider.parameters.tiled,
				format : MagoConfig.getPolicy().geo_server_parameters_format
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
	function initEntity() {
		return viewer.entities.add({
			name : "여의도",
			position: Cesium.Cartesian3.fromDegrees(37.521168, 126.924185, 3000.0),
			box : {
				dimensions : new Cesium.Cartesian3(300000.0*1000.0, 300000.0*1000.0, 300000.0*1000.0), // dimensions : new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
				//material : Cesium.Color.TRANSPARENT
				fill : false,
				material : Cesium.Color.TRANSPARENT,
				outline : true,
				outlineWidth : 3.0,
				outlineColor : Cesium.Color.BLACK
			}
		});
	}

	// terrain 적용 유무를 설정
	function initTerrain() {
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
	function initCamera() {
		viewer.camera.flyTo({
			destination : Cesium.Cartesian3.fromDegrees(parseFloat(MagoConfig.getPolicy().geo_init_longitude),
														parseFloat(MagoConfig.getPolicy().geo_init_latitude),
														parseFloat(MagoConfig.getPolicy().geo_init_height)),
			duration: parseInt(MagoConfig.getPolicy().geo_init_duration)
		});
	}

	// deploy 타입 적용
	function initRenderMode() {
		var api = new API("renderMode");
		api.setRenderMode("1");
		magoManager.callAPI(api);

		if(MagoConfig.getPolicy().geo_time_line_enable == "false") {
			// visible <---> hidden
			$(viewer._animation.container).css("visibility", "hidden");
			$(viewer._timeline.container).css("visibility", "hidden");
			viewer.forceResize();
		}
	}
	
	// pick baseLayer
	function setDefaultDataset() {
		var DEFALUT_IMAGE = "ESRI World Imagery";
		var DEFALUT_TERRAIN = "STK World Terrain meshes";
		
		// search default imageryProvider from baseLayerPicker
		var imageryProvider = null;
		var imageryProviderViewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels; 
		for (var i in imageryProviderViewModels) {
			var provider = imageryProviderViewModels[i];
			if (provider.name == DEFALUT_IMAGE) {
				imageryProvider = provider;
				break;
			}
		}
		if (imageryProvider) viewer.baseLayerPicker.viewModel.selectedImagery = imageryProvider;
	  
		// search default terrainProvider from baseLayerPicker
		var terrainProvider = null;
		var terrainProviderViewModels = viewer.baseLayerPicker.viewModel.terrainProviderViewModels
		for (var i in terrainProviderViewModels) {
			var provider = terrainProviderViewModels[i];
			if (provider.name == DEFALUT_TERRAIN) {
				terrainProvider = provider;
				break;
			}
		}
		if (terrainProvider) viewer.baseLayerPicker.viewModel.selectedTerrain = terrainProvider;
	}
	
	// TODO API 객체를 생성해서 하나의 parameter로 전달하는 방식이 좀 더 깔끔할거 같지만 성능적인 부분에서 조금은 투박할거 같아서 일단 이렇게 처리
	return {
		// api gateway 역할
		callAPI : function(api) {
			var result = magoManager.callAPI(api);
			if(api.getAPIName() === "getLocationAndRotation") {
				return result;
			}
		},
		// 초기화 api
		init : function() {
		},
		// flyTo
		flyTo : function(issueId, issueType, longitude, latitude, height, duration) {
			if(MagoConfig.getPolicy().geo_view_library === Constant.CESIUM) {
				viewer.camera.flyTo({
					destination : Cesium.Cartesian3.fromDegrees(parseFloat(longitude),
																parseFloat(latitude),
																parseFloat(height) + 10),
					duration: parseInt(duration)
				});
			} else {
				wwd.goToAnimator.travelTime = duration * 1000;
				wwd.goTo(new WorldWind.Position(parseFloat(latitude), parseFloat(longitude), parseFloat(height) + 50));
			}
			// pin을 그림
			if(issueId != null || issueType != undefined) {
				var api = new API("drawInsertIssueImage");
				api.setDrawType(0);
				api.setIssueId(issueId);
				api.setIssueId(issueType);
				api.setDataKey(null);
				api.setLatitude(latitude);
				api.setLongitude(longitude);
				api.setElevation(height);
				magoManager.callAPI(api);
			}
		},
		// 블락 및 부재 검색 api
		search : function(blockId) {
		},
		// 블락 및 부재 검색 api
		renderMode : function(renderMode) {
		},
		// 선택 블락 highlighting
		highlighting : function(blockId) {
		},
		// 선택 블락 color 변경
		setColor : function() {
		},
		// 선택 블락 표시
		show : function() {
			draw();
		},
		// 선택 블락 숨기기
		hide : function() {
		},
		// 선택 블락 이동
		move : function() {
		},
		mouseMove : function(eventType) {
			var camera = viewer.camera;
			var canvas = viewer.canvas;
			var ellipsoid = scene.globe.ellipsoid;
			var width = canvas.clientWidth;
	        var height = canvas.clientHeight;

	        // Coordinate (0.0, 0.0) will be where the mouse was clicked.
/*	        var x = (nowMousePosition.x - startMousePosition.x) / width;
	        var y = -(nowMousePosition.y - startMousePosition.y) / height;

	        var lookFactor = 0.05;
	        camera.lookRight(x * lookFactor);
	        camera.lookUp(y * lookFactor);*/

		    // Change movement speed based on the distance of the camera to the surface of the ellipsoid.
		    var cameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
		    var moveRate = (cameraHeight) / 100.0;
		    
		    // 보정을 위한 값
		    var reviseValue = 0;
		    if(parseInt(moveRate) >= 300) reviseValue = parseInt(moveRate) * 50;
		    else if(parseInt(moveRate) >= 20 && parseInt(moveRate) < 300) reviseValue = parseInt(moveRate) * 30;
		    else reviseValue = parseInt(moveRate) * 10;
		    if(reviseValue == 0) reviseValue = 5;
		    
		    console.log("moveRate = " + moveRate + ", reviseValue = " + reviseValue);
		    moveRate = moveRate + reviseValue
		    
		    switch(eventType) {
		    	case "moveForward" : camera.moveForward(moveRate);
		    		break;
		    	case "moveBackward" : camera.moveBackward(moveRate);
	    			break;
		    	case "moveRight" : camera.moveRight(moveRate);
		    		break;
		    	case "moveLeft" : camera.moveLeft(moveRate);
		    		break;
		    	case "moveUp" : camera.moveUp(moveRate);
	    			break;
		    	case "moveDown" : camera.moveDown(moveRate);
	    			break;
		    }
		}
	};
};

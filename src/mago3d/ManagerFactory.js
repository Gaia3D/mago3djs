'use strict';

/**
 * Factory method 패턴을 사용해서 cesium, worldwind 등을 wrapping 해 주는 클래스
 * @class ManagerFactory
 *
 * @param viewer 타 시스템과의 연동의 경우 view 객체가 생성되어서 넘어 오는 경우가 있음
 * @param containerId 뷰에서 표시할 위치 id
 * @param magoConfig mago3d 설정값 json object
 * @param blocksConfig block list 설정값 json object
 * @return api
 */
var ManagerFactory = function(viewer, containerId, magoConfig, blocksConfig) {
	if(!(this instanceof ManagerFactory)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	var magoManager = null;
	var scene = null;

	if(magoConfig.deployConfig === null
			|| magoConfig.deployConfig === ''
			|| magoConfig.deployConfig.viewLibrary === null
			|| magoConfig.deployConfig.viewLibrary === ''
			|| magoConfig.deployConfig.viewLibrary === Constant.CESIUM) {
		// 환경 설정
		MagoConfig.init(magoConfig, blocksConfig);

		if(viewer === null) viewer = new Cesium.Viewer(containerId);
		viewer.scene.magoManager = new CesiumManager();

		// background provider 적용
		if(magoConfig.backgroundProvider.enable) {
			backgroundProvider();
		}
		draw();
		// build을 rendering 할 위치
		initEntity();
		// terrain 적용 여부
		if(magoConfig.geoConfig.initTerrain.enable) {
			initTerrain();
		}
		// 최초 로딩시 카메라 이동 여부
		if(magoConfig.geoConfig.initCamera.enable) {
			initCamera();
		}
		// render Mode 적용
		initRenderMode();
	} else if(magoConfig.deployConfig.viewLibrary === Constant.WORLDWIND) {
		viewer = null;
	}

	// 실제 화면에 object를 rendering 하는 메인 메서드
	function draw() {
		if(MagoConfig.getInformation().deployConfig.viewLibrary === Constant.CESIUM) {
			drawCesium();
		} else if(MagoConfig.getInformation().deployConfig.viewLibrary === Constant.WORLDWIND) {
			//
		}
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

					// distinguish 2 modes.******************************************************
					if(magoManager.magoPolicy.mouseMoveMode == 0) // blocks move.***
					{
						if(magoManager.buildingSelected != undefined) {
							// move the selected object.***
							magoManager.mouse_x = movement.startPosition.x;
							magoManager.mouse_y = movement.startPosition.y;

							// 1rst, check if there are objects to move.***
							if(magoManager.mustCheckIfDragging) {
								if(magoManager.isDragging(magoManager.scene)) {
									magoManager.mouseDragging = true;
									disableCameraMotion(false);
								}
								magoManager.mustCheckIfDragging = false;
							}
						} else {
							magoManager.isCameraMoving = true; // if no object is selected.***
						}
					}
					else if(magoManager.magoPolicy.mouseMoveMode == 1) // objects move.***
					{
						if(magoManager.objectSelected != undefined) {
							// move the selected object.***
							magoManager.mouse_x = movement.startPosition.x;
							magoManager.mouse_y = movement.startPosition.y;

							// 1rst, check if there are objects to move.***
							if(magoManager.mustCheckIfDragging) {
								if(magoManager.isDragging(magoManager.scene)) {
									magoManager.mouseDragging = true;
									disableCameraMotion(false);
								}
								magoManager.mustCheckIfDragging = false;
							}
						} else {
							magoManager.isCameraMoving = true; // if no object is selected.***
						}
					}
					//---------------------------------------------------------------------------------
					magoManager.isCameraMoving = true; // test.***
					if(magoManager.mouseDragging) {
						//magoManager.moveSelectedObject(magoManager.scene, magoManager.currentRenderablesNeoRefListsArray); // original.***
						magoManager.moveSelectedObjectAsimetricMode(magoManager.scene, magoManager.currentRenderablesNeoRefListsArray);
					}
				}
			} else{
				magoManager.mouseDragging = false;
				disableCameraMotion(true);
				if(magoManager.mouseMiddleDown)
				{
					magoManager.isCameraMoving = true;
				}
			}
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
			if(selectedBuilding != undefined)
			{
				if(selectedBuilding.geoLocationDataAux != undefined)
				{
					if(selectedBuilding.geoLocationDataAux.heading == undefined) selectedBuilding.geoLocationDataAux.heading = 0; 
					var currentHeading = selectedBuilding.geoLocationDataAux.heading;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, selectedBuilding.geoLocationDataAux.latitude, selectedBuilding.geoLocationDataAux.longitude, selectedBuilding.geoLocationDataAux.elevation,
					currentHeading+increDeg, selectedBuilding.geoLocationDataAux.pitch, selectedBuilding.geoLocationDataAux.roll);
				}
			}

		}
		else if (event.key === "a" || event.key === "A") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined)
			{
				if(selectedBuilding.geoLocationDataAux != undefined)
				{
					if(selectedBuilding.geoLocationDataAux.heading == undefined) selectedBuilding.geoLocationDataAux.heading = 0; 
					var currentHeading = selectedBuilding.geoLocationDataAux.heading;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, selectedBuilding.geoLocationDataAux.latitude, selectedBuilding.geoLocationDataAux.longitude, selectedBuilding.geoLocationDataAux.elevation,
					currentHeading-increDeg, selectedBuilding.geoLocationDataAux.pitch, selectedBuilding.geoLocationDataAux.roll);
				}
			}

		}
		else if (event.key === "w" || event.key === "W") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined)
			{
				if(selectedBuilding.geoLocationDataAux != undefined)
				{
					if(selectedBuilding.geoLocationDataAux.pitch == undefined) selectedBuilding.geoLocationDataAux.pitch = 0; 
					var currentPitch = selectedBuilding.geoLocationDataAux.pitch;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, selectedBuilding.geoLocationDataAux.latitude, selectedBuilding.geoLocationDataAux.longitude, selectedBuilding.geoLocationDataAux.elevation,
					selectedBuilding.geoLocationDataAux.heading, currentPitch+increDeg, selectedBuilding.geoLocationDataAux.roll);
				}
			}

		}
		else if (event.key === "s" || event.key === "S") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined)
			{
				if(selectedBuilding.geoLocationDataAux != undefined)
				{
					if(selectedBuilding.geoLocationDataAux.pitch == undefined) selectedBuilding.geoLocationDataAux.pitch = 0; 
					var currentPitch = selectedBuilding.geoLocationDataAux.pitch;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, selectedBuilding.geoLocationDataAux.latitude, selectedBuilding.geoLocationDataAux.longitude, selectedBuilding.geoLocationDataAux.elevation,
					selectedBuilding.geoLocationDataAux.heading, currentPitch-increDeg, selectedBuilding.geoLocationDataAux.roll);
				}
			}

		}
		else if (event.key === "e" || event.key === "E") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined)
			{		
				if(selectedBuilding.geoLocationDataAux != undefined)
				{
					if(selectedBuilding.geoLocationDataAux.roll == undefined) selectedBuilding.geoLocationDataAux.roll = 0; 
					var currentRoll = selectedBuilding.geoLocationDataAux.roll;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, selectedBuilding.geoLocationDataAux.latitude, selectedBuilding.geoLocationDataAux.longitude, selectedBuilding.geoLocationDataAux.elevation,
					selectedBuilding.geoLocationDataAux.heading, selectedBuilding.geoLocationDataAux.pitch, currentRoll+increDeg);
				}
			}

		}
		else if (event.key === "d" || event.key === "D") {  // right arrow
			// get current building selected.***
			var selectedBuilding = magoManager.buildingSelected;
			if(selectedBuilding != undefined)
			{
				if(selectedBuilding.geoLocationDataAux != undefined)
				{
					if(selectedBuilding.geoLocationDataAux.roll == undefined) selectedBuilding.geoLocationDataAux.roll = 0; 
					var currentRoll = selectedBuilding.geoLocationDataAux.roll;
					magoManager.changeLocationAndRotation(selectedBuilding.buildingId, selectedBuilding.geoLocationDataAux.latitude, selectedBuilding.geoLocationDataAux.longitude, selectedBuilding.geoLocationDataAux.elevation,
					selectedBuilding.geoLocationDataAux.heading, selectedBuilding.geoLocationDataAux.pitch, currentRoll-increDeg);
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
			url : MagoConfig.getInformation().backgroundProvider.url,
			layers : MagoConfig.getInformation().backgroundProvider.layers,
			parameters : {
				service : MagoConfig.getInformation().backgroundProvider.parameters.service,
				version : MagoConfig.getInformation().backgroundProvider.parameters.version,
				request : MagoConfig.getInformation().backgroundProvider.parameters.request,
				transparent : MagoConfig.getInformation().backgroundProvider.parameters.transparent,
				//tiled : MagoConfig.getInformation().backgroundProvider.parameters.tiled,
				format : MagoConfig.getInformation().backgroundProvider.parameters.format
//				time : MagoConfig.getInformation().backgroundProvider.parameters.time,
//		    	rand : MagoConfig.getInformation().backgroundProvider.parameters.rand,
//		    	asdf : MagoConfig.getInformation().backgroundProvider.parameters.asdf
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
			name : MagoConfig.getInformation().geoConfig.initEntity.name,
			position: Cesium.Cartesian3.fromDegrees(MagoConfig.getInformation().geoConfig.initEntity.longitude,
													MagoConfig.getInformation().geoConfig.initEntity.latitude,
													MagoConfig.getInformation().geoConfig.initEntity.height),
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
		if(MagoConfig.getInformation().geoConfig.initTerrain.enable) {
			var terrainProvider = new Cesium.CesiumTerrainProvider({
				url : MagoConfig.getInformation().geoConfig.initTerrain.url,
				requestWaterMask: MagoConfig.getInformation().geoConfig.initTerrain.requestWaterMask,
				requestVertexNormals: MagoConfig.getInformation().geoConfig.initTerrain.requestVertexNormals
			});
			viewer.terrainProvider = terrainProvider;
		}
	}

	// 최초 로딩시 이동할 카메라 위치
	function initCamera() {
		viewer.camera.flyTo({
			destination : Cesium.Cartesian3.fromDegrees(MagoConfig.getInformation().geoConfig.initCamera.longitude,
														MagoConfig.getInformation().geoConfig.initCamera.latitude,
														MagoConfig.getInformation().geoConfig.initCamera.height),
			duration: MagoConfig.getInformation().geoConfig.initCamera.duration
		});
	}

	// deploy 타입 적용
	function initRenderMode() {
		var api = new API("renderMode");
		api.setRenderMode(MagoConfig.getInformation().renderingConfg.renderMode);
		magoManager.callAPI(api);

		if(!MagoConfig.getInformation().renderingConfg.timelineEnable) {
			// visible <---> hidden
			$(viewer._animation.container).css("visibility", "hidden");
			$(viewer._timeline.container).css("visibility", "hidden");
			viewer.forceResize();
		}
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
		// demo 용
		demo : function(renderMode, json) {
//			MagoConfig.getInformation().demoBlockConfig = json;
//			var api = new API("demo");
//			api.setRenderMode(renderMode);
//			magoManager.callAPI(api);
		}
	};
};

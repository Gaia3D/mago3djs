'use strict';

/**
 * Factory method 패턴을 사용해서 cesium, worldwind 등을 wrapping 해 주는 클래스
 * 
 * @param containerId 뷰에서 표시할 위치 id
 * @param magoConfig mago3d 설정값 json object
 * @return api
 */
var ManagerFactory = function(viewer, containerId, magoConfig) {
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
		MagoConfig.init(magoConfig);
		
		if(viewer === null) viewer = new Cesium.Viewer(containerId);
		viewer.scene.magoManager = new CesiumManager();
		
		draw();
		initEntity();
		initTerrain();
		initCamera();
	} else if(magoConfig.deployConfig.viewLibrary === Constant.WORLDWIND) {
		viewer = null;
	}
	
	function draw() {
		if(MagoConfig.getInformation().deployConfig.viewLibrary === Constant.CESIUM) {
			drawCesium();
		} else if(MagoConfig.getInformation().deployConfig.viewLibrary === Constant.WORLDWIND) {
			//
		}
	}
	
	function drawCesium() {
		
		var gl = viewer.scene.context._gl;
		viewer.scene.magoManager.selection.init(gl, viewer.scene.drawingBufferWidth, viewer.scene.drawingBufferHeight);
		viewer.scene.magoManager.shadersManager.createDefaultShader(gl); 
		viewer.scene.magoManager.postFxShadersManager.createDefaultShaders(gl); 
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
	
	function disableCameraMotion(state){
		viewer.scene.screenSpaceCameraController.enableRotate = state;
		viewer.scene.screenSpaceCameraController.enableZoom = state;
		viewer.scene.screenSpaceCameraController.enableLook = state;
		viewer.scene.screenSpaceCameraController.enableTilt = state;
		viewer.scene.screenSpaceCameraController.enableTranslate = state;
	}
	
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
			magoManager.mouseLeftDown = true;
			
		}, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);


		magoManager.handler.setInputAction(function(movement) {
			if(magoManager.mouseLeftDown) {
				if(movement.startPosition.x != movement.endPosition.x || movement.startPosition.y != movement.endPosition.y) {
					if(magoManager.objectSelected != undefined) {
						// move the selected object.***
						magoManager.mouse_x = movement.startPosition.x;
						magoManager.mouse_y = movement.startPosition.y;
						
						// 1rst, check if there are objects to move.***
						if(magoManager.mustCheckIfDragging) {
							if(magoManager.isDragging(scene)) {
								magoManager.mouseDragging = true;
								disableCameraMotion(false);
							}
							magoManager.mustCheckIfDragging = false;
						}
					} else {
						magoManager.isCameraMoving = true; // if no object is selected.***
					}	
						
					if(magoManager.mouseDragging) {
						magoManager.moveSelectedObject(scene, magoManager.currentRenderablesNeoRefListsArray);
					}
				}
			} else{
				magoManager.mouseDragging = false;
				disableCameraMotion(true);
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
			if(miliSecondsUsed < 500) {
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
			magoManager.mouseLeftDown = false;
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
	
	function drawWorldWind() {
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
	
	function initCamera() {
		viewer.camera.flyTo({
		    destination : Cesium.Cartesian3.fromDegrees(MagoConfig.getInformation().geoConfig.initCamera.longitude, 
														MagoConfig.getInformation().geoConfig.initCamera.latitude, 
														MagoConfig.getInformation().geoConfig.initCamera.height),
		    duration: MagoConfig.getInformation().geoConfig.initCamera.duration
		});
	}
	
	return {
		drawAPI : function() {
			draw();
		},
		highlightAPI : function(type) {
			
		}
	};
};

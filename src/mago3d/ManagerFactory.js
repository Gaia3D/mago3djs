'use strict';

/**
 * Factory method 패턴을 사용해서 cesium, worldwind 등을 wrapping 해 주는 클래스
 * @param productType 화면 3d 표현시 사용할 library name 값
 * @param containerId 뷰에서 표시할 위치 id
 * @return api
 */
var ManagerFactory = function(productType, containerId) {
	if(!(this instanceof ManagerFactory)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	var viewer = null;
	var manager = null;
	var magoManager = null;
	var scene = null;
	if(productType === undefined || productType === null || productType === 'cesium') {
		viewer = new Cesium.Viewer(containerId);
		viewer.scene.magoManager = new CesiumManager();
	} else if(productType === 'worldwind') {
		viewer = null;
	}
	
	function drawCesium() {
		
		var GL = viewer.scene.context._gl;
		viewer.scene.magoManager.selection.init(GL, viewer.scene.drawingBufferWidth, viewer.scene.drawingBufferHeight);
		viewer.scene.magoManager.shadersManager.createDefaultShader(GL); 
		viewer.scene.magoManager.postFxShadersManager.createDefaultShaders(GL); 
		viewer.scene.magoManager.scene = viewer.scene;
		
		// Start postRender version.***********************************************
		magoManager = viewer.scene.magoManager;
		scene = viewer.scene;
		//scene.copyGlobeDepth = true;
		
		viewer.scene.globe.depthTestAgainstTerrain = true;
		
		magoManager.selection.init(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
		magoManager.shadersManager.createDefaultShader(GL); 
		magoManager.postFxShadersManager.createDefaultShaders(GL); 
		
//		var readerWriter = new ReaderWriter();
		
		magoManager.loadData();
		
//		var bRBuildingProjectsList = magoManager.bRBuildingProjectsList;
		var neoBuildingsList = magoManager.neoBuildingsList;
		
		magoManager.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
		addMouseAction();
		
		getEntity()
		viewer.zoomTo(viewer.entities);
	}
	
	// handlers.**************************************************************************
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
			
			var hola = 0;
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

		magoManager.handler.setInputAction(function(movement) {
			if(magoManager.mouseLeftDown) {
				if(movement.startPosition.x != movement.endPosition.x || movement.startPosition.y != movement.endPosition.y) {
					if(magoManager.objectSelected != undefined) {
						// move the selected object.***
						magoManager.mouse_x = movement.startPosition.x;
						magoManager.mouse_y = movement.startPosition.y;
						
						// 1rst, check if there are objects to move.***
						if(magoManager.mustCheckIfDragging) {
							var gl = scene.context._gl;
							if(magoManager.isDragging(gl, scene)) {
								magoManager.mouseDragging = true;
								disableCameraMotion(false);
							}
							magoManager.mustCheckIfDragging = false;
						}
					} else {
						magoManager.isCameraMoving = true; // if no object is selected.***
					}	
						
					if(magoManager.mouseDragging) {
						var gl = scene.context._gl;
						magoManager.moveSelectedObject(gl, scene, magoManager.currentRenderables_neoRefLists_array);
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
					//f4d_topManager.objectSelected = f4d_topManager.getSelectedObjectPicking(gl, scene, f4d_topManager.currentRenderables_neoRefLists_array);
				}
			}
			
			var hola = 0;
	    }, Cesium.ScreenSpaceEventType.LEFT_UP);
	}
	
	function drawWorldWind() {
	}
	
	/**
	 * zoomTo 할 Entity
	 * @returns entities
	 */
	function getEntity() {
		return viewer.entities.add({
			name : 'Blue box',
			position: Cesium.Cartesian3.fromDegrees(126.92734533517019, 37.517207695444, 1500.0),
			box : {
				dimensions : new Cesium.Cartesian3(300000.0, 300000.0, 300000.0), // dimensions : new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
				//material : Cesium.Color.TRANSPARENT
				fill : false,
				outline : true,
				material : Cesium.Color.BLUE 
			}
		});
	}
	
	return {
		draw : function() {
			if(productType === undefined || productType === null || productType === 'cesium') {
				drawCesium();
			} else if(productType === 'worldwind') {
				//
			}
		},
		highlight : function(type) {
			
		}
	};
}

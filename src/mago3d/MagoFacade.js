'use strict';

/**
 * 화면단 UI와 연동 되는 API. APIGateWay 혹은 API 클래스로 클래스명 수정 예정
 * @class MagoFacade
 */

/**
 * mago3d 시작
 * 
 * @param viewer cesium 혹은 world wind view 클래스
 * @param html 내 rendering 할 div id명
 * @return
 */
function magoStart(viewer, renderDivId) {
	getMagoConfig(viewer, renderDivId);
}

/**
 * mago3d 환경 설정을 얻어옴
 * 
 * @param viewer cesium 혹은 world wind view 클래스
 * @param html 내 rendering 할 div id명
 * @return
 */
function getMagoConfig(viewer, renderDivId) {
	$.ajax({
		url: "/sample/database.json",
		type: "GET",
		dataType: "json",
		success: function(magoConfig){
			getBlocksConfig(viewer, renderDivId, magoConfig);
		},
		error: function(e){
			alert(e.responseText);
		}
	});
}
	
/**
 * blocks 정보를 가져옴
 * 
 * @param viewer cesium 혹은 world wind view 클래스
 * @param html 내 rendering 할 div id명
 * @param magoConfig mago 환경 설정 config 파일
 * @return
 */
function getBlocksConfig(viewer, renderDivId, magoConfig) {
	$.ajax({
		url: "/sample/blocks.json",
		type: "GET",
		dataType: "json",
		success: function(blocksConfig){
			managerFactory = new ManagerFactory(viewer, renderDivId, magoConfig, blocksConfig);
		},
		error: function(e){
			alert(e.responseText);
		}
	});
}

/**
 * mago3d 활성화/비활성화
 * 
 * @param isShow true = 활성화, false = 비활성화
 * @return
 */
function changeMagoStateAPI(isShow) {
	var api = new API("changeMagoState");
	api.setMagoEnable(isShow);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * render mode
 * 
 * @param renderMode 0 = 호선, 1 = 지번전개
 * @return
 */
function changeRenderAPI(renderMode) {
	var api = new API("changeRender");
	api.setRenderMode(renderMode);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * outfitting 표시/비표시
 * 
 * @param isShow true = 활성화, false = 비활성화
 * @return
 */
function changeOutFittingAPI(isShow) {
	var api = new API("changeOutFitting");
	api.setShowOutFitting(isShow);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * boundingBox 표시/비표시
 * 
 * @param isShow true = 활성화, false = 비활성화
 * @return
 */
function changeBoundingBoxAPI(isShow) {
	var api = new API("changeBoundingBox");
	api.setShowBoundingBox(isShow);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * 그림자 표시/비표시
 * 
 * @param isShow true = 활성화, false = 비활성화
 * @return
 */
function changeShadowAPI(isShow) {
	var api = new API("changeShadow");
	api.setShowShadow(isShow);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * frustum culling 가시 거리
 * 
 * @param frustumFarDistance frustum 거리. 내부적으로는 입력값의 제곱이 사용됨
 * @return
 */
function changeFrustumFarDistanceAPI(frustumFarDistance) {
	var api = new API("changefrustumFarDistance");
	api.setFrustumFarDistance(frustumFarDistance);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * 블록검색
 * 
 * @param projectId 프로젝트 아이디
 * @param blockType structure, outfitting
 * @param blockId block id
 * @return
 */
function searchBlockAPI(projectId, blockType, blockId) {
	var api = new API("searchBlock");
	api.setProjectId(projectId);
	api.setBlockType(blockType);
	api.setBlockId(blockId);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * highlighting
 * 
 * @param projectId 프로젝트 아이디
 * @param blockIds block id. 복수개의 경우 , 로 입력
 * @param objectIds object id. 복수개의 경우 , 로 입력
 * @return
 */
function changeHighLightingAPI(projectId, blockIds, objectIds) {
	var api = new API("changeHighLighting");
	api.setProjectId(projectId);
	api.setBlockIds(blockIds);
	api.setObjectIds(objectIds);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * color 변경
 * 
 * @param projectId 프로젝트 아이디
 * @param blockIds block id. 복수개의 경우 , 로 입력
 * @param objectIds object id. 복수개의 경우 , 로 입력
 * @param color R, G, B 색깔을 ',' 로 연결한 string 값을 받음.
 * @return
 */
function changeColorAPI(projectId, blockIds, objectIds, color) {
	var api = new API("changeColor");
	api.setProjectId(projectId);
	api.setBlockIds(blockIds);
	api.setObjectIds(objectIds);
	api.setColor(color);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * location and rotation 변경
 * 
 * @param projectId 프로젝트 아이디
 * @param blockId block id
 * @param latitude 위도
 * @param longitude 경도
 * @param elevation 높이
 * @param heading 좌, 우
 * @param pitch 위, 아래
 * @param roll 좌, 우 기울기
 * @return
 */
function changeLocationAndRotationAPI(projectId, blockId, latitude, longitude, elevation, heading, pitch, roll) {
	var api = new API("changeLocationAndRotation");
	api.setProjectId(projectId);
	api.setBlockId(blockId);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(elevation);
	api.setHeading(heading);
	api.setPitch(pitch);
	api.setRoll(roll);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * 블럭의 location and rotation 정보를 취득
 * TODO 기능 정의가 명확히 되지 않아 return 값을 현재의 계층 구조를 임시로 유지
 * 
 * @param projectId 프로젝트 아이디
 * @param blockId block id
 * @return building
 */
function getLocationAndRotationAPI(projectId, blockId) {
	
//	// 호출하는 블럭이 frustum culling 안에 있을 경우.
//	var building = getLocationAndRotationAPI("testId", "F110T");
//	if(building.geoLocationDataAux !== undefined) {
//		console.log("@@@@@@@@@@@@@@@@" + building.geoLocationDataAux.latitude);
//		console.log("@@@@@@@@@@@@@@@@" + building.geoLocationDataAux.longitude);
//		console.log("@@@@@@@@@@@@@@@@" + building.geoLocationDataAux.elevation);
//		console.log("@@@@@@@@@@@@@@@@" + building.geoLocationDataAux.heading);
//		console.log("@@@@@@@@@@@@@@@@" + building.geoLocationDataAux.pitch);
//		console.log("@@@@@@@@@@@@@@@@" + building.geoLocationDataAux.roll);
//	}
	
	var api = new API("getLocationAndRotation");
	api.setProjectId(projectId);
	api.setBlockId(blockId);
	if(managerFactory != null) {
		var building = managerFactory.callAPI(api);
		return building;
	}
}

/**
 * block 이동된 후 location and rotation 알림
 * 
 * @param projectId 프로젝트 아이디
 * @param blockId block id
 * @param objectId object id
 * @param latitude 위도
 * @param longitude 경도
 * @param elevation 높이
 * @param heading 좌, 우
 * @param pitch 위, 아래
 * @param roll 좌, 우 기울기
 * @return
 */
function showLocationAndRotationAPI(projectId, blockId, objectId, latitude, longitude, elevation, heading, pitch, roll) {
	$("#projectId").val(projectId);
	$("#moveBlockId").val(blockId);
	if(objectId !== undefined && objectId !== null) $("#moveObjectId").val(objectId);
	$("#latitude").val(latitude);
	$("#longitude").val(longitude);
	if(elevation === undefined) elevation = 0;
	$("#elevation").val(elevation);
	if(heading === undefined) heading = 0;
	$("#heading").val(heading);
	if(pitch === undefined) pitch = 0;
	$("#pitch").val(pitch);
	if(roll === undefined) roll = 0;
	$("#roll").val(roll);
}

/**
 * 마우스 클릭 객체 이동 대상 변경
 * 
 * @param mouseMoveMode 0 = block, 1 = object
 * @return
 */
function changeMouseMoveAPI(mouseMoveMode) {
	var api = new API("changeMouseMove");
	api.setMouseMoveMode(mouseMoveMode);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

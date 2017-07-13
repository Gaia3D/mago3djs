'use strict';

/**
 * 화면단 UI와 연동 되는 API. APIGateWay 혹은 API 클래스로 클래스명 수정 예정
 * @class MagoFacade
 */

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
 * 데이터 검색
 * 
 * @param dataKey 데이터 고유키
 * @return
 */
function searchDataAPI(dataKey) {
	var api = new API("searchData");
	api.setDataKey(dataKey);
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
 * @param data_key
 * @param latitude 위도
 * @param longitude 경도
 * @param height 높이
 * @param heading 좌, 우
 * @param pitch 위, 아래
 * @param roll 좌, 우 기울기
 * @return
 */
function changeLocationAndRotationAPI(data_key, latitude, longitude, height, heading, pitch, roll) {
	var api = new API("changeLocationAndRotation");
	api.setDataKey(data_key);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
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

/**
 * 이슈 등록 활성화 유무
 * 
 * @param flag true = 활성화, false = 비활성화
 * @return
 */
function changeInsertIssueModeAPI(flag) {
	var api = new API("changeInsertIssueMode");
	api.setIssueInsertEnable(flag);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * object 정보 표시 활성화 유무
 * 
 * @param flag true = 활성화, false = 비활성화
 * @return
 */
function changeObjectInfoViewModeAPI(flag) {
	var api = new API("changeObjectInfoViewMode");
	api.setObjectInfoViewEnable(flag);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * 이슈 목록 활성화 유무
 * 
 * @param flag true = 활성화, false = 비활성화
 * @return
 */
function changeListIssueViewModeAPI(flag) {
	var api = new API("changeListIssueViewMode");
	api.setIssueListEnable(flag);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * pin image를 그림
 * 
 * @param drawType 이미지를 그리는 유형 0 : DB, 1 : 이슈등록
 * @param issue_id 이슈 고유키
 * @param issue_type 이슈 고유키
 * @param data_key 데이터 고유키
 * @param latitude 데이터 고유키
 * @param longitude 데이터 고유키
 * @param height 데이터 고유키
 * @return
 */
function drawInsertIssueImageAPI(drawType, issue_id, issue_type, data_key, latitude, longitude, height) {
	var api = new API("drawInsertIssueImage");
	api.setDrawType(drawType);
	api.setIssueId(issue_id);
	api.setIssueId(issue_type);
	api.setDataKey(data_key);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

/**
 * issue 등록 geo 정보 관련 상태 변경
 * 
 * @param insertIssueState 이슈 등록 좌표 상태
 * @return
 */
function changeInsertIssueStateAPI(insertIssueState) {
	var api = new API("changeInsertIssueState");
	api.setInsertIssueState(insertIssueState);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

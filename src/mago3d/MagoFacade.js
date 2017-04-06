'use strict';

// mago3d 시작
function magoStart(viewer, renderDivId) {
	getMagoConfig(viewer, renderDivId);
}

// mago3d 환경 설정을 얻어옴
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
	
// blocks 정보를 가져옴
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

// render mode 
function changeRenderAPI(renderMode) {
	var api = new API("changeRender");
	api.setRenderMode(renderMode);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// outfitting 표시/비표시
function changeOutFittingAPI(isShow) {
	var api = new API("changeOutFitting");
	api.setShowOutFitting(isShow);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// boundingBox 표시/비표시
function changeBoundingBoxAPI(isShow) {
	var api = new API("changeBoundingBox");
	api.setShowBoundingBox(isShow);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// 그림자 표시/비표시
function changeShadowAPI(isShow) {
	var api = new API("changeShadow");
	api.setShowShadow(isShow);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// frustum culling 가시 거리
function changeFrustumFarDistanceAPI(frustumFarDistance) {
	var api = new API("changefrustumFarDistance");
	api.setFrustumFarDistance(frustumFarDistance);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// 블록 검색 
function searchBlockAPI(projectId, blockType, blockId) {
	var api = new API("searchBlock");
	api.setProjectId(projectId);
	api.setBlockType(blockType);
	api.setBlockId(blockId);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// highlighting
function changeHighLightingAPI(projectId, blockIds, objectIds) {
	var api = new API("changeHighLighting");
	api.setProjectId(projectId);
	api.setBlockIds(blockIds);
	api.setObjectIds(objectIds);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// color
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

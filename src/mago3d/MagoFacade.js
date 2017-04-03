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
function changeOutFittingAPI(mode) {
	var api = new API("changeOutFitting");
	api.setShowOutFitting(mode);
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
function searchBlockAPI(blockType, blockId) {
	var api = new API("searchBlock");
	api.setBlockType(blockType);
	api.setBlockId(blockId);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// highlighting
function changeHighLightingAPI(blockIds) {
	var api = new API("changeHighLighting");
	api.setHighLightedBuildings(blockIds);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

// color
function changeColorAPI(blockIds, color) {
	var api = new API("changeColor");
	api.setColorBuildings(blockIds);
	api.setColor(color);
	if(managerFactory != null) {
		managerFactory.callAPI(api);
	}
}

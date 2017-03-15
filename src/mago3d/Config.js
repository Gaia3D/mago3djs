'use strict';

/**
 * 환경 설정 클래스. json 으로 할까 고민도 했지만 우선은 이 형태로 하기로 함
 */
var MagoConfig = MagoConfig || {};

MagoConfig.getInformation = function() {
	return this.jsonConfig;
};

/**
 * 환경설정 세팅
 * 
 * @param jsonConfig DB에서 가져온 json 포맷 환경 설정
 * @param blocksConfig block list 설정값 json object
 */
MagoConfig.init = function(jsonConfig, blocksConfig) {
	this.jsonConfig = jsonConfig;
	
	// 배포 관련 설정
	MagoConfig.initDeployConfig(jsonConfig);
	// 화면 rendering 관련 설정
	MagoConfig.initRenderingConfig(jsonConfig);
	// 초기화 할 공간 정보 설정
	MagoConfig.initGeoConfig(jsonConfig);
	
	// block 정보 설정
	MagoConfig.initBlocksConfig(blocksConfig);
};

/**
 * 배포관련 환경 설정
 * 
 * @param jsonConfig DB에서 가져온 json 포맷 환경 설정
 */
MagoConfig.initDeployConfig = function(jsonConfig) {
	// 배포 관련 설정
	if(jsonConfig.deployConfig !== null && jsonConfig.deployConfig !== '' ) {
		if(jsonConfig.deployConfig.deployType === undefined 
				|| jsonConfig.deployConfig.deployType === null 
				|| jsonConfig.deployConfig.deployType === '') {
			jsonConfig.deployConfig.deployType = "github";
		}
		if(jsonConfig.deployConfig.viewLibrary === undefined
				|| jsonConfig.deployConfig.viewLibrary === null || jsonConfig.deployConfig.viewLibrary === '') {
			jsonConfig.deployConfig.viewLibrary = Constant.CESIUM;
		}
		if(jsonConfig.deployConfig.dataPath === undefined
				|| jsonConfig.deployConfig.dataPath === null || jsonConfig.deployConfig.dataPath === '') {
			jsonConfig.deployConfig.dataPath = "/data";
		}
	}
	
	this.jsonConfig.deployConfig = jsonConfig.deployConfig;
};

/**
 * 화면 rendering 관련 설정
 * 
 * @param jsonConfig DB에서 가져온 json 포맷 환경 설정
 */
MagoConfig.initRenderingConfig = function(jsonConfig) {
	// 화면 rendering 관련 설정
	if(jsonConfig.renderingConfg !== null && jsonConfig.renderingConfg !== '' ) {
		if(jsonConfig.renderingConfg.cullFaceEnable === undefined
				|| jsonConfig.renderingConfg.cullFaceEnable === null 
				|| jsonConfig.renderingConfg.cullFaceEnable === '' 
				|| jsonConfig.renderingConfg.cullFaceEnable === false
				|| jsonConfig.renderingConfg.cullFaceEnable === 'false') {
			jsonConfig.renderingConfg.cullFaceEnable = false;
		} else {
			jsonConfig.renderingConfg.cullFaceEnable = true;
		}
	}
	
	this.jsonConfig.renderingConfg = jsonConfig.renderingConfg;
};

/**
 * 초기화 할 공간 정보 설정
 * 
 * @param jsonConfig DB에서 가져온 json 포맷 환경 설정
 */
MagoConfig.initGeoConfig = function(jsonConfig) {
	// 초기화 할 공간 정보. github에 공개되어 있는 여의도 sample 자료
	if(jsonConfig.geoConfig !== null && jsonConfig.geoConfig !== '' ) {
		// 최초 로딩시 지도가 표시할 공간 enitity 정보
		if(jsonConfig.geoConfig.initEntity === undefined 
				|| jsonConfig.geoConfig.initEntity === null 
				|| jsonConfig.geoConfig.initEntity === '') {
			
			if(jsonConfig.geoConfig.initEntity.name === undefined 
					|| jsonConfig.geoConfig.initEntity.name === null 
					|| jsonConfig.geoConfig.initEntity.name === '') {
				jsonConfig.geoConfig.initEntity.name = ["여의도"];
			}
			if(jsonConfig.geoConfig.initEntity.longitude === undefined 
					|| jsonConfig.geoConfig.initEntity.longitude === null 
					|| jsonConfig.geoConfig.initEntity.longitude === '') {
				jsonConfig.geoConfig.initEntity.longitude = 126.924185;
			}
			if(jsonConfig.geoConfig.initEntity.latitude === undefined 
					|| jsonConfig.geoConfig.initEntity.latitude === null 
					|| jsonConfig.geoConfig.initEntity.latitude === '') {
				jsonConfig.geoConfig.initEntity.latitude = 37.521168;
			}
			if(jsonConfig.geoConfig.initEntity.height === undefined 
					|| jsonConfig.geoConfig.initEntity.height === null) {
				jsonConfig.geoConfig.initEntity.height = 0;
			}	
		}
		
		// 최초 로딩시 rendering 할 building 정보
		if(jsonConfig.geoConfig.initBuilding === undefined 
				|| jsonConfig.geoConfig.initBuilding === null 
				|| jsonConfig.geoConfig.initBuilding === '') {
			
			if(jsonConfig.geoConfig.initBuilding.latitude === undefined 
					|| jsonConfig.geoConfig.initBuilding.latitude === null 
					|| jsonConfig.geoConfig.initBuilding.latitude.length === 0) {
				jsonConfig.geoConfig.initBuilding.latitude = [ 37.5172076 ];
			}
			if(jsonConfig.geoConfig.initBuilding.longitude === undefined 
					|| jsonConfig.geoConfig.initBuilding.longitude === null 
					|| jsonConfig.geoConfig.initBuilding.longitude.length === 0) {
				jsonConfig.geoConfig.initBuilding.longitude = [ 126.929 ];
			}
			if(jsonConfig.geoConfig.initBuilding.height === undefined 
					|| jsonConfig.geoConfig.initBuilding.height === null 
					|| jsonConfig.geoConfig.initBuilding.height.length === 0) {
				jsonConfig.geoConfig.initBuilding.height = [ 42.9 ];
			}
			if(jsonConfig.geoConfig.initBuilding.buildingFileName === undefined 
					|| jsonConfig.geoConfig.initBuilding.buildingFileName === null 
					|| jsonConfig.geoConfig.initBuilding.buildingFileName.length === 0) {
				jsonConfig.geoConfig.initBuilding.buildingFileName = ["F4D_Duplex_A_20110907_optimized"];
			}
		}
		
		// 화면 rendering 관련 설정
		if(jsonConfig.geoConfig.initTerrain !== null && jsonConfig.geoConfig.initTerrain !== '' ) {
			if(jsonConfig.geoConfig.initTerrain.enable === undefined
					|| jsonConfig.geoConfig.initTerrain.enable === null 
					|| jsonConfig.geoConfig.initTerrain.enable === ''
					|| jsonConfig.geoConfig.initTerrain.enable === true	
					|| jsonConfig.geoConfig.initTerrain.enable === 'true') {
				jsonConfig.geoConfig.initTerrain.enable = true;
			} else {
				jsonConfig.geoConfig.initTerrain.enable = false;
			}
			if(jsonConfig.geoConfig.initTerrain.url === undefined
					|| jsonConfig.geoConfig.initTerrain.url === null 
					|| jsonConfig.geoConfig.initTerrain.url === '') {
				jsonConfig.geoConfig.initTerrain.url = 'https://assets.agi.com/stk-terrain/world';
			}
			if(jsonConfig.geoConfig.initTerrain.requestWaterMask === undefined
					|| jsonConfig.geoConfig.initTerrain.requestWaterMask === null 
					|| jsonConfig.geoConfig.initTerrain.requestWaterMask === ''
					|| jsonConfig.geoConfig.initTerrain.requestWaterMask === true		
					|| jsonConfig.geoConfig.initTerrain.requestWaterMask === 'true') {
				jsonConfig.geoConfig.initTerrain.requestWaterMask = true;
			}
			if(jsonConfig.geoConfig.initTerrain.requestVertexNormals === undefined
					|| jsonConfig.geoConfig.initTerrain.requestVertexNormals === null 
					|| jsonConfig.geoConfig.initTerrain.requestVertexNormals === ''
					|| jsonConfig.geoConfig.initTerrain.requestWaterMask === true		
					|| jsonConfig.geoConfig.initTerrain.requestVertexNormals === 'true') {
				jsonConfig.geoConfig.initTerrain.requestVertexNormals = true;
			}
		}
		
		// 최초 로딩시 camera가 이동할 공간 정보
		if(jsonConfig.geoConfig.initCamera === undefined 
				|| jsonConfig.geoConfig.initCamera === null 
				|| jsonConfig.geoConfig.initCamera === '') {
			
			if(jsonConfig.geoConfig.initCamera.longitude === undefined 
					|| jsonConfig.geoConfig.initCamera.longitude === null 
					|| jsonConfig.geoConfig.initCamera.longitude === '') {
				jsonConfig.geoConfig.initCamera.longitude = 126.924185;
			}
			if(jsonConfig.geoConfig.initCamera.latitude === undefined 
					|| jsonConfig.geoConfig.initCamera.latitude === null 
					|| jsonConfig.geoConfig.initCamera.latitude === '') {
				jsonConfig.geoConfig.initCamera.latitude = 37.521168;
			}
			if(jsonConfig.geoConfig.initCamera.height === undefined 
					|| jsonConfig.geoConfig.initCamera.height === null) {
				jsonConfig.geoConfig.initCamera.height = 0;
			}
			if(jsonConfig.geoConfig.initCamera.duration === undefined 
					|| jsonConfig.geoConfig.initCamera.duration === null) {
				jsonConfig.geoConfig.initCamera.duration = 3;
			}	
		}
	}
	
	this.jsonConfig.geoConfig = jsonConfig.geoConfig;
};

/**
 * block 정보 설정
 * 
 * @param blocksConfig 블락 정보 설정 설정
 */
MagoConfig.initBlocksConfig = function(blocksConfig) {
	if(blocksConfig === null || blocksConfig.blocks === null || blocksConfig.blocks === undefined) return;
	this.jsonConfig.blockConfig = blocksConfig;
};

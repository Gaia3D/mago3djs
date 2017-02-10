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
 */
MagoConfig.init = function(jsonConfig) {
	this.jsonConfig = jsonConfig;
	
	// 배포 관련 설정
	MagoConfig.initDeployConfig(jsonConfig);
	// 화면 rendering 관련 설정
	MagoConfig.initRenderingConfig(jsonConfig);
	// 초기화 할 공간 정보 설정
	MagoConfig.initGeoConfig(jsonConfig);
};

/**
 * 배포관련 환경 설정
 * 
 * @param jsonConfig DB에서 가져온 json 포맷 환경 설정
 */
MagoConfig.initDeployConfig = function(jsonConfig) {
	// 배포 관련 설정
	if(jsonConfig.deployConfig !== null && jsonConfig.deployConfig !== null ) {
		if(jsonConfig.deployConfig.deployType === undefined 
				|| jsonConfig.deployConfig.deployType === null 
				|| jsonConfig.deployConfig.deployType === '') {
			jsonConfig.deployConfig.deployType = "github";
		}
		if(jsonConfig.deployConfig.viewLibrary === undefined
				|| jsonConfig.deployConfig.viewLibrary === null || jsonConfig.deployConfig.viewLibrary === '') {
			jsonConfig.deployConfig.viewLibrary = "cesium";
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
	if(jsonConfig.renderingConfg !== null && jsonConfig.renderingConfg !== null ) {
		if(jsonConfig.renderingConfg.glEnable === undefined
				|| jsonConfig.renderingConfg.glEnable === null 
				|| jsonConfig.renderingConfg.glEnable === '' 
				|| jsonConfig.renderingConfg.glEnable === 'false') {
			jsonConfig.renderingConfg.glEnable = false;
		} else {
			jsonConfig.renderingConfg.glEnable = true;
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
	if(jsonConfig.geoConfig !== null && jsonConfig.geoConfig !== null ) {
		// 최초 로딩시 지도가 표시할 공간 enitity 정보
		if(jsonConfig.geoConfig.initEntity === undefined 
				|| jsonConfig.geoConfig.initEntity === null 
				|| jsonConfig.geoConfig.initEntity === '') {
			
			if(jsonConfig.geoConfig.initEntity.name === undefined 
					|| jsonConfig.geoConfig.initEntity.name === null 
					|| jsonConfig.geoConfig.initEntity.name === '') {
				jsonConfig.geoConfig.initEntity.name = ["여의도"];
			}
			if(jsonConfig.geoConfig.initEntity.longitudeAndLatitude === undefined 
					|| jsonConfig.geoConfig.initEntity.longitudeAndLatitude === null 
					|| jsonConfig.geoConfig.initEntity.longitudeAndLatitude.length === 0) {
				jsonConfig.geoConfig.initEntity.longitudeAndLatitude = [ 128.578740, 34.911826, 128.617838, 34.913655, 128.615028, 34.894553, 128.582938, 34.892353 ];
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
	}
	
	this.jsonConfig.geoConfig = jsonConfig.geoConfig;
};

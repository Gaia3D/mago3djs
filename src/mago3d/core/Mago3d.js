'use strict';
/**
 * Mago3D serverPolicy
 * @typedef {object} Mago3d~serverPolicy
 * @property {string} basicGlobe 필수. javscript 3d Globe. 기본적으로 ‘cesium’을 사용하며 ‘magoworld’ 옵션을 사용 가능. 
 * @property {string} cesiumIonToke optional. Cesium Ion Token 보유 시 사용. 토큰 등록 시에만 Ion 서비스 이용가능.
 * @property {string} terrainType terrain 사용 형태.  cesium-default(기본값) : 실제 지형표현이 없는 구 형태의 globecesium-ion-default : Cesium Ion 기본 terrain. Cesium Ion Token 사용 시에만 사용가능cesium-ion-cdn : Cesium Ion에 등록한 terrain 을 호출하여 사용. terrainValue에 해당 assetId를 설정. Cesium Ion Token 사용 시에만 사용가능cesium-customer : 사용자가 직접 생성한 cesium terrain을 사용 시 설정(예를 들면 ctb를 이용하여 생성한 terrain을 cts를 통해 서비스할 경우). terrainValue에 terrain 서비스 url을 등록.geoserver : geoserverTerrainProvider를 이용하여 터레인을 서비스 할 경우 사용. (비추)
 * @property {string} terrainValue function. get magoManager
 * @property {boolean} online 시스템 사용 환경의 온오프라인 유무. 기본값은 true
 * @property {boolean} geoserverEnable GeoServer 서비스 사용 유무. 기본값은 false
 * @property {boolean} geoserverImageproviderEnable GeoServer 배경 이미지 wms 서비스 사용 유무.
 * @property {string} geoserverImageproviderUrl GeoServer WMS url
 * @property {stringn} geoserverImageproviderLayerName 서비스할 레이어명
 * @property {string} geoserverImageproviderStyleName 적용할 스타일명
 * @property {number} geoserverImageproviderParametersWidth image width
 * @property {number} geoserverImageproviderParametersHeight image height
 * @property {string} geoserverImageproviderParametersFormat image format
 * @property {string} geoserverTerrainproviderLayerName terrainType 이 geoserver일 시, GeoserverTerrainProvider를 통해 terrain으로 서비스할 레이어명
 * @property {string} geoserverTerrainproviderStyleName terrainType 이 geoserver일 시, terrain에 적용할 스타일 명
 * @property {number} geoserverTerrainproviderParametersWidth image width
 * @property {number} geoserverTerrainproviderParametersHeight image height
 * @property {number} geoserverTerrainproviderParametersFormat image format
 * @property {boolean} initCameraEnable globe 시작 시, 시작 위치로 이동 기능 사용 유무. 기본값은 true
 * @property {number} initLatitude 시작 위도
 * @property {number} initLongitude 시작 경도
 * @property {number} initAltitude 시작 고도
 * @property {number} initDuration 시작 위치로 이동하는 시간, 0으로 지정 시 애니메이션 효과 없음.
 * @property {number} lod0 lod0 레벨 표출 거리
 * @property {number} lod1 lod1 레벨 표출 거리
 * @property {number} lod2 lod2 레벨 표출 거리
 * @property {number} lod3 lod3 레벨 표출 거리
 * @property {number} lod4 lod4 레벨 표출 거리
 * @property {number} lod5 lod5 레벨 표출 거리
 */

/**
 * callback parameter info 
 * @typedef {object} Mago3d~callback
 * @property {function()} loadstart Optional. when mago3d load start trigger. return magostate.
 * @property {function(Mago3d~returnObj)} loadend Optional. when mago3d load end trigger. return magostate.
 */

/**
 * Mago3D return object
 * @typedef {object} Mago3d~returnObj
 * @property {function()} callAPI function. 
 * @property {function()} getViewer function. get this map viewr. Cesium.Viewer or Mago3d.MagoWorld
 * @property {function()} getMagoManagerState function. get magoManager starte
 * @property {function()} getMagoManager function. get magoManager
 * @property {function(string)} setBaseUrl function. set F4d Date base url.
 */

/**
 * This is mago3d entrypoint.
 * @class Mago3d
 * 
 * @param {Stirng} containerId container div id. required.
 * @param {Mago3d~serverPolicy} serverPolicy mage3d geopolicy
 * @param {Mago3d~callback} callback loadstart callback, loadend callback.
 * @param {object} options viewer parameter.
 * @param {Cesium.Viewer} legacyViewer 타 시스템과의 연동의 경우 view 객체가 생성되어서 넘어 오는 경우가 있음
 * 
 * @see {@link http://localhost/sample/map.html}
 * 
 * @return {Mago3d~returnObj} 
 */
var Mago3d = function(containerId, serverPolicy, callback, options, legacyViewer) 
{
	if (!(this instanceof Mago3d)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	if (!containerId || !document.getElementById(containerId)) 
	{
		throw new Error('containerId is required.');
	}
	Emitter.call(this);

	var viewer = null;
	var magoManager = null;

	if (callback) 
	{
		if (callback.loadstart && typeof callback.loadstart === "function") 
		{
			this.on('loadstart', callback.loadstart);
		}
		
		if (callback.loadend && typeof callback.loadend === "function") 
		{
			this.on('loadend', callback.loadend);
		}
	}

	var magoManagerState = CODE.magoManagerState.INIT;
	//this.emit('loadstart', this);

	serverPolicy = validPolicy(serverPolicy);
	options = validOption(options, serverPolicy.basicGlobe);
	var viewerInitializer;

	if (serverPolicy.basicGlobe === Constant.CESIUM) 
	{
		viewerInitializer = new CesiumViewerInit(containerId, serverPolicy, options, legacyViewer);
	}
	else 
	{
		viewerInitializer = new MagoEarthViewerInit(containerId, serverPolicy, options);
	}

	viewer = viewerInitializer.viewer;
	magoManager = viewerInitializer.magoManager;
	//magoManager.magoPolicy.imagePath = imagePath;

	var returnObj = {
		// api gateway 역할
		callAPI: function(api) 
		{
		    if (api.getReturnable()) 
			{
		        return magoManager.callAPI(api);
			}
			else 
			{
				magoManager.callAPI(api);
			}
		},
		getViewer: function()
		{
			return viewer;
		},
		getMagoManagerState: function() 
		{
			return magoManagerState;
		},
		getMagoManager: function() 
		{
			return magoManager;
		},
		setBaseUrl: function(baseUrl) 
		{
			if (!magoManager) 
			{
				throw new Error('Mago3d is no ready');
			}
			magoManager.readerWriter.geometryDataPath = baseUrl;
		},
		getF4dController: function()
		{
			return magoManager.f4dController;
		}
	};

	magoManagerState = CODE.magoManagerState.READY;
	//init position
	viewerInitializer.initPosition();
	viewerInitializer.setEventHandler();

	this.emit('loadend', returnObj);

	return returnObj;

	function validPolicy(policy) 
	{
		var defaultPolicy = {};
		defaultPolicy.basicGlobe = Constant.CESIUM;
		defaultPolicy.online = true;
		defaultPolicy.lod0 = 30;
		defaultPolicy.lod1 = 60;
		defaultPolicy.lod2 = 90;
		defaultPolicy.lod3 = 200;
		defaultPolicy.lod4 = 1000;
		defaultPolicy.lod5 = 50000;
		defaultPolicy.ssaoRadius = 0.15;
		defaultPolicy.initDefaultFov = 1;
		defaultPolicy.maxPartitionsLod0 = 4;
		defaultPolicy.maxPartitionsLod1 = 2;
		defaultPolicy.maxPartitionsLod2OrLess = 1;
		defaultPolicy.maxRatioPointsDist0m = 1.0;
		defaultPolicy.maxRatioPointsDist100m = 3.0;
		defaultPolicy.maxRatioPointsDist200m = 10.0;
		defaultPolicy.maxRatioPointsDist400m = 20.0;
		defaultPolicy.maxRatioPointsDist800m = 40.0;
		defaultPolicy.maxRatioPointsDist1600m = 80.0;
		defaultPolicy.maxRatioPointsDistOver1600m = 160.0;
		defaultPolicy.maxPointSizeForPc = 40.0;
		defaultPolicy.minPointSizeForPc = 3.0;
		defaultPolicy.pendentPointSizeForPc = 60.0;
		defaultPolicy.minHeight_rainbow_loc = 0.0;
		defaultPolicy.maxHeight_rainbow_loc = 100.0;

		return Object.assign({}, defaultPolicy, policy||{});
	}

	function validOption(opt, gType)
	{
		opt = opt ? opt : {};

		var option = {};
		if ( gType === Constant.CESIUM)
		{
			option.infoBox = false;
			option.navigationHelpButton = false;
			option.selectionIndicator = false;
			option.homeButton = false;
			option.fullscreenButton = false;
			option.geocoder = false;
			option.baseLayerPicker = false;
			option.sceneModePicker = false;
		} 

		option.defaultControl = {};

		option.defaultControl.zoom = true;
		option.defaultControl.initCamera = true;
		option.defaultControl.fullScreen = true;
		option.defaultControl.measure = true;
		option.defaultControl.tools = true;
		option.defaultControl.attribution = true;
		option.defaultControl.overviewMap = true;
		
		var defControl = Object.assign({}, option.defaultControl, opt.defaultControl||{});
		opt.defaultControl = defControl;
		
		return Object.assign({}, option, opt||{});
	}
};
Mago3d.prototype = Object.create(Emitter.prototype);
Mago3d.prototype.constructor = Mago3d;

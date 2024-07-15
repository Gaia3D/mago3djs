'use strict';

/**
 * This is mago3d entrypoint.
 * @class Mago3d
 * 
 * @param {Stirng} containerId container div id. required.
 * @param {object} serverPolicy mage3d geopolicy
 * @param {Mago3d~callback} callback loadstart callback, loadend callback.
 * @param {object} options viewer parameter.
 * @param {Cesium.Viewer} legacyViewer 타 시스템과의 연동의 경우 view 객체가 생성되어서 넘어 오는 경우가 있음
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

	serverPolicy = validPolicy(serverPolicy);
	options = validOption(options, serverPolicy.basicGlobe);

	var viewerInitializer = new CesiumViewerInit(containerId, serverPolicy, options, legacyViewer);
	viewer = viewerInitializer.viewer;
	magoManager = viewerInitializer.magoManager;

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
		if (gType === Constant.CESIUM)
		{
			option.infoBox = false;
			option.navigationHelpButton = false;
			option.selectionIndicator = false;
			option.homeButton = false;
			option.fullscreenButton = false;
			option.geocoder = false;
			option.baseLayerPicker = false;
			option.sceneModePicker = false;
			option.animation = false;
			option.timeline = false;
			option.baseLayerPicker = false;
			option.geocoder = false;
			option.geocoder = Cesium.SceneMode.SCENE3D;
		}
		return Object.assign({}, option, opt||{});
	}
};
Mago3d.prototype = Object.create(Emitter.prototype);
Mago3d.prototype.constructor = Mago3d;

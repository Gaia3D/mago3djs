'use strict';
/**
 * Mago3D return object
 * @property {object} callAPI function. 
 * @property {object} getViewer function. get this map viewr. Cesium.Viewer or Mago3d.MagoWorld
 * @property {object} getMagoManagerState function. get magoManager starte
 * @property {object} getMagoManager function. get magoManager
 * @property {object} setBaseUrl function. set F4d Date base url.
 */

/**
 * callback parameter info 
 * @property {object} loadstart Optional. when mago3d load start trigger. return magostate.
 * @property {object} loadend Optional. when mago3d load end trigger. return magostate.
 */

/**
 * This is mago3d entrypoint.
 * @class Mago3D
 * 
 * @param {Stirng} containerId container div id. required.
 * @param {object} serverPolicy mage3d geopolicy
 * @param {object} callback loadstart callback, loadend callback.
 * @param {object} options Cesium viewer parameter.
 * @param {Cesium.Viewer} legacyViewer 타 시스템과의 연동의 경우 view 객체가 생성되어서 넘어 오는 경우가 있음
 * 
 * @return {object} 
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

	var viewerInitializer;

	if (serverPolicy.basicGlobe === Constant.CESIUM) 
	{
		viewerInitializer = new CesiumViewerInit(containerId, serverPolicy, options, legacyViewer);
	}
	else 
	{
		viewerInitializer = new MagoEarthViewerInit(containerId, serverPolicy);
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
};
Mago3d.prototype = Object.create(Emitter.prototype);
Mago3d.prototype.constructor = Mago3d;

'use strict';

var ViewerInit = function(containerId, serverPolicy) 
{

	if (!containerId || !document.getElementById(containerId)) 
	{
		throw new Error('containerId is required.');
	}
	var magoConfig = new MagoConfig();
	magoConfig.init(serverPolicy, null, null);

	this.config = magoConfig;
	this.targetId = containerId;
	this.magoManager;
	this.viewer;
	this.policy = magoConfig.getPolicy();
	

	magoConfig.setContainerId(this.targetId);
	this.init();
	this.createElement();
};

ViewerInit.prototype.init = function() 
{
	return abstract();
};

ViewerInit.prototype.initMagoManager = function() 
{
	return abstract();
};

ViewerInit.prototype.setEventHandler = function() 
{
	return abstract();
};

ViewerInit.prototype.initPosition = function()
{
	if (this.policy.initCameraEnable) 
	{ 
		var lon = parseFloat(this.policy.initLongitude);
		var lat = parseFloat(this.policy.initLatitude);
		var height = parseFloat(this.policy.initAltitude);
		var duration = parseInt(this.policy.initDuration);

		if (isNaN(lon) || isNaN(lat) || isNaN(height)) 
		{
			throw new Error('Longitude, Latitude, Height must number type.');
		}

		if (isNaN(duration)) { duration = 3; }
		this.magoManager.flyTo(lon, lat, height, duration);
	}
};

ViewerInit.prototype.createElement = function()
{
	var viewElement = this.magoManager.isCesiumGlobe() ? document.getElementsByClassName('cesium-viewer')[0] : document.getElementById(this.targetId);

	this.magoManager.overlayContainer = document.createElement('div');
	this.magoManager.overlayContainer.style.position = 'absolute';
	this.magoManager.overlayContainer.style.zIndex = '0';
	this.magoManager.overlayContainer.style.width = '100%';
	this.magoManager.overlayContainer.style.height = '100%';
	this.magoManager.overlayContainer.style.top = '0px';
	this.magoManager.overlayContainer.style.pointerEvents = 'none';
	this.magoManager.overlayContainer.className = 'mago3d-overlayContainer';

	this.magoManager.defaultControlContainer = document.createElement('div');
	this.magoManager.defaultControlContainer.style.position = 'absolute';
	this.magoManager.defaultControlContainer.style.right = '0px';
	this.magoManager.defaultControlContainer.style.width = '320px';
	this.magoManager.defaultControlContainer.style.height = '100%';
	this.magoManager.defaultControlContainer.style.float = 'right';
	this.magoManager.defaultControlContainer.className = 'mago3d-overlayContainer-defaultControl';

	this.magoManager.defaultContentContainer = document.createElement('div');
	this.magoManager.defaultContentContainer.style.position = 'absolute';
	this.magoManager.defaultContentContainer.style.right = '-320px';
	this.magoManager.defaultContentContainer.style.width = '320px';
	//advanceToolDiv.style.height = 'calc(100% - 30px)';
	this.magoManager.defaultContentContainer.style.height = '100%';
	this.magoManager.defaultContentContainer.style.float = 'right';
	//advanceToolDiv.style.marginTop = '15px';
	this.magoManager.defaultContentContainer.style.border = '2px solid rgb(204, 229, 236)';
	this.magoManager.defaultContentContainer.style.borderRadius = '4px';
	this.magoManager.defaultContentContainer.style.backgroundColor = '#EAEAEA';
	this.magoManager.defaultContentContainer.style.pointerEvents = 'auto';
	this.magoManager.defaultContentContainer.style.display = 'none';
	this.magoManager.defaultContentContainer.className = 'mago3d-overlayContainer-defaultContent';

	this.magoManager.overlayContainer.appendChild(this.magoManager.defaultControlContainer);
	this.magoManager.overlayContainer.appendChild(this.magoManager.defaultContentContainer);
	viewElement.appendChild(this.magoManager.overlayContainer);

	var defaultControl = this.options.defaultControl;

	if (defaultControl.zoom)
	{
		this.magoManager.controls.add(new Zoom());
	}
	if (defaultControl.initCamera)
	{
		this.magoManager.controls.add(new InitCamera());
	}

	if (defaultControl.fullScreen)
	{
		this.magoManager.controls.add(new FullScreen());
	}

	if (defaultControl.measure)
	{
		this.magoManager.controls.add(new Measure());
	}

	if (defaultControl.tools)
	{
		this.magoManager.controls.add(new Tools());
	}

	if (defaultControl.attribution)
	{
		this.magoManager.controls.add(new Attribution());
	}

	if (defaultControl.overviewMap)
	{
		this.magoManager.controls.add(new OverviewMap());
	}

	/*if(defaultControl.compass)
	{
		this.magoManager.controls.add(new Compass());
	}
*/
};
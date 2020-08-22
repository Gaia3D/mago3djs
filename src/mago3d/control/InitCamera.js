'use strict';
/**
 * 줌 컨트롤
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class InitCamera
 * @param {InitCamera~Options} options position info. coordinate. required.
 *  
 * @extends AbsControl
 * 
 */
var InitCamera = function(options) 
{
	if (!(this instanceof InitCamera)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	var element = document.createElement('div');
	options = options ? options : {};
	options.element = element;
    
	AbsControl.call(this, options);
    
	element.style.position = 'absolute';
	element.style.pointerEvents = 'auto';
	element.style.backgroundColor = 'rgba(255,255,255,0.4)';
	element.style.borderRadius = '4px';
	element.style.padding = '2px';
	element.style.top = '1.0em';
	element.style.right = '.5em';

	var that = this;
	var homeButton = document.createElement('button');
	homeButton.setAttribute('type', 'button');
	homeButton.title = 'init position';

	var imageSpan = document.createElement('span');
	imageSpan.appendChild(document.createTextNode('\uD83C\uDFE0'));
	imageSpan.style.verticalAlign = 'text-top';
	imageSpan.style.lineHeight = '0.6em';
	homeButton.appendChild(imageSpan);

	homeButton.appendChild(document.createElement('br'));

	var textSpan = document.createElement('span');
	textSpan.appendChild(document.createTextNode('처음으로'));
	textSpan.style.fontSize = '10px';
	textSpan.style.verticalAlign = 'baseline';
	textSpan.style.lineHeight = '0.6em';
	homeButton.appendChild(textSpan);
	
	this.setBtnStyle(homeButton);
	homeButton.style.backgroundColor = 'rgba(217, 217, 217, 0.8)';
    
	homeButton.addEventListener(
		'click',
		that.handleClick.bind(that),
		false
	);

	this.element.appendChild(homeButton);
};

InitCamera.prototype = Object.create(AbsControl.prototype);
InitCamera.prototype.constructor = InitCamera;

InitCamera.prototype.handleClick = function()
{
	if (this.magoManager.isCesiumGlobe())
	{
		var config = this.magoManager.configInformation;
		if (config.initCameraEnable)
		{
			var lon = parseFloat(config.initLongitude);
			var lat = parseFloat(config.initLatitude);
			var height = parseFloat(config.initAltitude);
			var duration = parseInt(config.initDuration);

			if (isNaN(lon) || isNaN(lat) || isNaN(height)) 
			{
				throw new Error('Longitude, Latitude, Height must number type.');
			}

			if (isNaN(duration)) { duration = 3; }
			this.magoManager.flyTo(lon, lat, height, duration);
		}
	}
};
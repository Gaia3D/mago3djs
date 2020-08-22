'use strict';
/**
 * 줌 컨트롤
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class Zoom
 * @param {Zoom~Options} options position info. coordinate. required.
 *  
 * @extends AbsControl
 * 
 */
var Zoom = function(options) 
{
	if (!(this instanceof Zoom)) 
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
	element.style.bottom = '0.5em';
	element.style.right = '9.5em';

	var that = this;
	var upButton = document.createElement('button');
	upButton.setAttribute('type', 'button');
	upButton.title = 'zoom in';
	
	var imageSpan = document.createElement('span');
	imageSpan.appendChild(document.createTextNode('+'));
	imageSpan.style.verticalAlign = 'super';
	imageSpan.style.lineHeight = '0.6em';
	upButton.appendChild(imageSpan);

	/*upButton.appendChild(document.createElement('br'));

	var textSpan = document.createElement('span');
	textSpan.appendChild(document.createTextNode('줌인'));
	textSpan.style.fontSize = '10px';
	textSpan.style.verticalAlign = 'baseline';
	textSpan.style.lineHeight = '0.6em';
	upButton.appendChild(textSpan);*/
    
	this.setBtnStyle(upButton);
	upButton.style.width='25px';
	upButton.style.height='25px';
	upButton.style.display='inline-block';
	upButton.addEventListener(
		'click',
		that.handleClick.bind(that, 1),
		false
	);

	var downButton = document.createElement('button');
	downButton.setAttribute('type', 'button');
	downButton.title = 'zoom out';

	var downImageSpan = document.createElement('span');
	downImageSpan.appendChild(document.createTextNode('\u2212'));
	downImageSpan.style.verticalAlign = 'super';
	downImageSpan.style.lineHeight = '0.6em';
	downButton.appendChild(downImageSpan);

	/*downButton.appendChild(document.createElement('br'));

	var downTextSpan = document.createElement('span');
	downTextSpan.appendChild(document.createTextNode('줌아웃'));
	downTextSpan.style.fontSize = '10px';
	downTextSpan.style.verticalAlign = 'baseline';
	downTextSpan.style.lineHeight = '0.6em';
	downButton.appendChild(downTextSpan);*/

	this.setBtnStyle(downButton);
	downButton.style.width='25px';
	downButton.style.height='25px';
	downButton.style.display='inline-block';
	downButton.addEventListener(
		'click',
		that.handleClick.bind(that, 0),
		false
	);

	this.element.appendChild(upButton);
	this.element.appendChild(downButton);
};

Zoom.prototype = Object.create(AbsControl.prototype);
Zoom.prototype.constructor = Zoom;

Zoom.prototype.handleClick = function(type)
{
	if (this.magoManager.isCesiumGlobe())
	{
		var scene = this.magoManager.scene;
		var camera = scene.camera;
        
		var cartographicPosition = Cesium.Cartographic.fromCartesian(camera.position);
		var alt = cartographicPosition.height;
		if (type)
		{
			scene.camera.zoomIn(alt * 0.1);
		}
		else
		{
			scene.camera.zoomOut(alt * 0.1);
		}
	}
};
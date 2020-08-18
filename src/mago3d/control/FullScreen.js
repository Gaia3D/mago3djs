'use strict';
/**
 * 줌 컨트롤
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class FullScreen
 * @param {FullScreen~Options} options position info. coordinate. required.
 *  
 * @extends AbsControl
 * 
 */
var FullScreen = function(options) 
{
	if (!(this instanceof FullScreen)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	var element = document.createElement('div');
	options = options ? options : {};
	options.element = element;
    
	AbsControl.call(this, options);
    
	var that = this;
	this.full = false;

	element.style.position = 'absolute';
	element.style.pointerEvents = 'auto';
	element.style.backgroundColor = 'rgba(255,255,255,0.4)';
	element.style.borderRadius = '4px';
	element.style.padding = '2px';
	element.style.top = '8.5em';
	element.style.right = '.5em';

	var fullButton = document.createElement('button');
	fullButton.setAttribute('type', 'button');
	fullButton.title = 'Full Screen';
    
	var imageSpan = document.createElement('span');
	imageSpan.appendChild(document.createTextNode('\u21C5'));
	imageSpan.style.transform = 'rotate(0.1turn)';
	imageSpan.style.display = 'inline-block';
	imageSpan.style.verticalAlign = 'super';
	imageSpan.style.lineHeight = '0.6em';
	fullButton.appendChild(imageSpan);

	fullButton.appendChild(document.createElement('br'));

	var textSpan = document.createElement('span');
	textSpan.appendChild(document.createTextNode('전체화면'));
	textSpan.style.fontSize = '12px';
	textSpan.style.verticalAlign = 'baseline';
	textSpan.style.lineHeight = '0.6em';
	fullButton.appendChild(textSpan);

	this.setBtnStyle(fullButton);
	
	fullButton.addEventListener(
		'click',
		that.handleClick.bind(that),
		false
	);
    
	this.fullButtonElement = fullButton;
    
	var cancleButton = document.createElement('button');
	cancleButton.setAttribute('type', 'button');
	cancleButton.title = 'Cancle Full Screen';

	var cancleImageSpan = document.createElement('span');
	cancleImageSpan.appendChild(document.createTextNode('\u2716'));
	cancleImageSpan.style.verticalAlign = 'super';
	cancleImageSpan.style.lineHeight = '0.6em';
	cancleButton.appendChild(cancleImageSpan);

	cancleButton.appendChild(document.createElement('br'));

	var cancleTextSpan = document.createElement('span');
	cancleTextSpan.appendChild(document.createTextNode('취소'));
	cancleTextSpan.style.fontSize = '12px';
	cancleTextSpan.style.verticalAlign = 'baseline';
	cancleTextSpan.style.lineHeight = '0.6em';
	cancleButton.appendChild(cancleTextSpan);

	this.setBtnStyle(cancleButton);
	cancleButton.style.display = 'none';
    
	cancleButton.addEventListener(
		'click',
		that.handleClick.bind(that),
		false
	);
    
	this.cancleButtonElement = cancleButton;

	this.element.appendChild(fullButton);
	this.element.appendChild(cancleButton);
};

FullScreen.prototype = Object.create(AbsControl.prototype);
FullScreen.prototype.constructor = FullScreen;

FullScreen.prototype.handleClick = function()
{
	var target = document.getElementById(MagoConfig.getContainerId());
	if (this.full)
	{
		if (isFullScreen())
		{
			this.fullButtonElement.style.display = 'block';
			this.cancleButtonElement.style.display = 'none';
			exitFullScreen();

			this.full = false;
		}
	}
	else 
	{
		if (isFullScreenSupported())
		{
			this.fullButtonElement.style.display = 'none';
			this.cancleButtonElement.style.display = 'block';
			requestFullScreen(target);

			this.full = true;
		}
	}
    
	function isFullScreenSupported() 
	{
		var body = document.body;
		return !!(
			body.webkitRequestFullscreen ||
          (body.msRequestFullscreen && document.msFullscreenEnabled) ||
          (body.requestFullscreen && document.fullscreenEnabled)
		);
	}
    
	function isFullScreen() 
	{
		return !!(
			document.webkitIsFullScreen ||
          document.msFullscreenElement ||
          document.fullscreenElement
		);
	}

	function requestFullScreen(element) 
	{
		if (element.requestFullscreen) 
		{
			element.requestFullscreen();
		}
		else if (element.msRequestFullscreen) 
		{
			element.msRequestFullscreen();
		}
		else if (element.webkitRequestFullscreen) 
		{
			element.webkitRequestFullscreen();
		}
	}

	function exitFullScreen() 
	{
		if (document.exitFullscreen) 
		{
			document.exitFullscreen();
		}
		else if (document.msExitFullscreen) 
		{
			document.msExitFullscreen();
		}
		else if (document.webkitExitFullscreen) 
		{
			document.webkitExitFullscreen();
		}
	}
};
'use strict';
/**
 * 줌 컨트롤
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class Measure
 * @param {Measure~Options} options position info. coordinate. required.
 *  
 * @extends AbsControl
 * 
 */
var Measure = function(options) 
{
	if (!(this instanceof Measure)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	var element = document.createElement('div');
	options = options ? options : {};
	options.element = element;
    
	AbsControl.call(this, options);

	this.buttons = {};

	element.style.position = 'absolute';
	element.style.pointerEvents = 'auto';
	element.style.backgroundColor = 'rgba(255,255,255,0.4)';
	element.style.borderRadius = '4px';
	element.style.padding = '2px';
	element.style.top = '20.0em';
	element.style.right = '.5em';


	setButton(this, 'length', '\uD83D\uDCCF', 'Measure Length', '거리측정');
	setButton(this, 'area', '\u26F6', 'Measure Area', '면적측정');
	setButton(this, 'height', '\u2BB8', 'Measure Height', '높이측정');

	function setButton(thisArg, type, text, title, description)
	{
		var button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.title = title;

		var imageSpan = document.createElement('span');
		imageSpan.appendChild(document.createTextNode(text));
		imageSpan.style.verticalAlign = 'super';
		imageSpan.style.lineHeight = '0.6em';
		button.appendChild(imageSpan);

		button.appendChild(document.createElement('br'));

		var textSpan = document.createElement('span');
		textSpan.appendChild(document.createTextNode(description));
		textSpan.style.fontSize = '12px';
		textSpan.style.verticalAlign = 'baseline';
		textSpan.style.lineHeight = '0.6em';
		button.appendChild(textSpan);

		thisArg.setBtnStyle(button);
		button.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
		
		thisArg.buttons[type] = {
			status  : false,
			element : button
		};
		thisArg.element.appendChild(button);
        
		button.addEventListener(
			'click',
			thisArg.handleClick.bind(thisArg, type),
			false
		);
	}
};

Measure.prototype = Object.create(AbsControl.prototype);
Measure.prototype.constructor = Measure;

Measure.prototype.handleClick = function(e)
{
	if (this.buttons[e].status)
	{
		var button = this.buttons[e];
		button.status = false;
		button.element.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
	}
	else 
	{
		for (var buttonName in this.buttons)
		{
			if (this.buttons.hasOwnProperty(buttonName))
			{
				var button = this.buttons[buttonName];
				if (buttonName === e)
				{
					button.element.style.backgroundColor = 'rgba(148,216,246, 0.8)';
					button.status = true;
				}
				else 
				{
					button.element.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
					button.status = false;
				}
			}
		}
		alert('기능 준비중');
	}
};
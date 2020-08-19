'use strict';
/**
 * 줌 컨트롤
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class Compass
 * @param {Compass~Options} options position info. coordinate. required.
 *  
 * @extends AbsControl
 * 
 */
var Compass = function(options) 
{
	if (!(this instanceof Compass)) 
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
	element.style.top = '24.0em';
	element.style.right = '.5em';

	var that = this;
	var homeButton = document.createElement('button');
	homeButton.setAttribute('type', 'button');
	homeButton.title = 'init position';
	homeButton.appendChild(document.createTextNode('\uD83E\uDDED'));

	this.setBtnStyle(homeButton);
	homeButton.style.backgroundColor = 'rgba(217, 217, 217, 0.8)';

	this.element.appendChild(homeButton);
};

Compass.prototype = Object.create(AbsControl.prototype);
Compass.prototype.constructor = Compass;
'use strict';

/**
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class AbsControl. abstract class
 * @constructor
 * @abstract
 * 
 * @param {object} options
 */
var AbsControl = function(options) 
{
	if (!(this instanceof AbsControl)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	var element = options.element;
	if (element && !options.target && !element.style.pointerEvents) 
	{
		element.style.pointerEvents = 'auto';
	}

	this.element = element ? element : undefined;
	this.target = options.target ? options.target : undefined;
	this.magoManager;
};

AbsControl.prototype.setControl = function(magoManager)
{
	this.magoManager = magoManager;

	var target = this.target ? this.target : this.magoManager.defaultControlContainer;
	target.appendChild(this.element);
};

/**
 * button element set basic style 
 * @param {HTMLElement} element 
 */
AbsControl.prototype.setBtnStyle = function(element)
{
	element.style.display = 'block';
	element.style.margin = '1px';
	element.style.padding = 0;
	element.style.color = 'white';
	element.style.fontSize = '1.14em';
	element.style.fontWeight = 'bold';
	element.style.textDecoration = 'none';
	element.style.textAlign = 'center';
	element.style.height = '50px';
	element.style.width = '50px';
	element.style.lineHeight = '.4em';
	element.style.border = 'none';
	element.style.backgroundColor = 'rgba(148,216,246, 0.8)';
    
	element.addEventListener(
		'mouseenter',
		function()
		{
			element.style.filter = 'invert(30%)';
		},
		false
	);
    
	element.addEventListener(
		'mouseleave',
		function()
		{
			element.style.filter = 'none';
		},
		false
	);
};

/**
 * button element set basic style 
 * @param {HTMLElement} element 
 */
AbsControl.prototype.setTextBtn = function(element)
{
	element.style.display = 'inline-block';
	element.style.margin = '1px';
	element.style.padding = 0;
	element.style.color = 'white';
	element.style.fontSize = '.84em';
	element.style.fontWeight = 'bold';
	element.style.textDecoration = 'none';
	element.style.textAlign = 'center';
	element.style.height = '1.75em';
	element.style.width = '4.675em';
	element.style.lineHeight = '.4em';
	element.style.border = 'none';
	element.style.backgroundColor = 'rgba(148,216,246, 0.8)';
};
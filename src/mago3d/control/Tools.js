'use strict';
/**
 * 줌 컨트롤
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class Tools
 * @param {Tools~Options} options position info. coordinate. required.
 *  
 * @extends AbsControl
 * 
 */
var Tools = function(options) 
{
	if (!(this instanceof Tools)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	var element = document.createElement('div');
	options = options ? options : {};
	options.element = element;
    
	AbsControl.call(this, options);

	this.tools = {};

	element.style.position = 'absolute';
	element.style.pointerEvents = 'auto';
	element.style.backgroundColor = 'rgba(255,255,255,0.4)';
	element.style.borderRadius = '4px';
	element.style.padding = '2px';
	element.style.top = '30.0em';
	element.style.right = '.5em';
    
	element.addEventListener(
		'mouseover',
		this.handleMouseOver.bind(this),
		false
	);

	element.addEventListener(
		'mouseout',
		this.handleMouseOut.bind(this),
		false
	);
    
	var button = document.createElement('button');
	button.setAttribute('type', 'button');
	button.title = 'Tool Box';

	var imageSpan = document.createElement('span');
	imageSpan.appendChild(document.createTextNode('\u2699'));
	imageSpan.style.verticalAlign = 'super';
	imageSpan.style.lineHeight = '0.6em';
	button.appendChild(imageSpan);

	button.appendChild(document.createElement('br'));

	var textSpan = document.createElement('span');
	textSpan.appendChild(document.createTextNode('설정'));
	textSpan.style.fontSize = '12px';
	textSpan.style.verticalAlign = 'baseline';
	textSpan.style.lineHeight = '0.6em';
	button.appendChild(textSpan);

	this.setBtnStyle(button);
	
	element.appendChild(button);
    
	var toolsDiv = document.createElement('div');
	toolsDiv.style.position = 'absolute';
	toolsDiv.style.pointerEvents = 'auto';
	toolsDiv.style.backgroundColor = 'rgba(255,255,255,0.4)';
	toolsDiv.style.borderRadius = '4px';
	toolsDiv.style.padding = '2px';
	toolsDiv.style.top = '0';
	toolsDiv.style.right = '53px';
	toolsDiv.style.display = 'none';
	toolsDiv.style.width = '195px';
	toolsDiv.style.lineHeight = '1.0em';
    
	this.toolsDiv = toolsDiv;
	element.appendChild(toolsDiv);

	var toggleBbox = document.createElement('button');
	toggleBbox.setAttribute('type', 'button');
	toggleBbox.dataset.type= 'bbox';
	toggleBbox.dataset.status= 'off';
	toggleBbox.title = 'BoundingBox Toggle';
	toggleBbox.appendChild(document.createTextNode('BBOX'));
	this.setTextBtn(toggleBbox, 'bbox');
	toggleBbox.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
    
	this.tools.bbox = {
		runType : 'toggle',
		element : toggleBbox,
		action  : function(value) 
		{
			this.magoManager.magoPolicy.setShowBoundingBox(value);
		}
	};
	toolsDiv.appendChild(toggleBbox);

	var toggleLabel = document.createElement('button');
	toggleLabel.setAttribute('type', 'button');
	toggleLabel.dataset.type=  'label';
	toggleLabel.dataset.status= 'off';
	toggleLabel.title = 'Label Toggle';
	toggleLabel.appendChild(document.createTextNode('Label'));
	this.setTextBtn(toggleLabel, 'label');
	toggleLabel.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
	this.tools.label = {
		runType : 'toggle',
		element : toggleLabel,
		action  : function(value) 
		{
			this.magoManager.magoPolicy.setShowLabelInfo(value);
		
			// clear the text canvas.
			var canvas = document.getElementById("objectLabel");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		}
	};
	toolsDiv.appendChild(toggleLabel);

	var toggleOrigin = document.createElement('button');
	toggleOrigin.setAttribute('type', 'button');
	toggleOrigin.dataset.type=  'origin';
	toggleOrigin.dataset.status= 'off';
	toggleOrigin.title = 'Origin Toggle';
	toggleOrigin.appendChild(document.createTextNode('Origin'));
	this.setTextBtn(toggleOrigin, 'origin');
	toggleOrigin.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
	this.tools.origin = {
		runType : 'toggle',
		element : toggleOrigin,
		action  : function(value) 
		{
			this.magoManager.magoPolicy.setShowOrigin(value);
		}
	};
	toolsDiv.appendChild(toggleOrigin);
    
	var toggleShadow = document.createElement('button');
	toggleShadow.setAttribute('type', 'button');
	toggleShadow.dataset.type=  'shadow';
	toggleShadow.dataset.status= 'off';
	toggleShadow.title = 'Shadow Toggle';
	toggleShadow.appendChild(document.createTextNode('Shadow'));
	this.setTextBtn(toggleShadow, 'shadow');
	toggleShadow.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
	toolsDiv.appendChild(toggleShadow);
	this.tools.shadow = {
		runType : 'toggle',
		element : toggleShadow,
		action  : function(value) 
		{
			this.magoManager.sceneState.setApplySunShadows(value);
		}
	};

	var buttons = toolsDiv.getElementsByTagName('button');
	for (var i=0, len = buttons.length;i<len;i++)
	{
		var btn = buttons.item(i);
		var btnType = btn.dataset.type;
		var tool = this.tools[btnType];

		btn.addEventListener(
			'click',
			this.handleToolClick.bind(this, tool),
			false
		);
        
		btn.addEventListener(
			'mouseenter',
			function(e)
			{
				e.target.style.backgroundColor = 'rgba(148,216,246, 0.8)';
			},
			false
		);
        
		btn.addEventListener(
			'mouseleave',
			function(e)
			{
				if (e.target.dataset.status !== 'on')
				{
					e.target.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
				}
			},
			false
		);
	}
};

Tools.prototype = Object.create(AbsControl.prototype);
Tools.prototype.constructor = Tools;

Tools.prototype.handleMouseOver = function()
{
	this.toolsDiv.style.display = 'block';
};

Tools.prototype.handleMouseOut = function()
{
	this.toolsDiv.style.display = 'none';
};

Tools.prototype.handleToolClick = function(tool)
{
	if (tool.runType === 'toggle')
	{
		var element = tool.element;
		element.dataset.status = (element.dataset.status === 'on') ? 'off' : 'on';

		var status = element.dataset.status;
		var boolStatus = (status === 'on') ? true : false;
        
		tool.action.call(this, boolStatus);
		if (boolStatus)
		{
			tool.element.style.backgroundColor = 'rgba(148,216,246, 0.8)';
		}
		else 
		{
			tool.element.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
		}
	}
};

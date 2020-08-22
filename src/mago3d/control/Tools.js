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
	element.style.top = '7.5em';
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

	var that = this;
	element.addEventListener('click',
		function() 
		{
			var mainContainer = document.getElementById(MagoConfig.getContainerId()).getElementsByClassName('mago3d-overlayContainer-defaultContent').item(0);
			var thisContainer = mainContainer.getElementsByClassName('mago3d-tools-advance').item(0);
			var on = element.className.indexOf('on') >= 0;
			if (!on)
			{
				that.target.style.right = '320px';
				mainContainer.style.display = 'block';
				mainContainer.style.right = '0px';
				var toolsDivs = mainContainer.getElementsByClassName('mago3d-tools-div');
				for (var i =0, len=toolsDivs.length;i<len;i++)
				{
					var toolDiv = toolsDivs.item(i);
					toolDiv.style.display = 'none';
				}
				thisContainer.style.display = 'block';
				element.className = 'on';
				element.getElementsByTagName('button')[0].style.backgroundColor = 'rgba(148,216,246, 0.8)';
			}
			else 
			{
				thisContainer.style.display = 'none';
				that.target.style.right = '0px';
				mainContainer.style.display = 'none';
				mainContainer.style.right = '0px';
				element.className = '';
				element.getElementsByTagName('button')[0].style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
			}
		}
		, false);
    
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
	textSpan.style.fontSize = '10px';
	textSpan.style.verticalAlign = 'baseline';
	textSpan.style.lineHeight = '0.6em';
	button.appendChild(textSpan);

	this.setBtnStyle(button);
	button.style.backgroundColor = 'rgba(217, 217, 217, 0.8)';
	element.appendChild(button);

	//옆으로 나오는 div 주석처리
	/*
	var toolsDiv = document.createElement('div');
	toolsDiv.style.position = 'absolute';
	toolsDiv.style.pointerEvents = 'auto';
	//toolsDiv.style.backgroundColor = 'rgba(255,255,255,0.4)';
	toolsDiv.style.backgroundColor = 'rgba(255,255,255,1)';
	toolsDiv.style.borderRadius = '4px';
	toolsDiv.style.padding = '2px';
	//toolsDiv.style.top = '0';
	toolsDiv.style.top = '50px';
	//toolsDiv.style.right = '48px';
	toolsDiv.style.right = '1px';
	toolsDiv.style.display = 'none';
	//toolsDiv.style.width = '195px';
	toolsDiv.style.width = '319px';
	toolsDiv.style.lineHeight = '1.0em';
    
	this.toolsDiv = toolsDiv;
	element.appendChild(toolsDiv);
	*/

	var toggleBbox = document.createElement('button');
	toggleBbox.setAttribute('type', 'button');
	toggleBbox.dataset.type= 'bbox';
	toggleBbox.dataset.status= 'off';
	toggleBbox.title = 'BoundingBox Toggle';
	toggleBbox.appendChild(document.createTextNode('BBOX'));
	this.setTextBtn(toggleBbox, 'bbox');
	toggleBbox.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
    
	this.tools.bbox = {
		runType : 'toggle',
		element : toggleBbox,
		action  : function(value) 
		{
			this.magoManager.magoPolicy.setShowBoundingBox(value);
		}
	};

	//toolsDiv.appendChild(toggleBbox);

	var toggleLabel = document.createElement('button');
	toggleLabel.setAttribute('type', 'button');
	toggleLabel.dataset.type=  'label';
	toggleLabel.dataset.status= 'off';
	toggleLabel.title = 'Label Toggle';
	toggleLabel.appendChild(document.createTextNode('Label'));
	this.setTextBtn(toggleLabel, 'label');
	toggleLabel.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';

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
	//toolsDiv.appendChild(toggleLabel);

	var toggleOrigin = document.createElement('button');
	toggleOrigin.setAttribute('type', 'button');
	toggleOrigin.dataset.type=  'origin';
	toggleOrigin.dataset.status= 'off';
	toggleOrigin.title = 'Origin Toggle';
	toggleOrigin.appendChild(document.createTextNode('Origin'));
	this.setTextBtn(toggleOrigin, 'origin');
	toggleOrigin.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';

	this.tools.origin = {
		runType : 'toggle',
		element : toggleOrigin,
		action  : function(value) 
		{
			this.magoManager.magoPolicy.setShowOrigin(value);
		}
	};
	//toolsDiv.appendChild(toggleOrigin);
    
	var toggleShadow = document.createElement('button');
	toggleShadow.setAttribute('type', 'button');
	toggleShadow.dataset.type=  'shadow';
	toggleShadow.dataset.status= 'off';
	toggleShadow.title = 'Shadow Toggle';
	toggleShadow.appendChild(document.createTextNode('Shadow'));
	this.setTextBtn(toggleShadow, 'shadow');
	toggleShadow.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';

	this.tools.shadow = {
		runType : 'toggle',
		element : toggleShadow,
		action  : function(value) 
		{
			this.magoManager.sceneState.setApplySunShadows(value);
		}
	};
	//toolsDiv.appendChild(toggleShadow);

	/*
	var toggleAdvance = document.createElement('button');
	toggleAdvance.setAttribute('type', 'button');
	toggleAdvance.dataset.type=  'advance';
	toggleAdvance.dataset.status= 'off';
	toggleAdvance.title = 'Advance Toggle';
	toggleAdvance.appendChild(document.createTextNode('Advance'));
	this.setTextBtn(toggleAdvance, 'advance');
	toggleAdvance.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
	toolsDiv.appendChild(toggleAdvance);
	this.tools.advance = {
		runType : 'toggle',
		element : toggleAdvance,
		action  : function(value) 
		{
			//mago3d-overlayContainer-defaultContent
			var mainContainer = document.getElementById(MagoConfig.getContainerId()).getElementsByClassName('mago3d-overlayContainer-defaultContent').item(0);
			var thisContainer = mainContainer.getElementsByClassName('mago3d-tools-advance').item(0);
			if (value === true)
			{
				this.target.style.right = '220px';
				mainContainer.style.display = 'block';
				mainContainer.style.right = '0px';
				var toolsDivs = mainContainer.getElementsByClassName('mago3d-tools-div');
				for (var i =0, len=toolsDivs.length;i<len;i++)
				{
					var toolDiv = toolsDivs.item(i);
					toolDiv.style.display = 'none';
				}
				thisContainer.style.display = 'block';
			}
			else 
			{
				thisContainer.style.display = 'none';
				this.target.style.right = '0px';
				mainContainer.style.display = 'none';
				mainContainer.style.right = '0px';
			}
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
					e.target.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
				}
			},
			false
		);
	}
	*/
};

Tools.prototype = Object.create(AbsControl.prototype);
Tools.prototype.constructor = Tools;

Tools.prototype.setControl = function(magoManager)
{
	this.magoManager = magoManager;

	var target = this.target ? this.target : this.magoManager.defaultControlContainer;
	target.appendChild(this.element);
	this.target = target;

	var advanceToolDiv = document.createElement('div');
	advanceToolDiv.style.position = 'absolute';
	advanceToolDiv.style.float = 'right';
	advanceToolDiv.style.width = '100%';
	advanceToolDiv.style.backgroundColor = '#FFFFFF';
	advanceToolDiv.style.pointerEvents = 'auto';
	advanceToolDiv.style.display = 'none';
	advanceToolDiv.className = 'mago3d-tools-div mago3d-tools-advance';

	this.magoManager.defaultContentContainer.appendChild(advanceToolDiv);

	var basicSettingsDiv = getGroupDiv('기본 설정');
	var basicSettingBtnDiv = document.createElement('div');
	basicSettingBtnDiv.style.marginTop = '5px';
	basicSettingsDiv.appendChild(basicSettingBtnDiv);

	var that = this;
	var bboxBtnObj = getBasicButtonObject('bbox', 'BoundingBox Toggle', 'BBOX', 'toggle', function(value) 
	{
		that.magoManager.magoPolicy.setShowBoundingBox(value);
	});
	var labelBtnObj = getBasicButtonObject('label', 'Label Toggle', 'LABEL', 'toggle', function(value) 
	{
		that.magoManager.magoPolicy.setShowLabelInfo(value);
	
		// clear the text canvas.
		var canvas = document.getElementById("objectLabel");
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	});
	var originBtnObj = getBasicButtonObject('orgin', 'Origin Toggle', 'ORIGIN', 'toggle', function(value) 
	{
		that.magoManager.magoPolicy.setShowOrigin(value);
	});
	var shadowBtnObj = getBasicButtonObject('shadow', 'Shadow Toggle', 'SHADOW', 'toggle', function(value) 
	{
		that.magoManager.sceneState.setApplySunShadows(value);
	});

	basicSettingBtnDiv.appendChild(bboxBtnObj.element);
	basicSettingBtnDiv.appendChild(labelBtnObj.element);
	basicSettingBtnDiv.appendChild(originBtnObj.element);
	basicSettingBtnDiv.appendChild(shadowBtnObj.element);

	basicSettingsDiv.appendChild(getTitleDiv('SSAO', 'adjust'));
	var ssaoContentDuv = getContentDiv([
		{
			id      : 'ssaoRadius',
			label   : '그림자 반경',
			type    : 'text',
			default : '0.15',
			unit    : 'M'
		}
	]);
	basicSettingsDiv.appendChild(ssaoContentDuv);
	advanceToolDiv.appendChild(basicSettingsDiv);

	function getBasicButtonObject (type, title, text, runtype, action)
	{
		var btn = document.createElement('button');
		btn.setAttribute('type', 'button');
		btn.dataset.type=  type;
		btn.dataset.status= 'off';
		btn.title = title;
		btn.appendChild(document.createTextNode(text));
		
		btn.style.display = 'inline-block';
		btn.style.margin = '1px 1px 1px 5px';
		btn.style.padding = '0';
		btn.style.color = 'rgb(136, 136, 136)';
		btn.style.fontWeight = 'bold';
		btn.style.height = '33px';
		btn.style.width = '66px';
		btn.style.backgroundColor = '#f3f3f3';
		btn.style.borderRadius = '12px';
		btn.style.borderStyle = 'none';
		
		return {
			rutnType : runtype,
			element  : btn,
			action   : action
		};
	}

	function getGroupDiv(category)
	{
		var div = document.createElement('div');
		div.style.padding = '5px 10px';
		div.style.margin = '0 0 20px 0';
		div.style.border = '1px solid #ccc';
		div.style.outline = '0px';
		div.style.verticalAlign = 'top';
		div.style.fontSize = '12PX';
		div.style.fontWeight = 'bold';
		div.style.color = '#888';

		var strong = document.createElement('strong');
		strong.style.display = 'block';
		strong.style.padding = '10px 6px';
		strong.style.borderBottom = '1px solid #e2e2e2';
		strong.appendChild(document.createTextNode(category));
		div.appendChild(strong);

		return div;
	}

	function getTitleDiv(title, funcType)
	{
		var div = document.createElement('div');
		div.style.padding = '0px';
		div.style.margin = '0px';
		div.style.outline = '0px';
		div.style.verticalAlign = 'top';
		div.style.width = '100%';
		div.style.height = '100%';
		div.style.marginBottom = '10px !important';
		
		var h3 = document.createElement('h3');
		h3.style.paddingLeft = '2px';
		h3.style.fontSize = '12px';
		h3.style.display = 'inline-block';
		h3.appendChild(document.createTextNode("\u25AA" + title));
		div.appendChild(h3);

		if (funcType === 'adjust')
		{
			var btn = document.createElement('button');
			btn.setAttribute('type', 'button');
			btn.style.float = 'right';
			btn.style.display = 'inline-block';
			btn.style.verticalAlign = 'middle';
			btn.style.padding = '2px 10px';
			btn.style.fontSize = '10px';
			btn.style.color = '#FFFFFF';
			btn.style.borerRadius = '2px';
			btn.style.borer = '1px solid #727272';
			btn.style.backgroundColor = '#636363';
			btn.appendChild(document.createTextNode('적용'));
			div.appendChild(btn);

			btn.addEventListener(
				'mouseenter',
				function()
				{
					btn.style.color = '#477cdb';
					btn.style.border = '1px solid #477cdb';
					btn.style.backgroundColor = '#fff';
				},
				false
			);
			
			btn.addEventListener(
				'mouseleave',
				function()
				{
					btn.style.color = '#FFFFFF';
					btn.style.border = '1px solid #727272';
					btn.style.backgroundColor = '#636363';
				},
				false
			);
		}
		return div;
	}

	/**
	 * 
	 * @typedef {ContentOption}
	 * @property {string} id
	 * @property {string} label
	 * @property {string} type
	 * @property {string} default
	 * @property {string} unit
	 */
	/**
	 * 
	 * @param {Array<ContentOption>} options 
	 */
	function getContentDiv(options)
	{
		var div = document.createElement('div');
		div.style.padding = '0px';
		div.style.margin = '0px';
		div.style.outline = '0px';
		div.style.verticalAlign = 'top';

		for (var i=0, len=options.length;i<len;i++)
		{
			var o = options[i];
			var oDiv = document.createElement('div');
			oDiv.style.padding = '4px';
			oDiv.style.margin = '0 0 4px 0';
			oDiv.style.outline = '0px';
			oDiv.style.verticalAlign = 'top';
			oDiv.style.backgroundColor = '#f3f3f3';

			var oLabel = document.createElement('label');
			oLabel.style.width = '36%';
			oLabel.style.padding = '2px';
			oLabel.style.verticalAlign = 'middle';
			oLabel.style.display = 'inline-block';
			oLabel.style.textAlign = 'justify';
			oLabel.style.fontSize = '11px';
			oLabel.setAttribute('for', o.id);
			oLabel.appendChild(document.createTextNode(o.label));
			oDiv.appendChild(oLabel);

			if (o.type === 'text')
			{
				var oInput = document.createElement('input');
				oInput.style.width = '45%';
				oInput.style.marginRight = '5px';
				oInput.style.padding = '5px';
				oInput.style.fontSize = 'small';
				oInput.style.verticalAlign = 'middle';
				oInput.style.lineHeight = '1.5em';
				oInput.style.color = '#444';
				oInput.setAttribute('id', o.id);
				oInput.setAttribute('name', o.id);
				oInput.setAttribute('type', o.type);
				oInput.setAttribute('value', o.default);
				oDiv.appendChild(oInput);
			}

			oDiv.appendChild(document.createTextNode(o.unit));
			div.appendChild(oDiv);
		}

		return div;
	}
};

Tools.prototype.handleMouseOver = function()
{
	this.element.getElementsByTagName('button')[0].style.backgroundColor = 'rgba(148,216,246, 0.8)';
};

Tools.prototype.handleMouseOut = function()
{
	if (this.element.className !== 'on')
	{
		this.element.getElementsByTagName('button')[0].style.backgroundColor = 'rgba(217, 217, 217, 0.8)';
	}
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

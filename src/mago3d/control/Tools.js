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
			var mainContainer = document.getElementById(that.magoManager.config.getContainerId()).getElementsByClassName('mago3d-overlayContainer-defaultContent').item(0);
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
	advanceToolDiv.appendChild(basicSettingsDiv);

	var basicSettingBtnDiv = document.createElement('div');
	basicSettingBtnDiv.style.marginTop = '5px';
	basicSettingsDiv.appendChild(basicSettingBtnDiv);

	var that = this;
	var basicBtns = [];
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

	basicBtns.push(bboxBtnObj);
	basicBtns.push(labelBtnObj);
	basicBtns.push(originBtnObj);
	basicBtns.push(shadowBtnObj);

	for(var i=0,btnLength=basicBtns.length;i<btnLength;i++)
	{
		var basicBtn = basicBtns[i];
		var elem = basicBtn.element;
		basicSettingBtnDiv.appendChild(elem);

		elem.addEventListener(
			'click',
			that.handleToolClick.bind(this, basicBtn),
			false
		);
	}

	var basicSettingInputDiv = document.createElement('div');
	basicSettingInputDiv.style.padding = '0 5px 0 0';
	basicSettingInputDiv.style.margin = '5px 5px 0 5px';
	basicSettingsDiv.appendChild(basicSettingInputDiv);

	var ssaoDiv = document.createElement('div'); 
	ssaoDiv.style.padding = '4px';
	ssaoDiv.style.margin = '10px 0px 4px';
	ssaoDiv.style.outline = '0px 0px 4px';
	ssaoDiv.style.verticalAlign = 'top';
	ssaoDiv.style.backgroundColor = 'rgb(243,243,243)';
	ssaoDiv.style.borderRadius = '12px';
	ssaoDiv.style.borderStyle = 'none';
	ssaoDiv.className = 'mago3d-tools-ssao-div';
	basicSettingInputDiv.appendChild(ssaoDiv);

	var ssaoLabel = document.createElement('label');
	ssaoLabel.style.width = '25%';
	ssaoLabel.style.padding = '2px';
	ssaoLabel.style.verticalAlign = 'middle';
	ssaoLabel.style.display = 'inline-block';
	ssaoLabel.style.textAlign = 'justify';
	ssaoLabel.style.fontSize = '13.33333px';
	ssaoLabel.setAttribute('for', 'ssaoRadius');
	ssaoLabel.appendChild(document.createTextNode('SSAO'));
	ssaoDiv.appendChild(ssaoLabel);

	var ssaoInput = document.createElement('input');
	ssaoInput.style.width = '45%';
	ssaoInput.style.marginRight = '5px';
	ssaoInput.style.padding = '5px';
	ssaoInput.style.fontSize = 'small';
	ssaoInput.style.verticalAlign = 'middle';
	ssaoInput.style.lineHeight = '1.5em';
	ssaoInput.style.color = '#444';
	ssaoInput.setAttribute('id', 'ssaoRadius');
	ssaoInput.setAttribute('name', 'ssaoRadius');
	ssaoInput.setAttribute('type', 'text');
	ssaoInput.setAttribute('value', this.magoManager.configInformation.ssaoRadius);
	ssaoDiv.appendChild(ssaoInput);

	var ssaoBtn = document.createElement('button');
	ssaoBtn.setAttribute('type', 'button');
	ssaoBtn.style.display = 'inline-block';
	ssaoBtn.style.verticalAlign = 'middle';
	ssaoBtn.style.padding = '2px 10px';
	ssaoBtn.style.fontSize = '12px';
	ssaoBtn.style.color = '#FFFFFF';
	ssaoBtn.style.borderRadius = '12px';
	ssaoBtn.style.borderStyle = 'none';
	ssaoBtn.style.backgroundColor = '#636363';
	ssaoBtn.appendChild(document.createTextNode('적용'));
	ssaoBtn.addEventListener(
		'click',
		function() {
			var ssao = ssaoInput.value;
			if(isNaN(ssao)) {
				alert('숫자만 입력 가능합니다.');
				return;
			} 
			magoManager.magoPolicy.setSsaoRadius(ssao);
			magoManager.sceneState.ssaoRadius[0] = Number(ssao);
		},
		false
	);
	ssaoDiv.appendChild(ssaoBtn); 
	
	var lodDiv = document.createElement('div'); 
	lodDiv.style.padding = '4px';
	lodDiv.style.margin = '10px 0px 4px';
	lodDiv.style.outline = '0px 0px 4px';
	lodDiv.style.verticalAlign = 'top';
	lodDiv.style.backgroundColor = 'rgb(243,243,243)';
	lodDiv.style.borderRadius = '12px';
	lodDiv.style.borderStyle = 'none';
	lodDiv.className = 'mago3d-tools-lod-div';
	basicSettingInputDiv.appendChild(lodDiv);

	var lodh3 = document.createElement('h3');
	lodh3.style.fontSize = '15px';
	lodh3.appendChild(document.createTextNode('Level of Detail'));
	lodDiv.appendChild(lodh3);
	
	for(var i=0;i<6;i++)
	{
		var id = 'geoLod' + i;
		var name = 'lod' + i;

		var lodLabel = document.createElement('label');
		lodLabel.style.width = '25%';
		lodLabel.style.padding = '2px';
		lodLabel.style.verticalAlign = 'middle';
		lodLabel.style.display = 'inline-block';
		lodLabel.style.textAlign = 'justify';
		lodLabel.style.fontSize = '13.33333px';
		lodLabel.setAttribute('for', id);
		lodLabel.appendChild(document.createTextNode(name.toUpperCase()));
		lodDiv.appendChild(lodLabel);

		var lodInput = document.createElement('input');
		lodInput.style.width = '45%';
		lodInput.style.marginRight = '5px';
		lodInput.style.padding = '5px';
		lodInput.style.fontSize = 'small';
		lodInput.style.verticalAlign = 'middle';
		lodInput.style.lineHeight = '1.5em';
		lodInput.style.color = '#444';
		lodInput.setAttribute('id', id);
		lodInput.setAttribute('name', name);
		lodInput.setAttribute('type', 'text');
		lodInput.setAttribute('value', this.magoManager.configInformation[name]);
		lodDiv.appendChild(lodInput);
	}

	var lodBtn = document.createElement('button');
	lodBtn.setAttribute('type', 'button');
	lodBtn.style.display = 'inline-block';
	lodBtn.style.verticalAlign = 'middle';
	lodBtn.style.padding = '2px 10px';
	lodBtn.style.fontSize = '12px';
	lodBtn.style.color = '#FFFFFF';
	lodBtn.style.borderRadius = '12px';
	lodBtn.style.borderStyle = 'none';
	lodBtn.style.backgroundColor = '#636363';
	lodBtn.appendChild(document.createTextNode('적용'));
	lodBtn.addEventListener(
		'click',
		function() {
			var lod0 = document.getElementById('geoLod0').value;
			var lod1 = document.getElementById('geoLod1').value;
			var lod2 = document.getElementById('geoLod2').value;
			var lod3 = document.getElementById('geoLod3').value;
			var lod4 = document.getElementById('geoLod4').value;
			var lod5 = document.getElementById('geoLod5').value;
			if(isNaN(lod0) || isNaN(lod1) || isNaN(lod2)|| isNaN(lod3) || isNaN(lod4) || isNaN(lod5)) {
				alert('숫자만 입력 가능합니다.');
				return;
			}

			if (lod0 !== null && lod0 !== "") { magoManager.magoPolicy.setLod0DistInMeters(lod0); }
			if (lod1 !== null && lod1 !== "") { magoManager.magoPolicy.setLod1DistInMeters(lod1); }
			if (lod2 !== null && lod2 !== "") { magoManager.magoPolicy.setLod2DistInMeters(lod2); }
			if (lod3 !== null && lod3 !== "") { magoManager.magoPolicy.setLod3DistInMeters(lod3); }
			if (lod4 !== null && lod4 !== "") { magoManager.magoPolicy.setLod4DistInMeters(lod4); }
			if (lod5 !== null && lod5 !== "") { magoManager.magoPolicy.setLod5DistInMeters(lod5); }
		},
		false
	);
	lodDiv.appendChild(lodBtn); 

	var dataDiv = getGroupDiv('데이터 선택');
	advanceToolDiv.appendChild(dataDiv);

	var dataControlDiv = document.createElement('div'); 
	dataControlDiv.style.padding = '4px';
	dataControlDiv.style.margin = '10px 0px 4px';
	dataControlDiv.style.outline = '0px 0px 4px';
	dataControlDiv.style.verticalAlign = 'top';
	dataControlDiv.style.backgroundColor = 'rgb(243,243,243)';
	dataControlDiv.style.borderRadius = '12px';
	dataControlDiv.style.borderStyle = 'none';
	dataControlDiv.className = 'mago3d-tools-data-div';
	dataDiv.appendChild(dataControlDiv);

	var allText = document.createElement('strong');
	allText.style.width = '25%';
	allText.style.padding = '2px';
	allText.style.verticalAlign = 'middle';
	allText.style.display = 'inline-block';
	allText.style.textAlign = 'justify';
	allText.style.fontSize = '13.33333px';
	allText.appendChild(document.createTextNode('전체'));
	dataControlDiv.appendChild(allText);

	var allSelectBtn = document.createElement('button');
	allSelectBtn.setAttribute('type', 'button');
	allSelectBtn.style.display = 'inline-block';
	allSelectBtn.style.verticalAlign = 'middle';
	allSelectBtn.style.padding = '2px 10px';
	allSelectBtn.style.fontSize = '12px';
	allSelectBtn.style.color = '#FFFFFF';
	allSelectBtn.style.borderRadius = '12px';
	allSelectBtn.style.borderStyle = 'none';
	allSelectBtn.style.backgroundColor = '#636363';
	allSelectBtn.appendChild(document.createTextNode('선택'));
	dataControlDiv.appendChild(allSelectBtn);

	var allMoveBtn = document.createElement('button');
	allMoveBtn.setAttribute('type', 'button');
	allMoveBtn.style.display = 'inline-block';
	allMoveBtn.style.verticalAlign = 'middle';
	allMoveBtn.style.marginLeft = '5px';
	allMoveBtn.style.padding = '2px 10px';
	allMoveBtn.style.fontSize = '12px';
	allMoveBtn.style.color = '#FFFFFF';
	allMoveBtn.style.borderRadius = '12px';
	allMoveBtn.style.borderStyle = 'none';
	allMoveBtn.style.backgroundColor = '#636363';
	allMoveBtn.appendChild(document.createTextNode('이동'));
	dataControlDiv.appendChild(allMoveBtn);

	dataControlDiv.appendChild(document.createElement('br'));

	var partText = document.createElement('strong');
	partText.style.width = '25%';
	partText.style.padding = '2px';
	partText.style.verticalAlign = 'middle';
	partText.style.display = 'inline-block';
	partText.style.textAlign = 'justify';
	partText.style.fontSize = '13.33333px';
	partText.appendChild(document.createTextNode('부분'));
	dataControlDiv.appendChild(partText);

	var partSelectBtn = document.createElement('button');
	partSelectBtn.setAttribute('type', 'button');
	partSelectBtn.style.display = 'inline-block';
	partSelectBtn.style.verticalAlign = 'middle';
	partSelectBtn.style.padding = '2px 10px';
	partSelectBtn.style.fontSize = '12px';
	partSelectBtn.style.color = '#FFFFFF';
	partSelectBtn.style.borderRadius = '12px';
	partSelectBtn.style.borderStyle = 'none';
	partSelectBtn.style.backgroundColor = '#636363';
	partSelectBtn.appendChild(document.createTextNode('선택'));
	dataControlDiv.appendChild(partSelectBtn);

	var partMoveBtn = document.createElement('button');
	partMoveBtn.setAttribute('type', 'button');
	partMoveBtn.style.display = 'inline-block';
	partMoveBtn.style.verticalAlign = 'middle';
	partMoveBtn.style.marginLeft = '5px';
	partMoveBtn.style.padding = '2px 10px';
	partMoveBtn.style.fontSize = '12px';
	partMoveBtn.style.color = '#FFFFFF';
	partMoveBtn.style.borderRadius = '12px';
	partMoveBtn.style.borderStyle = 'none';
	partMoveBtn.style.backgroundColor = '#636363';
	partMoveBtn.appendChild(document.createTextNode('이동'));
	dataControlDiv.appendChild(partMoveBtn);

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
			runType : runtype,
			element  : btn,
			action   : action
		};
	}

	function getGroupDiv(category)
	{
		var div = document.createElement('div');
		div.style.padding = '5px 10px';
		div.style.margin = '0 0 20px 0';
		div.style.outline = '0px';
		div.style.verticalAlign = 'top';
		div.style.fontSize = '16PX';
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

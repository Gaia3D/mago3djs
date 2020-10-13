'use strict';
/**
 * SpeechBubble is a class object.
 * 
 * @class SpeechBubble
 * @constructor 
 */
var SpeechBubble = function() 
{
	this.point2dArray = [];
	this.repository = {};
};

/**
 * set default speech bubble profile
 */
SpeechBubble.prototype.makeDefault = function(imageSize)
{
	//origin is left up corner 0,0
	//--------------
	//
	var width = imageSize[0];
	var height = imageSize[1];

	var minSize = (width > height) ? height : width;

	var offset = minSize * 0.05;
	var bubbleHeight = 0.75 * height;
	var tailWidth = 0.2 * width;
	var center = 0.5 * width;
	var cornerRadius = minSize * 0.20;

	this.point2dArray[0] = getObj(center, height-offset, 'moveTo');
	this.point2dArray[1] = getObj(center + tailWidth/2, bubbleHeight, 'lineTo');
	this.point2dArray[2] = getObj(width - cornerRadius, bubbleHeight, 'lineTo');
	this.point2dArray[3] = getObj(width-offset, bubbleHeight, 'quadraticCurveTo', width-offset, bubbleHeight - cornerRadius);
	this.point2dArray[4] = getObj(width-offset, cornerRadius, 'lineTo');
	this.point2dArray[5] = getObj(width-offset, offset, 'quadraticCurveTo', width - cornerRadius, offset);
	this.point2dArray[6] = getObj(cornerRadius, offset, 'lineTo');
	this.point2dArray[7] = getObj(offset, offset, 'quadraticCurveTo', offset, cornerRadius);
	this.point2dArray[8] = getObj(offset, bubbleHeight - cornerRadius, 'lineTo');
	this.point2dArray[9] = getObj(offset, bubbleHeight, 'quadraticCurveTo', cornerRadius, bubbleHeight);
	this.point2dArray[10] = getObj(center - tailWidth/2, bubbleHeight, 'lineTo');
    
	function getObj(x, y, command, targetX, targetY) 
	{
		var point = [x, y];
		if (targetX && targetY) 
		{
			point.push(targetX);
			point.push(targetY);
		}
		return {
			point   : point,
			command : command
		};
	}
};

/**
 * 
 * @param {SpeechBubbleOption} option 
 * @param {MagoManager} magoManager 
 */
SpeechBubble.getImage = function(options, magoManager)
{
	if (!magoManager.speechBubble) 
	{
		magoManager.speechBubble = new Mago3D.SpeechBubble();
	}

	var sb = magoManager.speechBubble;

	if (!options)
	{ return undefined; }

	var sbWidht = options.width;
	var sbHeight = options.height;
	var commentTextOption = options.commentTextOption;
	var bubbleColor = options.bubbleColor;
	var bubbleHexColor = Color.getHexCode(bubbleColor.r, bubbleColor.g, bubbleColor.b);

	return sb.getPng([sbWidht, sbHeight], bubbleHexColor, commentTextOption);
}

/**
 * @param {Array<number>} imageSize
 * @param {Color} color
 * @param {object} textOption
 */
SpeechBubble.prototype.getPng = function (imageSize, color, textOption)
{
	//need validation
	//var hexColor = color.getHexCode();
	var aux = [];
	aux.push(imageSize);
	aux.push(color);
	aux.push(textOption);
	var id = JSON.stringify(aux);

	if (this.repository[id])
	{
		return this.repository[id].toDataURL();
	}

	this.makeDefault(imageSize);
	var canvas = makeCanvas(imageSize, color, textOption, this.point2dArray);
	this.repository[id] = canvas;
	return canvas.toDataURL();

	function makeCanvas(size, hex, tOption, p2dArray)
	{
		var c = document.createElement("canvas");
		var w = size[0];
		var h = size[1];
		c.width = w;
		c.height = h;

		var ctx = c.getContext("2d");
		ctx.save();
		ctx.fillStyle = hex;
		ctx.strokeStyle = '#364049';
		ctx.lineWidth = 2;
		ctx.beginPath();

		var p2dLength = p2dArray.length;
		for (var i=0;i<p2dLength;i++)
		{
			var p2d = p2dArray[i];
			if (p2d.point.length === 2)
			{
				ctx[p2d.command].call(ctx, p2d.point[0], p2d.point[1]);
			}
			else
			{
				ctx[p2d.command].call(ctx, p2d.point[0], p2d.point[1], p2d.point[2], p2d.point[3]);
			}
		}

		ctx.closePath();
		ctx.fill();
		//ctx.stroke();

		if (tOption)
		{
			var textValue = tOption.text; //required.
			var fontPixel = defaultValue(tOption.pixel, 10);
			var fontType = defaultValue(tOption.font, 'Dotum');
			var fontColor = defaultValue(tOption.color, 'white');
			var fontBorderColor = defaultValue(tOption.borderColor, 'black');

			ctx.font = 'bold ' + fontPixel + "px " + fontType;
			//			ctx.font = fontPixel + "px " + fontType;
			ctx.fillStyle = fontColor;
			ctx.strokeStyle = fontBorderColor;
			ctx.textAlign = "center";

			var splitText = textValue.split('\n');
			var tlen = splitText.length;
			var denomin = tlen + 1;
			for (var ti=0;ti<tlen;ti++)
			{
				var tVal = splitText[ti];
				if (tVal.length > 0)
				{
					var ty = ((h / denomin) * (ti+1) - (tlen-1) * (h / (denomin * 10))) - (ti * 3);
					var mt = ctx.measureText(tVal);
					console.log(mt);
					//ctx.strokeText(tVal, 20, ty, mt.width * 0.8);
					ctx.fillText(tVal, 20, ty, mt.width * 0.8);
					//					ctx.strokeText(tVal, w /2, ty);
					//					ctx.fillText(tVal, w /2, ty);
				}
			}
		}

		ctx.restore();
		return c;
	}
};
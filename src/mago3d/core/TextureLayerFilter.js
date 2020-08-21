'use strict';
/**
 * @constructor
 * @class The filter for textureLayer. 
 * 
 * @param {object} option filter properties
 */
var TextureLayerFilter = function(option) 
{
	if (!option || !option.type)
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('type'));
	}

	this.type = option.type;
	this.properties = option.properties;
};

/**
 * return legend img url.
 * @param {number} width
 * @param {number} height
 * @param {number} step
 */
TextureLayerFilter.prototype.getLegendImage = function(width, height)
{
	if (this.type !== CODE.imageFilter.BATHYMETRY)
	{
		throw new Error('This filter not support legend.');
	}
	var imageMaker;
	switch (this.type)
	{
	case CODE.imageFilter.BATHYMETRY : imageMaker = bathymetry;break;
	}

	return imageMaker.call(this, this, width, height, this.properties.stepGradient);


	//lint not allow this..
	function bathymetry(thisArg, canvasWidth, canvasHeight, stepGradient)
	{
		var legendStep = stepGradient.length;
		var minAlt = stepGradient[legendStep-1];
		var maxAlt = stepGradient[0];
		var offset = minAlt / legendStep;
		var level = maxAlt;

		var canvas = _makeCanvas(canvasWidth, canvasHeight);
		var ctx = canvas.getContext('2d');

		ctx.fillStyle = "#f1f1f1";
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		// ==========commented by soyijun
		//
		//		var titleHeight = Math.floor((canvasHeight / legendStep) * 0.7);
		//
		//		ctx.font = titleHeight * 0.5 + "px Arial";
		//		ctx.textBaseline = 'bottom';
		//		ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
		//
		//		var title = '수심 ( m )';
		//		ctx.fillText(title, 0, titleHeight * 0.7, canvasWidth);
		//
		//		ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
		//		ctx.fillRect(0, titleHeight * 0.7, canvasWidth, titleHeight * 0.3);
		//
		//		ctx.font = titleHeight * 0.7 + "px Arial";

		//		canvasHeight = canvasHeight - titleHeight;
		// ===========commented by soyijun

		// Create gradient
		var grd = ctx.createLinearGradient(0, 0, canvasWidth, 0);
		//		var grd = ctx.createLinearGradient(0, titleHeight, 0, canvasHeight);
		ctx.font = "12px Arial";
		for (var i=0;i<legendStep;i++)
		{
			level = i * offset;
			var color = Color.getWhiteToBlueColor_byHeight(level, minAlt, maxAlt);
			grd.addColorStop((1 / legendStep) * i, 'rgba(' + color.r * 255 +', ' + color.g * 255 +', ' + color.b * 255 +', 1.0)');

			/*if (color.r === 1 && color.g === 1 && color.b === 1)
			{
				ctx.lineWidth = 0.2;
				ctx.strokeStyle = '#404040';
				ctx.strokeRect(0, titleHeight + i * canvasHeight * (1/legendStep), canvasWidth * 0.75, canvasHeight * (1/legendStep));
			}
			else
			{
				ctx.fillStyle = 'rgba(' + color.r * 255 +', ' + color.g * 255 +', ' + color.b * 255 +', 1.0)';
			    ctx.fillRect(0, titleHeight + i * canvasHeight * (1/legendStep), canvasWidth * 0.75, canvasHeight * (1/legendStep));
			}*/

			ctx.fillStyle = 'rgba(102, 102, 102, 1.0)';
			//			ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
			ctx.textAlign = "center";
			ctx.fillText(parseInt(stepGradient[i], 10),
				((i+1) * canvasWidth * (1/legendStep))-20,
				//					(i+1) * canvasWidth * (1/legendStep) - canvasWidth * (1/legendStep)/legendStep,
				canvasHeight * 0.8 + 4
				//					40
				//					canvasWidth * 0.25,
				//					canvasHeight*0.75+2
			);
			//			ctx.fillText(parseInt(level, 10), canvasWidth*0.75+2, titleHeight + (i+1) * canvasHeight * (1/legendStep) - canvasHeight * (1/legendStep)/legendStep, canvasWidth * 0.25 - 2);
		}
		ctx.fillStyle = grd;
		ctx.fillRect(canvasWidth * 0.035, 0, canvasWidth * 0.91, canvasHeight * 0.6);
		//		ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.6);
		//		ctx.fillRect(0, titleHeight, canvasWidth * 0.75, canvasHeight);

		return canvas.toDataURL();
	}

	function _makeCanvas(w, h)
	{
		var c = document.createElement("canvas");
		c.width = w;
		c.height = h;

		var ctx = c.getContext("2d");
		ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
		ctx.fillRect(0, 0, w, h);

		ctx.save();
		return c;
	}
};
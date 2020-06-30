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
TextureLayerFilter.prototype.getLegendImage = function(width, height, step) 
{
	if (this.type !== CODE.imageFilter.BATHYMETRY)
	{
		throw new Error('This filter not support legend.');
	}

	var imageMaker;
	step = !step ? 10 : step;
	switch (this.type)
	{
	case CODE.imageFilter.BATHYMETRY : imageMaker = bathymetry;break;
	}
	
	return imageMaker.call(this, this, width, height, step);
    

	//lint not allow this..
	function bathymetry(thisArg, canvasWidth, canvasHeight, legendStep)
	{
		var minAlt = thisArg.properties.minAltitude;
		var maxAlt = 0;
		var offset = minAlt / legendStep;
		var level = maxAlt;

		var canvas = _makeCanvas(canvasWidth, canvasHeight);
		var ctx = canvas.getContext('2d');
        
		var titleHeight = Math.floor((canvasHeight / legendStep) * 0.7);
        
		ctx.font = titleHeight * 0.5 + "px Arial";
		ctx.textBaseline = 'bottom';
		ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
        
		var title = '수심 ( m )';
		ctx.fillText(title, 0, titleHeight * 0.7, canvasWidth);
        
		ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
		ctx.fillRect(0, titleHeight * 0.7, canvasWidth, titleHeight * 0.3);

		ctx.font = titleHeight * 0.7 + "px Arial";
        
		canvasHeight = canvasHeight - titleHeight;
		for (var i=0;i<legendStep;i++)
		{
			level = i * offset;
			var color = Color.getWhiteToBlueColor_byHeight(level, minAlt, maxAlt);
            
			if (color.r === 1 && color.g === 1 && color.b === 1)
			{
				ctx.lineWidth = 0.2;
				ctx.strokeStyle = '#404040';
				ctx.strokeRect(0, titleHeight + i * canvasHeight * (1/legendStep), canvasWidth * 0.75, canvasHeight * (1/legendStep));
			}
			else 
			{
				ctx.fillStyle = 'rgba(' + color.r * 255 +', ' + color.g * 255 +', ' + color.b * 255 +', 1.0)';    
			    ctx.fillRect(0, titleHeight + i * canvasHeight * (1/legendStep), canvasWidth * 0.75, canvasHeight * (1/legendStep));
			}

			ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
			ctx.fillText(parseInt(level, 10), canvasWidth*0.75+2, titleHeight + (i+1) * canvasHeight * (1/legendStep) - canvasHeight * (1/legendStep)/legendStep, canvasWidth * 0.25 - 2);
		}

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

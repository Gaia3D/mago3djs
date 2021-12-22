
'use strict';



/**
 * Save and calculate the color value as RGB
 * @class Color
 */
var Color = function(red, green, blue, alpha) 
{
	if (!(this instanceof Color)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 1;
	
	if (red !== undefined)
	{ this.r = red; }
	
	if (green !== undefined)
	{ this.g = green; }
	
	if (blue !== undefined)
	{ this.b = blue; }
	
	if (alpha !== undefined)
	{ this.a = alpha; }
};






/**
 * copy of the value of RGB instance
 * @param {Color} color
 */
Color.prototype.copyFrom = function(color) 
{
	this.r = color.r;
	this.g = color.g;
	this.b = color.b;
	this.a = color.a;
};

/**
 * Clear the RGBA value of this instance
 */
Color.prototype.deleteObjects = function() 
{
	this.r = undefined;
	this.g = undefined;
	this.b = undefined;
	this.a = undefined;
};

/**
 * copy of the value of RGB instance
 * @param {Color} color
 * 
 * @return {Array<number>}
 */
Color.toArray = function(color) 
{
	return [color.r, color.g, color.b, color.a];
};

/**
 * Linear interpolation between colorA & colorB/
 * In the resultColorsArray, the 1rst color = colorA & the last color = colorB.
 */
Color.getInterpolatedColorsArray = function(colorA, colorB, numColors, resultColorsArray ) 
{
	if (!resultColorsArray)
	{ resultColorsArray = []; }
	var increWeight = 1/(numColors-1);
	var weight = 0.0;
	for (var i=0; i<numColors; i++)
	{
		var color = Color.mix(colorA, colorB, weight, undefined );
		resultColorsArray.push(color);
		weight += increWeight;
	}

	return resultColorsArray;
};

/**
 * Linear interpolation between colorA & colorB
 */
Color.mix = function(colorA, colorB, weight, resultColor ) 
{
	if (resultColor === undefined)
	{ resultColor = new Color(); }
	
	var w = weight;
	var r = colorA.r * w + colorB.r * (1.0 - w);
	var g = colorA.g * w + colorB.g * (1.0 - w);
	var b = colorA.b * w + colorB.b * (1.0 - w);
	var a = colorA.a * w + colorB.a * (1.0 - w);
	
	resultColor.setRGBA(r, g, b, a);
	
	return resultColor;
};
  
/**
 * Set the value of RGBA (A means transparancy) as default. 
 * @param red the value of red
 * @param green the value of green
 * @param blue the value of blue
 * @param alpha the value of transparancy
 */
Color.prototype.set = function(red, green, blue, alpha) 
{

	this.r = red; 
	this.g = green; 
	this.b = blue; 
	this.a = alpha;
};
  
/**
 * Set the value of RGB
 * @param red the value of red
 * @param green the value of green
 * @param blue the value of blue
 */
Color.prototype.setRGB = function(red, green, blue) 
{

	this.r = red; 
	this.g = green; 
	this.b = blue;
};
  
/**
 * Set the value of RGBA (A means transparancy)
 * @param red the value of red
 * @param green the value of green
 * @param blue the value of blue
 * @param alpha the value of transparancy
 */
Color.prototype.setRGBA = function(red, green, blue, alpha) 
{
	//this[0] = red;
	//this[1] = green;
	//this[2] = blue;
	//this[3] = alpha;
	this.r = red; this.g = green; this.b = blue; this.a = alpha;
};

/**
 * return hexCode
 * @return {string}
 */
Color.prototype.getHexCode = function() 
{
	var r = this.r;
	var g = this.g;
	var b = this.b;
	
	return Color.getHexCode(r, g, b);
};

/**
 * return hexCode
 * @return {string}
 */
Color.prototype.getRGB = function() 
{
	var r = this.r;
	var g = this.g;
	var b = this.b;

	var rgb = 'rgb(';
	rgb += r*255 + ', ';
	rgb += g*255 + ', ';
	rgb += b*255;
	rgb += ')';
	return rgb;
};

/**
 * return hexCode
 * @return {string}
 */
Color.prototype.getRGBA = function() 
{
	var r = this.r;
	var g = this.g;
	var b = this.b;
	var a = this.a;

	var rgba = 'rgba(';
	rgba += r*255 + ', ';
	rgba += g*255 + ', ';
	rgba += b*255 + ', ';
	rgba += a;
	rgba += ')';
	return rgba;
};

/**
 * return hexCode
 * @return {string}
 */
Color.getHexCode = function(red, green, blue) 
{	
	var r = parseInt(red * 255);
	var g = parseInt(green * 255);
	var b = parseInt(blue * 255);
	
	var hexR = r.toString(16).padStart(2, '0'); //String.padStart i.e no support..TT 
	var hexG = g.toString(16).padStart(2, '0');
	var hexB = b.toString(16).padStart(2, '0');
	
	return '#'+hexR+hexG+hexB;
};

/**
 * return hexCode
 * @return {string}
 */
Color.fromHexCode = function(hex, resultColor4) 
{
	var r = parseInt(hex.slice(1, 3), 16),
		g = parseInt(hex.slice(3, 5), 16),
		b = parseInt(hex.slice(5, 7), 16);

	if (resultColor4 === undefined)
	{ resultColor4 = new Color(); }

	resultColor4.setRGB(r/256, g/256, b/256);
	return resultColor4;
		
};

/**
 * Match gray scale to RGB scale
 * @param gray the percentage of the gray color. normalize the value from 0.0 to 1.0
 * @param {Color} resultColor
 * @returns {Color} 
 */
Color.grayToRGB_MagoStyle = function(gray, resultColor) 
{
	if (resultColor === undefined)
	{ resultColor = new Color(); }
	
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }
	
	var r, g, b;
	
	r = -gray + 1.0;
	
	if (gray > 0.5)
	{
		g = -gray*2.0 + 2.0; 
	}
	else 
	{
		g = gray*2.0;
	}
	
	b = gray;
	
	resultColor.setRGB(r, g, b);
	
	return resultColor;
};

Color.grayToRGBYCM_MagoStyle = function(gray, resultColor)
{
	if (resultColor === undefined)
	{ resultColor = new Color(); }

	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }
	
	var r, g, b;
	
	if (gray < 0.16666)
	{
		b = 0.0;
		g = gray*6.0;
		r = 1.0;
	}
	else if (gray >= 0.16666 && gray < 0.33333)
	{
		b = 0.0;
		g = 1.0;
		r = 2.0 - gray*6.0;
	}
	else if (gray >= 0.33333 && gray < 0.5)
	{
		b = -2.0 + gray*6.0;
		g = 1.0;
		r = 0.0;
	}
	else if (gray >= 0.5 && gray < 0.66666)
	{
		b = 1.0;
		g = 4.0 - gray*6.0;
		r = 0.0;
	}
	else if (gray >= 0.66666 && gray < 0.83333)
	{
		b = 1.0;
		g = 0.0;
		r = -4.0 + gray*6.0;
	}
	else if (gray >= 0.83333)
	{
		b = 6.0 - gray*6.0;
		g = 0.0;
		r = 1.0;
	}
	
	resultColor.setRGB(r, g, b);
	return resultColor;
}; 

Color.getWhiteToBlueColor_byHeight = function(height, minHeight, maxHeight, resultColor)
{
	// White to Blue in 32 steps.
	var minH = maxHeight;
	var maxH = minHeight;
	var gray = (height - minH)/(maxH - minH);
	//gray = 1.0 - gray; // invert gray value (white to blue).
	// calculate r, g, b values by gray.

	var r, g, b;

	// Red.
	if (gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.
	{
		var minGray = 0.0;
		var maxGray = 0.15625;
		//var maxR = 0.859375; // 220/256.
		var maxR = 1.0;
		var minR = 0.3515625; // 90/256.
		var relativeGray = (gray- minGray)/(maxGray - minGray);
		r = maxR - relativeGray*(maxR - minR);
	}
	else if (gray >= 0.15625 && gray < 0.40625) // [6, 13] from 32 divisions.
	{
		var minGray = 0.15625;
		var maxGray = 0.40625;
		var maxR = 0.3515625; // 90/256.
		var minR = 0.0; // 0/256.
		var relativeGray = (gray- minGray)/(maxGray - minGray);
		r = maxR - relativeGray*(maxR - minR);
	}
	else  // [14, 32] from 32 divisions.
	{
		r = 0.0;
	}

	// Green.
	if (gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.
	{
		g = 1.0; // 256.
	}
	else if (gray >= 0.15625 && gray < 0.5625) // [6, 18] from 32 divisions.
	{
		var minGray = 0.15625;
		var maxGray = 0.5625;
		var maxG = 1.0; // 256/256.
		var minG = 0.0; // 0/256.
		var relativeGray = (gray- minGray)/(maxGray - minGray);
		g = maxG - relativeGray*(maxG - minG);
	}
	else  // [18, 32] from 32 divisions.
	{
		g = 0.0;
	}

	// Blue.
	if (gray < 0.5625)
	{
		b = 1.0;
	}
	else // gray >= 0.5625 && gray <= 1.0
	{
		var minGray = 0.5625;
		var maxGray = 1.0;
		var maxB = 1.0; // 256/256.
		var minB = 0.0; // 0/256.
		var relativeGray = (gray- minGray)/(maxGray - minGray);
		b = maxB - relativeGray*(maxB - minB);
	}

	if (resultColor === undefined)
	{ resultColor = new Color(); }

	resultColor.setRGB(r, g, b);
	return resultColor;
};

Color.getWhiteToBlueColor_byHeight2 = function(height, step, resultColor)
{
	var gray = 1;

	for (var i=0; i<step.length-1; i++)
	{
		var stepValue = step[i];
		var stepValue2 = step[i+1];

		// check if is frontier.***
		if (height >= step[0])
		{
			gray = 0.0;
			break;
		}

		if (height <= stepValue && height > stepValue2)
		{
			// calculate decimal.***
			//float decimal = (height - stepValue)/(stepValue2-stepValue);
			var decimal = (stepValue - height)/(stepValue-stepValue2);
			var unit = i;
			var value = unit + decimal;
			gray = value/(step.length-1);
			break;
		}
	}

	var r, g, b;
	// Red.
	if (gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.
	{
		var minGray = 0.0;
		var maxGray = 0.15625;
		//var maxR = 0.859375; // 220/256.
		var maxR = 1.0;
		var minR = 0.3515625; // 90/256.
		var relativeGray = (gray- minGray)/(maxGray - minGray);
		r = maxR - relativeGray*(maxR - minR);
	}
	else if (gray >= 0.15625 && gray < 0.40625) // [6, 13] from 32 divisions.
	{
		var minGray = 0.15625;
		var maxGray = 0.40625;
		var maxR = 0.3515625; // 90/256.
		var minR = 0.0; // 0/256.
		var relativeGray = (gray- minGray)/(maxGray - minGray);
		r = maxR - relativeGray*(maxR - minR);
	}
	else  // [14, 32] from 32 divisions.
	{
		r = 0.0;
	}

	// Green.
	if (gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.
	{
		g = 1.0; // 256.
	}
	else if (gray >= 0.15625 && gray < 0.5625) // [6, 18] from 32 divisions.
	{
		var minGray = 0.15625;
		var maxGray = 0.5625;
		var maxG = 1.0; // 256/256.
		var minG = 0.0; // 0/256.
		var relativeGray = (gray- minGray)/(maxGray - minGray);
		g = maxG - relativeGray*(maxG - minG);
	}
	else  // [18, 32] from 32 divisions.
	{
		g = 0.0;
	}

	// Blue.
	if (gray < 0.5625)
	{
		b = 1.0;
	}
	else // gray >= 0.5625 && gray <= 1.0
	{
		var minGray = 0.5625;
		var maxGray = 1.0;
		var maxB = 1.0; // 256/256.
		var minB = 0.0; // 0/256.
		var relativeGray = (gray- minGray)/(maxGray - minGray);
		b = maxB - relativeGray*(maxB - minB);
	}

	if (resultColor === undefined)
	{ resultColor = new Color(); }

	resultColor.setRGB(r, g, b);
	return resultColor;
};
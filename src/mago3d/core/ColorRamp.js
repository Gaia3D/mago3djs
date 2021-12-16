
'use strict';

/**
 * Save and calculate the color value as RGB
 * @class ColorRamp
 */
var ColorRamp = function(elementsArray) 
{
	if (!(this instanceof ColorRamp)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	//***********************************
	// "element" : {
	//    "color" : "#FFFFFF",
	//    "value": 0.0
	//};
	//-----------------------------------

	if (elementsArray)
	{ this.elementsArray = elementsArray; }
};

ColorRamp.prototype._getColorRGBA = function(idx)
{
	var elementsArray = this.elementsArray;
	if (!elementsArray[idx].colorRGBA)
	{
		elementsArray[idx].colorRGBA = Color.fromHexCode(elementsArray[idx].color);
	}

	return elementsArray[idx].colorRGBA;
};

ColorRamp.prototype.getInterpolatedColor = function(value)
{
	// 1rst, must find the interval of the value.***
	var idxA = this.getIdx(value);
	var elementsArray = this.elementsArray;
	var elemsCount = elementsArray.length;

	if (idxA < 0)
	{
		// return the 1rst color.
		return this._getColorRGBA(0);
	}
	else if (idxA === elemsCount-1)
	{
		// return the last color.
		return this._getColorRGBA(elemsCount-1);
	}
	else
	{
		var idxB = idxA + 1;

		// Now, take the color(i) & color(i+1) and mix.
		var colorA = this._getColorRGBA(idxA);
		var colorB = this._getColorRGBA(idxB);

		var valueA = elementsArray[idxA].value;
		var valueB = elementsArray[idxB].value;
		var weight = (value - valueA) / (valueB - valueA);

		return Color.mix(colorA, colorB, weight, undefined );
	}
};

ColorRamp.prototype.getIdx = function(value)
{
	// provisionally do lineal search.***
	// check limits.
	var elemsCount = this.elementsArray.length;

	if (value < this.elementsArray[0].value)
	{
		return 0;
	}
	else if (value > this.elementsArray[elemsCount-1].value)
	{
		return elemsCount-1;
	}

	for (var i=0; i<elemsCount; i++)
	{
		if (value < this.elementsArray[i].value)
		{
			return i-1;
		}
	}

	return -1;
};


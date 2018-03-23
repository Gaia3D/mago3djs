'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Ring
 */
var Ring = function() 
{
	if (!(this instanceof Ring)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.elemsArray;
};

/**
 * @class Ring
 */
Ring.prototype.newElement = function(elementTypeString)
{
	var elem;
	
	if(elementTypeString === "POLYLINE")
	{
		if(this.elemsArray === undefined)
			this.elemsArray = [];
		
		elem = new PolyLine();
		this.elemsArray.push(elem);
	}
	else if(elementTypeString === "ARC")
	{
		if(this.elemsArray === undefined)
			this.elemsArray = [];
		
		elem = new Arc();
		this.elemsArray.push(elem);
	}
	
	return elem;
};

/**
 * @class Ring
 */
Ring.prototype.getPoints = function(resultPointsArray)
{
	if(resultPointsArray === undefined)
		resultPointsArray = [];
	
	if(this.elemsArray === undefined)
		return resultPointsArray;
	
	var elem;
	var elemsCount = this.elemsArray.length;
	for(var i=0; i<elemsCount; i++)
	{
		elem = this.elemsArray[i];
		elem.getPoints(resultPointsArray);
	}
	
	return resultPointsArray;
};








































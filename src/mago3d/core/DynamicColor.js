'use strict';

var DynamicColor = function(option) 
{
	Color.call(this);
    
	this.redFactorSpeed = 2.0;
	this.greenFactorSpeed = 2.0;
	this.blueFactorSpeed = 2.0;
	this.alphaFactorSpeed = 2.0;
    
	this.redFactor = 1.0;
	this.greenFactor = 1.0;
	this.blueFactor = 1.0;
	this.alphaFactor = 1.0;
    
	if (option) 
	{
		this.redFactorSpeed = defaultValueCheckLength(option.redFactorSpeed, 1.0);
		this.greenFactorSpeed = defaultValueCheckLength(option.greenFactorSpeed, 1.0);
		this.blueFactorSpeed = defaultValueCheckLength(option.blueFactorSpeed, 2.0);
		this.alphaFactorSpeed = defaultValueCheckLength(option.alphaFactorSpeed, 2.0);
        
		this.redFactor = defaultValueCheckLength(option.redFactor, 1.0);
		this.greenFactor = defaultValueCheckLength(option.greenFactor, 1.0);
		this.blueFactor = defaultValueCheckLength(option.blueFactor, 1.0);
		this.alphaFactor = defaultValueCheckLength(option.alphaFactor, 1.0);
	}
};

DynamicColor.prototype = Object.create(Color.prototype);
DynamicColor.prototype.constructor = DynamicColor;

/**
 * Update the color of the screen shown at the CCTV
 * @param currTime
 */
DynamicColor.prototype.updateColorAlarm = function(currTime)
{
	if (this.lastTime === undefined)
	{ this.lastTime = currTime; }

	var timeAmount = (currTime - this.lastTime)/1000;
	
	// change color.
	if (this.redFactor === undefined)
	{ this.redFactor = 1.0; }
    
	if (this.greenFactor === undefined)
	{ this.greenFactor = 1.0; }
	
	if (this.blueFactor === undefined)
	{ this.blueFactor = 1.0; }
	
	if (this.alphaFactor === undefined)
	{ this.alphaFactor = 1.0; }
    
	this.redFactor += this.redFactorSpeed * timeAmount;
	this.greenFactor += this.greenFactorSpeed * timeAmount;
	this.blueFactor += this.blueFactorSpeed * timeAmount;
    
	var maxRedFactor = 1.0;
	if (this.redFactor > maxRedFactor )
	{
		this.redFactor = maxRedFactor;
		this.redFactorSpeed *= -1;
	}
    
	var minRedFactor = 0.5;
	if (this.redFactor < minRedFactor )
	{
		this.redFactor = minRedFactor;
		this.redFactorSpeed *= -1;
	}
	var maxGreenFactor = 0.5;
	if (this.greenFactor > maxGreenFactor )
	{
		this.greenFactor = maxGreenFactor;
		this.greenFactorSpeed *= -1;
	}
    
	var minGreenFactor = 0.1;
	if (this.greenFactor < minGreenFactor )
	{
		this.greenFactor = minGreenFactor;
		this.greenFactorSpeed *= -1;
	}
	var maxBlueFactor = 0.3;
	if (this.blueFactor > maxBlueFactor )
	{
		this.blueFactor = maxBlueFactor;
		this.blueFactorSpeed *= -1;
	}
    
	var minBlueFactor = 0.1;
	if (this.blueFactor < minBlueFactor )
	{
		this.blueFactor = minBlueFactor;
		this.blueFactorSpeed *= -1;
	}
	
	var maxAlphaFactor = 0.6;
	if (this.alphaFactor > maxAlphaFactor )
	{
		this.alphaFactor = maxAlphaFactor;
		this.alphaFactorSpeed *= -1;
	}
    
	var minAlphaFactor = 0.0;
	if (this.alphaFactor < minAlphaFactor )
	{
		this.alphaFactor = minAlphaFactor;
		this.alphaFactorSpeed *= -1;
	}
    
	if (this.greenFactor > this.redFactor) 
	{
		this.greenFactor = this.redFactor;
	}
	
	this.setRGBA(this.redFactor, this.greenFactor, this.blueFactor, this.alphaFactor);
	this.updateTime(currTime);
};
DynamicColor.prototype.updateTime = function(time) 
{
	this.lastTime = time;
};
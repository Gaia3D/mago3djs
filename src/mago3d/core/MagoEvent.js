'use strict';

var MagoEvent = function(type, listener) 
{
	this.type = type;
	this.listener = listener;
};


MagoEvent.prototype.getType = function() 
{
	return this.type;
};

MagoEvent.prototype.getListener = function() 
{
	return this.listener;
};
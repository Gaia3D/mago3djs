'use strict';

/**
 * @class Observer
 */
var Observer = function()
{

	/**
     * @type {Array<EventObject>}
     */
	this.events = [];
};
/**
 * Add the given overlay to the map.
 * @param {String} type event type.
 * @param {function} listener listener function.
 * @api
 */
Observer.prototype.on = function(type, listener)
{
	this.events.push(new EventObject(type, listener));
};

Observer.prototype.notify = function(type, param) 
{
	var e = null;
	for (var i in this.events)
	{
		if (this.events[i])
		{
			var ob = this.events[i];
			if (type === ob.type) { e = ob; }
		}
		
	}
	if (e)
	{
		e.listener.call(this, param);
	}
};
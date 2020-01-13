'use strict';

var Emitter = function () 
{
	this._events = {};
};

Emitter.prototype.on = function (event, fn) 
{
	if (!this._events[event]) 
	{
		this._events[event] = [];
	}
	this._events[event].push(fn);

	return this;
};

Emitter.prototype.emit = function (event) 
{
	var callbacks = this._events[event];

	if (callbacks) 
	{
		for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) 
		{
			args[_key - 1] = arguments[_key];
		}

		for (var _iterator = callbacks, _isArray = true, _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ;) 
		{
			var _ref;

			if (_isArray) 
			{
				if (_i >= _iterator.length) { break; }
				_ref = _iterator[_i++];
			}
			else 
			{
				_i = _iterator.next();
				if (_i.done) { break; }
				_ref = _i.value;
			}

			var callback = _ref;

			callback.apply(this, args);
		}
	}

	return this;
};

Emitter.prototype.off = function (event, fn) 
{
	if (!this._events || arguments.length === 0) 
	{
		this._events = {};
		return this;
	}

	// specific event
	var callbacks = this._events[event];
	if (!callbacks) 
	{
		return this;
	}

	// remove all handlers
	if (arguments.length === 1) 
	{
		delete this._events[event];
		return this;
	}

	// remove specific handler
	for (var i = 0; i < callbacks.length; i++) 
	{
		var callback = callbacks[i];
		if (callback === fn) 
		{
			callbacks.splice(i, 1);
			break;
		}
	}

	return this;
};
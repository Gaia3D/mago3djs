'use strict';
/**
 * 
 * @typedef {object} TextureLayer~option
 * @property {number} maxZoom The max level of this layer. This value can't change after constructed. default is 18.
 * @property {number} minZoom The min level of this layer. This value can't change after constructed. default is 0.
 * @property {boolean} show True if the layer is shown; otherwise, false. default is true.
 * @property {number} opacity The opacity value, from 0.0 to 1.0. default is 1.0.
 */

/**
 * @constructor
 * @abstract
 * @class 2d image layer abstract class, drawed on gl texture.
 * 
 * @param {TextureLayer~option} options 
 */
var TextureLayer = function(options) 
{
	if (isEmpty(options)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('url or urlFunction'));
	}
    
	Emitter.call(this);

	this._id = createGuid();
	var maxZoom = defaultValue(options.maxZoom, 18);
	var minZoom = defaultValue(options.minZoom, 0);
	this._freezeAttr = {
		maxZoom : maxZoom,
		minZoom : minZoom
	};
	Object.freeze(this._freezeAttr);
	this._show = defaultValue(options.show, true);
	this._opacity = defaultValue(options.opacity, 1.0);
};

TextureLayer.prototype = Object.create(Emitter.prototype);
TextureLayer.prototype.constructor = TextureLayer;
TextureLayer.EVENT_TYPE = {
	'CHANGESHOW'    : 'changeshow',
	'CHANGEOPACITY' : 'changeopacity',
};

Object.defineProperties(TextureLayer.prototype, {
	maxZoom: {
		get: function()
		{
			return this._freezeAttr.maxZoom;
		}
	},
	minZoom: {
		get: function()
		{
			return this._freezeAttr.minZoom;
		}
	},
	show: {
		get: function() 
		{
			return this._show;
		},
		set: function(show) 
		{
			var _show = JSON.parse(show);
			if (typeof _show !== 'boolean' || this._show === _show) { return; }

			this._show = _show;
            
			this.emit(TextureLayer.EVENT_TYPE.CHANGESHOW, this);
		}
	},
	opacity: {
		get: function() 
		{
			return this._opacity;
		},
		set: function(opacity) 
		{
			this._opacity = opacity;
            
			this.emit(TextureLayer.EVENT_TYPE.CHANGEOPACITY, this);
		}
	}
});

/**
 * abstract method. implement child class.
 * @abstract
 * @private
 */
TextureLayer.prototype.getUrl = function() 
{
	return abstract();
};
'use strict';

/**
 * This is the KoreaBuildingMaster.
 * @constructor
 * @class KoreaBuildingMaster
 * 
 * @param {string} url 
 * @param {string} format 
 * @param {object} option 
 * @param {MagoManager} magoManager magoManager.
 */
var KoreaBuildingMaster = function (url, format, option, magoManager)
{
	if (!(this instanceof KoreaBuildingMaster)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	if (!magoManager || !(magoManager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}
	Emitter.call(this);

	this.guid = createGuid();
	this.magoManager = magoManager;
	this.depth = 15;
	this.format = format;
	this.url = url;
	this.available;

	this._show = false;
	this.show = option.show;
	this._color = defaultValue(option.color, new Color(0.35294, 0.43921, 0.47843, 1));
	this.masks = defaultValue(option.masks, undefined);
};

KoreaBuildingMaster.prototype = Object.create(Emitter.prototype);
KoreaBuildingMaster.prototype.constructor = KoreaBuildingMaster;

Object.defineProperties(KoreaBuildingMaster.prototype, {
	show: {
		get: function() 
		{
			return this._show;
		},
		set: function(show) 
		{
			var that = this;

			var errorNotFoundLayer = function() 
			{
				throw Error("Can not find layer.json.");
			};

			var loadLayerJson = function(json) 
			{
				if (!(json && json.available)) 
				{
					throw Error("layer.json has not contain avaible property.");
				}
				that.available = json.available;

				for (var x in that.available) 
				{
					if (!that.available.hasOwnProperty(x)) { continue; }

					var yArray = that.available[x];
					var yArrayLength = yArray.length;
					for (var i=0;i<yArrayLength;i++) 
					{
						var yObj = yArray[i];
						for (var y = yObj.n;y<=yObj.x;y++) 
						{
							var fileUrl = that.url + x + '/' + y + '.' + that.format;
            
							that.magoManager.smartTileManager.putObject(that.depth, new KoreaBuildingSeed({
								url         : fileUrl,
								format      : that.format,
								x           : parseInt(x),
								y           : y,
								z           : that.depth,
								magoManager : that.magoManager,
								masterId    : that.guid
							}), that.magoManager);
						}
					}
				}
			};

			if (show && !this.available) 
			{
				loadWithXhr(this.url + 'layer.json', undefined, undefined, 'json', 'GET').then(
					loadLayerJson,
					errorNotFoundLayer
				);
			}
			this._show = show;
		}
	},
	color: {
		get: function() 
		{
			return this._color;
		},
		set: function(color) 
		{
			this._color = color;
		}
	},
	masks: {
		get: function() 
		{
			return this._masks;
		},
		set: function(masks) 
		{	
			if (!masks || !masks.features) { return; }
			this._masks = masks.features.map(feature=>feature.geometry.coordinates);
		}
	}
});

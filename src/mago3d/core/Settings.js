'use strict';

/**
 * This class contains settings.
 * @class Settings
 */
var Settings = function() 
{
	if (!(this instanceof Settings)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * This class contains rendering settings.
	 * @type {RenderingSettings}
	 */
	this._renderingSettings = new RenderingSettings();
	
};

/**
 * Returns the Rendering Settings.
 * @return {RenderingSettings} this._renderingSettings
 */
Settings.prototype.getRenderingSettings = function()
{
	return this._renderingSettings;
};
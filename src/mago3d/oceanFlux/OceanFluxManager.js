'use strict';

/**
 * @class OceanFluxManager
 */
var OceanFluxManager = function (options) 
{
	if (!(this instanceof OceanFluxManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.magoManager = options.magoManager;
	this.oceanFluxLayersMap = {};
	this.oceanFluxMapFolderPath = undefined;

	if (options)
	{
		if (options.oceanFluxMapFolderPath)
		{
			this.oceanFluxMapFolderPath = options.oceanFluxMapFolderPath;
		}
	}

};

OceanFluxManager.prototype.newOceanFluxLayer = function(geoJsonFilePath)
{
	var options = {
		oceanFluxManager       : this,
		geoJsonFilePath        : geoJsonFilePath,
		oceanFluxMapFolderPath : this.oceanFluxMapFolderPath,
		gl                     : this.magoManager.sceneState.gl
	};
	var oceanFluxLayer = new OceanFluxLayer(options);
	this.oceanFluxLayersMap[oceanFluxLayer.geoJsonFilePath] = oceanFluxLayer;
	return oceanFluxLayer;

};

OceanFluxManager.prototype.render = function()
{
	for (var key in this.oceanFluxLayersMap)
	{
		if (this.oceanFluxLayersMap.hasOwnProperty(key))
		{
			var oceanFluxLayer = this.oceanFluxLayersMap[key];
		    oceanFluxLayer.renderMode3DThickLines(this.magoManager);
		}
		
	}
};


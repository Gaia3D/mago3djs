'use strict';

/**
 * @class TinTerrainManager
 */
var TinTerrainManager = function() 
{
	if (!(this instanceof TinTerrainManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.maxDepth = 15;
	this.currentVisibles_terrName_geoCoords_map = {}; // current visible terrains map[terrainPathName, geographicCoords].***
	this.currentTerrainsMap = {}; // current terrains (that was created) map[terrainPathName, tinTerrain].***
};
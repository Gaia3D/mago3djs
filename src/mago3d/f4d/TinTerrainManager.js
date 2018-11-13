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
	
	this.maxDepth = 17;
	this.currentVisibles_terrName_geoCoords_map = {}; // current visible terrains map[terrainPathName, geographicCoords].***
	this.currentTerrainsMap = {}; // current terrains (that was created) map[terrainPathName, tinTerrain].***
	
	this.visibleTilesArray = [];
	this.noVisibleTilesArray = [];
	
	// TinTerrainQuadTrees.****************************
	this.tinTerrainsQuadTreeAsia; // Main object.***
	this.tinTerrainsQuadTreeAmerica; // Main object.***
	
	this.geoServURL = "http://192.168.10.57:9090/geoserver/gwc/service/wmts";
	
	this.init();
};

TinTerrainManager.prototype.init = function()
{
	this.tinTerrainsQuadTreeAsia = new TinTerrain(undefined); // Main object.***
	this.tinTerrainsQuadTreeAmerica = new TinTerrain(undefined); // Main object.***
	
	// Asia side.***
	var minLon = 0;
	var minLat = -90;
	var minAlt = 0;
	var maxLon = 180;
	var maxLat = 90;
	var maxAlt = 0;
	this.tinTerrainsQuadTreeAsia.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
	this.tinTerrainsQuadTreeAsia.X = 1;
	this.tinTerrainsQuadTreeAsia.Y = 0;
	
	// America side.
	minLon = -180;
	minLat = -90;
	minAlt = 0;
	maxLon = 0;
	maxLat = 90;
	maxAlt = 0;
	this.tinTerrainsQuadTreeAmerica.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
	this.tinTerrainsQuadTreeAmerica.X = 0;
	this.tinTerrainsQuadTreeAmerica.Y = 0;
};

TinTerrainManager.prototype.doFrustumCulling = function(frustum, camPos, magoManager, maxDepth)
{
	if(maxDepth === undefined)
		maxDepth = this.maxDepth;
	
	this.visibleTilesArray.length = 0;
	this.noVisibleTilesArray.length = 0;
	this.tinTerrainsQuadTreeAsia.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArray, this.noVisibleTilesArray);
	this.tinTerrainsQuadTreeAmerica.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArray, this.noVisibleTilesArray);
};

/**
 * Prepare tinTerrains.***
 */
TinTerrainManager.prototype.prepareVisibleTinTerrains = function(magoManager) 
{
	var tinTerrain;
	
	// For the visible tinTerrains prepare its.***
	// Preparing rule: First prepare the tinTerrain-owner if the owner is no prepared yet.***
	var visiblesTilesCount = this.visibleTilesArray.length;
	for(var i=0; i<visiblesTilesCount; i++)
	{
		tinTerrain = this.visibleTilesArray[i];
		tinTerrain.prepareTinTerrain(magoManager, this);
	}
	
	// 2nd, for all terrains that exist, if there are not in the visiblesMap, then delete its.***
	// Deleting rule: If a tinTerrain has children, then delete first the children.***
	var deletedCount = 0;
	var noVisiblesTilesCount = this.noVisibleTilesArray.length;
	for(var i=0; i<visiblesTilesCount; i++)
	{
		tinTerrain = this.noVisibleTilesArray[i];
		if(tinTerrain !== undefined)
		{
			if(tinTerrain.depth > 2)
			{
				tinTerrain.deleteTinTerrain(magoManager);
				deletedCount++;
			}
		}
		
		if(deletedCount > 5)
			break;
	}
	
};

TinTerrainManager.prototype.render = function(magoManager, bDepth) 
{
	
	var gl = magoManager.sceneState.gl;
	var currentShader = magoManager.postFxShadersManager.getShader("tinTerrain");
	var shaderProgram = currentShader.program;
	
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	if(bDepth)
		gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	else
		gl.enableVertexAttribArray(currentShader.texCoord2_loc);
	//gl.disableVertexAttribArray(currentShader.normal3_loc);
	//gl.disableVertexAttribArray(currentShader.color4_loc);
	
	currentShader.bindUniformGenerals();

	var tex = magoManager.pin.texturesArray[4];
	gl.activeTexture(gl.TEXTURE2); 
	gl.bindTexture(gl.TEXTURE_2D, tex.texId);
	
	gl.uniform1i(currentShader.bIsMakingDepth_loc, bDepth); //.***
	gl.uniform1i(currentShader.hasTexture_loc, true); //.***
	gl.uniform4fv(currentShader.oneColor4_loc, [0.5, 0.5, 0.5, 1.0]);
	
	var flipTexCoordY = true;
	if (magoManager.configInformation.geo_view_library === Constant.CESIUM)
		flipTexCoordY = false;
	gl.uniform1i(currentShader.textureFlipYAxis_loc, flipTexCoordY); // false for cesium, true for magoWorld.***
	
	//gl.enable(gl.POLYGON_OFFSET_FILL);
	//gl.polygonOffset(1, 3);
	
	var renderWireframe = false;
	var tinTerrain;
	var visiblesTilesCount = this.visibleTilesArray.length;
	for (var i=0; i<visiblesTilesCount; i++)
	{
		//currentVisiblesTerrainsMap
		tinTerrain = this.visibleTilesArray[i];
		
		if (tinTerrain === undefined)
		{ continue; }
	
		tinTerrain.render(currentShader, magoManager, bDepth);
	}
};







































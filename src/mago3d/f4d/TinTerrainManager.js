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
	this.currentVisibles_terrName_geoCoords_map = {}; // current visible terrains map[terrainPathName, geographicCoords].
	this.currentTerrainsMap = {}; // current terrains (that was created) map[terrainPathName, tinTerrain].
	
	this.visibleTilesArray = [];
	this.noVisibleTilesArray = [];
	
	// TinTerrainQuadTrees.
	this.tinTerrainsQuadTreeAsia; // Main object.
	this.tinTerrainsQuadTreeAmerica; // Main object.
	
	this.geoServURL = "http://192.168.10.57:9090/geoserver/gwc/service/wmts";
	
	// Elevation model or plain ellipsoid.
	// terrainType = 0 -> terrainPlainModel.
	// terrainType = 1 -> terrainElevationModel.
	this.terrainType = 0; 
	this.imageryType = CODE.imageryType.WEB_MERCATOR; // Test.***
	
	this.init();
};

TinTerrainManager.prototype.init = function()
{
	this.tinTerrainsQuadTreeAsia = new TinTerrain(undefined); // Main object.
	this.tinTerrainsQuadTreeAmerica = new TinTerrain(undefined); // Main object.
	//1.4844222297453322
	//var latDeg = 1.4844222297453322 *180/Math.PI;
	//https://en.wikipedia.org/wiki/Web_Mercator_projection
	//https://en.wikipedia.org/wiki/Mercator_projection
	var webMercatorMaxLatRad = 2*Math.atan(Math.pow(Math.E, Math.PI)) - (Math.PI/2);
	var webMercatorMaxLatDeg = webMercatorMaxLatRad * 180/Math.PI; // = 85.0511287798...
	
	// Asia side.
	var minLon = 0;
	var minLat = -90;
	var minAlt = 0;
	var maxLon = 180;
	var maxLat = 90;
	var maxAlt = 0;
	if (this.imageryType === CODE.imageryType.WEB_MERCATOR)
	{
		minLat = -webMercatorMaxLatDeg; 
		maxLat = webMercatorMaxLatDeg; 
	}
	
	this.tinTerrainsQuadTreeAsia.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
	//this.tinTerrainsQuadTreeAsia.setWebMercatorExtent(0.5, 0, 1, 1); // ori.***
	this.tinTerrainsQuadTreeAsia.setWebMercatorExtent(0, -1, 1, 1); // unitary extension.***
	this.tinTerrainsQuadTreeAsia.X = 1;
	this.tinTerrainsQuadTreeAsia.Y = 0;
	this.tinTerrainsQuadTreeAsia.indexName = "RU";
	this.tinTerrainsQuadTreeAsia.tinTerrainManager = this;
	
	// America side.
	minLon = -180;
	minLat = -90;
	minAlt = 0;
	maxLon = 0;
	maxLat = 90;
	maxAlt = 0;
	if (this.imageryType === CODE.imageryType.WEB_MERCATOR)
	{
		minLat = -webMercatorMaxLatDeg; 
		maxLat = webMercatorMaxLatDeg; 
	}
	this.tinTerrainsQuadTreeAmerica.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
	//this.tinTerrainsQuadTreeAmerica.setWebMercatorExtent(0, 0, 0.5, 1); // ori.***
	this.tinTerrainsQuadTreeAmerica.setWebMercatorExtent(-1.0, -1.0, 0, 1); // unitary extension.***
	this.tinTerrainsQuadTreeAmerica.X = 0;
	this.tinTerrainsQuadTreeAmerica.Y = 0;
	this.tinTerrainsQuadTreeAmerica.indexName = "LU";
	this.tinTerrainsQuadTreeAmerica.tinTerrainManager = this;
	
	// do imagery test.
	// set imagery initial geoExtent (in mercator coords).
	
	// Full extent. https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
	var initImageryMercatorMinX = -2.003750722959434E7;
	var initImageryMercatorMinY = -1.997186888040859E7;
	var initImageryMercatorMaxX = 2.003750722959434E7;
	var initImageryMercatorMaxY = 1.9971868880408563E7;
	/*
	//north: 1.4844222297453322
	var eqRadius = Globe.equatorialRadius();
	var north = eqRadius*1.48352986419518;
	var north2 = eqRadius*Math.PI/2;
	
	// my extent.
	
	var initImageryMercatorMinX = -2.003750722959434E7;
	var initImageryMercatorMinY = -north2;
	var initImageryMercatorMaxX = 2.003750722959434E7;
	var initImageryMercatorMaxY = north2;
	*/
	
	this.tinTerrainsQuadTreeAsia.imageryGeoExtent = new GeographicExtent();
	this.tinTerrainsQuadTreeAsia.imageryGeoExtent.setExtent(initImageryMercatorMinX, initImageryMercatorMinY, 0.0, initImageryMercatorMaxX, initImageryMercatorMaxY, 0.0);
	
	this.tinTerrainsQuadTreeAmerica.imageryGeoExtent = new GeographicExtent();
	this.tinTerrainsQuadTreeAmerica.imageryGeoExtent.setExtent(initImageryMercatorMinX, initImageryMercatorMinY, 0.0, initImageryMercatorMaxX, initImageryMercatorMaxY, 0.0);
	
	// Test code:
	var PI = Math.PI;
	var latRad = -webMercatorMaxLatRad;
	var x = Math.log(Math.tan(PI/4+latRad/2));
	
	latRad = -45*PI/180;
	var x2 = Math.log(Math.tan(PI/4+latRad/2));
	
	latRad = 0;
	var x3 = Math.log(Math.tan(PI/4+latRad/2));
	
	latRad = 45*PI/180;
	var x4 = Math.log(Math.tan(PI/4+latRad/2));
	
	latRad = webMercatorMaxLatRad;
	var x5 = Math.log(Math.tan(PI/4+latRad/2));
	
	// test code 2:
	var depth = 0;
	var aConst = (1.0/(2.0*PI))*Math.pow(2.0, depth);
	latRad = -webMercatorMaxLatRad;
	var y = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = -45*PI/180;
	var y2 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = 0;
	var y3 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = 45*PI/180;
	var y4 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = webMercatorMaxLatRad;
	var y5 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	// test code 3:
	depth = 1;
	aConst = (1.0/(2.0*PI))*Math.pow(2.0, depth);
	latRad = -webMercatorMaxLatRad;
	var z = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = -45*PI/180;
	var z2 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = 0;
	var z3 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = 45*PI/180;
	var z4 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = webMercatorMaxLatRad;
	var z5 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	// test code 4:
	depth = 2;
	aConst = (1.0/(2.0*PI))*Math.pow(2.0, depth);
	latRad = -webMercatorMaxLatRad;
	var w = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = -45*PI/180;
	var w2 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = 0;
	var w3 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = 45*PI/180;
	var w4 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
	
	latRad = webMercatorMaxLatRad;
	var w5 = aConst*(PI-Math.log(Math.tan(PI/4+latRad/2)));
};

TinTerrainManager.prototype.doFrustumCulling = function(frustum, camPos, magoManager, maxDepth)
{
	if (maxDepth === undefined)
	{ maxDepth = this.maxDepth; }
	
	this.visibleTilesArray.length = 0;
	this.noVisibleTilesArray.length = 0;
	this.tinTerrainsQuadTreeAsia.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArray, this.noVisibleTilesArray);
	this.tinTerrainsQuadTreeAmerica.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArray, this.noVisibleTilesArray);
};

/**
 * Prepare tinTerrains.
 */
TinTerrainManager.prototype.prepareVisibleTinTerrains = function(magoManager) 
{
	var tinTerrain;
	
	// For the visible tinTerrains prepare its.
	// Preparing rule: First prepare the tinTerrain-owner if the owner is no prepared yet.
	var visiblesTilesCount = this.visibleTilesArray.length;
	if (this.terrainType === 0) // PlainTerrain.
	{
		for (var i=0; i<visiblesTilesCount; i++)
		{
			tinTerrain = this.visibleTilesArray[i];
			tinTerrain.prepareTinTerrainPlain(magoManager, this);
		}
	}
	else if (this.terrainType === 1)// ElevationTerrain.
	{
		for (var i=0; i<visiblesTilesCount; i++)
		{
			tinTerrain = this.visibleTilesArray[i];
			tinTerrain.prepareTinTerrain(magoManager, this);
		}
	}
	
	// 2nd, for all terrains that exist, if there are not in the visiblesMap, then delete its.
	// Deleting rule: If a tinTerrain has children, then delete first the children.
	var deletedCount = 0;
	var noVisiblesTilesCount = this.noVisibleTilesArray.length;
	for (var i=0; i<visiblesTilesCount; i++)
	{
		tinTerrain = this.noVisibleTilesArray[i];
		if (tinTerrain !== undefined)
		{
			if (tinTerrain.depth > 2)
			{
				tinTerrain.deleteTinTerrain(magoManager);
				deletedCount++;
			}
		}
		
		if (deletedCount > 5)
		{ break; }
	}
	
};

TinTerrainManager.prototype.render = function(magoManager, bDepth) 
{
	
	var gl = magoManager.sceneState.gl;
	var currentShader = magoManager.postFxShadersManager.getShader("tinTerrain");
	var shaderProgram = currentShader.program;
	
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	if (bDepth)
	{ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
	else
	{ gl.enableVertexAttribArray(currentShader.texCoord2_loc); }
	//gl.disableVertexAttribArray(currentShader.normal3_loc);
	//gl.disableVertexAttribArray(currentShader.color4_loc);
	
	currentShader.bindUniformGenerals();

	var tex = magoManager.pin.texturesArray[4]; // provisional.
	gl.activeTexture(gl.TEXTURE2); 
	gl.bindTexture(gl.TEXTURE_2D, tex.texId);
	
	gl.uniform1i(currentShader.bIsMakingDepth_loc, bDepth); //.
	gl.uniform1i(currentShader.hasTexture_loc, true); //.
	gl.uniform4fv(currentShader.oneColor4_loc, [0.5, 0.5, 0.5, 1.0]);
	
	var flipTexCoordY = true;
	if (magoManager.configInformation.geo_view_library === Constant.CESIUM)
	{ flipTexCoordY = false; }
	gl.uniform1i(currentShader.textureFlipYAxis_loc, flipTexCoordY); // false for cesium, true for magoWorld.
	
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

	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc); 
	currentShader.disableVertexAttribArray(currentShader.position3_loc); 
	currentShader.disableVertexAttribArray(currentShader.normal3_loc); 
	currentShader.disableVertexAttribArray(currentShader.color4_loc); 
	gl.useProgram(null);
};







































'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var VisibleObjectsControler = function() {
	this.currentVisibleNeoBuildings_LOD0_array = [];
	this.currentVisibleNeoBuildings_LOD1_array = [];
	this.currentVisibleNeoBuildings_LOD2_array = [];
	this.currentVisibleNeoBuildings_LOD3_array = [];
	
	this.currentRenderableNeoBuildings_LOD0_array = [];
	this.currentRenderableNeoBuildings_LOD1_array = [];
	this.currentRenderableNeoBuildings_LOD2_array = [];
	this.currentRenderableNeoBuildings_LOD3_array = [];
	
	this.currentRenderableRefArray = [];
};
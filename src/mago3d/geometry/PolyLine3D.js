'use strict';

/**
 * This is similar with Point3DList, but this one represents real polyline geometry feature.
 * @class PolyLine3D
 */
var PolyLine3D = function() 
{
	if (!(this instanceof PolyLine3D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.point3dArray;
	this.geoLocDataManager;
	this.vboKeysContainer;
};

/**
 * Creates a new Point3D.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @returns point3d
 */
PolyLine3D.prototype.newPoint3d = function(x, y, z)
{
	if (this.point3dArray === undefined)
	{ this.point3dArray = []; }
	
	var point3d = new Point3D(x, y, z);
	this.point3dArray.push(point3d);
	return point3d;
};

/**
 * Add a list of Point3D at the last of this.pointsArray
 * @param point3dArray the point that will be pushed at this.pointsArray
 */
PolyLine3D.prototype.addPoint3dArray = function(points3dArray)
{
	if (points3dArray === undefined)
	{ return; }
	
	if (this.point3dArray === undefined)
	{ this.point3dArray = []; }

	this.point3dArray.push.apply(this.point3dArray, points3dArray);
};

/**
 * Return the coordinate contained at geoLocDataManager
 * @returns geoLoc
 */
PolyLine3D.prototype.getGeographicLocation = function()
{
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }
	
	var geoLoc = this.geoLocDataManager.getCurrentGeoLocationData();
	if (geoLoc === undefined)
	{
		geoLoc = this.geoLocDataManager.newGeoLocationData("default");
	}
	
	return geoLoc;
};

/**
 * Make the vbo of this point3DList
 * @param magoManager
 */
PolyLine3D.prototype.makeVbo = function(magoManager)
{
	if (!this.point3dArray || this.point3dArray.length === 0) 
	{
		return;
	}
	
	this.vboKeysContainer = Point3DList.getVbo(magoManager, this.point3dArray, this.vboKeysContainer);
};

/**
 * Render this point3dlist using vbo of this list. 
 * @param magoManager
 * @param shader 
 * @param renderType
 * @param bLoop 
 * @param bEnableDepth if this is turned off, then the last-drawing feature will be shown at the top
 */
PolyLine3D.prototype.renderLines = function(magoManager, shader, renderType, bLoop, bEnableDepth)
{
	if (this.point3dArray === undefined)
	{ return false; }
	
	var gl = magoManager.sceneState.gl;
	
	if (this.vboKeysContainer === undefined || this.vboKeysContainer.getVbosCount() === 0)
	{ this.makeVbo(magoManager); }

	shader.enableVertexAttribArray(shader.position3_loc);
	
	gl.uniform1i(shader.bPositionCompressed_loc, false);
	gl.uniform1i(shader.bUse1Color_loc, true);
	gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 0.1, 1.0]); //.
	gl.uniform1f(shader.fixPointSize_loc, 5.0);
	gl.uniform1i(shader.bUseFixPointSize_loc, true);
	
	if (bEnableDepth === undefined)
	{ bEnableDepth = true; }
	
	if (bEnableDepth)
	{ gl.enable(gl.DEPTH_TEST); }
	else
	{ gl.disable(gl.DEPTH_TEST); }

	// Render the line.
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.LINE_STRIP, 0, vbo_vicky.vertexCount);
	
	// Check if exist selectedGeoCoord.
	/*
	var currSelected = magoManager.selectionManager.getSelectedGeneral();
	if(currSelected !== undefined && currSelected.constructor.name === "GeographicCoord")
	{
		gl.uniform4fv(shader.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.
		gl.uniform1f(shader.fixPointSize_loc, 10.0);
		currSelected.renderPoint(magoManager, shader, gl, renderType);
	}
	*/
	
	gl.enable(gl.DEPTH_TEST);
};

/**
 * @class PolyLine3D
 */
PolyLine3D.prototype.renderPoints = function(magoManager)
{
	// todo:
};
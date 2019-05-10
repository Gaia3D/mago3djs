'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class Point3DList
*/
var Point3DList = function(points3dArray) 
{
	if (!(this instanceof Point3DList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.pointsArray;
	if (points3dArray !== undefined)
	{ this.pointsArray = points3dArray; }
	
	this.bLoop;
	
	this.geoLocDataManager;
	this.vboKeysContainer;
};

Point3DList.prototype.deleteObjects = function(magoManager)
{
	this.deletePoints3d();
	this.deleteVboKeysContainer(magoManager);
	
	if (this.geoLocDataManager !== undefined)
	{
		this.geoLocDataManager.deleteObjects();
		this.geoLocDataManager = undefined;
	}
};

Point3DList.prototype.deleteVboKeysContainer = function(magoManager)
{
	if (this.vboKeysContainer !== undefined)
	{
		var gl = magoManager.sceneState.gl;
		this.vboKeysContainer.deleteGlObjects(gl, magoManager.vboMemoryManager);
		this.vboKeysContainer = undefined;
	}
};

Point3DList.prototype.deletePoints3d = function()
{
	if (this.pointsArray === undefined)
	{ return; }
	
	var pointsCount = this.pointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		this.pointsArray[i].deleteObjects();
		this.pointsArray[i] = undefined;
	}
	this.pointsArray = undefined;
};

Point3DList.prototype.addPoint = function(point3d)
{
	if (point3d === undefined)
	{ return; }
	
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }

	this.pointsArray.push(point3d);
};

Point3DList.prototype.getGeographicLocation = function()
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

Point3DList.prototype.addPoint3dArray = function(points3dArray)
{
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }

	this.pointsArray.push.apply(this.pointsArray, points3dArray);
};

Point3DList.prototype.newPoint = function(x, y, z)
{
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }
	
	var point = new Point3D(x, y, z);
	this.pointsArray.push(point);
	return point;
};

Point3DList.prototype.getPoint = function(idx)
{
	return this.pointsArray[idx];
};

Point3DList.prototype.getPointsCount = function()
{
	if (this.pointsArray === undefined)
	{ return 0; }
	
	return this.pointsArray.length;
};

Point3DList.prototype.getPrevIdx = function(idx)
{
	// Note: This function is used when this is a point3dLoop.***
	var pointsCount = this.pointsArray.length;
	var prevIdx;
	
	if (idx === 0)
	{ prevIdx = pointsCount - 1; }
	else
	{ prevIdx = idx - 1; }

	return prevIdx;
};

Point3DList.prototype.getNextIdx = function(idx)
{
	// Note: This function is used when this is a point3dLoop.***
	var pointsCount = this.pointsArray.length;
	var nextIdx;
	
	if (idx === pointsCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	return nextIdx;
};

Point3DList.prototype.getSegment3D = function(idx, resultSegment3d, bLoop)
{
	// If "bLoop" = true, then this points3dList is a loop.***
	// If "bLoop" = false, then this points3dList is a string.***
	if (bLoop === undefined)
	{ bLoop = false; }
	
	var pointsCount = this.getPointsCount();
	
	if (!bLoop && idx === pointsCount-1)
	{ return undefined; }
	
	var currPoint = this.getPoint(idx);
	var nextIdx = this.getNextIdx(idx);
	var nextPoint = this.getPoint(nextIdx);
	
	if (resultSegment3d === undefined)
	{ resultSegment3d = new Segment3D(currPoint, nextPoint); }
	else 
	{
		resultSegment3d.setPoints(currPoint, nextPoint);
	}
	
	return resultSegment3d;
};

Point3DList.prototype.getBisectionPlane = function(idx, resultBisectionPlane, bLoop)
{
	// This function returns a plane that has the same angle with the 2 segments of a point(idx).***
	// If "bLoop" = true, then this points3dList is a loop.***
	// If "bLoop" = false, then this points3dList is a string.***
	if (bLoop === undefined)
	{ bLoop = false; }
	
	var pointsCount = this.getPointsCount();
	
	if (pointsCount < 1)
	{ return resultBisectionPlane; }
	
	if (resultBisectionPlane === undefined)
	{ resultBisectionPlane = new Plane(); }
	
	var point3d = this.getPoint(idx);
	var segment3d_A, segment3d_B;
	
	if (!bLoop)
	{
		if (idx === pointsCount-1)
		{
			// The last point is an exception in string mode.***
			// Take the previous segment.***
			var idxPrev = idx-1;
			segment3d_A = this.getSegment3D(idxPrev, undefined, bLoop);	
			segment3d_B = this.getSegment3D(idxPrev, undefined, bLoop);	
		}
		else if (idx === 0)
		{
			segment3d_A = this.getSegment3D(idx, undefined, bLoop);	
			segment3d_B = this.getSegment3D(idx, undefined, bLoop);
		}
		else
		{
			var idxPrev = idx-1;
			segment3d_A = this.getSegment3D(idx, undefined, bLoop);	
			segment3d_B = this.getSegment3D(idxPrev, undefined, bLoop);	
		}
	}
	else 
	{
		var idxPrev = this.getPrevIdx(idx);
		segment3d_A = this.getSegment3D(idx, undefined, bLoop);
		segment3d_B = this.getSegment3D(idxPrev, undefined, bLoop);	
	}
	
	var dirA = segment3d_A.getDirection();
	var dirB = segment3d_B.getDirection();
	dirA.addPoint(dirB);
	dirA.unitary;
	
	// Now, with "point3d" & "dir" make the plane.***
	resultBisectionPlane.setPointAndNormal(point3d.x, point3d.y, point3d.z, dirA.x, dirA.y, dirA.z);
	
	return resultBisectionPlane;
};

Point3DList.prototype.makeVbo = function(magoManager)
{
	if (this.vboKeysContainer === undefined)
	{ this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var pointsCount = this.pointsArray.length;
	var posByteSize = pointsCount * 3;
	var posVboDataArray = new Float32Array(posByteSize);
	var point3d;
	for (var i=0; i<pointsCount; i++)
	{
		point3d = this.pointsArray[i];
		posVboDataArray[i*3] = point3d.x;
		posVboDataArray[i*3+1] = point3d.y;
		posVboDataArray[i*3+2] = point3d.z;
	}
	
	var vbo = this.vboKeysContainer.newVBOVertexIdxCacheKey();
	vbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager);
};

Point3DList.prototype.renderLines = function(magoManager, shader, renderType, bLoop, bEnableDepth)
{
	if (this.pointsArray === undefined)
	{ return false; }
	
	var gl = magoManager.sceneState.gl;
	
	if (this.vboKeysContainer === undefined || this.vboKeysContainer.getVbosCount() === 0)
	{
		this.makeVbo(magoManager);
		return;
	}

	shader.enableVertexAttribArray(shader.position3_loc);
	
	gl.uniform1i(shader.bPositionCompressed_loc, false);
	gl.uniform1i(shader.bUse1Color_loc, true);
	gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 0.1, 1.0]); //.***
	gl.uniform1f(shader.fixPointSize_loc, 5.0);
	gl.uniform1i(shader.bUseFixPointSize_loc, true);
	
	if (bEnableDepth === undefined)
	{ bEnableDepth = true; }
	
	if (bEnableDepth)
	{ gl.enable(gl.DEPTH_TEST); }
	else
	{ gl.disable(gl.DEPTH_TEST); }

	// Render the line.***
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
	
	if (renderType === 2)
	{
		var selectionManager = magoManager.selectionManager;
		var selectionColor = magoManager.selectionColor;

		var selColor = selectionColor.getAvailableColor(undefined); 
		var idxKey = selectionColor.decodeColor3(selColor.r, selColor.g, selColor.b);

		selectionManager.setCandidateGeneral(idxKey, this);
		gl.uniform4fv(shader.oneColor4_loc, [selColor.r/255.0, selColor.g/255.0, selColor.b/255.0, 1.0]);
	}
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.***
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.LINE_STRIP, 0, vbo_vicky.vertexCount);
	
	// Check if exist selectedGeoCoord.***
	/*
	var currSelected = magoManager.selectionManager.getSelectedGeneral();
	if(currSelected !== undefined && currSelected.constructor.name === "GeographicCoord")
	{
		gl.uniform4fv(shader.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.***
		gl.uniform1f(shader.fixPointSize_loc, 10.0);
		currSelected.renderPoint(magoManager, shader, gl, renderType);
	}
	*/
	
	gl.enable(gl.DEPTH_TEST);
};

Point3DList.prototype.renderPoints = function(magoManager)
{
	
};











































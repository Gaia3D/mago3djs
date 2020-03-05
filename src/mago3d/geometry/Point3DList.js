'use strict';
/**
* Contain the list of the features of Point3D
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
	
	this.bLoop; //check whether this Point3DList represents just LineString or Ring
	
	this.geoLocDataManager;//This contains the information to change this point to Absolute CRS
	this.vboKeysContainer;//This saves the key which GPU returns to VBO
};
/**
 * Clear the properties of this feature
 */
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

/**
 * Clear vboKeysContainer
*/
Point3DList.prototype.deleteVboKeysContainer = function(magoManager)
{
	if (this.vboKeysContainer !== undefined)
	{
		var gl = magoManager.sceneState.gl;
		this.vboKeysContainer.deleteGlObjects(gl, magoManager.vboMemoryManager);
		this.vboKeysContainer = undefined;
	}
};
/**
 * Clear this.pointsArray of this feature
 * 
 */
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
/**
 * Add a feature of Point3D at the last of this.pointsArray
 * @param {Point3D} point3d the point that will be pushed at this.pointsArray
 */
Point3DList.prototype.addPoint = function(point3d)
{
	if (point3d === undefined)
	{ return; }
	
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }

	this.pointsArray.push(point3d);
};

/**
 * Return the coordinate contained at geoLocDataManager
 * @returns geoLoc
 */
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
/**
 * Add a list of Point3D at the last of this.pointsArray
 * @param point3dArray the point that will be pushed at this.pointsArray
 */
Point3DList.prototype.addPoint3dArray = function(points3dArray)
{
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }

	this.pointsArray.push.apply(this.pointsArray, points3dArray);
};
/**
 * Create a new feature of Point3D
 * @param {Number} x the x coordi of the point
 * @param {Number} y the y coordi of the point
 * @param {Number} z the z coordi of the point
 * @returns {Point3D} return the created point
 */
Point3DList.prototype.newPoint = function(x, y, z)
{
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }
	
	var point = new Point3D(x, y, z);
	this.pointsArray.push(point);
	return point;
};
/**
 * Search and return the specific feature of Point2D with the index that has at this.pointArray
 * @param {Number} idx the index of the target point at this.pointArray
 * 
 */
Point3DList.prototype.getPoint = function(idx)
{
	return this.pointsArray[idx];
};
/**
 * Return the length of this.pointArray
 * @returns {Number}
 */
Point3DList.prototype.getPointsCount = function()
{
	if (this.pointsArray === undefined)
	{ return 0; }
	
	return this.pointsArray.length;
};

/**
 * This function is used when this feature is a point3DRing.
 * Return the previous index of the given index.
 * @param {Number} idx the target index
 * @returns {Number} prevIdx
 */
Point3DList.prototype.getPrevIdx = function(idx)
{
	// Note: This function is used when this is a point3dLoop.
	var pointsCount = this.pointsArray.length;
	var prevIdx;
	
	if (idx === 0)
	{ prevIdx = pointsCount - 1; }
	else
	{ prevIdx = idx - 1; }

	return prevIdx;
};
/**
 * This function is used when this is a point3dLoop.
 * @param {Number} idx the index of the target point at this.pointArray
  * @returns {Number} prevIdx
 */
Point3DList.prototype.getNextIdx = function(idx)
{
	
	var pointsCount = this.pointsArray.length;
	var nextIdx;
	
	if (idx === pointsCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	return nextIdx;
};

/**
 * get the segement with the index of the segment
 * @param {Number} idx the index of start point of segment
 * @param {Segment3D} resultSegment the segement which will store the result segment
 * @returns {Segment3D} resultSegment 
 * 
 */
Point3DList.prototype.getSegment3D = function(idx, resultSegment3d, bLoop)
{
	// If "bLoop" = true, then this points3dList is a loop.
	// If "bLoop" = false, then this points3dList is a string.
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

/**
 * This function returns a line3d that is tangent of a point(idx). 
 * The tangentLine has the same angle with prevSegment & currSegment.
 * The tangentLine is coincident with the plane defined by prevSegment & currSegment.
 * If "bLoop" = true, then this points3dList is a loop.
 * If "bLoop" = false, then this points3dList is a string.
 * @param {Number} idx index of the point3D which will define the tangentLine3d
 * @param {Line} resultTangentLine3d
 * @param {Boolean} bLoop save the information whether this point3DList is ring or not
 * @result {Line} resultTangentLine3d a line3d that is tangent of a point(idx).
 */
Point3DList.prototype.getTangentLine3D = function(idx, resultTangentLine3d, bLoop)
{
	// The tangentLine has the same direction that the normal of the BisectionPlane.***
	if (resultTangentLine3d === undefined)
	{ resultTangentLine3d = new Line(); }
	
	var point3d = this.getPoint(idx);
	var bisectionPlane = this.getBisectionPlane(idx, undefined, bLoop);
	var direction = bisectionPlane.getNormal();
	resultTangentLine3d.setPointAndDir( point3d.x, point3d.y, point3d.z, direction.x, direction.y, direction.z );
	
	return resultTangentLine3d;
};

/**
 * This function returns a plane that has the same angle with the 2 segments of a point(idx).
 * If "bLoop" = true, then this points3dList is a loop.
 * If "bLoop" = false, then this points3dList is a string.
 * @param {Number} idx index of the point3D which will define bisection plane
 * @param {Plane} resultBisectionPlane
 * @param {Boolean} bLoop save the information whether this point3DList is ring or not
 * @result {Plane} resultBisectionPlane a plane that has the same angle with the 2 segments of a point
 */
Point3DList.prototype.getBisectionPlane = function(idx, resultBisectionPlane, bLoop)
{
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
			// The last point is an exception in string mode.
			// Take the previous segment.
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
	
	// Now, with "point3d" & "dir" make the plane.
	resultBisectionPlane.setPointAndNormal(point3d.x, point3d.y, point3d.z, dirA.x, dirA.y, dirA.z);
	
	return resultBisectionPlane;
};

/**
 * Make the vbo of this point3DList
 * @param magoManager
 */
Point3DList.getVbo = function(magoManager, point3dArray, resultVboKeysContainer)
{
	if (!point3dArray || point3dArray.length === 0) 
	{
		return;
	}
	if (resultVboKeysContainer === undefined)
	{ resultVboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var pointsCount = point3dArray.length;
	var posByteSize = pointsCount * 3;
	var posVboDataArray = new Float32Array(posByteSize);
	var point3d;
	for (var i=0; i<pointsCount; i++)
	{
		point3d = point3dArray[i];
		posVboDataArray[i*3] = point3d.x;
		posVboDataArray[i*3+1] = point3d.y;
		posVboDataArray[i*3+2] = point3d.z;
	}
	
	var vbo = resultVboKeysContainer.newVBOVertexIdxCacheKey();
	vbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager);
	return resultVboKeysContainer;
};

/**
 * Make the vbo of this point3DList
 * @param magoManager
 */
Point3DList.getVboThickLines = function(magoManager, point3dArray, resultVboKeysContainer, options)
{
	if (point3dArray === undefined || point3dArray.length < 2)
	{ return resultVboKeysContainer; }

	if (resultVboKeysContainer === undefined)
	{ resultVboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }

	var pointsCount = point3dArray.length;

	// in this case make point4d (x, y, z, w). In "w" save the sign (1 or -1) for the offset in the shader to draw triangles strip.
	var repeats = 4;
	var pointDimension = 4;
	var posByteSize = pointsCount * pointDimension * repeats;
	var posVboDataArray = new Float32Array(posByteSize);
	
	var point3d;

	for (var i=0; i<pointsCount; i++)
	{
		point3d = point3dArray[i];
		posVboDataArray[i*16] = point3d.x;
		posVboDataArray[i*16+1] = point3d.y;
		posVboDataArray[i*16+2] = point3d.z;
		posVboDataArray[i*16+3] = 1; // order.
		
		posVboDataArray[i*16+4] = point3d.x;
		posVboDataArray[i*16+5] = point3d.y;
		posVboDataArray[i*16+6] = point3d.z;
		posVboDataArray[i*16+7] = -1; // order.
		
		posVboDataArray[i*16+8] = point3d.x;
		posVboDataArray[i*16+9] = point3d.y;
		posVboDataArray[i*16+10] = point3d.z;
		posVboDataArray[i*16+11] = 2; // order.
		
		posVboDataArray[i*16+12] = point3d.x;
		posVboDataArray[i*16+13] = point3d.y;
		posVboDataArray[i*16+14] = point3d.z;
		posVboDataArray[i*16+15] = -2; // order.
	}
	
	// Check if must make color vbo.
	var colVboDataArray;
	if (options)
	{
		if (options.colorType !== undefined)
		{
			if (options.colorType === "alphaGradient")
			{
				var color4 = new Color(0.6, 0.9, 0.99, 1.0);
				colVboDataArray = new Uint8Array(pointsCount * 4 * repeats);
				for (var i=0; i<pointsCount; i++)
				{
					point3d = point3dArray[i];
					var currAlpha = Math.floor((1.0 - ((pointsCount - i)/pointsCount))*255);
					//currAlpha = 255;
					colVboDataArray[i*16] = Math.floor(color4.r*255);
					colVboDataArray[i*16+1] = Math.floor(color4.g*255);
					colVboDataArray[i*16+2] = Math.floor(color4.b*255);
					colVboDataArray[i*16+3] = currAlpha; // alpha.
					
					colVboDataArray[i*16+4] = Math.floor(color4.r*255);
					colVboDataArray[i*16+5] = Math.floor(color4.g*255);
					colVboDataArray[i*16+6] = Math.floor(color4.b*255);
					colVboDataArray[i*16+7] = currAlpha; // alpha.
					
					colVboDataArray[i*16+8] = Math.floor(color4.r*255);
					colVboDataArray[i*16+9] = Math.floor(color4.g*255);
					colVboDataArray[i*16+10] = Math.floor(color4.b*255);
					colVboDataArray[i*16+11] = currAlpha; // alpha.
					
					colVboDataArray[i*16+12] = Math.floor(color4.r*255);
					colVboDataArray[i*16+13] = Math.floor(color4.g*255);
					colVboDataArray[i*16+14] = Math.floor(color4.b*255);
					colVboDataArray[i*16+15] = currAlpha; // alpha.
				}
			}
		}
	}
	
	var vbo = resultVboKeysContainer.newVBOVertexIdxCacheKey();
	vbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager, pointDimension);
	
	if (colVboDataArray)
	{
		vbo.setDataArrayCol(colVboDataArray, magoManager.vboMemoryManager);
	}
	
	return resultVboKeysContainer;
};

/**
 * Make the vbo of this point3DList
 * @param magoManager
 */
Point3DList.prototype.makeVbo = function(magoManager)
{
	if (!this.pointsArray || this.pointsArray.length === 0) 
	{
		return;
	}
	
	this.vboKeysContainer = Point3DList.getVbo(magoManager, this.pointsArray, this.vboKeysContainer);
};

/**
 * Render this point3dlist using vbo of this list. 
 * @param magoManager
 * @param shader 
 * @param renderType
 * @param bLoop 
 * @param bEnableDepth if this is turned off, then the last-drawing feature will be shown at the top
 */
Point3DList.prototype.render = function(magoManager, shader, renderType, glPrimitive, options)
{
	if (this.vboKeysContainer === undefined)
	{ 
		this.makeVbo(magoManager); 
		return;
	}
	var gl = magoManager.getGl();
	shader.enableVertexAttribArray(shader.position3_loc);
	var bEnableDepth;
	if (bEnableDepth === undefined)
	{ bEnableDepth = true; }
	
	if (bEnableDepth)
	{ gl.enable(gl.DEPTH_TEST); }
	else
	{ gl.disable(gl.DEPTH_TEST); }

	var refMatrixType = 0;
	gl.uniform1i(shader.hasAditionalMov_loc, false);
	gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
	gl.uniform4fv(shader.oneColor4_loc, [1.0, 0.0, 0.0, 0.7]);
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.

	// Render the line.
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
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);
	
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
 * Render this point3dlist using vbo of this list. 
 * @param magoManager
 * @param shader 
 * @param renderType
 * @param bLoop 
 * @param bEnableDepth if this is turned off, then the last-drawing feature will be shown at the top
 */
Point3DList.prototype.renderAsChild = function(magoManager, shader, renderType, glPrimitive, options)
{
	if (this.vboKeysContainer === undefined)
	{ 
		this.makeVbo(magoManager); 
		return;
	}
	var gl = magoManager.getGl();
	shader.enableVertexAttribArray(shader.position3_loc);
	shader.disableVertexAttribArray(shader.normal3_loc);
	var bEnableDepth;
	if (bEnableDepth === undefined)
	{ bEnableDepth = true; }
	
	if (bEnableDepth)
	{ gl.enable(gl.DEPTH_TEST); }
	else
	{ gl.disable(gl.DEPTH_TEST); }

	var refMatrixType = 0;
	gl.uniform1i(shader.hasAditionalMov_loc, false);
	gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
	
	if (renderType === 2)
	{
		var selectionManager = magoManager.selectionManager;
		var selectionColor = magoManager.selectionColor;

		var selColor = selectionColor.getAvailableColor(undefined); 
		var idxKey = selectionColor.decodeColor3(selColor.r, selColor.g, selColor.b);

		selectionManager.setCandidateGeneral(idxKey, this);
		gl.uniform4fv(shader.oneColor4_loc, [selColor.r/255.0, selColor.g/255.0, selColor.b/255.0, 1.0]);
	}
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);
	
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
 * Render this point3dlist using vbo of this list. 
 * @param magoManager
 * @param shader 
 * @param renderType
 * @param bEnableDepth if this is turned off, then the last-drawing feature will be shown at the top
 */
Point3DList.prototype.renderThickLines__element = function(magoManager, shader, renderType, bEnableDepth, options)
{
	if (this.vboKeysContainer === undefined)
	{ return; }

	if (this.geoLocDataManager === undefined)
	{ return; }
	
	var vbo = this.vboKeysContainer.getVboKey(0);
	
	// based on https://weekly-geekly.github.io/articles/331164/index.html
	var shader = magoManager.postFxShadersManager.getShader("thickLine");
	shader.useProgram();
	shader.bindUniformGenerals();
	var gl = magoManager.getGl();
	gl.enable(gl.BLEND);
	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.disable(gl.CULL_FACE);
	
	gl.enableVertexAttribArray(shader.prev_loc);
	gl.enableVertexAttribArray(shader.current_loc);
	gl.enableVertexAttribArray(shader.next_loc);
	gl.enableVertexAttribArray(shader.order_loc);
	
	var orderLoc = gl.getAttribLocation(shader.program, "order");
	
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, shader);

	var sceneState = magoManager.sceneState;
	var projMat = sceneState.projectionMatrix;
	var viewMat = sceneState.modelViewMatrix;
	var drawingBufferWidth = sceneState.drawingBufferWidth;
	var drawingBufferHeight = sceneState.drawingBufferHeight;
	
	this.thickness = 10.0;
	
	gl.uniform4fv(shader.color_loc, [0.5, 0.7, 0.9, 1.0]);
	gl.uniform2fv(shader.viewport_loc, [drawingBufferWidth[0], drawingBufferHeight[0]]);
	gl.uniform1f(shader.thickness_loc, this.thickness);

	var vboPos = vbo.vboBufferPos;
	var dim = vboPos.dataDimensions; // in this case dimensions = 4.
	if (!vboPos.isReady(gl, magoManager.vboMemoryManager))
	{
		return;
	}
	
	// New.**********************
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPos.key);
	gl.vertexAttribPointer(shader.prev_loc, dim, gl.FLOAT, false, 0, 0);
	gl.vertexAttribPointer(shader.current_loc, dim, gl.FLOAT, false, 0, 12);
	gl.vertexAttribPointer(shader.next_loc, dim, gl.FLOAT, false, 0, 24);

	var vboOrder = vbo.getVboCustom("thickLineOrder");
	if (!vboOrder.isReady(gl, magoManager.vboMemoryManager))
	{
		return;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, vboOrder.key);
	gl.vertexAttribPointer(shader.order_loc, vboOrder.dataDimensions, gl.FLOAT, false, 0, 0);

	var indicesCount = vbo.indicesCount;
	if (!vbo.bindDataIndice(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.disable(gl.DEPTH_TEST);
	//gl.drawElements(gl.TRIANGLE_STRIP, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
	gl.drawElements(gl.LINE_STRIP, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, vbo.vertexCount-4);
	gl.enable(gl.DEPTH_TEST);
	
	
	// old.**********************************************************************************************
	//gl.bindBuffer(gl.ARRAY_BUFFER, vboPos.key);
	//gl.vertexAttribPointer(shader.prev_loc, dim, gl.FLOAT, false, 16, 0);
	//gl.vertexAttribPointer(shader.current_loc, dim, gl.FLOAT, false, 16, 64-32);
	//gl.vertexAttribPointer(shader.next_loc, dim, gl.FLOAT, false, 16, 128-32);
	
	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, vbo.vertexCount-4);

	// End old.-------------------------------------------------------------------------------------------
	

	gl.enable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
};

/**
 * Render this point3dlist using vbo of this list. 
 * @param magoManager
 * @param shader 
 * @param renderType
 * @param bEnableDepth if this is turned off, then the last-drawing feature will be shown at the top
 */
Point3DList.prototype.renderThickLines = function(magoManager, shader, renderType, bEnableDepth, options)
{
	if (this.vboKeysContainer === undefined)
	{ return; }

	if (this.geoLocDataManager === undefined)
	{ return; }
	
	var vbo = this.vboKeysContainer.getVboKey(0);
	
	// based on https://weekly-geekly.github.io/articles/331164/index.html
	var shader = magoManager.postFxShadersManager.getShader("thickLine");
	shader.useProgram();
	shader.bindUniformGenerals();
	var gl = magoManager.getGl();

	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.disable(gl.CULL_FACE);
	
	gl.enableVertexAttribArray(shader.prev_loc);
	gl.enableVertexAttribArray(shader.current_loc);
	gl.enableVertexAttribArray(shader.next_loc);
	
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, shader);

	var sceneState = magoManager.sceneState;
	var projMat = sceneState.projectionMatrix;
	var viewMat = sceneState.modelViewMatrix;
	var drawingBufferWidth = sceneState.drawingBufferWidth;
	var drawingBufferHeight = sceneState.drawingBufferHeight;
	
	this.thickness = 3.0;
	
	gl.uniform4fv(shader.color_loc, [0.5, 0.7, 0.9, 1.0]);
	gl.uniform2fv(shader.viewport_loc, [drawingBufferWidth[0], drawingBufferHeight[0]]);
	gl.uniform1f(shader.thickness_loc, this.thickness);

	var vboPos = vbo.vboBufferPos;
	var dim = vboPos.dataDimensions; // in this case dimensions = 4.
	if (!vboPos.isReady(gl, magoManager.vboMemoryManager))
	{
		return;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vboPos.key);
	gl.vertexAttribPointer(shader.prev_loc, dim, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(shader.current_loc, dim, gl.FLOAT, false, 16, 64-32);
	gl.vertexAttribPointer(shader.next_loc, dim, gl.FLOAT, false, 16, 128-32);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vbo.vertexCount-4);

	gl.enable(gl.CULL_FACE);
};

/**
 * Render this point3dlist using vbo of this list. 
 * @param magoManager
 * @param shader 
 * @param renderType
 * @param bLoop 
 * @param bEnableDepth if this is turned off, then the last-drawing feature will be shown at the top
 */
Point3DList.prototype.renderLines = function(magoManager, shader, renderType, bLoop, bEnableDepth)
{
	if (this.pointsArray === undefined)
	{ return false; }

	if (this.geoLocDataManager === undefined)
	{ return false; }
	
	var gl = magoManager.sceneState.gl;
	
	if (this.vboKeysContainer === undefined || this.vboKeysContainer.getVbosCount() === 0)
	{
		this.makeVbo(magoManager);
		return;
	}

	shader.enableVertexAttribArray(shader.position3_loc);
	
	if (bEnableDepth === undefined)
	{ bEnableDepth = true; }
	
	if (bEnableDepth)
	{ gl.enable(gl.DEPTH_TEST); }
	else
	{ gl.disable(gl.DEPTH_TEST); }

	// Render the line.
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

Point3DList.prototype.renderPoints = function(magoManager)
{
	
};











































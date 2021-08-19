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
	this.dirty = true;
};

/**
 * Clear the properties of this feature
 */
Point3DList.prototype.setDirty = function(dirty)
{
	this.dirty = dirty;
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
 * Returns the bbox of the "point3dArray".
 * 
 * @param {Array} point3dArray
 * @param {BoundingBox} resultBBox
 * @param magoManager
 */
Point3DList.getBoundingBoxOfPoints3DArray = function(point3dArray, resultBBox)
{
	if (!point3dArray || point3dArray.length === 0)
	{ return resultBBox; }

	if (!resultBBox)
	{ resultBBox = new BoundingBox(); }

	resultBBox.addPointsArray(point3dArray);
	return resultBBox;
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
Point3DList.getVboThickLinesExtruded = function(magoManager, bottomPoint3dArray, topPoint3dArray, resultVboKeysContainer, options)
{
	// this function returns a vbo for draw thickLines using stencil buffer.***
	if (bottomPoint3dArray === undefined || bottomPoint3dArray.length < 2)
	{ return resultVboKeysContainer; }

	if (resultVboKeysContainer === undefined)
	{ resultVboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }

	var bottomPointsCount = bottomPoint3dArray.length;
	var topPointsCount = topPoint3dArray.length;
	var lateralRightPointsCount = bottomPointsCount;

	// in this case make point4d (x, y, z, w). In "w" save the sign (1 or -1) for the offset in the shader to draw triangles strip.
	var repeats = 2;
	var pointDimension = 4;
	var posByteSize = (bottomPointsCount + 1 + (bottomPointsCount-1) + 1 + bottomPointsCount) * pointDimension * repeats; // pointsCount x 2, bcos we join bottomPoints & topPoints.***
	var posVboDataArray = new Float32Array(posByteSize);
	
	var point3d;
	var counter = 0;
	var height = 500.0;

	// bottomPoints.***
	for (var i=0; i<bottomPointsCount; i++)
	{
		if (i===0)
		{
			point3d = bottomPoint3dArray[i];
			posVboDataArray[counter] = point3d.x;
			posVboDataArray[counter+1] = point3d.y;
			posVboDataArray[counter+2] = point3d.z;
			posVboDataArray[counter+3] = 1; // order.
			
			posVboDataArray[counter+4] = point3d.x;
			posVboDataArray[counter+5] = point3d.y;
			posVboDataArray[counter+6] = point3d.z;
			posVboDataArray[counter+7] = -1; // order.
		}
		else
		{
			point3d = bottomPoint3dArray[i];
			posVboDataArray[counter] = point3d.x;
			posVboDataArray[counter+1] = point3d.y;
			posVboDataArray[counter+2] = point3d.z;
			posVboDataArray[counter+3] = 2; // order.
			
			posVboDataArray[counter+4] = point3d.x;
			posVboDataArray[counter+5] = point3d.y;
			posVboDataArray[counter+6] = point3d.z;
			posVboDataArray[counter+7] = -2; // order.
		}

		counter += 8;
	}


	// frontPoints.***
	// Only add the 1rst bottomPoint.***
	var vbo = resultVboKeysContainer.newVBOVertexIdxCacheKey();
	vbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager, pointDimension);
	
	//if (colVboDataArray)
	//{
	//	vbo.setDataArrayCol(colVboDataArray, magoManager.vboMemoryManager);
	//}
	
	return resultVboKeysContainer;
};

/**
 * Make the vbo of this point3DList
 * @param magoManager
 */
Point3DList.getVboThickLinesExtruded__original = function(magoManager, bottomPoint3dArray, topPoint3dArray, resultVboKeysContainer, options)
{
	// this function returns a vbo for draw thickLines using stencil buffer.***
	if (bottomPoint3dArray === undefined || bottomPoint3dArray.length < 2)
	{ return resultVboKeysContainer; }

	if (resultVboKeysContainer === undefined)
	{ resultVboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }

	var bottomPointsCount = bottomPoint3dArray.length;
	var topPointsCount = topPoint3dArray.length;
	var lateralRightPointsCount = bottomPointsCount;

	// in this case make point4d (x, y, z, w). In "w" save the sign (1 or -1) for the offset in the shader to draw triangles strip.
	var repeats = 4;
	var pointDimension = 4;
	var posByteSize = (bottomPointsCount + 1 + (bottomPointsCount-1) + 1 + bottomPointsCount) * pointDimension * repeats; // pointsCount x 2, bcos we join bottomPoints & topPoints.***
	var posVboDataArray = new Float32Array(posByteSize);
	
	var point3d;
	var counter = 0;
	var height = 500.0;

	// bottomPoints.***
	for (var i=0; i<bottomPointsCount; i++)
	{
		point3d = bottomPoint3dArray[i];
		posVboDataArray[counter] = point3d.x;
		posVboDataArray[counter+1] = point3d.y;
		posVboDataArray[counter+2] = point3d.z;
		posVboDataArray[counter+3] = 1; // order.
		
		posVboDataArray[counter+4] = point3d.x;
		posVboDataArray[counter+5] = point3d.y;
		posVboDataArray[counter+6] = point3d.z;
		posVboDataArray[counter+7] = -1; // order.
		
		posVboDataArray[counter+8] = point3d.x;
		posVboDataArray[counter+9] = point3d.y;
		posVboDataArray[counter+10] = point3d.z;
		posVboDataArray[counter+11] = 2; // order.
		
		posVboDataArray[counter+12] = point3d.x;
		posVboDataArray[counter+13] = point3d.y;
		posVboDataArray[counter+14] = point3d.z;
		posVboDataArray[counter+15] = -2; // order.
		counter += 16;
	}

	// rearPoints. add 1 face.***
	point3d = bottomPoint3dArray[bottomPointsCount-1];
	posVboDataArray[counter] = point3d.x;
	posVboDataArray[counter+1] = point3d.y;
	posVboDataArray[counter+2] = point3d.z;
	posVboDataArray[counter+3] = 11; // order.
	
	posVboDataArray[counter+4] = point3d.x;
	posVboDataArray[counter+5] = point3d.y;
	posVboDataArray[counter+6] = point3d.z;
	posVboDataArray[counter+7] = -11; // order.
	
	posVboDataArray[counter+8] = point3d.x;
	posVboDataArray[counter+9] = point3d.y;
	posVboDataArray[counter+10] = point3d.z;
	posVboDataArray[counter+11] = 12; // order.
	
	posVboDataArray[counter+12] = point3d.x;
	posVboDataArray[counter+13] = point3d.y;
	posVboDataArray[counter+14] = point3d.z;
	posVboDataArray[counter+15] = -12; // order.
	counter += 16;

	// topPoints, in reverse order.***
	for (var i=bottomPointsCount-2; i>=0; i--)
	{
		point3d = bottomPoint3dArray[i];
		posVboDataArray[counter] = point3d.x;
		posVboDataArray[counter+1] = point3d.y;
		posVboDataArray[counter+2] = point3d.z;
		posVboDataArray[counter+3] = 21; // order.
		
		posVboDataArray[counter+4] = point3d.x;
		posVboDataArray[counter+5] = point3d.y;
		posVboDataArray[counter+6] = point3d.z;
		posVboDataArray[counter+7] = -21; // order.
		
		posVboDataArray[counter+8] = point3d.x;
		posVboDataArray[counter+9] = point3d.y;
		posVboDataArray[counter+10] = point3d.z;
		posVboDataArray[counter+11] = 22; // order.
		
		posVboDataArray[counter+12] = point3d.x;
		posVboDataArray[counter+13] = point3d.y;
		posVboDataArray[counter+14] = point3d.z;
		posVboDataArray[counter+15] = -22; // order.
		counter += 16;
	}

	// frontPoints. add 1 face.***
	point3d = bottomPoint3dArray[0];
	posVboDataArray[counter] = point3d.x;
	posVboDataArray[counter+1] = point3d.y;
	posVboDataArray[counter+2] = point3d.z;
	posVboDataArray[counter+3] = 31; // order.
	
	posVboDataArray[counter+4] = point3d.x;
	posVboDataArray[counter+5] = point3d.y;
	posVboDataArray[counter+6] = point3d.z;
	posVboDataArray[counter+7] = -31; // order.
	
	posVboDataArray[counter+8] = point3d.x;
	posVboDataArray[counter+9] = point3d.y;
	posVboDataArray[counter+10] = point3d.z;
	posVboDataArray[counter+11] = 32; // order.
	
	posVboDataArray[counter+12] = point3d.x;
	posVboDataArray[counter+13] = point3d.y;
	posVboDataArray[counter+14] = point3d.z;
	posVboDataArray[counter+15] = -32; // order.
	counter += 16;

	// lateral LeftPoints.***
	// Lateral trinagle
	for (var i=0; i<bottomPointsCount; i++)
	{
		point3d = bottomPoint3dArray[i];
		posVboDataArray[counter] = point3d.x;
		posVboDataArray[counter+1] = point3d.y;
		posVboDataArray[counter+2] = point3d.z;
		posVboDataArray[counter+3] = 41; // order.
		
		posVboDataArray[counter+4] = point3d.x;
		posVboDataArray[counter+5] = point3d.y;
		posVboDataArray[counter+6] = point3d.z;
		posVboDataArray[counter+7] = -41; // order.
		
		posVboDataArray[counter+8] = point3d.x;
		posVboDataArray[counter+9] = point3d.y;
		posVboDataArray[counter+10] = point3d.z;
		posVboDataArray[counter+11] = 42; // order.
		
		posVboDataArray[counter+12] = point3d.x;
		posVboDataArray[counter+13] = point3d.y;
		posVboDataArray[counter+14] = point3d.z;
		posVboDataArray[counter+15] = -42; // order.
		counter += 16;
	}
	

	// front. add a linking strip.***
	/*
	var topPoint3d = topPoint3dArray[0];
	var bottomPoint3d = bottomPoint3dArray[0];
	posVboDataArray[counter] = topPoint3d.x;
	posVboDataArray[counter+1] = topPoint3d.y;
	posVboDataArray[counter+2] = topPoint3d.z;
	posVboDataArray[counter+3] = 1; // order.
	
	posVboDataArray[counter+4] = topPoint3d.x;
	posVboDataArray[counter+5] = topPoint3d.y;
	posVboDataArray[counter+6] = topPoint3d.z;
	posVboDataArray[counter+7] = -1; // order.
	
	posVboDataArray[counter+8] = bottomPoint3d.x;
	posVboDataArray[counter+9] = bottomPoint3d.y;
	posVboDataArray[counter+10] = bottomPoint3d.z;
	posVboDataArray[counter+11] = 2; // order.
	
	posVboDataArray[counter+12] = bottomPoint3d.x;
	posVboDataArray[counter+13] = bottomPoint3d.y;
	posVboDataArray[counter+14] = bottomPoint3d.z;
	posVboDataArray[counter+15] = -2; // order.
	counter += 16;

	// lateral right.***
	for (var i=0; i<bottomPointsCount; i++)
	{
		var topPoint3d = topPoint3dArray[i];
		var bottomPoint3d = bottomPoint3dArray[i];
		posVboDataArray[counter] = topPoint3d.x;
		posVboDataArray[counter+1] = topPoint3d.y;
		posVboDataArray[counter+2] = topPoint3d.z;
		posVboDataArray[counter+3] = -1; // order.
		
		posVboDataArray[counter+4] = bottomPoint3d.x;
		posVboDataArray[counter+5] = bottomPoint3d.y;
		posVboDataArray[counter+6] = bottomPoint3d.z;
		posVboDataArray[counter+7] = -1; // order.
		
		posVboDataArray[counter+8] = topPoint3d.x;
		posVboDataArray[counter+9] = topPoint3d.y;
		posVboDataArray[counter+10] = topPoint3d.z;
		posVboDataArray[counter+11] = -1; // order.
		
		posVboDataArray[counter+12] = bottomPoint3d.x;
		posVboDataArray[counter+13] = bottomPoint3d.y;
		posVboDataArray[counter+14] = bottomPoint3d.z;
		posVboDataArray[counter+15] = -1; // order.
		counter += 16;
	}
*/
	// frontPoints.***
	// Only add the 1rst bottomPoint.***
	var vbo = resultVboKeysContainer.newVBOVertexIdxCacheKey();
	vbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager, pointDimension);
	
	//if (colVboDataArray)
	//{
	//	vbo.setDataArrayCol(colVboDataArray, magoManager.vboMemoryManager);
	//}
	
	return resultVboKeysContainer;
};

/**
 * Returns renderableObject of the points3dArray.
 */
Point3DList.getRenderableObjectOfPoints3DArray = function(points3dLCArray, magoManager, geoLoc, options) 
{
	if (points3dLCArray === undefined || points3dLCArray.length === 0)
	{ return undefined; }
	
	// Create a vectorMesh.
	if (options === undefined)
	{
		options = {};
	}

	if (options.thickness === undefined)
	{ options.thickness = 2.0; }

	if (options.color === undefined)
	{ options.color = new Color(1.0, 0.3, 0.3, 1.0); }

	var vectorMesh = new VectorMesh(options);
	
	var optionsThickLine = {
		colorType: "alphaGradient"
	};
	vectorMesh.vboKeysContainer = Point3DList.getVboThickLines(magoManager, points3dLCArray, vectorMesh.vboKeysContainer, options);
	
	var renderableObject = new RenderableObject();
	renderableObject.geoLocDataManager = new GeoLocationDataManager();
	renderableObject.geoLocDataManager.addGeoLocationData(geoLoc);
	renderableObject.objectType = MagoRenderable.OBJECT_TYPE.VECTORMESH;

	// calculate vectorMesh "BoundingSphereWC".***********************************************
	renderableObject.boundingSphereWC = new BoundingSphere();
	var positionWC = geoLoc.position;
	var bboxLC = Point3DList.getBoundingBoxOfPoints3DArray(points3dLCArray, undefined);
	var radiusAprox = bboxLC.getRadiusAprox();
	renderableObject.boundingSphereWC.setCenterPoint(positionWC.x, positionWC.y, positionWC.z);
	renderableObject.boundingSphereWC.setRadius(radiusAprox);
	// End calculating boundingSphereWC.------------------------------------------------------

	renderableObject.objectsArray.push(vectorMesh);
	
	return renderableObject;
};
/**
 * Make the vboDataArray of point3dArray for thickLines.
 * @param magoManager
 */
Point3DList.getThickLinesPositionDataArray = function(point3dArray, resultPosVboDataArray, options)
{
	var pointsCount = point3dArray.length;

	// in this case make point4d (x, y, z, w). In "w" save the sign (1 or -1) for the offset in the shader to draw triangles strip.
	var repeats = 4;
	var pointDimension = 4;
	var posByteSize = pointsCount * pointDimension * repeats;

	if (!resultPosVboDataArray || resultPosVboDataArray.length < posByteSize)
	{
		resultPosVboDataArray = new Float32Array(posByteSize);
	}
	
	var point3d;
	var startIdx = 0;
	var endIdx = pointsCount;

	if (options)
	{
		// startIdx & endIdx exists for updatingData for modified curves.
		if (options.startIdx)
		{ startIdx = options.startIdx; }

		if (options.endIdx)
		{ endIdx = options.endIdx; }
	}

	for (var i=0; i<pointsCount; i++)
	{
		point3d = point3dArray[i];
		resultPosVboDataArray[i*16] = point3d.x;
		resultPosVboDataArray[i*16+1] = point3d.y;
		resultPosVboDataArray[i*16+2] = point3d.z;
		resultPosVboDataArray[i*16+3] = 1; // order.
		
		resultPosVboDataArray[i*16+4] = point3d.x;
		resultPosVboDataArray[i*16+5] = point3d.y;
		resultPosVboDataArray[i*16+6] = point3d.z;
		resultPosVboDataArray[i*16+7] = -1; // order.
		
		resultPosVboDataArray[i*16+8] = point3d.x;
		resultPosVboDataArray[i*16+9] = point3d.y;
		resultPosVboDataArray[i*16+10] = point3d.z;
		resultPosVboDataArray[i*16+11] = 2; // order.
		
		resultPosVboDataArray[i*16+12] = point3d.x;
		resultPosVboDataArray[i*16+13] = point3d.y;
		resultPosVboDataArray[i*16+14] = point3d.z;
		resultPosVboDataArray[i*16+15] = -2; // order.
	}

	return resultPosVboDataArray;
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

	// Check if exist colorsArray.***
	if (options.colorsArray)
	{
		var colArray = options.colorsArray;
		// use colorsArray.***
		colVboDataArray = new Uint8Array(pointsCount * 4 * repeats);
			
		var currColor4;
		var w = 1.0; // weight.***
		var r, g, b, a;
		for (var i=0; i<pointsCount; i++)
		{
			w = 1.0 - (i/(pointsCount-1));
			//currColor4 = Color.mix(strColor4, endColor4, w);
			currColor4 = colArray[i];

			if (!currColor4)
			{
				var hola = 0;
			}
			
			colVboDataArray[i*16] = Math.floor(currColor4.r*255);
			colVboDataArray[i*16+1] = Math.floor(currColor4.g*255);
			colVboDataArray[i*16+2] = Math.floor(currColor4.b*255);
			colVboDataArray[i*16+3] = Math.floor(currColor4.a*255);
			
			colVboDataArray[i*16+4] = Math.floor(currColor4.r*255);
			colVboDataArray[i*16+5] = Math.floor(currColor4.g*255);
			colVboDataArray[i*16+6] = Math.floor(currColor4.b*255);
			colVboDataArray[i*16+7] = Math.floor(currColor4.a*255);
			
			colVboDataArray[i*16+8] = Math.floor(currColor4.r*255);
			colVboDataArray[i*16+9] = Math.floor(currColor4.g*255);
			colVboDataArray[i*16+10] = Math.floor(currColor4.b*255);
			colVboDataArray[i*16+11] = Math.floor(currColor4.a*255);
			
			colVboDataArray[i*16+12] = Math.floor(currColor4.r*255);
			colVboDataArray[i*16+13] = Math.floor(currColor4.g*255);
			colVboDataArray[i*16+14] = Math.floor(currColor4.b*255);
			colVboDataArray[i*16+15] = Math.floor(currColor4.a*255);
		}
	}
	else
	{
		// Check if must make color vbo.
		var strColor4 = new Color(0.6, 0.9, 0.99, 1.0);
		var endColor4 = new Color(0.6, 0.9, 0.99, 1.0);
		
		var colVboDataArray;
		var makeColorVbo = false;
		if (options)
		{
			if (options.color)
			{
				strColor4.setRGBA(options.color.r, options.color.g, options.color.b, options.color.a);
				endColor4.setRGBA(options.color.r, options.color.g, options.color.b, options.color.a);
			}
			
			if (options.startColor)
			{
				strColor4.setRGBA(options.startColor.r, options.startColor.g, options.startColor.b, options.startColor.a);
				makeColorVbo = true;
			}
			
			if (options.endColor)
			{
				endColor4.setRGBA(options.endColor.r, options.endColor.g, options.endColor.b, options.endColor.a);
				makeColorVbo = true;
			}
		}
		
		// Make the color vbo if necessary.
		if (makeColorVbo)
		{
			colVboDataArray = new Uint8Array(pointsCount * 4 * repeats);
			
			var currColor4 = new Color(0.6, 0.9, 0.99, 1.0);
			currColor4.copyFrom(strColor4);
			var w = 1.0; // weight.***
			var r, g, b, a;
			for (var i=0; i<pointsCount; i++)
			{
				w = 1.0 - (i/(pointsCount-1));
				currColor4 = Color.mix(strColor4, endColor4, w);
				
				colVboDataArray[i*16] = Math.floor(currColor4.r*255);
				colVboDataArray[i*16+1] = Math.floor(currColor4.g*255);
				colVboDataArray[i*16+2] = Math.floor(currColor4.b*255);
				colVboDataArray[i*16+3] = Math.floor(currColor4.a*255);
				
				colVboDataArray[i*16+4] = Math.floor(currColor4.r*255);
				colVboDataArray[i*16+5] = Math.floor(currColor4.g*255);
				colVboDataArray[i*16+6] = Math.floor(currColor4.b*255);
				colVboDataArray[i*16+7] = Math.floor(currColor4.a*255);
				
				colVboDataArray[i*16+8] = Math.floor(currColor4.r*255);
				colVboDataArray[i*16+9] = Math.floor(currColor4.g*255);
				colVboDataArray[i*16+10] = Math.floor(currColor4.b*255);
				colVboDataArray[i*16+11] = Math.floor(currColor4.a*255);
				
				colVboDataArray[i*16+12] = Math.floor(currColor4.r*255);
				colVboDataArray[i*16+13] = Math.floor(currColor4.g*255);
				colVboDataArray[i*16+14] = Math.floor(currColor4.b*255);
				colVboDataArray[i*16+15] = Math.floor(currColor4.a*255);
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
	this.deleteVboKeysContainer(magoManager);
	this.vboKeysContainer = Point3DList.getVbo(magoManager, this.pointsArray, this.vboKeysContainer);
	this.dirty = false;
};

/**
 * Make the vbo of this point3DList
 * @param magoManager
 */
Point3DList.prototype.makeThickLinesVbo = function(magoManager, options)
{
	if (!this.pointsArray || this.pointsArray.length === 0) 
	{
		return;
	}
	this.deleteVboKeysContainer(magoManager);
	// in "options" there are color information (options.color).
	this.vboKeysContainer = Point3DList.getVboThickLines(magoManager, this.pointsArray, this.vboKeysContainer, options);
	this.dirty = false;
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
	if (this.vboKeysContainer === undefined || this.dirty)
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
	{ 
		this.makeThickLinesVbo(magoManager, options);
		return; 
	}

	if (this.geoLocDataManager === undefined)
	{ return; }
	
	var vbo = this.vboKeysContainer.getVboKey(0);
	
	// based on https://weekly-geekly.github.io/articles/331164/index.html
	var shader = magoManager.postFxShadersManager.getShader("thickLine");
	shader.useProgram();
	shader.bindUniformGenerals();
	var gl = magoManager.getGl();

	//gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.disable(gl.CULL_FACE);
	
	gl.enableVertexAttribArray(shader.prev_loc);
	gl.enableVertexAttribArray(shader.current_loc);
	gl.enableVertexAttribArray(shader.next_loc);
	
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, shader);

	var sceneState = magoManager.sceneState;
	//var projMat = sceneState.projectionMatrix;
	//var viewMat = sceneState.modelViewMatrix;
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
Point3DList.prototype.renderLines = function(magoManager, shader, renderType, bLoop, bEnableDepth, glPrimitive)
{
	if (this.pointsArray === undefined)
	{ return false; }

	if (this.geoLocDataManager === undefined)
	{ return false; }
	
	var gl = magoManager.sceneState.gl;
	
	if (this.vboKeysContainer === undefined || this.vboKeysContainer.getVbosCount() === 0 || this.dirty)
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
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	if (glPrimitive === undefined)
	{ glPrimitive = gl.LINE_STRIP; }
	
	gl.drawArrays(glPrimitive, 0, vbo_vicky.vertexCount);
	
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

Point3DList.prototype.renderPoints = function(magoManager, shader, renderType, bEnableDepth)
{
	if (this.pointsArray === undefined)
	{ return false; }

	if (this.geoLocDataManager === undefined)
	{ return false; }
	
	var gl = magoManager.sceneState.gl;
	
	if (this.vboKeysContainer === undefined || this.vboKeysContainer.getVbosCount() === 0 || this.dirty)
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

Point3DList.prototype.renderPointsIndividually = function(magoManager, shader, renderType, bEnableDepth)
{
	if (this.pointsArray === undefined)
	{ return false; }

	if (this.geoLocDataManager === undefined)
	{ return false; }
	
	var gl = magoManager.sceneState.gl;
	
	if (this.vboKeysContainer === undefined || this.vboKeysContainer.getVbosCount() === 0 || this.dirty)
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
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	var pointsCount = this.pointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		gl.drawArrays(gl.POINTS, i, 1);
	}
	
	gl.enable(gl.DEPTH_TEST);
};











































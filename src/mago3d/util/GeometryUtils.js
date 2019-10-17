'use strict';
/**
* Utils for geometry.
* @class GeometryUtils
*/
var GeometryUtils = function() 
{
	if (!(this instanceof GeometryUtils)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
};

/**
 * Given an idx, this function returns the next idx of an array.
 * @param {Number} currIdx 
 * @param {Number} pointsCount The points count of the array.
 * @Return {Number} The next idx.
 */
GeometryUtils.projectPoint3DInToBestPlaneToProject = function(point3d, bestPlaneToProject, resultPoint2d)
{
	// This function returns projected point2d.
	if (resultPoint2d === undefined)
	{ resultPoint2d = new Point2D(); }
	
	if (bestPlaneToProject === 0)
	{
		//"xy";
		resultPoint2d.set(point3d.x, point3d.y);
	}
	else if (bestPlaneToProject === 1)
	{
		//"yz";
		resultPoint2d.set(point3d.y, point3d.z);
	}
	else if (bestPlaneToProject === 2)
	{
		//"xz";
		resultPoint2d.set(point3d.x, point3d.z);
	}
	
	return resultPoint2d;
};

/**
 * Given an idx, this function returns the next idx of an array.
 * @param {Number} currIdx 
 * @param {Number} pointsCount The points count of the array.
 * @Return {Number} The next idx.
 */
GeometryUtils.projectTriangle3DInToBestPlaneToProject = function(triangle3d, bestPlaneToProject, resultTriangle2d)
{
	// This function returns projected triangle2d.
	if (resultTriangle2d === undefined)
	{ resultTriangle2d = new Triangle2D(); }
	
	var point3d0 = triangle3d.vertex0.getPosition();
	var point2d0 = GeometryUtils.projectPoint3DInToBestPlaneToProject(point3d0, bestPlaneToProject, undefined);
	
	var point3d1 = triangle3d.vertex1.getPosition();
	var point2d1 = GeometryUtils.projectPoint3DInToBestPlaneToProject(point3d1, bestPlaneToProject, undefined);
	
	var point3d2 = triangle3d.vertex2.getPosition();
	var point2d2 = GeometryUtils.projectPoint3DInToBestPlaneToProject(point3d2, bestPlaneToProject, undefined);
	
	resultTriangle2d.setPoints(point2d0, point2d1, point2d2);
	
	return resultTriangle2d;
};

/**
 * Given an idx, this function returns the next idx of an array.
 * @param {Number} currIdx 
 * @param {Number} pointsCount The points count of the array.
 * @Return {Number} The next idx.
 */
GeometryUtils.getNextIdx = function(currIdx, pointsCount)
{
	if (currIdx === pointsCount - 1)
	{ return 0; }
	else
	{ return currIdx + 1; }
};

/**
 * Given an idx, this function returns the previous idx of an array.
 * @param {Number} currIdx 
 * @param {Number} pointsCount The points count of the array.
 * @Return {Number} The previous idx.
 */
GeometryUtils.getPrevIdx = function(currIdx, pointsCount)
{
	if (currIdx === 0)
	{ return pointsCount - 1; }
	else
	{ return currIdx - 1; }
};

/**
 * This function makes the triangles vertices indices for a regular grid.
 * @param {Number} numCols Grid columns count.
 * @param {Number} numRows Grid rows count.
 * @param {Uint16Array/undefined} resultIndicesArray
 * @param {Object} options 
 * @Return {Uint16Array} resultIndicesArray
 */
GeometryUtils.getIndicesTrianglesRegularNet = function(numCols, numRows, resultIndicesArray, options)
{
	// given a regular net this function returns triangles vertices indices of the net.
	var verticesCount = numCols * numRows;
	var trianglesCount = (numCols-1) * (numRows-1) * 2;
	if (resultIndicesArray === undefined)
	{ resultIndicesArray = new Uint16Array(trianglesCount * 3); }
	
	var idx_1, idx_2, idx_3;
	var idxCounter = 0;
	
	var bLoopColumns = false; // Default.***
	var bTrianglesSenseCCW = true;
	if (options !== undefined)
	{
		if (options.bLoopColumns !== undefined)
		{ bLoopColumns = options.bLoopColumns; }
	
		if (options.bTrianglesSenseCCW !== undefined)
		{ bTrianglesSenseCCW = options.bTrianglesSenseCCW; }
	}
	
	for (var row = 0; row<numRows-1; row++)
	{
		for (var col=0; col<numCols-1; col++)
		{
			// there are 2 triangles: triA, triB.
			idx_1 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row);
			idx_2 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row);
			idx_3 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row+1);
			
			if (bTrianglesSenseCCW)
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			}
			else
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			}
			
			idx_1 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row);
			idx_2 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row+1);
			idx_3 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row+1);
			
			if (bTrianglesSenseCCW)
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			}
			else 
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			}
		}
	}
	
	if (bLoopColumns)
	{
		var firstCol = 0;
		var endCol = numCols;
		for (var row = 0; row<numRows-1; row++)
		{
			// there are triangles between lastColumn & 1rstColumn.
			// there are 2 triangles: triA, triB.
			idx_1 = VertexMatrix.getIndexOfArray(numCols, numRows, endCol, row);
			idx_2 = VertexMatrix.getIndexOfArray(numCols, numRows, firstCol, row);
			idx_3 = VertexMatrix.getIndexOfArray(numCols, numRows, endCol, row+1);
			if (bTrianglesSenseCCW)
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			}
			else 
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			}
			
			idx_1 = VertexMatrix.getIndexOfArray(numCols, numRows, firstCol, row);
			idx_2 = VertexMatrix.getIndexOfArray(numCols, numRows, firstCol, row+1);
			idx_3 = VertexMatrix.getIndexOfArray(numCols, numRows, endCol, row+1);
			if (bTrianglesSenseCCW)
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			}
			else 
			{
				resultIndicesArray[idxCounter] = idx_1; idxCounter++;
				resultIndicesArray[idxCounter] = idx_3; idxCounter++;
				resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			}
		}
	}
	
	return resultIndicesArray;
};

































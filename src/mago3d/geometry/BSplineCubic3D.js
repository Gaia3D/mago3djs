'use strict';

/**
 * BSplineCubic3D represented in 3D
 * @class BSplineCubic3D
 */
var BSplineCubic3D = function() 
{
	if (!(this instanceof BSplineCubic3D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * The geographic points that represents the knotPoints.
	 * @type {GeographicCoordsList}
	 * @default undefined
	 */
	this.geoCoordsList; 
	
	/**
	 * GeoLocationDataManager is a class object that contains GeoLocationData objects in an array.
	 * @type {GeoLocationDataManager}
	 * @default undefined
	 */
	this.geoLocDataManager;
	
	
	this.knotPoints3dList;
	this.interpolatedPoints3dList;
	this.controlPoints3dMap; // idxPoint : {prevCPoint, nextCPoint}
	
	this.segmentLengthArray; // Length for each segment (on the interpolated).***
	this.dirty = true;
	
	this.vtxProfilesList;
	this.vboKeysContainer;
	this.vboKeysContainerEdges;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype.getGeographicCoordsList = function() 
{
	if (this.geoCoordsList === undefined)
	{
		this.geoCoordsList = new GeographicCoordsList();
		this.geoCoordsList.owner = this;
	}
	
	return this.geoCoordsList;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype.renderPoints = function(magoManager, shader, renderType) 
{
	if (this.geoCoordsList === undefined)
	{ return false; }
	
	var bLoop = false, bEnableDepth = false;
	
	this.geoCoordsList.renderPoints(magoManager, shader, renderType, bEnableDepth);
	this.geoCoordsList.renderLines(magoManager, shader, renderType, bLoop, bEnableDepth);
	
	var gl = magoManager.sceneState.gl;
	
	// Render interpolated points.***
	if (this.interpolatedPoints3dList !== undefined)
	{
		var shader = magoManager.postFxShadersManager.getShader("pointsCloud");
		shader.useProgram();
		shader.disableVertexAttribArrayAll();
		shader.resetLastBuffersBinded();
		shader.enableVertexAttribArray(shader.position3_loc);
		shader.bindUniformGenerals();
	
		gl.uniform1i(shader.bPositionCompressed_loc, false);
		if (renderType === 1)
		{
			gl.uniform1i(shader.bUse1Color_loc, true);
			
			if (shader.oneColor4_loc !== undefined && shader.oneColor4_loc !== null)
			{ gl.uniform4fv(shader.oneColor4_loc, [1.0, 0.0, 0.0, 1.0]); } //.
		}
		gl.uniform1f(shader.fixPointSize_loc, 5.0);
		gl.uniform1i(shader.bUseFixPointSize_loc, true);
		this.interpolatedPoints3dList.renderLines(magoManager, shader, renderType, bLoop, bEnableDepth);
	}
	
	// Render controlPoints.***
	if (this.controlPoints3dMap !== undefined)
	{
		// Check if exist control points.***
		//var lineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype.makeControlPoints = function(controlPointArmLength, magoManager) 
{
	// This function makes the controlPoints automatically for the geographicsPoints.***
	// There are 2 controlPoints for each point3d : InningControlPoint & OutingControlPoint.***
	
	// 1rst, make knotPoints if no exist.***
	if (this.knotPoints3dList === undefined)
	{
		if (this.geoCoordsList.points3dList === undefined)
		{ this.geoCoordsList.makeLines(magoManager); }
		
		this.knotPoints3dList = new Point3DList();
		this.knotPoints3dList.pointsArray = this.geoCoordsList.points3dList.pointsArray;
		
		// Transfer the geoLocationDataManager too.***
		this.knotPoints3dList.geoLocDataManager = this.geoCoordsList.points3dList.geoLocDataManager;
	}
	
	if (this.knotPoints3dList.pointsArray === undefined)
	{ return; }

	this.controlPoints3dMap = {};
	
	var bLoop = false;
	
	var currPoint;
	var prevPoint;
	var nextPoint;
	var prevSegment;
	var currSegment;
	var inningDist; // the inningControlPoint length.***
	var outingDist; // the outingControlPoint length.***
	
	if (controlPointArmLength === undefined)
	{ controlPointArmLength = 0.1; }
		
	var pointsCount = this.knotPoints3dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		currPoint = this.knotPoints3dList.getPoint(i);
		prevSegment;
		currSegment;
		
		if (i === 0)
		{
			// In this case there are no inningControlPoint.***
			nextPoint = this.knotPoints3dList.getPoint(i+1);
			outingDist = controlPointArmLength;
			
			// The outingControlPoint is in the segment, to the 20% of the currentPoint.***
			var outingControlPoint = new Point3D();
			outingControlPoint.set(currPoint.x * (1-outingDist) + nextPoint.x * outingDist, currPoint.y * (1-outingDist) + nextPoint.y * outingDist, currPoint.z * (1-outingDist) + nextPoint.z * outingDist);
			this.controlPoints3dMap[i] = {"inningControlPoint" : undefined, 
										  "outingControlPoint" : outingControlPoint};
		}
		else if ( i === pointsCount-1)
		{
			// In this case there are no outingControlPoint.***
			prevPoint = this.knotPoints3dList.getPoint(i-1);
			inningDist = controlPointArmLength;
			
			var inningControlPoint = new Point3D();
			inningControlPoint.set(currPoint.x * (1-inningDist) + prevPoint.x * inningDist, currPoint.y * (1-inningDist) + prevPoint.y * inningDist, currPoint.z * (1-inningDist) + prevPoint.z * inningDist);
			this.controlPoints3dMap[i] = {"inningControlPoint" : inningControlPoint, 
										  "outingControlPoint" : undefined};
		}
		else 
		{
			prevPoint = this.knotPoints3dList.getPoint(i-1);
			nextPoint = this.knotPoints3dList.getPoint(i+1);
			
			// Find the tangent line3d of the current point.***
			var tangentLine3d = this.knotPoints3dList.getTangentLine3D(i, undefined, bLoop);
			var dir = tangentLine3d.direction;
			
			// InningControlPoint.***
			inningDist = currPoint.distToPoint(prevPoint) * controlPointArmLength;
			var inningControlPoint = new Point3D();
			inningControlPoint.set(currPoint.x - dir.x * inningDist, currPoint.y - dir.y * inningDist, currPoint.z - dir.z * inningDist);
			
			// OutingControlPoint.***
			outingDist = currPoint.distToPoint(nextPoint) * controlPointArmLength;
			var outingControlPoint = new Point3D();
			outingControlPoint.set(currPoint.x + dir.x * outingDist, currPoint.y + dir.y * outingDist, currPoint.z + dir.z * outingDist);
			
			this.controlPoints3dMap[i] = {"inningControlPoint" : inningControlPoint, 
										  "outingControlPoint" : outingControlPoint};
		}
		
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype.makeInterpolatedPoints = function() 
{
	if (this.knotPoints3dList === undefined)
	{ return; }

	if (this.controlPoints3dMap === undefined)
	{ this.makeControlPoints(); }

	if (this.interpolatedPoints3dList === undefined)
	{
		this.interpolatedPoints3dList = new Point3DList();
	}
	
	var interpolationsCount = 10;
	var increT = 1/interpolationsCount;
	var t;
	var interpolatedPointsArray = [];
	
	var bLoop = false;
	
	// For each segment, make the bezier curve interpolated points.***
	var pointsCount = this.knotPoints3dList.getPointsCount();
	for (var i=0; i<pointsCount-1; i++)
	{
		var currSegment = this.knotPoints3dList.getSegment3D(i, undefined, bLoop);
		var strPoint = currSegment.startPoint3d;
		var endPoint = currSegment.endPoint3d;
		
		var strControlPoint = this.controlPoints3dMap[i].outingControlPoint;
		var endControlPoint = this.controlPoints3dMap[i+1].inningControlPoint;
		
		BSplineCubic3D.makeForSegment(strPoint, strControlPoint, endControlPoint, endPoint, interpolationsCount, interpolatedPointsArray);
	}
	
	// Transfer pointsArray.***
	this.interpolatedPoints3dList.pointsArray = interpolatedPointsArray;
	
	// Transfer geoLocationDataManager.***
	this.interpolatedPoints3dList.geoLocDataManager = this.knotPoints3dList.geoLocDataManager;
};

/**
 * This function returns the length of the splineSegment at the unitaryPosition.
 */
BSplineCubic3D.getLengthForSegment = function(strPoint, strControlPoint, endControlPoint, endPoint, unitaryPosition, interpolationsCount) 
{
	if (unitaryPosition === undefined)
	{ unitaryPosition = 1; }
	
	if (interpolationsCount === undefined)
	{ interpolationsCount = 10; }
	
	// 1rst, make the interpolated curve.***
	var resultInterpolatedPointsArray = BSplineCubic3D.makeForSegmentPartial(strPoint, strControlPoint, endControlPoint, endPoint, unitaryPosition, interpolationsCount, undefined);
	
	// Now, calculate the total length of "N" segments.***
	var resultLength = 0;
	var pointA, pointB;
	var pointsCount = resultInterpolatedPointsArray.length;
	for (var i=0; i<pointsCount-1; i++)
	{
		pointA = resultInterpolatedPointsArray[i];
		pointB = resultInterpolatedPointsArray[i+1];
		resultLength += pointA.distToPoint(pointB);
	}
	
	return resultLength;
};

/**
 * This function returns the unitaryPosition of the splineSegment at the linearPosition.
 */
BSplineCubic3D.getUnitaryPositionForSegmentAtLinearPosition = function(strPoint, strControlPoint, endControlPoint, endPoint, linearPosition, interpolationsCount) 
{
	// "linearPosition" is length.***
	var increT = 1/interpolationsCount;
	var t = increT;
	
	var strX = strPoint.x;
	var strY = strPoint.y;
	var strZ = strPoint.z;
	
	var strCpX = strControlPoint.x;
	var strCpY = strControlPoint.y;
	var strCpZ = strControlPoint.z;
	
	var endCpX = endControlPoint.x;
	var endCpY = endControlPoint.y;
	var endCpZ = endControlPoint.z;
	
	var endX = endPoint.x;
	var endY = endPoint.y;
	var endZ = endPoint.z;
	
	var point = new Point3D(0, 0, 0);
	var prevPoint = new Point3D(0, 0, 0);
	var acumLength = 0;
	var resultUnitaryPosition;
	
	// Must find the interpolatedSegment that contains the "linearPosition".***
	for (var i=0; i<interpolationsCount+1; i++)
	{
		t = (i)*increT;
		var oneMinusT = 1-t;
		var oneMinusT2 = Math.pow(oneMinusT, 2);
		var oneMinusT3 = Math.pow(oneMinusT, 3);
		var t2 = t*t;
		var t3 = t2*t;
		var oneMinusT2_t_3 = 3*oneMinusT2*t;
		var oneMinusT_t2_3 = 3*oneMinusT*t2;

		var x = oneMinusT3*strX + oneMinusT2_t_3*strCpX + oneMinusT_t2_3*endCpX + t3*endX;
		var y = oneMinusT3*strY + oneMinusT2_t_3*strCpY + oneMinusT_t2_3*endCpY + t3*endY;
		var z = oneMinusT3*strZ + oneMinusT2_t_3*strCpZ + oneMinusT_t2_3*endCpZ + t3*endZ;
		point.set(x, y, z);
		
		if (i > 0)
		{
			var currLength = prevPoint.distToPoint(point);
			acumLength += currLength;
			
			if (acumLength > linearPosition)
			{
				// Calculate "resultUnitaryPosition" by interpolation.***
				var prevT = (i-1)*increT;
				var currT = t;
				var diffLength = currLength - (acumLength - linearPosition);
				var unitaryDiffLength = diffLength/currLength;
				unitaryDiffLength /= interpolationsCount;
				resultUnitaryPosition = prevT + unitaryDiffLength;
				return resultUnitaryPosition;
			}
		}
		
		prevPoint.set(x, y, z);
	}
	
	return resultUnitaryPosition;
};

/**
 * This function returns the tangent line of the splineSegment at the unitaryPosition.
 */
BSplineCubic3D.getTangent = function(bSpline, linearPosition, resultTangentLine) 
{
	// "linearPosition" is a length measurement.***
	var kNotsCount = bSpline.knotPoints3dList.getPointsCount();
	
	if (bSpline.segmentLengthArray === undefined)
	{
		// Calculate all segments length of the bSpline.***
		bSpline.segmentLengthArray = [];
		var interpolationsCount = 20;
		var unitaryPosition = 1;
		var bLoop; // undefined.
		for (var i=0; i<kNotsCount-1; i++)
		{
			var currSegment = bSpline.knotPoints3dList.getSegment3D(i, undefined, bLoop);
			var strPoint = currSegment.startPoint3d;
			var endPoint = currSegment.endPoint3d;
			
			var strControlPoint = bSpline.controlPoints3dMap[i].outingControlPoint;
			var endControlPoint = bSpline.controlPoints3dMap[i+1].inningControlPoint;
			
			var length = BSplineCubic3D.getLengthForSegment(strPoint, strControlPoint, endControlPoint, endPoint, unitaryPosition, interpolationsCount);
			bSpline.segmentLengthArray[i] = length;
		}
	}
	
	// 1rst, find the segment that contains the "linearPosition".***
	var find = false;
	var i = 0;
	var lengthAux = 0;
	var prevLengthAux = 0;
	var segmentIdx = -1;
	while (!find && i<kNotsCount)
	{
		lengthAux += bSpline.segmentLengthArray[i];
		if (lengthAux >= linearPosition)
		{
			find = true;
			segmentIdx = i;
			
			var localPosition = linearPosition - prevLengthAux;
			var unitaryPosition = localPosition/bSpline.segmentLengthArray[segmentIdx];
			
			// Must find the realUnitaryPosition.******************************************
			var currSegment = bSpline.knotPoints3dList.getSegment3D(segmentIdx, undefined, bLoop);
			var strPoint = currSegment.startPoint3d;
			var endPoint = currSegment.endPoint3d;
			
			var strControlPoint = bSpline.controlPoints3dMap[segmentIdx].outingControlPoint;
			var endControlPoint = bSpline.controlPoints3dMap[segmentIdx+1].inningControlPoint;
			var interpolationsCount = 20;
			var realUnitaryPos = BSplineCubic3D.getUnitaryPositionForSegmentAtLinearPosition(strPoint, strControlPoint, endControlPoint, endPoint, localPosition, interpolationsCount);
			// End find the realUnitaryPosition.---------------------------------------------

			resultTangentLine = BSplineCubic3D.getTangentForSegment(strPoint, strControlPoint, endControlPoint, endPoint, realUnitaryPos, resultTangentLine);
		}
		prevLengthAux = lengthAux;
		i++;
	}
	
	return resultTangentLine;
};

/**
 * This function returns the tangent line of the splineSegment at the unitaryPosition.
 */
BSplineCubic3D.getTangentForSegment = function(strPoint, strControlPoint, endControlPoint, endPoint, unitaryPosition, resultTangentLine) 
{
	//                                 T = (1-t)*P + t*Q
	//                     P = (1-t)*A + t*B             Q = (1-t)*B + t*C  
	//                  T = (1-t)*(1-t)*A + (1-t)*t*B + t*(1-t)*B + t*t*C
	//                A = (1-t)*K + t*L         B = (1-t)*L + t*M          C = (1-t)*M + t*N
	//           T = (1-t)^3*K + (1-t)^2*t*L + 2*(1-t)^2*t*L + 2*(1-t)*t^2*M + (1-t)*t^2*M + t^3*N 
	//           T = (1-t)^3*K + 3*(1-t)^2*t*L + 3*(1-t)*t^2*M + t^3*N 
	
	// "unitaryPosition" range = [0.0, 1.0].***
	var t = unitaryPosition;
	var oneMinusT = 1-t;
	var oneMinusT2 = oneMinusT*oneMinusT;
	var t2 = t*t;
	var oneMinusT_2_t = 2*oneMinusT*t;
	
	// K.***
	var strX = strPoint.x;
	var strY = strPoint.y;
	var strZ = strPoint.z;
	
	// L.***
	var strCpX = strControlPoint.x;
	var strCpY = strControlPoint.y;
	var strCpZ = strControlPoint.z;
	
	// M.***
	var endCpX = endControlPoint.x;
	var endCpY = endControlPoint.y;
	var endCpZ = endControlPoint.z;
	
	// N.***
	var endX = endPoint.x;
	var endY = endPoint.y;
	var endZ = endPoint.z;
	
	// Calculate points P & Q.***
	//                     P = (1-t)*A + t*B             Q = (1-t)*B + t*C  
	//                A = (1-t)*K + t*L         B = (1-t)*L + t*M          C = (1-t)*M + t*N
	// P = (1-t)*((1-t)*K + t*L) + t*((1-t)*L + t*M)
	// P = (1-t)^2*K + (1-t)*t*L + (1-t)*t*L + t^2*M
	// P = (1-t)^2*K + 2*(1-t)*t*L + t^2*M
	//
	// Q = (1-t)*((1-t)*L + t*M) + t*((1-t)*M + t*N)
	// Q = (1-t)^2*L + (1-t)*t*M + (1-t)*t*M + t^2*N
	// Q = (1-t)^2*L + 2*(1-t)*t*M + t^2*N
	
	var Px = oneMinusT2 * strX + oneMinusT_2_t*strCpX + t2*endCpX;
	var Py = oneMinusT2 * strY + oneMinusT_2_t*strCpY + t2*endCpY;
	var Pz = oneMinusT2 * strZ + oneMinusT_2_t*strCpZ + t2*endCpZ;
	
	var Qx = oneMinusT2 * strCpX + oneMinusT_2_t*endCpX + t2*endX;
	var Qy = oneMinusT2 * strCpY + oneMinusT_2_t*endCpY + t2*endY;
	var Qz = oneMinusT2 * strCpZ + oneMinusT_2_t*endCpZ + t2*endZ;
	
	var pointP = new Point3D(Px, Py, Pz);
	var pointQ = new Point3D(Qx, Qy, Qz);
	
	// Calculate T = (1-t)*P + t*Q.***
	// T = (oneMinusT*Px + t*Qx, oneMinusT*Py + t*Qy, oneMinusT*Pz + t*Qz);

	if (resultTangentLine === undefined)
	{ resultTangentLine = new Line(); }
	
	var direction = pointP.getVectorToPoint(pointQ, undefined);
	direction.unitary();
	resultTangentLine.setPointAndDir(oneMinusT*Px + t*Qx, oneMinusT*Py + t*Qy, oneMinusT*Pz + t*Qz, direction.x, direction.y, direction.z);
	
	return resultTangentLine;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.makeForSegment = function(strPoint, strControlPoint, endControlPoint, endPoint, interpolationsCount, resultInterpolatedPointsArray) 
{
	var unitaryPosition = 1;
	return BSplineCubic3D.makeForSegmentPartial(strPoint, strControlPoint, endControlPoint, endPoint, unitaryPosition, interpolationsCount, resultInterpolatedPointsArray);
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.makeForSegmentPartial = function(strPoint, strControlPoint, endControlPoint, endPoint, unitaryPosition, interpolationsCount, resultInterpolatedPointsArray) 
{
	// Bezier from del Casteljau.***
	// Bezier curve defined by 2 points (K & N) & 2 control points (L & M).***
	//
	//                             L--------------------------B-------------M
	//                            /                       /     \            \
	//                           /                    /           \           \
	//                          /                 /                  \         \
	//                         /               /                       \        \
	//                        /            /                             \       \
	//                       /          /                                  \      \
	//                      /        P------------T--------------------------Q     \
	//                     /      /      .  ..............     .               \    \
	//                    /   /     .                               .            \   \
	//                   / /     .                                      .          \  \
	//                  A     .                                             .        \ \
	//                 /   .                                                    .       C
	//                / .                                                           .    \
	//               /.                                                               .   \
	//              /.                                                                  .  \
	//             /.                                                                     . \
	//            K                                                                          N
	//
	//                                 T = (1-t)*P + t*Q
	//
	//                     P = (1-t)*A + t*B             Q = (1-t)*B + t*C
	//                   
	//                  T = (1-t)*(1-t)*A + (1-t)*t*B + t*(1-t)*B + t*t*C
	//
	//                A = (1-t)*K + t*L         B = (1-t)*L + t*M          C = (1-t)*M + t*N
	//
	//           T = (1-t)^3*K + (1-t)^2*t*L + 2*(1-t)^2*t*L + 2*(1-t)*t^2*M + (1-t)*t^2*M + t^3*N 
	//
	//           T = (1-t)^3*K + 3*(1-t)^2*t*L + 3*(1-t)*t^2*M + t^3*N 
	
	if (resultInterpolatedPointsArray === undefined)
	{ resultInterpolatedPointsArray = []; }
	
	var increT = unitaryPosition/interpolationsCount;
	var t = increT;
	
	var strX = strPoint.x;
	var strY = strPoint.y;
	var strZ = strPoint.z;
	
	var strCpX = strControlPoint.x;
	var strCpY = strControlPoint.y;
	var strCpZ = strControlPoint.z;
	
	var endCpX = endControlPoint.x;
	var endCpY = endControlPoint.y;
	var endCpZ = endControlPoint.z;
	
	var endX = endPoint.x;
	var endY = endPoint.y;
	var endZ = endPoint.z;
	
	
	for (var i=0; i<interpolationsCount+1; i++)
	{
		t = (i)*increT;
		var oneMinusT = 1-t;
		var oneMinusT2 = Math.pow(oneMinusT, 2);
		var oneMinusT3 = Math.pow(oneMinusT, 3);
		var t2 = t*t;
		var t3 = t2*t;
		var oneMinusT2_t_3 = 3*oneMinusT2*t;
		var oneMinusT_t2_3 = 3*oneMinusT*t2;

		var x = oneMinusT3*strX + oneMinusT2_t_3*strCpX + oneMinusT_t2_3*endCpX + t3*endX;
		var y = oneMinusT3*strY + oneMinusT2_t_3*strCpY + oneMinusT_t2_3*endCpY + t3*endY;
		var z = oneMinusT3*strZ + oneMinusT2_t_3*strCpZ + oneMinusT_t2_3*endCpZ + t3*endZ;
		var point = new Point3D(x, y, z);
		resultInterpolatedPointsArray.push(point);
	}
	
	return resultInterpolatedPointsArray;
};
































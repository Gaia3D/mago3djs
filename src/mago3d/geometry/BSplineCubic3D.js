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

	this.geoCoordsList; // class : GeographicCoordsList.
	this.geoLocDataManager;
	this.knotPoints3dList;
	this.interpolatedPoints3dList;
	this.controlPoints3dMap; // idxPoint : {prevCPoint, nextCPoint}
	
	
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
	
	// Render interpolated points.***
	if (this.interpolatedPoints3dList !== undefined)
	{
		var gl = magoManager.sceneState.gl;
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
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype.makeControlPoints = function() 
{
	// This function makes the controlPoints automatically for the geographicsPoints.***
	// There are 2 controlPoints for each point3d : InningControlPoint & OutingControlPoint.***
	
	// 1rst, make knotPoints if no exist.***
	if (this.knotPoints3dList === undefined)
	{
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
			outingDist = 0.3;
			
			// The outingControlPoint is in the segment, to the 30% of the currentPoint.***
			var outingControlPoint = new Point3D();
			outingControlPoint.set(currPoint.x * (1-outingDist) + nextPoint.x * outingDist, currPoint.y * (1-outingDist) + nextPoint.y * outingDist, currPoint.z * (1-outingDist) + nextPoint.z * outingDist);
			this.controlPoints3dMap[i] = {"inningControlPoint" : undefined, 
										  "outingControlPoint" : outingControlPoint};
		}
		else if ( i === pointsCount-1)
		{
			// In this case there are no outingControlPoint.***
			prevPoint = this.knotPoints3dList.getPoint(i-1);
			inningDist = 0.3;
			
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
			inningDist = currPoint.distToPoint(prevPoint) * 0.3;
			var inningControlPoint = new Point3D();
			inningControlPoint.set(currPoint.x - dir.x * inningDist, currPoint.y - dir.y * inningDist, currPoint.z - dir.z * inningDist);
			
			// OutingControlPoint.***
			outingDist = currPoint.distToPoint(nextPoint) * 0.3;
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
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.makeForSegment = function(strPoint, strControlPoint, endControlPoint, endPoint, interpolationsCount, resultInterpolatedPointsArray) 
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
	
	if (resultInterpolatedPointsArray === undefined)
	{ resultInterpolatedPointsArray = []; }
	
	var increT = 1/interpolationsCount;
	var t = increT;
	
	for (var i=0; i<interpolationsCount; i++)
	{
		t = (i+1)*increT;
		var oneMinusT = 1-t;
		var oneMinusT2 = Math.pow(oneMinusT, 2);
		var oneMinusT3 = Math.pow(oneMinusT, 3);
		var t2 = t*t;
		var t3 = t2*t;

		var x = oneMinusT3*strPoint.x + 3*oneMinusT2*t*strControlPoint.x + 3*oneMinusT*t2*endControlPoint.x + t3*endPoint.x;
		var y = oneMinusT3*strPoint.y + 3*oneMinusT2*t*strControlPoint.y + 3*oneMinusT*t2*endControlPoint.y + t3*endPoint.y;
		var z = oneMinusT3*strPoint.z + 3*oneMinusT2*t*strControlPoint.z + 3*oneMinusT*t2*endControlPoint.z + t3*endPoint.z;
		var point = new Point3D(x, y, z);
		resultInterpolatedPointsArray.push(point);
	}
	
	return resultInterpolatedPointsArray;
};
































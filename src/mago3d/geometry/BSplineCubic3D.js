'use strict';

/**
 * BasisSplineCubic3D represented in 3D
 * @class BSplineCubic3D
 * @constructor
 */
var BSplineCubic3D = function(options) 
{
	if (!(this instanceof BSplineCubic3D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	//************************************************************************************
	// A BSplineCubic3D is composed by:
	// 1) knotPoints.
	// 2) controlPoints.
	// 3) interpolatedPoints.
	//************************************************************************************

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
	
	this.bLoop = false; // open or close curve. Default false.
	this.knotPoints3dList;
	this.interpolatedPoints3dList; // total interpolated points3d.
	this.controlPoints3dMap; // idxPoint : {prevCPoint, nextCPoint}
	this.controlPointArmLengthRatio = 0.1;
	
	this.segmentLengthArray; // Length for each segment (on the interpolated).***
	this.dirty = true;
	this.knotPointsDirty = true;
	this.controlPointsDirty = true;
	this.interpolatedPointsDirty = true;

	// renderables objects.
	this.renderablePointsMap;
	this.renderableCurve; // bSpline's thickLine object.
	this._renderableCurveDirty = false;
	this._renderableCurveThickLinePosDataArray;
	this.bRenderablePointsVisible = false;

	// When rendering, if this curve is EDITED state, then renders knotPoints & controlPoints thet are movable.*****
	this.renderingState = CODE.curveRenderingState.EDITED; // "NORMAL", "EDITED".
	this.interpolationsCount = 10; // default value.
	
	//this.vtxProfilesList;
	//this.vboKeysContainer;
	//this.vboKeysContainerEdges;

	this.state = CODE.parametricCurveState.NORMAL; // or EDITED.
	
	if (options)
	{
		//if (options.knotPoints3dArray)
		//{
		//	if (this.knotPoints3dList === undefined)
		//	{
		//		this.knotPoints3dList = new Point3DList();
		//		this.knotPoints3dList.pointsArray = options.knotPoints3dArray;
		//	}
		//}

		if (options.bLoop !== undefined)
		{ this.bLoop = options.bLoop; }

		if(options.initialArmsLengthRatio)
		{
			// Arms length in initial position.
			this.controlPointArmLengthRatio = options.initialArmsLengthRatio;
		}

		if (options.geoCoordsArray !== undefined)
		{ 
			if (this.geoCoordsList === undefined) 
			{
				this.geoCoordsList = new GeographicCoordsList();
			}

			this.geoCoordsList.addGeoCoordsArray(options.geoCoordsArray);
		}
	}
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
BSplineCubic3D.prototype.getGeoLocationDataManager = function(magoManager) 
{
	if (this.geoLocDataManager === undefined)
	{
		if(this.knotPoints3dList.geoLocDataManager)
		{
			this.geoLocDataManager = this.knotPoints3dList.geoLocDataManager;
		}
		/*
		// Take the 1rst geoCoord, if exist, and make the geoLocationData.***
		if (this.geoCoordsList !== undefined)
		{
			var geoCoord = this.geoCoordsList.getGeoCoord(0);
			if (geoCoord !== undefined)
			{
				this.geoLocDataManager = new GeoLocationDataManager();
				var geoLoc = this.geoLocDataManager.newGeoLocationData("default");
				var heading, pitch, roll;
				geoLoc = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, heading, pitch, roll, geoLoc, magoManager);
			}
		}
		*/
	}
	
	return this.geoLocDataManager;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype._renderControlPointsArms = function(magoManager, shader, renderType) 
{
	// Now, render the control points arms (lines).***
	if (renderType !== 2)
	{
		var bEnableDepth = false;
		var gl = magoManager.getGl();

		var shaderLocal = magoManager.postFxShadersManager.getShader("modelRefSsao");
		shaderLocal.useProgram();
		shaderLocal.disableVertexAttribArrayAll();
		shaderLocal.resetLastBuffersBinded();
		shaderLocal.enableVertexAttribArray(shaderLocal.position3_loc);
		shaderLocal.bindUniformGenerals();

		var color = magoManager.modeler.bSplineControlPointsColor;
		
		gl.uniform1i(shaderLocal.bPositionCompressed_loc, false);
		gl.uniform1i(shaderLocal.bUse1Color_loc, true);
		gl.uniform4fv(shaderLocal.oneColor4_loc, [color.r, color.b, color.g, color.a]); //.
		gl.uniform1f(shaderLocal.fixPointSize_loc, 5.0);
		gl.uniform1i(shaderLocal.bUseFixPointSize_loc, 1);

		if (this.armsLinesPoints3dList === undefined)
		{
			this.armsLinesPoints3dList = new Point3DList();

			// 1rst, recollect the lines points.
			var armsLinesPointsArray = [];
			var controlArmsCount = this.knotPoints3dList.getPointsCount();
			for (var i=0; i<controlArmsCount; i++)
			{
				var controlPointPair = this.controlPoints3dMap[i];
				var point1 = controlPointPair.inningControlPoint;
				var point2 = controlPointPair.outingControlPoint;
				var knotPoint = this.knotPoints3dList.getPoint(i);

				if (point1)
				{
					armsLinesPointsArray.push(knotPoint);
					armsLinesPointsArray.push(point1);

				}

				if (point2)
				{
					armsLinesPointsArray.push(knotPoint);
					armsLinesPointsArray.push(point2);
				}
			}

			this.armsLinesPoints3dList.pointsArray = armsLinesPointsArray;
			this.armsLinesPoints3dList.geoLocDataManager = this.knotPoints3dList.geoLocDataManager;
		}
		var bLoop = false;
		var bEnableDepth = true;
		var glPrimitive = gl.LINES;
		this.armsLinesPoints3dList.renderLines(magoManager, shaderLocal, renderType, bLoop, bEnableDepth, glPrimitive);
	}
	
};


/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype.knotPointMoved = function (description) 
{
	// knotPoint moved, so, must move controlPoints of the knotPoint, and then, recalculate interpolatedPoints.
	var idxPoint = description.idxInCurve;

	// find the renderableKnotPoint.
	var object = this.renderablePointsMap[idxPoint];
	var knotPoint, inRenderableControlPoint, outRenderableControlPoint;
	if (object)
	{
		knotPoint = object.renderableKnotPoint;
		inRenderableControlPoint = object.renderableInningControlPoint;
		outRenderableControlPoint = object.renderableOutingControlPoint;

		// now, calculate the translation.
		var knotGeoCoord = this.geoCoordsList.getGeoCoord(idxPoint);

		var movedKnotGeoCoord = knotPoint.getGeoLocDataManager().getCurrentGeoLocationData().getGeographicCoords();

		var diffLon = movedKnotGeoCoord.longitude - knotGeoCoord.longitude;
		var diffLat = movedKnotGeoCoord.latitude - knotGeoCoord.latitude;
		var diffAlt = movedKnotGeoCoord.altitude - knotGeoCoord.altitude;

		var geoLocDataManager = this.getGeoLocationDataManager();
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();

		if (diffLon !== 0 || diffLat !== 0 || diffAlt !== 0)
		{
			// move the knotPoint & the 2 controlPoints.
			// KnotPoint.************************************************************************************************************
			knotGeoCoord.setLonLatAlt(movedKnotGeoCoord.longitude, movedKnotGeoCoord.latitude, movedKnotGeoCoord.altitude);

			// Now recalculate the posLC of the knotPoint.
			var knotPoint = this.knotPoints3dList.getPoint(idxPoint);
			var posWC = ManagerUtils.geographicCoordToWorldPoint(movedKnotGeoCoord.longitude, movedKnotGeoCoord.latitude, movedKnotGeoCoord.altitude, undefined);
			knotPoint = geoLocData.getTransformedRelativePosition(posWC, knotPoint);

			// now the 2 controlPoints.***********************************************************************************************
			var inControlPoint = this.controlPoints3dMap[idxPoint].inningControlPoint;
			var outControlPoint = this.controlPoints3dMap[idxPoint].outingControlPoint;

			// 1rst, move the renderableControlPoints.
			if(inControlPoint)
			{
				var innCPointGeoLocData = inRenderableControlPoint.getGeoLocDataManager().getCurrentGeoLocationData();
				var innGeoCoord = innCPointGeoLocData.geographicCoord;
				var innLon = innGeoCoord.longitude + diffLon;
				var innLat = innGeoCoord.latitude + diffLat;
				var innAlt = innGeoCoord.altitude + diffAlt;
				innCPointGeoLocData = ManagerUtils.calculateGeoLocationData(innLon, innLat, innAlt, 0, 0, 0, innCPointGeoLocData);

				// Move the realControlPoint.
				var innPosWC = ManagerUtils.geographicCoordToWorldPoint(innLon, innLat, innAlt, undefined);
				inControlPoint = geoLocData.getTransformedRelativePosition(innPosWC, inControlPoint);
			}

			if(outControlPoint)
			{
				var outCPointGeoLocData = outRenderableControlPoint.getGeoLocDataManager().getCurrentGeoLocationData();
				var outGeoCoord = outCPointGeoLocData.geographicCoord;
				var outLon = outGeoCoord.longitude + diffLon;
				var outLat = outGeoCoord.latitude + diffLat;
				var outAlt = outGeoCoord.altitude + diffAlt;
				outCPointGeoLocData = ManagerUtils.calculateGeoLocationData(outLon, outLat, outAlt, 0, 0, 0, outCPointGeoLocData);

				// Move the realControlPoint.
				var outPosWC = ManagerUtils.geographicCoordToWorldPoint(outLon, outLat, outAlt, undefined);
				outControlPoint = geoLocData.getTransformedRelativePosition(outPosWC, outControlPoint);
			}

		}

		// Now, must reMake the controlArms to render.***
		this.armsLinesPoints3dList.setDirty(true);

		// Finally recalculate interpolatedPoints for the 2 segments modified.
		this._reCalculateInterpolatedPointsForSegment(idxPoint-1);
		this._reCalculateInterpolatedPointsForSegment(idxPoint);
		this._renderableCurveDirty = true;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype.controlPointMoved = function (description) 
{
	//var descriptionControlPoints = {
	//	type : "curveControlMember",
	//	inOutControlPointType : "outingControlPoint",
	//	owner : this,
	//	idxInCurve : i
	//};
	var inOutControlPointType = description.inOutControlPointType;
	var idxPoint = description.idxInCurve;
	var object = this.renderablePointsMap[idxPoint];
	var cPointMapData = this.controlPoints3dMap[idxPoint];
	var inningCPoint = cPointMapData.inningControlPoint;
	var outingCPoint = cPointMapData.outingControlPoint;
	var inningArmLength = cPointMapData.inningArmLength;
	var outingArmLength = cPointMapData.outingArmLength;

	var renderableKnotPoint, inRenderableControlPoint, outRenderableControlPoint;
	var dir;

	if (object)
	{
		renderableKnotPoint = object.renderableKnotPoint;
		inRenderableControlPoint = object.renderableInningControlPoint;
		outRenderableControlPoint = object.renderableOutingControlPoint;
	}

	var knotPoint = this.knotPoints3dList.getPoint(idxPoint);
	var geoLocDataManager = this.getGeoLocationDataManager();
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();

	if(inOutControlPointType === "outingControlPoint")
	{
		// OutingControlPoint moved:
		// 1rst, take the actual position of the renderableInnCPoint and set the real innCPoint position.
		var outCPointGeoLocData = outRenderableControlPoint.getGeoLocDataManager().getCurrentGeoLocationData();
		var outGeoCoord = outCPointGeoLocData.geographicCoord;
		var outLon = outGeoCoord.longitude;
		var outLat = outGeoCoord.latitude;
		var outAlt = outGeoCoord.altitude;

		// Move the realControlPoint.
		var outPosWC = ManagerUtils.geographicCoordToWorldPoint(outLon, outLat, outAlt, undefined);
		outingCPoint = geoLocData.getTransformedRelativePosition(outPosWC, outingCPoint);

		// Calculate the new outArmLength.
		cPointMapData.outingArmLength = knotPoint.distToPoint(outingCPoint);

		// Calculate the cPoint-knotPoint direction.***
		dir = new Point3D(knotPoint.x - outingCPoint.x, knotPoint.y - outingCPoint.y, knotPoint.z - outingCPoint.z);
		dir.unitary();
		
		// Opposite control Point.*******************************************************************************************
		// Now, calculate the opposite controlPoint if this knotPoint is tangentType point.
		if(inRenderableControlPoint)
		{
			inningCPoint.set(knotPoint.x + dir.x * inningArmLength, knotPoint.y + dir.y * inningArmLength, knotPoint.z + dir.z * inningArmLength);

			// Now move the renderableOutCPoint.
			var resultGeoCoord = geoLocData.localCoordToGeographicCoord(inningCPoint, resultGeoCoord);
			var innCPointGeoLocData = inRenderableControlPoint.getGeoLocDataManager().getCurrentGeoLocationData();
			innCPointGeoLocData = ManagerUtils.calculateGeoLocationData(resultGeoCoord.longitude, resultGeoCoord.latitude, resultGeoCoord.altitude, 0, 0, 0, innCPointGeoLocData);
		}
	}
	else
	{
		// InningControlPoint moved:
		// 1rst, take the actual position of the renderableInnCPoint and set the real innCPoint position.
		var innCPointGeoLocData = inRenderableControlPoint.getGeoLocDataManager().getCurrentGeoLocationData();
		var innGeoCoord = innCPointGeoLocData.geographicCoord;
		var innLon = innGeoCoord.longitude;
		var innLat = innGeoCoord.latitude;
		var innAlt = innGeoCoord.altitude;

		// Move the realControlPoint.
		var innPosWC = ManagerUtils.geographicCoordToWorldPoint(innLon, innLat, innAlt, undefined);
		inningCPoint = geoLocData.getTransformedRelativePosition(innPosWC, inningCPoint);

		// Calculate the new innArmLength.
		cPointMapData.inningArmLength = knotPoint.distToPoint(inningCPoint);

		// Calculate the cPoint-knotPoint direction.***
		dir = new Point3D(knotPoint.x - inningCPoint.x, knotPoint.y - inningCPoint.y, knotPoint.z - inningCPoint.z);
		dir.unitary();

		// Opposite control Point.*******************************************************************************************
		// Now, calculate the opposite controlPoint if this knotPoint is tangentType point.
		if(outRenderableControlPoint)
		{
			outingCPoint.set(knotPoint.x + dir.x * outingArmLength, knotPoint.y + dir.y * outingArmLength, knotPoint.z + dir.z * outingArmLength);

			// Now move the renderableOutCPoint.
			var resultGeoCoord = geoLocData.localCoordToGeographicCoord(outingCPoint, resultGeoCoord);
			var outCPointGeoLocData = outRenderableControlPoint.getGeoLocDataManager().getCurrentGeoLocationData();
			outCPointGeoLocData = ManagerUtils.calculateGeoLocationData(resultGeoCoord.longitude, resultGeoCoord.latitude, resultGeoCoord.altitude, 0, 0, 0, outCPointGeoLocData);
		}
	}
	// Now, must reMake the controlArms to render.***
	this.armsLinesPoints3dList.setDirty(true);

	// Finally recalculate interpolatedPoints for the 2 segments modified.
	this._reCalculateInterpolatedPointsForSegment(idxPoint-1);
	this._reCalculateInterpolatedPointsForSegment(idxPoint);
	this._renderableCurveDirty = true;
};


/**
 */
BSplineCubic3D.prototype.isPrepared = function(magoManager) 
{
	// 1- check if exist knotPoints.
	if (!this._makeKnotPoints(magoManager))
	{
		return false;
	}

	// 2- check if exist controlPoints.
	if(!this._makeControlPoints(undefined, magoManager))
	{
		return false;
	}

	// 3- check if exist interpolatedPoints.
	if (!this._makeInterpolatedPoints())
	{
		return false;
	}

	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype.render = function (magoManager, shader, renderType) 
{
	if(!this.isPrepared(magoManager))
	{
		return false;
	}
	
	var bLoop = false, bEnableDepth = false;
	this._renderControlPointsArms(magoManager, shader, renderType);
	
	if (renderType === 2)
	{ return; }

	var gl = magoManager.sceneState.gl;
	
	// Render interpolated points.***
	if(!this.renderableCurve)
	{
		this._makeRenderableCurve(magoManager);
		magoManager.modeler.addObject(this.renderableCurve);
	}

	if(this._renderableCurveDirty)
	{
		this._reMakeRenderableCurve(magoManager);
	}

	/*
	// Active this code if render lines with thickness = 1.0.
	if (this.interpolatedPoints3dList !== undefined)
	{
		var shader = magoManager.postFxShadersManager.getShader("modelRefSsao");
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
	*/

	// Now, if this renderingState is EDITED, then render knotPoints & controlPoints.***
	if(this.renderingState === CODE.curveRenderingState.EDITED)
	{
		// Check if exist knotPoints & controlPoints & are visibles.
		if(!this.renderablePointsMap)
		{ this._makeRenderablePoints(magoManager); }
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype._makeRenderablePoints = function(magoManager) 
{
	// check if exists. If no exists, then create it.
	var modeler = magoManager.modeler;
	var knotPointsCount = this.geoCoordsList.getGeoCoordsCount();
	if(!this.renderablePointsMap || this.renderablePointsMap.length !== knotPointsCount)
	{ 
		if(!this.renderablePointsMap)
		{ this.renderablePointsMap = []; }

		var knotPointsStyle = {
			opacity : 1.0,
			color : modeler.bSplineKnotPointsColor,
			size : 8,
			isMovable : true
		};

		var controlPointsStyle = {
			opacity : 1.0,
			color : modeler.bSplineControlPointsColor,
			size : 8,
			isMovable : true
		};
		
		for(var i=0; i<knotPointsCount; i++)
		{
			var coord = this.geoCoordsList.getGeoCoord(i);
			var position = {
				longitude: coord.longitude,
				latitude: coord.latitude,
				altitude: coord.altitude
			};

			// Do a description of the magoPoint:
			var description = {
				type : "curveMember",
				owner : this,
				idxInCurve : i
			};

			var options = {
				description : description
			};

			// The knotPoint:
			var magoPoint = new MagoPoint(position, knotPointsStyle, options);
			modeler.addObject(magoPoint);

			var geoCoord_inning = this.controlPoints3dMap[i].inningGeoCoord;
			var geoCoord_outing = this.controlPoints3dMap[i].outingGeoCoord;
			var outingControlPoint = undefined;
			var inningControlPoint = undefined;
			if(geoCoord_inning)
			{
				// The controlPoints:
				var descriptionControlPoints = {
					type : "curveControlMember",
					inOutControlPointType : "inningControlPoint",
					owner : this,
					idxInCurve : i
				};

				var optionsControlPoints = {
					description : descriptionControlPoints
				};

				inningControlPoint = new MagoPoint(geoCoord_inning, controlPointsStyle, optionsControlPoints);
				modeler.addObject(inningControlPoint);

				// EventListener:
				var event = new MagoEvent('MOVE_START', function(thisArgs)
				{
					thisArgs._moveStart();
				});
				inningControlPoint.addEventListener(event);
			}

			if(geoCoord_outing)
			{
				var descriptionControlPoints = {
					type : "curveControlMember",
					inOutControlPointType : "outingControlPoint",
					owner : this,
					idxInCurve : i
				};

				var optionsControlPoints = {
					description : descriptionControlPoints
				};

				outingControlPoint = new MagoPoint(geoCoord_outing, controlPointsStyle, optionsControlPoints);
				modeler.addObject(outingControlPoint);

				// EventListener:
				var event = new MagoEvent('MOVE_START', function(thisArgs)
				{
					thisArgs._moveStart();
				});
				outingControlPoint.addEventListener(event);
			}

			// store the renderablesPoints.
			this.renderablePointsMap[i] = {
				renderableKnotPoint : magoPoint,
				renderableInningControlPoint : inningControlPoint,
				renderableOutingControlPoint : outingControlPoint
			};

			// EventListener:
			var event = new MagoEvent('MOVE_START', function(thisArgs)
			{
				thisArgs._moveStart();
			});
			magoPoint.addEventListener(event);
		}
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype._reMakeRenderableCurve = function(magoManager) 
{
	var vectorMesh = this.renderableCurve.objectsArray[0];

	// delete the vbo & create a new vbo:
	var gl = magoManager.getGl();
	var vboMemManager = magoManager.vboMemoryManager;
	vectorMesh.vboKeysContainer.deleteGlObjects(gl, vboMemManager);

	var vbo = vectorMesh.vboKeysContainer.newVBOVertexIdxCacheKey();

	var pointDimension = 4;
	vbo.setDataArrayPos(this._renderableCurveThickLinePosDataArray, magoManager.vboMemoryManager, pointDimension);

	this._renderableCurveDirty = false;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype._makeRenderableCurve = function(magoManager) 
{
	// Make a renderableObject thickLine type.
	if(!this.renderableCurve)
	{
		// 1rst, create the thickLinesPosDataArray.
		var optionsPosDataArray = {};
		this._renderableCurveThickLinePosDataArray = Point3DList.getThickLinesPositionDataArray(this.interpolatedPoints3dList.pointsArray, this._renderableCurveThickLinePosDataArray, optionsPosDataArray);

		// Now, make the renderableObject.
		var geoLocDataManager = this.getGeoLocationDataManager();
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();

		var options = {};
		if (options.thickness === undefined)
		options.thickness = 2.0; 

		if (options.color === undefined)
			{ options.color = new Color(1.0, 0.3, 0.3, 1.0); }

		// Create a vectorMesh.********************************************************************
		var vectorMesh = new VectorMesh(options);
		vectorMesh.vboKeysContainer = new VBOVertexIdxCacheKeysContainer();
		//vectorMesh.vboKeysContainer = Point3DList.getVboThickLines(magoManager, this.interpolatedPoints3dList.pointsArray, vectorMesh.vboKeysContainer, options);
		var vbo = vectorMesh.vboKeysContainer.newVBOVertexIdxCacheKey();
		var pointDimension = 4;
		vbo.setDataArrayPos(this._renderableCurveThickLinePosDataArray, magoManager.vboMemoryManager, pointDimension);
		
		//if (colVboDataArray) // todo:
		//{
		//	vbo.setDataArrayCol(colVboDataArray, magoManager.vboMemoryManager);
		//}

		// Now create a renderableObject.**********************************************************
		this.renderableCurve = new RenderableObject();
		this.renderableCurve.geoLocDataManager = new GeoLocationDataManager();
		this.renderableCurve.geoLocDataManager.addGeoLocationData(geoLocData);
		this.renderableCurve.objectType = MagoRenderable.OBJECT_TYPE.VECTORMESH;

		// calculate vectorMesh "BoundingSphereWC".************************************************
		this.renderableCurve.boundingSphereWC = new BoundingSphere();
		var positionWC = geoLocData.position;
		var bboxLC = Point3DList.getBoundingBoxOfPoints3DArray(this.interpolatedPoints3dList.pointsArray, undefined);
		var radiusAprox = bboxLC.getRadiusAprox();
		this.renderableCurve.boundingSphereWC.setCenterPoint(positionWC.x, positionWC.y, positionWC.z);
		this.renderableCurve.boundingSphereWC.setRadius(radiusAprox);
		// End calculating boundingSphereWC.-------------------------------------------------------

		this.renderableCurve.objectsArray.push(vectorMesh);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype._makeKnotPoints = function(magoManager) 
{
	// The knotPoints in x, y, z localCoords.
	if (this.knotPoints3dList === undefined || this.knotPointsDirty)
	{
		if (this.geoCoordsList.points3dList === undefined)
		{ this.geoCoordsList.makeLines(magoManager); }
		
		this.knotPoints3dList = new Point3DList();
		this.knotPoints3dList.pointsArray = this.geoCoordsList.points3dList.pointsArray;
		
		// Transfer the geoLocationDataManager too.***
		this.knotPoints3dList.geoLocDataManager = this.geoCoordsList.points3dList.geoLocDataManager;

		this.knotPointsDirty = false;
		return false;
	}

	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D._makeControlPointsOfKnotPoint = function(knotPoints3dList, idxPoint, geoLocData, controlPointArmLength, bLoop) 
{
	// This function makes controlPoints for "currPoint".***
	// Find the tangent line3d of the current point.***
	var tangentLine3d = knotPoints3dList.getTangentLine3D(idxPoint, undefined, bLoop);
	var dir = tangentLine3d.direction;

	var prevPoint = knotPoints3dList.getPoint(knotPoints3dList.getPrevIdx(idxPoint));
	var currPoint = knotPoints3dList.getPoint(idxPoint);
	var nextPoint = knotPoints3dList.getPoint(knotPoints3dList.getNextIdx(idxPoint));
	
	// InningControlPoint.***
	var inningDist = currPoint.distToPoint(prevPoint) * controlPointArmLength;
	var inningControlPoint = new Point3D();
	inningControlPoint.set(currPoint.x - dir.x * inningDist, currPoint.y - dir.y * inningDist, currPoint.z - dir.z * inningDist); 
	var inningGeoCoord = geoLocData.localCoordToGeographicCoord(inningControlPoint, undefined);
	
	// OutingControlPoint.***
	var outingDist = currPoint.distToPoint(nextPoint) * controlPointArmLength;
	var outingControlPoint = new Point3D();
	outingControlPoint.set(currPoint.x + dir.x * outingDist, currPoint.y + dir.y * outingDist, currPoint.z + dir.z * outingDist); 
	var outingGeoCoord = geoLocData.localCoordToGeographicCoord(outingControlPoint, undefined);
	
	var outingArmLength = outingControlPoint.distToPoint(currPoint);
	var inningArmLength = inningControlPoint.distToPoint(currPoint);
	var controlPoints3dMap = {"inningControlPoint" : inningControlPoint, 
								"outingControlPoint" : outingControlPoint,
								"inningGeoCoord" : inningGeoCoord,
								"outingGeoCoord" : outingGeoCoord,
								"outingArmLength" : outingArmLength,
								"inningArmLength" : inningArmLength};
	
	return controlPoints3dMap;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype._makeControlPoints = function(controlPointArmLength, magoManager) 
{
	// This function makes the controlPoints automatically for the geographicsPoints.***
	// There are 2 controlPoints for each point3d : InningControlPoint & OutingControlPoint.***
	
	// 1rst, make knotPoints if no exist.***
	if (!this._makeKnotPoints(magoManager))
	{
		return false;
	}
	
	if (this.knotPoints3dList.pointsArray === undefined)
	{ return false; }

	if(!this.controlPoints3dMap || this.controlPointsDirty)
	{
		this.controlPoints3dMap = {};
		var bLoop = this.bLoop;
		
		var currPoint;
		var prevPoint;
		var nextPoint;
		var inningDist; // the inningControlPoint length.***
		var outingDist; // the outingControlPoint length.***

		var geoLocDataManager = this.knotPoints3dList.geoLocDataManager;
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
		
		if (controlPointArmLength === undefined)
		{ controlPointArmLength = this.controlPointArmLengthRatio; }
			
		var pointsCount = this.knotPoints3dList.getPointsCount();
		for (var i=0; i<pointsCount; i++)
		{
			currPoint = this.knotPoints3dList.getPoint(i);
			
			if (i === 0)
			{
				if(!this.bLoop)
				{
					// In this case there are no inningControlPoint.***
					nextPoint = this.knotPoints3dList.getPoint(i+1);
					outingDist = controlPointArmLength;

					// The outingControlPoint is in the segment, to the 20% of the currentPoint.***
					var outingControlPoint = new Point3D();
					outingControlPoint.set(currPoint.x * (1-outingDist) + nextPoint.x * outingDist, currPoint.y * (1-outingDist) + nextPoint.y * outingDist, currPoint.z * (1-outingDist) + nextPoint.z * outingDist); 
					var outingArmLength = outingControlPoint.distToPoint(currPoint);
					var outingGeoCoord = geoLocData.localCoordToGeographicCoord(outingControlPoint, undefined);
					this.controlPoints3dMap[i] = {"inningControlPoint" : undefined, 
												"outingControlPoint" : outingControlPoint,
												"inningGeoCoord" : undefined,
												"outingGeoCoord" : outingGeoCoord,
												"outingArmLength" : outingArmLength,
												"inningArmLength" : undefined};
				}
				else
				{
					this.controlPoints3dMap[i] = BSplineCubic3D._makeControlPointsOfKnotPoint(this.knotPoints3dList, i, geoLocData, controlPointArmLength, bLoop);
				}
			}
			else if ( i === pointsCount-1)
			{
				if(!this.bLoop)
				{
					// In this case there are no outingControlPoint.***
					prevPoint = this.knotPoints3dList.getPoint(i-1);
					inningDist = controlPointArmLength;
					var inningControlPoint = new Point3D();
					inningControlPoint.set(currPoint.x * (1-inningDist) + prevPoint.x * inningDist, currPoint.y * (1-inningDist) + prevPoint.y * inningDist, currPoint.z * (1-inningDist) + prevPoint.z * inningDist); 
					var inningArmLength = inningControlPoint.distToPoint(currPoint);
					var inningGeoCoord = geoLocData.localCoordToGeographicCoord(inningControlPoint, undefined);
					this.controlPoints3dMap[i] = {"inningControlPoint" : inningControlPoint, 
												"outingControlPoint" : undefined,
												"inningGeoCoord" : inningGeoCoord,
												"outingGeoCoord" : undefined,
												"outingArmLength" : undefined,
												"inningArmLength" : inningArmLength};
				}
				else
				{
					this.controlPoints3dMap[i] = BSplineCubic3D._makeControlPointsOfKnotPoint(this.knotPoints3dList, i, geoLocData, controlPointArmLength, bLoop);
				}
			}
			else 
			{
				this.controlPoints3dMap[i] = BSplineCubic3D._makeControlPointsOfKnotPoint(this.knotPoints3dList, i, geoLocData, controlPointArmLength, bLoop);
			}
			
		}

		this.controlPointsDirty = false;
		return false;
	}

	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype._reCalculateInterpolatedPointsForSegment = function (idxSegment) 
{
	// Call this function after moving a knotPoint or a controlPoint.
	// To call this function, must exist previously the this.interpolatedPoints3dList.
	var segmentsCount = this.knotPoints3dList.getPointsCount();
	if(!this.bLoop)
	{
		if(idxSegment >= segmentsCount-1 || idxSegment < 0)
		{ return; }
	}
	else
	{
		if(idxSegment >= segmentsCount)
		{ idxSegment -= segmentsCount; }
		else if(idxSegment < 0)
		{ idxSegment += segmentsCount; }
	}

	var idxSegmentNext;

	var interpolationsCount = this.interpolationsCount;
	var bLoop = this.bLoop;

	// calculate startIdx & endIdx of interpolatedPoints for idxSegment.
	var interpolatedPointsCount = this.interpolatedPoints3dList.getPointsCount();
	var startIdx = idxSegment * interpolationsCount;
	var endIdx = (idxSegment+1) * interpolationsCount;

	var currSegment = this.knotPoints3dList.getSegment3D(idxSegment, undefined, bLoop);
	var strPoint = currSegment.startPoint3d;
	var endPoint = currSegment.endPoint3d;
	var strControlPoint = this.controlPoints3dMap[idxSegment].outingControlPoint;
	var idxSegmentNext = this.knotPoints3dList.getNextIdx(idxSegment);
	var endControlPoint = this.controlPoints3dMap[idxSegmentNext].inningControlPoint;

	// do the recalculation:
	var increT = 1.0/interpolationsCount;
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

		var idxInTotalArray = startIdx + i;
		this.interpolatedPoints3dList.pointsArray[idxInTotalArray].set(x, y, z);
	}
	this.interpolatedPoints3dList.setDirty(true);

	// Now, if exist thickLineObject, then recalculate modified points.******************
	if(this.renderableCurve)
	{
		// Recalculate partially.
		var optionsPosDataArray = {
			startIdx : startIdx,
			endIdx : endIdx
		};
		this._renderableCurveThickLinePosDataArray = Point3DList.getThickLinesPositionDataArray(this.interpolatedPoints3dList.pointsArray, this._renderableCurveThickLinePosDataArray, optionsPosDataArray);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
BSplineCubic3D.prototype._makeInterpolatedPoints = function() 
{
	if (!this._makeControlPoints())
	{ return false; }

	if(this.interpolatedPoints3dList === undefined || this.interpolatedPointsDirty)
	{
		if (this.interpolatedPoints3dList === undefined)
		{
			this.interpolatedPoints3dList = new Point3DList();
		}
		
		var interpolationsCount = this.interpolationsCount;
		var interpolatedPointsArray = [];
		var bLoop = this.bLoop;
		
		// For each segment, make the bezier curve interpolated points.***
		var pointsCount = this.knotPoints3dList.getPointsCount();
		var segmentsCount;
		if(this.bLoop)
		{
			segmentsCount = pointsCount;
		}
		else
		{
			segmentsCount = pointsCount-1;
		}
		
		for (var i=0; i<segmentsCount; i++)
		{
			var currSegment = this.knotPoints3dList.getSegment3D(i, undefined, bLoop);
			var strPoint = currSegment.startPoint3d;
			var endPoint = currSegment.endPoint3d;
			
			var strControlPoint = this.controlPoints3dMap[i].outingControlPoint;
			var idxNext = this.knotPoints3dList.getNextIdx(i);
			var endControlPoint = this.controlPoints3dMap[idxNext].inningControlPoint;
			
			BSplineCubic3D.makeForSegment(strPoint, strControlPoint, endControlPoint, endPoint, interpolationsCount, interpolatedPointsArray);

			if(i < segmentsCount-1)
			{
				// If this is NO lastSegment, erase the last point in the array.
				interpolatedPointsArray.pop();
			}
		}
		
		// Transfer pointsArray.***
		this.interpolatedPoints3dList.pointsArray = interpolatedPointsArray;
		
		// Transfer geoLocationDataManager.***
		this.interpolatedPoints3dList.geoLocDataManager = this.knotPoints3dList.geoLocDataManager;

		this.interpolatedPointsDirty = false;
		return false;
	}

	return true;
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
 * This function returns the length of the splineSegment at the unitaryPosition.
 */
BSplineCubic3D.getLength = function(bSpline, interpolationsCount) 
{
	if (bSpline === undefined || bSpline.knotPoints3dList === undefined)
	{ return undefined; }
	
	var kNotsCount = bSpline.knotPoints3dList.getPointsCount();
	if (bSpline.segmentLengthArray === undefined)
	{
		// Calculate all segments length of the bSpline.***
		bSpline.segmentLengthArray = [];
		if (interpolationsCount === undefined)
		{ interpolationsCount = 20; }
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
	
	var totalLength = 0;
	for (var i=0; i<kNotsCount-1; i++)
	{
		totalLength += bSpline.segmentLengthArray[i];
	}
	
	return totalLength;
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
	
	if (resultUnitaryPosition === undefined)
	{ resultUnitaryPosition = 1.0; }
	
	return resultUnitaryPosition;
};

/**
 * This function returns the tangent line of the splineSegment at the unitaryPosition.
 */
BSplineCubic3D.getTangent = function(bSpline, linearPosition, resultTangentLine, magoManager) 
{
	if (bSpline.knotPoints3dList === undefined)
	{
		var controlPointArmLength = 0.3;
		bSpline._makeControlPoints(controlPointArmLength, magoManager);
	}
	
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
































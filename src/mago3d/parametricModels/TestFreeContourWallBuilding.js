'use strict';

/**
 * TestFreeContourWallBuilding geometry.
 * @class TestFreeContourWallBuilding
 */
var TestFreeContourWallBuilding = function(options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof TestFreeContourWallBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	if (options !== undefined)
	{
		if (options.points2dArray !== undefined)
		{
			if (this.point2DList === undefined)
			{
				this.point2DList = new Point2DList();
			}
			
			this.point2DList.pointsArray = options.points2dArray;
		}
		
		if (options.height !== undefined)
		{
			this.height = options.height;
		}
	}
	
	this.height;
	this.point2DList;
};

TestFreeContourWallBuilding.prototype = Object.create(MagoRenderable.prototype);
TestFreeContourWallBuilding.prototype.constructor = TestFreeContourWallBuilding;

/*
if (this.testClippingPlanes === undefined)
	{
		// make a modelmatrix for the clippingPlanes.
		var modelMatrix;
		var geoCoord = new GeographicCoord(126.61340759235748, 37.57613526692086, 0);
		var modelmatrix = Globe.transformMatrixAtGeographicCoord(geoCoord, undefined);
		var globe = this.scene._globe;
		globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
			modelMatrix : modelmatrix,
			planes      : [
				new Cesium.ClippingPlane(new Cesium.Cartesian3( 1.0,  0.0, 0.0), -50.0),
				new Cesium.ClippingPlane(new Cesium.Cartesian3(-1.0,  0.0, 0.0), -50.0),
				new Cesium.ClippingPlane(new Cesium.Cartesian3( 0.0,  1.0, 0.0), -200.0),
				new Cesium.ClippingPlane(new Cesium.Cartesian3( 0.0, -1.0, 0.0), -200.0)
			],
			edgeWidth : 1.0,
			edgeColor : Cesium.Color.WHITE,
			enabled   : true
		});
	
		this.testClippingPlanes = true;
	}
	*/
	
TestFreeContourWallBuilding.prototype.makeMesh = function()
{
	var profileAux = new Profile2D();
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();
	var polyline = outerRing.newElement("POLYLINE");

	var pointsCount = this.point2DList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		var point2d = this.point2DList.getPoint(i);
		polyline.newPoint2d(point2d.x, point2d.y);
	}
	//var leftExpandDist = 0.2;
	//var innerPointsArray = Point2DList.getExpandedPoints(this.point2DList.pointsArray, undefined, leftExpandDist, rightExpandDist, bLoop);
	
	// Now create interior ring.***
	var innerRing = profileAux.newInnerRing();
	var circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(2);
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var extrusionDist = this.height;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	
	if (this.objectsArray === undefined)
	{ this.objectsArray = []; }

	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.objectsArray.push(mesh);
	this.dirty = false;
};










































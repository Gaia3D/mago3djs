/**
 * 어떤 일을 하고 있습니까?
 */
Profile2D.prototype.TEST__setFigure_1 = function() 
{
	// complicated polygon with multiple holes.***
	var polyLine;
	var arc;
	var circle;
	var rect;
	var point3d;
	var star;
	
	// Outer ring.**************************************
	var outerRing = this.newOuterRing();
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(7, 7); // 0
	point3d = polyLine.newPoint2d(0, 7); // 1
	point3d = polyLine.newPoint2d(0, 0); // 2
	point3d = polyLine.newPoint2d(7, 0); // 3
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(7, 3.5);
	arc.setRadius(3.5);
	arc.setStartAngleDegree(-90.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	// hole.***
	var innerRing = this.newInnerRing();
	rect = innerRing.newElement("RECTANGLE");
	rect.setCenterPosition(3, 3);
	rect.setDimensions(2, 2);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Profile2D.prototype.TEST__setFigure_2holes = function() 
{
	// complicated polygon with multiple holes.***
	var polyLine;
	var arc;
	var circle;
	var rect;
	var point3d;
	var star;
	
	// Outer ring.**************************************
	var outerRing = this.newOuterRing();
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(7, 7); // 0
	point3d = polyLine.newPoint2d(0, 7); // 1
	point3d = polyLine.newPoint2d(0, 0); // 2
	point3d = polyLine.newPoint2d(7, 0); // 3
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(7, 3.5);
	arc.setRadius(3.5);
	arc.setStartAngleDegree(-90.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	// hole 1.***
	var innerRing = this.newInnerRing();
	rect = innerRing.newElement("RECTANGLE");
	rect.setCenterPosition(3, 3);
	rect.setDimensions(2, 2);
	
	// hole 2.***
	innerRing = this.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(7, 3);
	circle.setRadius(1);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Profile2D.prototype.TEST__setFigureHole_2 = function() 
{
	// complicated polygon with multiple holes.***
	var polyLine;
	var arc;
	var circle;
	var rect;
	var point3d;
	var star;
	
	// Outer ring.**************************************
	var outerRing = this.newOuterRing();
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-13, 3); // 0
	point3d = polyLine.newPoint2d(-13, -11); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-8, -11);
	arc.setRadius(5);
	arc.setStartAngleDegree(180.0);
	arc.setSweepAngleDegree(90.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-8, -16); // 0
	point3d = polyLine.newPoint2d(-5, -16); // 1
	point3d = polyLine.newPoint2d(-3, -15); // 2
	point3d = polyLine.newPoint2d(-3, -14); // 3
	point3d = polyLine.newPoint2d(-5, -12); // 4
	point3d = polyLine.newPoint2d(-3, -11); // 5
	point3d = polyLine.newPoint2d(-2, -9); // 6
	point3d = polyLine.newPoint2d(3, -9); // 7
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(9, -9);
	arc.setRadius(6);
	arc.setStartAngleDegree(180.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(15, -9); // 0
	point3d = polyLine.newPoint2d(16, -9); // 1
	point3d = polyLine.newPoint2d(16, 4); // 2
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(11, 4);
	arc.setRadius(5);
	arc.setStartAngleDegree(0.0);
	arc.setSweepAngleDegree(90.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(11, 9); // 0
	point3d = polyLine.newPoint2d(4, 9); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(4, 11);
	arc.setRadius(2);
	arc.setStartAngleDegree(-90.0);
	arc.setSweepAngleDegree(-180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(4, 13); // 0
	point3d = polyLine.newPoint2d(9, 13); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(9, 14.5);
	arc.setRadius(1.5);
	arc.setStartAngleDegree(-90.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(9, 16); // 0
	point3d = polyLine.newPoint2d(2, 16); // 1
	point3d = polyLine.newPoint2d(0, 14); // 2
	point3d = polyLine.newPoint2d(-4, 16); // 3
	point3d = polyLine.newPoint2d(-9, 16); // 4
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-9, 14);
	arc.setRadius(2);
	arc.setStartAngleDegree(90.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-9, 12); // 0
	point3d = polyLine.newPoint2d(-6, 12); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-6, 10.5);
	arc.setRadius(1.5);
	arc.setStartAngleDegree(90.0);
	arc.setSweepAngleDegree(-180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-6, 9); // 0
	point3d = polyLine.newPoint2d(-7, 9); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-7, 3);
	arc.setRadius(6);
	arc.setStartAngleDegree(90.0);
	arc.setSweepAngleDegree(90.0);
	arc.numPointsFor360Deg = 24;
	
	// Holes.**************************************************
	// Hole 1.*************************************************
	var innerRing = this.newInnerRing();
	
	polyLine = innerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-9, 3); // 0
	point3d = polyLine.newPoint2d(-10, -4); // 1
	point3d = polyLine.newPoint2d(-10, -8); // 2
	point3d = polyLine.newPoint2d(-8, -11); // 3
	point3d = polyLine.newPoint2d(-3, -7); // 4
	point3d = polyLine.newPoint2d(4, -7); // 5
	
	arc = innerRing.newElement("ARC");
	arc.setCenterPosition(8, -7);
	arc.setRadius(4);
	arc.setStartAngleDegree(180.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = innerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(12, -7); // 0
	point3d = polyLine.newPoint2d(12, -4); // 1
	point3d = polyLine.newPoint2d(8, -10); // 2
	point3d = polyLine.newPoint2d(4, -5); // 3
	point3d = polyLine.newPoint2d(-8, -5); // 4
	point3d = polyLine.newPoint2d(-7, 4); // 5
	point3d = polyLine.newPoint2d(9, 4); // 6
	point3d = polyLine.newPoint2d(9, -5); // 7
	point3d = polyLine.newPoint2d(14, 2); // 8
	point3d = polyLine.newPoint2d(13, 2); // 9
	point3d = polyLine.newPoint2d(11, 0); // 10
	point3d = polyLine.newPoint2d(11, 7); // 11
	point3d = polyLine.newPoint2d(13, 8); // 12
	point3d = polyLine.newPoint2d(5, 8); // 13
	point3d = polyLine.newPoint2d(9, 6); // 14
	point3d = polyLine.newPoint2d(-6, 6); // 15
	
	arc = innerRing.newElement("ARC");
	arc.setCenterPosition(-6, 3);
	arc.setRadius(3);
	arc.setStartAngleDegree(90.0);
	arc.setSweepAngleDegree(90.0);
	arc.numPointsFor360Deg = 24;
	
	
		
	// Hole 2.*************************************************
	innerRing = this.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(-10, -13);
	circle.setRadius(1);
	
	// Hole 3.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(-6.5, -14);
	star.setRadiusCount(5);
	star.setInteriorRadius(0.6);
	star.setExteriorRadius(2);

	// Hole 4.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(-9, 14);
	star.setRadiusCount(6);
	star.setInteriorRadius(0.5);
	star.setExteriorRadius(1.5);
	
	// Hole 5.*************************************************
	innerRing = this.newInnerRing();
	rect = innerRing.newElement("RECTANGLE");
	rect.setCenterPosition(-4.5, 1.5);
	rect.setDimensions(3, 3);
	
	// Hole 6.*************************************************
	innerRing = this.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(-4.5, -2.5);
	circle.setRadius(2);
	
	// Hole 7.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(0, 0);
	star.setRadiusCount(5);
	star.setInteriorRadius(1);
	star.setExteriorRadius(2.5);
	
	// Hole 8.*************************************************
	innerRing = this.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(-6, 14);
	circle.setRadius(1.5);
	
	// Hole 9.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(-1.5, 11);
	star.setRadiusCount(12);
	star.setInteriorRadius(0.6);
	star.setExteriorRadius(2);
	
	// Hole 10.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(13.5, 5);
	star.setRadiusCount(25);
	star.setInteriorRadius(0.4);
	star.setExteriorRadius(1.5);
	
	// Hole 11.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(9, -13);
	star.setRadiusCount(10);
	star.setInteriorRadius(0.4);
	star.setExteriorRadius(1.5);
	
	// Hole 12.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(5.5, 1.5);
	star.setRadiusCount(7);
	star.setInteriorRadius(0.7);
	star.setExteriorRadius(2);
	
};
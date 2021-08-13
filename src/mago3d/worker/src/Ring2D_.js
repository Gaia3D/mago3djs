'use strict';

/**
 * 링형태의 폴리곤 객체를 생성하기 위한 클래스
 * 
 * @class
 */
var Ring2D_ = function() 
{
	/**
	 * 다양한 폴리곤을 갖고 있는 배열
	 * @type {Obecjt[]}
	 */
	this.elemsArray = [];

	/**
	 * 폴리곤
	 * @type {Polygon2D}
	 */
	this.polygon = undefined;
	
	this.isOpen; // note: only outer rings can to be open.
};

Ring2D_.prototype.newElement = function(type)
{
	var result = undefined;
	
	if (type === "ARC") { result = new Arc2D_(); }
	else if (type === "CIRCLE") { result = new Circle2D_(); }
	else if (type === "POLYLINE") { result = new PolyLine2D_(); }
	else if (type === "RECTANGLE") { result = new Rectangle2D_(); }
	else if (type === "STAR") { result = new Star2D_(); }
	
	this.elemsArray.push(result);
	
	return result;
};

Ring2D_.prototype.makePolygon = function()
{
	this.polygon = this.getPolygon(this.polygon);
	return this.polygon;
};

Ring2D_.prototype.getPoints = function(resultPointsArray)
{
	if (resultPointsArray === undefined)
	{
		resultPointsArray = [];
	}
	
	var elem;
	for (var i=0, len = this.elemsArray.length; i<len; i++)
	{
		elem = this.elemsArray[i];
		elem.getPoints(resultPointsArray);
	}

	// finally check if the 1rst point and the last point are coincidents.
	var totalPointsCount = resultPointsArray.length;
	if (totalPointsCount > 1)
	{
		
		var errorDist = 10E-8;
		var firstPoint = resultPointsArray[0];
		var lastPoint = resultPointsArray[totalPointsCount-1];
		
		// mark the last as pointType = 1
		lastPoint.pointType = 1; 

		if (firstPoint.isCoincidentToPoint(lastPoint, errorDist))
		{
			// delete the last point.
			lastPoint = resultPointsArray.pop();
			lastPoint.deleteObjects();
			lastPoint = undefined;
		}
	}
	
	return resultPointsArray;
};

Ring2D_.prototype.getPolygon = function(resultPolygon)
{
	if (resultPolygon === undefined)
	{
		resultPolygon = new Polygon2D_();
	}
	
	if (resultPolygon.point2dList === undefined)
	{
		resultPolygon.point2dList = new Point2DList_();
	}
	
	// reset polygon
	resultPolygon.point2dList.deleteObjects();
	// TODO : 폴리곤에서 포인트를 가지고 오도록 변경해야함
	resultPolygon.point2dList.pointsArray = this.getPoints(resultPolygon.point2dList.pointsArray);
	
	// set idxData for all points
	var point;
	var pointsCount = resultPolygon.point2dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		point = resultPolygon.point2dList.getPoint(i);
		point.indexData = new IndexData_();
		point.indexData.owner = this;
	}
	
	return resultPolygon;
};
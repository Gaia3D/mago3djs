'use strict';

/**
 * 링형태의 폴리곤 객체를 생성하기 위한 클래스
 * 
 * @class
 */
var Ring2D = function() 
{
	if (!(this instanceof Ring2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
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
};

/**
 * 생성된 객체가 있다면 삭제하고 초기화 한다.
 */
Ring2D.prototype.deleteObjects = function()
{
	for (var i=0, len = this.elemsArray.length; i<len; i++)
	{
		this.elemsArray[i].deleteObjects();
	}
	this.elemsArray = [];
	
	if (this.polygon !== undefined)
	{
		this.polygon.deleteObjects();
	}
	
	this.polygon = undefined;
};

/**
 * 폴리곤을 생성하고 elemsArray 에 추가한다.
 * 
 * @param {String} type 폴리곤의 형태
 * @returns {Object} 지정된 형태로 생성한 폴리곤 객체
 */
Ring2D.prototype.newElement = function(type)
{
	var result = undefined;
	
	if (type === "ARC") { result = new Arc2D(); }
	else if (type === "CIRCLE") { result = new Circle2D(); }
	else if (type === "POLYLINE") { result = new PolyLine2D(); }
	else if (type === "RECTANGLE") { result = new Rectangle2D(); }
	else if (type === "STAR") { result = new Star2D(); }
	
	this.elemsArray.push(result);
	
	return result;
};

/**
 * 폴리곤을 생성한다.
 * 
 * @returns {Polygon2D} 폴리곤
 */
Ring2D.prototype.makePolygon = function()
{
	this.polygon = this.getPolygon(this.polygon);
	return this.polygon;
};

/**
 * 폴리곤을 생성한다.
 * 
 * @param {Polygon2D} resultPolygon 결과값을 저장할 폴리곤
 * @returns {Polygon2D} 수정되거나 새로 생성된 폴리곤
 */
Ring2D.prototype.getPolygon = function(resultPolygon)
{
	if (resultPolygon === undefined)
	{
		resultPolygon = new Polygon2D();
	}
	
	if (resultPolygon.point2dList === undefined)
	{
		resultPolygon.point2dList = new Point2DList();
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
		point.indexData = new IndexData();
		point.indexData.owner = this;
	}
	
	return resultPolygon;
};

/**
 * 다양한 폴리곤 배열에서 포인트를 구한다.
 * 
 * @param {Point2D[]} resultPointsArray 결과값을 저장할 포인트 배열
 * @returns {Point2D[]} 포인트 배열
 */
Ring2D.prototype.getPoints = function(resultPointsArray)
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









































'use strict';

/**
 * HalfEdge객체의 리스트
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class HalfEdgesList
 * @constructor
 */
var HalfEdgesList = function() 
{
	if (!(this instanceof HalfEdgesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * @type {Array.<HalfEdge>}
	 */
	this.hEdgesArray;
};

/**
 * hEdgesArray 초기화
 */
HalfEdgesList.getSegment3dsFromHedgesArray = function(hedgesArray, resultSegments3dArray)
{
	var hedgesCount = hedgesArray.length;
	if (hedgesCount === 0)
	{ return resultSegments3dArray; }
	
	if (resultSegments3dArray === undefined)
	{ resultSegments3dArray = []; }
	
	for (var i=0; i<hedgesCount; i++)
	{
		resultSegments3dArray.push(hedgesArray[i].getSegment3d());
	}
	
	return resultSegments3dArray;
};

/**
 * hEdgesArray 초기화
 */
HalfEdgesList.prototype.deleteObjects = function()
{
	if (this.hEdgesArray !== undefined)
	{
		var hedgesCount = this.hEdgesArray.length;
		for (var i=0; i<hedgesCount; i++)
		{
			this.hEdgesArray[i].deleteObjects();
			this.hEdgesArray[i] = undefined;
		}
		this.hEdgesArray = undefined;
	}
};

/**
 * 새로 HalfEdge 인스턴스를 생성하여 hEdgesArray에 추가한다.
 * @returns {HalfEdge} 새로 생성된 HalfEdge인스턴스를 반환.
 */
HalfEdgesList.prototype.newHalfEdge = function()
{
	if (this.hEdgesArray === undefined)
	{ this.hEdgesArray = []; }
	
	var hedge = new HalfEdge();
	this.hEdgesArray.push(hedge);
	return hedge;
};

/**
 * 기존 멤버 변수 hEdgesArray에 HalfEdge들을 추가.
 * @param {Array.<HalfEdge>} HalfEdge Required. HalfEdge들의 배열
 */
HalfEdgesList.prototype.addHalfEdgesArray = function(hEdgesArray)
{
	if (hEdgesArray === undefined)
	{ return; }
	
	if (this.hEdgesArray === undefined)
	{ this.hEdgesArray = []; }
	
	Array.prototype.push.apply(this.hEdgesArray, hEdgesArray);
};
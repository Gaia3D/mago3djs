'use strict';
/**
* 폴리곤을 구성하는 포인트의 인덱스데이터 객체
* Rind2D의 getPolygon 수행 시 인스턴스를 생성하여 각 포인트에 설정함.
* owner는 Ring2D instance로 설정.
*
* @exception {Error} Messages.CONSTRUCT_ERROR
* @class IndexData
* @constructor
*
* @see Ring2D#getPolygon
*/
var IndexData_ = function() 
{
	/**
	 * 포인트를 포함하는 Ring2D 객체
	 * @type {Ring2D}
	 */
	this.owner;

	/**
	 * 포인트의 idxInList
	 * @deprecated idx 대신 idxInList로 사용되고 있음. 변경 필요
	 * @type {Number}
	 */
	this.idx;
};

/**
 * delete the value of owner and idx.
 */
IndexData_.prototype.deleteObjects = function() 
{
	// Don't delete objects. Only assign as undefined.
	this.owner = undefined;
	this.idx = undefined;
};
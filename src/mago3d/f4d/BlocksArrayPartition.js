'use strict';

/**
 * 블록의 내용이 엄청 많아서 나눠서 받아야 할 경우 사용하기 위한 객체. 현재는 미구현 상태. 추후 f4d v0.0.2 이상부터 적용 될 예정
 * 
 * @class BlocksArrayPartition
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 */
var BlocksArrayPartition = function(version) 
{
	if (!(this instanceof BlocksArrayPartition)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArraybuffer; // file loaded data, that is no parsed yet.

};
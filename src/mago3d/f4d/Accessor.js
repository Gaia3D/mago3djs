'use strict';

/**
 * 버퍼 안의 데이터를 어떻게 읽어야 할지 키가 되는 객체
 * 
 * @alias Accessor
 * @class Accessor
 */
var Accessor = function () 
{

	if (!(this instanceof Accessor)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.bufferId;
	// 0= position, 1= normal, 2= color, 3= texcoord.***
	this.accesorType;
	this.bufferStart;
	// 버퍼의 시작 시점
	this.stride;
	// character, int 등
	this.dataType;
	// 2차원, 3차원
	this.dimension;

	// 데이터가 포함되어 있는 x,y,z의 한계를 바운드라고 한다. 바운드 좌표
	this.minX = 0.0;
	this.minY = 0.0;
	this.minZ = 0.0;
	this.maxX = 0.0;
	this.maxY = 0.0;
	this.maxZ = 0.0;
};

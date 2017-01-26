'use strict';

/**
 * 버퍼 안의 데이터를 어떻게 읽어야 할지 키가 되는 객체
 */
var Accessor = function() {
	
	if(!(this instanceof Accessor)) {
		throw new Error("이 객체는 new를 사용하여 생성해야 합니다.");
	}
		
	this.buffer_id;
	// 0= position, 1= normal, 2= color, 3= texcoord.***
	this.accesor_type;
	this.buffer_start;
	// 버퍼의 시작 시점
	this.stride;
	// character, int 등
	this.data_ytpe;
	// 2차원, 3차원
	this.dimension;
	
	// 데이터가 포함되어 있는 x,y,z의 한계를 바운드라고 한다. 바운드 좌표
	this.min_x = 0.0;
	this.min_y = 0.0;
	this.min_z = 0.0;
	this.max_x = 0.0;
	this.max_y = 0.0;
	this.max_z = 0.0;
};
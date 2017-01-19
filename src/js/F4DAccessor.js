'use strict';

/**
 * 버퍼 안의 데이터를 어떻게 읽어야 할지 키가 되는 객체
 */
var F4DAccessor = function() {
	// new 를 사용하도록 강제해야 함
	if(!(this instanceof F4DAccessor)) {
		throw new Error("이 객체는 new를 사용하여 생성해야 합니다.");
	}
		
	this.buffer_id = undefined;
	// 0= position, 1= normal, 2= color, 3= texcoord.***
	this.accesor_type = undefined;
	this.buffer_start = undefined;
	// 버퍼의 시작 시점
	this.stride = undefined;
	// character, int 등
	this.data_ytpe = undefined;
	// 2차원, 3차원
	this.dimension = undefined;
	
	// 데이터가 포함되어 있는 x,y,z의 한계를 바운드라고 한다. 바운드 좌표
	this.min_x = 0.0;
	this.min_y = 0.0;
	this.min_z = 0.0;
	this.max_x = 0.0;
	this.max_y = 0.0;
	this.max_z = 0.0;
};
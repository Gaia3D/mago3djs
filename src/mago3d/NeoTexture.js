'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var NeoTexture = function() {
	if(!(this instanceof NeoTexture)) {
		throw new Error("이 객체는 new를 사용하여 생성해야 합니다.");
	}
	
	this.lod;
	this.textureId; // texture id in gl.***
	this.texImage; // image. delete this once upload to gl.***
	this.load_started = false;
	this.load_finished = false;
};
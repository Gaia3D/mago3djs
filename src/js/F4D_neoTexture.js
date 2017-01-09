
var F4D_neoTexture = function()
{
	this.lod = undefined;
	this.textureId = undefined; // texture id in gl.***
	this.texImage = undefined; // image. delete this once upload to gl.***
	this.load_started = false;
	this.load_finished = false;
};
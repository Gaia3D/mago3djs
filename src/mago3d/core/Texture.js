'use strict';


/**
 * 맵 이미지. 머티리얼에는 텍스처에 대한 참조가 포함될 수 있으므로 머티리얼의 셰이더는 객체의 표면색을 계산하는 동안 텍스처를 사용할 수 있습니다.
 * 오브제의 표면의 기본 색상 (알베도) 외에도 텍스쳐는 반사율이나 거칠기와 같은 재질 표면의 많은 다른면을 나타낼 수 있습니다.
 * @class Texture
 */
var Texture = function() 
{
	if (!(this instanceof Texture)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.textureTypeName = "";
	this.textureImageFileName = "";
	this.texId;
	this.fileLoadState = CODE.fileLoadState.READY;
};

Texture.prototype.deleteObjects = function(gl)
{
	this.textureTypeName = undefined;
	this.textureImageFileName = undefined;
	if (this.texId)
	{
		gl.deleteTexture(this.texId);
	}
	this.texId = undefined;
	this.fileLoadState = undefined;
};

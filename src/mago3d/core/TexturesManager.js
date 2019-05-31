'use strict';

/**
 * Manages textures of the Mago3D.
 * @class TexturesManager
 */
var TexturesManager = function(magoManager) 
{
	if (!(this instanceof TexturesManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * Main Mago3D manager.
	 * @type {MagoManager}
	 * @default undefined.
	 */
	this._magoManager = magoManager;
	
	/**
	 * WebGL rendering context.
	 * @type {WebGLRenderingContext}
	 * @default undefined.
	 */
	this._gl = this._magoManager.getGl();

	/**
	 * Auxiliar texture 1x1 pixel.
	 * @type {WebGLTexture}
	 * @default undefined.
	 */
	this._textureAux_1x1;
	
	/**
	 * Noise texture 4x4 pixels used for ssao.
	 * @type {WebGLTexture}
	 * @default undefined.
	 */
	this._noiseTexture_4x4;
};

/**
 * Returns WebGL Rendering Context.
 */
TexturesManager.prototype.getGl = function()
{
	if (this._gl === undefined)
	{
		this._gl = this._magoManager.getGl();
	}
	
	return this._gl;
};


/**
 * Handles the loaded image.
 * 
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {image} image 
 * @param {WebGLTexture} texture 
 * @param {Boolean} flip_y_texCoords //if need vertical mirror of the image
 */
function handleTextureLoaded(gl, image, texture, flip_y_texCoords) 
{
	if (flip_y_texCoords === undefined)
	{ flip_y_texCoords = true; }
	
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip_y_texCoords); // if need vertical mirror of the image.***
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
};


/**
 * Returns the auxiliar texture 1x1 pixel. If is undefined, then creates it.
 */
TexturesManager.prototype.getTextureAux1x1 = function() 
{
	if (this._textureAux_1x1 === undefined)
	{
		var gl = this.getGl();
		this._textureAux_1x1 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this._textureAux_1x1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([150, 150, 150, 255])); // clear grey
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	return this._textureAux_1x1;
};




/**
 * Generates a noise texture.
 * It detects the coner or the area which need to be shaded by the distance to camera
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {Number} w The width of the texture.
 * @param {Number} h The height of the texture.
 * @param {Uint8Array} pixels Optional.
 * @returns {WebGLTexture} texture Returns WebGLTexture.
 */
function genNoiseTextureRGBA(gl, w, h, pixels) 
{
	var texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	if (pixels === undefined)
	{ pixels = new Uint8Array(4*4*4); }
	
	if (w === 4 && h === 4) 
	{
		var i = 0;
		pixels[i] = 50; i++;
		pixels[i] = 58; i++;
		pixels[i] = 229; i++;
		pixels[i] = 120; i++;
		pixels[i] = 212; i++;
		pixels[i] = 236; i++;
		pixels[i] = 251; i++;
		pixels[i] = 148; i++;
		pixels[i] = 75; i++;
		pixels[i] = 92; i++;
		pixels[i] = 246; i++;
		pixels[i] = 59; i++;
		pixels[i] = 197; i++;
		pixels[i] = 95; i++;
		pixels[i] = 235; i++;
		pixels[i] = 216; i++;
		pixels[i] = 130; i++;
		pixels[i] = 124; i++;
		pixels[i] = 215; i++;
		pixels[i] = 154; i++;
		pixels[i] = 25; i++;
		pixels[i] = 41; i++;
		pixels[i] = 221; i++;
		pixels[i] = 146; i++;
		pixels[i] = 187; i++;
		pixels[i] = 217; i++;
		pixels[i] = 130; i++;
		pixels[i] = 199; i++;
		pixels[i] = 142; i++;
		pixels[i] = 112; i++;
		pixels[i] = 61; i++;
		pixels[i] = 135; i++;
		pixels[i] = 67; i++;
		pixels[i] = 125; i++;
		pixels[i] = 159; i++;
		pixels[i] = 153; i++;
		pixels[i] = 215; i++;
		pixels[i] = 49; i++;
		pixels[i] = 49; i++;
		pixels[i] = 69; i++;
		pixels[i] = 126; i++;
		pixels[i] = 168; i++;
		pixels[i] = 61; i++;
		pixels[i] = 215; i++;
		pixels[i] = 21; i++;
		pixels[i] = 93; i++;
		pixels[i] = 183; i++;
		pixels[i] = 1; i++;
		pixels[i] = 125; i++;
		pixels[i] = 44; i++;
		pixels[i] = 22; i++;
		pixels[i] = 130; i++;
		pixels[i] = 197; i++;
		pixels[i] = 118; i++;
		pixels[i] = 109; i++;
		pixels[i] = 23; i++;
		pixels[i] = 195; i++;
		pixels[i] = 4; i++;
		pixels[i] = 148; i++;
		pixels[i] = 245; i++;
		pixels[i] = 124; i++;
		pixels[i] = 125; i++;
		pixels[i] = 185; i++;
		pixels[i] = 28; i++;
	}
	else 
	{
		for (var y=0; y<h; y++) 
		{
			for (var x=0; x<w; x++) 
			{
				pixels[(y*w + x)*4+0] = Math.floor(255 * Math.random());
				pixels[(y*w + x)*4+1] = Math.floor(255 * Math.random());
				pixels[(y*w + x)*4+2] = Math.floor(255 * Math.random());
				pixels[(y*w + x)*4+3] = Math.floor(255 * Math.random());
			}
		}
	}

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.bindTexture(gl.TEXTURE_2D, null);

	texture.width = w;
	texture.height = h;
	return texture;
};

/**
 * Returns the noise texture 4x4 pixels. If is undefined, then creates it. This texture is used when ssao.
 */
TexturesManager.prototype.getNoiseTexture4x4 = function() 
{
	if (this._noiseTexture_4x4 === undefined)
	{
		var gl = this.getGl();
		this._noiseTexture_4x4 = genNoiseTextureRGBA(gl, 4, 4, undefined);
	}
	
	return this._noiseTexture_4x4;
};






































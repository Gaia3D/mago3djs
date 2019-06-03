'use strict';

// CCTVList.
/**
 * 카메라
 * @class CCTVList
 */
var CCTVList = function() 
{
	if (!(this instanceof CCTVList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.camerasList = [];
	this.bDrawCCTVNames = true;
	
};

/**
 * Create CCTV with name
 * @param {String} name
 */
CCTVList.prototype.new_CCTV = function(name)
{
	var cctv = new CCTV();
	if (name !== undefined)
	{ cctv.name = name; }
	
	this.camerasList.push(cctv);
	return cctv;
};

/**
 * Get single CCTV instance as the index of the instance in this CCTV list
 * @param {Number} idx
 * @return {CCTV}
 */
CCTVList.prototype.getCCTV = function(idx)
{
	return this.camerasList[idx];
};

/**
 * Get single CCTV instance as the name of the instance
 * @param {String} cameraName the name of that CCTV
 */
CCTVList.prototype.getCCTVByName = function(cameraName)
{
	var find = false;
	var camerasCount = this.getCCTVCount();
	var i=0;
	var cam, resultCam;
	while (!find && i<camerasCount)
	{
		cam = this.getCCTV(i);
		if (cam.name === cameraName)
		{
			resultCam = cam;
			find = true;
		}
		i++;
	}
	
	return resultCam;
};

/**
 * Get the number of the CCTV in this list 
 * @return {Number} count
 */
CCTVList.prototype.getCCTVCount = function()
{
	return this.camerasList.length;
};

/**
 * Update the properties of the list of CCTV with current time and render the view that each CCTV show
 * @param {MagoManager} magoManager
 * @param shader
 */
CCTVList.prototype.render = function(magoManager, shader)
{
	var cctvsCount = this.getCCTVCount();
	
	if (cctvsCount === 0)
	{ return; }
	
	var gl = magoManager.sceneState.gl;
	shader.resetLastBuffersBinded();
	var shaderProgram = shader.program;
		
	gl.useProgram(shaderProgram);
	gl.uniform1i(shader.bApplySpecularLighting_loc, false);
	gl.disableVertexAttribArray(shader.texCoord2_loc);
	gl.enableVertexAttribArray(shader.position3_loc);
	gl.enableVertexAttribArray(shader.normal3_loc);
		
	shader.bindUniformGenerals();
	gl.uniform1i(shader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
	
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.noiseTexture);
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
	shader.last_tex_id = magoManager.textureAux_1x1;
		
	magoManager.renderer.renderTexture = false;
	var currTime = new Date().getTime();
		
	for (var i=0; i<cctvsCount; i++)
	{
		var cctv = this.getCCTV(i);
		cctv.updateColor(currTime);
		cctv.updateOrientation(currTime);
		cctv.render(gl, magoManager, shader);
		cctv.updateTime(currTime);
	}
	
	if (this.bDrawCCTVNames !== undefined && this.bDrawCCTVNames === true)
	{
		magoManager.drawCCTVNames(this.camerasList);
	}
	
	shader.disableVertexAttribArrayAll();
};
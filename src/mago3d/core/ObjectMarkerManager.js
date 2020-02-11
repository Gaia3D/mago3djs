'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
var ObjectMarkerManager = function() 
{
	if (!(this instanceof ObjectMarkerManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.objectMarkerArray = [];

};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.newObjectMarker = function()
{
	var objMarker = new ObjectMarker();
	this.objectMarkerArray.push(objMarker);
	return objMarker;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.render = function(magoManager, renderType)
{
	var objectsMarkersCount = magoManager.objMarkerManager.objectMarkerArray.length;
	if (objectsMarkersCount > 0)
	{
		var gl = magoManager.getGl();
		
		// now repeat the objects markers for png images.***
		// Png for pin image 128x128.********************************************************************
		if (magoManager.pin.positionBuffer === undefined)
		{ magoManager.pin.createPinCenterBottom(gl); }
		
		// check if pin textures is loaded.
		var currentTexture = magoManager.pin.texturesArray[0];
		if (!currentTexture || !currentTexture.texId)
		{
			magoManager.load_testTextures();
			return;
		}
		
		var shader = magoManager.postFxShadersManager.getShader("pin"); 
		shader.resetLastBuffersBinded();
		
		var shaderProgram = shader.program;
		
		gl.useProgram(shaderProgram);
		shader.bindUniformGenerals();
		gl.uniformMatrix4fv(shader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
		gl.uniform3fv(shader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
		gl.uniform3fv(shader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, magoManager.sceneState.modelViewRelToEyeMatrixInv._floatArrays);
		
		gl.uniform1i(shader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis); 
		// Tell the shader to get the texture from texture unit 0
		gl.uniform1i(shader.texture_loc, 0);
		gl.enableVertexAttribArray(shader.texCoord2_loc);
		gl.enableVertexAttribArray(shader.position4_loc);
		gl.activeTexture(gl.TEXTURE0);
		
		gl.depthRange(0, 0);
		//var context = document.getElementById('canvas2').getContext("2d");
		//var canvas = document.getElementById("magoContainer");
		
		gl.bindBuffer(gl.ARRAY_BUFFER, magoManager.pin.positionBuffer);
		gl.vertexAttribPointer(shader.position4_loc, 4, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, magoManager.pin.texcoordBuffer);
		gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
		
		gl.activeTexture(gl.TEXTURE0);
		
		gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
		
		var j=0;
		gl.depthMask(false);
		for (var i=0; i<objectsMarkersCount; i++)
		{
			if (j>= magoManager.pin.texturesArray.length)
			{ j=0; }
		
			//if (i === 4)
			//{ gl.uniform1i(shader.colorType_loc, 0); } // 0= oneColor, 1= attribColor, 2= texture.

			
			var currentTexture = magoManager.pin.texturesArray[j];
			var objMarker = magoManager.objMarkerManager.objectMarkerArray[i];
			var objMarkerGeoLocation = objMarker.geoLocationData;
			gl.bindTexture(gl.TEXTURE_2D, currentTexture.texId);
			gl.uniform3fv(shader.buildingPosHIGH_loc, objMarkerGeoLocation.positionHIGH);
			gl.uniform3fv(shader.buildingPosLOW_loc, objMarkerGeoLocation.positionLOW);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			
			j++;
		}
		gl.depthRange(0, 1);
		gl.depthMask(true);
		gl.useProgram(null);
		gl.bindTexture(gl.TEXTURE_2D, null);
		shader.disableVertexAttribArrayAll();
		
	}
};





































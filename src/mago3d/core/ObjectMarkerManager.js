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
ObjectMarkerManager.prototype.deleteObjects = function()
{
	var objectsMarkersCount = this.objectMarkerArray.length;
	for (var i=0; i<objectsMarkersCount; i++)
	{
		this.objectMarkerArray[i].deleteObjects();
		this.objectMarkerArray[i] = undefined;
	}
	this.objectMarkerArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.newObjectMarker = function(options, magoManager)
{
	var objMarker = new ObjectMarker();
	this.objectMarkerArray.push(objMarker);
	
	if (options)
	{
		if (options.positionWC)
		{
			var posWC = options.positionWC;
			if (objMarker.geoLocationData === undefined)
			{ objMarker.geoLocationData = new GeoLocationData(); }
			ManagerUtils.calculateGeoLocationDataByAbsolutePoint(posWC.x, posWC.y, posWC.z, objMarker.geoLocationData, magoManager);
		}
		
		if (options.imageFilePath)
		{
			objMarker.imageFilePath = options.imageFilePath;
		}
		
		if (options.imageFilePathSelected)
		{
			objMarker.imageFilePathSelected = options.imageFilePathSelected;
		}
	}
	
	return objMarker;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.render = function(magoManager, renderType)
{
	var objectsMarkersCount = this.objectMarkerArray.length;
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
		
		gl.depthRange(0, 0.05);
		//var context = document.getElementById('canvas2').getContext("2d");
		//var canvas = document.getElementById("magoContainer");
		
		gl.bindBuffer(gl.ARRAY_BUFFER, magoManager.pin.positionBuffer);
		gl.vertexAttribPointer(shader.position4_loc, 4, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, magoManager.pin.texcoordBuffer);
		gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
		
		gl.activeTexture(gl.TEXTURE0);
		
		gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(shader.oneColor4_loc, [0.2, 0.7, 0.9, 1.0]);
		gl.uniform2fv(shader.scale2d_loc, [1.0, 1.0]);
		
		//gl.depthMask(false);
		var selectionManager = magoManager.selectionManager;
		var lastTexId = undefined;
		if (renderType === 1)
		{
			for (var i=0; i<objectsMarkersCount; i++)
			{
				var objMarker = magoManager.objMarkerManager.objectMarkerArray[i];
				var currentTexture = magoManager.pin.getTexture(objMarker.imageFilePath);
				
				if (!currentTexture)
				{
					magoManager.pin.loadImage(objMarker.imageFilePath, magoManager);
					continue;
				}
				
				if (selectionManager.isObjectSelected(objMarker))
				{
					gl.uniform2fv(shader.scale2d_loc, [1.5, 1.5]);
					if (objMarker.imageFilePathSelected)
					{
						var selectedTexture = magoManager.pin.getTexture(objMarker.imageFilePathSelected);
						if (selectedTexture)
						{ currentTexture = selectedTexture; }
						else 
						{
							magoManager.pin.loadImage(objMarker.imageFilePathSelected, magoManager);
							continue;
						}
					}
				}
				else
				{
					gl.uniform2fv(shader.scale2d_loc, [1.0, 1.0]);
				}
				
				
				var objMarkerGeoLocation = objMarker.geoLocationData;
				
				if (currentTexture.texId !== lastTexId)
				{
					gl.bindTexture(gl.TEXTURE_2D, currentTexture.texId);
					lastTexId = currentTexture.texId;
				}
					
				gl.uniform3fv(shader.buildingPosHIGH_loc, objMarkerGeoLocation.positionHIGH);
				gl.uniform3fv(shader.buildingPosLOW_loc, objMarkerGeoLocation.positionLOW);

				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			}
		}
		else if (renderType === 2)
		{
			// Selection render.***
			var selectionColor = magoManager.selectionColor;
			gl.disable(gl.BLEND);
			gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
			
			for (var i=0; i<objectsMarkersCount; i++)
			{
				var objMarker = magoManager.objMarkerManager.objectMarkerArray[i];
				var objMarkerGeoLocation = objMarker.geoLocationData;
				
				var colorAux = selectionColor.getAvailableColor(undefined);
				var idxKey = selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
				selectionManager.setCandidateGeneral(idxKey, objMarker);
			
				gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
			
				gl.uniform3fv(shader.buildingPosHIGH_loc, objMarkerGeoLocation.positionHIGH);
				gl.uniform3fv(shader.buildingPosLOW_loc, objMarkerGeoLocation.positionLOW);

				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}
			gl.enable(gl.BLEND);
		}
		
		gl.depthRange(0, 1);
		//gl.depthMask(true);
		gl.useProgram(null);
		gl.bindTexture(gl.TEXTURE_2D, null);
		shader.disableVertexAttribArrayAll();
		
	}
};





































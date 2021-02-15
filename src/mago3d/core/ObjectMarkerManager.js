'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
var ObjectMarkerManager = function(magoManager) 
{
	if (!(this instanceof ObjectMarkerManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.magoManager = magoManager;
	this.objectMarkerArray = [];
	this.objectMarkerMap = {};
	this.pin = new Pin();
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
	this.objectMarkerArray.length = 0;
	this.objectMarkerMap = {};
};

ObjectMarkerManager.prototype.deleteObject = function(objMarkerId)
{
	var objectsMarkersCount = this.objectMarkerArray.length;
	for (var i=0; i<objectsMarkersCount; i++)
	{
		if (this.objectMarkerArray[i].id === objMarkerId)
		{
			this.objectMarkerArray[i].deleteObjects();
			//this.objectMarkerArray[i] = undefined;
			delete this.objectMarkerMap.objMarkerId;
			this.objectMarkerArray.splice(i, 1);
			break;
		}
	}
		
};

ObjectMarkerManager.prototype.setMarkerByCondition = function(condition)
{
	var that = this;
	var arr = that.objectMarkerArray.filter(function(om)
	{
		return condition.call(that, om);
	});
	that.objectMarkerArray = arr;
};
/**
 * start rendering.
 * @param scene 변수
 * @param isLastFrustum 변수
 */
 
ObjectMarkerManager.prototype.loadDefaultImages = function(magoManager) 
{
	if (this.pin.defaultImagesLoaded === false)
	{
		var gl = magoManager.getGl();
		var magoPolicy = magoManager.magoPolicy;
		var pin = this.pin;
		
		var filePath_inServer = magoPolicy.imagePath + "/defaultRed.png";
		var texture = pin.loadImage(filePath_inServer, magoManager);
		pin.imageFileMap.defaultRed = texture;
		
		filePath_inServer = magoPolicy.imagePath + "/defaultBlue.png";
		var texture = pin.loadImage(filePath_inServer, magoManager);
		pin.imageFileMap.defaultBlue = texture;
		
		filePath_inServer = magoPolicy.imagePath + "/defaultOrange.png";
		var texture = pin.loadImage(filePath_inServer, magoManager);
		pin.imageFileMap.defaultOrange = texture;
		
		filePath_inServer = magoPolicy.imagePath + "/defaultCian.png";
		var texture = pin.loadImage(filePath_inServer, magoManager);
		pin.imageFileMap.defaultCian = texture;
		
		this.pin.defaultImagesLoaded = true;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.newObjectMarker = function(options, magoManager)
{
	// This function creates 
	var objMarker = new ObjectMarker();
	this.objectMarkerArray.push(objMarker);
	
	if (options)
	{
		if (options.id !== undefined)
		{
			objMarker.id = options.id;
			this.objectMarkerMap[objMarker.id] = objMarker;
		}

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
		
		if (options.sizeX && options.sizeY)
		{
			if (objMarker.size2d === undefined)
			{ objMarker.size2d = new Float32Array([25.0, 25.0]); }
			objMarker.size2d[0] = options.sizeX;
			
			if (objMarker.size2d === undefined)
			{ objMarker.size2d = new Float32Array([25.0, 25.0]); }
			objMarker.size2d[1] = options.sizeY;
			
			objMarker.bUseOriginalImageSize = false;
		}
		else
		{
			objMarker.bUseOriginalImageSize = true;
		}

		if (options.target)
		{ objMarker.target = options.target; }
	}
	
	return objMarker;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.getObjectMarkerById = function(id)
{
	if (this.objectMarkerMap[id] === undefined)
	{
		// find objectMarker by id.
		var objectsCount = this.objectMarkerArray.length;
		var find = false;
		var i=0; 
		while (!find && i<objectsCount)
		{
			if (this.objectMarkerArray[i].id === id)
			{
				find = true;
				this.objectMarkerMap[id] = this.objectMarkerArray[i];
			}
			i++;
		}
	}

	return this.objectMarkerMap[id];
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.newObjectMarkerSpeechBubble = function(options, magoManager)
{
	// This function creates a speechBubble type object marker.
	if (!options)
	{ return undefined; }

	//magoManager에 SpeechBubble 객체 없으면 생성하여 등록
	if (!magoManager.speechBubble) 
	{
		magoManager.speechBubble = new Mago3D.SpeechBubble();
	}

	var sb = magoManager.speechBubble;
	//var bubbleColor = Color.getHexCode(1.0, 1.0, 1.0);
	//SpeechBubble 옵션
	//var commentTextOption = {
	//	pixel       : 12,
	//	color       : 'blue',
	//	borderColor : 'white',
	//	text        : 'blabla'
	//};

	//SpeechBubble을 통해서 png 만들어서 가져오기
	//var img = sb.getPng([64, 64], bubbleColor, commentTextOption);


	var speechBubbleOptions = options.speechBubbleOptions;
	if (!speechBubbleOptions)
	{ return undefined; }

	var sbWidht = speechBubbleOptions.width;
	var sbHeight = speechBubbleOptions.height;
	var commentTextOption = speechBubbleOptions.commentTextOption;
	var bubbleColor = speechBubbleOptions.bubbleColor;
	var bubbleHexColor = Color.getHexCode(bubbleColor.r, bubbleColor.g, bubbleColor.b);
	var img = sb.getPng([sbWidht, sbHeight], bubbleHexColor, commentTextOption);

	var target = options.target;
	if (target)
	{
		// Check the target type.
		//,
		//	sizeX         : sbWidht,
		//	sizeY         : sbHeight

		var optionsObjectMarker = {
			target        : target,
			imageFilePath : img,
			id            : options.id
		};

		//지도에 ObjectMarker생성하여 표출
		this.newObjectMarker(optionsObjectMarker, magoManager);
	}
	else
	{
		// Independent objectMarker.
		//ObjectMarker 옵션, 위치정보와 이미지 정보
		var lon = options.longitude;
		var lat = options.latitude;
		var alt = options.altitude;
		var optionsObjectMarker = {
			positionWC    : Mago3D.ManagerUtils.geographicCoordToWorldPoint(lon, lat, alt),
			imageFilePath : img,
			id            : options.id
		};

		//지도에 ObjectMarker생성하여 표출
		this.newObjectMarker(optionsObjectMarker, magoManager);
	}

	/*
	if (!magoManager.speechBubble) 
	{
		magoManager.speechBubble = new Mago3D.SpeechBubble();
	}

	var sb = magoManager.speechBubble;
	var bubbleColor = Color.getHexCode(1.0, 1.0, 1.0);
	//SpeechBubble 옵션
	var commentTextOption = {
		pixel       : 12,
		color       : 'blue',
		borderColor : 'white',
		text        : 'blabla'
	};

	//SpeechBubble을 통해서 png 만들어서 가져오기
	var img = sb.getPng([64, 64], bubbleColor, commentTextOption);

	//ObjectMarker 옵션, 위치정보와 이미지 정보
	var geoCoord = geoCoordsList.getGeoCoord(i);
	var lon = geoCoord.longitude;
	var lat = geoCoord.latitude;
	var alt = geoCoord.altitude;
	var options = {
		positionWC    : Mago3D.ManagerUtils.geographicCoordToWorldPoint(lon, lat, alt),
		imageFilePath : img
	};

	//지도에 ObjectMarker생성하여 표출
	this.newObjectMarker(options, magoManager);
	*/
};

ObjectMarkerManager.prototype.TEST__ObjectMarker_toNeoReference = function() 
{
	
	// buildingId: "SD_COUNCIL_del"
	// projectId: "3ds.json"

	// objectId: "11011" -> refMatrixType: 0 // sostre verd mig circular
	// objectId: "2953" -> refMatrixType: 1 // cadira vermella a l'interior.
	// objectId: "2837" -> refMatrixType: 2 // cadira vermella a l'interior.
	

	//var objMarkerManager = this.objMarkerManager;
	var bubbleWidth = 128;
	var bubbleHeight = 128;
	var textSize = 36;

	// 1rst object.***************************************************************
	var target = {
		projectId  : "3ds",
		buildingId : "SD_COUNCIL_del",
		objectId   : "11011"
	};

	var commentTextOption = {
		pixel       : textSize,
		color       : 'blue',
		borderColor : 'white',
		text        : '11011'
	};

	var speechBubbleOptions = {
		width             : bubbleWidth,
		height            : bubbleHeight,
		commentTextOption : commentTextOption,
		bubbleColor       : {r: 1, g: 1, b: 1}
	};

	var options = {
		speechBubbleOptions : speechBubbleOptions,
		target              : target
	};

	this.newObjectMarkerSpeechBubble(options, this);

	// 2nd object.***************************************************************
	var target = {
		projectId  : "3ds",
		buildingId : "SD_COUNCIL_del",
		objectId   : "2953"
	};

	var commentTextOption = {
		pixel       : textSize,
		color       : 'blue',
		borderColor : 'white',
		text        : '2953'
	};

	var speechBubbleOptions = {
		width             : bubbleWidth,
		height            : bubbleHeight,
		commentTextOption : commentTextOption,
		bubbleColor       : {r: 1, g: 1, b: 1}
	};

	var options = {
		speechBubbleOptions : speechBubbleOptions,
		target              : target
	};

	this.newObjectMarkerSpeechBubble(options, this);

	// 3rd object.***************************************************************
	var target = {
		projectId  : "3ds",
		buildingId : "SD_COUNCIL_del",
		objectId   : "2837"
	};

	var commentTextOption = {
		pixel       : textSize,
		color       : 'blue',
		borderColor : 'white',
		text        : '2837'
	};

	var speechBubbleOptions = {
		width             : bubbleWidth,
		height            : bubbleHeight,
		commentTextOption : commentTextOption,
		bubbleColor       : {r: 1, g: 1, b: 1}
	};

	var options = {
		speechBubbleOptions : speechBubbleOptions,
		target              : target
	};

	this.newObjectMarkerSpeechBubble(options, this);
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
		// Check if defaultImages are loaded.
		//this.loadDefaultImages(magoManager);
		var gl = magoManager.getGl();
		
		// now repeat the objects markers for png images.***
		// Png for pin image 128x128.********************************************************************
		if (this.pin.positionBuffer === undefined)
		{ this.pin.createPinCenterBottom(gl); }
		//-------------------------------------------------------------------------------------------------------------
		
		var shader = magoManager.postFxShadersManager.getShader("pin"); 
		shader.resetLastBuffersBinded();
		
		var shaderProgram = shader.program;
		
		gl.useProgram(shaderProgram);
		shader.bindUniformGenerals();
		magoManager.effectsManager.setCurrentShader(shader);
		gl.uniformMatrix4fv(shader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
		gl.uniform3fv(shader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
		gl.uniform3fv(shader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, magoManager.sceneState.modelViewRelToEyeMatrixInv._floatArrays);
		gl.uniform1f(shader.screenWidth_loc, parseFloat(magoManager.sceneState.drawingBufferWidth[0]));
		gl.uniform1f(shader.screenHeight_loc, parseFloat(magoManager.sceneState.drawingBufferHeight[0]));
		gl.uniform1i(shader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis); 
		// Tell the shader to get the texture from texture unit 0
		gl.uniform1i(shader.texture_loc, 0);
		gl.enableVertexAttribArray(shader.texCoord2_loc);
		gl.enableVertexAttribArray(shader.position4_loc);
		gl.activeTexture(gl.TEXTURE0);
		
		//gl.depthRange(0, 0.05);
		//var context = document.getElementById('canvas2').getContext("2d");
		//var canvas = document.getElementById("magoContainer");
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.pin.positionBuffer);
		gl.vertexAttribPointer(shader.position4_loc, 4, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.pin.texcoordBuffer);
		gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
		
		gl.activeTexture(gl.TEXTURE0);
		
		gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(shader.oneColor4_loc, [0.2, 0.7, 0.9, 1.0]);
		gl.uniform2fv(shader.scale2d_loc, [1.0, 1.0]);
		gl.uniform2fv(shader.size2d_loc, [25.0, 25.0]);
		gl.uniform1i(shader.bUseOriginalImageSize_loc, true);
		gl.uniform3fv(shader.aditionalOffset_loc, [0.0, 0.0, 0.0]);
		
		//gl.depthMask(false);
		//gl.disable(gl.BLEND);
		var selectionManager = magoManager.selectionManager;
		var lastTexId = undefined;
		if (renderType === 1)
		{
			gl.enable(gl.BLEND);
			var executedEffects = false;
			for (var i=0; i<objectsMarkersCount; i++)
			{
				var objMarker = magoManager.objMarkerManager.objectMarkerArray[i];
				var currentTexture = this.pin.getTexture(objMarker.imageFilePath);
				
				if (!currentTexture)
				{
					this.pin.loadImage(objMarker.imageFilePath, magoManager);
					continue;
				}
				
				if (selectionManager.isObjectSelected(objMarker))
				{
					gl.uniform2fv(shader.scale2d_loc, new Float32Array([1.5, 1.5]));
					if (objMarker.imageFilePathSelected)
					{
						var selectedTexture = this.pin.getTexture(objMarker.imageFilePathSelected);
						if (selectedTexture)
						{ currentTexture = selectedTexture; }
						else 
						{
							this.pin.loadImage(objMarker.imageFilePathSelected, magoManager);
							continue;
						}
					}
				}
				else
				{
					gl.uniform2fv(shader.scale2d_loc, new Float32Array([1.0, 1.0]));
				}
				gl.uniform1i(shader.bUseOriginalImageSize_loc, objMarker.bUseOriginalImageSize);
				if (!objMarker.bUseOriginalImageSize)
				{ gl.uniform2fv(shader.size2d_loc, objMarker.size2d); }
			
				// Check if there are effects.
				if (renderType !== 2 && magoManager.currentProcess !== CODE.magoCurrentProcess.StencilSilhouetteRendering)
				{ executedEffects = magoManager.effectsManager.executeEffects(objMarker.id, magoManager); }
			
				gl.uniform2fv(shader.imageSize_loc, [currentTexture.texId.imageWidth, currentTexture.texId.imageHeight]);
				
				//var objMarkerGeoLocation = objMarker.geoLocationData; // original.
				var objMarkerGeoLocation = objMarker.getGeoLocationData(magoManager);
				if (objMarkerGeoLocation === undefined)
				{ continue; }
				
				if (currentTexture.texId !== lastTexId)
				{
					gl.bindTexture(gl.TEXTURE_2D, currentTexture.texId);
					lastTexId = currentTexture.texId;
				}
				
				gl.uniform3fv(shader.buildingPosHIGH_loc, objMarkerGeoLocation.positionHIGH);
				gl.uniform3fv(shader.buildingPosLOW_loc, objMarkerGeoLocation.positionLOW);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			}
			
			if (executedEffects)
			{
				// must return all uniforms changed for effects.
				gl.uniform3fv(shader.aditionalOffset_loc, [0.0, 0.0, 0.0]); // init referencesMatrix.
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

				var currentTexture = this.pin.getTexture(objMarker.imageFilePath);
				if (!currentTexture)
				{
					this.pin.loadImage(objMarker.imageFilePath, magoManager);
					continue;
				}

				var objMarkerGeoLocation = objMarker.getGeoLocationData(magoManager);
				if (objMarkerGeoLocation === undefined)
				{ continue; }

				if (currentTexture.texId !== lastTexId)
				{
					gl.bindTexture(gl.TEXTURE_2D, currentTexture.texId);
					lastTexId = currentTexture.texId;
				}

				if (selectionManager.isObjectSelected(objMarker))
				{
					gl.uniform2fv(shader.scale2d_loc, new Float32Array([1.5, 1.5]));
					if (objMarker.imageFilePathSelected)
					{
						var selectedTexture = this.pin.getTexture(objMarker.imageFilePathSelected);
						if (selectedTexture)
						{ currentTexture = selectedTexture; }
						else 
						{
							this.pin.loadImage(objMarker.imageFilePathSelected, magoManager);
							continue;
						}
					}
				}
				else
				{
					gl.uniform2fv(shader.scale2d_loc, new Float32Array([1.0, 1.0]));
				}
				
				var colorAux = selectionColor.getAvailableColor(undefined);
				var idxKey = selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
				selectionManager.setCandidateGeneral(idxKey, objMarker);
			
				gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
			
				gl.uniform3fv(shader.buildingPosHIGH_loc, objMarkerGeoLocation.positionHIGH);
				gl.uniform3fv(shader.buildingPosLOW_loc, objMarkerGeoLocation.positionLOW);

				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}
		}
		
		gl.disable(gl.BLEND);
		gl.depthRange(0, 1);
		gl.depthMask(true);
		gl.useProgram(null);
		//gl.bindTexture(gl.TEXTURE_2D, null);
		//shader.disableVertexAttribArrayAll();
		
	}
};





































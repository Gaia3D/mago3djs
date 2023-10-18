'use strict';

/**
 * @class OceanFluxLayer
 */
var OceanFluxLayer = function (options) 
{
	if (!(this instanceof OceanFluxLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._oceanFluxManager = undefined;
	this._geoJsonFilePath = options.geoJsonFilePath;
	this._geoJsonFile = undefined;
	this._geoJsonFileLoadState = CODE.fileLoadState.READY;
	this._oceanFluxMapTexture = undefined;
	this.oceanFluxMapFolderPath = undefined;
	this.gl = undefined;
	this.streamLinesArray = undefined;

	// Animation state controls.
	this._animationState = 1; // 0= paused. 1= play.
	this._particlesGenerationType = 1; // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox. 3= altitudePlane
	this._animationSpeed = 1; // default.

	// framebuffer.
	this.framebuffer = undefined;

	if (options)
	{
		if (options.oceanFluxManager)
		{
			this._oceanFluxManager = options.oceanFluxManager;
		}

		if (options.oceanFluxMapFolderPath)
		{
			this.oceanFluxMapFolderPath = options.oceanFluxMapFolderPath;
		}

		if (options.gl)
		{
			this.gl = options.gl;
		}
	}

	/* geoJson file sample:
	{
	"type": "Feature",
	"bbox": [
		-180.0,
		-90.0,
		0.0,
		180.0,
		90.0,
		0.0
	],
	"geometry": {
		"type": "Polygon",
		"coordinates": [
			[
				[
					126.9863972315756,
					37.42705219737738,
					27.5
				],
				[
					127.03204107058979,
					37.42704863771866,
					27.5
				],
				[
					127.03205659741529,
					37.46344961762591,
					27.5
				],
				[
					126.98639063979063,
					37.463453181943368,
					27.5
				],
				[
					126.9863972315756,
					37.42705219737738,
					27.5
				]
			]
		]
	},
	"properties": {
		"altitude": "27.5",
		"image": {
			"width": "360",
			"height": "180",
			"uri": "ocean1.png"
		},
		"value": {
			"r": {
				"min": -1.5115000009536744,
				"max": 1.4980000257492066
			},
			"g": {
				"min": -2.1756999492645265,
				"max": 0.7261000275611877
			},
			"b": {
				"min": -0.7382000088691711,
				"max": 0.7077000141143799
			}
		}
	}
}
	*/
};
	

OceanFluxLayer.prototype.setGeoJson = function (windGeoJson)
{
	if (!windGeoJson)
	{
		return;
	}

	this._geoJsonFile = windGeoJson;
	this._geoJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;

	//if (this._geoJsonFile.style && this._geoJsonFile.style.colorRamp)
	//{
	// make a colorRamp.
	//	this.colorRamp = new ColorRamp(this._geoJsonFile.style.colorRamp);
	//}
};

OceanFluxLayer.prototype.loadGeoJson = function ()
{
	// This is the geoJson version. 2021.
	if (this._geoJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this._geoJsonFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._geoJsonFilePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that.setGeoJson(res);
		});
	}
};

OceanFluxLayer.prototype._prepareGeoJson = function()
{
	if (this._geoJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this.loadGeoJson();
		return false;
	}
	else if (this._geoJsonFileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	return true;
};

OceanFluxLayer.prototype._prepareOceanFluxMapTexture = function ()
{
	if (this._oceanFluxMapTexture === undefined)
	{
		this._oceanFluxMapTexture = new Texture();
		this._oceanFluxMapTexture.texId = this.gl.createTexture();
	}

	if (this._oceanFluxMapTexture.fileLoadState === CODE.fileLoadState.READY)
	{
		if (!this.oceanFluxMapFileName)
		{
			// Find the png file name inside of the geoJson.***
			if (!this._geoJsonFile)
			{ return false; }

			this.oceanFluxMapFileName = this._geoJsonFile.properties.image.uri;
			//var imageFullName = this._geoJsonFile.properties.image.uri;
			//var splitted = imageFullName.split('.');
			//this.oceanFluxMapFileName = splitted[0];
		}

		var oceanFluxMapTexturePath;

		if (!this.oceanFluxMapFolderPath || this.oceanFluxMapFolderPath.length === 0)
		{
			// 서버에서 serviceUri를 생성할 경우 2022.07.21 정연화 수정
			oceanFluxMapTexturePath = this._geoJsonFile.properties.image.serviceUri;
		}
		else
		{
			// 서버에서 serviceUri를 생성하지 않은 경우 (더블 슬러시 문제 해결) 2022.07.21 정연화 수정
			oceanFluxMapTexturePath = this.oceanFluxMapFolderPath + "/" + this.oceanFluxMapFileName;
		}

		ReaderWriter.loadImage(this.gl, oceanFluxMapTexturePath, this._oceanFluxMapTexture);
		return false;
	}
	else if (this._oceanFluxMapTexture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return false;
	}

	return true;

};

OceanFluxLayer.prototype.prepareLayer = function()
{
	// We need:
	// 1- geoJson file.
	//-------------------------------------------
	// 1rst, check if the geoJson is loaded.***
	if (!this._prepareGeoJson())
	{
		return false;
	}

	// 2nd, check if the oceanFluxMapTexture is loaded.***
	if (!this._prepareOceanFluxMapTexture())
	{
		return false;
	}

	return true;
};

OceanFluxLayer.prototype.getGeographicExtent = function()
{
	if (!this.geoExtent)
	{
		// make it.
		var minLon = this._geoJsonFile.bbox[0];
		var minLat = this._geoJsonFile.bbox[1];
		var minAlt = this._geoJsonFile.bbox[2];
		var maxLon = this._geoJsonFile.bbox[3];
		var maxLat = this._geoJsonFile.bbox[4];
		var maxAlt = this._geoJsonFile.bbox[5];
		
		if (this._geoJsonFile.height_above_ground !== undefined)
		{ minAlt = this._geoJsonFile.height_above_ground[0]; }

		maxAlt = minAlt;
		
		this.geoExtent = new GeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
	}

	return this.geoExtent;
};

OceanFluxLayer.prototype.getVelocityVector2d = function (pixelX, pixelY, resultPoint2d, magoManager)
{
	// Note: to call this function MUST BE BINDED the windTexture.
	//-------------------------------------------------------------
	// Now, bind windTexture and read the pixel(pixelX, pixelY).
	// Read the picked pixel and find the object.*********************************************************
	var texWidth = this._oceanFluxMapTexture.imageWidth;
	var texHeight = this._oceanFluxMapTexture.imageHeight;
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }

	if (!this.windVelocityMap)
	{
		var gl = magoManager.getGl();

		if (this.framebuffer === undefined)
		{ this.framebuffer = gl.createFramebuffer(); }

		// bind framebuffer.
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		// attach the WINDMAP texture to the framebuffer.
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._oceanFluxMapTexture.texId, 0);
		var canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
		if (canRead)
		{
			var totalPixelsCount = texWidth*texHeight;
			this.windVelocityMap = new Uint8Array(4 * totalPixelsCount); // 1 pixels select.***
			gl.readPixels(0, 0, texWidth, texHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.windVelocityMap);
		}
		// Unbind the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	var idx = pixelY * texWidth + pixelX;
	var red = this.windVelocityMap[idx*4]/255.0;
	var green = this.windVelocityMap[idx*4+1]/255.0;
	var blue = this.windVelocityMap[idx*4+2]/255.0;
	var alpha = this.windVelocityMap[idx*4+3]/255.0;

	// Now, considering the maxWindU, minWindU, maxWindV & minWindV, calculate the wind speed.
	if (!this.windData)
	{
		this.windData = {};
		this.windData.uMin = this._geoJsonFile.properties.value.r.min;
		this.windData.uMax = this._geoJsonFile.properties.value.r.max;
		this.windData.vMin = this._geoJsonFile.properties.value.g.min;
		this.windData.vMax = this._geoJsonFile.properties.value.g.max;
		//this.windData.wMin = this._geoJsonFile.properties.value.b.min;
		//this.windData.wMax = this._geoJsonFile.properties.value.b.max;
	}
	var uMin = this.windData.uMin;
	var vMin = this.windData.vMin;
	var uMax = this.windData.uMax;
	var vMax = this.windData.vMax;
	//vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(windMapTexCoord));
	// mix(v1, v2, a) = v1 * (1 - a) + v2 * a
	
	var velU = uMin * (1.0 - red) + uMax * red;
	var velV = vMin * (1.0 - green) + vMax * green;
	
	if (resultPoint2d === undefined)
	{ resultPoint2d = new Point2D(); }
	
	resultPoint2d.set(velU, velV);
	return resultPoint2d;
};

OceanFluxLayer.prototype.getVelocityVector2d_biLinearInterpolation = function (s, t, resultPoint2d, magoManager)
{
	
	/*
	vec2 px = 1.0 / u_wind_res;
    vec2 vc = (floor(uv * u_wind_res)) * px;
    vec2 f = fract(uv * u_wind_res);
    vec2 tl = texture2D(u_wind, vc).rg;
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_wind, vc + px).rg;
	return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
	*/

	var texWidth = this._oceanFluxMapTexture.imageWidth;
	var texHeight = this._oceanFluxMapTexture.imageHeight;
	var pixelX = Math.floor(s*(texWidth));
	var pixelY = Math.floor(t*(texHeight));
	
	var st = s*texWidth;
	var tt = t*texHeight;
	var fx = Math.ceil(((st < 1.0) ? st : (st % Math.floor(st))) * 10000)/10000;
	var fy = Math.ceil(((tt < 1.0) ? tt : (tt % Math.floor(tt))) * 10000)/10000;
	

	//var vel = this.getVelocityVector2d(pixelX, pixelY, undefined, magoManager); // unique code if no interpolation.

	var pixelXPlus = pixelX+1 < texWidth ? pixelX+1 : pixelX;
	var pixelYPlus = pixelY+1 < texHeight ? pixelY+1 : pixelY;
	var vel_tl = this.getVelocityVector2d(pixelX, pixelY, undefined, magoManager);
	var vel_tr = this.getVelocityVector2d(pixelXPlus, pixelY, undefined, magoManager);
	var vel_bl = this.getVelocityVector2d(pixelX, pixelYPlus, undefined, magoManager);
	var vel_br = this.getVelocityVector2d(pixelXPlus, pixelYPlus, undefined, magoManager);
	
	var vel_t = Point2D.mix(vel_tl, vel_tr, fx, undefined);
	var vel_b = Point2D.mix(vel_bl, vel_br, fx, undefined);

	if (!resultPoint2d)
	{ resultPoint2d = new Point2D(); }

	resultPoint2d = Point2D.mix(vel_t, vel_b, fy, resultPoint2d);
	
	return resultPoint2d;
};

OceanFluxLayer.prototype._getTrajectoryInGeographicCoordsRad = function (startGeoCoord, magoManager, options)
{
	// Obtain the velocity in this geoCoord.
	var geoExtent = this.getGeographicExtent();

	// 1rst, check if the geoCoord is inside of this windLayer range.
	if (!geoExtent.intersects2dWithGeoCoord(startGeoCoord))
	{ return undefined; }

	var minLonRad = geoExtent.getMinLongitudeRad();
	var minLatRad = geoExtent.getMinLatitudeRad();
	var maxLonRad = geoExtent.getMaxLongitudeRad();
	var maxLatRad = geoExtent.getMaxLatitudeRad();
	var lonRadRange = maxLonRad - minLonRad;
	var latRadRange = maxLatRad - minLatRad;

	// Calculate the texCoord of the "geoCoord".
	var currLon = startGeoCoord.getLongitudeRad();
	var currLat = startGeoCoord.getLatitudeRad();
	var currAlt = startGeoCoord.getAltitude();

	// Test to calculate speedFactor by globeRadius.**********************************************************
	var midLat = geoExtent.getCenterLatitude();
	var radius = Globe.radiusAtLatitudeDeg(midLat);
	var distortion = Math.cos(midLat * Math.PI/180);
	var meterToLon = 1.0 / (radius * distortion);
	var meterToLat = 1.0 / radius;

	var speedFactor = 100.0;
	var xSpeedFactor = speedFactor;
	var ySpeedFactor = speedFactor;
	var zSpeedFactor = speedFactor;
	//---------------------------------------------------------------------------------------------------
	
	var numPoints = 20;
	
	if (options)
	{
		if (options.numPoints !== undefined)
		{ numPoints = options.numPoints; }
	}

	var resultGeoCoordsArray = []; 

	//var pointLC = new Point3D();
	//resultPointsLCArray.push(pointLC); // push the 1rst pointLC.***

	var curXinMeters = 0.0;
	var curYinMeters = 0.0;
	var curZinMeters = 0.0;
	var offsetXinMeters;
	var offsetYinMeters;
	var offsetZinMeters;
	
	// Create a lineString with numPoints.***
	var velocityLC;
	var velocityWC; 
	var speedUp;
	var velocity3d = new Point3D();
	var zFactor;
	var numPointsToSample = numPoints * 100;
	var currPoint = 0;
	for (var i=0; i<numPointsToSample; i++)
	{
		// Calculate texCoord (s, t). The (s, t) texCoord is used to read the windTexture.*** 
		var s = (currLon - minLonRad)/lonRadRange;
		var t = (currLat - minLatRad)/latRadRange;

		if (s > 1.0 || t > 1.0 || s < 0.0 || t < 0.0)
		{
			// Considere process finished.***
			return resultGeoCoordsArray;
		}
		

		velocityLC = this.getVelocityVector2d_biLinearInterpolation(s, t, velocityLC, magoManager);

		// now, calculate the velocityWC.***
		//velocityWC = new Point3D();

		
		// now, do weight-interpolation.
		//velocity3d = Point3D.mix(speedDown, speedUp, zFactor, undefined); // Note : MUST be "undefined".*** OLD.***
		velocity3d.set(velocityLC.x, velocityLC.y, 0.0);

		// calculate currLon & currLat.
		var distortion = Math.cos((minLatRad + currLat * latRadRange ));

		offsetXinMeters = velocity3d.x / distortion * xSpeedFactor;
		offsetYinMeters = velocity3d.y * ySpeedFactor;
		offsetZinMeters = velocity3d.z * zSpeedFactor;

		curXinMeters += offsetXinMeters;
		curYinMeters += offsetYinMeters;
		curZinMeters += offsetZinMeters;

		//var pointLC = new Point3D(curXinMeters, curYinMeters, curZinMeters);
		if (currPoint === 0)
		{
			var geoCoord = new Point3D();
			geoCoord.set(currLon, currLat, currAlt);
			resultGeoCoordsArray.push(geoCoord); // push the 1rst pointLC.
		}

		currPoint += 1;
		if (currPoint === 100)
		{
			currPoint = 0;
		}
		

		if (options.velocitiesArray)
		{
			options.velocitiesArray.push(velocity3d);
		}

		// Now, calculate geoCoord for next point.
		currLon += offsetXinMeters * meterToLon;
		currLat += offsetYinMeters * meterToLat;
		currAlt += offsetZinMeters;

		if (Math.abs(velocity3d.x) + Math.abs(velocity3d.y) + Math.abs(velocity3d.z) < 0.002)
		{
			return resultGeoCoordsArray;
		}
		
	}
	
	
	return resultGeoCoordsArray;
};

OceanFluxLayer.prototype._getVectorMeshFromGeoCoordsRadArray = function (points3dLCArray, geoLoc, magoManager, options)
{	
	if (!points3dLCArray || points3dLCArray.length < 2)
	{
		return undefined;
	}

	if (options === undefined)
	{
		options = {};
	}

	if (options.thickness === undefined)
	{ options.thickness = 2.0; }

	if (options.color === undefined)
	{ options.color = new Color(0.8, 1.0, 1.0, 1.0); }

	// check the colorRamp.***
	if (this.colorRamp)
	{
		// need velocities array.
		if (options.velocitiesArray === undefined)
		{ options.velocitiesArray = []; }
	}

	points3dLCArray.reverse();

	var vectorMesh = new VectorMeshWind(options);
	
	var optionsThickLine = {
		colorType: "alphaGradient"
	};

	// If exist this.colorRamp, then create colorsArray.*****************************************************************************
	if (this.colorRamp)
	{
		options.colorsArray = []; // create colors array.***

		var valuesCount = options.velocitiesArray.length;
		var color; 
		var vel, speed;
		var minSpeed = 1000000.0;
		var maxSpeed = -100.0;
		for (var i=0; i<valuesCount; i++)
		{
			vel = options.velocitiesArray[i];
			speed = vel.getModul();
			color = this.colorRamp.getInterpolatedColor(speed);

			options.colorsArray.push(color);

			if (speed > maxSpeed)
			{
				maxSpeed = speed;
			}
			else if (speed < minSpeed)
			{
				minSpeed = speed;
			}
		}
	}

	vectorMesh.vboKeysContainer = Point3DList.getVboThickLines(magoManager, points3dLCArray, vectorMesh.vboKeysContainer, options);
	vectorMesh.geoLocDataManager = new GeoLocationDataManager();
	vectorMesh.geoLocDataManager.addGeoLocationData(geoLoc);
	vectorMesh.objectType = MagoRenderable.OBJECT_TYPE.VECTORMESH;

	// Now, create a customVbo.
	var pointsCount = points3dLCArray.length;
	var indicesDataArray = new Float32Array(pointsCount*4);
	for (var i=0; i<pointsCount*4; i++)
	{
		indicesDataArray[i] = i.toFixed(0);
	}

	var vbo = vectorMesh.vboKeysContainer.getVboKey(0);
	var vboMemManager = magoManager.vboMemoryManager;
	var dimensions = 1;
	var name = "indices";
	var attribLoc = 4;
	vbo.setDataArrayCustom(indicesDataArray, vboMemManager, dimensions, name, attribLoc);

	// calculate vectorMesh "BoundingSphereWC".***********************************************
	////vectorMesh.boundingSphereWC = new BoundingSphere();
	////var positionWC = geoLoc.position;
	////var bboxLC = Point3DList.getBoundingBoxOfPoints3DArray(points3dLCArray, undefined);
	////var radiusAprox = bboxLC.getRadiusAprox();
	////vectorMesh.boundingSphereWC.setCenterPoint(positionWC.x, positionWC.y, positionWC.z);
	////vectorMesh.boundingSphereWC.setRadius(radiusAprox);
	// End calculating boundingSphereWC.------------------------------------------------------
	return vectorMesh;
};

OceanFluxLayer.prototype._getWindStreamLine = function (startGeoCoord, magoManager, options)
{	
	// 1rst, make points3dList relative to the 1rst_geoCoord.
	if (options === undefined)
	{
		options = {};
	}

	if (options.thickness === undefined)
	{ options.thickness = 4.0; }

	if (options.color === undefined)
	{ options.color = new Color(1.0, 0.3, 0.3, 1.0); }

	// check the colorRamp.***
	if (this.colorRamp)
	{
		// need velocities array.
		if (options.velocitiesArray === undefined)
		{ options.velocitiesArray = []; }
	}
	

	// Make pointsLC rel to startGeoCoord.
	var geoCoordsArrayArray = this._getTrajectoryInGeographicCoordsRad(startGeoCoord, magoManager, options);

	if (!geoCoordsArrayArray || geoCoordsArrayArray.length < 2)
	{
		return undefined;
	}

	var geoLoc = ManagerUtils.calculateGeoLocationData(startGeoCoord.longitude, startGeoCoord.latitude, startGeoCoord.altitude, 0, 0, 0, undefined);
	var hola = 0;
	return this._getVectorMeshFromGeoCoordsRadArray(geoCoordsArrayArray, geoLoc, magoManager, options);
};

OceanFluxLayer.prototype.newWindStreamLine = function (magoManager)
{
	var optionsThickLine = {};
	optionsThickLine.startColor = new Color(0.8, 1.0, 1.0, 1.0);
	optionsThickLine.endColor = new Color(0.8, 1.0, 1.0, 1.0);
	var WIND_STREAMLINES_NUMPOINTS = 300;
	optionsThickLine.numPoints = WIND_STREAMLINES_NUMPOINTS;

	var sceneState = magoManager.sceneState;
	var screenWidth = sceneState.drawingBufferWidth[0];
	var screenHeight = sceneState.drawingBufferHeight[0];

	var particlesGenerationType = this._particlesGenerationType;

	if (particlesGenerationType === 1) // 0= no generation. 1= inside frustum. 2= particlesGeneratorBox. 3= altitudePlane
	{
		var screenX = Math.floor(Math.random() * screenWidth);
		var screenY = Math.floor(Math.random() * screenHeight);

		var options = {
			highPrecision: false
		};
		
		var posWC = Mago3D.ManagerUtils.screenCoordToWorldCoordUseDepthCheck(screenX, screenY, magoManager, options);
		if (!posWC)
		{
			return undefined;
		}
		var geoCoord = Mago3D.ManagerUtils.pointToGeographicCoord(posWC, undefined);
		geoCoord.altitude += 1000.0; //

		var renderableObject = this._getWindStreamLine(geoCoord, magoManager, optionsThickLine);
		return renderableObject;
		
		/*
		var segment = this._getRayIntersectionWithVolume(screenX, screenY, magoManager);
		if (segment)
		{
			var farRandom = Math.random();
			var dir = segment.getDirection();
			var lengthRandom = segment.getLength() * farRandom;
			var strP = segment.startPoint3d;

			// posCC = startPoint + dir * farRandom * length.
			var posCC = new Point3D(strP.x + dir.x * lengthRandom, strP.y + dir.y * lengthRandom, strP.z + dir.z * lengthRandom );// Original.***
			
			// now, convert posCC to posWC.
			var posWC = ManagerUtils.cameraCoordPositionToWorldCoord(posCC, undefined, magoManager);

			// now calculate geoCoord of posWC.
			var geoCoord = ManagerUtils.pointToGeographicCoord(posWC, undefined);

			var renderableObject = this._getWindStreamLine(geoCoord, magoManager, optionsThickLine);
			return renderableObject;
		}
		*/
	}


	return undefined;
};

OceanFluxLayer.prototype.renderMode3DThickLines = function (magoManager)
{
	if (!this.prepareLayer())
	{
		return false;
	}

	if (!this.streamLinesArray)
	{ this.streamLinesArray = []; }

	var currStreamLinesCount = this.streamLinesArray.length;
	var WIND_MAXPARTICLES_INSCREEN = 500;

	if (currStreamLinesCount < WIND_MAXPARTICLES_INSCREEN && magoManager.currentFrustumIdx === 0)
	{
		for (var i=0; i<2; i++)
		{
			var streamLine = this.newWindStreamLine(magoManager);
			if (streamLine)
			{
				this.streamLinesArray.push(streamLine);	
			}
		}
		
	}

	if (this.streamLinesArray.length === 0)
	{
		return false;
	}

	var extbuffers = magoManager.extbuffers;
	var gl = magoManager.getGl();
	magoManager.bindMainFramebuffer();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.depthTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.normalTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
	]);
	//-------------------------------------------------------------------------------------------------------------
			  
	var gl = magoManager.getGl();
	var renderType = 1;
	var sceneState = magoManager.sceneState;

	// Now render the streamLines (thickLines).
	// change shader. use "thickLines" shader.
	var thickLineShader = magoManager.postFxShadersManager.getShader("windStreamThickLineRAD"); // (windStreamThickLineRAD_VS, windStreamThickLineRAD_FS)
	thickLineShader.useProgram();
	thickLineShader.bindUniformGenerals();
	
	gl.uniform4fv(thickLineShader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
	gl.uniform1i(thickLineShader.colorType_loc, 0);
	gl.uniform2fv(thickLineShader.viewport_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	var windThickness = 3.0;
	gl.uniform1f(thickLineShader.thickness_loc, windThickness);

	gl.uniform1i(thickLineShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(thickLineShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1i(thickLineShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);

	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	//gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	//gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
	gl.disable(gl.CULL_FACE);
	gl.enable(gl.BLEND);

	gl.enableVertexAttribArray(thickLineShader.prev_loc);
	gl.enableVertexAttribArray(thickLineShader.current_loc);
	gl.enableVertexAttribArray(thickLineShader.next_loc);
	
	
	var vectorTypeObjectsCount = this.streamLinesArray.length;
	var streamLine;
	var streamLinesArrayAux = [];

	var options = {
		animationState : this._animationState,
		animationSpeed : this._animationSpeed
	};

	gl.disable(gl.BLEND);
	for (var i=0; i<vectorTypeObjectsCount; i++)
	{
		streamLine = this.streamLinesArray[i];
		var geoLocData = streamLine.geoLocDataManager.getCurrentGeoLocationData();
		geoLocData.bindGeoLocationUniforms(gl, thickLineShader);
		streamLine.render(magoManager, thickLineShader, options);

		if (streamLine.finished)
		{
			// this stream line finished.
			streamLine.deleteObjects(magoManager.vboMemoryManager);
			streamLine = undefined;
			
		}
		else
		{
			streamLinesArrayAux.push(streamLine);
		}
	}
	gl.enable(gl.BLEND);

	this.streamLinesArray = streamLinesArrayAux;
	
	// return to the current shader.
	gl.useProgram(null);
	gl.enable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
};
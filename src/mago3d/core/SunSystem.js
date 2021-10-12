'use strict';

/**
 * SunSystem.
 * 
 * @class SunSystem
 * @constructor 
 */
var SunSystem = function(options) 
{
	if (!(this instanceof SunSystem)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// https://salidaypuestadelsol.com/sun
	// https://aprenderly.com/doc/889558/calcular-la-hora-de-salida-y-puesta-del-sol
	// http://www.sc.ehu.es/sbweb/fisica3/celeste/tiempo/tiempo.html
	// https://en.wikipedia.org/wiki/Sunrise_equation
	
	this.sunGeoLocDataManager = new GeoLocationDataManager();
	this.lightSourcesArray;
	this.date; // month, day, hour, min, sec.
	this.sunDirWC;
	this.bAnimation = false;
	this.updated = false;
	
	if (options !== undefined)
	{
		// todo:
	}
	
	// create the initial position of the sun.
	var geoLocData = this.sunGeoLocDataManager.newGeoLocationData("sunPosition");
	var lon = 115.31586919332165;
	var lat = 10.0;
	var alt = 0.0;
	geoLocData = ManagerUtils.calculateGeoLocationData(lon, lat, alt, undefined, undefined, undefined, geoLocData);
	
	var sunRotMat = geoLocData.rotMatrix;
	this.sunDirWC = new Float32Array([-sunRotMat._floatArrays[8], -sunRotMat._floatArrays[9], -sunRotMat._floatArrays[10]]);
	this.sunDirCC = new Float32Array([0.0, 0.0, 1.0]);
	this.init();
};

SunSystem.prototype.init = function() 
{
	if (this.lightSourcesArray === undefined)
	{ this.lightSourcesArray = []; }
	
	// provisionally create 3 lightSources.
	// 1rst light.
	var lightType = 2; // omni = 0, spot = 1, directional = 2, area = 3, volume = 4.
	var light = new LightSource(lightType);
	light.directionalBoxWidth = 400.0;
	light.geoCoord = new GeographicCoord(126.61255088096084, 37.58071053758259, 50);
	this.lightSourcesArray.push(light);
	
	// 2nd light.
	lightType = 2; // omni = 0, spot = 1, directional = 2, area = 3, volume = 4.
	light = new LightSource(lightType);
	light.directionalBoxWidth = 400.0;
	light.geoCoord = new GeographicCoord(126.61255088096084, 37.58071053758259, 50);
	this.lightSourcesArray.push(light);

	if (this.date === undefined)
	{
		this.date = new Date();
		this.date.setMonth(5);
		this.date.setHours(16);
		this.date.setMinutes(0);

		this.setDate(this.date);
	}

};

SunSystem.prototype._getSolarDeclinationDegrees = function() 
{
	var daysFrom22Dec = this._getDaysCountFrom22December();
	var declination = -23.45 * Math.cos(((2*Math.PI)/365) * daysFrom22Dec);

	return declination;
};

SunSystem.prototype._getDaysCountFrom22December = function() 
{
	// 1rst, check if the currMonth is December & currDay is after 22.
	var currDate = this.date;
	var currMonth = currDate.getMonth();
	var currDay = currDate.getDay();
	var currYear = currDate.getFullYear();

	var daysCountFrom22December = 0.0;
	var lastYear;

	if (currMonth === 12 && currDay >= 22)
	{
		lastYear = currYear;
	}
	else
	{
		lastYear = currYear - 1;
	}

	var lastDate = new Date();
	lastDate.setFullYear(lastYear);
	lastDate.setMonth(12);
	lastDate.setHours(0);
	lastDate.setMinutes(0);
	
	var lastTime = lastDate.getTime();
	var currTime = currDate.getTime();

	var diffTime_seconds = (currTime - lastTime)/1000.0;
	var diffTime_minutes = diffTime_seconds / 60;
	var diffTime_hours = diffTime_minutes / 60;
	var diffTime_days = diffTime_hours / 24;

	return diffTime_days;
};

SunSystem.prototype._getJulianDate = function() 
{
	// https://en.wikipedia.org/wiki/Julian_day
	// The Julian day is the continuous count of days since the beginning of the Julian period
	var date = this.getDate();
	var time = date.getTime();

	var time_seconds = time/1000.0;
	var time_minutes = time_seconds / 60;
	var time_hours = time_minutes / 60;
	var time_days = time_hours / 24;

	return time_days;
};
/*
SunSystem.julianIntToDate = function(n) {
	// convert a Julian number to a Gregorian Date.
	//    S.Boisseau / BubblingApp.com / 2014
	var a = n + 32044;
	var b = Math.floor(((4*a) + 3)/146097);
	var c = a - Math.floor((146097*b)/4);
	var d = Math.floor(((4*c) + 3)/1461);
	var e = c - Math.floor((1461 * d)/4);
	var f = Math.floor(((5*e) + 2)/153);

	var D = e + 1 - Math.floor(((153*f) + 2)/5);
	var M = f + 3 - 12 - Math.round(f/10);
	var Y = (100*b) + d - 4800 + Math.floor(f/10);

	return new Date(Y,M,D);
};
*/

SunSystem.prototype.getDayNightLightingFactorOfPosition = function(posWC) 
{
	/*
	var degToRad = Math.PI/180;
	var radToDeg = 180/Math.PI;
	var currDate = this.getDate();

	// https://en.wikipedia.org/wiki/Sunrise_equation
	// Calculate current Julian day.
	var Jdate = this._getJulianDate();
	var Date2000 = new Date('January 1, 2000 12:00:00');
	//Date2000.setFullYear(2000);
	//Date2000.setMonth(1);
	//Date2000.setDate(1);
	//Date2000.setHours(12);
	var time2000sec = Date2000.getTime()/1000;
	var currTimeSec = currDate.getTime()/1000;
	var diffSec = currTimeSec - time2000sec;
	var diffDays = diffSec / (60*60*24);


	var n2 = Jdate * 2451545.0 + 0.0008; // n is the number of days since Jan 1st, 2000 12:00
	var n = diffDays;

	// Mean solar time.
	var lonDeg = 127.0; // prov.
	var solTimeAprox = n - (lonDeg/360);

	// Solar mean anomaly.
	var M = (357.5291 + 0.98560028 * solTimeAprox) % 360;
	M *= degToRad;

	// Equation of the center.
	var C = 1.9148 * Math.sin(M) + 0.0200 * Math.sin(2*M) + 0.0003 * Math.sin(3*M); // 1.9148 is the coefficient of the Equation of the Center for the planet the observer is on (in this case, Earth)

	// Ecliptic longitude.
	var lambda = (M*radToDeg + C + 180 + 102.9372) % 360; // 102.9372 is a value for the argument of perihelion.

	// Solar transit.
	var solTransitJulian = 2451545.0 + solTimeAprox + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2*lambda*degToRad);

	// Declination of the sun.
	var sin_dec = Math.sin(lambda * degToRad) * Math.sin(23.44 * degToRad);
	var dec = Math.asin(sin_dec);

	// Hour angle.
	var latDeg = 37.0;
	var cos_omega = (Math.sin(-0.83 * degToRad) - Math.sin(latDeg*degToRad) * sin_dec)/(Math.cos(latDeg*degToRad) * Math.cos(dec));
	var omega = Math.acos(cos_omega);

	var sunRiseJulian = solTransitJulian - omega*radToDeg/360;
	var sunsetJulian = solTransitJulian + omega*radToDeg/360;

	

	var sunRiseDate = SunSystem.julianIntToDate(sunRiseJulian);
	var sunSetDate = SunSystem.julianIntToDate(sunsetJulian);



	// Test.*************************************************************************
	
	var declinationDeg = this._getSolarDeclinationDegrees();
	var sunGeoLocData = this.sunGeoLocDataManager.getCurrentGeoLocationData();
	var geoCoord = sunGeoLocData.geographicCoord;
	declinationDeg = geoCoord.latitude; // test.***

	var H = Math.acos(-Math.tan(37.0*degToRad) * Math.tan(declinationDeg*degToRad));
	H *= radToDeg;
	
	var startSunHour = 12 - H/15;
	var endSunHour = 12 + H/15;
	// End test.--------------------------------------------------------------------
	*/
	// given a geoCoord, this function returns a value 0 to 1.
	// night = 0 & day = 1.
	var lightFactor = 0.0;

	var pointAuxWC = new Point3D(posWC.x, posWC.y, posWC.z);
	pointAuxWC.unitary();

	lightFactor = pointAuxWC.scalarProduct(new Point3D(-this.sunDirWC[0], -this.sunDirWC[1], -this.sunDirWC[2]));

	// Do smoothStep.***********************************
	var minVal = -0.2;
	var maxVal = 0.2;
	var t = (lightFactor - minVal)/(maxVal-minVal);
	// clamp = min(max(x, minVal), maxVal).
	if (t<0.0)
	{ t = 0.0; }
	if (t>1.0)
	{ t = 1.0; }
	var t2 = t*t*(3.0 - 2*t);
	// End smoothStep.-----------------------------------

	lightFactor = t2;

	if (lightFactor < 0.15)
	{ lightFactor = 0.15; }

	return lightFactor;
};

SunSystem.prototype.getSunDirWC = function() 
{
	return this.sunDirWC;
};

SunSystem.prototype.getSunDirCC = function() 
{
	return this.sunDirCC;
};

SunSystem.prototype.getLight = function(idx) 
{
	if (this.lightSourcesArray === undefined)
	{ return undefined; }
	
	return this.lightSourcesArray[idx];
};

SunSystem.prototype.getLightsMatrixFloat32Array = function() 
{
	var lightsCount = this.lightSourcesArray.length;
	
	if (this.lightMatrixFloat32Array === undefined)
	{ this.lightMatrixFloat32Array = new Float32Array(16*lightsCount); }
	
	for (var i=0; i<lightsCount; i++)
	{
		var light = this.getLight(i);
		var lightMat = light.tMatrix;
		if (lightMat === undefined)
		{ continue; }
		
		for (var j=0; j<16; j++)
		{
			this.lightMatrixFloat32Array[j + 16*i] = lightMat._floatArrays[j];
		}
	}
	
	return this.lightMatrixFloat32Array;
};

SunSystem.prototype.getLightsPosLOWFloat32Array = function() 
{
	var lightsCount = this.lightSourcesArray.length;
	
	if (this.lightPosLOWFloat32Array === undefined)
	{ this.lightPosLOWFloat32Array = new Float32Array(3*lightsCount); }
	
	for (var i=0; i<lightsCount; i++)
	{
		var light = this.getLight(i);
		var lightPosLOW = light.positionLOW;
		if (lightPosLOW === undefined)
		{ continue; }
		for (var j=0; j<3; j++)
		{
			this.lightPosLOWFloat32Array[j + 3*i] = lightPosLOW[j];
		}
	}
	
	return this.lightPosLOWFloat32Array;
};

SunSystem.prototype.getLightsPosHIGHFloat32Array = function() 
{
	var lightsCount = this.lightSourcesArray.length;
	
	if (this.lightPosHIGHFloat32Array === undefined)
	{ this.lightPosHIGHFloat32Array = new Float32Array(3*lightsCount); }
	
	for (var i=0; i<lightsCount; i++)
	{
		var light = this.getLight(i);
		var lightPosHIGH = light.positionHIGH;
		if (lightPosHIGH === undefined)
		{ continue; }
		for (var j=0; j<3; j++)
		{
			this.lightPosHIGHFloat32Array[j + 3*i] = lightPosHIGH[j];
		}
	}
	
	return this.lightPosHIGHFloat32Array;
};

SunSystem.prototype.setDate = function(date) 
{
	this.date = date;
	this.calculateSunGeographicCoords();
};

SunSystem.prototype.setAnimation = function(options) 
{
	if (options === undefined)
	{ return; }
	
	this.bAnimation = true;
	var timeSpeed = options.timeSpeed; // seconds/seconds.
	var startHour = options.startHour;
	var startMin = options.startMin;
	
	var endHour = options.endHour;
	var endMin = options.endMin;
	
	
};

SunSystem.prototype.getDate = function() 
{
	if (this.date === undefined)
	{
		this.date = new Date();
		this.date.setMonth(2);
		this.date.setHours(15);
		this.date.setMinutes(0);
	}

	return this.date;
};

SunSystem.prototype.calculateSunGeographicCoords = function() 
{
	//https://in-the-sky.org/twilightmap.php // web page. sun in current time.
	//----------------------------------------------
	//https://en.wikipedia.org/wiki/Position_of_the_Sun
	//https://www.nrel.gov/docs/fy08osti/34302.pdf
	//https://forum.logicmachine.net/showthread.php?tid=161
	
	//https://astronomy.stackexchange.com/questions/20560/how-to-calculate-the-position-of-the-sun-in-long-lat
	// The boilerplate: fiddling with dates
	var radToDeg = 180/Math.PI;
	var date = this.getDate();
	
	var fullYear = date.getFullYear();
	var soy = (new Date(date.getFullYear(), 0, 0)).getTime();
	var eoy = (new Date(date.getFullYear() + 1, 0, 0)).getTime();
	var nows = date.getTime();
	var poy = (nows - soy) / (eoy - soy);

	var secs = date.getUTCMilliseconds() / 1e3
                + date.getUTCSeconds()
                + 60 * (date.getUTCMinutes() + 60 * date.getUTCHours());
	var pod = secs / 86400; // leap secs? nah.

	// The actual magic
	var lon = (-pod + 0.5) * Math.PI * 2;
	lon = lon*radToDeg;
	var lat = Math.sin((poy - .22) * Math.PI * 2) * .41;
	lat = lat*radToDeg;
	var alt = 0.0;
	
	// Now, calculate the sun geoLocationData & sun direction world coord.
	var geoLocData = this.sunGeoLocDataManager.getCurrentGeoLocationData();
	geoLocData = ManagerUtils.calculateGeoLocationData(lon, lat, alt, undefined, undefined, undefined, geoLocData);
	
	var sunRotMat = geoLocData.rotMatrix;
	this.sunDirWC = new Float32Array([-sunRotMat._floatArrays[8], -sunRotMat._floatArrays[9], -sunRotMat._floatArrays[10]]);

};



SunSystem.prototype.updateSun = function(magoManager, options) 
{
	var date = this.getDate();
	if (this.lastUpdateTime !== date.getTime())
	{
		this.calculateSunGeographicCoords(); 

		this.lastUpdateTime = date.getTime();
		//return;
	}
	
	if (this.lightSourcesArray === undefined)
	{ return; }

	if (magoManager.frustumVolumeControl === undefined)
	{ return; }

	//var date = new Date();
	
	if (options)
	{
		if (options.date)
		{
			// earthAxis inclination = 23.439281 degree.
			// December solstice -> March equinox (Friday, 20 March 2020, 03:49 UTC) -> June solstice -> September equinox.
			
		}
	}
	
	var sceneState = magoManager.sceneState;
	var camera = sceneState.getCamera();
	var camPos = camera.position;
	var camDir = camera.getDirection();
	//var camPosHight = sceneState.encodedCamPosHigh;
	//var camPosLow = sceneState.encodedCamPosLow;
	
	
	// calculate the parameters of the light.
	var frustumVolumeControl = magoManager.frustumVolumeControl;
	var totalBoundingFrustum = frustumVolumeControl.getTotalBoundingFrustum(undefined);
	
	if (totalBoundingFrustum.bFrustumNear === undefined || totalBoundingFrustum.bFrustumFar === undefined)
	{ return; }
	
	var bFrustumNear = totalBoundingFrustum.bFrustumNear;
	var bFrustumFar = totalBoundingFrustum.bFrustumFar;
	
	var frustum = camera.getFrustum(0);
	var tangentOfHalfFovy = frustum.tangentOfHalfFovy[0];
	
	var minDist = bFrustumNear;
	if (minDist < 0.0)
	{ minDist = 0.0; }
	var maxDist = bFrustumFar;
	var distRange = maxDist - minDist;

	var gl = magoManager.getGl();
	var pixelX = Math.floor(sceneState.drawingBufferWidth[0]/2);
	var pixelY = Math.floor(sceneState.drawingBufferHeight[0]*(4/5)); // camTarget a little down.

	// Calculate camTarget distance:
	var camTarget = ManagerUtils.calculatePixelPositionCamCoord(gl, pixelX, pixelY, undefined, undefined, undefined, undefined, magoManager, undefined);
	var camTargetDist = Math.abs(camTarget.z);

	if (camTargetDist < 100.0)
	{
		// Some times the "camTargetDist" is lower than 10m, so the shadows far than 10m are very poor.***
		camTargetDist = 100.0;
	}

	// light 0 (nearest).*******************************************************************************************************
	var distRange0 = distRange; // test debug.:
	var dist0 = minDist + distRange0;
	if (dist0 < 1.0){ dist0 = 1.0; }

	if (dist0 > camTargetDist)
	{
		dist0 = camTargetDist;
	}
	
	var light = this.lightSourcesArray[0];
	
	var newRadius = Math.abs(tangentOfHalfFovy*dist0)*6.0;

	var newPoint = new Point3D(camPos.x + camDir.x * dist0, camPos.y + camDir.y * dist0, camPos.z + camDir.z * dist0);
	if (light.bSphere === undefined)
	{ light.bSphere = new BoundingSphere(newPoint.x, newPoint.y, newPoint.z, newRadius); }
	else 
	{
		light.bSphere.setCenterPoint(newPoint.x, newPoint.y, newPoint.z);
		light.bSphere.setRadius(newRadius);
	}
	light.lightPosWC = light.bSphere.centerPoint;
	light.directionalBoxWidth = light.bSphere.r;
	this.updateLight(light);
	
	// light 1 (farest).*******************************************************************************************************
	var dist1 = minDist + distRange * 0.90;
	if (dist1 < 10.0){ dist1 = 10.0; }

	var light = this.lightSourcesArray[1];
	var newRadius = Math.abs(tangentOfHalfFovy*dist1)*4.0;
	var newPoint = new Point3D(camPos.x + camDir.x * dist1, camPos.y + camDir.y * dist1, camPos.z + camDir.z * dist1);
	if (light.bSphere === undefined)
	{ light.bSphere = new BoundingSphere(newPoint.x, newPoint.y, newPoint.z, newRadius); }
	else 
	{
		light.bSphere.setCenterPoint(newPoint.x, newPoint.y, newPoint.z);
		light.bSphere.setRadius(newRadius);
	}
	light.lightPosWC = light.bSphere.centerPoint;
	light.directionalBoxWidth = light.bSphere.r*2;
	this.updateLight(light);
		
	this.updated = true;
	
};

/**
 * This function renders the sunPointOfView depth.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
SunSystem.prototype.updateLight = function(light) 
{
	var sunGeoLocData = this.sunGeoLocDataManager.getCurrentGeoLocationData();
	var sunTMatrix = sunGeoLocData.getRotMatrixInv();
	if (light.tMatrix === undefined)
	{ light.tMatrix = new Matrix4(); }

	// calculate sunTransformMatrix for this light.***
	var lightPosWC = light.lightPosWC;
	var depthFactor = 10.0;
	var ortho = new Matrix4();
	var nRange = light.directionalBoxWidth/2;
	var left = -nRange, right = nRange, bottom = -nRange, top = nRange, near = -depthFactor*nRange, far = depthFactor*nRange;
	ortho._floatArrays = glMatrix.mat4.ortho(ortho._floatArrays, left, right, bottom, top, near, far);
	
	light.tMatrix = sunTMatrix.getMultipliedByMatrix(ortho, light.tMatrix);

	if (light.positionHIGH === undefined)
	{ light.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); } 
	
	if (light.positionLOW === undefined)
	{ light.positionLOW = new Float32Array([0.0, 0.0, 0.0]); } 
	
	ManagerUtils.calculateSplited3fv([lightPosWC.x, lightPosWC.y, lightPosWC.z], light.positionHIGH, light.positionLOW);
};




















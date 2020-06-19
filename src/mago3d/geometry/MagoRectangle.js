'use strict';

/**
 * 직사각형을 표현하는 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class MagoRectangle
 * @param {MagoRectangle~MagoRectanglePosition} position position info. min max coordinate and altitude. required.
 * @param {MagoRectangle~MagoRectangleStyle} style rectangle style. optional.
 *  
 * @extends MagoGeometry
 * 
 * @example
 * var position = {minLongitude : 0, minLatitude : 0, maxLongitude : 1, maxLatitude : 1, altitude : 2};
 * var style = {fillColor:'ff0000',opacity:0.8};
 * 
 * var magoRectangle = new Mago3D.MagoRectangle(position, style);
 */
var MagoRectangle = function(position, style) 
{
	/**
	 * 
	 * @typedef {object} MagoRectangle~MagoRectanglePosition MagoRectangle position 옵션.
	 * @property {number} minLongitude 
	 * @property {number} minLatitude 
	 * @property {number} maxLongitude 
	 * @property {number} maxLatitude 
	 * @property {number} altitude default is 0.
	 */
	/** 
	 * @typedef {object} MagoRectangle~MagoRectangleStyle MagoRectangle position 옵션.
	 * @property {string} imageUrl image url. 
	 * @property {string} fillColor html color code. if imageUrl defined, ignore this value.
	 * @property {number} opacity range 0-1. default is 1.
	 * @property {number} strokeWidth stroke width.
	 * @property {number} strokeColor stroke color. if strokeWidth isn't define, ignore this value.
	 */
	if (!(this instanceof MagoRectangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * Minimum coord of this rectangle
	 * @type {GeographicCoord}
	 * @private
	 */
	this.minGeographicCoord;
    
	/**
	 * Maximum coord of this rectangle
	 * @type {GeographicCoord}
	 * @private
	 */
	this.maxGeographicCoord;
    
	MagoGeometry.call(this, position, style);
    
	// Calculate geoLocationData.
	var resultGeographicCoord;
	resultGeographicCoord = GeographicCoord.getMidPoint(this.minGeographicCoord, this.maxGeographicCoord, resultGeographicCoord);
    
	var geoLocDataManager = new GeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData();
	geoLocData = ManagerUtils.calculateGeoLocationData(resultGeographicCoord.longitude, resultGeographicCoord.latitude, resultGeographicCoord.altitude, undefined, undefined, undefined, geoLocData);
	// set the geoLocDataManager of the terrainScanner.
	this.geoLocDataManager = geoLocDataManager;
    
	// Note: the cartesianCoords are rotated, so :
	geoLocData.rotMatrix.Identity();
};

MagoRectangle.prototype = Object.create(MagoGeometry.prototype);
MagoRectangle.prototype.constructor = MagoRectangle;

/**
 * make clone this instance
 * @return {MagoRectangle}
 */
MagoRectangle.prototype.clone = function()
{
	var position = {
		minLongitude : this.minGeographicCoord.longitude,
		minLatitude  : this.minGeographicCoord.latitude,
		maxLongitude : this.maxGeographicCoord.longitude,
		maxLatitude  : this.maxGeographicCoord.latitude,
		altitude     : this.maxGeographicCoord.altitude
	};
	var style = JSON.parse(JSON.stringify(this.style));

	return new MagoRectangle(position, style);
};

/**
 * set position
 * @param {MagoRectangle~MagoRectanglePosition} position
 * 
 * @example
 * var position = {minLongitude : 0, minLatitude : 0, maxLongitude : 1, maxLatitude : 1, altitude : 2};
 * magoRectangle.setPosition(position);
 */
MagoRectangle.prototype.setPosition = function(position) 
{
	if (!position)
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('position'));
	}

	var altitude = position.altitude;
	
	if (position.minLongitude && position.minLatitude)
	{
		this.minGeographicCoord = new GeographicCoord(position.minLongitude, position.minLatitude, altitude);
	}

	if (position.maxLongitude && position.maxLatitude)
	{
		this.maxGeographicCoord = new GeographicCoord(position.maxLongitude, position.maxLatitude, altitude);
	}
	// Check if exist material (texture).
	
};

/**
 * return area
 * @return {number}
 */
MagoRectangle.prototype.getArea = function() 
{
	var edge = new GeographicCoord(this.minGeographicCoord.longitude, this.maxGeographicCoord.latitude, this.maxGeographicCoord.altitude);
	var height = Globe.getArcDistanceBetweenGeographicCoords(this.minGeographicCoord, edge);
	var width = Globe.getArcDistanceBetweenGeographicCoords(edge, this.maxGeographicCoord);
	return Math.abs(width * height);
};
/**
 * Makes the geometry mesh.
 * @private
 */
MagoRectangle.prototype.makeMesh = function(magoManager)
{
	// This function makes an ellipsoidal mesh for tiles that has no elevation data.
	var lonSegments, latSegments, altitude;
    
	// 1rst, determine the lonSegments & latSegments.***
	var minLonDeg = this.minGeographicCoord.longitude;
	var minLatDeg = this.minGeographicCoord.latitude;
	var maxLonDeg = this.maxGeographicCoord.longitude;
	var maxLatDeg = this.maxGeographicCoord.latitude;

	lonSegments = Math.floor((maxLonDeg - minLonDeg)*5.0);
	latSegments = Math.floor((maxLatDeg - minLatDeg)*5.0);
    
	if (lonSegments < 1)
	{ lonSegments = 1; }

	if (latSegments < 1)
	{ latSegments = 1; }
	altitude =  this.minGeographicCoord.altitude;

	var degToRadFactor = Math.PI/180.0;
	var minLon = minLonDeg * degToRadFactor;
	var minLat = minLatDeg * degToRadFactor;
	var maxLon = maxLonDeg * degToRadFactor;
	var maxLat = maxLatDeg * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	
	var lonIncreDeg = lonRange/lonSegments;
	var latIncreDeg = latRange/latSegments;
	
	// calculate total verticesCount.
	var vertexCount = (lonSegments + 1)*(latSegments + 1);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	this.texCoordsArray = new Float32Array(vertexCount*2);
	
	var currLon = minLon; // init startLon.
	var currLat = minLat; // init startLat.
	var idx = 0;
	var s, t;

	
	// check if exist altitude.
	var alt = 0;
	if (altitude)
	{ alt = altitude; }
	
	for (var currLatSeg = 0; currLatSeg<latSegments+1; currLatSeg++)
	{
		currLat = minLat + latIncreDeg * currLatSeg;
		if (currLat > maxLat)
		{ currLat = maxLat; }

		for (var currLonSeg = 0; currLonSeg<lonSegments+1; currLonSeg++)
		{
			currLon = minLon + lonIncreDeg * currLonSeg;
			
			if (currLon > maxLon)
			{ currLon = maxLon; }
			
			lonArray[idx] = currLon;
			latArray[idx] = currLat;
			// Now set the altitude.
			altArray[idx] = alt;

			// make texcoords CRS84.***
			s = (currLon - minLon)/lonRange;
			t = (currLat - minLat)/latRange;
			
			this.texCoordsArray[idx*2] = s;
			this.texCoordsArray[idx*2+1] = 1.0 - t;
			
			// actualize current values.
			idx++;
		}
	}
	this.cartesiansArray = undefined;
	this.cartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, this.cartesiansArray);
	
	// Make normals using the cartesians.***
	this.normalsArray = new Int8Array(vertexCount*3);
	var point = new Point3D();
	for (var i=0; i<vertexCount; i++)
	{
		point.set(this.cartesiansArray[i*3], this.cartesiansArray[i*3+1], this.cartesiansArray[i*3+2]);
		point.unitary();
		
		this.normalsArray[i*3] = point.x*126;
		this.normalsArray[i*3+1] = point.y*126;
		this.normalsArray[i*3+2] = point.z*126;
	}
	
	// finally make indicesArray.
	var numCols = lonSegments + 1;
	var numRows = latSegments + 1;
	var options = {
		bCalculateBorderIndices: true
	};
	var resultObject = GeometryUtils.getIndicesTrianglesRegularNet(numCols, numRows, undefined, undefined, undefined, undefined, undefined, options);
	this.indices = resultObject.indicesArray;
	this.southIndices = resultObject.southIndicesArray;
	this.eastIndices = resultObject.eastIndicesArray;
	this.northIndices = resultObject.northIndicesArray;
	this.westIndices = resultObject.westIndicesArray;
	
	this.westVertexCount = this.westIndices.length;
	this.southVertexCount = this.southIndices.length;
	this.eastVertexCount = this.eastIndices.length;
	this.northVertexCount = this.northIndices.length;

	// Make vbos.*** Make vbos.*** Make vbos.*** Make vbos.*** Make vbos.*** Make vbos.*** Make vbos.*** Make vbos.*** Make vbos.*** Make vbos.***
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();

	if (this.cartesiansArray === undefined)
	{ return; }

	// rest the CenterPosition to the this.cartesiansArray.
	var coordsCount = this.cartesiansArray.length/3;
	for (var i=0; i<coordsCount; i++)
	{
		this.cartesiansArray[i*3] -= geoLocData.position.x;
		this.cartesiansArray[i*3+1] -= geoLocData.position.y;
		this.cartesiansArray[i*3+2] -= geoLocData.position.z;
	}
        
	var vboKeyContainer = new VBOVertexIdxCacheKeysContainer();;
	
	var vboKey = vboKeyContainer.newVBOVertexIdxCacheKey();
    
	var vboMemManager = magoManager.vboMemoryManager;
	
	// Positions.
	vboKey.setDataArrayPos(this.cartesiansArray, vboMemManager);

	
	// Normals.
	if (this.normalsArray)
	{
		vboKey.setDataArrayNor(this.normalsArray, vboMemManager);
	}
	
	// TexCoords.
	if (this.texCoordsArray)
	{
		vboKey.setDataArrayTexCoord(this.texCoordsArray, vboMemManager);
	}
		
	// Indices.
	vboKey.setDataArrayIdx(this.indices, vboMemManager);
    
	// Create a mesh.*******************************************************************************
	var mesh = new Mesh();
	mesh.vboKeysContainer = vboKeyContainer;
    
	// assign style to mesh.
	mesh.material = new Material();
	if (this.style.imageUrl)
	{
		var imagesPath = this.style.imageUrl;
		mesh.material.setDiffuseTextureUrl(imagesPath);
	}

	if (this.style.fillColor)
	{
		var color4 = Color.fromHexCode(this.style.fillColor, undefined);
		mesh.material.setColor4(color4.r, color4.g, color4.b, 1.0);
	}

	if (this.style.opacity)
	{
		this.attributes.opacity = this.style.opacity;
	}

	// check if exist outline.
	if (this.style.strokeWidth !== undefined)
	{
		// create a contour-line.
		// create contourIndices.
		this.contourIndices = [];
		Array.prototype.push.apply(this.contourIndices, this.southIndices);

		var eastIndicesCount = this.eastIndices.length;
		for (var i=1; i<eastIndicesCount; i++)
		{
			this.contourIndices.push(this.eastIndices[i]);
		}

		var northIndicesCount = this.northIndices.length;
		for (var i=1; i<northIndicesCount; i++)
		{
			this.contourIndices.push(this.northIndices[i]);
		}

		var westIndicesCount = this.westIndices.length;
		for (var i=1; i<westIndicesCount; i++)
		{
			this.contourIndices.push(this.westIndices[i]);
		}

		// create contour points3d.
		// var resultVboKeysContainer = Point3DList.getVboThickLines(magoManager, pointsArray, undefined);
		var pointsArray = [];
		var contourPointsCount = this.contourIndices.length;
		for (var i=0; i<contourPointsCount; i++)
		{
			var idx = this.contourIndices[i];
			var x = this.cartesiansArray[idx*3];
			var y = this.cartesiansArray[idx*3+1];
			var z = this.cartesiansArray[idx*3+2];
			var point3d = new Point3D(x, y, z);
			pointsArray.push(point3d);
		}

		// Create a vectorMesh.
		var options = {
			thickness: this.style.strokeWidth
		};

		//Color.fromHexCode = function(hexCode, resultColor4)
		if (this.style.strokeColor !== undefined)
		{
			var color4 = Color.fromHexCode(this.style.strokeColor, undefined);
			options.color = color4;
		}

		var vectorMesh = new VectorMesh(options);
		
		var optionsThickLine = {
			colorType: "alphaGradient"
		};

		vectorMesh.vboKeysContainer = Point3DList.getVboThickLines(magoManager, pointsArray, vectorMesh.vboKeysContainer, options);
		this.objectsArray.push(vectorMesh);
	}

	// Finally put the mesh into magoRenderables-objectsArray.
	this.objectsArray.push(mesh);
    
	this.setDirty(false);
};
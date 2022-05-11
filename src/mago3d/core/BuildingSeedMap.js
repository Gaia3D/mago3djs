'use strict';

/**
 * buildings seed map
 * @class BuildingSeedMap
 * @constructor
 */
var BuildingSeedMap = function() 
{
	if (!(this instanceof BuildingSeedMap)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * @type {Map}
	 */
	this.map = new Map();
	/**
	 * @type {ArrayBuffer}
	 */
	this.dataArrayBuffer; // binary data.
};

/**
 * Clear the list of BuildingSeed in this instance
 */
BuildingSeedMap.prototype.deleteObjects = function() 
{
	if (this.buildingSeedArray)
	{
		var buildingSeedsCount = this.buildingSeedArray.length;
		for (var i=0; i<buildingSeedsCount; i++)
		{
			this.buildingSeedArray[i].deleteObjects();
			this.buildingSeedArray[i] = undefined;
		}
		this.buildingSeedArray = undefined;
	}
	
	this.dataArrayBuffer = undefined;
};

/**
 * Parse the binary data sent from server to save the data as building seed 
 * readerwriter를 통해 입력된 ArrayBuffer를 파싱하여 빌딩시드들을 생성
 */
BuildingSeedMap.prototype.parseBuildingSeedArrayBuffer = function () 
{
	if (this.dataArrayBuffer === undefined)
	{ return false; }
	
	var arrayBuffer = this.dataArrayBuffer;
	var bytesReaded = 0;
	var buildingNameLength;
	var longitude;
	var latitude;
	var altitude;

	var decoder = new TextDecoder('utf-8');

	var buildingsCount = new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;

	// check "buildingsCount" value. If "buildingsCount" is negative (-10), then there are mgBuffersSets.***
	if (buildingsCount === -10)
	{
		// 1rst, read MgBufferSets.***
		var mgSetsCount = new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
		for (var m=0; m<mgSetsCount; m++)
		{
			var buildingSeed = new BuildingSeed();//this.newBuildingSeed();
			buildingSeed.dataType = "MGSET";

			if (buildingSeed.geographicCoord === undefined)
			{ buildingSeed.geographicCoord = new GeographicCoord(); }

			if (buildingSeed.bBox === undefined) 
			{ buildingSeed.bBox = new BoundingBox(); }

			buildingNameLength = new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0];
			bytesReaded += 4;
			
			var buildingName = decoder.decode(new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ buildingNameLength)));
			//var buildingName = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ buildingNameLength)));
			bytesReaded += buildingNameLength;

			// now the geographic coords, but this is provisional coords.
			longitude = new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8))[0]; bytesReaded += 8;
			latitude = new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8))[0]; bytesReaded += 8;
			altitude = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;

			buildingSeed.bBox.minX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
			buildingSeed.bBox.minY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
			buildingSeed.bBox.minZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
			buildingSeed.bBox.maxX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
			buildingSeed.bBox.maxY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
			buildingSeed.bBox.maxZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;

			// create a building and set the location.
			buildingSeed.buildingId = buildingName.substr(4, buildingNameLength-4);
			buildingSeed.buildingFileName = buildingName;
			buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, altitude);
			
			this.map.set(buildingSeed.buildingId, buildingSeed);
		}

		// finally, must re-read the f4d buildingsCount.***
		buildingsCount = new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
	}

	// Now, read the Basic F4D Projects.*******************************************************************************************
	for (var i =0; i<buildingsCount; i++) 
	{
		var buildingSeed = new BuildingSeed();//this.newBuildingSeed();
		buildingSeed.dataType = "F4D";

		if (buildingSeed.geographicCoord === undefined)
		{ buildingSeed.geographicCoord = new GeographicCoord(); }

		if (buildingSeed.bBox === undefined) 
		{ buildingSeed.bBox = new BoundingBox(); }

		buildingNameLength = new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0];
		bytesReaded += 4;

		var buildingName = decoder.decode(new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ buildingNameLength)));
		//var buildingName = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ buildingNameLength)));
		bytesReaded += buildingNameLength;

		// now the geographic coords, but this is provisional coords.
		longitude = new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8))[0]; bytesReaded += 8;
		latitude = new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8))[0]; bytesReaded += 8;
		altitude = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;

		buildingSeed.bBox.minX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
		buildingSeed.bBox.minY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
		buildingSeed.bBox.minZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
		buildingSeed.bBox.maxX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
		buildingSeed.bBox.maxY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;
		buildingSeed.bBox.maxZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0]; bytesReaded += 4;

		// create a building and set the location.
		buildingSeed.buildingId = buildingName.substr(4, buildingNameLength-4);
		buildingSeed.buildingFileName = buildingName;
		buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, altitude);
        
		this.map.set(buildingSeed.buildingId, buildingSeed);
	}
	
	return true;
};

/**
 * 빌딩시드 갯수 반환
 * @return {Number}
 */
BuildingSeedMap.prototype.getBuildingSeedLength = function() 
{
	return this.map.size;
};

/**
 * 빌딩시드 반환
 * @param {String|Number} buildingId
 * @return {BuildingSeed}
 */
BuildingSeedMap.prototype.getBuildingSeed = function(buildingId) 
{

	if (typeof buildingId !== 'string' && typeof buildingId !== 'number') 
	{
		throw new Error('buildingId is required to be a string or number.');
	}
	

	return this.map.get(buildingId);
};
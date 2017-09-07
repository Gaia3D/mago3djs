'use strict';

/**
 * buildings seed
 * @class BuildingSeed
 */
var BuildingSeed = function() 
{
	if (!(this instanceof BuildingSeed)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.fisrtName;
	this.name = "";
	this.buildingId;
	this.buildingFileName;
	this.geographicCoord; // class : GeographicCoord.
	this.rotationsDegree; // class : Point3D. (heading, pitch, roll).
	this.bBox;            // class : BoundingBox.
	this.geographicCoordOfBBox; // class : GeographicCoord.
};

/**
 * buildings seed list
 * @class BuildingSeedList
 */
var BuildingSeedList = function() 
{
	if (!(this instanceof BuildingSeedList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.buildingSeedArray = [];
	this.minGeographicCoord; // longitude, latitude, altitude.
	this.maxGeographicCoord; // longitude, latitude, altitude.
	
	this.dataArrayBuffer;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BuildingSeedList.prototype.newBuildingSeed = function() 
{
	var buildingSeed = new BuildingSeed();
	this.buildingSeedArray.push(buildingSeed);
	return buildingSeed;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BuildingSeedList.prototype.parseBuildingSeedArrayBuffer = function() 
{
	if (this.dataArrayBuffer === undefined)
	{ return false; }
	
	var arrayBuffer = this.dataArrayBuffer;
	var bytesReaded = 0;
	var buildingNameLength;
	var longitude;
	var latitude;
	var altitude;

	var buildingsCount = new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0];
	bytesReaded += 4;
	for (var i =0; i<buildingsCount; i++) 
	{
		var buildingSeed = this.newBuildingSeed();

		if (buildingSeed.geographicCoord === undefined)
		{ buildingSeed.geographicCoord = new GeographicCoord(); }

		if (buildingSeed.bBox === undefined) 
		{ buildingSeed.bBox = new BoundingBox(); }

		buildingNameLength = new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4))[0];
		bytesReaded += 4;
		var buildingName = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ buildingNameLength)));
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

		// create a building and set the location.***
		buildingSeed.buildingId = buildingName.substr(4, buildingNameLength-4);
		buildingSeed.buildingFileName = buildingName;
		buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, altitude);
	}
	
	return true;
};




























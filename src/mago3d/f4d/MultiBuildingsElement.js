'use strict';

/**
 * This is an element (or member) of a multiBuildings object.
 * @class MultiBuildingsElement
 */
var MultiBuildingsElement = function() 
{
	if (!(this instanceof MultiBuildingsElement)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.name;
	this.id;
	this.bbox;
	this.geoCoords;
	this.indexRange;
	this.localIndexRangesArray;
	
};

/**
 * This function parses data of multiBuilding.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 */
MultiBuildingsElement.prototype.parseData = function(arrayBuffer, bytesReaded) 
{
	// Read name.
	this.name = "";
	var nameLength = (new Int16Array(arrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
	for (var j=0; j<nameLength; j++)
	{
		this.name += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1))[0]);bytesReaded += 1;
	}
	
	// Read id.
	this.id = "";
	var idLength = (new Int16Array(arrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
	for (var j=0; j<idLength; j++)
	{
		this.id += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1))[0]);bytesReaded += 1;
	}
	
	// read bbox.
	if (this.bbox === undefined)
	{ this.bbox = new BoundingBox(); }
	
	bytesReaded = this.bbox.readData(arrayBuffer, bytesReaded);
	
	// read geographic coords.
	if (this.geoCoords === undefined)
	{ this.geoCoords = new GeographicCoord(); }
	
	this.geoCoords.longitude = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	this.geoCoords.latitude = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	this.geoCoords.altitude = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	// read indexRange. This is the indexRange of the global buffer of the owner.
	if (this.indexRange === undefined)
	{ this.indexRange = new IndexRange(); }
	
	this.indexRange.strIdx = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	this.indexRange.endIdx = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	// read local indexRanges. In the local indexRanges, there are divisions by the different textures.
	this.localIndexRangesArray = []; // init array.
	var localIndexRangesCount = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	for (var i=0; i<localIndexRangesCount; i++)
	{
		var localIndexRange = new IndexRange();
		localIndexRange.strIdx = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		localIndexRange.endIdx = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		
		var materialId = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		localIndexRange.attributes = {
			"materialId": materialId
		};
		this.localIndexRangesArray.push(localIndexRange);
	}
	
	return bytesReaded;
};

























































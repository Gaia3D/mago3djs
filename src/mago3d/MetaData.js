'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class MetaData
 */
var MetaData = function() {
	if(!(this instanceof MetaData)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.guid; // must be undefined initially.***
	this.version = "";
	this.geographicCoord; // longitude, latitude, altitude.***

	this.heading;
	this.pitch;
	this.roll;

	this.bbox; // BoundingBox.***
	this.imageLodCount;

	// Buildings octree mother size.***
	this.oct_min_x = 0.0;
	this.oct_max_x = 0.0;
	this.oct_min_y = 0.0;
	this.oct_max_y = 0.0;
	this.oct_min_z = 0.0;
	this.oct_max_z = 0.0;

	this.isSmall = false;
	this.fileLoadState = CODE.fileLoadState.READY;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param arrayBuffer 변수
 * @param readWriter 변수
 */
MetaData.prototype.parseFileHeader = function(arrayBuffer, readWriter) {
	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch;
	//var header = BR_Project._header;
	//var arrayBuffer = this.fileArrayBuffer;
	//var bytes_readed = this.fileBytesReaded;
	var bytes_readed = 0;

	if(readWriter == undefined) readWriter = new ReaderWriter();

	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		this.version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}

	// 3) Global unique ID.*********************
	if(this.guid == undefined) this.guid ="";

	intAux_scratch = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		this.guid += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}

	// 4) Location.*************************
	if(this.longitude == undefined) {
		this.longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	} else bytes_readed += 8;

	if(this.latitude == undefined) {
		this.latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	} else bytes_readed += 8;

	if(this.altitude == undefined) {
		this.altitude = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	} else bytes_readed += 4;

	//this.altitude += 20.0; // TEST.***

	//header._elevation += 70.0; // delete this. TEST.!!!
	if(this.bbox == undefined) this.bbox = new BoundingBox();

	// 6) BoundingBox.************************
	this.bbox.minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;

	// TEST. PROVISIONAL. DELETE.***
	//this.bbox.expand(20.0);
	var imageLODs_count = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

	// 7) Buildings octree mother size.***
	this.oct_min_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.oct_min_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.oct_min_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.oct_max_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.oct_max_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.oct_max_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;

	var isLarge = false;
	if(this.bbox.maxX - this.bbox.minX > 40.0 || this.bbox.maxY - this.bbox.minY > 40.0) {
		isLarge = true;
	}

	if(!isLarge && this.bbox.maxZ - this.bbox.minZ < 30.0) {
		this.isSmall = true;
	}

	return bytes_readed;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param arrayBuffer 변수
 * @param readWriter 변수
 */
MetaData.prototype.parseFileHeaderAsimetricVersion = function(arrayBuffer, readWriter) {
	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch;
	//var header = BR_Project._header;
	//var arrayBuffer = this.fileArrayBuffer;
	//var bytes_readed = this.fileBytesReaded;
	var bytes_readed = 0;

	if(readWriter == undefined) readWriter = new ReaderWriter();

	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		this.version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}

	// 3) Global unique ID.*********************
	if(this.guid == undefined) this.guid ="";

	intAux_scratch = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		this.guid += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}

	// 4) Location.*************************
	if(this.longitude == undefined) {
		this.longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	} else bytes_readed += 8;

	if(this.latitude == undefined) {
		this.latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	} else bytes_readed += 8;

	if(this.altitude == undefined) {
		this.altitude = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	} else bytes_readed += 4;

	//this.altitude -= 140.0; // TEST.***

	//header._elevation += 70.0; // delete this. TEST.!!!
	if(this.bbox == undefined) this.bbox = new BoundingBox();

	// 6) BoundingBox.************************
	this.bbox.minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;

	// TEST. PROVISIONAL. DELETE.***
	//this.bbox.expand(20.0);

	//var imageLODs_count = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

	//// 7) Buildings octree mother size.***
	//this.oct_min_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	//this.oct_min_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	//this.oct_min_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	//this.oct_max_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	//this.oct_max_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	//this.oct_max_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;

	var isLarge = false;
	if(this.bbox.maxX - this.bbox.minX > 40.0 || this.bbox.maxY - this.bbox.minY > 40.0) {
		isLarge = true;
	}

	if(!isLarge && this.bbox.maxZ - this.bbox.minZ < 30.0) {
		this.isSmall = true;
	}

	return bytes_readed;
};

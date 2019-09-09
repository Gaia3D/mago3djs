'use strict';

/**
 * F4D MetaData class.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @alias MetaData
 * @class MetaData
 * 
 * 아래 문서의 Table 1 참조
 * @link https://github.com/Gaia3D/F4DConverter/blob/master/doc/F4D_SpecificationV1.pdf
 */
var MetaData = function() 
{
	if (!(this instanceof MetaData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * guid. must be undefined initially.
	 * @type {String} 
	 */
	this.guid;

	/**
	 * f4d version
	 * @type {String} 
	 */
	this.version = "";

	/**
	 * f4d origin geographic coord. longitude, latitude, altitude.
	 * @type {GeographicCoord} 
	 */
	this.geographicCoord;

	/**
	 * heading. unit is degree.
	 * @type {Number} 
	 */
	this.heading;

	/**
	 * pitch. unit is degree.
	 * @type {Number} 
	 */
	this.pitch;

	/**
	 * roll. unit is degree.
	 * @type {Number} 
	 */
	this.roll;

	/**
	 * BoundingBox
	 * @type {BoundingBox} 
	 */
	this.bbox;

	/**
	 * not used
	 * @deprecated
	 */
	this.imageLodCount;

	/**
	 * Project_data_type (new in version 002).
	 * 1 = 3d model data type (normal 3d with interior & exterior data).
	 * 2 = single building skin data type (as vWorld or googleEarth data).
	 * 3 = multi building skin data type (as Shibuya & Odaiba data).
	 * 4 = pointsCloud data type.
	 * 5 = pointsCloud data type pyramidOctree test.
	 * @type {Number} 
	 */
	this.projectDataType;
	//-------------------------------------------------------------------------------
	
	/**
	 * offset x. Added since version 0.02
	 * @type {Number} 
	 */
	this.offSetX;

	/**
	 * offset y. Added since version 0.02
	 * @type {Number} 
	 */
	this.offSetY;

	/**
	 * offset z. Added since version 0.02
	 * @type {Number} 
	 */
	this.offSetZ;

	/**
	 * Buildings octree mother size.
	 * 
	 * @see Octree#setBoxSize
	 * @see ReaderWriter#getNeoHeaderAsimetricVersion
	 */ 

	 /**
	 * octree min x. octree.centerPos.x - octree.half_dx
	 * @type {Number} 
	 * @default 0.0
	 */
	this.oct_min_x = 0.0;

	 /**
	 * octree max x. octree.centerPos.x + octree.half_dx
	 * @type {Number} 
	 * @default 0.0
	 */
	this.oct_max_x = 0.0;

	/**
	 * octree min y. octree.centerPos.y - octree.half_dy
	 * @type {Number} 
	 * @default 0.0
	 */
	this.oct_min_y = 0.0;

	/**
	 * octree min y. octree.centerPos.y + octree.half_dy
	 * @type {Number} 
	 * @default 0.0
	 */
	this.oct_max_y = 0.0;

	/**
	 * octree min z. octree.centerPos.z - octree.half_dz
	 * @type {Number} 
	 * @default 0.0
	 */
	this.oct_min_z = 0.0;

	/**
	 * octree max z. octree.centerPos.z + octree.half_dz
	 * @type {Number} 
	 * @default 0.0
	 */
	this.oct_max_z = 0.0;

	/**
	 * small flag. 
	 * 
	 * when under condition, set true.
	 * bbox.maxX - bbox.minX < 40.0 && bbox.maxY - bbox.minY < 40.0 && bbox.maxZ - bbox.minZ < 30.0
	 * @deprecated
	 * 
	 * @type {Boolean} 
	 * @default false
	 */
	this.isSmall = false;

	/**
	 * lego file load state. Default is 0(READY)
	 * "READY"            : 0,
	 * "LOADING_STARTED"  : 1,
	 * "LOADING_FINISHED" : 2,
	 * "PARSE_STARTED"    : 3,
	 * "PARSE_FINISHED"   : 4,
	 * "IN_QUEUE"         : 5,
	 * "LOAD_FAILED"      : 6
	 * @type {Number}
	 */
	this.fileLoadState = CODE.fileLoadState.READY;
};

/**
 * MetaData 초기화
 */
MetaData.prototype.deleteObjects = function() 
{
	this.guid = undefined; // must be undefined initially.
	//this.version = undefined;
	if (this.geographicCoord)
	{ this.geographicCoord.deleteObjects(); }
	this.geographicCoord = undefined; // longitude, latitude, altitude.

	this.heading = undefined;
	this.pitch = undefined;
	this.roll = undefined;

	if (this.bbox)
	{ this.bbox.deleteObjects(); }
	this.bbox = undefined; // BoundingBox.
	this.imageLodCount = undefined;

	// Buildings octree mother size.
	this.oct_min_x = undefined;
	this.oct_max_x = undefined;
	this.oct_min_y = undefined;
	this.oct_max_y = undefined;
	this.oct_min_z = undefined;
	this.oct_max_z = undefined;

	this.isSmall = undefined;
	this.fileLoadState = undefined;
};

/**
 * HeaderAsimetric.hed 파일을 불러와서 metadata 부분을 파싱.
 * @param {ArrayBuffer} arrayBuffer
 * @param {ReaderWriter} readWriter 
 */
MetaData.prototype.parseFileHeaderAsimetricVersion = function(arrayBuffer, bytesReaded) 
{
	var version_string_length = 5;
	var intAux_scratch = 0;

	//if (readWriter === undefined) { readWriter = new ReaderWriter(); }

	// 1) Version(5 chars).
	this.version = "";
	for (var j=0; j<version_string_length; j++)
	{
		this.version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1))[0]);bytesReaded += 1;
	}

	// 3) Global unique ID.
	if (this.guid === undefined) { this.guid =""; }

	intAux_scratch = ReaderWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	for (var j=0; j<intAux_scratch; j++)
	{
		this.guid += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1))[0]);bytesReaded += 1;
	}

	// 4) Location.
	if (this.longitude === undefined) 
	{
		this.longitude = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	}
	else { bytesReaded += 8; }

	if (this.latitude === undefined) 
	{
		this.latitude = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	}
	else { bytesReaded += 8; }

	if (this.altitude === undefined) 
	{
		this.altitude = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	}
	else { bytesReaded += 4; }

	if (this.bbox === undefined) { this.bbox = new BoundingBox(); }

	// 6) BoundingBox.
	bytesReaded = this.bbox.readData(arrayBuffer, bytesReaded);

	var isLarge = false;
	if (this.bbox.maxX - this.bbox.minX > 40.0 || this.bbox.maxY - this.bbox.minY > 40.0) 
	{
		isLarge = true;
	}

	if (!isLarge && this.bbox.maxZ - this.bbox.minZ < 30.0) 
	{
		this.isSmall = true;
	}
	
	this.projectDataType = 0; // Init a value.
	
	// if header version is "0.0.2", then must read extra parameters.
	if (this.version === "0.0.2")
	{
		// parse dataType (unsigned short).
		this.projectDataType = (new Uint16Array(arrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		
		// parse Project's offSet (double x 6).
		this.offSetX = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
		this.offSetY = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
		this.offSetZ = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	}

	return bytesReaded;
};
























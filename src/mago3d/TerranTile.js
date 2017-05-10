'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class TerranTile
 */
var TerranTile = function() {
	if(!(this instanceof TerranTile)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	//           +-----+-----+
	//           |     |     |
	//           |  3  |  2  |
	//           |     |     |
	//           +-----+-----+
	//           |     |     |
	//           |  0  |  1  |
	//           |     |     |
	//           +-----+-----+

	this._depth = 0; // qudtree depth. 0 => mother_quadtree.***
	this._numberName = 1; // mother quadtree.***
	this._terranTile_owner;
	this._BR_buildingsArray = [];
	this._boundingBox; // dont use this.***
	this._pCloudMesh_array = []; // 1rst aproximation to the pointCloud data. Test.***

	this.position; // absolute position, for do frustum culling.***
	this.radius; // aprox radius for this tile.***

	this.leftDown_position;
	this.rightDown_position;
	this.rightUp_position;
	this.leftUp_position;
	this.visibilityType;

	//this.longitudeMin; // delete this.***
	//this.longitudeMax; // delete this.***
	//this.latitudeMin; // delete this.***
	//this.latitudeMax; // delete this.***

	this.subTiles_array = [];
	this.terranIndexFile_readed = false;
	this.empty_tile = false;

	// File.***************************************************
	this.fileReading_started = false;
	this.fileReading_finished = false;
	this.fileArrayBuffer;
	this.fileBytesReaded = 0;
	this.fileParsingFinished = false;
	this.projectsParsed_count = 0;

	this.current_BRProject_parsing;
	this.current_BRProject_parsing_state = 0;

	this.readWriter;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns br_buildingProject
 */
TerranTile.prototype.newBRProject = function() {
	// dont use this. delete this.***
	var br_buildingProject = new BRBuildingProject();
	this._BR_buildingsArray.push(br_buildingProject);
	return br_buildingProject;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns subTile
 */
TerranTile.prototype.newSubTerranTile = function() {
	var subTiles_count = this.subTiles_array.length;
	var subTile = new TerranTile();
	subTile._depth = this._depth + 1;
	subTile._numberName = this._numberName*10 + subTiles_count + 1;
	this.subTiles_array.push(subTile);
	return subTile;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TerranTile.prototype.make4subTiles = function() {
	for(var i = 0; i < 4; i++) {
		var subTile = this.newSubTerranTile();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param lonMin 변수
 * @param lonMax 변수
 * @param latMin 변수
 * @param latMax 변수
 */
TerranTile.prototype.setDimensions = function(lonMin, lonMax, latMin, latMax) {
	this.longitudeMin = lonMin;
	this.longitudeMax = lonMax;
	this.latitudeMin = latMin;
	this.latitudeMax = latMax;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param maxDepth 변수
 */
TerranTile.prototype.makeTree = function(maxDepth) {
	if(this._depth < maxDepth)
	{
		var subTileAux;
		for(var i = 0; i < 4; i++)
		{
			subTileAux = this.newSubTerranTile();
			subTileAux.makeTree(maxDepth);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
TerranTile.prototype.calculatePositionByLonLat = function() {
	var lon_mid = (this.longitudeMax + this.longitudeMin)/2.0;
	var lat_mid = (this.latitudeMax + this.latitudeMin)/2.0;

	this.position = Cesium.Cartesian3.fromDegrees(lon_mid, lat_mid, 0.0);

	this.leftDown_position = Cesium.Cartesian3.fromDegrees(this.longitudeMin, this.latitudeMin, 0.0);
	this.rightDown_position = Cesium.Cartesian3.fromDegrees(this.longitudeMax, this.latitudeMin, 0.0);
	this.rightUp_position = Cesium.Cartesian3.fromDegrees(this.longitudeMax, this.latitudeMax, 0.0);
	this.leftUp_position = Cesium.Cartesian3.fromDegrees(this.longitudeMin, this.latitudeMax, 0.0);

	this.radius = Cesium.Cartesian3.distance(this.leftDown_position, this.rightUp_position)/2.0 * 0.9;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TerranTile.prototype.calculatePositionByLonLatSubTiles = function() {
	this.calculatePositionByLonLat();

	var subTile;
	var subTiles_count = this.subTiles_array.length; // subTiles_count must be 4.***

	for(var i=0; i<subTiles_count; i++)
	{
		this.subTiles_array[i].calculatePositionByLonLatSubTiles();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param BR_Project 변수
 */
TerranTile.prototype.parseFileHeader = function(BR_Project) {
	var fileLegth = this.fileArrayBuffer.byteLength;
	if(this.fileBytesReaded >= fileLegth)
		return;

	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch;
	var header = BR_Project._header;
	var arrayBuffer = this.fileArrayBuffer;
	var bytes_readed = this.fileBytesReaded;

	if(this.readWriter == undefined)
		this.readWriter = new ReaderWriter();

	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		header._version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}

	header._f4d_version = 2;

	// 3) Global unique ID.*********************
	intAux_scratch = this.readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		header._global_unique_id += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}

	// 4) Location.*************************
	header._longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	header._latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	header._elevation = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;

	//header._elevation += 70.0; // delete this. TEST.!!!

	// 6) BoundingBox.************************
	header._boundingBox.minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._boundingBox.minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._boundingBox.minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._boundingBox.maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._boundingBox.maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._boundingBox.maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;

	var semiHeight = (header._boundingBox.maxZ - header._boundingBox.minZ )/2.0;
	header._elevation = 45.0 + semiHeight-0.5;

	var isLarge = false;
	if(header._boundingBox.maxX - header._boundingBox.minX > 40.0 || header._boundingBox.maxY - header._boundingBox.minY > 40.0)
	{
		isLarge = true;
	}

	if(!isLarge && header._boundingBox.maxZ - header._boundingBox.minZ < 30.0)
	{
		header.isSmall = true;
	}

	var imageLODs_count = this.readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

	// Now, must calculate some params of the project.**********************************************
	// 0) PositionMatrix.************************************************************************
	// Determine the elevation of the position.***********************************************************
	var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation);
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------

	//var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation);  // Original.***
	position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, height);

	BR_Project.buildingPosition = position;

	// High and Low values of the position.****************************************************
	var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);

	BR_Project.buildingPositionHIGH = new Float32Array(3);
	BR_Project.buildingPositionHIGH[0] = splitVelue_X.high;
	BR_Project.buildingPositionHIGH[1] = splitVelue_Y.high;
	BR_Project.buildingPositionHIGH[2] = splitVelue_Z.high;

	BR_Project.buildingPositionLOW = new Float32Array(3);
	BR_Project.buildingPositionLOW[0] = splitVelue_X.low;
	BR_Project.buildingPositionLOW[1] = splitVelue_Y.low;
	BR_Project.buildingPositionLOW[2] = splitVelue_Z.low;

	this.fileBytesReaded = bytes_readed;
};


/**
 * 어떤 일을 하고 있습니까?
 * @param BR_Project 변수
 */
TerranTile.prototype.parseFileSimpleBuilding = function(BR_Project) {
	var fileLegth = this.fileArrayBuffer.byteLength;
	if(this.fileBytesReaded >= fileLegth)
		return;

	if(this.readWriter == undefined)
		this.readWriter = new ReaderWriter();

	var bytes_readed = this.fileBytesReaded;
	var startBuff;
	var endBuff;
	var arrayBuffer = this.fileArrayBuffer;

	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new SimpleBuildingV1();

	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	var vbo_objects_count = this.readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Almost allways is 1.***

	// single interleaved buffer mode.*********************************************************************************
	for(var i=0; i<vbo_objects_count; i++) // Almost allways is 1.***
	{
		var simpObj = simpBuildingV1.newSimpleObject();
		var vt_cacheKey = simpObj._vtCacheKeys_container.newVertexTexcoordsArraysCacheKey();

		var iDatas_count = this.readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		startBuff = bytes_readed;
		endBuff = bytes_readed + (4*3+2*2+1*4)*iDatas_count; // fPos_usTex_bNor.****
		vt_cacheKey.verticesArrayBuffer = arrayBuffer.slice(startBuff, endBuff);

		bytes_readed = bytes_readed + (4*3+2*2+1*4)*iDatas_count; // updating data.***

		vt_cacheKey._vertices_count = iDatas_count;

	}

	// Finally read the 4byte color.***
	var color_4byte_temp = this.readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

	//var b = color_4byte_temp & 0xFF;
    //var g = (color_4byte_temp & 0xFF00) >>> 8;
    //var r = (color_4byte_temp & 0xFF0000) >>> 16;
    //var a = ( (color_4byte_temp & 0xFF000000) >>> 24 ) / 255 ;

	this.fileBytesReaded = bytes_readed;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param BR_Project 변수
 * @param magoManager 변수
 */
TerranTile.prototype.parseFileNailImage = function(BR_Project, magoManager) {
	//BR_Project._f4d_nailImage_readed = true;

	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new SimpleBuildingV1();

	if(this.readWriter == undefined)
		this.readWriter = new ReaderWriter();

	var simpBuildingV1 = BR_Project._simpleBuilding_v1;

	// Read the image.**********************************************************************************
	var bytes_readed = this.fileBytesReaded;
	var arrayBuffer = this.fileArrayBuffer;

	var nailImageSize = this.readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	var startBuff = bytes_readed;
	var endBuff = bytes_readed + nailImageSize;
	simpBuildingV1.textureArrayBuffer = new Uint8Array(arrayBuffer.slice(startBuff, endBuff));

	bytes_readed += nailImageSize;

	this.fileBytesReaded = bytes_readed;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param magoManager 변수
 */
TerranTile.prototype.parseFileAllBuildings = function(magoManager) {
	var fileLegth = this.fileArrayBuffer.byteLength;
	if(this.fileBytesReaded >= fileLegth)
	{
		this.fileParsingFinished = true;
		return;
	}

	if(this.readWriter == undefined)
		this.readWriter = new ReaderWriter();

	var arrayBuffer = this.fileArrayBuffer;
	var projects_count = this.readWriter.readInt32(arrayBuffer, 0, 4); this.fileBytesReaded += 4;

	if(projects_count == 0)
		this.empty_tile = true;

	for(var i=0; i<projects_count; i++)
	{
		/*
		// 1rst, read the relative rawFile_path.***
		var rawFileNamePath_length = this.readWriter.readInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;// only debug test.***
		var rawFileNamePath = "";

		for(var j=0; j<rawFileNamePath_length; j++){
			rawFileNamePath += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
		*/
		var bytes_readed = this.fileBytesReaded;
		this.fileBytesReaded = bytes_readed;

		this.current_BRProject_parsing = this.newBRProject();
		//this.current_BRProject_parsing._f4d_rawPathName = rawFileNamePath;

		this.parseFileHeader(this.current_BRProject_parsing);
		this.parseFileSimpleBuilding(this.current_BRProject_parsing);
		this.parseFileNailImage(this.current_BRProject_parsing, magoManager);
	}
	this.fileParsingFinished = true;
	this.fileArrayBuffer = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param magoManager 변수
 */
TerranTile.prototype.parseFileOneBuilding = function(gl, magoManager) {
	var fileLegth = this.fileArrayBuffer.byteLength;
	if(this.fileBytesReaded >= fileLegth)
	{
		this.fileParsingFinished = true;
		return;
	}

	if(this.readWriter == undefined)
		this.readWriter = new ReaderWriter();

	var projects_count = this.readWriter.readInt32(this.fileArrayBuffer, 0, 4); // only debug test.***

	if(this.projectsParsed_count >= projects_count)
	{
		this.fileParsingFinished = true;
		this.fileBytesReaded = null;
		return;
	}

	if(this.current_BRProject_parsing_state == 0)
	{
		if(this.projectsParsed_count == 0)
			this.fileBytesReaded = 4;

		this.current_BRProject_parsing = this.newBRProject();
	}

	var BR_Project = this.current_BRProject_parsing;

	// Read header, simpleBuilding, and the nailImage.***
	if(this.current_BRProject_parsing_state == 0) {
		this.parseFileHeader(BR_Project);
		this.current_BRProject_parsing_state=1;
	} else if(this.current_BRProject_parsing_state == 1) {
		if(magoManager.backGround_imageReadings_count < 1) {
			this.parseFile_simpleBuilding_old(gl, BR_Project);
			this.current_BRProject_parsing_state=2;
		}
	} else if(this.current_BRProject_parsing_state == 2) {
		if(magoManager.backGround_imageReadings_count < 1) {
			this.parseFile_nailImage_old(gl, BR_Project, magoManager);
			this.current_BRProject_parsing_state=0;
			this.projectsParsed_count++;
			magoManager.backGround_imageReadings_count ++;
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
TerranTile.prototype.setDimensionsSubTiles = function() {
	var subTile;
	var subTiles_count = this.subTiles_array.length; // subTiles_count must be 4.***
	if(subTiles_count == 4) {
		var lon_mid = (this.longitudeMax + this.longitudeMin)/2.0;
		var lat_mid = (this.latitudeMax + this.latitudeMin)/2.0;

		subTile = this.subTiles_array[0];
		subTile.setDimensions(this.longitudeMin, lon_mid, this.latitudeMin, lat_mid);

		subTile = this.subTiles_array[1];
		subTile.setDimensions(lon_mid, this.longitudeMax, this.latitudeMin, lat_mid);

		subTile = this.subTiles_array[2];
		subTile.setDimensions(lon_mid, this.longitudeMax, lat_mid, this.latitudeMax);

		subTile = this.subTiles_array[3];
		subTile.setDimensions(this.longitudeMin, lon_mid, lat_mid, this.latitudeMax);

		for(var i=0; i<subTiles_count; i++) {
			this.subTiles_array[i].setDimensionsSubTiles();
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param smallefstTiles_array 변수
 */
TerranTile.prototype.getSmallestTiles = function(smallestTiles_array) {
	// this returns smallestTiles, if the smallestTile has buildingd inside.***
	if(this.subTiles_array.length > 0) {
		for(var i=0; i<this.subTiles_array.length; i++) {
			this.subTiles_array[i].visibilityType = this.visibilityType;
			this.subTiles_array[i].getSmallestTiles(smallestTiles_array);
		}
	} else {
		if(!this.empty_tile.length) smallestTiles_array.push(this);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustumVolume 변수
 * @param intersectedSmallestTiles_array 변수
 * @param boundingSphere_Aux 변수
 */
TerranTile.prototype.getIntersectedSmallestTiles = function(frustumVolume, intersectedSmallestTiles_array, boundingSphere_Aux) {
	var intersectedTiles_array = [];
	this.getIntersectedTiles(frustumVolume, intersectedTiles_array, boundingSphere_Aux);

	var intersectedTiles_count = intersectedTiles_array.length;
	for(var i=0; i<intersectedTiles_count; i++) {
		intersectedTiles_array[i].getSmallestTiles(intersectedSmallestTiles_array);
	}
	intersectedTiles_array.length = 0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustumVolume 변수
 * @param intersectedTiles_array 변수
 * @param boundingSphere_Aux 변수
 */
TerranTile.prototype.getIntersectedTiles = function(frustumVolume, intersectedTiles_array, boundingSphere_Aux) {
	// Cesium dependency.***
	if(this.position == undefined) return;

	if(boundingSphere_Aux == undefined) boundingSphere_Aux = new Cesium.BoundingSphere();

	var intersectedPoints_count = 0;
	boundingSphere_Aux.radius = this.radius;
	boundingSphere_Aux.center.x = this.position.x;
	boundingSphere_Aux.center.y = this.position.y;
	boundingSphere_Aux.center.z = this.position.z;
	this.visibilityType = frustumVolume.computeVisibility(boundingSphere_Aux);
	/*
	boundingSphere_Aux.center = this.leftDown_position;
	if(frustumVolume.computeVisibility(boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
		intersectedPoints_count++;

	boundingSphere_Aux.center = this.rightDown_position;
	if(frustumVolume.computeVisibility(boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
		intersectedPoints_count++;

	boundingSphere_Aux.center = this.rightUp_position;
	if(frustumVolume.computeVisibility(boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
		intersectedPoints_count++;

	boundingSphere_Aux.center = this.leftUp_position;
	if(frustumVolume.computeVisibility(boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
		intersectedPoints_count++;
	*/

	if(this.visibilityType == Cesium.Intersect.OUTSIDE) {
		// OUTSIDE.***
		// do nothing.***
	} else if(this.visibilityType == Cesium.Intersect.INSIDE) {
		// INSIDE.***
		intersectedTiles_array.push(this);
	} else {
		// INTERSECTED.***
		if(this.subTiles_array.length > 0) {
			for(var i=0; i<this.subTiles_array.length; i++) {
				this.subTiles_array[i].getIntersectedTiles(frustumVolume, intersectedTiles_array);
			}
		} else {
			intersectedTiles_array.push(this);
		}
	}
};

'use strict';

/**
 * This is a group of skin-type buildings.
 * @class MultiBuildings
 * @constructor
 * 
 */
var MultiBuildings = function() 
{
	if (!(this instanceof MultiBuildings)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// The multiBuildings shares vboBuffers.
	this.skinBuildingsArray;
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArrayBuffer;
	
	this.bbox;
	this.geoCoords;
	this.vboKeysContainer; // class: VBOVertexIdxCacheKeysContainer.
	
	this.multiBuildingsElementsArray = [];
};

/**
 * This function prepares data of multiBuilding to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 */
MultiBuildings.prototype.prepareData = function(magoManager) 
{

	if (this.fileLoadState === CODE.fileLoadState.READY)
	{
		var node = this.nodeOwner;
		var projectFolderName = node.data.projectFolderName;
		var multiBuildingsFolderName = node.data.multiBuildingsFolderName;
		var multiBuildingsFileName = multiBuildingsFolderName; // the fileName is equal to folderName.
		var readerWriter = magoManager.readerWriter;
		var fileName = magoManager.readerWriter.geometryDataPath + "/" + projectFolderName + "/" + multiBuildingsFolderName + "/" + multiBuildingsFileName;
		readerWriter.getMultiBuildingsDataArrayBuffer(fileName, this, magoManager);
	}
};

/**
 * This function renders the multiBuilding.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 */
MultiBuildings.prototype.render = function(magoManager, shader) 
{
	// 1rst, check if data is ready to render.
	if (!this.isReadyToRender())
	{ 
		return false; 
	}
	
	if (this.vboKeysContainer === undefined)
	{ return false; }
	
	var gl = magoManager.getGl();
	var nodeOwner = this.nodeOwner;
	var geoLocDataManager = nodeOwner.data.geoLocDataManager;
	var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	
	geoLoc.bindGeoLocationUniforms(gl, shader);
	
	// Bind the vbo.
	var vboMemManager = magoManager.vboMemoryManager;
	var vboKeysCount = this.vboKeysContainer.getVbosCount();
	
	if (vboKeysCount === 0)
	{ return false; }

	// Note: there are only one vboKey.
	var vboKey = this.vboKeysContainer.getVboKey(0);
	if (!vboKey.bindDataPosition(shader, vboMemManager))
	{ return false; }
	
	if (!vboKey.bindDataNormal(shader, vboMemManager))
	{ return false; }
	
	if (!vboKey.bindDataTexCoord(shader, vboMemManager))
	{ return false; }
		
	var multiBuildingElemsCount = this.multiBuildingsElementsArray.length;
	for (var i=0; i<multiBuildingElemsCount; i++)
	{
		var multiBuildingsElem = this.multiBuildingsElementsArray[i];
		multiBuildingsElem.render(magoManager, shader);
	}
	

};

/**
 * render할 준비가 됬는지 체크
 * @returns {Boolean} this.fileLoadState가 CODE.fileLoadState.PARSE_FINISHED(4)이거나 this.texture, this.texture.texId가 존재할때 true 반환
 */
MultiBuildings.prototype.isReadyToRender = function()
{
	if (this.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
	{ return false; }
	
	//if (this.texture === undefined || this.texture.texId === undefined) // In the future, a skin can has no texture. TODO:
	//{ return false; }
	
	return true;
};

/**
 * This function parses data of multiBuilding.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 */
MultiBuildings.prototype.parseData = function(magoManager) 
{
	if (this.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{ return false; }
	
	if (this.dataArrayBuffer === undefined)
	{ return false; }

	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	if (this.vboKeysContainer === undefined)
	{ this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKeys = this.vboKeysContainer.newVBOVertexIdxCacheKey();

	var arrayBuffer = this.dataArrayBuffer;
	var bytesReaded = 0;
	var vboMemManager = magoManager.vboMemoryManager;

	// Read the version. 5 chars.
	this.version = "";
	var version_string_length = 5;
	for (var j=0; j<version_string_length; j++)
	{
		this.version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1))[0]);bytesReaded += 1;
	}
	
	// Bounding box.
	if (this.bbox === undefined)
	{ this.bbox = new BoundingBox(); }
	
	bytesReaded = this.bbox.readData(arrayBuffer, bytesReaded);
	
	// Read geographic coords.
	if (this.geoCoords === undefined)
	{ this.geoCoords = new GeographicCoord(); }
	
	this.geoCoords.longitude = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	this.geoCoords.latitude = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	this.geoCoords.altitude = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	// VBO.
	// Read positions dataType.
	bytesReaded = vboKeys.readPositions(arrayBuffer, vboMemManager, bytesReaded);
	
	// read if vertex has 1) normals, 2) texCoords and/or 3) colors. 
	var hasNormals = (new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasNormals)
	{
		// read normals.
		bytesReaded = vboKeys.readNormals(arrayBuffer, vboMemManager, bytesReaded);
	}
	var hasTexCoords = (new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasTexCoords)
	{
		// read tecCoords.
		bytesReaded = vboKeys.readTexCoords(arrayBuffer, vboMemManager, bytesReaded);
	}
	var hasColors = (new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasColors)
	{
		// read colors.
		bytesReaded = vboKeys.readColors(arrayBuffer, vboMemManager, bytesReaded);
	}
	
	var hasIndices = (new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasIndices)
	{
		// read indices.
		// Provisionally has no indices to read.
	}
	
	// Now read the city individual buildings.
	var cityBuildingsCount = (new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	for (var i=0; i<cityBuildingsCount; i++)
	{
		var multiBuildingsElement = new MultiBuildingsElement();
		bytesReaded = multiBuildingsElement.parseData(arrayBuffer, bytesReaded);
		multiBuildingsElement.multiBuildingsOwner = this;
		
		this.multiBuildingsElementsArray.push(multiBuildingsElement);
	}
	
	// Now read LOD5-textures. The LOD5-textures is embedded.
	var imagesCount = (new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	if (imagesCount > 0 && this.texturesManager === undefined)
	{ this.texturesManager = new TexturesManager(); }

	for (var i=0; i<imagesCount; i++)
	{
		// read imageId (material id).
		var imageId = (new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		
		// read imageFileName.
		var imageFileNameLength = (new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var imageFileName = "";
		for (var j=0; j<imageFileNameLength; j++)
		{
			imageFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1))[0]);bytesReaded += 1;
		}
		
		// read the image.
		var imageLength = (new Int32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var startBuff = bytesReaded;
		var byteSize = 1;
		var endBuff = bytesReaded + byteSize * imageLength;
		var imageBinaryData = arrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + byteSize * imageLength; // updating data.
		
		// now create texture of the image.
		var texture = this.texturesManager.getOrNewTexture(imageId);
		texture.textureTypeName = "diffuse";
		texture.textureImageFileName = imageFileName;
		texture.imageBinaryData = imageBinaryData;
		texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
	}
	
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};





































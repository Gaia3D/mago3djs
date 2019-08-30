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

	this.multiBuildingsOwner;
	this.name;
	this.id;
	this.bbox;
	this.geoCoords;
	this.indexRange;
	this.localIndexRangesArray;
	
};

/**
 * This function renders the multiBuildingsElement.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 */
MultiBuildingsElement.prototype.render = function(magoManager, shader) 
{
	if (this.localIndexRangesArray === undefined)
	{ return false; }

	var gl = magoManager.getGl();
	
	var localIndexRangesCount = this.localIndexRangesArray.length;
	for (var i=0; i<localIndexRangesCount; i++)
	{
		var localIndexRange = this.localIndexRangesArray[i];
		var first = localIndexRange.strIdx;
		var end = localIndexRange.endIdx;
		var verticesCount = end - first + 1; // must add +1 bcos "end" & "first" are indexes.
		
		var materialId = localIndexRange.attributes.materialId;
		if (materialId !== undefined && materialId >= 0)
		{
			var texturesManager = this.multiBuildingsOwner.texturesManager;
			var tex = texturesManager.getTexture(materialId);
			
			if (tex !== undefined && tex.texId === undefined)
			{
				// bind texture data.
				TexturesManager.newWebGlTextureByEmbeddedImage(gl, tex.imageBinaryData, tex);
				var flip_y_texCoords = false;
				//tex.texId = TexturesManager.handleTextureLoaded(gl, tex.imageBinaryData, flip_y_texCoords);
			}
			
			if (tex !== undefined && tex.texId !== undefined)
			{
				// bind texture.
				gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
				if (shader.last_tex_id !== tex.texId) 
				{
					gl.activeTexture(gl.TEXTURE2);
					gl.bindTexture(gl.TEXTURE_2D, tex.texId);
					shader.last_tex_id = tex.texId;
				}
			}
		}
		
		gl.drawArrays(gl.TRIANGLES, first, verticesCount);
	}
	
	return true;
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

























































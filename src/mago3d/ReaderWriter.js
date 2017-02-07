'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var ReaderWriter = function() {
	if(!(this instanceof ReaderWriter)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.rootPath = "";
	//this.geometryDataPath = "/F4D_GeometryData";
	this.geometryDataPath = Mago3DConfig.getInformation.getDataPath();
	this.vi_arrays_Container = new VertexIdxVBOArraysContainer();
	this.byteColorsVBO_ArraysContainer = new ByteColorsVBOArraysContainer();
		//var simpleBuildingImage = new Image();
		
	this.i_counter;
	this.j_counter;
	this.k_counter;
		
	this.GL;
	this.incre_latAng = 0.001;
	this.incre_longAng = 0.001;
	this.GAIA3D__offset_latitude = -0.001;
	this.GAIA3D__offset_longitude = -0.001;
	this.GAIA3D__counter = 0;
		
		// Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***
		// Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***
	this.uint32;
	this.uint16;
	this.int16;
	this.float32;
    this.float16;
    this.int8;
    this.int8_value;
	this.max_color_value = 126;
		
	this.startBuff;
	this.endBuff;
	
	this.filesReadings_count = 0;
	
	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this.temp_var_to_waste;
	this.countSC;
	this.xSC;
	this.ySC;
	this.zSC;
	this.point3dSC = new Point3D();
	this.bboxSC = new BoundingBox();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns uint32[0]
 */
ReaderWriter.prototype.readUInt32 = function(buffer, start, end) {
	var uint32 = new Uint32Array(buffer.slice(start, end));
	return uint32[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns int32[0]
 */
ReaderWriter.prototype.readInt32 = function(buffer, start, end) {
	var int32 = new Int32Array(buffer.slice(start, end));
	return int32[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns uint16[0]
 */
ReaderWriter.prototype.readUInt16 = function(buffer, start, end) {
	var uint16 = new Uint16Array(buffer.slice(start, end));
	return uint16[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns int16[0]
 */
ReaderWriter.prototype.readInt16 = function(buffer, start, end) {
	var int16 = new Int16Array(buffer.slice(start, end));
	return int16[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns float64[0]
 */
ReaderWriter.prototype.readFloat64 = function(buffer, start, end) {
	var float64 = new Float64Array(buffer.slice(start, end));
	return float64[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns float32[0]
 */
ReaderWriter.prototype.readFloat32 = function(buffer, start, end) {
	var float32 = new Float32Array(buffer.slice(start, end));
	return float32[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns float16[0]
 */
ReaderWriter.prototype.readFloat16 = function(buffer, start, end) {
	var float16 = new Float32Array(buffer.slice(start, end));
	return float16[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns int8[0]
 */
ReaderWriter.prototype.readInt8 = function(buffer, start, end) {
	var int8 = new Int8Array(buffer.slice(start, end));
	return int8[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns uint8[0]
 */
ReaderWriter.prototype.readUInt8 = function(buffer, start, end) {
	var uint8 = new Uint8Array(buffer.slice(start, end));
	return uint8[0];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param buffer 변수
 * @param start 변수
 * @param end 변수
 * @returns int8_value
 */
ReaderWriter.prototype.readInt8ByteColor = function(buffer, start, end) {
	var int8 = new Int8Array(buffer.slice(start, end));
	var int8_value = int8[0];

	if(int8_value > max_color_value)
	   int8_value = max_color_value;

	 if(int8_value < 0)
	   int8_value += 256;

	 return int8_value;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param float32Array 변수
 * @param result_bbox 변수
 * @returns result_bbox
 */
ReaderWriter.prototype.getBoundingBoxFromFloat32Array = function(float32Array, result_bbox) {
	if(result_bbox == undefined)
		result_bbox = new BoundingBox();
	
	var values_count = float32Array.length;
	for(var i=0; i<values_count; i+=3)
	{
		this.point3dSC.x = float32Array[i];
		this.point3dSC.y = float32Array[i+1];
		this.point3dSC.z = float32Array[i+2];
		
		if(i==0)
		{
			result_bbox.setInit(this.point3dSC);
		}
		else{
			result_bbox.addPoint3D(this.point3dSC);
		}
	}
	
	return result_bbox;

};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param arrayBuffer 변수
 * @param blocksList 변수
 * @param neoBuilding 변수
 */
ReaderWriter.prototype.readNeoBlocks = function(GL, arrayBuffer, blocksList, neoBuilding) {
	var bytes_readed = 0;
	var blocks_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	  for(var i=0; i<blocks_count; i++)
	  {
		  var block = blocksList.newBlock();
		  
		  if(blocksList._name == "BlocksBone")
		  {
			  if(i== 1495 || i== 1497 || i== 1145)
			  {
				  var hola = 0 ;
			  }
		  }
		  
			// 1rst, read bbox.***
			var bbox = new BoundingBox();
			bbox._minX = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			bbox._minY = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			bbox._minZ = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			  
			bbox._maxX = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			bbox._maxY = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			bbox._maxZ = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			
			var maxLength = bbox.getMaxLength();
			if(maxLength < 1.0)
				block.isSmallObj = true;
			else
				block.isSmallObj = false;
			
			// New for read multiple vbo datas (indices cannot superate 65535 value).***
			var vboDatasCount = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<vboDatasCount; j++)
			{
			
				// 1) Positions array.***************************************************************************************
				var vertex_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				var verticesFloatValues_count = vertex_count * 3;
				
				block.vertex_count = vertex_count;

				var startBuff = bytes_readed;
				var endBuff = bytes_readed + 4*verticesFloatValues_count;

				var vbo_vi_cacheKey = block._vbo_VertexIdx_CacheKeys_Container.newVBOVertexIdxCacheKey();
				vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
				
				/*
				vbo_vi_cacheKey.MESH_VERTEX_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_VERTEX_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				  */
				bytes_readed = bytes_readed + 4*verticesFloatValues_count; // updating data.***
				 
				// 2) Normals.************************************************************************************************
				vertex_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				var normalByteValues_count = vertex_count * 3;
				//Test.***********************
				//for(var j=0; j<normalByteValues_count; j++)
				//{
				//	var value_x = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
				//}
				startBuff = bytes_readed;
				endBuff = bytes_readed + 1*normalByteValues_count;
				
				vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
				/*
				vbo_vi_cacheKey.MESH_NORMAL_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_NORMAL_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Int8Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				  */
				bytes_readed = bytes_readed + 1*normalByteValues_count; // updating data.***
				
				// 3) Indices.*************************************************************************************************
				var shortIndicesValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				startBuff = bytes_readed;
				endBuff = bytes_readed + 2*shortIndicesValues_count;
				  
				vbo_vi_cacheKey.idx_vboDataArray = new Int16Array(arrayBuffer.slice(startBuff, endBuff));
				/*
				vbo_vi_cacheKey.MESH_FACES_cacheKey= GL.createBuffer ();
				GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, vbo_vi_cacheKey.MESH_FACES_cacheKey);
				GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				 */ 
				bytes_readed = bytes_readed + 2*shortIndicesValues_count; // updating data.***
				vbo_vi_cacheKey.indices_count = shortIndicesValues_count;  
				
			}
	   }
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param neoRefsList 변수
 * @param arrayBuffer 변수
 * @param neoBuilding 변수
 * @param f4dReadWriter 변수
 */
ReaderWriter.prototype.readNeoReferences = function(GL, neoRefsList, arrayBuffer, neoBuilding, f4dReadWriter) {
	var startBuff;
	var endBuff;
	var bytes_readed = 0;
	var neoRefs_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	if(neoRefsList.name == "111" || neoRefsList.name == "112" || neoRefsList.name == "113" || neoRefsList.name == "114")
	{
		var hola = 0;
	}
	
	for(var i=0; i<neoRefs_count; i++)
	{
		var neoRef = neoRefsList.newNeoReference();
		
		// 1) Id.***
		var ref_ID =  f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._id = ref_ID;
		
		if(neoRef._id == 85 || neoRef._id == 6365)
		{
			var hola = 0;
		}
		
		// 2) Block's Idx.***
		var blockIdx =   f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._block_idx = blockIdx;
		
		// 3) Transform Matrix4.***
		neoRef._originalMatrix4._floatArrays[0] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[1] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[2] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[3] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._originalMatrix4._floatArrays[4] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[5] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[6] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[7] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._originalMatrix4._floatArrays[8] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[9] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[10] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[11] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._originalMatrix4._floatArrays[12] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._originalMatrix4._floatArrays[13] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._originalMatrix4._floatArrays[14] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._originalMatrix4._floatArrays[15] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		
		//var vertex_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		/*
		// Short mode. NO, can not use gl_repeat.***
		var texcoordShortValues_count = vertex_count * 2;
		startBuff = bytes_readed;
		endBuff = bytes_readed + 2*texcoordShortValues_count;
		
		neoRef.MESH_TEXCOORD_cacheKey = GL.createBuffer ();
		GL.bindBuffer(GL.ARRAY_BUFFER, neoRef.MESH_TEXCOORD_cacheKey);
		GL.bufferData(GL.ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
		  
		bytes_readed = bytes_readed + 2*texcoordShortValues_count; // updating data.***
		*/
		// Float mode.**************************************************************
		// New modifications for samsung 20161013.*****************************
		var has_1_color = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		if(has_1_color)
		{
			// "type" : one of following
			// 5120 : signed byte, 5121 : unsigned byte, 5122 : signed short, 5123 : unsigned short, 5126 : float
			var data_type = f4dReadWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			var dim = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			
			var daya_bytes;
			if(data_type == 5121)
				daya_bytes = 1;
			
			var r = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var g = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var b = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var alfa = 255;
			
			if(dim == 4)
				alfa = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			
			neoRef.color4 = new Color();
			neoRef.color4.set(r, g, b, alfa);
		}
		else{
			var hola = 0 ;
		}
		
		var has_colors = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		if(has_colors)
		{
			var data_type = f4dReadWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			var dim = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			
			var daya_bytes;
			if(data_type == 5121)
				daya_bytes = 1;
			
			var colors_count = f4dReadWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
			for(var j = 0; j<colors_count; j++)
			{
				// temporally, waste data.***
				var r = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var g = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var b = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				
				if(dim == 4)
					var alfa = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			}
		}
		
		var has_texCoords = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		
		// End New modifications for samsung 20161013.-------------------------
		if(has_texCoords)
		{
			var data_type = f4dReadWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			var vertex_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			if(vertex_count == 0)
			{
				var hola = 0;
			}
			neoRef.vertex_count = vertex_count;
			
			var texcoordFloatValues_count = vertex_count * 2;
			startBuff = bytes_readed;
			endBuff = bytes_readed + 4*texcoordFloatValues_count;
			
			neoRef.MESH_TEXCOORD_cacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, neoRef.MESH_TEXCOORD_cacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
			  
			bytes_readed = bytes_readed + 4*texcoordFloatValues_count; // updating data.***
		}
		// End texcoords float mode.-------------------------------------------------
			
		// 4) short texcoords.*****
		var textures_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // this is only indicative that there are a texcoords.***
		if(textures_count > 0)
		{

			neoRef.texture = new Texture();
			neoRef.hasTexture = true;
			
			// Now, read the texture_type and texture_file_name.***
			var texture_type_nameLegth = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<texture_type_nameLegth; j++){
				neoRef.texture.texture_type_name += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1; // for example "diffuse".***
			}
			
			var texture_fileName_Legth = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<texture_fileName_Legth; j++){
				neoRef.texture.texture_image_fileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}
			
			/*
			// 1pixel texture, wait for texture to load.********************************************
			if(neoRef.texture.tex_id == undefined)
				neoRef.texture.tex_id = GL.createTexture();
			GL.bindTexture(GL.TEXTURE_2D, neoRef.texture.tex_id);
			GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
			GL.bindTexture(GL.TEXTURE_2D, null);
			*/
		}
		else{
			neoRef.hasTexture = false;
		}

	}
	
	// Now occlusion cullings.***
	//bytes_readed = neoRefsList.exterior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, f4dReadWriter);
	//bytes_readed = neoRefsList.interior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, f4dReadWriter);
	
	// Occlusion culling octree data.*****
	var infiniteOcCullBox = neoRefsList.exterior_ocCullOctree;
	bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, infiniteOcCullBox);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.setSizesSubBoxes();
	
	var ocCullBox = neoRefsList.interior_ocCullOctree; 
	bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, ocCullBox);
	ocCullBox.setSizesSubBoxes();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param arrayBuffer 변수
 * @param bytes_readed 변수
 * @param ocCullingOctree_Cell 변수
 * @returns bytes_readed
 */
ReaderWriter.prototype.readOcclusionCullingOctreeCell = function(arrayBuffer, bytes_readed, ocCullingOctree_Cell) {
	// Note: This function must return the total_bytes_readed.***
	
	var is_mother_cell = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
	if(is_mother_cell)
	{
		// read the mother dimensions.***
		var minX = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var maxX = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var minY = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var maxY = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var minZ = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var maxZ = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		ocCullingOctree_Cell.setDimensions(minX, maxX, minY, maxY, minZ, maxZ);
	}
	else{
		// do nothing.***
	}
	
	var subBoxes_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	if(subBoxes_count == 0)
	{
		var compRefObjects_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var i=0; i<compRefObjects_count; i++)
		{
			var compRefObjects_idxInList = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			ocCullingOctree_Cell._indicesArray.push(compRefObjects_idxInList);
			//ocCullingOctree_Cell._indicesUInt16Array
		}
	}
	else{
		for(var i=0; i<subBoxes_count; i++)
		{
			var subOcclusionBox = ocCullingOctree_Cell.newSubBox();
			bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, subOcclusionBox);
		}
	}
	
	return bytes_readed;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param arrayBuffer 변수
 * @param neoSimpleBuilding 변수
 */
ReaderWriter.prototype.readNeoSimpleBuilding = function(GL, arrayBuffer, neoSimpleBuilding) {
	var bytes_readed = 0;
	var accessors_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	for(var i=0; i<accessors_count; i++)
	{
		var accesor = neoSimpleBuilding.newAccesor();
		accesor.buffer_id = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.accesor_type = this.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1; // 0= position, 1= normal, 2= color, 3= texcoord.***
		accesor.buffer_start = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.stride = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.data_ytpe = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.dimension = this.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		
		accesor.max_x = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.max_y = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.max_z = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.min_x = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.min_y = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		accesor.min_z = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
	}
	
	// now, read the buffer.***
	var buffer_id = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	var buffer_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	var startBuff = bytes_readed;
	var endBuff = bytes_readed + buffer_length;
	
	var vbo_vicky = neoSimpleBuilding.vbo_vicks_container.newVBOVertexIdxCacheKey();
	
	vbo_vicky.buffer = new Buffer();
	vbo_vicky.buffer.dataArray = new Uint8Array(arrayBuffer.slice(startBuff, endBuff));
	vbo_vicky.buffer.dataArray_byteLength = buffer_length;
	
	//vbo_vicky.pos_vboDataArray = new Uint8Array(arrayBuffer.slice(startBuff, endBuff));
	
	// Now, the 1extrude simpleBuilding.**********************************************************
	//var h=0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param blocksList 변수
 * @param neoBuilding 변수
 * @param readerWriter 변수
 */
ReaderWriter.prototype.readNeoBlocksInServer = function(GL, filePath_inServer, blocksList, neoBuilding, readerWriter) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		  readerWriter.readNeoBlocks(GL, arrayBuffer, blocksList, neoBuilding);
	  }
	  
	  arrayBuffer = null;
	};

	oReq.send(null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param neoRefList_container 변수
 * @param neoReferenceList_name 변수
 * @param lodLevel 변수
 * @param blocksList 변수
 * @param transformMat 변수
 * @param neoBuilding 변수
 * @param readerWriter 변수
 * @param subOctreeNumberName 변수
 */
ReaderWriter.prototype.readNeoReferencesInServer = function(GL, filePath_inServer, neoRefList_container, neoReferenceList_name, 
																		  lodLevel, blocksList, transformMat, neoBuilding, readerWriter, subOctreeNumberName) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(readerWriter == undefined)
		  {
			   readerWriter = new ReaderWriter();
		  }
		  //------------------------------------------------------
		  
		  var octree;
		  if(subOctreeNumberName != undefined)
		  {
			  // we are reading interior comRefs.***
			  if(neoBuilding.octree == undefined)
			  {
				  var hola = 0;
				  neoBuilding.octree = new Octree(undefined);
			  }
			  
			  octree = neoBuilding.octree.getOctreeByNumberName(subOctreeNumberName);
			  var neoRefsList = new NeoReferencesList();
			  neoRefsList.lod_level = lodLevel;
			  neoRefsList.blocksList = blocksList;
			  neoRefsList.name = neoReferenceList_name;
			  //neoRefsList.parseArrayBuffer(GL, arrayBuffer, neoBuilding, readerWriter);
			  readerWriter.readNeoReferences(GL, neoRefsList, arrayBuffer, neoBuilding, readerWriter);
			  if(transformMat)
			  {
				  neoRefsList.multiplyReferencesMatrices(transformMat);
			  }
			  octree.neoRefsList_Array.push(neoRefsList);
			  if(subOctreeNumberName == 111)
			  {
				  var hola_1 = 0;
			  }
		  }
		  else
		  {
			  if(neoReferenceList_name == "Ref_Bone")
			  {
				  var hola = 0;
			  }
			  
			  var neoRefsList = neoRefList_container.newNeoRefsList(blocksList);
			  neoRefsList.lod_level = lodLevel;
			  neoRefsList.name = neoReferenceList_name;
			  neoRefsList.blocksList = blocksList;
			  //neoRefsList.parseArrayBuffer(GL, arrayBuffer, neoBuilding, readerWriter);
			  readerWriter.readNeoReferences(GL, neoRefsList, arrayBuffer, neoBuilding, readerWriter);
			  if(transformMat)
			  {
				  neoRefsList.multiplyReferencesMatrices(transformMat);
			  }
		  }
		 
	  }
	  //arrayBuffer = null;
	};

	oReq.send(null);
};	

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param neoSimpleBuilding 변수
 * @param readerWriter 변수
 */
ReaderWriter.prototype.readNeoSimpleBuildingInServer = function(GL, filePath_inServer, neoSimpleBuilding, readerWriter) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(readerWriter == undefined)
		  {
			   readerWriter = new ReaderWriter();
		  }
		  //------------------------------------------------------
		   readerWriter.readNeoSimpleBuilding(GL, arrayBuffer, neoSimpleBuilding );
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param arrayBuffer 변수
 * @param filePath_inServer 변수
 * @param terranTile 변수
 * @param readerWriter 변수
 * @param bytes_readed 변수
 * @returns bytes_readed
 */
ReaderWriter.prototype.readTerranTileFile = function(GL, arrayBuffer, filePath_inServer, terranTile, readerWriter, bytes_readed) {
	//var bytes_readed = 0;
	var f4d_headerPathName_length = 0;
	var BP_Project;
	var idxFile;
	var subTile;
	
	terranTile._depth = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	if(terranTile._depth == 0)
	{
		// Read dimensions.***
		terranTile.longitude_min = this.readFloat64(arrayBuffer, bytes_readed, bytes_readed+8); bytes_readed += 8;
		terranTile.longitude_max = this.readFloat64(arrayBuffer, bytes_readed, bytes_readed+8); bytes_readed += 8;
		terranTile.latitude_min = this.readFloat64(arrayBuffer, bytes_readed, bytes_readed+8); bytes_readed += 8;
		terranTile.latitude_max = this.readFloat64(arrayBuffer, bytes_readed, bytes_readed+8); bytes_readed += 8;
	}
	
	// Read the max_depth of the quadtree.***
	var max_dpeth = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	// Now, make the quadtree.***
	terranTile.makeTree(max_dpeth);
	
	// Old.***
	/*
	var subTiles_count = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	if(subTiles_count == 0)
	{
		// this is the smallest tile.***
		var idxFiles_count = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		if(idxFiles_count > 1)
		{
			var h=0;
		}
		for(var i=0; i<idxFiles_count; i++)
		{
			
			BP_Project = terranTile.newBRProject();
			BP_Project._header._f4d_version = 2;
			// 1rst, read the files path names.************************************************************************************************************
			f4d_headerPathName_length = this.readInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			for(var j=0; j<f4d_headerPathName_length; j++){
				BP_Project._f4d_rawPathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}
			BP_Project._f4d_headerPathName = BP_Project._f4d_rawPathName + "_Header.hed";
			BP_Project._f4d_simpleBuildingPathName = BP_Project._f4d_rawPathName + "_Geom.f4d";
			BP_Project._f4d_nailImagePathName = BP_Project._f4d_rawPathName + "_Gaia.jpg";
			
		}
		// provisionally, delete all the BP_Projects created.***
		// provisionally, delete all the BP_Projects created.***
		// provisionally, delete all the BP_Projects created.***
		terranTile._BR_buildingsArray.length = 0;
	}
	else
	{
		for(var i=0; i<4; i++)
		{
			subTile = terranTile.newSubTerranTile();
			bytes_readed = this.readTerranTileFile(GL, arrayBuffer, filePath_inServer, subTile, readerWriter, bytes_readed);
		}
	}
	*/
	return bytes_readed;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param terranTile 변수
 * @param readerWriter 변수
 */
ReaderWriter.prototype.readTerranTileFileInServer = function(GL, filePath_inServer, terranTile, readerWriter) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
		var arrayBuffer = oReq.response; // Note: not oReq.responseText
		if (arrayBuffer)
		{
			if(readerWriter == undefined)
			{
				readerWriter = new ReaderWriter();
			}
			//------------------------------------------------------
			var bytes_readed = 0;
			readerWriter.readTerranTileFile(GL, arrayBuffer, filePath_inServer, terranTile, readerWriter, bytes_readed)
			
			// Once readed the terranTilesFile, must make all the quadtree.***
			terranTile.setDimensionsSubTiles();
			terranTile.calculatePositionByLonLatSubTiles();
			terranTile.terranIndexFile_readed = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param BR_ProjectsList 변수
 * @param readerWriter 변수
 */
ReaderWriter.prototype.readPCloudIndexFileInServer = function(GL, filePath_inServer, BR_ProjectsList, readerWriter) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	    var arrayBuffer = oReq.response; // Note: not oReq.responseText
	    if (arrayBuffer)
	   {
		    if(readerWriter == undefined)
		    {
		    	readerWriter = new ReaderWriter();
		    }
		    //---------------------------------------------------------------------------------------------------
		    // write code here.***
		    var pCloudProject;
		  
		    var bytes_readed = 0;
	
			var f4d_rawPathName_length = 0;
			var f4d_simpleBuildingPathName_length = 0;
			var f4d_nailImagePathName_length = 0;
			
			var pCloudProjects_count = readerWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			for(var i=0; i<pCloudProjects_count; i++)
			{
				pCloudProject = new PCloudMesh();
				BR_ProjectsList._pCloudMesh_array.push(pCloudProject);
				pCloudProject._header._f4d_version = 2;
				// ********************************************************************************************************************************************
				// 1rst, read the files path names.************************************************************************************************************
				f4d_rawPathName_length = readerWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for(var j=0; j<f4d_rawPathName_length; j++){
					pCloudProject._f4d_rawPathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
				}
				
				pCloudProject._f4d_headerPathName = pCloudProject._f4d_rawPathName + "/pCloud_Header.hed";
				pCloudProject._f4d_geometryPathName = pCloudProject._f4d_rawPathName + "/pCloud_Geo.f4d";
				
				//BP_Project._f4d_headerPathName = BP_Project._f4d_rawPathName + "_Header.hed";
				//BP_Project._f4d_simpleBuildingPathName = BP_Project._f4d_rawPathName + "_Geom.f4d";
				//BP_Project._f4d_nailImagePathName = BP_Project._f4d_rawPathName + "_Gaia.jpg";
			}
	    }
	    arrayBuffer = null;
	};

	oReq.send(null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param pCloud 변수
 * @param readerWriter 변수
 * @param f4d_manager 변수
 */
ReaderWriter.prototype.readPCloudHeaderInServer = function(GL, filePath_inServer, pCloud, readerWriter, f4d_manager) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	pCloud._f4d_header_readed = true;
	
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	    var arrayBuffer = oReq.response; // Note: not oReq.responseText
	    if (arrayBuffer)
	    {
		    if(readerWriter == undefined)
		    {
		    	readerWriter = new ReaderWriter();
		    }
		    //--------------------------------------------------------------
		    // write code here.***
		  
		    var bytes_readed = 0;
			var version_string_length = 5;
			var intAux_scratch = 0;
			var auxScratch;
			var header = pCloud._header;
			
			// 1) Version(5 chars).***********
			for(var j=0; j<version_string_length; j++){
				header._version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}
			
			// 2) Type (1 byte).**************
			header._type = String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			
			// 3) Global unique ID.*********************
			intAux_scratch = readerWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<intAux_scratch; j++){
				header._global_unique_id += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}
			
			// 4) Location.*************************
			header._latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
			header._longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
			header._elevation = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
			
			header._elevation += 60.0; // delete this. TEST.!!!
			
			// 5) Orientation.*********************
			auxScratch = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4; // yaw.***
			auxScratch = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4; // pitch.***
			auxScratch = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4; // roll.***
			
			// 6) BoundingBox.************************
			header._boundingBox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
			header._boundingBox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
			header._boundingBox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
			header._boundingBox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
			header._boundingBox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
			header._boundingBox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
			
			var isLarge = false;
			if(header._boundingBox._maxX - header._boundingBox._minX > 40.0 || header._boundingBox._maxY - header._boundingBox._minY > 40.0)
			{
				isLarge = true;
			}
			
			if(!isLarge && header._boundingBox._maxZ - header._boundingBox._minZ < 30.0)
			{
				header.isSmall = true;
			}
			
			// 7) octZerothBox.***********************
			header._octZerothBox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
			header._octZerothBox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
			header._octZerothBox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
			header._octZerothBox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
			header._octZerothBox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
			header._octZerothBox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
			
			// 8) Data file name.********************
			intAux_scratch = readerWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<intAux_scratch; j++){
				header._dataFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}
			
			// Now, must calculate some params of the project.**********************************************
			// 0) PositionMatrix.************************************************************************
			//var height = elevation;
			
			var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation); // Old.***
			pCloud._pCloudPosition = position; 
			
			// High and Low values of the position.****************************************************
			var splitValue = Cesium.EncodedCartesian3.encode(position);
			var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
			var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
			var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
			
			pCloud._pCloudPositionHIGH = new Float32Array(3);
			pCloud._pCloudPositionHIGH[0] = splitVelue_X.high;
			pCloud._pCloudPositionHIGH[1] = splitVelue_Y.high;
			pCloud._pCloudPositionHIGH[2] = splitVelue_Z.high;
			
			pCloud._pCloudPositionLOW = new Float32Array(3);
			pCloud._pCloudPositionLOW[0] = splitVelue_X.low;
			pCloud._pCloudPositionLOW[1] = splitVelue_Y.low;
			pCloud._pCloudPositionLOW[2] = splitVelue_Z.low;
			
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  pCloud._f4d_header_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};	

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param neoBuilding 변수
 * @param readerWriter 변수
 * @param f4d_manager 변수
 */
ReaderWriter.prototype.readNeoHeaderInServer = function(GL, filePath_inServer, neoBuilding, readerWriter, f4d_manager) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	//BR_Project._f4d_header_readed = true;
	
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(readerWriter == undefined)
		  {
			   readerWriter = new ReaderWriter();
		  }
		  //------------------------------------------------------
		  neoBuilding.metaData.parseFileHeader(arrayBuffer, readerWriter);
		  
			// Now, make the neoBuilding's octree.***
			neoBuilding.octree.setBoxSize(neoBuilding.metaData.oct_min_x, neoBuilding.metaData.oct_max_x,  
										  neoBuilding.metaData.oct_min_y, neoBuilding.metaData.oct_max_y,  
										  neoBuilding.metaData.oct_min_z, neoBuilding.metaData.oct_max_z);
										
			neoBuilding.octree.makeTree(3);
			neoBuilding.octree.setSizesSubBoxes();
			
		  
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  //BR_Project._f4d_header_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param imageArrayBuffer 변수
 * @param BR_Project 변수
 * @param readerWriter 변수
 * @param f4d_manager 변수
 * @param imageLod 변수
 */
ReaderWriter.prototype.readNailImageOfArrayBuffer = function(GL, imageArrayBuffer, BR_Project, readerWriter, f4d_manager, imageLod) {
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	var blob = new Blob( [ imageArrayBuffer ], { type: "image/jpeg" } );
	var urlCreator = window.URL || window.webkitURL;
	var imagenUrl = urlCreator.createObjectURL(blob);
	var simpleBuildingImage = new Image();
	
	simpleBuildingImage.onload = function () {
		//console.log("Image Onload");
		if(simpBuildingV1._simpleBuildingTexture == undefined)
		simpBuildingV1._simpleBuildingTexture = GL.createTexture();
		handleTextureLoaded(GL, simpleBuildingImage, simpBuildingV1._simpleBuildingTexture); 
		BR_Project._f4d_nailImage_readed_finished = true;
		imageArrayBuffer = null;
		BR_Project._simpleBuilding_v1.textureArrayBuffer = null;
		
		if(f4d_manager.backGround_imageReadings_count > 0)
		{
			f4d_manager.backGround_imageReadings_count--;
		}
	};
	
	simpleBuildingImage.onerror = function() {
		// doesn't exist or error loading
		
		//BR_Project._f4d_lod0Image_readed_finished = false;
		//BR_Project._f4d_lod0Image_exists = false;
		//if(f4d_manager.backGround_fileReadings_count > 0 )
		//	  f4d_manager.backGround_fileReadings_count -=1;
		  
		return;
	};
	
	simpleBuildingImage.src = imagenUrl;
}

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param BR_Project 변수
 * @param readerWriter 변수
 * @param f4d_manager 변수
 * @param imageLod 변수
 */
ReaderWriter.prototype.readNailImageInServer = function(GL, filePath_inServer, BR_Project, readerWriter, f4d_manager, imageLod) {
	function handleTextureLoaded(gl, image, texture) 
	{
	  gl.bindTexture(gl.TEXTURE_2D, texture);
	  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	  gl.generateMipmap(gl.TEXTURE_2D);
	  gl.bindTexture(gl.TEXTURE_2D, null);
	};
	
	if(imageLod == undefined)
		imageLod = 3; // The lowest lod.***
	
	if(imageLod == 3)
		BR_Project._f4d_nailImage_readed = true;
	else if(imageLod == 0)
		BR_Project._f4d_lod0Image_readed  = true;
	
	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new SimpleBuildingV1();
	
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	
	var simpleBuildingImage = new Image();
	simpleBuildingImage.onload = function() 
	{ 
	/*
		if(f4d_manager.render_time > 20)// for the moment is a test.***
		{
			if(imageLod == 3)
				BR_Project._f4d_nailImage_readed = false;
			else if(imageLod == 0)
				BR_Project._f4d_lod0Image_readed  = false;
			
			if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
			return;
		}
		*/
		
		if(imageLod == 3)
		{
			handleTextureLoaded(GL, simpleBuildingImage, simpBuildingV1._simpleBuildingTexture); 
		    BR_Project._f4d_nailImage_readed_finished = true;
		}
	    else if(imageLod == 0)
		{
			if(simpBuildingV1._texture_0 == undefined)
				simpBuildingV1._texture_0 = GL.createTexture();
			
			handleTextureLoaded(GL, simpleBuildingImage, simpBuildingV1._texture_0);
			BR_Project._f4d_lod0Image_readed_finished = true;
		}
		
		if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
	};
	
	simpleBuildingImage.onerror = function() {
		// doesn't exist or error loading
		BR_Project._f4d_lod0Image_readed_finished = false;
		BR_Project._f4d_lod0Image_exists = false;
		if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		return;
    };
	
		var filePath_inServer_SimpleBuildingImage = filePath_inServer;
		simpleBuildingImage.src = filePath_inServer_SimpleBuildingImage;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param f4dTex 변수
 * @param f4d_manager 변수
 */
ReaderWriter.prototype.readTextureInServer = function(GL, filePath_inServer, f4dTex, f4d_manager) {
	f4dTex.load_started = true;
	f4dTex.texImage = new Image();
	f4dTex.texImage.onload = function() 
	{ 
		f4dTex.load_finished = true;
		
		if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
	};
	
	f4dTex.texImage.onerror = function() {
		// doesn't exist or error loading
		f4dTex.load_started = false;
		if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		return;
    };

	f4dTex.texImage.src = filePath_inServer;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param texture 변수
 * @param neoBuilding 변수
 * @param f4d_manager 변수
 */
ReaderWriter.prototype.readNeoReferenceTextureInServer = function(GL, filePath_inServer, texture, neoBuilding, f4d_manager) {
	// load neoTextures
	function handleTextureLoaded(gl, image, texture) 
	{
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
		//var gl = viewer.scene.context._gl;
		gl.bindTexture(gl.TEXTURE_2D, texture);
		//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	
	var neoRefImage = new Image();
	neoRefImage.onload = function() 
	{ 
		
		if(texture.tex_id == undefined)
			texture.tex_id = GL.createTexture();
		
		handleTextureLoaded(GL, neoRefImage, texture.tex_id);
		//BR_Project._f4d_lod0Image_readed_finished = true;

		neoBuilding.textures_loaded.push(texture);
		
		if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
	};
	
	neoRefImage.onerror = function() {
		// doesn't exist or error loading

		return;
    };
	
		neoRefImage.src = filePath_inServer;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param terranTile 변수
 * @param readerWriter 변수
 */
ReaderWriter.prototype.openTerranTile = function(GL, terranTile, readerWriter ) {
	var filePath_inServer = this.geometryDataPath + "/Result_xdo2f4d/f4dTerranTileFile.txt";
	readerWriter.readTerranTileFileInServer(GL, filePath_inServer, terranTile, readerWriter);
};	

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param terranTile 변수
 * @param readerWriter 변수
 * @param f4d_manager 변수
 */
ReaderWriter.prototype.readTileArrayBufferInServer = function(GL, filePath_inServer, terranTile, readerWriter, f4d_manager) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	terranTile.fileReading_started = true;
	var oReq = new XMLHttpRequest();

	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
		var arrayBuffer = oReq.response; // Note: not oReq.responseText
		if (arrayBuffer)
		{
			//var BR_Project = new BRBuildingProject(); // Test.***
			//readerWriter.readF4D_Header(GL, arrayBuffer, BR_Project ); // Test.***
			terranTile.fileArrayBuffer = arrayBuffer;
			terranTile.fileReading_finished = true;
			
			if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  arrayBuffer = null;
		}
		
	};

	oReq.send(null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param filePath_inServer 변수
 * @param pCloud 변수
 * @param readerWriter 변수
 * @param f4d_manager 변수
 */
ReaderWriter.prototype.readPCloudGeometryInServer = function(GL, filePath_inServer, pCloud, readerWriter, f4d_manager) {
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	pCloud._f4d_geometry_readed = true;
	var oReq = new XMLHttpRequest();

	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	    var arrayBuffer = oReq.response; // Note: not oReq.responseText
	    if (arrayBuffer)
	    {
		    if(readerWriter == undefined)
		    {
		    	readerWriter = new ReaderWriter();
		    }
		    //------------------------------------------------------
		    // write code here.***
		    var bytes_readed = 0;
			var startBuff;
			var endBuff;
			
			var meshes_count = readerWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Almost allways is 1.***
			for(var a=0; a<meshes_count; a++)
			{
				var vbo_objects_count = readerWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Almost allways is 1.***
				
				// single interleaved buffer mode.*********************************************************************************
				for(var i=0; i<vbo_objects_count; i++) 
				{
					var vbo_vertexIdx_data = pCloud.vbo_datas.newVBOVertexIdxCacheKey();
					//var vt_cacheKey = simpObj._vtCacheKeys_container.newVertexTexcoordsArraysCacheKey();
					
					var iDatas_count = readerWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // iDatasCount = vertex_count.***
					startBuff = bytes_readed;
					//endBuff = bytes_readed + (4*3+1*3+1*4)*iDatas_count; // pos(float*3) + normal(byte*3) + color4(byte*4).***
					endBuff = bytes_readed + (4*3+4*3+1*4)*iDatas_count; // pos(float*3) + normal(float*3) + color4(byte*4).***
					
					//vt_cacheKey._verticesArray_cacheKey = GL.createBuffer ();
					vbo_vertexIdx_data.MESH_VERTEX_cacheKey = GL.createBuffer ();
					GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vertexIdx_data.MESH_VERTEX_cacheKey);
					GL.bufferData(GL.ARRAY_BUFFER, arrayBuffer.slice(startBuff, endBuff), GL.STATIC_DRAW);
					
					//bytes_readed = bytes_readed + (4*3+1*3+1*4)*iDatas_count; // pos(float*3) + normal(byte*3) + color4(byte*4).*** // updating data.***
					bytes_readed = bytes_readed + (4*3+4*3+1*4)*iDatas_count; // pos(float*3) + normal(float*3) + color4(byte*4).*** // updating data.***
					
					//vt_cacheKey._vertices_count = iDatas_count;
					// Now, read short indices.***
					var shortIndices_count = readerWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
					
					vbo_vertexIdx_data.indices_count = shortIndices_count;

					// Indices.***********************
					startBuff = bytes_readed;
					endBuff = bytes_readed + 2*shortIndices_count;
					/*
					// Test.***************************************************************************************
					for(var counter = 0; counter<shortIndices_count; counter++)
					{
						var shortIdx = new Uint16Array(arrayBuffer.slice(bytes_readed, bytes_readed+2));bytes_readed += 2; 
						if(shortIdx[0] >= iDatas_count)
						{
							var h=0;
						}
					}
					bytes_readed -= 2*shortIndices_count;
					// End test.------------------------------------------------------------------------------------
					*/
				  
					vbo_vertexIdx_data.MESH_FACES_cacheKey= GL.createBuffer ();
					GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, vbo_vertexIdx_data.MESH_FACES_cacheKey);
					GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				  
					bytes_readed = bytes_readed + 2*shortIndices_count; // updating data.***
				}
			}
			////////////////////////////////////////////////////////////////////////////////////////////////
	
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  pCloud._f4d_geometry_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param buildingFileName 변수
 * @param latitude 변수
 * @param longitude 변수
 * @param height 변수
 * @param readerWriter 변수
 * @param NeoBuildingsList 변수
 * @param f4d_manager 변수
 */
ReaderWriter.prototype.openNeoBuilding = function(GL, buildingFileName, latitude, longitude, height, readerWriter, NeoBuildingsList, f4d_manager) {
	// This is a test function to read the new f4d format.***
	// The location(latitude, longitude, height) is provisional.***
	
	// Read the header.***
	var neoBuilding_header_path = this.geometryDataPath + "/"+buildingFileName+"/Header.hed";
	
	var neoBuilding = NeoBuildingsList.newNeoBuilding();
	
	neoBuilding.buildingFileName = buildingFileName;
	
	if(neoBuilding.octree == undefined)
		neoBuilding.octree = new Octree(undefined);
	
	readerWriter.readNeoHeaderInServer(GL, neoBuilding_header_path, neoBuilding, readerWriter, f4d_manager); // Here makes the tree of octree.***
	
	// 0) PositionMatrix.************************************************************************
	//var height = elevation;
	var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height); // Old.***
	//var position = absolutePosition;
	neoBuilding._buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	neoBuilding._buildingPositionHIGH = new Float32Array(3);
	neoBuilding._buildingPositionHIGH[0] = splitVelue_X.high;
	neoBuilding._buildingPositionHIGH[1] = splitVelue_Y.high;
	neoBuilding._buildingPositionHIGH[2] = splitVelue_Z.high;
	
	neoBuilding._buildingPositionLOW = new Float32Array(3);
	neoBuilding._buildingPositionLOW[0] = splitVelue_X.low;
	neoBuilding._buildingPositionLOW[1] = splitVelue_Y.low;
	neoBuilding._buildingPositionLOW[2] = splitVelue_Z.low;
	// End.-----------------------------------------------------------------------------------
	
	// Determine the elevation of the position.***********************************************************
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	
	Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, neoBuilding.move_matrix);
	neoBuilding.transfMat_inv = new Float32Array(16);
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.transfMat_inv);
	
	neoBuilding.move_matrix[12] = 0;
	neoBuilding.move_matrix[13] = 0;
	neoBuilding.move_matrix[14] = 0;
	neoBuilding._buildingPosition = position;
	// note: "neoBuilding.move_matrix" is only rotation matrix.***
	
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.move_matrix_inv);
	
	// 1) Blocks.*******************************************************************************************************************************
	var blocksListContainer = neoBuilding._blocksList_Container;
	var filePath_inServer = "";
	
	filePath_inServer = this.geometryDataPath + "/"+buildingFileName+"/Blocks1";
	var blocksList = blocksListContainer.getBlockList("Blocks1");
	readerWriter.readNeoBlocksInServer(GL, filePath_inServer, blocksList, neoBuilding, readerWriter);
	
	var filePath_inServer_2 = this.geometryDataPath + "/"+buildingFileName+"/Blocks2";
	var blocksList_2 = blocksListContainer.getBlockList("Blocks2");
	readerWriter.readNeoBlocksInServer(GL, filePath_inServer_2, blocksList_2, neoBuilding, readerWriter);
	
	var filePath_inServer_3 = this.geometryDataPath + "/"+buildingFileName+"/Blocks3";
	var blocksList_3 = blocksListContainer.getBlockList("Blocks3");
	readerWriter.readNeoBlocksInServer(GL, filePath_inServer_3, blocksList_3, neoBuilding, readerWriter);
	
	var filePath_inServer_bone = this.geometryDataPath + "/"+buildingFileName+"/BlocksBone";
	var blocksList_bone = blocksListContainer.getBlockList("BlocksBone");
	readerWriter.readNeoBlocksInServer(GL, filePath_inServer_bone, blocksList_bone, neoBuilding, readerWriter);
	
	var filePath_inServer_4 = this.geometryDataPath + "/"+buildingFileName+"/Blocks4"; // Interior Objects.***
	var blocksList_4 = blocksListContainer.getBlockList("Blocks4");
	readerWriter.readNeoBlocksInServer(GL, filePath_inServer_4, blocksList_4, neoBuilding, readerWriter);
	
	// 2) References.****************************************************************************************************************************
	var moveMatrix = new Matrix4();
	moveMatrix.setByFloat32Array(neoBuilding.move_matrix);
	var lod_level = 0;
	
	var neoRefList_container = neoBuilding._neoRefLists_Container;
	
	lod_level = 0;
	filePath_inServer = this.geometryDataPath + "/"+buildingFileName+"/Ref_Skin1";
	readerWriter.readNeoReferencesInServer(GL, filePath_inServer, neoRefList_container, "Ref_Skin1", lod_level, blocksList, moveMatrix, neoBuilding, readerWriter, undefined);
	
	lod_level = 1;
	filePath_inServer = this.geometryDataPath + "/"+buildingFileName+"/Ref_Skin2";
	readerWriter.readNeoReferencesInServer(GL, filePath_inServer, neoRefList_container, "Ref_Skin2", lod_level, blocksList_2, moveMatrix, neoBuilding, readerWriter, undefined);
	
	lod_level = 2;
	filePath_inServer = this.geometryDataPath + "/"+buildingFileName+"/Ref_Skin3";
	readerWriter.readNeoReferencesInServer(GL, filePath_inServer, neoRefList_container, "Ref_Skin3", lod_level, blocksList_3, moveMatrix, neoBuilding, readerWriter, undefined);
	
	lod_level = 0;
	filePath_inServer = this.geometryDataPath + "/"+buildingFileName+"/Ref_Bone";
	readerWriter.readNeoReferencesInServer(GL, filePath_inServer, neoRefList_container, "Ref_Bone", lod_level, blocksList_bone, moveMatrix, neoBuilding, readerWriter, undefined);
	
	// Now, read the interior objects in octree format.**********************************************************************************************
	var interiorCRef_folderPath = this.geometryDataPath + "/"+buildingFileName+"/inLOD4";
	lod_level = 0;
	//var interior_base_name = "Ref_NodeData";
	var subOctreeName_counter = -1;
	
	for(var i=1; i<9; i++)
	{
		for(var j=1; j<9; j++)
		{
			for(var k=1; k<9; k++)
			{
				subOctreeName_counter = i*100 + j*10 + k;
				var interiorCRef_fileName = subOctreeName_counter.toString();

				// Create a "compoundRefList".************************************************
				var intCompRef_filePath = interiorCRef_folderPath + "/" + interiorCRef_fileName;
				//readerWriter.readF4D_CompoundReferences_inServer(GL, intCompRef_filePath, null, interiorCRef_fileName, 4, blocksList_4, moveMatrix, BR_buildingProject, readerWriter, subOctreeName_counter);
				readerWriter.readNeoReferencesInServer(GL, intCompRef_filePath, null, interiorCRef_fileName, lod_level, blocksList_4, moveMatrix, neoBuilding, readerWriter, subOctreeName_counter);
			}
		}
	}
	
	// Now, read the simple building.************************
	neoBuilding.neoSimpleBuilding = new NeoSimpleBuilding();
	filePath_inServer = this.geometryDataPath + "/"+buildingFileName+"/SimpleBuilding";
	readerWriter.readNeoSimpleBuildingInServer(GL, filePath_inServer, neoBuilding.neoSimpleBuilding, readerWriter);
};
			
//# sourceURL=f4d_readWriter.js	

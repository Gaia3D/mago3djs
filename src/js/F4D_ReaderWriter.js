
// Code examples for the future.*********************************************************************
/*
var _getAllFilesFromFolder = function(dir) 
	{
		// http://stackoverflow.com/questions/20822273/best-way-to-get-folder-and-file-list-in-javascript
		
		var filesystem = require('fs');
		var results = [];

		filesystem.readdirSync(dir).forEach(function(file) {

			file = dir+'/'+file;
			var stat = filesystem.statSync(file);

			if (stat && stat.isDirectory()) {
				//results = results.concat(_getAllFilesFromFolder(file))
			} else results.push(file);

		});

		return results;
		
	};
	*/
		
// End code examples.------------------------------------------------------------------------------------

var f4d_ReaderWriter = function()
{
	
	this.vi_arrays_Container = new VertexIdxVBO_ArraysContainer();
	this.byteColorsVBO_ArraysContainer = new ByteColorsVBO_ArraysContainer();
		//var simpleBuildingImage = new Image();
		
	this.i_counter = undefined;
	this.j_counter = undefined;
	this.k_counter = undefined;
		
	this.GL = undefined;
	this.incre_latAng = 0.001;
	this.incre_longAng = 0.001;
	this.GAIA3D__offset_latitude = -0.001;
	this.GAIA3D__offset_longitude = -0.001;
	this.GAIA3D__counter = 0;
		
		// Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***
		// Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***
	this.uint32 = undefined;
	this.uint16 = undefined;
	this.int16 = undefined;
	this.float32 = undefined;
    this.float16 = undefined;
    this.int8 = undefined;
    this.int8_value = undefined;
	this.max_color_value = 126;
		
	this.startBuff = undefined;
	this.endBuff = undefined;
	
	this.filesReadings_count = 0;
	
	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this.temp_var_to_waste = undefined;
	this.countSC = undefined;
	this.xSC = undefined;
	this.ySC = undefined;
	this.zSC = undefined;
	this.point3dSC = new f4d_point3d();
	this.bboxSC = new f4d_boundingBox();
};

// Basic readers.****************************************************************************************
f4d_ReaderWriter.prototype.readUInt32 = function(buffer, start, end)
{
	 uint32 = new Uint32Array(buffer.slice(start, end));
	 return uint32[0];
};

f4d_ReaderWriter.prototype.readInt32 = function(buffer, start, end)
{
	 int32 = new Int32Array(buffer.slice(start, end));
	 return int32[0];
};

f4d_ReaderWriter.prototype.readUInt16 = function(buffer, start, end)
{
	 uint16 = new Uint16Array(buffer.slice(start, end));
	 return uint16[0];
};

f4d_ReaderWriter.prototype.readInt16 = function(buffer, start, end)
{
	 int16 = new Int16Array(buffer.slice(start, end));
	 return int16[0];
};

f4d_ReaderWriter.prototype.readFloat64 = function(buffer, start, end)
{
	 float64 = new Float64Array(buffer.slice(start, end));
	 return float64[0];
};

f4d_ReaderWriter.prototype.readFloat32 = function(buffer, start, end)
{
	 float32 = new Float32Array(buffer.slice(start, end));
	 return float32[0];
};

f4d_ReaderWriter.prototype.readFloat16 = function(buffer, start, end)
{
	 float16 = new Float32Array(buffer.slice(start, end));
	 return float16[0];
};

f4d_ReaderWriter.prototype.readInt8 = function(buffer, start, end)
{
	 int8 = new Int8Array(buffer.slice(start, end));
	 return int8[0];
};

f4d_ReaderWriter.prototype.readUInt8 = function(buffer, start, end)
{
	 uint8 = new Uint8Array(buffer.slice(start, end));
	 return uint8[0];
};

f4d_ReaderWriter.prototype.readInt8_byteColor = function(buffer, start, end)
{
	int8 = new Int8Array(buffer.slice(start, end));
	int8_value = int8[0];

	if(int8_value > max_color_value)
	   int8_value = max_color_value;

	 if(int8_value < 0)
	   int8_value += 256;

	 return int8_value;
};
// End basic readers.----------------------------------------------------------------------------------------

f4d_ReaderWriter.prototype.getBoundingBox_fromFloat32Array = function(float32Array, result_bbox)
{
	if(result_bbox == undefined)
		result_bbox = new f4d_boundingBox();
	
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

f4d_ReaderWriter.prototype.readF4D_Blocks_V4_0 = function(GL, arrayBuffer, blocksList, BR_BuildingProject)
{
	var bytes_readed = 0;
	  var blocks_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
	  for(var i=0; i<blocks_count; i++)
	  {
		  var block = blocksList.newBlock();
			//var fpolyhedron = block._fpolyhedron;

			// 1) Ifc Entity.***************************************
			block.mIFCEntityType = this.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;

			// 2) Fitted Box.*******************************************************
			var has_fitted_box = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			if(has_fitted_box)
			{
				startBuff = bytes_readed;
				endBuff = bytes_readed + 4*(8*3); // 4bytes * 8 vertices, and each vertice has 3 floatValues.***
				
				this.temp_var_to_waste =  new Float32Array(arrayBuffer.slice(startBuff, endBuff));
				bytes_readed = bytes_readed + 4*(8*3); // updating data.***
				
				this.bboxSC = this.getBoundingBox_fromFloat32Array(this.temp_var_to_waste, this.bboxSC);
				
				if(this.bboxSC.get_maxLength() < 0.4)
					block.isSmallObj = true;
			}

			// 3) FPolyhedrons VBO arrays.************************************************************
			//var vi_arrays_Container = new VertexIdxVBO_ArraysContainer(); // Old.***
			this.vi_arrays_Container._meshArrays.length = 0;
			//var scale = 100.0;
			
			
			
			var vi_arrays_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<vi_arrays_count; j++)
			{
				var verticesFloatValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				startBuff = bytes_readed;
				endBuff = bytes_readed + 4*verticesFloatValues_count;
				
				// Vertices.************************
				  var vbo_vi_cacheKey = block._vbo_VertexIdx_CacheKeys_Container.new_VBO_VertexIdxCacheKey();
				  
				  
				  vbo_vi_cacheKey.MESH_VERTEX_cacheKey = GL.createBuffer ();
				  GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_VERTEX_cacheKey);
				  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				  
				  bytes_readed = bytes_readed + 4*verticesFloatValues_count; // updating data.***
				  
				
				var shortIndicesValues_count =  this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				vbo_vi_cacheKey.indices_count = shortIndicesValues_count;
				// Now, make the VBO of the block readed.******************************
				
				  
				  // Indices.***********************
				  startBuff = bytes_readed;
				  endBuff = bytes_readed + 2*shortIndicesValues_count;
				  
				  vbo_vi_cacheKey.MESH_FACES_cacheKey= GL.createBuffer ();
				  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, vbo_vi_cacheKey.MESH_FACES_cacheKey);
				  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				  
				  bytes_readed = bytes_readed + 2*shortIndicesValues_count; // updating data.***
				  
			}
								  
	   }
};


f4d_ReaderWriter.prototype.readF4D_NeoBlocks = function(GL, arrayBuffer, blocksList, neoBuilding)
{
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
			var bbox = new f4d_boundingBox();
			bbox._minX = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			bbox._minY = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			bbox._minZ = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			  
			bbox._maxX = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			bbox._maxY = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			bbox._maxZ = new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed += 4;
			
			var maxLength = bbox.get_maxLength();
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

				startBuff = bytes_readed;
				endBuff = bytes_readed + 4*verticesFloatValues_count;

				var vbo_vi_cacheKey = block._vbo_VertexIdx_CacheKeys_Container.new_VBO_VertexIdxCacheKey();
				vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
				
				/*
				vbo_vi_cacheKey.MESH_VERTEX_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_VERTEX_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				  */
				bytes_readed = bytes_readed + 4*verticesFloatValues_count; // updating data.***
				 
				// 2) Normals.************************************************************************************************
				vertex_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				normalByteValues_count = vertex_count * 3;
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

f4d_ReaderWriter.prototype.readF4D_neoReferences = function(GL, neoRefsList, arrayBuffer, neoBuilding, f4dReadWriter)
{
	var startBuff = undefined;
	var endBuff = undefined;
	var bytes_readed = 0;
	var neoRefs_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	if(neoRefsList.name == "111" || neoRefsList.name == "112" || neoRefsList.name == "113" || neoRefsList.name == "114")
	{
		var hola = 0;
	}
	
	for(var i=0; i<neoRefs_count; i++)
	{
		var neoRef = neoRefsList.new_neoReference();
		
		

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
		neoRef._matrix4._floatArrays[0] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[1] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[2] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[3] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._matrix4._floatArrays[4] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[5] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[6] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[7] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._matrix4._floatArrays[8] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[9] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[10] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[11] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._matrix4._floatArrays[12] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._matrix4._floatArrays[13] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._matrix4._floatArrays[14] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._matrix4._floatArrays[15] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		
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
			
			neoRef.color4 = new f4d_color();
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

			neoRef.texture = new F4D_Texture();
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
	//bytes_readed = neoRefsList.exterior_ocCullOctree.parse_arrayBuffer(arrayBuffer, bytes_readed, f4dReadWriter);
	//bytes_readed = neoRefsList.interior_ocCullOctree.parse_arrayBuffer(arrayBuffer, bytes_readed, f4dReadWriter);
	
	
	
	// Occlusion culling octree data.*****
	var infiniteOcCullBox = neoRefsList.exterior_ocCullOctree;
	bytes_readed = this.readF4D_OcclusionCullingOctree_Cell(arrayBuffer, bytes_readed, infiniteOcCullBox);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.set_sizesSubBoxes();
	
	var ocCullBox = neoRefsList.interior_ocCullOctree; 
	bytes_readed = this.readF4D_OcclusionCullingOctree_Cell(arrayBuffer, bytes_readed, ocCullBox);
	ocCullBox.set_sizesSubBoxes();
	
	
	
};

f4d_ReaderWriter.prototype.readF4D_CompoundReferences_V4_0 = function(GL, arrayBuffer, compoundRefsList, BR_BuildingProject)
{
	var bytes_readed = 0;
	var compoundRefs_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	for(var i=0; i<compoundRefs_count; i++)
	{
		var compRef = compoundRefsList.newCompoundReference();
		var refs_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<refs_count; j++)
		{
			var reference = compRef.newReference();
			// 1) Id.***
			var ref_ID =  this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._id = ref_ID;
			
			// 2) Block's Idx.***
			var blockIdx =   this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._block_idx = blockIdx;
			
			// 3) Transform Matrix4.***
			//var scale_temp = 100.0; // Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			reference._matrix4._floatArrays[0] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[1] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[2] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[3] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			reference._matrix4._floatArrays[4] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[5] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[6] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[7] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			reference._matrix4._floatArrays[8] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[9] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[10] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[11] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			reference._matrix4._floatArrays[12] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Delete scale_temp!!!!!!!!!!!!!!!!
			reference._matrix4._floatArrays[13] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Delete scale_temp!!!!!!!!!!!!!!!!
			reference._matrix4._floatArrays[14] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Delete scale_temp!!!!!!!!!!!!!!!!
			reference._matrix4._floatArrays[15] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			
			
			// 4) ByteColors List.***
			this.byteColorsVBO_ArraysContainer._meshArrays.length = 0; // New mode.***
			
			// Test.****************************************************************************************
			var vbo_ByteColorsCacheKeys_Container = new VBO_ByteColorCacheKeys_Container(); // Test version (with use of workers).***
			var vbo_bc_cacheKey_idx = BR_BuildingProject._VBO_ByteColorsCacheKeysContainer_List.length;
			BR_BuildingProject._VBO_ByteColorsCacheKeysContainer_List.push(vbo_ByteColorsCacheKeys_Container);
			reference._VBO_ByteColorsCacheKeys_Container_idx = vbo_bc_cacheKey_idx; // Test version (with use of workers).***
			// End test.------------------------------------------------------------------------------------
			
			var byteColorsArrays_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var k=0; k<byteColorsArrays_count; k++)
			{
				var byteColorValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				
				// Now, make the VBO of the block readed.***
				// byte version.***
				startBuff = bytes_readed;
				endBuff = bytes_readed + byteColorValues_count;
				
				var vbo_bc_cacheKey = vbo_ByteColorsCacheKeys_Container.new_VBO_ByteColorsCacheKey(); // Original version (without workers).***

				vbo_bc_cacheKey.MESH_COLORS_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vbo_bc_cacheKey.MESH_COLORS_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Int8Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				
				bytes_readed = bytes_readed + byteColorValues_count; // update data.***
			}
		}
	}
	
	// Occlusion culling octree data.*****
	var ocCullBox = compoundRefsList._ocCulling._ocCulling_box; 
	bytes_readed = this.readF4D_OcclusionCullingOctree_Cell(arrayBuffer, bytes_readed, ocCullBox);
	ocCullBox.set_sizesSubBoxes();
	
	var infiniteOcCullBox = compoundRefsList._ocCulling._infinite_ocCulling_box;
	bytes_readed = this.readF4D_OcclusionCullingOctree_Cell(arrayBuffer, bytes_readed, infiniteOcCullBox);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.set_sizesSubBoxes();
			
};

f4d_ReaderWriter.prototype.readF4D_OcclusionCullingOctree_Cell = function(arrayBuffer, bytes_readed, ocCullingOctree_Cell)
{
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
		
		ocCullingOctree_Cell.set_dimensions(minX, maxX, minY, maxY, minZ, maxZ);
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
			var subOcclusionBox = ocCullingOctree_Cell.new_subBox();
			bytes_readed = this.readF4D_OcclusionCullingOctree_Cell(arrayBuffer, bytes_readed, subOcclusionBox);
		}
	}
	
	return bytes_readed;
};

f4d_ReaderWriter.prototype.readF4D_NeoSimpleBuilding = function(GL, arrayBuffer, neoSimpleBuilding)
{
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
	
	var vbo_vicky = neoSimpleBuilding.vbo_vicks_container.new_VBO_VertexIdxCacheKey();
	
	vbo_vicky.buffer = new F4D_Buffer();
	vbo_vicky.buffer.dataArray = new Uint8Array(arrayBuffer.slice(startBuff, endBuff));
	vbo_vicky.buffer.dataArray_byteLength = buffer_length;
	
	//vbo_vicky.pos_vboDataArray = new Uint8Array(arrayBuffer.slice(startBuff, endBuff));
	
	// Now, the 1extrude simpleBuilding.**********************************************************
	//var h=0;
};

f4d_ReaderWriter.prototype.readF4D_SimpleBuilding_V4_0 = function(GL, arrayBuffer, simpleBuilding)
{
	var bytes_readed = 0;
	var storeys_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	var scale = 1.0;
	var vertexTotalCount_temp = 0;
	
	for(var i=0; i<storeys_count; i++)
	{
		var storey = simpleBuilding.new_simpleStorey();
		var objects_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<objects_count; j++)
		{
			var simpleObject = storey.new_simpleObject();
			var vt_arrays_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var k=0; k<vt_arrays_count; k++)
			{
				var vt_array_cacheKey = simpleObject._vtCacheKeys_container.new_VertexTexcoordsArraysCacheKey();
				var vt_array = new f4d_VertexTexcoords_Arrays();
				
				// 1) Vertex arrays.**********************************
				var vertexFloatValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for(var a=0; a<vertexFloatValues_count; a++)
				{
					var vertexFloatValue = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
					vertexFloatValue *= scale;
					vt_array._vertices_array.push(vertexFloatValue);
				}
				
				var vertices_count = vertexFloatValues_count/3;
				vt_array_cacheKey._vertices_count = vertices_count;
				
				// Test.**********************
				//vertexTotalCount_temp += vertices_count;
				
				// 2) textcoords arrays.*******************************
				var texcoordByteValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for(var a=0; a<texcoordByteValues_count; a++)
				{
					var texcoordByteValue = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
					vt_array._texcoords_array.push(texcoordByteValue);
				}
				
				var texcoords_count = texcoordByteValues_count/2;
				
				// Test.********************
				if(vertices_count != texcoords_count)
				{
					vt_array_cacheKey._vertices_count = texcoords_count;
				}
				
				// Now, make VBO for this simpleObject.**************************************************
				
				vt_array_cacheKey._verticesArray_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vt_array_cacheKey._verticesArray_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vt_array._vertices_array), GL.STATIC_DRAW);
				
				vt_array_cacheKey._texcoordsArray_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vt_array_cacheKey._texcoordsArray_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Int8Array(vt_array._texcoords_array), GL.STATIC_DRAW);
				
			}	
		}
	}
	
	// Now, the 1extrude simpleBuilding.**********************************************************
	//var h=0;
};

f4d_ReaderWriter.prototype.readF4D_IndexFile = function(GL, arrayBuffer, BR_ProjectsList, f4d_readerWriter)
{
	var bytes_readed = 0;
	
	var f4d_headerPathName_length = 0;
	var f4d_simpleBuildingPathName_length = 0;
	var f4d_nailImagePathName_length = 0;
	
	var BP_Project = undefined;
	
	var buildings_count = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	for(var i=0; i<buildings_count; i++)
	{
		BP_Project = BR_ProjectsList.new_BR_Project();
		BP_Project._header._f4d_version = 2;
		// ********************************************************************************************************************************************
		// 1rst, read the files path names.************************************************************************************************************
		f4d_headerPathName_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<f4d_headerPathName_length; j++){
			BP_Project._f4d_rawPathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
		
		BP_Project._f4d_headerPathName = BP_Project._f4d_rawPathName + "_Header.hed";
		BP_Project._f4d_simpleBuildingPathName = BP_Project._f4d_rawPathName + "_Geom.f4d";
		BP_Project._f4d_nailImagePathName = BP_Project._f4d_rawPathName + "_Gaia.jpg";
	}
	/*
	// Old.***
	for(var i=0; i<buildings_count; i++)
	{
		BP_Project = BR_ProjectsList.new_BR_Project();
		BP_Project._header._f4d_version = 2;
		// ********************************************************************************************************************************************
		// 1rst, read the files path names.************************************************************************************************************
		f4d_headerPathName_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<f4d_headerPathName_length; j++){
			BP_Project._f4d_headerPathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
		
		f4d_simpleBuildingPathName_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<f4d_simpleBuildingPathName_length; j++){
			BP_Project._f4d_simpleBuildingPathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
		
		f4d_nailImagePathName_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<f4d_nailImagePathName_length; j++){
			BP_Project._f4d_nailImagePathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
	}
	*/
	
};

f4d_ReaderWriter.prototype.readF4D_IndexFile_SPEEDTEST = function(GL, arrayBuffer, BR_ProjectsList, f4d_readerWriter)
{
	
	var bytes_readed = 0;
	
	var f4d_headerPathName_length = 0;
	var f4d_simpleBuildingPathName_length = 0;
	var f4d_nailImagePathName_length = 0;
	var xdo_simpleBuildingPathName_length = 0;
	
	var BP_Project = undefined;
	
	var buildings_count = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var i=0; i<buildings_count; i++)
	{
		BP_Project = BR_ProjectsList.new_BR_Project();
		BP_Project._header._f4d_version = 2;
		// ********************************************************************************************************************************************
		// 1rst, read the files path names.************************************************************************************************************
		f4d_headerPathName_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<f4d_headerPathName_length; j++){
			BP_Project._f4d_headerPathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
		
		f4d_simpleBuildingPathName_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<f4d_simpleBuildingPathName_length; j++){
			BP_Project._f4d_simpleBuildingPathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
		
		f4d_nailImagePathName_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<f4d_nailImagePathName_length; j++){
			BP_Project._f4d_nailImagePathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
		
		xdo_simpleBuildingPathName_length = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<xdo_simpleBuildingPathName_length; j++){
			BP_Project._xdo_simpleBuildingPathName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
	}
	
};

f4d_ReaderWriter.prototype.readF4D_Blocks_inServer = function(GL, filePath_inServer, blocksList, BR_BuildingProject, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		  f4d_readerWriter.readF4D_Blocks_V4_0(GL, arrayBuffer, blocksList, BR_BuildingProject);
	  }
	  
	  arrayBuffer = null;
	};

	oReq.send(null);
};
	
	
f4d_ReaderWriter.prototype.readF4D_NeoBlocks_inServer = function(GL, filePath_inServer, blocksList, neoBuilding, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		 f4d_readerWriter.readF4D_NeoBlocks(GL, arrayBuffer, blocksList, neoBuilding);
	  }
	  
	  arrayBuffer = null;
	};

	oReq.send(null);
};
		
f4d_ReaderWriter.prototype.readF4D_CompoundReferences_inServer = function(GL, filePath_inServer, compRefList_Container, compoundReferenceList_name, 
																		  lodLevel, blocksList, transformMat, BR_BuildingProject, f4d_readerWriter, subOctreeNumberName)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  var octree = undefined;
		  if(subOctreeNumberName)
		  {
			  // we are reading interior comRefs.***
			  if(BR_BuildingProject.octree == undefined)
			  {
				  var hola = 0;
			  }
			  octree = BR_BuildingProject.octree.getOctree_byNumberName(subOctreeNumberName);
		  }
		  
		  var compRefList = new f4d_CompoundReferencesList();
		
			f4d_readerWriter.readF4D_CompoundReferences_V4_0(GL, arrayBuffer, compRefList, BR_BuildingProject); // New.***
		  
		  if(compRefList._compoundRefsArray.length > 0)
		  {
			  if(transformMat)
			  {
				  compRefList.multiplyReferencesMatrices(transformMat);
			  }
			  compRefList._name = compoundReferenceList_name;
			  compRefList._lodLevel = lodLevel;
			  //compRefList._myBlocksList = blocksList;// Original. Delete this if want use workers.***
			  if(octree)
			  {
				  octree._compRefsList_Array.push(compRefList);
			  }
			  else
			  {
				compRefList_Container._compRefsList_Array.push(compRefList);
			  }
		  }
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};		

f4d_ReaderWriter.prototype.readF4D_NeoReferences_inServer = function(GL, filePath_inServer, neoRefList_container, neoReferenceList_name, 
																		  lodLevel, blocksList, transformMat, neoBuilding, f4d_readerWriter, subOctreeNumberName)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  
		  var octree = undefined;
		  if(subOctreeNumberName)
		  {
			  // we are reading interior comRefs.***
			  if(neoBuilding.octree == undefined)
			  {
				  var hola = 0;
			  }
			  
			  octree = neoBuilding.octree.getOctree_byNumberName(subOctreeNumberName);
			  var neoRefsList = new F4D_NeoReferencesList();
			  neoRefsList.lod_level = lodLevel;
			  neoRefsList.blocksList = blocksList;
			  neoRefsList.name = neoReferenceList_name;
			  //neoRefsList.parse_arrayBuffer(GL, arrayBuffer, neoBuilding, f4d_readerWriter);
			  f4d_readerWriter.readF4D_neoReferences(GL, neoRefsList, arrayBuffer, neoBuilding, f4d_readerWriter);
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
			  
			  var neoRefsList = neoRefList_container.new_NeoRefsList(blocksList);
			  neoRefsList.lod_level = lodLevel;
			  neoRefsList.name = neoReferenceList_name;
			  neoRefsList.blocksList = blocksList;
			  //neoRefsList.parse_arrayBuffer(GL, arrayBuffer, neoBuilding, f4d_readerWriter);
			  f4d_readerWriter.readF4D_neoReferences(GL, neoRefsList, arrayBuffer, neoBuilding, f4d_readerWriter);
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

f4d_ReaderWriter.prototype.readF4D_neoSimpleBuilding_inServer = function(GL, filePath_inServer, neoSimpleBuilding, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_NeoSimpleBuilding(GL, arrayBuffer, neoSimpleBuilding );
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
	
};
		

f4d_ReaderWriter.prototype.readF4D_SimpleBuilding_inServer = function(GL, filePath_inServer, simpleBuilding, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_SimpleBuilding_V4_0(GL, arrayBuffer, simpleBuilding );
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
	
};

f4d_ReaderWriter.prototype.readF4D_IndexFile_inServer_SPEEDTEST = function(GL, filePath_inServer, BR_ProjectsList, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_IndexFile_SPEEDTEST(GL, arrayBuffer, BR_ProjectsList, f4d_readerWriter );
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
	
};	


f4d_ReaderWriter.prototype.readF4D_IndexFile_inServer = function(GL, filePath_inServer, BR_ProjectsList, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_IndexFile(GL, arrayBuffer, BR_ProjectsList, f4d_readerWriter );
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
	
};	

f4d_ReaderWriter.prototype.readF4D_TerranTileFile = function(GL, arrayBuffer, filePath_inServer, terranTile, f4d_readerWriter, bytes_readed)
{
	//var bytes_readed = 0;
	var f4d_headerPathName_length = 0;
	var BP_Project = undefined;
	var idxFile = undefined;
	var subTile = undefined;
	
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
	terranTile.make_tree(max_dpeth);
	
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
			
			BP_Project = terranTile.new_BR_Project();
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
			subTile = terranTile.new_subTerranTile();
			bytes_readed = this.readF4D_TerranTileFile(GL, arrayBuffer, filePath_inServer, subTile, f4d_readerWriter, bytes_readed);
		}
	}
	*/
	return bytes_readed;
};

f4d_ReaderWriter.prototype.readF4D_TerranTileFile_inServer = function(GL, filePath_inServer, terranTile, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
		var arrayBuffer = oReq.response; // Note: not oReq.responseText
		if (arrayBuffer)
		{
			if(f4d_readerWriter == undefined)
			{
				f4d_readerWriter = new f4d_ReaderWriter();
			}
			//------------------------------------------------------
			var bytes_readed = 0;
			f4d_readerWriter.readF4D_TerranTileFile(GL, arrayBuffer, filePath_inServer, terranTile, f4d_readerWriter, bytes_readed)
			
			// Once readed the terranTilesFile, must make all the quadtree.***
			terranTile.set_dimensionsSubTiles();
			terranTile.calculate_position_byLonLat_subTiles();
			terranTile.terranIndexFile_readed = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
	
};

f4d_ReaderWriter.prototype.readF4D_pCloudIndexFile_inServer = function(GL, filePath_inServer, BR_ProjectsList, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	    var arrayBuffer = oReq.response; // Note: not oReq.responseText
	    if (arrayBuffer)
	   {
		    if(f4d_readerWriter == undefined)
		    {
		    	f4d_readerWriter = new f4d_ReaderWriter();
		    }
		    //---------------------------------------------------------------------------------------------------
		    // write code here.***
		    var pCloudProject = undefined;
		  
		  
		    var bytes_readed = 0;
	
			var f4d_rawPathName_length = 0;
			var f4d_simpleBuildingPathName_length = 0;
			var f4d_nailImagePathName_length = 0;
			
			var pCloudProjects_count = f4d_readerWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			for(var i=0; i<pCloudProjects_count; i++)
			{
				pCloudProject = new f4d_pCloudMesh();
				BR_ProjectsList._pCloudMesh_array.push(pCloudProject);
				pCloudProject._header._f4d_version = 2;
				// ********************************************************************************************************************************************
				// 1rst, read the files path names.************************************************************************************************************
				f4d_rawPathName_length = f4d_readerWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
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

f4d_ReaderWriter.prototype.readF4D_Header_Original = function(GL, arrayBuffer, BR_Project)
{
	var bytes_readed = 0;
	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch = undefined;
	var header = BR_Project._header;
	
	// 0) Version. char 5.*************************************************
	for(var j=0; j<version_string_length; j++){
		header._version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 1) Project. char 10.****************************************************
	for(var j=0; j<10; j++){
		auxScratch = String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 2) Building object type.*********************************************
	header._type = (new Int32Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 4)))[0];bytes_readed += 4;
	
	// 3) DB_idx_1rst_number + Building GUID (4byte + 22 char).**********************
	auxScratch = (new Int32Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 4)))[0];bytes_readed += 4;
	for(var j=0; j<22; j++){
		auxScratch = String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 4) Original IFC File name.******************************************************
	intAux_scratch = (new Int32Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 4)))[0];bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		auxScratch = String.fromCharCode(new Int16Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 5) Exterior LODs count. byte.***************************************************
	intAux_scratch = (new Uint8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)))[0];bytes_readed += 1;
	
	// 5.1) Interior LODs count. byte.************************************************
	intAux_scratch = (new Uint8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)))[0];bytes_readed += 1;
	
	// 6) Location, Orientation and Scale.***
	// (Lat, Long, Alt).***
	auxScratch = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0];bytes_readed += 8;
	auxScratch = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0];bytes_readed += 8;
	auxScratch = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0];bytes_readed += 8;
	
	// (Yaw, Pitch, Roll).***
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	
	// Scale (sx, sy, sz).***
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	
	// 9) Bounding box.************************************************************************
	header._boundingBox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	header._boundingBox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	header._boundingBox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	
	header._boundingBox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	header._boundingBox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	header._boundingBox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	  
	// 10) Octree Levels Count. byte.************************************************************
	intAux_scratch = new Uint8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1));bytes_readed += 1;
	
	// 11) Octree Mother Box.*****************************************************************
	header._octZerothBox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._octZerothBox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._octZerothBox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._octZerothBox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._octZerothBox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._octZerothBox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	
	// **************************************************************************************************************************
	// After readed the header, make the octree.*********************************************************************************
	// octrees must have absolute positions for fast frustum culling process.***
	/*
	var posMat = new f4d_Matrix4();
	posMat.setByFloat32Array(BR_Project.move_matrix);
	var minPoint3d = new f4d_point3d();
	var maxPoint3d = new f4d_point3d();
	var transformed_minPoint3d = new f4d_point3d();
	var transformed_maxPoint3d = new f4d_point3d();
	
	maxPoint3d.set(header._octZerothBox._maxX, header._octZerothBox._maxY, header._octZerothBox._maxZ);
	minPoint3d.set(header._octZerothBox._minX, header._octZerothBox._minY, header._octZerothBox._minZ);
	
	transformed_minPoint3d = posMat.transformPoint3D(minPoint3d, transformed_minPoint3d);
	transformed_maxPoint3d = posMat.transformPoint3D(maxPoint3d, transformed_maxPoint3d);
	
	transformed_minPoint3d.add(BR_Project._buildingPosition.x, BR_Project._buildingPosition.y, BR_Project._buildingPosition.z);
	transformed_maxPoint3d.add(BR_Project._buildingPosition.x, BR_Project._buildingPosition.y, BR_Project._buildingPosition.z);
	
	BR_Project.octree.setBoxSize(transformed_minPoint3d.x, transformed_maxPoint3d.x,  
										transformed_minPoint3d.y, transformed_maxPoint3d.y,  
										transformed_minPoint3d.z, transformed_maxPoint3d.z);
										*/
			
		
		
	
	BR_Project.octree.setBoxSize(header._octZerothBox._minX, header._octZerothBox._maxX,  
								header._octZerothBox._minY, header._octZerothBox._maxY,  
								header._octZerothBox._minZ, header._octZerothBox._maxZ);
										
	BR_Project.octree.makeTree(3);
	BR_Project.octree.setSizesSubBoxes();
	
};

f4d_ReaderWriter.prototype.readF4D_Header = function(GL, arrayBuffer, BR_Project)
{
	var bytes_readed = 0;
	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch = undefined;
	var header = BR_Project._header;
	
	
	
	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		header._version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 2) Type (1 byte).**************
	header._type = String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	
	// 3) Global unique ID.*********************
	intAux_scratch = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		header._global_unique_id += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 4) Location.*************************
	header._latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	header._longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	header._elevation = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	
	header._elevation += 70.0; // delete this. TEST.!!!
	
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
	intAux_scratch = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		header._dataFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 9) nailImage_size.***
	//header._nailImageSize = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	// Now, must calculate some params of the project.**********************************************
	// 0) PositionMatrix.************************************************************************
	//var height = elevation;
	
	var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation); 
	BR_Project._buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	BR_Project._buildingPositionHIGH = new Float32Array(3);
	BR_Project._buildingPositionHIGH[0] = splitVelue_X.high;
	BR_Project._buildingPositionHIGH[1] = splitVelue_Y.high;
	BR_Project._buildingPositionHIGH[2] = splitVelue_Z.high;
	
	BR_Project._buildingPositionLOW = new Float32Array(3);
	BR_Project._buildingPositionLOW[0] = splitVelue_X.low;
	BR_Project._buildingPositionLOW[1] = splitVelue_Y.low;
	BR_Project._buildingPositionLOW[2] = splitVelue_Z.low;
	
	// End.-----------------------------------------------------------------------------------
	
	/*
	Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, BR_Project.move_matrix);
	BR_Project.move_matrix[12] = 0;
	BR_Project.move_matrix[13] = 0;
	BR_Project.move_matrix[14] = 0;
	BR_Project._buildingPosition = position;
	
	Cesium.Matrix4.inverse(BR_Project.move_matrix, BR_Project.move_matrix_inv);
	*/
	
};

f4d_ReaderWriter.prototype.readF4D_Header_inServer = function(GL, filePath_inServer, BR_Project, f4d_readerWriter, f4d_manager)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	BR_Project._f4d_header_readed = true;
	
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_Header(GL, arrayBuffer, BR_Project );
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  BR_Project._f4d_header_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};

f4d_ReaderWriter.prototype.readF4D_pCloudHeader_inServer = function(GL, filePath_inServer, pCloud, f4d_readerWriter, f4d_manager)
{
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
		    if(f4d_readerWriter == undefined)
		    {
			    f4d_readerWriter = new f4d_ReaderWriter();
		    }
		    //--------------------------------------------------------------
		    // write code here.***
		  
		    var bytes_readed = 0;
			var version_string_length = 5;
			var intAux_scratch = 0;
			var auxScratch = undefined;
			var header = pCloud._header;
			
			
			
			// 1) Version(5 chars).***********
			for(var j=0; j<version_string_length; j++){
				header._version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}
			
			// 2) Type (1 byte).**************
			header._type = String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			
			// 3) Global unique ID.*********************
			intAux_scratch = f4d_readerWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
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
			intAux_scratch = f4d_readerWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
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
			
			//////////////////////////////////////////////////////////////////////////////////////////////////
	
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  pCloud._f4d_header_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};	

f4d_ReaderWriter.prototype.readF4D_HeaderOriginal_inServer = function(GL, filePath_inServer, BR_Project, f4d_readerWriter, f4d_manager)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	BR_Project._f4d_header_readed = true;
	
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_Header_Original(GL, arrayBuffer, BR_Project );
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  BR_Project._f4d_header_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};	

f4d_ReaderWriter.prototype.readF4D_NeoHeader_inServer = function(GL, filePath_inServer, neoBuilding, f4d_readerWriter, f4d_manager)
{
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
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  neoBuilding.metaData.parseFile_header(arrayBuffer, f4d_readerWriter);
		  
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

f4d_ReaderWriter.prototype.readF4D_NailImage_ofArrayBuffer = function(GL, imageArrayBuffer, BR_Project, f4d_readerWriter, f4d_manager, imageLod)
{

	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	//--------------------------------------------------------------------------
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

f4d_ReaderWriter.prototype.readF4D_NailImage_inServer = function(GL, filePath_inServer, BR_Project, f4d_readerWriter, f4d_manager, imageLod)
{
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
		BR_Project._simpleBuilding_v1 = new f4d_simpleBuilding_v1();
	
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

f4d_ReaderWriter.prototype.readF4D_Texture_inServer = function(GL, filePath_inServer, f4dTex, f4d_manager)
{
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

f4d_ReaderWriter.prototype.readF4D_neoReferenceTexture_inServer = function(GL, filePath_inServer, texture, neoBuilding, f4d_manager)
{
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
		
		//TEST.****
		/*
			// 1pixel texture, wait for texture to load.********************************************
			//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
			if(texture.tex_id == undefined)
				texture.tex_id = GL.createTexture();
			
			GL.bindTexture(GL.TEXTURE_2D, texture.tex_id);
			GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([220, 220, 220, 255])); // red
			GL.bindTexture(GL.TEXTURE_2D, null);
			
			neoBuilding.textures_loaded.push(texture);
			*/
		
		if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		
	};
	
	neoRefImage.onerror = function() {
		// doesn't exist or error loading

		return;
    };
	
		neoRefImage.src = filePath_inServer;
};

f4d_ReaderWriter.prototype.openF4d_TerranTile = function(GL, terranTile, f4d_readerWriter )
{
	var filePath_inServer = "/F4D_GeometryData/Result_xdo2f4d/f4dTerranTileFile.txt";
	f4d_readerWriter.readF4D_TerranTileFile_inServer(GL, filePath_inServer, terranTile, f4d_readerWriter);

};	

f4d_ReaderWriter.prototype.openF4dProjects_TestFromXDO = function(GL, BR_ProjectsList, f4d_readerWriter )
{
	var filePath_inServer = "/F4D_GeometryData/Result_xdo2f4d/f4dIndexFile.txt";
	//f4d_readerWriter.readF4D_IndexFile_inServer(GL, filePath_inServer, BR_ProjectsList, f4d_readerWriter);
	
	filePath_inServer = "/F4D_GeometryData/Result_xdo2f4d/f4dIndexFile_2.txt";
	f4d_readerWriter.readF4D_IndexFile_inServer(GL, filePath_inServer, BR_ProjectsList, f4d_readerWriter);
};	

f4d_ReaderWriter.prototype.openF4dProjects_TestFromCOLLADA = function(GL, BR_ProjectsList, f4d_readerWriter )
{
	var filePath_inServer = "/F4D_GeometryData/Result_collada2f4d/pCloud_IndexFile.txt";
	f4d_readerWriter.readF4D_pCloudIndexFile_inServer(GL, filePath_inServer, BR_ProjectsList, f4d_readerWriter);
	
};

f4d_ReaderWriter.prototype.openF4dandXDOProjects_forSPEEDTEST = function(GL, BR_ProjectsList, f4d_readerWriter )
{
	var filePath_inServer = "/F4D_GeometryData/Result_xdo2f4d/f4dIndexFile.txt";
	f4d_readerWriter.readF4D_IndexFile_inServer_SPEEDTEST(GL, filePath_inServer, BR_ProjectsList, f4d_readerWriter);
};


f4d_ReaderWriter.prototype.readF4D_SimpleBuilding_A1 = function(GL, arrayBuffer, BR_Project)
{
	var bytes_readed = 0;
	var startBuff = undefined;
	var endBuff = undefined;
	
	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new f4d_simpleBuilding_v1();
	
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	var vbo_objects_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Almost allways is 1.***
	
	// single interleaved buffer mode.*********************************************************************************
	for(var i=0; i<vbo_objects_count; i++) // Almost allways is 1.***
	{
		var simpObj = simpBuildingV1.new_simpleObject();
		var vt_cacheKey = simpObj._vtCacheKeys_container.new_VertexTexcoordsArraysCacheKey();
		
		var iDatas_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		startBuff = bytes_readed;
		endBuff = bytes_readed + (4*3+2*2)*iDatas_count;
		
		vt_cacheKey._verticesArray_cacheKey = GL.createBuffer ();
		GL.bindBuffer(GL.ARRAY_BUFFER, vt_cacheKey._verticesArray_cacheKey);
		GL.bufferData(GL.ARRAY_BUFFER, arrayBuffer.slice(startBuff, endBuff), GL.STATIC_DRAW);
		
		bytes_readed = bytes_readed + (4*3+2*2)*iDatas_count; // updating data.***
		
		vt_cacheKey._vertices_count = iDatas_count;
		
		// Now, read the normal array.***
		var byteNormalValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		startBuff = bytes_readed;
		endBuff = bytes_readed + (1)*byteNormalValues_count;
		vt_cacheKey._normalsArray_cacheKey = GL.createBuffer ();
		GL.bindBuffer(GL.ARRAY_BUFFER, vt_cacheKey._normalsArray_cacheKey);
		GL.bufferData(GL.ARRAY_BUFFER, arrayBuffer.slice(startBuff, endBuff), GL.STATIC_DRAW);
		
		bytes_readed = bytes_readed + (1)*byteNormalValues_count; // updating data.***
	}
	
	// Finally read the 4byte color.***
	var color_4byte_temp = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	
	// Simple building texture(create 1pixel X 1pixel bitmap).****************************************************
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
	simpBuildingV1._simpleBuildingTexture = GL.createTexture();
	
	// Test wait for texture to load.********************************************
	//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
	GL.bindTexture(GL.TEXTURE_2D, simpBuildingV1._simpleBuildingTexture);
	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
	GL.bindTexture(GL.TEXTURE_2D, null);

	
};

f4d_ReaderWriter.prototype.readXDO_SimpleBuilding_A1 = function(GL, arrayBuffer, BR_Project)
{
	var bytes_readed = 0;
	var startBuff = undefined;
	var endBuff = undefined;
	
	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new f4d_simpleBuilding_v1();
	
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	

	this.temp_var_to_waste = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1; // type.***
	this.temp_var_to_waste = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // objID.***
	this.countSC = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1; // Key length.***
	for(var i=0; i<this.countSC; i++)
	{
		this.temp_var_to_waste = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1; // Key.***
	}
	
	// absolute cartesian bounding box.***
	this.bboxSC._minX = new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed += 8;
	this.bboxSC._minY = new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed += 8;
	this.bboxSC._minZ = new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed += 8;
	this.bboxSC._maxX = new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed += 8;
	this.bboxSC._maxY = new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed += 8;
	this.bboxSC._maxZ = new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed += 8;
	
	this.temp_var_to_waste = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Altitude.***
	this.temp_var_to_waste = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1; // Faces count (only in 3002 version).***
	
	// Read the geometry data for speed test.***
	if(simpBuildingV1._vnt_cacheKeys == undefined)
		simpBuildingV1._vnt_cacheKeys = new f4d_VNT_Interleaved_cacheKeys(); // For SPEEDTEST.***
	
	// Multi buffer mode.***
	
	
	// Single buffer mode.***
	simpBuildingV1._vnt_cacheKeys._vertices_count = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Vertex count (VNT) interleaved.***
	startBuff = bytes_readed;
	endBuff = bytes_readed + (4*3 + 4*3 + 4*2)*simpBuildingV1._vnt_cacheKeys._vertices_count;
	
	simpBuildingV1._vnt_cacheKeys.VNT_cacheKey = GL.createBuffer ();
	GL.bindBuffer(GL.ARRAY_BUFFER, simpBuildingV1._vnt_cacheKeys.VNT_cacheKey);
	GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
	
	bytes_readed = bytes_readed + (4*3 + 4*3 + 4*2)*simpBuildingV1._vnt_cacheKeys._vertices_count; // updating data.***
	
	// Now, the indices, to drawElemets.***
	simpBuildingV1._vnt_cacheKeys._indices_count = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Indices count (VNT) interleaved.***
	startBuff = bytes_readed;
	endBuff = bytes_readed + (2)*simpBuildingV1._vnt_cacheKeys._indices_count;
	
	simpBuildingV1._vnt_cacheKeys.indices_cacheKey = GL.createBuffer ();
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, simpBuildingV1._vnt_cacheKeys.indices_cacheKey);
	GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
	
	bytes_readed = bytes_readed + (2)*simpBuildingV1._vnt_cacheKeys._indices_count; // updating data.***
	
	// There are color, and others attributes, but No necessary read more for a speed test.***
	
};


f4d_ReaderWriter.prototype.readF4D_SimpleBuinding_A1_inServer = function(GL, filePath_inServer, BR_Project, f4d_readerWriter, f4d_manager)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	BR_Project._f4d_simpleBuilding_readed = true;
	var oReq = new XMLHttpRequest();

	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_SimpleBuilding_A1(GL, arrayBuffer, BR_Project );
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  BR_Project._f4d_simpleBuilding_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};

f4d_ReaderWriter.prototype.readF4D_TileArrayBuffer_inServer = function(GL, filePath_inServer, terranTile, f4d_readerWriter, f4d_manager)
{
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
			//var BR_Project = new f4d_BR_buildingProject(); // Test.***
			//f4d_readerWriter.readF4D_Header(GL, arrayBuffer, BR_Project ); // Test.***
			terranTile.fileArrayBuffer = arrayBuffer;
			terranTile.fileReading_finished = true;
			
			if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  arrayBuffer = null;
		}
		
	};

	oReq.send(null);
};

f4d_ReaderWriter.prototype.readF4D_pCloudGeometry_inServer = function(GL, filePath_inServer, pCloud, f4d_readerWriter, f4d_manager)
{
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
		    if(f4d_readerWriter == undefined)
		    {
			    f4d_readerWriter = new f4d_ReaderWriter();
		    }
		    //------------------------------------------------------
		    // write code here.***
		    var bytes_readed = 0;
			var startBuff = undefined;
			var endBuff = undefined;
			
			var meshes_count = f4d_readerWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Almost allways is 1.***
			for(var a=0; a<meshes_count; a++)
			{
				var vbo_objects_count = f4d_readerWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Almost allways is 1.***
				
				// single interleaved buffer mode.*********************************************************************************
				for(var i=0; i<vbo_objects_count; i++) 
				{
					var vbo_vertexIdx_data = pCloud.vbo_datas.new_VBO_VertexIdxCacheKey();
					//var vt_cacheKey = simpObj._vtCacheKeys_container.new_VertexTexcoordsArraysCacheKey();
					
					var iDatas_count = f4d_readerWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // iDatasCount = vertex_count.***
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
					var shortIndices_count = f4d_readerWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
					
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

f4d_ReaderWriter.prototype.readXDO_SimpleBuinding_A1_inServer = function(GL, filePath_inServer, BR_Project, f4d_readerWriter, f4d_manager)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	BR_Project._xdo_simpleBuilding_readed = true;
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readXDO_SimpleBuilding_A1(GL, arrayBuffer, BR_Project );
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  BR_Project._xdo_simpleBuilding_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};


f4d_ReaderWriter.prototype.openNeoBuilding = function(GL, buildingFileName, latitude, longitude, height, f4d_readerWriter, NeoBuildingsList, f4d_manager)
{
	// This is a test function to read the new f4d format.***
	// The location(latitude, longitude, height) is provisional.***
	
	// Read the header.***
	var neoBuilding_header_path = "/F4D_GeometryData/"+buildingFileName+"/Header.hed";
	
	var neoBuilding = NeoBuildingsList.new_neoBuilding();
	
	neoBuilding.buildingFileName = buildingFileName;
	
	if(neoBuilding.octree == undefined)
		neoBuilding.octree = new f4d_octree(undefined);
	
	f4d_readerWriter.readF4D_NeoHeader_inServer(GL, neoBuilding_header_path, neoBuilding, f4d_readerWriter, f4d_manager); // Here makes the tree of octree.***
	
	
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
	
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.move_matrix_inv);
	
	// 1) Blocks.*******************************************************************************************************************************
	var blocksListContainer = neoBuilding._blocksList_Container;
	var filePath_inServer = "";
	
	
	filePath_inServer = "/F4D_GeometryData/"+buildingFileName+"/Blocks1";
	var blocksList = blocksListContainer.get_BlockList("Blocks1");
	f4d_readerWriter.readF4D_NeoBlocks_inServer(GL, filePath_inServer, blocksList, neoBuilding, f4d_readerWriter);
	
	var filePath_inServer_2 = "/F4D_GeometryData/"+buildingFileName+"/Blocks2";
	var blocksList_2 = blocksListContainer.get_BlockList("Blocks2");
	f4d_readerWriter.readF4D_NeoBlocks_inServer(GL, filePath_inServer_2, blocksList_2, neoBuilding, f4d_readerWriter);
	
	var filePath_inServer_3 = "/F4D_GeometryData/"+buildingFileName+"/Blocks3";
	var blocksList_3 = blocksListContainer.get_BlockList("Blocks3");
	f4d_readerWriter.readF4D_NeoBlocks_inServer(GL, filePath_inServer_3, blocksList_3, neoBuilding, f4d_readerWriter);
	
	var filePath_inServer_bone = "/F4D_GeometryData/"+buildingFileName+"/BlocksBone";
	var blocksList_bone = blocksListContainer.get_BlockList("BlocksBone");
	f4d_readerWriter.readF4D_NeoBlocks_inServer(GL, filePath_inServer_bone, blocksList_bone, neoBuilding, f4d_readerWriter);
	
	var filePath_inServer_4 = "/F4D_GeometryData/"+buildingFileName+"/Blocks4"; // Interior Objects.***
	var blocksList_4 = blocksListContainer.get_BlockList("Blocks4");
	f4d_readerWriter.readF4D_NeoBlocks_inServer(GL, filePath_inServer_4, blocksList_4, neoBuilding, f4d_readerWriter);
	
	// 2) References.****************************************************************************************************************************
	var moveMatrix = new f4d_Matrix4();
	moveMatrix.setByFloat32Array(neoBuilding.move_matrix);
	var lod_level = 0;
	
	var neoRefList_container = neoBuilding._neoRefLists_Container;
	
	lod_level = 0;
	filePath_inServer = "/F4D_GeometryData/"+buildingFileName+"/Ref_Skin1";
	f4d_readerWriter.readF4D_NeoReferences_inServer(GL, filePath_inServer, neoRefList_container, "Ref_Skin1", lod_level, blocksList, moveMatrix, neoBuilding, f4d_readerWriter);
	
	lod_level = 1;
	filePath_inServer = "/F4D_GeometryData/"+buildingFileName+"/Ref_Skin2";
	f4d_readerWriter.readF4D_NeoReferences_inServer(GL, filePath_inServer, neoRefList_container, "Ref_Skin2", lod_level, blocksList_2, moveMatrix, neoBuilding, f4d_readerWriter);
	
	lod_level = 2;
	filePath_inServer = "/F4D_GeometryData/"+buildingFileName+"/Ref_Skin3";
	f4d_readerWriter.readF4D_NeoReferences_inServer(GL, filePath_inServer, neoRefList_container, "Ref_Skin3", lod_level, blocksList_3, moveMatrix, neoBuilding, f4d_readerWriter);
	
	lod_level = 0;
	filePath_inServer = "/F4D_GeometryData/"+buildingFileName+"/Ref_Bone";
	f4d_readerWriter.readF4D_NeoReferences_inServer(GL, filePath_inServer, neoRefList_container, "Ref_Bone", lod_level, blocksList_bone, moveMatrix, neoBuilding, f4d_readerWriter);
	
	
	// Now, read the interior objects in octree format.**********************************************************************************************
	var interiorCRef_folderPath = "/F4D_GeometryData/"+buildingFileName+"/inLOD4";
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
				//f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, intCompRef_filePath, null, interiorCRef_fileName, 4, blocksList_4, moveMatrix, BR_buildingProject, f4d_readerWriter, subOctreeName_counter);
				f4d_readerWriter.readF4D_NeoReferences_inServer(GL, intCompRef_filePath, null, interiorCRef_fileName, lod_level, blocksList_4, moveMatrix, neoBuilding, f4d_readerWriter, subOctreeName_counter);
			}
		}
	}
	
	
	// Now, read the simple building.************************
	
	neoBuilding.neoSimpleBuilding = new F4D_NeoSimpleBuilding();
	filePath_inServer = "/F4D_GeometryData/"+buildingFileName+"/SimpleBuilding";
	f4d_readerWriter.readF4D_neoSimpleBuilding_inServer(GL, filePath_inServer, neoBuilding.neoSimpleBuilding, f4d_readerWriter);
	
	
};
		
f4d_ReaderWriter.prototype.openBuildingProject = function(GL, projectNumber, latitude, longitude, height, f4d_readerWriter, BR_ProjectsList, f4d_manager)
{
	this.filesReadings_count +=1;
	//The problem is that all files are read at the same time and when the files have a total size (sum) that is very large the browser crashes.
	//I want to read one file after another, so that the memory consumption is reduced.
	// http://stackoverflow.com/questions/13975031/reading-multiple-files-with-javascript-filereader-api-one-at-a-time
	//----------------------------------------------------------------------------------------------------------------------
	//----------------------------------------------------------------------------------------------------------------------
  //var files = evt.target.files; // FileList object // Old.***
	// Open f4d.***
  // New mode: read files in local server.*********************************************
	// Create a new buildingProject.**************************************************************
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	
	//alert('cp1');
	
	function handleTextureLoaded(gl, image, texture) 
	{
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
		//var gl = viewer.scene.context._gl;
	  gl.bindTexture(gl.TEXTURE_2D, texture);
	  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	  gl.generateMipmap(gl.TEXTURE_2D);
	  gl.bindTexture(gl.TEXTURE_2D, null);
	}
		
	
	var BR_buildingProject = BR_ProjectsList.new_BR_Project(); // NEW F4D PROJECT. *** NEW F4D PROJECT. *** NEW F4D PROJECT. *** NEW F4D PROJECT. ***
	var blocksListContainer = BR_buildingProject._blocksList_Container;
	
	var project_number = projectNumber; // House with car and mini park to children.***
	
	
	var projectNumStr = project_number.toString();
	
	
	//    	  Entity.prototype._getModelMatrix = function(time, result) {
	//    	        var position = Property.getValueOrUndefined(this._position, time, positionScratch);
	//    	        if (!defined(position)) {
	//    	            return undefined;
	//    	        }
	//    	        var orientation = Property.getValueOrUndefined(this._orientation, time, orientationScratch);
	//    	        if (!defined(orientation)) {
	//    	            result = Transforms.eastNorthUpToFixedFrame(position, undefined, result);
	//    	        } else {
	//    	            result = Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, result);
	//    	        }
	//    	        return result;
	//    	    };
	
	// 0) PositionMatrix.************************************************************************
	//var height = elevation;
	var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height); // Old.***
	//var position = absolutePosition;
	BR_buildingProject._buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	BR_buildingProject._buildingPositionHIGH = new Float32Array(3);
	BR_buildingProject._buildingPositionHIGH[0] = splitVelue_X.high;
	BR_buildingProject._buildingPositionHIGH[1] = splitVelue_Y.high;
	BR_buildingProject._buildingPositionHIGH[2] = splitVelue_Z.high;
	
	BR_buildingProject._buildingPositionLOW = new Float32Array(3);
	BR_buildingProject._buildingPositionLOW[0] = splitVelue_X.low;
	BR_buildingProject._buildingPositionLOW[1] = splitVelue_Y.low;
	BR_buildingProject._buildingPositionLOW[2] = splitVelue_Z.low;
	// End.-----------------------------------------------------------------------------------
	
	// Determine the elevation of the position.***********************************************************
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	
	Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, BR_buildingProject.move_matrix);
	BR_buildingProject.move_matrix[12] = 0;
	BR_buildingProject.move_matrix[13] = 0;
	BR_buildingProject.move_matrix[14] = 0;
	BR_buildingProject._buildingPosition = position;
	
	Cesium.Matrix4.inverse(BR_buildingProject.move_matrix, BR_buildingProject.move_matrix_inv);
	
	//*********************************************************
	 if(f4d_readerWriter == undefined)
	  {
		  f4d_readerWriter = new f4d_ReaderWriter();
	  }
	  //------------------------------------------------------
	  
	// 0) Header, the original version.*********************************************************************************************************
	var filePath_header_inServer = "/F4D_GeometryData/"+projectNumStr+"/Header";
	f4d_readerWriter.readF4D_HeaderOriginal_inServer(GL, filePath_header_inServer, BR_buildingProject, f4d_readerWriter, f4d_manager);
	
	if(BR_buildingProject.octree == undefined)
		BR_buildingProject.octree = new f4d_octree(undefined);
	
	
	
	// 1) Blocks.*******************************************************************************************************************************
	var filePath_inServer = "/F4D_GeometryData/"+projectNumStr+"/Blocks1";
	var blocksList = blocksListContainer.get_BlockList("Blocks1");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer, blocksList, BR_buildingProject, f4d_readerWriter);
	
	var filePath_inServer_2 = "/F4D_GeometryData/"+projectNumStr+"/Blocks2";
	var blocksList_2 = blocksListContainer.get_BlockList("Blocks2");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer_2, blocksList_2, BR_buildingProject, f4d_readerWriter);
	
	var filePath_inServer_3 = "/F4D_GeometryData/"+projectNumStr+"/Blocks3";
	var blocksList_3 = blocksListContainer.get_BlockList("Blocks3");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer_3, blocksList_3, BR_buildingProject, f4d_readerWriter);
	
	var filePath_inServer_bone = "/F4D_GeometryData/"+projectNumStr+"/BlocksBone";
	var blocksList_bone = blocksListContainer.get_BlockList("BlocksBone");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer_bone, blocksList_bone, BR_buildingProject, f4d_readerWriter);
	
	var filePath_inServer_4 = "/F4D_GeometryData/"+projectNumStr+"/Blocks4"; // Interior Objects.***
	var blocksList_4 = blocksListContainer.get_BlockList("Blocks4");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer_4, blocksList_4, BR_buildingProject, f4d_readerWriter);

	// 2) CompReferences.****************************************************************************************************************************
	
	var moveMatrix = new f4d_Matrix4();
	moveMatrix.setByFloat32Array(BR_buildingProject.move_matrix);
	
	var compRefList_container = BR_buildingProject._compRefList_Container;
	
	filePath_inServer = "/F4D_GeometryData/"+projectNumStr+"/Ref_Skin1";
	f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, filePath_inServer, compRefList_container, "Ref_Skin1", 0, blocksList, moveMatrix, BR_buildingProject, f4d_readerWriter);
	
	filePath_inServer_2 = "/F4D_GeometryData/"+projectNumStr+"/Ref_Skin2";
	f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, filePath_inServer_2, compRefList_container, "Ref_Skin2", 1, blocksList_2, moveMatrix, BR_buildingProject, f4d_readerWriter);
	
	filePath_inServer_3 = "/F4D_GeometryData/"+projectNumStr+"/Ref_Skin3";
	f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, filePath_inServer_3, compRefList_container, "Ref_Skin3", 2, blocksList_3, moveMatrix, BR_buildingProject, f4d_readerWriter);
	
	filePath_inServer_bone = "/F4D_GeometryData/"+projectNumStr+"/Ref_Bone";
	f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, filePath_inServer_bone, compRefList_container, "Ref_Bone", 3, blocksList_bone, moveMatrix, BR_buildingProject, f4d_readerWriter);
	
	// Now, read the interior objects in octree format.**********************************************************************************************
	var interiorCompRefList_Container = BR_buildingProject._interiorCompRefList_Container;
	var interiorCRef_folderPath = "/F4D_GeometryData/"+projectNumStr+"/inLOD4";
	//var interiorCRef_files = _getAllFilesFromFolder(interiorCRef_folderPath);
	var interior_base_name = "Ref_NodeData";
	var subOctreeName_counter = -1;
	for(var i=1; i<9; i++)
	{
		for(var j=1; j<9; j++)
		{
			for(var k=1; k<9; k++)
			{
				subOctreeName_counter = i*100 + j*10 + k;
				var interiorCRef_fileName = interior_base_name + subOctreeName_counter.toString();

				// Create a "compoundRefList".************************************************
				var intCompRef_filePath = interiorCRef_folderPath + "/" + interiorCRef_fileName;
				f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, intCompRef_filePath, interiorCompRefList_Container, interiorCRef_fileName, 4, blocksList_4, moveMatrix, BR_buildingProject, f4d_readerWriter, subOctreeName_counter);
				
			}
		}
	}
	
	// Now, the SimpleBuilding.**************************************************************************************************************************
	var filePath_inServer_SimpleBuilding = "/F4D_GeometryData/"+projectNumStr+"/SimpleBuilding";
	var simpleBuilding = BR_buildingProject._simpleBuilding;
	f4d_readerWriter.readF4D_SimpleBuilding_inServer(GL, filePath_inServer_SimpleBuilding, simpleBuilding, f4d_readerWriter);
	//readF4D_SimpleBuilding_inServer(filePath_inServer_SimpleBuilding, simpleBuilding);
	
	// Simple building texture.**************************************************************************************************************************
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
	simpleBuilding._simpleBuildingTexture = GL.createTexture();
	
	// Test wait for texture to load.********************************************
	//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
	GL.bindTexture(GL.TEXTURE_2D, simpleBuilding._simpleBuildingTexture);
	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
	GL.bindTexture(GL.TEXTURE_2D, null);
	// End test.-----------------------------------------------------------------//
	
	var simpleBuildingImage = new Image();
	simpleBuildingImage.onload = function() { handleTextureLoaded(GL, simpleBuildingImage, simpleBuilding._simpleBuildingTexture); }
	var filePath_inServer_SimpleBuildingImage = "/F4D_GeometryData/"+projectNumStr+"/SimpleBuildingTexture.bmp";
	simpleBuildingImage.src = filePath_inServer_SimpleBuildingImage;
	
	this.filesReadings_count -=1;
	
	// Once reading finished, we must insert the project in to the corresponding quadtreeTile.***
	// Pendent.***
	
};		
	

//# sourceURL=f4d_readWriter.js	
	
		
		
		
		
		
		
		
		
		
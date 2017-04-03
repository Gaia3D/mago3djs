'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class FBO
 * 
 * @param gl 변수
 * @param width 변수
 * @param height 변수
 */
var FBO = function(gl, width, height) {
	if(!(this instanceof FBO)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.gl = gl;
	this.width = width;
	this.height = height;
	this.fbo = gl.createFramebuffer();
	this.depthBuffer = gl.createRenderbuffer();
	this.colorBuffer = gl.createTexture();
  
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.colorBuffer);  
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	//gl.generateMipmap(gl.TEXTURE_2D)
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); // original.***
	//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_INT, null); // test.***
  
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorBuffer, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
		throw "Incomplete frame buffer object.";
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};    

/**
 * 어떤 일을 하고 있습니까?
 */
FBO.prototype.bind = function() {
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
};

/**
 * 어떤 일을 하고 있습니까?
 */
FBO.prototype.unbind = function() {
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
};

/*
function FullScreenQuad(gl) {
  this.plane = SimpleMesh.buildPlaneXY(gl, 1, 1);
}     

FullScreenQuad.prototype.draw = function(shader, gl) {    
  var projectionMatrix = new PreGL.Mat4();
	projectionMatrix.ortho(-0.5,0.5,-0.5,0.5,-1,10);
	var modelViewMatrix = new PreGL.Mat4();
  //shader.set("projectionMatrix", projectionMatrix); // Original.***
	//shader.set("modelViewMatrix", modelViewMatrix); // Original.***
	gl.uniformMatrix4fv(shader.projectionMatrix4_loc, false, projectionMatrix.toFloat32Array());
	gl.uniformMatrix4fv(shader.modelViewMatrix4_loc, false, modelViewMatrix.toFloat32Array());
	
  this.plane.draw(shader);
}

function SimpleMesh(gl) {   
  this.gl = gl;
	this.attribs = [];
}

SimpleMesh.prototype.addAttrib = function(name, data, size) {
  size = size || 3  
	var attrib = {};
	attrib.name = name;
	attrib.data = data;
	attrib.buffer = this.gl.createBuffer();  
	attrib.size = size;
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attrib.buffer);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
	this.attribs.push(attrib);
}

SimpleMesh.prototype.updateAttrib = function(name, data) {
  var attrib = null;
  for(var i=0; i<this.attribs.length; i++) {
    if (this.attribs[i].name == name) {
      attrib = this.attribs[i];
      break;
    }
  }
  if (!attrib) {
    return;
  }
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attrib.buffer);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, 0);
}

SimpleMesh.prototype.setIndices = function(data) {  
  this.indices = {};
  this.indices.data = data;
  this.indices.buffer =this. gl.createBuffer();
	this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indices.buffer);
  this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, 
    new Uint16Array(data), this.gl.STATIC_DRAW
  ); 
  //this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, 0);
}

SimpleMesh.prototype.draw = function(program, primitive) {
  primitive = primitive || this.gl.TRIANGLES;  
  program = program.program ? program.program : program;
  
  for(var i in this.attribs) {         
    var attrib = this.attribs[i];
    if (attrib.location === undefined) {
      attrib.location = this.gl.getAttribLocation(program, attrib.name);      
    }
    if (attrib.location >= 0) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attrib.buffer);
      this.gl.vertexAttribPointer(attrib.location, attrib.size, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(attrib.location);
    }                      
  }  
  this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indices.buffer);
  this.gl.drawElements(primitive, this.indices.data.length, this.gl.UNSIGNED_SHORT, 0);   
                       
  //for(var i in this.attribs) {         
  //  var attrib = this.attribs[i];
  //  this.gl.disableVertexAttribArray(attrib.location);   
  //}
  // bind with 0, so, switch back to normal pointer operation
  //this.gl.bindBuffer(this.gl.ARRAY_BUFFER, 0);
  //glBindBufferARB(GL_ELEMENT_ARRAY_BUFFER_ARB, 0);
}

SimpleMesh.prototype.destroy = function() {
  this.gl.deleteBuffer(this.indices.buffer);
  for(var i in this.attribs) {
    this.gl.deleteBuffer(this.attribs[i].buffer);
  }
}        
 
SimpleMesh.buildPlaneXY = function(gl, sx, sy, nx, ny) {
  sx = sx || 1;
  sy = sy || 1;
  nx = nx || 10;
  ny = ny || 10;
  
  var vertices = [];
  var normals = [];
  var texCoords = [];
  var indices = [];
  
  for(var y=0; y < ny; y++ ) {
    for(var x=0; x < nx; x++ ) {
      vertices.push(x/(nx-1) * sx - sx/2, y/(ny-1) * sy - sy/2, 0);
      normals.push(0, 0, 1);
      texCoords.push(x/(nx-1), y/(ny-1));
      if (x < nx-1 && y < ny-1) {
        indices.push(y*nx + x, (y+1)*nx + x + 1, y*nx + x + 1);
        indices.push(y*nx + x, (y+1)*nx + x, (y+1)*nx + x + 1);
      }
    }    
  }
  
  var plane = new SimpleMesh(gl);
  plane.addAttrib("position", vertices);        
  plane.addAttrib("normal", normals);          
  plane.addAttrib("texCoord", texCoords, 2);    
  plane.setIndices(indices);
  plane.type = "PlaneXY";
  return plane;
}

SimpleMesh.buildPlaneXZ = function(gl, sx, sz, nx, nz) {
  sx = sx || 1;
  sz = sz || 1;
  nx = nx || 10;
  nz = nz || 10;
  
  var vertices = [];
  var texCoords = [];
  var indices = [];
  
  for(var z=0; z < nz; z++ ) {
    for(var x=0; x < nx; x++ ) {
      vertices.push(x/nx * sx - sx/2, 0, z/nz * sz - sz/2);
      texCoords.push(x/nx, z/nz);
      if (x < nx-1 && z < nz-1) {
        indices.push(z*nx + x, (z+1)*nx + x + 1, z*nx + x + 1);
        indices.push(z*nx + x, (z+1)*nx + x, (z+1)*nx + x + 1);
      }
    }    
  }
  
  var plane = new SimpleMesh(gl);
  plane.addAttrib("position", vertices);
  plane.addAttrib("texCoord", texCoords, 2);    
  plane.setIndices(indices); 
  plane.type = "PlaneXZ";
  return plane;
}

SimpleMesh.buildSphere = function(gl, r, nsides, nsegments) {  
  r = r || 1;
  nsides = nsides || 30;
  nsegments = nsegments || 30;
	function degToRad(d) {
		return d/180 * Math.PI;
	}
	var mesh = {
		vertices : [],
		normals : [],
		texCoords : [],
		indices: []
	};
	
 	var dtheta = 180.0/nsegments;
 	var dphi   = 360.0/nsides;
	
	var estimatedNumPoints = (Math.floor(360/dtheta) + 1) * (Math.floor(180/dphi) + 1);
	
	//vertexStream.setNumVertices(estimatedNumPoints);
	//vertexStream.setNumIndices(estimatedNumPoints * 6);
	function evalPos(theta, phi) {
	  var R = r;
		var pos = new PreGL.Vec3();
		pos.x = R * Math.sin(degToRad(theta)) * Math.sin(degToRad(phi));
		pos.y = R * Math.cos(degToRad(theta));
		pos.z = R * Math.sin(degToRad(theta)) * Math.cos(degToRad(phi));
		return pos;
	}
	for (var theta=0, segment=0; theta<=180; theta+=dtheta, ++segment) {
		for (var phi=0, side=0; phi<=360; phi+=dphi, ++side) { 
		  var pos = evalPos(theta, phi);           
		  //var pos2 = evalPos(theta+0.01, phi);           
		  //var pos3 = evalPos(theta, phi+0.01); 
		  //var n = pos2.sub(pos).cross(pos3.sub(pos));
		  //n = n.normalize();    
		  var n = pos.normalized();
		  
			mesh.vertices.push(pos.x, pos.y, pos.z); 			
			mesh.normals.push(n.x, n.y, n.z);
			mesh.texCoords.push(phi/360.0, theta/180.0);

			//no faces on the last segment
			if (segment == nsegments) continue;
			if (side == nsides) continue;

			mesh.indices.push((segment  )*(nsides+1) + side); 			
			mesh.indices.push((segment+1)*(nsides+1) + side);	
			mesh.indices.push((segment+1)*(nsides+1) + side + 1);
			
			mesh.indices.push((segment  )*(nsides+1) + side); 			
			mesh.indices.push((segment+1)*(nsides+1) + side + 1);
			mesh.indices.push((segment  )*(nsides+1) + side + 1);
			
					
			/*
			mesh.indices.push((segment  )*(nsides+1) + side); 
			mesh.indices.push((segment+1)*(nsides+1) + side);			
			mesh.indices.push((segment+1)*(nsides+1) + side + 1);
			mesh.indices.push((segment  )*(nsides+1) + side); 
			mesh.indices.push((segment+1)*(nsides+1) + side + 1);
			mesh.indices.push((segment  )*(nsides+1) + side + 1);
			*/
			
			/*
		}
	}
	
	var sphere = new SimpleMesh(gl);
  sphere.addAttrib("position", mesh.vertices);
  sphere.addAttrib("normal", mesh.normals);  
  sphere.addAttrib("texCoord", mesh.texCoords, 2); 
  sphere.type = "Sphere";   
  sphere.setIndices(mesh.indices); 
  
  return sphere;
  
}
*/
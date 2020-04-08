attribute vec3 position;
uniform mat4 ModelViewProjectionMatrix;

varying float vAltitude;
  
void main()
{	
    vec4 pos4 = vec4(position.xyz, 1.0);
	gl_Position = ModelViewProjectionMatrix * pos4;
	vAltitude = position.z;
}

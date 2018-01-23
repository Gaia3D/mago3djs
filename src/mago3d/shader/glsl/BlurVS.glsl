attribute vec4 position;
attribute vec2 texCoord;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;  

varying vec2 vTexCoord;

void main()
{	
    vTexCoord = texCoord;
    
    gl_Position = projectionMatrix * modelViewMatrix * position;
}

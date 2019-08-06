#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D noiseTex;  
uniform sampler2D diffuseTex;
uniform bool textureFlipYAxis;
varying vec3 vNormal;
uniform mat4 projectionMatrix;
uniform mat4 m;
uniform vec2 noiseScale;
uniform float near;
uniform float far;            
uniform float fov;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight;    
uniform float shininessValue;
uniform vec3 kernel[16];   
uniform vec4 oneColor4;
varying vec4 aColor4; // color from attributes
uniform bool bApplyScpecularLighting;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

varying vec2 vTexCoord;   
varying vec3 vLightWeighting;

varying vec3 diffuseColor;
uniform vec3 specularColor;
varying vec3 vertexPos;

const int kernelSize = 16;  
uniform float radius;      

uniform float ambientReflectionCoef;
uniform float diffuseReflectionCoef;  
uniform float specularReflectionCoef; 
varying float applySpecLighting;
uniform bool bApplySsao;
uniform float externalAlpha;

float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
}  

float UnpackDepth32( in vec4 pack )
{
    float depth = dot( pack, 1.0 / vec4(1.0, 256.0, 256.0*256.0, 16777216.0) ); // 256.0*256.0*256.0 = 16777216.0
    return depth * (16777216.0) / (16777216.0 - 1.0);
}              

vec3 getViewRay(vec2 tc)
{
    float hfar = 2.0 * tan(fov/2.0) * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
    return ray;                      
}         
            
//linear view space depth
float getDepth(vec2 coord)
{
    return UnpackDepth32(texture2D(depthTex, coord.xy));
}    

void main()
{
	vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));
	float alfa = externalAlpha;
	float depth = UnpackDepth32(textureColor);
	
    vec4 finalColor;
	finalColor = vec4(depth, depth, depth, alfa);

	//finalColor = vec4(vNormal, 1.0); // test to render normal color coded.***
    gl_FragColor = finalColor; 
}
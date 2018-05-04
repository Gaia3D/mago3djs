#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D noiseTex;  
uniform sampler2D diffuseTex;
uniform bool hasTexture;
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
uniform vec4 vColor4Aux;

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

float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
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
    return unpackDepth(texture2D(depthTex, coord.xy));
}    

void main()
{           
    vec4 textureColor;
    if(hasTexture)
    {
        if(textureFlipYAxis)
        {
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));
        }
        else{
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));
        }
		
        if(textureColor.w == 0.0)
        {
            discard;
        }
    }
    else{
        textureColor = vColor4Aux;
    }
	
	//vec3 ambientColor = vec3(textureColor.x, textureColor.y, textureColor.z);

    gl_FragColor = vec4(textureColor.xyz, 1.0); 
}
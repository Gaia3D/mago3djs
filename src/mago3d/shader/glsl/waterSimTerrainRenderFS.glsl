//#version 300 es

#ifdef GL_ES
    precision highp float;
#endif

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D diffuseTex;
uniform sampler2D depthTex; 

uniform sampler2D hightmap;
uniform sampler2D terrainmap;
uniform sampler2D normap;
uniform sampler2D sceneDepth;
uniform sampler2D colorReflection;
uniform sampler2D sedimap;

uniform float near;
uniform float far;
uniform mat4 projectionMatrixInv;
uniform bool bUseLogarithmicDepth;
varying float flogz;
varying float Fcoef_half;


uniform int u_TerrainType;
uniform float u_WaterTransparency;
uniform float u_SimRes;
uniform vec2 u_Dimensions;
uniform vec3 unif_LightPos;
uniform float u_far;
uniform float u_near;

uniform vec2 u_screenSize;

varying vec4 vColorAuxTest;
varying vec2 vTexCoord;

vec3 calculateNormal(vec2 uv){
    float eps = 1.0/u_SimRes;
    vec4 cur = texture2D(terrainmap, uv)*50.0;
    vec4 r = texture2D(terrainmap, uv + vec2(eps, 0.0))*50.0;
    vec4 t = texture2D(terrainmap, uv + vec2(0.0, eps))*50.0;

    vec3 n1 = normalize(vec3(-1.0, cur.x - r.x, 0.0));
    vec3 n2 = normalize(vec3(-1.0, t.x - r.x, 1.0));

    vec3 nor = -cross(n1,n2);
    nor = normalize(nor);
    return nor;
}
/*
vec3 sky(in vec3 rd){
    return mix(vec3(0.6,0.6,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));
}

float linearDepth(float depthSample)
{
    depthSample = 2.0 * depthSample - 1.0;
    float zLinear = 2.0 * u_near * u_far / (u_far + u_near - depthSample * (u_far - u_near));
    return zLinear;
}
*/

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

float getDepth(vec2 coord)
{
	if(bUseLogarithmicDepth)
	{
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z;

		float flogzAux = pow(2.0, linearDepth/Fcoef_half);
		float z = flogzAux - 1.0;
		linearDepth = z/(far);
		return linearDepth;
	}
	else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	}
}

/*
vec3 reconstructPosition(vec2 texCoord, float depth)
{
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/
    float x = texCoord.x * 2.0 - 1.0;
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;
    float y = (texCoord.y) * 2.0 - 1.0;
    float z = (1.0 - depth) * 2.0 - 1.0;
    vec4 pos_NDC = vec4(x, y, z, 1.0);
    vec4 pos_CC = projectionMatrixInv * pos_NDC;
    return pos_CC.xyz / pos_CC.w;
}

vec3 normal_from_depth(float depth, vec2 texCoord) {
    // http://theorangeduck.com/page/pure-depth-ssao
    float pixelSizeX = 1.0/u_screenSize.x;
    float pixelSizeY = 1.0/u_screenSize.y;

    vec2 offset1 = vec2(0.0,pixelSizeY);
    vec2 offset2 = vec2(pixelSizeX,0.0);

	float depthA = 0.0;
	float depthB = 0.0;
	for(float i=0.0; i<1.0; i++)
	{
		depthA += getDepth(texCoord + offset1*(1.0+i));
		depthB += getDepth(texCoord + offset2*(1.0+i));
	}

	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);

    vec3 pos0 = reconstructPosition(texCoord, depth);
    vec3 normal = cross(posA - pos0, posB - pos0);
    normal.z = -normal.z;

    return normalize(normal);
}
*/
void main()
{
    vec3 camDir = normalize(vec3(-gl_FragCoord.x / u_screenSize.x, -gl_FragCoord.y / u_screenSize.y, 1.0));
    vec3 camDir2 = -1.0 + 2.0 * camDir;
    vec3 normal = calculateNormal(vec2(vTexCoord.x, 1.0 - vTexCoord.y));
    float dotProd = dot(camDir2, normal);
    vec4 finalCol4 = vec4(vColorAuxTest * dotProd);
    finalCol4 = vec4(normal, 1.0);
    //if(vColorAuxTest.r == vColorAuxTest.g && vColorAuxTest.r == vColorAuxTest.b )
    //{
    //    finalCol4 = vec4(1.0, 0.0, 0.0, 1.0);
    //}

    // read difusseTex.
    vec4 difusseColor = texture2D(diffuseTex, vec2(vTexCoord.x, 1.0 - vTexCoord.y));
    gl_FragData[0] = difusseColor;  // anything.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(1.0); // depth
        gl_FragData[2] = vec4(1.0); // normal
        gl_FragData[3] = difusseColor; // albedo
        gl_FragData[4] = vec4(1.0); // selection color
    #endif
    /*
    vec2 uv = vec2(gl_FragCoord.xy/u_Dimensions);
    float terrainDepth = texture(sceneDepth,uv).x;
    float sediment = texture(sedimap,fs_Uv).x;
    float waterDepth = gl_FragCoord.z;

    terrainDepth = linearDepth(terrainDepth);
    waterDepth = linearDepth(waterDepth);

    float dpVal = 180.0 * max(0.0,terrainDepth - waterDepth);
    dpVal = clamp(dpVal, 0.0,4.0);
    //dpVal = pow(dpVal, 0.1);


    float fbias = 0.2;
    float fscale = 0.2;
    float fpow = 22.0;
    vec3 sundir = unif_LightPos;

    sundir = normalize(sundir);

    vec3 nor = -calnor(fs_Uv);
    vec3 viewdir = normalize(u_Eye - fs_Pos);
    vec3 lightdir = normalize(sundir);
    vec3 halfway = normalize(lightdir + viewdir);
    vec3 reflectedSky = sky(halfway);
    float spec = pow(max(dot(nor, halfway), 0.0), 333.0);


    float R = max(0.0, min(1.0, fbias + fscale * pow(1.0 + dot(viewdir, -nor), fpow)));

    //lamb =1.f;

    float yval = texture(hightmap,fs_Uv).x * 4.0;
    float wval = texture(hightmap,fs_Uv).y;
    wval /= 1.0;



    vec3 watercolor = mix(vec3(0.8,0.0,0.0), vec3(0.0,0.0,0.8), sediment * 2.0);
    vec3 watercolorspec = vec3(1.0);
    watercolorspec *= spec;



    out_Col = vec4(vec3(0.0,0.2,0.5) + R * reflectedSky + watercolorspec  , (.5 + spec) * u_WaterTransparency * dpVal);
    col_reflect = vec4(1.0);
    */
}
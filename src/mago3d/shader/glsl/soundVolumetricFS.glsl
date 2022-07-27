//#version 300 es

#ifdef GL_ES
    //precision lowp float;
    //precision lowp int;
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

// https://draemm.li/various/volumeRendering/webgl2/

    //*********************************************************
    // R= right, F= front, U= up, L= left, B= back, D= down.
    // RFU = x, y, z.
    // LBD = -x, -y, -z.
    //*********************************************************

    //      +-----------------+
	//      |                 |          
	//      |   screen size   |  
	//      |                 | 
	//      +-----------------+
	//      +-----------------+----------------+
	//      |                 |                | 
	//      |   front depth   |   rear depth   |
	//      |                 |                |
	//      +-----------------+----------------+
	
uniform sampler2D simulationBoxDoubleDepthTex;
uniform sampler2D simulationBoxDoubleNormalTex; // used to calculate the current frustum idx.***
uniform sampler2D airPressureMosaicTex;
uniform sampler2D sceneDepthTex; // scene depth texture.***
uniform sampler2D sceneNormalTex; // scene depth texture.***
uniform sampler2D airVelocityTex; 
uniform sampler2D maxPressureMosaicTex;

uniform int u_texSize[3]; // The original texture3D size.***
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
uniform vec3 u_voxelSizeMeters;

varying vec2 v_tex_pos;

uniform mat4 modelViewMatrixRelToEye;
uniform mat4 modelViewMatrixRelToEyeInv;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

uniform float u_airMaxPressure;
uniform float u_airEnvirontmentPressure;
uniform float u_maxVelocity;
uniform vec2 u_screenSize;
uniform vec2 uNearFarArray[4];
uniform float tangentOfHalfFovy;
uniform float aspectRatio;

uniform mat4 u_simulBoxTMat;
uniform mat4 u_simulBoxTMatInv;
uniform vec3 u_simulBoxPosHigh;
uniform vec3 u_simulBoxPosLow;
uniform vec3 u_simulBoxMinPosLC;
uniform vec3 u_simulBoxMaxPosLC;

uniform int u_renderType; // 0 = volumetric (generic), 1 = isosurface.




float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

float getDepth(vec2 coord)
{
	//if(bUseLogarithmicDepth)
	//{
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
	//	// flogz = 1.0 + gl_Position.z*0.0001;
    //    float Fcoef_half = uFCoef_logDepth/2.0;
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);
	//	float z = (flogzAux - 1.0);
	//	linearDepth = z/(far);
	//	return linearDepth;
	//}
	//else{
		return unpackDepth(texture2D(sceneDepthTex, coord.xy));
	//}
}

float getDepth_simulationBox(vec2 coord)
{
	//if(bUseLogarithmicDepth)
	//{
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
	//	// flogz = 1.0 + gl_Position.z*0.0001;
    //    float Fcoef_half = uFCoef_logDepth/2.0;
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);
	//	float z = (flogzAux - 1.0);
	//	linearDepth = z/(far);
	//	return linearDepth;
	//}
	//else{
		return unpackDepth(texture2D(simulationBoxDoubleDepthTex, coord.xy));
	//}
}

vec4 decodeNormal(in vec4 normal)
{
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}

vec4 getNormal(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(sceneNormalTex, texCoord);
    return decodeNormal(encodedNormal);
}

vec3 encodeVelocity(in vec3 vel)
{
	return vel*0.5 + 0.5;
}

vec3 decodeVelocity(in vec3 encodedVel)
{
	return vec3(encodedVel * 2.0 - 1.0);
}

vec3 getVelocity(in vec2 texCoord)
{
    vec4 encodedVel = texture2D(airVelocityTex, texCoord);
    return decodeVelocity(encodedVel.xyz)*u_maxVelocity;
}

vec4 getNormal_simulationBox(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, texCoord);
    return decodeNormal(encodedNormal);
}

int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)
{
    // Check the type of the data.******************
    // frustumIdx 0 .. 3 -> general geometry data.
    // frustumIdx 10 .. 13 -> tinTerrain data.
    // frustumIdx 20 .. 23 -> points cloud data.
    //----------------------------------------------
    int realFrustumIdx = -1;
    
     if(estimatedFrustumIdx >= 10)
    {
        estimatedFrustumIdx -= 10;
        if(estimatedFrustumIdx >= 10)
        {
            // points cloud data.
            estimatedFrustumIdx -= 10;
            dataType = 2;
        }
        else
        {
            // tinTerrain data.
            dataType = 1;
        }
    }
    else
    {
        // general geomtry.
        dataType = 0;
    }

    realFrustumIdx = estimatedFrustumIdx;
    return realFrustumIdx;
}

vec2 getNearFar_byFrustumIdx(in int frustumIdx)
{
    vec2 nearFar;
    if(frustumIdx == 0)
    {
        nearFar = uNearFarArray[0];
    }
    else if(frustumIdx == 1)
    {
        nearFar = uNearFarArray[1];
    }
    else if(frustumIdx == 2)
    {
        nearFar = uNearFarArray[2];
    }
    else if(frustumIdx == 3)
    {
        nearFar = uNearFarArray[3];
    }

    return nearFar;
}

void get_FrontAndRear_depthTexCoords(in vec2 texCoord, inout vec2 frontTexCoord, inout vec2 rearTexCoord)
{
    //      +-----------------+
	//      |                 |          
	//      |   screen size   |  
	//      |                 | 
	//      +-----------------+
	//      +-----------------+----------------+
	//      |                 |                | 
	//      |   front depth   |   rear depth   |
	//      |                 |                |
	//      +-----------------+----------------+
    vec2 normalTexSize = vec2(u_screenSize.x * 2.0, u_screenSize.y); // the normal tex width is double of the screen size width.***
    //vec2 frontNormalFragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);
    //vec2 rearNormalFragCoord = vec2(gl_FragCoord.x + u_screenSize.x, gl_FragCoord.y);
    float windows_x = texCoord.x * u_screenSize.x;
    float windows_y = texCoord.y * u_screenSize.y;
    vec2 frontNormalFragCoord = vec2(windows_x, windows_y);
    vec2 rearNormalFragCoord = vec2(windows_x + u_screenSize.x, windows_y);

    frontTexCoord = vec2(frontNormalFragCoord.x / normalTexSize.x, frontNormalFragCoord.y / normalTexSize.y);
    rearTexCoord = vec2(rearNormalFragCoord.x / normalTexSize.x, rearNormalFragCoord.y / normalTexSize.y);
}

vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
}

void get_FrontAndRear_posCC(in vec2 screenPos, in float currFar_rear, in float currFar_front, inout vec3 frontPosCC, inout vec3 rearPosCC)
{
    vec2 frontTexCoord;
    vec2 rearTexCoord;
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);

    // If the linear depth is 1, then, take the camPos as the position, so, pos = (0.0, 0.0, 0.0).***
    //vec4 depthColor4 = texture2D(simulationBoxDoubleDepthTex, screenPos);
    //float depthColLength = length(depthColor4);

    // Front posCC.***
    float frontLinearDepth = getDepth_simulationBox(frontTexCoord);
    if(frontLinearDepth < 1e-8)
    {
        frontPosCC = vec3(0.0);
    }
    else
    {
        float front_zDist = frontLinearDepth * currFar_front; 
        frontPosCC = getViewRay(screenPos, front_zDist);
    }
    

    // Rear posCC.***
    float rearLinearDepth = getDepth_simulationBox(rearTexCoord);
    if(rearLinearDepth < 1e-8)
    {
        rearPosCC = vec3(0.0);
    }
    else
    {
        float rear_zDist = rearLinearDepth * currFar_rear; 
        rearPosCC = getViewRay(screenPos, rear_zDist);
    }
    

}

void posWCRelToEye_to_posLC(in vec4 posWC_relToEye, in mat4 local_mat4Inv, in vec3 localPosHIGH, in vec3 localPosLOW, inout vec3 posLC)
{
    vec3 highDifferenceSun = -localPosHIGH.xyz + encodedCameraPositionMCHigh;
	vec3 lowDifferenceSun = posWC_relToEye.xyz -localPosLOW.xyz + encodedCameraPositionMCLow;
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);
	vec4 vPosRelToLight = local_mat4Inv * pos4Sun;

	posLC = vPosRelToLight.xyz / vPosRelToLight.w;
}

vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row)
{
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***
    // The "subTexCoord" is the texCoord of the subTexture[col, row].***
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    float sRange = 1.0 / float(u_mosaicSize[0]);
    float tRange = 1.0 / float(u_mosaicSize[1]);

    float s = float(col) * sRange + subTexCoord.x * sRange;
    float t = float(row) * tRange + subTexCoord.y * tRange;

    vec2 resultTexCoord = vec2(s, t);
    return resultTexCoord;
}

float getAirPressure_inMosaicTexture(in vec2 texCoord, in int pressureType)
{
    vec4 color4;
    if(pressureType == 0)
    {
        color4 = texture2D(airPressureMosaicTex, texCoord);
    }
    else if(pressureType == 1)
    {
        color4 = texture2D(maxPressureMosaicTex, texCoord);
    } 
    float decoded = unpackDepth(color4); // 32bit.
    float airPressure = decoded * u_airMaxPressure;

    return airPressure;
}

float _getAirPressure_triLinearInterpolation(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic, in int pressureType)
{
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), 
    // and the col & row into the mosaic texture, returns a trilinear interpolation of the pressure.***
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    vec2 px = 1.0 / sim_res3d.xy;
    vec2 vc = (floor(subTexCoord2d * sim_res3d.xy)) * px;
    vec2 f = fract(subTexCoord2d * sim_res3d.xy);
    vec2 texCoord_tl = vec2(vc);
    vec2 texCoord_tr = vec2(vc + vec2(px.x, 0));
    vec2 texCoord_bl = vec2(vc + vec2(0, px.y));
    vec2 texCoord_br = vec2(vc + px);
    vec2 mosaicTexCoord_tl = subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic);
    vec2 mosaicTexCoord_tr = subTexCoord_to_texCoord(texCoord_tr, col_mosaic, row_mosaic);
    vec2 mosaicTexCoord_bl = subTexCoord_to_texCoord(texCoord_bl, col_mosaic, row_mosaic);
    vec2 mosaicTexCoord_br = subTexCoord_to_texCoord(texCoord_br, col_mosaic, row_mosaic);

    float ap_tl = getAirPressure_inMosaicTexture(mosaicTexCoord_tl, pressureType);
    float ap_tr = getAirPressure_inMosaicTexture(mosaicTexCoord_tr, pressureType);
    float ap_bl = getAirPressure_inMosaicTexture(mosaicTexCoord_bl, pressureType);
    float ap_br = getAirPressure_inMosaicTexture(mosaicTexCoord_br, pressureType);

    float airPressure = mix(mix(ap_tl, ap_tr, f.x), mix(ap_bl, ap_br, f.x), f.y);

    return airPressure;
}

float _getAirPressure_nearest(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic, in int pressureType)
{
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), 
    // and the col & row into the mosaic texture, returns a nearest interpolation of the pressure.***
    vec2 mosaicTexCoord = subTexCoord_to_texCoord(subTexCoord2d, col_mosaic, row_mosaic);
    float ap = getAirPressure_inMosaicTexture(mosaicTexCoord, pressureType);
    return ap;
}

bool get_airPressure_fromTexture3d_triLinearInterpolation(in vec3 texCoord3d, inout float airPressure, inout vec3 velocity, in int pressureType)
{
    // tex3d : airPressureMosaicTex
    // 1rst, check texCoord3d boundary limits.***
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)
    {
        return false;
    }

    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)
    {
        return false;
    }

    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)
    {
        return false;
    }
    // 1rst, determine the sliceIdx.***
    // u_texSize[3]; // The original texture3D size.***
    int originalTexWidth = u_texSize[0];
    int originalTexHeight = u_texSize[1];
    int slicesCount = u_texSize[2];

    float currSliceIdx_float = texCoord3d.z * float(slicesCount);
    int currSliceIdx_down = int(floor(currSliceIdx_float));
    int currSliceIdx_up = currSliceIdx_down + 1;

    if(currSliceIdx_up >= u_texSize[2])
    {
        return false;
    }

    // now, calculate the mod.***
    //float remain = currSliceIdx_float -  floor(currSliceIdx_float);
    float remain = fract(currSliceIdx_float);

    // Now, calculate the "col" & "row" in the mosaic texture3d.***
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***

    // Down slice.************************************************************
    int col_down, row_down;
    if(currSliceIdx_down <= u_mosaicSize[0])
    {
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
        row_down = 0;
        col_down = currSliceIdx_down;
    }
    else
    {
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));

        col_down = int(colAux);
        row_down = int(rowAux);
    }

    // now, must calculate the mosaicTexCoord.***
    vec2 mosaicTexCoord_down = subTexCoord_to_texCoord(texCoord3d.xy, col_down, row_down);
    
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    vec2 px = 1.0 / sim_res3d.xy;
    vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;
    vec3 f = fract(texCoord3d * sim_res3d);

    float airPressure_down = _getAirPressure_triLinearInterpolation(texCoord3d.xy, col_down, row_down, pressureType);

    vec3 vel_down = getVelocity(mosaicTexCoord_down);

    // up slice.************************************************************
    int col_up, row_up;
    if(currSliceIdx_up <= u_mosaicSize[0])
    {
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
        row_up = 0;
        col_up = currSliceIdx_up;
    }
    else
    {
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));

        col_up = int(colAux);
        row_up = int(rowAux);
    }

    // now, must calculate the mosaicTexCoord.***
    vec2 mosaicTexCoord_up = subTexCoord_to_texCoord(texCoord3d.xy, col_up, row_up);

    float airPressure_up = _getAirPressure_triLinearInterpolation(texCoord3d.xy, col_up, row_up, pressureType);

    vec3 vel_up = getVelocity(mosaicTexCoord_up);

    velocity = mix(vel_down, vel_up, remain);


    airPressure = mix(airPressure_down, airPressure_up, f.z);
    //airPressure = airPressure_down; // test delete.***
    return true;
}

bool get_airPressure_fromTexture3d_nearest(in vec3 texCoord3d, inout float airPressure, inout vec3 velocity, in int pressureType)
{
    // tex3d : airPressureMosaicTex
    // 1rst, check texCoord3d boundary limits.***
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)
    {
        return false;
    }

    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)
    {
        return false;
    }

    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)
    {
        return false;
    }
    // 1rst, determine the sliceIdx.***
    int slicesCount = u_texSize[2];

    float currSliceIdx_float = texCoord3d.z * float(slicesCount);
    int currSliceIdx_down = int(floor(currSliceIdx_float));
    int currSliceIdx_up = currSliceIdx_down + 1;
    int currSliceIdx = currSliceIdx_down;

    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    //vec2 px = 1.0 / sim_res3d.xy;
    //vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;
    vec3 f = fract(texCoord3d * sim_res3d);

    if(f.z > 0.5)
    {
        currSliceIdx = currSliceIdx_up;
    }

    if(currSliceIdx >= u_texSize[2])
    {
        return false;
    }

    // ************************************************************
    int col, row;
    if(currSliceIdx <= u_mosaicSize[0])
    {
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
        row = 0;
        col = currSliceIdx;
    }
    else
    {
        float mosaicSize_x = float(u_mosaicSize[0]);
        float rowAux = floor(float(currSliceIdx) / mosaicSize_x);
        float colAux = float(currSliceIdx) - (rowAux * mosaicSize_x);

        col = int(colAux);
        row = int(rowAux);
    }

    // now, must calculate the mosaicTexCoord.***
    vec2 mosaicTexCoord = subTexCoord_to_texCoord(texCoord3d.xy, col, row);

    airPressure = _getAirPressure_nearest(texCoord3d.xy, col, row, pressureType);
    velocity = getVelocity(mosaicTexCoord);

    return true;
}

vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)
{
    
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }

    float value = gray * 4.0;
    float h = floor(value);
    float f = fract(value);

    vec4 resultColor = vec4(0.0, 0.0, 0.0, gray);

    if(hotToCold)
    {
        // HOT to COLD.***
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init
        if(h >= 0.0 && h < 1.0)
        {
            // mix red & yellow.***
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(red, yellow, f);
        }
        else if(h >= 1.0 && h < 2.0)
        {
            // mix yellow & green.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(yellow, green, f);
        }
        else if(h >= 2.0 && h < 3.0)
        {
            // mix green & cyan.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(green, cyan, f);
        }
        else if(h >= 3.0)
        {
            // mix cyan & blue.***
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(cyan, blue, f);
        }
    }
    else
    {
        // COLD to HOT.***
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init
        if(h >= 0.0 && h < 1.0)
        {
            // mix blue & cyan.***
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(blue, cyan, f);
        }
        else if(h >= 1.0 && h < 2.0)
        {
            // mix cyan & green.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(cyan, green, f);  
        }
        else if(h >= 2.0 && h < 3.0)
        {
            // mix green & yellow.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(green, yellow, f);
        }
        else if(h >= 3.0)
        {
            // mix yellow & red.***
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(yellow, red, f);
        }
    }

    return resultColor;
}

vec3 getRainbowColor_byHeight_original(in float height, in float minHeight_rainbow, in float maxHeight_rainbow)
{
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }
	
	float r, g, b;
	
	if(gray < 0.16666)
	{
		b = 0.0;
		g = gray*6.0;
		r = 1.0;
	}
	else if(gray >= 0.16666 && gray < 0.33333)
	{
		b = 0.0;
		g = 1.0;
		r = 2.0 - gray*6.0;
	}
	else if(gray >= 0.33333 && gray < 0.5)
	{
		b = -2.0 + gray*6.0;
		g = 1.0;
		r = 0.0;
	}
	else if(gray >= 0.5 && gray < 0.66666)
	{
		b = 1.0;
		g = 4.0 - gray*6.0;
		r = 0.0;
	}
	else if(gray >= 0.66666 && gray < 0.83333)
	{
		b = 1.0;
		g = 0.0;
		r = -4.0 + gray*6.0;
	}
	else if(gray >= 0.83333)
	{
		b = 6.0 - gray*6.0;
		g = 0.0;
		r = 1.0;
	}
	
	float aux = r;
	r = b;
	b = aux;
	
	//b = -gray + 1.0;
	//if (gray > 0.5)
	//{
	//	g = -gray*2.0 + 2.0; 
	//}
	//else 
	//{
	//	g = gray*2.0;
	//}
	//r = gray;
	vec3 resultColor = vec3(r, g, b);
    return resultColor;
} 

// https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
// The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. 
//--------------------------------------------------------------------------------------------------------------------------

// https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques
//--------------------------------------------------------------------------------------------------------------------------

/*
// https://martinopilia.com/posts/2018/09/17/volume-raycasting.html
// Estimate the normal from a finite difference approximation of the gradient
vec3 normal(vec3 position, float intensity)
{
    float d = step_length;
    float dx = texture(volume, position + vec3(d,0,0)).r - intensity;
    float dy = texture(volume, position + vec3(0,d,0)).r - intensity;
    float dz = texture(volume, position + vec3(0,0,d)).r - intensity;
    return -normalize(NormalMatrix * vec3(dx, dy, dz));
}*/

bool normalLC(vec3 texCoord3d, in float pressure, in float step_length, inout vec3 result_normal)
{
    // Estimate the normal from a finite difference approximation of the gradient
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    vec3 pix = 1.0 / sim_res3d;

    vec3 vc = texCoord3d;
    int pressureType = 0;

    // dx.*************************************************
    float airPressure_dx = u_airEnvirontmentPressure;
    vec3 velocity_dx;
    vec3 texCoord3d_dx = vec3(vc + vec3(pix.x, 0.0, 0.0));
    bool succes_dx =  get_airPressure_fromTexture3d_nearest(texCoord3d_dx, airPressure_dx, velocity_dx, pressureType);
    if(!succes_dx)return false;

    float airPressure_dx_neg = u_airEnvirontmentPressure;
    vec3 velocity_dx_neg;
    vec3 texCoord3d_dx_neg = vec3(vc - vec3(pix.x, 0.0, 0.0));
    bool succes_dx_neg =  get_airPressure_fromTexture3d_nearest(texCoord3d_dx_neg, airPressure_dx_neg, velocity_dx_neg, pressureType);
    if(!succes_dx_neg)return false;

    // dy.*************************************************
    float airPressure_dy = u_airEnvirontmentPressure;
    vec3 velocity_dy;
    vec3 texCoord3d_dy = vec3(vc + vec3(0.0, pix.y, 0.0));
    bool succes_dy =  get_airPressure_fromTexture3d_nearest(texCoord3d_dy, airPressure_dy, velocity_dy, pressureType);
    if(!succes_dy)return false;

    float airPressure_dy_neg = u_airEnvirontmentPressure;
    vec3 velocity_dy_neg;
    vec3 texCoord3d_dy_neg = vec3(vc - vec3(0.0, pix.y, 0.0));
    bool succes_dy_neg =  get_airPressure_fromTexture3d_nearest(texCoord3d_dy_neg, airPressure_dy_neg, velocity_dy_neg, pressureType);
    if(!succes_dy_neg)return false;

    // dz.*************************************************
    float airPressure_dz = u_airEnvirontmentPressure;
    vec3 velocity_dz;
    vec3 texCoord3d_dz = vec3(vc + vec3(0.0, 0.0, pix.z));
    bool succes_dz =  get_airPressure_fromTexture3d_nearest(texCoord3d_dz, airPressure_dz, velocity_dz, pressureType);
    if(!succes_dz)return false;

    float airPressure_dz_neg = u_airEnvirontmentPressure;
    vec3 velocity_dz_neg;
    vec3 texCoord3d_dz_neg = vec3(vc - vec3(0.0, 0.0, pix.z));
    bool succes_dz_neg =  get_airPressure_fromTexture3d_nearest(texCoord3d_dz_neg, airPressure_dz_neg, velocity_dz_neg, pressureType);
    if(!succes_dz_neg)return false;

    //result_normal = normalize(vec3(airPressure_dx - pressure, airPressure_dy - pressure, airPressure_dz - pressure));
    result_normal = normalize(vec3(airPressure_dx - airPressure_dx_neg, airPressure_dy - airPressure_dy_neg, airPressure_dz - airPressure_dz_neg));

    if(abs(result_normal.x) > 0.0 || abs(result_normal.y) > 0.0 || abs(result_normal.z) > 0.0 )
    {
        return true;
    }
    else return false;

    return true;
}

vec4 transfer_fnc(in float pressure)
{
    // The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. 
    float maxPressureRef = 1.05;
    float minPressureRef = u_airEnvirontmentPressure;
    maxPressureRef = 1.005; // test.***
    minPressureRef = 1.0; // test.***
    bool bHotToCold = false; // we want coldToHot (blue = min to red = max).***
    vec4 rainbowCol3 = getRainbowColor_byHeight(pressure, minPressureRef, maxPressureRef, bHotToCold);

    return rainbowCol3;
}

void main(){

    // 1rst, read front depth & rear depth and check if exist rear depth.***
    // If no exist rear depth, then discard.***
    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y); // 
    vec2 screenPos = v_tex_pos;

    // read normal in rear depth. If no exist normal, then, discard.***
    // calculate the texCoord for rear normal:
    vec2 frontTexCoord;
    vec2 rearTexCoord;
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);


    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);
	vec3 normal = normal4rear.xyz;
    
	if(length(normal) < 0.1)
    {
        discard;
    }

    // 1rst, know the scene depth.***
    vec4 normal4scene = getNormal(v_tex_pos);
    int estimatedFrustumIdx = int(floor(normal4scene.w * 100.0));
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_scene = getNearFar_byFrustumIdx(currFrustumIdx);
	float currNear_scene = nearFar_scene.x; // no used in this shader.***
	float currFar_scene = nearFar_scene.y;
    float sceneLinearDepth = getDepth(v_tex_pos);
    float distToCam = sceneLinearDepth * currFar_scene;
    vec3 sceneDepthPosCC = getViewRay(v_tex_pos, distToCam - 1.0);

    // Now, calculate the positions with the simulation box, front & rear.***
    // rear.***
	estimatedFrustumIdx = int(floor(normal4rear.w * 100.0));
	dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_rear = getNearFar_byFrustumIdx(currFrustumIdx);
	float currNear_rear = nearFar_rear.x; // no used in this shader.***
	float currFar_rear = nearFar_rear.y;

    // front.***
    estimatedFrustumIdx = int(floor(normal4front.w * 100.0));
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_front = getNearFar_byFrustumIdx(currFrustumIdx);
	float currNear_front = nearFar_front.x; // no used in this shader.***
	float currFar_front = nearFar_front.y;

    // Now, calculate the rearPosCC & frontPosCC.***
    vec3 frontPosCC;
    vec3 rearPosCC;
    get_FrontAndRear_posCC(screenPos, currFar_rear, currFar_front, frontPosCC, rearPosCC);
    

    // Now, calculate frontPosWC & rearPosWC.***
    vec4 frontPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(frontPosCC.xyz, 1.0);
    vec4 rearPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(rearPosCC.xyz, 1.0);
    //vec4 scenePosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(sceneDepthPosCC.xyz, 1.0);

    // Now, calculate frontPosLC & rearPosLC.***
    vec3 frontPosLC;
    vec3 rearPosLC;
    //vec3 scenePosLC;
    posWCRelToEye_to_posLC(frontPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, frontPosLC);
    posWCRelToEye_to_posLC(rearPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, rearPosLC);
    //posWCRelToEye_to_posLC(scenePosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, scenePosLC);

    // Now, with "frontPosLC" & "rearPosLC", calculate the frontTexCoord3d & rearTexCoord3d.***
    vec3 simulBoxRange = vec3(u_simulBoxMaxPosLC.x - u_simulBoxMinPosLC.x, u_simulBoxMaxPosLC.y - u_simulBoxMinPosLC.y, u_simulBoxMaxPosLC.z - u_simulBoxMinPosLC.z);
    //vec3 frontTexCoord3d = vec3((frontPosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (frontPosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (frontPosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);
    //vec3 rearTexCoord3d = vec3((rearPosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (rearPosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (rearPosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);
    //vec3 scenePosTexCoord3d = vec3((scenePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (scenePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (scenePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);

    
    //bool testBool = false;

    //float totalAirPressure = 0.0;
    vec3 totalVelocityLC = vec3(0.0);
    //float totalDotProdInv = 0.0;
    float airPressure = 0.0;
    float smplingCount = 0.0;
    //float currMaxPressure = 0.0;
    float segmentLength = length(rearPosLC - frontPosLC);
    //vec3 samplingDir = normalize(rearTexCoord3d - frontTexCoord3d); // original.***
    vec3 samplingDirLC = normalize(rearPosLC - frontPosLC);
    vec3 samplingDirCC = normalize(rearPosCC - frontPosCC);
    //float increLength = 0.02; // original.***
    float samplingsCount = 50.0;
    float increLength = segmentLength / samplingsCount;
    if(increLength < u_voxelSizeMeters[0])
    {
        increLength = u_voxelSizeMeters[0];
    }

    vec3 velocityLC;

    //vec3 camRay = normalize(getViewRay(v_tex_pos, 1.0));
    vec3 camRay = normalize(sceneDepthPosCC);
    //float dotProdAccum = 0.0;
    vec4 color4Aux = vec4(0.0, 0.0, 0.0, 0.0);
    //float dotProdFactor = 1.0;
    int pressureType = 0;
    vec3 scenePosTexCoord3d_candidate = vec3(-1.0);
    vec3 currSamplePosLC = vec3(frontPosLC);
    vec3 step_vector_LC = samplingDirLC * increLength;
    vec4 finalColor4 = vec4(0.0);
    
    // Sampling far to near.***
    for(int i=0; i<50; i++)
    {
        
        // Note : for each smple, must depth check with the scene depthTexure.***
        vec3 samplePosLC = frontPosLC + samplingDirLC * increLength * float(i);

        //if(samplePosLC.z > 20.0)
        //{
        //    continue;
        //}

        vec3 samplePosCC = frontPosCC + samplingDirCC * increLength * float(i);
        if(abs(samplePosCC.z) > distToCam)
        {
            break;
        }

        airPressure = 0.0;
        vec3 sampleTexCoord3d = vec3((samplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (samplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (samplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);
        //vec3 sampleTexCoord3d = vec3((currSamplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (currSamplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (currSamplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);
        scenePosTexCoord3d_candidate = vec3(sampleTexCoord3d);
        

        if(get_airPressure_fromTexture3d_triLinearInterpolation(sampleTexCoord3d, airPressure, velocityLC, pressureType))
        {
            // normalLC(vec3 texCoord3d, in float pressure, in float step_length)
            vec3 currNormalLC;
            if(!normalLC(sampleTexCoord3d, airPressure, increLength, currNormalLC))
            {
                continue;
            }

            // test iso surface:
            //float pressureWanted = 1.02;
            //float diffAux = abs(pressureWanted - airPressure);
            //if(diffAux > 0.01)
            //{
            //    continue;
            //}

            vec4 currColor4 = transfer_fnc(airPressure);
            //vec3 normalizedVelocityLC = normalize(velocityLC);
            //vec4 velocityWC = u_simulBoxTMat * vec4(velocityLC, 1.0);
            //vec4 velocityDirCC = modelViewMatrixRelToEye * vec4(velocityWC.xyz, 1.0);

            // Now, calculate alpha by normalCC.***
            vec4 currNormalWC = u_simulBoxTMat * vec4(currNormalLC, 1.0);
            vec4 currNormalCC = modelViewMatrixRelToEye * vec4(currNormalWC.xyz, 1.0);
            vec3 normalCC = normalize(currNormalCC.xyz);
            float dotProd = dot(camRay, normalCC);

            // Now, accumulate the color.***
            currColor4.rgb *= abs(dotProd);

            vec4 vecAux = abs(vec4(currColor4.rgb, 1.0));
 
            //if(length(currNormalLC) > 0.0)
            {
                finalColor4.rgb += (1.0 - finalColor4.a) * currColor4.a * vecAux.rgb; // test. render normal color:
                finalColor4.a += (1.0 - finalColor4.a) * currColor4.a;
            }
            
            totalVelocityLC += velocityLC;
            smplingCount += 1.0;

            // Optimization: break out of the loop when the color is near opaque
            if (finalColor4.a >= 0.95) {
                break;
            }
            
            
        }

        currSamplePosLC += step_vector_LC;
    }

    if(smplingCount < 1.0)
    {
        smplingCount = 1.0;
    }
    
    //float averageAirPressure = totalAirPressure / smplingCount;
    //vec3 averageVelocityLC = totalVelocityLC / smplingCount;
    //float averageDotProd = dotProdAccum / smplingCount;
    //float averageDotProdInv = totalDotProdInv / smplingCount;
    //averageDotProdInv /= dotProdFactor;

    
    //float f = 1.0;
    //float deltaP = averageAirPressure - u_airEnvirontmentPressure;
    //float maxPressure_reference = u_airMaxPressure;
    //vec4 rainbowCol3 = getRainbowColor_byHeight(averageAirPressure * f, u_airEnvirontmentPressure, 1.05, false);//

    //float alpha;
    //if(deltaP > 0.0)
    //if(deltaP > 0.00005)
    {
        // Test with velocity:
        //vec4 velocityWC = u_simulBoxTMat * vec4(averageVelocityLC, 1.0);
        //vec4 velocityDirCC = modelViewMatrixRelToEye * vec4(velocityWC.xyz, 1.0);

        //vec3 lightDirLC = normalize(vec3(0.1, 0.1, -0.9));

        //vec4 lightDirWC = u_simulBoxTMat * vec4(lightDirLC, 1.0);
        //vec4 lightDirCC = modelViewMatrixRelToEye * vec4(lightDirWC.xyz, 1.0);
        //float lightDotProd = abs(dot(normalize(lightDirCC.xyz), normalize(velocityDirCC.xyz)));
        //float lightDotProd = -(dot(normalize(lightDirLC.xyz), normalize(averageVelocityLC.xyz)));

        //float dotProd = abs(dot(camRay, normalize(velocityDirCC.xyz)));
        //float dotProdInv = 1.0 - abs(dotProd);
        //finalColor4.rgb *= lightDotProd;

        //float alphaByP = deltaP * 10000.0 / u_airMaxPressure;
        //alpha = min(averageDotProdInv, alphaByP);
        //alpha = averageDotProdInv;// * 5.0;
        //float alpha_final = min(alphaByP, alpha);
        //color4Aux = vec4(rainbowCol3.rgb * averageDotProd, alphaByP);

        color4Aux = finalColor4;
    }

    

    // Now, check the max pressure record.***
    // Must check the "scenePosTexCoord3d".***
    /*
    pressureType = 1; // maxPressureRecord.***
    float sceneAirPressure;
    vec3 sceneVelocityLC;
    vec4 color_maxPressure = vec4(0.0);

    if(get_airPressure_fromTexture3d_triLinearInterpolation(scenePosTexCoord3d_candidate, sceneAirPressure, sceneVelocityLC, pressureType))//
    {
        if(sceneAirPressure > u_airEnvirontmentPressure + 0.01)
        {
            maxPressure_reference = 1.6;
            //vec3 sceneColor = getRainbowColor_byHeight(sceneAirPressure, 0.8, maxPressure_reference, false);//
            color4Aux.rgb = getRainbowColor_byHeight(sceneAirPressure, 0.8, maxPressure_reference, false);//
            color4Aux.a = 0.8;
        }
    }
    */

    gl_FragData[0] = color4Aux;

    #ifdef USE_MULTI_RENDER_TARGET

        gl_FragData[1] = color4Aux;

        gl_FragData[2] = color4Aux;

        gl_FragData[3] = color4Aux;
    #endif
}

/*
uniform sampler3D tex;
uniform sampler3D normals;
uniform sampler2D colorMap;

uniform mat4 transform;
uniform int depthSampleCount;
uniform float zScale;

uniform vec3 lightPosition;

uniform float brightness;

//uniform vec4 opacitySettings;
// x: minLevel
// y: maxLevel
// z: lowNode
// w: highNode

in vec2 texCoord;

//in vec4 origin;
//in vec4 direction;

out vec4 color;

vec3 ambientLight = vec3(0.34, 0.32, 0.32);
vec3 directionalLight = vec3(0.5, 0.5, 0.5);
vec3 lightVector = normalize(vec3(-1.0, -1.0, 1.0));
vec3 specularColor = vec3(0.5, 0.5, 0.5);

vec3 aabb[2] = vec3[2](
	vec3(0.0, 0.0, 0.0),
	vec3(1.0, 1.0, 1.0)
);

struct Ray {
    vec3 origin;
    vec3 direction;
    vec3 inv_direction;
    int sign[3];
};

Ray makeRay(vec3 origin, vec3 direction) {
    vec3 inv_direction = vec3(1.0) / direction;
    
    return Ray(
        origin,
        direction,
        inv_direction,
        int[3](
			((inv_direction.x < 0.0) ? 1 : 0),
			((inv_direction.y < 0.0) ? 1 : 0),
			((inv_direction.z < 0.0) ? 1 : 0)
		)
    );
}

/*
	From: https://github.com/hpicgs/cgsee/wiki/Ray-Box-Intersection-on-the-GPU
void intersect(
    in Ray ray, in vec3 aabb[2],
    out float tmin, out float tmax
){
    float tymin, tymax, tzmin, tzmax;
    tmin = (aabb[ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;
    tmax = (aabb[1-ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;
    tymin = (aabb[ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;
    tymax = (aabb[1-ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;
    tzmin = (aabb[ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;
    tzmax = (aabb[1-ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;
    tmin = max(max(tmin, tymin), tzmin);
    tmax = min(min(tmax, tymax), tzmax);
}
*/


/*

void main(){
	
	//transform = inverse(transform);
	
	vec4 origin = vec4(0.0, 0.0, 2.0, 1.0);
	origin = transform * origin;
	origin = origin / origin.w;
	origin.z = origin.z / zScale;
	origin = origin + 0.5;

	vec4 image = vec4(texCoord, 4.0, 1.0);
	image = transform * image;
	//image = image / image.w;
	image.z = image.z / zScale;
	image = image + 0.5;
	//vec4 direction = vec4(0.0, 0.0, 1.0, 0.0);
	vec4 direction = normalize(origin-image);
	//direction = transform * direction;

	Ray ray = makeRay(origin.xyz, direction.xyz);
	float tmin = 0.0;
	float tmax = 0.0;
	intersect(ray, aabb, tmin, tmax);

	vec4 value = vec4(0.0, 0.0, 0.0, 0.0);
,
	if(tmin > tmax){
		color = value;
		discard;
	}

	vec3 start = origin.xyz + tmin*direction.xyz;
	vec3 end = origin.xyz + tmax*direction.xyz;
	
	float length = distance(end, start);
	int sampleCount = int(float(depthSampleCount)*length);
	//vec3 increment = (end-start)/float(sampleCount);
	//vec3 originOffset = mod((start-origin.xyz), increment);

	float s = 0.0;
	float px = 0.0;
	vec4 pxColor = vec4(0.0, 0.0, 0.0, 0.0);
	vec3 texCo = vec3(0.0, 0.0, 0.0);
	vec3 normal = vec3(0.0, 0.0, 0.0);
	vec4 zero = vec4(0.0);
	
	for(int count = 0; count < sampleCount; count++){

		texCo = mix(start, end, float(count)/float(sampleCount));// - originOffset;

		//texCo = start + increment*float(count);
		px = texture(tex, texCo).r;

		
		//px = length(texture(normals, texCo).xyz - 0.5);
		//px = px * 1.5;
		
		pxColor = texture(colorMap, vec2(px, 0.0));
		
		normal = normalize(texture(normals, texCo).xyz - 0.5);
		float directional = clamp(dot(normal, lightVector), 0.0, 1.0);

		//vec3 R = -reflect(lightDirection, surfaceNormal);
		//return pow(max(0.0, dot(viewDirection, R)), shininess);

		float specular = max(dot(direction.xyz, reflect(lightVector, normal)), 0.0);
		specular = pow(specular, 3.0);

		pxColor.rgb = ambientLight*pxColor.rgb + directionalLight*directional*pxColor.rgb + pxColor.a*specular*specularColor;
			
		
		//value = mix(value, pxColor, px);
		//value = (1.0-value.a)*pxColor + value;
		//value = mix(pxColor, zero, value.a) + value;
		
		value = value + pxColor - pxColor*value.a;
		
		if(value.a >= 0.95){
			break;
		}
	}
	color = value*brightness;
}
*/

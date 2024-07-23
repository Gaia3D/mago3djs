'use strict';
var ShaderSource = {};
ShaderSource.airPollutionVolumRenderFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    //precision lowp float;\n\
    //precision lowp int;\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
// https://draemm.li/various/volumeRendering/webgl2/\n\
\n\
    //*********************************************************\n\
    // R= right, F= front, U= up, L= left, B= back, D= down.\n\
    // RFU = x, y, z.\n\
    // LBD = -x, -y, -z.\n\
    //*********************************************************\n\
\n\
    //      +-----------------+\n\
	//      |                 |          \n\
	//      |   screen size   |  \n\
	//      |                 | \n\
	//      +-----------------+\n\
	//      +-----------------+----------------+\n\
	//      |                 |                | \n\
	//      |   front depth   |   rear depth   |\n\
	//      |                 |                |\n\
	//      +-----------------+----------------+\n\
	\n\
uniform sampler2D simulationBoxDoubleDepthTex;\n\
uniform sampler2D simulationBoxDoubleNormalTex; // used to calculate the current frustum idx.***\n\
uniform sampler2D pollutionMosaicTex; // pollutionTex. (from chemical accident).***\n\
uniform sampler2D sceneDepthTex; // scene depth texture.***\n\
uniform sampler2D sceneNormalTex; // scene normal texture.***\n\
\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform vec3 u_voxelSizeMeters;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform vec2 u_minMaxPollutionValues;\n\
uniform float u_airEnvirontmentPressure;\n\
uniform vec2 u_screenSize;\n\
uniform vec2 uNearFarArray[4];\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
uniform vec2 uMinMaxAltitudeSlices[32]; // limited to 32 slices.***\n\
\n\
uniform mat4 u_simulBoxTMat;\n\
uniform mat4 u_simulBoxTMatInv;\n\
uniform vec3 u_simulBoxPosHigh;\n\
uniform vec3 u_simulBoxPosLow;\n\
uniform vec3 u_simulBoxMinPosLC;\n\
uniform vec3 u_simulBoxMaxPosLC;\n\
\n\
\n\
\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
	//	// flogz = 1.0 + gl_Position.z*0.0001;\n\
    //    float Fcoef_half = uFCoef_logDepth/2.0;\n\
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
	//	float z = (flogzAux - 1.0);\n\
	//	linearDepth = z/(far);\n\
	//	return linearDepth;\n\
	//}\n\
	//else{\n\
		return unpackDepth(texture2D(sceneDepthTex, coord.xy));\n\
	//}\n\
}\n\
\n\
float getDepth_simulationBox(vec2 coord)\n\
{\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
	//	// flogz = 1.0 + gl_Position.z*0.0001;\n\
    //    float Fcoef_half = uFCoef_logDepth/2.0;\n\
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
	//	float z = (flogzAux - 1.0);\n\
	//	linearDepth = z/(far);\n\
	//	return linearDepth;\n\
	//}\n\
	//else{\n\
		return unpackDepth(texture2D(simulationBoxDoubleDepthTex, coord.xy));\n\
	//}\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(sceneNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
\n\
vec4 getNormal_simulationBox(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
void get_FrontAndRear_depthTexCoords(in vec2 texCoord, inout vec2 frontTexCoord, inout vec2 rearTexCoord)\n\
{\n\
    //      +-----------------+\n\
	//      |                 |          \n\
	//      |   screen size   |  \n\
	//      |                 | \n\
	//      +-----------------+\n\
	//      +-----------------+----------------+\n\
	//      |                 |                | \n\
	//      |   front depth   |   rear depth   |\n\
	//      |                 |                |\n\
	//      +-----------------+----------------+\n\
    vec2 normalTexSize = vec2(u_screenSize.x * 2.0, u_screenSize.y); // the normal tex width is double of the screen size width.***\n\
    //vec2 frontNormalFragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);\n\
    //vec2 rearNormalFragCoord = vec2(gl_FragCoord.x + u_screenSize.x, gl_FragCoord.y);\n\
    float windows_x = texCoord.x * u_screenSize.x;\n\
    float windows_y = texCoord.y * u_screenSize.y;\n\
    vec2 frontNormalFragCoord = vec2(windows_x, windows_y);\n\
    vec2 rearNormalFragCoord = vec2(windows_x + u_screenSize.x, windows_y);\n\
\n\
    frontTexCoord = vec2(frontNormalFragCoord.x / normalTexSize.x, frontNormalFragCoord.y / normalTexSize.y);\n\
    rearTexCoord = vec2(rearNormalFragCoord.x / normalTexSize.x, rearNormalFragCoord.y / normalTexSize.y);\n\
}\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
void get_FrontAndRear_posCC(in vec2 screenPos, in float currFar_rear, in float currFar_front, inout vec3 frontPosCC, inout vec3 rearPosCC)\n\
{\n\
    vec2 frontTexCoord;\n\
    vec2 rearTexCoord;\n\
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);\n\
\n\
    // If the linear depth is 1, then, take the camPos as the position, so, pos = (0.0, 0.0, 0.0).***\n\
    //vec4 depthColor4 = texture2D(simulationBoxDoubleDepthTex, screenPos);\n\
    //float depthColLength = length(depthColor4);\n\
\n\
    // Front posCC.***\n\
    float frontLinearDepth = getDepth_simulationBox(frontTexCoord);\n\
    if(frontLinearDepth < 1e-8)\n\
    {\n\
        frontPosCC = vec3(0.0);\n\
    }\n\
    else\n\
    {\n\
        float front_zDist = frontLinearDepth * currFar_front; \n\
        frontPosCC = getViewRay(screenPos, front_zDist);\n\
    }\n\
    \n\
\n\
    // Rear posCC.***\n\
    float rearLinearDepth = getDepth_simulationBox(rearTexCoord);\n\
    if(rearLinearDepth < 1e-8)\n\
    {\n\
        rearPosCC = vec3(0.0);\n\
    }\n\
    else\n\
    {\n\
        float rear_zDist = rearLinearDepth * currFar_rear; \n\
        rearPosCC = getViewRay(screenPos, rear_zDist);\n\
    }\n\
    \n\
\n\
}\n\
\n\
void posWCRelToEye_to_posLC(in vec4 posWC_relToEye, in mat4 local_mat4Inv, in vec3 localPosHIGH, in vec3 localPosLOW, inout vec3 posLC)\n\
{\n\
    vec3 highDifferenceSun = -localPosHIGH.xyz + encodedCameraPositionMCHigh;\n\
	vec3 lowDifferenceSun = posWC_relToEye.xyz -localPosLOW.xyz + encodedCameraPositionMCLow;\n\
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
	vec4 vPosRelToLight = local_mat4Inv * pos4Sun;\n\
\n\
	posLC = vPosRelToLight.xyz / vPosRelToLight.w;\n\
}\n\
\n\
void checkTexCoordRange(inout vec2 texCoord)\n\
{\n\
    float error = 0.0;\n\
    if(texCoord.x < 0.0)\n\
    {\n\
        texCoord.x = 0.0 + error;\n\
    }\n\
    else if(texCoord.x > 1.0)\n\
    {\n\
        texCoord.x = 1.0 - error;\n\
    }\n\
\n\
    if(texCoord.y < 0.0)\n\
    {\n\
        texCoord.y = 0.0 + error;\n\
    }\n\
    else if(texCoord.y > 1.0)\n\
    {\n\
        texCoord.y = 1.0 - error;\n\
    }\n\
}\n\
\n\
void checkTexCoord3DRange(inout vec3 texCoord)\n\
{\n\
    float error = 0.0;\n\
    if(texCoord.x < 0.0)\n\
    {\n\
        texCoord.x = 0.0 + error;\n\
    }\n\
    else if(texCoord.x > 1.0)\n\
    {\n\
        texCoord.x = 1.0 - error;\n\
    }\n\
\n\
    if(texCoord.y < 0.0)\n\
    {\n\
        texCoord.y = 0.0 + error;\n\
    }\n\
    else if(texCoord.y > 1.0)\n\
    {\n\
        texCoord.y = 1.0 - error;\n\
    }\n\
\n\
    if(texCoord.z < 0.0)\n\
    {\n\
        texCoord.z = 0.0 + error;\n\
    }\n\
    else if(texCoord.z > 1.0)\n\
    {\n\
        texCoord.z = 1.0 - error;\n\
    }\n\
}\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col_mosaic, in int row_mosaic)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    checkTexCoordRange(subTexCoord);\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    float s = float(col_mosaic) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row_mosaic) * tRange + subTexCoord.y * tRange;\n\
\n\
    // must check if the texCoord_tl is boundary in x & y.***************************************************************************\n\
    float mosaicTexSize_x = float(u_texSize[0] * u_mosaicSize[0]); // for example : 150 pixels * 3 columns = 450 pixels.***\n\
    float mosaicTexSize_y = float(u_texSize[1] * u_mosaicSize[1]); // for example : 150 pixels * 3 rows = 450 pixels.***\n\
\n\
    float currMosaicStart_x = float(col_mosaic * u_texSize[0]);\n\
    float currMosaicStart_y = float(row_mosaic * u_texSize[1]);\n\
    float currMosaicEnd_x = currMosaicStart_x + float(u_texSize[0]);\n\
    float currMosaicEnd_y = currMosaicStart_y + float(u_texSize[1]);\n\
\n\
    float pixel_x = s * mosaicTexSize_x;\n\
    float pixel_y = t * mosaicTexSize_y;\n\
\n\
    if(pixel_x < currMosaicStart_x + 1.0)\n\
    {\n\
        pixel_x = currMosaicStart_x + 1.0;\n\
    }\n\
    else if(pixel_x > currMosaicEnd_x - 1.0)\n\
    {\n\
        pixel_x = currMosaicEnd_x - 1.0;\n\
    }\n\
\n\
    if(pixel_y < currMosaicStart_y + 1.0)\n\
    {\n\
        pixel_y = currMosaicStart_y + 1.0;\n\
    }\n\
    else if(pixel_y > currMosaicEnd_y - 1.0)\n\
    {\n\
        pixel_y = currMosaicEnd_y - 1.0;\n\
    }\n\
\n\
    s = pixel_x / mosaicTexSize_x;\n\
    t = pixel_y / mosaicTexSize_y;\n\
\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
\n\
    return resultTexCoord;\n\
}\n\
\n\
\n\
\n\
float getPollution_inMosaicTexture(in vec2 texCoord)\n\
{\n\
    checkTexCoordRange(texCoord);\n\
    vec4 color4;\n\
    color4 = texture2D(pollutionMosaicTex, texCoord);\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float pollution = decoded * u_minMaxPollutionValues.y;\n\
\n\
    return pollution;\n\
}\n\
\n\
float _getPollution_triLinearInterpolation(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic)\n\
{\n\
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), \n\
    // and the col & row into the mosaic texture, returns a trilinear interpolation of the pressure.***\n\
\n\
    //************************************************************************************\n\
    // u_texSize[3]; // The original texture3D size.***\n\
    // mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    //------------------------------------------------------------------------------------\n\
\n\
    checkTexCoordRange(subTexCoord2d);\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec2 px = 1.0 / sim_res3d.xy;\n\
    vec2 vc = (floor(subTexCoord2d * sim_res3d.xy)) * px;\n\
    vec2 f = fract(subTexCoord2d * sim_res3d.xy);\n\
    vec2 texCoord_tl = vec2(vc);\n\
\n\
    \n\
    \n\
\n\
    vec2 texCoord_tr = vec2(vc + vec2(px.x, 0));\n\
    vec2 texCoord_bl = vec2(vc + vec2(0, px.y));\n\
    vec2 texCoord_br = vec2(vc + vec2(px.x, px.y));\n\
\n\
    checkTexCoordRange(texCoord_tl);\n\
    checkTexCoordRange(texCoord_tr);\n\
    checkTexCoordRange(texCoord_bl);\n\
    checkTexCoordRange(texCoord_br);\n\
    vec2 mosaicTexCoord_tl = subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_tr = subTexCoord_to_texCoord(texCoord_tr, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_bl = subTexCoord_to_texCoord(texCoord_bl, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_br = subTexCoord_to_texCoord(texCoord_br, col_mosaic, row_mosaic);\n\
\n\
    // vec2 mosaicTexCoord_tl = subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic);\n\
    // vec2 mosaicTexCoord_tr = vec2(mosaicTexCoord_tl + vec2(px.x, 0));\n\
    // vec2 mosaicTexCoord_bl = vec2(mosaicTexCoord_tl + vec2(0, px.y));\n\
    // vec2 mosaicTexCoord_br = vec2(mosaicTexCoord_tl + vec2(px.x, px.y));\n\
\n\
\n\
    float ap_tl = getPollution_inMosaicTexture(mosaicTexCoord_tl);\n\
    float ap_tr = getPollution_inMosaicTexture(mosaicTexCoord_tr);\n\
    float ap_bl = getPollution_inMosaicTexture(mosaicTexCoord_bl);\n\
    float ap_br = getPollution_inMosaicTexture(mosaicTexCoord_br);\n\
\n\
    float airPressure = mix(mix(ap_tl, ap_tr, f.x), mix(ap_bl, ap_br, f.x), f.y);\n\
\n\
    return airPressure;\n\
}\n\
\n\
\n\
float _getPollution_nearest(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic)\n\
{\n\
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), \n\
    // and the col & row into the mosaic texture, returns a nearest interpolation of the pressure.***\n\
    checkTexCoordRange(subTexCoord2d);\n\
    vec2 mosaicTexCoord = subTexCoord_to_texCoord(subTexCoord2d, col_mosaic, row_mosaic);\n\
    float ap = getPollution_inMosaicTexture(mosaicTexCoord);\n\
    return ap;\n\
}\n\
\n\
bool getUpDownSlicesIdx(in vec3 posLC, inout int sliceDownIdx, inout int sliceUpIdx, inout float distUp, inout float distDown)\n\
{\n\
    // uMinMaxAltitudeSlices[32]; // limited to 32 slices.***\n\
    // u_texSize[3] =  The original texture3D size.***\n\
    float altitude = posLC.z;\n\
    int currSliceIdx = -1;\n\
    for(int i=0; i<32; i++)\n\
    {\n\
        if(altitude >= uMinMaxAltitudeSlices[i].x && altitude < uMinMaxAltitudeSlices[i].y)\n\
        {\n\
            currSliceIdx = i;\n\
            break;\n\
        }\n\
    }\n\
\n\
    if(currSliceIdx < 0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(currSliceIdx == 0)\n\
    {\n\
        sliceDownIdx = currSliceIdx;\n\
        sliceUpIdx = currSliceIdx;\n\
    }\n\
    else\n\
    {\n\
        sliceDownIdx = currSliceIdx-1;\n\
        sliceUpIdx = currSliceIdx;\n\
    }\n\
\n\
    if(sliceUpIdx > u_texSize[2] - 1)\n\
    {\n\
        sliceUpIdx = u_texSize[2] - 1;\n\
    }\n\
\n\
    // +------------------------------+ <- sliceUp\n\
    //                 |\n\
    //                 |\n\
    //                 |  distUp\n\
    //                 |\n\
    //                 * <- posL.z\n\
    //                 |\n\
    //                 |  distDown\n\
    // +------------------------------+ <- sliceDown\n\
    float sliceUpAltitude = 0.0;\n\
    float sliceDownAltitude = 0.0;\n\
    for(int i=0; i<32; i++)\n\
    {\n\
        if(sliceUpIdx == i)\n\
        {\n\
            sliceUpAltitude = uMinMaxAltitudeSlices[i].y;\n\
            sliceDownAltitude = uMinMaxAltitudeSlices[i].x;\n\
            break;\n\
        }\n\
    }\n\
\n\
    distUp = abs(sliceUpAltitude - altitude);\n\
    distDown = abs(altitude - sliceDownAltitude);\n\
\n\
    return true;\n\
}\n\
\n\
bool getUpDownSlicesIdx_FAST(in vec3 posLC, inout int sliceDownIdx, inout int sliceUpIdx)\n\
{\n\
    // uMinMaxAltitudeSlices[32]; // limited to 32 slices.***\n\
    // u_texSize[3] =  The original texture3D size.***\n\
    float altitude = posLC.z;\n\
    int currSliceIdx = -1;\n\
    for(int i=0; i<32; i++)\n\
    {\n\
        if(altitude >= uMinMaxAltitudeSlices[i].x && altitude < uMinMaxAltitudeSlices[i].y)\n\
        {\n\
            currSliceIdx = i;\n\
            break;\n\
        }\n\
    }\n\
\n\
    if(currSliceIdx < 0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(currSliceIdx == 0)\n\
    {\n\
        sliceDownIdx = currSliceIdx;\n\
        sliceUpIdx = currSliceIdx;\n\
    }\n\
    else\n\
    {\n\
        sliceDownIdx = currSliceIdx-1;\n\
        sliceUpIdx = currSliceIdx;\n\
    }\n\
\n\
    if(sliceUpIdx > u_texSize[2] - 1)\n\
    {\n\
        sliceUpIdx = u_texSize[2] - 1;\n\
    }\n\
\n\
    return true;\n\
}\n\
\n\
bool get_pollution_fromTexture3d_triLinearInterpolation_FAST(in vec3 texCoord3d, in vec3 posLC, inout float airPressure)\n\
{\n\
    // Here is not important the pollution value. Only need know if the pollution value is zero or not.***\n\
    // this function is called by \"findFirstSamplePosition\".***\n\
    // tex3d : airPressureMosaicTex\n\
\n\
    // 1rst, determine the sliceIdx.***\n\
    int currSliceIdx_down = -1;\n\
    int currSliceIdx_up = -1;\n\
    float distUp = 0.0;\n\
    float distDown = 0.0;\n\
\n\
    if(!getUpDownSlicesIdx_FAST(posLC, currSliceIdx_down, currSliceIdx_up))\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float distUpAndDown = distUp + distDown;\n\
    float distUpRatio = distUp / distUpAndDown;\n\
    float distDownRatio = distDown / distUpAndDown;\n\
\n\
    // Down slice.************************************************************\n\
    int col_down, row_down;\n\
    //if(currSliceIdx_down <= u_mosaicSize[0])\n\
    //{\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
    //    row_down = 0;\n\
    //    col_down = currSliceIdx_down;\n\
    //}\n\
    //else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_down = int(colAux);\n\
        row_down = int(rowAux);\n\
    }\n\
\n\
    float airPressure_down = _getPollution_nearest(texCoord3d.xy, col_down, row_down);\n\
\n\
    if(airPressure_down > 0.0)\n\
    {\n\
        airPressure = airPressure_down;\n\
        return true;\n\
    }\n\
\n\
    // up slice.************************************************************\n\
    int col_up, row_up;\n\
    if(currSliceIdx_up <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row_up = 0;\n\
        col_up = currSliceIdx_up;\n\
    }\n\
    else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_up = int(colAux);\n\
        row_up = int(rowAux);\n\
    }\n\
\n\
    // test.***\n\
    col_up = col_down + 1;\n\
    row_up = row_down;\n\
    if(col_up >= u_mosaicSize[0])\n\
    {\n\
        col_up = 0;\n\
        row_up = row_down + 1;\n\
    }\n\
\n\
    if(row_up >= u_mosaicSize[1])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float airPressure_up = _getPollution_nearest(texCoord3d.xy, col_up, row_up);\n\
    if(airPressure_up > 0.0)\n\
    {\n\
        airPressure = airPressure_up;\n\
        return true;\n\
    }\n\
\n\
\n\
    return false;\n\
}\n\
\n\
bool get_pollution_fromTexture3d_triLinearInterpolation(in vec3 texCoord3d, in vec3 posLC, inout float airPressure)\n\
{\n\
    // tex3d : airPressureMosaicTex\n\
    // 1rst, check texCoord3d boundary limits.***\n\
    float error = 0.001;\n\
    // if(texCoord3d.x < 0.0 + error || texCoord3d.x > 1.0 - error)\n\
    // {\n\
    //     return false;\n\
    // }\n\
\n\
    // if(texCoord3d.y < 0.0 + error || texCoord3d.y > 1.0 - error)\n\
    // {\n\
    //     return false;\n\
    // }\n\
\n\
    // if(texCoord3d.z < 0.0 + error || texCoord3d.z > 1.0 - error)\n\
    // {\n\
    //     return false;\n\
    // }\n\
    // 1rst, determine the sliceIdx.***\n\
    int currSliceIdx_down = -1;\n\
    int currSliceIdx_up = -1;\n\
    float distUp = 0.0;\n\
    float distDown = 0.0;\n\
\n\
    if(!getUpDownSlicesIdx(posLC, currSliceIdx_down, currSliceIdx_up, distUp, distDown))\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float distUpAndDown = distUp + distDown;\n\
    float distUpRatio = distUp / distUpAndDown;\n\
    float distDownRatio = distDown / distUpAndDown;\n\
\n\
    // Down slice.************************************************************\n\
    int col_down, row_down;\n\
    //if(currSliceIdx_down <= u_mosaicSize[0])\n\
    //{\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
    //    row_down = 0;\n\
    //    col_down = currSliceIdx_down;\n\
    //}\n\
    //else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_down = int(colAux);\n\
        row_down = int(rowAux);\n\
    }\n\
\n\
    float airPressure_down = _getPollution_triLinearInterpolation(texCoord3d.xy, col_down, row_down);\n\
\n\
    // up slice.************************************************************\n\
    int col_up, row_up;\n\
    if(currSliceIdx_up <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row_up = 0;\n\
        col_up = currSliceIdx_up;\n\
    }\n\
    else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_up = int(colAux);\n\
        row_up = int(rowAux);\n\
    }\n\
\n\
    // test.***\n\
    col_up = col_down + 1;\n\
    row_up = row_down;\n\
    if(col_up >= u_mosaicSize[0])\n\
    {\n\
        col_up = 0;\n\
        row_up = row_down + 1;\n\
    }\n\
\n\
    if(row_up >= u_mosaicSize[1])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float airPressure_up = _getPollution_triLinearInterpolation(texCoord3d.xy, col_up, row_up);\n\
\n\
    airPressure = mix(airPressure_down, airPressure_up, distDownRatio);\n\
    //airPressure = mix(airPressure_down, airPressure_up, 0.5);\n\
\n\
    return true;\n\
}\n\
\n\
bool get_pollution_fromTexture3d_triLinearInterpolation_original(in vec3 texCoord3d, inout float airPressure)\n\
{\n\
    // This function is used if all slices of the texture3d has same altitude differences.***\n\
    //---------------------------------------------------------------------------------------\n\
    // tex3d : airPressureMosaicTex\n\
    // 1rst, check texCoord3d boundary limits.***\n\
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
    // 1rst, determine the sliceIdx.***\n\
    // u_texSize[3]; // The original texture3D size.***\n\
    int slicesCount = u_texSize[2];\n\
\n\
    float currSliceIdx_float = texCoord3d.z * float(slicesCount - 1);\n\
    int currSliceIdx_down = int(floor(currSliceIdx_float));\n\
    int currSliceIdx_up = currSliceIdx_down + 1;\n\
\n\
    if(currSliceIdx_up >= u_texSize[2])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    // now, calculate the mod.***\n\
    //float remain = currSliceIdx_float -  floor(currSliceIdx_float);\n\
    float remain = fract(currSliceIdx_float);\n\
\n\
    // Now, calculate the \"col\" & \"row\" in the mosaic texture3d.***\n\
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
\n\
    // Down slice.************************************************************\n\
    int col_down, row_down;\n\
    //if(currSliceIdx_down <= u_mosaicSize[0])\n\
    //{\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
    //    row_down = 0;\n\
    //    col_down = currSliceIdx_down;\n\
   // }\n\
    //else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_down = int(colAux);\n\
        row_down = int(rowAux);\n\
    }\n\
\n\
    // now, must calculate the mosaicTexCoord.***\n\
    vec2 mosaicTexCoord_down = subTexCoord_to_texCoord(texCoord3d.xy, col_down, row_down);\n\
    \n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec2 px = 1.0 / sim_res3d.xy;\n\
    vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;\n\
    vec3 f = fract(texCoord3d * sim_res3d);\n\
\n\
    float airPressure_down = _getPollution_triLinearInterpolation(texCoord3d.xy, col_down, row_down);\n\
\n\
    // up slice.************************************************************\n\
    int col_up, row_up;\n\
    if(currSliceIdx_up <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row_up = 0;\n\
        col_up = currSliceIdx_up;\n\
    }\n\
    else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_up = int(colAux);\n\
        row_up = int(rowAux);\n\
    }\n\
\n\
    // test.***\n\
    col_up = col_down + 1;\n\
    row_up = row_down;\n\
    if(col_up >= u_mosaicSize[0])\n\
    {\n\
        col_up = 0;\n\
        row_up = row_down + 1;\n\
    }\n\
\n\
    if(row_up >= u_mosaicSize[1])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float airPressure_up = _getPollution_triLinearInterpolation(texCoord3d.xy, col_up, row_up);\n\
\n\
    airPressure = mix(airPressure_down, airPressure_up, f.z);\n\
    //airPressure = airPressure_down; // test delete.***\n\
    return true;\n\
}\n\
\n\
bool get_pollution_fromTexture3d_nearest(in vec3 texCoord3d, inout float airPressure)\n\
{\n\
    // tex3d : airPressureMosaicTex\n\
    // 1rst, check texCoord3d boundary limits.***\n\
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
    // 1rst, determine the sliceIdx.***\n\
    int slicesCount = u_texSize[2];\n\
\n\
    float currSliceIdx_float = texCoord3d.z * float(slicesCount -  1);\n\
    int currSliceIdx_down = int(floor(currSliceIdx_float));\n\
    int currSliceIdx_up = currSliceIdx_down + 1;\n\
    int currSliceIdx = currSliceIdx_down;\n\
\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    //vec2 px = 1.0 / sim_res3d.xy;\n\
    //vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;\n\
    vec3 f = fract(texCoord3d * sim_res3d);\n\
\n\
    if(f.z > 0.5)\n\
    {\n\
        currSliceIdx = currSliceIdx_up;\n\
    }\n\
\n\
    if(currSliceIdx >= u_texSize[2])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    // ************************************************************\n\
    int col, row;\n\
    //if(currSliceIdx <= u_mosaicSize[0])\n\
    //{\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
    //    row = 0;\n\
   //     col = currSliceIdx;\n\
   /// }\n\
    //else\n\
    {\n\
        float mosaicSize_x = float(u_mosaicSize[0]);\n\
        float rowAux = floor(float(currSliceIdx) / mosaicSize_x);\n\
        float colAux = float(currSliceIdx) - (rowAux * mosaicSize_x);\n\
\n\
        col = int(colAux);\n\
        row = int(rowAux);\n\
    }\n\
\n\
    // now, must calculate the mosaicTexCoord.***\n\
\n\
    airPressure = _getPollution_nearest(texCoord3d.xy, col, row);\n\
\n\
    return true;\n\
}\n\
\n\
vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)\n\
{\n\
    \n\
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
\n\
    float value = gray * 4.0;\n\
    float h = floor(value);\n\
    float f = fract(value);\n\
\n\
    // test.***\n\
    if(gray > 0.0000001)\n\
    {\n\
        //gray = 0.95;\n\
    }\n\
\n\
    vec4 resultColor = vec4(0.0, 0.0, 0.0, (gray));\n\
\n\
    if(hotToCold)\n\
    {\n\
        // HOT to COLD.***\n\
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix red & yellow.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(red, yellow, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix yellow & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, green, f);\n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & cyan.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(green, cyan, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix cyan & blue.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, blue, f);\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // COLD to HOT.***\n\
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix blue & cyan.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(blue, cyan, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix cyan & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, green, f);  \n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & yellow.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(green, yellow, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix yellow & red.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, red, f);\n\
        }\n\
    }\n\
\n\
    return resultColor;\n\
}\n\
\n\
vec3 getRainbowColor_byHeight_original(in float height, in float minHeight_rainbow, in float maxHeight_rainbow)\n\
{\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
// https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl\n\
// The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. \n\
//--------------------------------------------------------------------------------------------------------------------------\n\
\n\
// https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques\n\
//--------------------------------------------------------------------------------------------------------------------------\n\
\n\
/*\n\
// https://martinopilia.com/posts/2018/09/17/volume-raycasting.html\n\
// Estimate the normal from a finite difference approximation of the gradient\n\
vec3 normal(vec3 position, float intensity)\n\
{\n\
    float d = step_length;\n\
    float dx = texture(volume, position + vec3(d,0,0)).r - intensity;\n\
    float dy = texture(volume, position + vec3(0,d,0)).r - intensity;\n\
    float dz = texture(volume, position + vec3(0,0,d)).r - intensity;\n\
    return -normalize(NormalMatrix * vec3(dx, dy, dz));\n\
}*/\n\
\n\
bool normalLC(vec3 texCoord3d, in vec3 posLC, inout vec3 result_normal)\n\
{\n\
    // Estimate the normal from a finite difference approximation of the gradient\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec3 pix = 1.0 / sim_res3d;\n\
\n\
    checkTexCoord3DRange(texCoord3d);\n\
\n\
    vec3 vc = texCoord3d;\n\
\n\
    // dx.*************************************************\n\
    float airPressure_dx = 0.0;\n\
    vec3 velocity_dx;\n\
    vec3 texCoord3d_dx = vec3(vc + vec3(pix.x, 0.0, 0.0));\n\
    bool succes_dx =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dx, posLC, airPressure_dx);\n\
    if(!succes_dx)return false;\n\
\n\
    float airPressure_dx_neg = 0.0;\n\
    vec3 velocity_dx_neg;\n\
    vec3 texCoord3d_dx_neg = vec3(vc - vec3(pix.x, 0.0, 0.0));\n\
    bool succes_dx_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dx_neg, posLC, airPressure_dx_neg);\n\
    if(!succes_dx_neg)return false;\n\
\n\
    // dy.*************************************************\n\
    float airPressure_dy = 0.0;\n\
    vec3 velocity_dy;\n\
    vec3 texCoord3d_dy = vec3(vc + vec3(0.0, pix.y, 0.0));\n\
    bool succes_dy =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dy, posLC, airPressure_dy);\n\
    if(!succes_dy)return false;\n\
\n\
    float airPressure_dy_neg = 0.0;\n\
    vec3 velocity_dy_neg;\n\
    vec3 texCoord3d_dy_neg = vec3(vc - vec3(0.0, pix.y, 0.0));\n\
    bool succes_dy_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dy_neg, posLC, airPressure_dy_neg);\n\
    if(!succes_dy_neg)return false;\n\
\n\
    // dz.*************************************************\n\
    float airPressure_dz = 0.0;\n\
    vec3 velocity_dz;\n\
    vec3 texCoord3d_dz = vec3(vc + vec3(0.0, 0.0, pix.z));\n\
    bool succes_dz =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dz, posLC, airPressure_dz);\n\
    if(!succes_dz)return false;\n\
\n\
    float airPressure_dz_neg = 0.0;\n\
    vec3 velocity_dz_neg;\n\
    vec3 texCoord3d_dz_neg = vec3(vc - vec3(0.0, 0.0, pix.z));\n\
    bool succes_dz_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dz_neg, posLC, airPressure_dz_neg);\n\
    if(!succes_dz_neg)return false;\n\
\n\
    //result_normal = normalize(vec3(airPressure_dx - pressure, airPressure_dy - pressure, airPressure_dz - pressure));\n\
    result_normal = normalize(vec3(airPressure_dx - airPressure_dx_neg, airPressure_dy - airPressure_dy_neg, airPressure_dz - airPressure_dz_neg));\n\
\n\
    if(abs(result_normal.x) > 0.0 || abs(result_normal.y) > 0.0 || abs(result_normal.z) > 0.0 )\n\
    {\n\
        return true;\n\
    }\n\
    else return false;\n\
\n\
    return true;\n\
}\n\
\n\
vec4 transfer_fnc(in float pressure)\n\
{\n\
    // The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. \n\
    //float maxPressureRef = 1.05;\n\
    //float minPressureRef = u_airEnvirontmentPressure;\n\
    float maxPressureRef = u_minMaxPollutionValues.y; // test.***\n\
    float minPressureRef = u_minMaxPollutionValues.x; // test.***\n\
    bool bHotToCold = false; // we want coldToHot (blue = min to red = max).***\n\
    vec4 rainbowCol3 = getRainbowColor_byHeight(pressure, minPressureRef, maxPressureRef, bHotToCold);\n\
\n\
    return rainbowCol3;\n\
}\n\
\n\
bool isSimulationBoxEdge(vec2 screenPos)\n\
{\n\
    // This function is used to render the simulation box edges.***\n\
    // check the normals.***\n\
    vec2 frontTexCoord;\n\
    vec2 rearTexCoord;\n\
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);\n\
    float pixelSize_x = 1.0 / (u_screenSize.x * 2.0);\n\
    float pixelSize_y = 1.0 / u_screenSize.y;\n\
    \n\
    // check front.***\n\
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);\n\
    vec4 normal4front_up = getNormal_simulationBox(vec2(frontTexCoord.x, frontTexCoord.y + pixelSize_y));\n\
\n\
    if(dot(normal4front.xyz, normal4front_up.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4front_left = getNormal_simulationBox(vec2(frontTexCoord.x - pixelSize_x, frontTexCoord.y));    \n\
    if(dot(normal4front.xyz, normal4front_left.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4front_down = getNormal_simulationBox(vec2(frontTexCoord.x, frontTexCoord.y - pixelSize_y));    \n\
    if(dot(normal4front.xyz, normal4front_down.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4front_rigth = getNormal_simulationBox(vec2(frontTexCoord.x + pixelSize_x, frontTexCoord.y));    \n\
    if(dot(normal4front.xyz, normal4front_rigth.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    // now, check the rear normals.***\n\
    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);\n\
    vec4 normal4rear_up = getNormal_simulationBox(vec2(rearTexCoord.x, rearTexCoord.y + pixelSize_y));\n\
\n\
    if(dot(normal4rear.xyz, normal4rear_up.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4rear_left = getNormal_simulationBox(vec2(rearTexCoord.x - pixelSize_x, rearTexCoord.y));    \n\
    if(dot(normal4rear.xyz, normal4rear_left.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4rear_down = getNormal_simulationBox(vec2(rearTexCoord.x, rearTexCoord.y - pixelSize_y));    \n\
    if(dot(normal4rear.xyz, normal4rear_down.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4rear_rigth = getNormal_simulationBox(vec2(rearTexCoord.x + pixelSize_x, rearTexCoord.y));    \n\
    if(dot(normal4rear.xyz, normal4rear_rigth.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    return false;\n\
}\n\
\n\
bool findFirstSamplePosition(in vec3 frontPosLC, in vec3 rearPosLC, in vec3 samplingDirLC, in float increLength, in vec3 simulBoxRange, inout vec3 result_samplePos, inout int iteration)\n\
{\n\
    // This function finds the first sample position.***\n\
    // Here is not important the pollution value. Only need know if the pollution value is zero or not.***\n\
    float contaminationSample = 0.0;\n\
    vec3 samplePosLC;\n\
    vec3 samplePosLC_prev;\n\
    for(int i=0; i<30; i++)\n\
    {\n\
        // Note : for each smple, must depth check with the scene depthTexure.***\n\
        float dist = float(i) * increLength;\n\
        samplePosLC = frontPosLC + samplingDirLC * dist;\n\
        iteration = i;\n\
\n\
        if(i == 0)\n\
        {\n\
            samplePosLC_prev = samplePosLC;\n\
        }\n\
\n\
        contaminationSample = 0.0;\n\
        vec3 sampleTexCoord3d = vec3((samplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (samplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (samplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
        checkTexCoord3DRange(sampleTexCoord3d);\n\
\n\
        if(get_pollution_fromTexture3d_triLinearInterpolation_FAST(sampleTexCoord3d, samplePosLC, contaminationSample))\n\
        {\n\
            if(contaminationSample > u_minMaxPollutionValues[0])\n\
            {\n\
                if(i > 0)\n\
                {\n\
                    // check the prev semiPos.***\n\
                    vec3 samplePosLC_semiPrev = samplePosLC - samplingDirLC * increLength * 0.5;\n\
                    if(get_pollution_fromTexture3d_triLinearInterpolation_FAST(sampleTexCoord3d, samplePosLC_semiPrev, contaminationSample))\n\
                    {\n\
                        if(contaminationSample > u_minMaxPollutionValues[0])\n\
                        {\n\
                            result_samplePos = samplePosLC_prev;\n\
                            return true;\n\
                        }\n\
                        else\n\
                        {\n\
                            //result_samplePos = (samplePosLC + samplePosLC_prev) * 0.5;\n\
                            result_samplePos = samplePosLC_semiPrev;\n\
                            return true;\n\
                        }\n\
                    }\n\
                }\n\
\n\
                //result_samplePos = (samplePosLC + samplePosLC_prev) * 0.5;\n\
                result_samplePos = samplePosLC_prev;\n\
                return true;\n\
            }\n\
        }\n\
        //currSamplePosLC += step_vector_LC;\n\
        samplePosLC_prev = samplePosLC;\n\
    }\n\
\n\
    return false;\n\
}\n\
\n\
void main(){\n\
\n\
    // 1rst, read front depth & rear depth and check if exist rear depth.***\n\
    // If no exist rear depth, then discard.***\n\
    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y); // \n\
    vec2 screenPos = v_tex_pos;\n\
\n\
    if(isSimulationBoxEdge(screenPos))\n\
    {\n\
        vec4 edgeColor = vec4(0.25, 0.5, 0.99, 1.0);\n\
        gl_FragData[0] = edgeColor;\n\
\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
            gl_FragData[1] = edgeColor;\n\
            gl_FragData[2] = edgeColor;\n\
            gl_FragData[3] = edgeColor;\n\
        #endif\n\
        return;\n\
    }\n\
\n\
    // read normal in rear depth. If no exist normal, then, discard.***\n\
    // calculate the texCoord for rear normal:\n\
    vec2 frontTexCoord;\n\
    vec2 rearTexCoord;\n\
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);\n\
\n\
    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, frontTexCoord);\n\
	if(length(encodedNormal.xyz) < 0.1)\n\
    {\n\
        vec4 encodedNormal_rear = texture2D(simulationBoxDoubleNormalTex, rearTexCoord);\n\
        if(length(encodedNormal_rear.xyz) < 0.1)\n\
        {\n\
            discard;\n\
        }\n\
        //discard;\n\
    }\n\
\n\
    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);\n\
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);\n\
	vec3 normal = normal4front.xyz;\n\
\n\
    // 1rst, know the scene depth.***\n\
    vec4 normal4scene = getNormal(v_tex_pos);\n\
    int estimatedFrustumIdx = int(floor(normal4scene.w * 100.0));\n\
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_scene = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear_scene = nearFar_scene.x; // no used in this shader.***\n\
	float currFar_scene = nearFar_scene.y;\n\
    float sceneLinearDepth = getDepth(v_tex_pos);\n\
    float distToCam = sceneLinearDepth * currFar_scene;\n\
    vec3 sceneDepthPosCC = getViewRay(v_tex_pos, distToCam - 1.0);\n\
\n\
    \n\
\n\
    // Now, calculate the positions with the simulation box, front & rear.***\n\
    // rear.***\n\
	estimatedFrustumIdx = int(floor(normal4rear.w * 100.0));\n\
	dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_rear = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear_rear = nearFar_rear.x; // no used in this shader.***\n\
	float currFar_rear = nearFar_rear.y;\n\
\n\
    // front.***\n\
    estimatedFrustumIdx = int(floor(normal4front.w * 100.0));\n\
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_front = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear_front = nearFar_front.x; // no used in this shader.***\n\
	float currFar_front = nearFar_front.y;\n\
\n\
    // Now, calculate the rearPosCC & frontPosCC.***\n\
    vec3 frontPosCC;\n\
    vec3 rearPosCC;\n\
    get_FrontAndRear_posCC(screenPos, currFar_rear, currFar_front, frontPosCC, rearPosCC);\n\
\n\
    \n\
    \n\
\n\
    // Now, calculate frontPosWC & rearPosWC.***\n\
    vec4 frontPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(frontPosCC.xyz, 1.0);\n\
    vec4 rearPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(rearPosCC.xyz, 1.0);\n\
    //vec4 scenePosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(sceneDepthPosCC.xyz, 1.0);\n\
\n\
    // Now, calculate frontPosLC & rearPosLC.***\n\
    vec3 frontPosLC;\n\
    vec3 rearPosLC;\n\
    //vec3 scenePosLC;\n\
    posWCRelToEye_to_posLC(frontPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, frontPosLC);\n\
    posWCRelToEye_to_posLC(rearPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, rearPosLC);\n\
\n\
    // Now, with \"frontPosLC\" & \"rearPosLC\", calculate the frontTexCoord3d & rearTexCoord3d.***\n\
    vec3 simulBoxRange = vec3(u_simulBoxMaxPosLC.x - u_simulBoxMinPosLC.x, u_simulBoxMaxPosLC.y - u_simulBoxMinPosLC.y, u_simulBoxMaxPosLC.z - u_simulBoxMinPosLC.z);\n\
\n\
    float contaminationSample = 0.0;\n\
    float smplingCount = 0.0;\n\
    float segmentLength = distance(rearPosLC, frontPosLC);\n\
    vec3 samplingDirLC = normalize(rearPosLC - frontPosLC);\n\
    //vec3 samplingDirCC = normalize(rearPosCC - frontPosCC);\n\
    float samplingsCount = 30.0;\n\
    float increLength = segmentLength / samplingsCount;\n\
    if(increLength < u_voxelSizeMeters.x)\n\
    {\n\
        //increLength = u_voxelSizeMeters.x;\n\
    }\n\
\n\
    //vec3 camRay = normalize(getViewRay(v_tex_pos, 1.0));\n\
    vec3 camRay = normalize(sceneDepthPosCC);\n\
\n\
    vec4 color4Aux = vec4(0.0, 0.0, 0.0, 0.0);\n\
\n\
    vec3 currSamplePosLC = vec3(frontPosLC);\n\
    vec3 step_vector_LC = samplingDirLC * increLength;\n\
    vec4 finalColor4 = vec4(0.0);\n\
    float contaminationAccum = 0.0;\n\
    // u_minMaxPollutionValues\n\
\n\
    vec3 firstPosLC = vec3(frontPosLC);\n\
    int iteration = 0;\n\
    if(!findFirstSamplePosition(frontPosLC, rearPosLC, samplingDirLC, increLength, simulBoxRange, firstPosLC, iteration))\n\
    {\n\
        \n\
        // vec4 colorDiscard = vec4(0.3, 0.3, 0.3, 1.0);\n\
        // gl_FragData[0] = colorDiscard;\n\
\n\
        // #ifdef USE_MULTI_RENDER_TARGET\n\
        //     gl_FragData[1] = colorDiscard;\n\
        //     gl_FragData[2] = colorDiscard;\n\
        //     gl_FragData[3] = colorDiscard;\n\
        // #endif\n\
        \n\
        return;\n\
    }\n\
    \n\
\n\
    // recalculate segmentLength & increLength.***\n\
    samplingsCount = 30.0;\n\
    segmentLength = distance(rearPosLC, firstPosLC);\n\
    increLength = segmentLength / samplingsCount;\n\
\n\
    vec4 colorTest = vec4(0.0, 0.0, 0.5, 1.0);\n\
    colorTest = vec4(firstPosLC.x /u_voxelSizeMeters.x, firstPosLC.y /u_voxelSizeMeters.y, firstPosLC.z /u_voxelSizeMeters.z , 1.0);\n\
\n\
    // if(iteration == 0)\n\
    // {\n\
    //     colorTest = vec4(1.0, 0.0, 0.0, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    // else if(iteration == 1)\n\
    // {\n\
    //     colorTest = vec4(0.0, 1.0, 0.0, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    // else if(iteration == 2)\n\
    // {\n\
    //     colorTest = vec4(0.0, 0.0, 1.0, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    // else if(iteration == 3)\n\
    // {\n\
    //     colorTest = vec4(1.0, 1.0, 0.0, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    // else if(iteration == 4)\n\
    // {\n\
    //     colorTest = vec4(1.0, 0.0, 1.0, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    // else if(iteration == 5)\n\
    // {\n\
    //     colorTest = vec4(0.0, 1.0, 1.0, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    // else if(iteration == 6)\n\
    // {\n\
    //     colorTest = vec4(0.5, 0.0, 0.0, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    // else if(iteration == 7)\n\
    // {\n\
    //     colorTest = vec4(0.0, 0.5, 0.0, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    // else if(iteration == 8)\n\
    // {\n\
    //     colorTest = vec4(0.0, 0.0, 0.5, 1.0);\n\
    //     gl_FragData[0] = colorTest;\n\
\n\
    //     #ifdef USE_MULTI_RENDER_TARGET\n\
    //         gl_FragData[1] = colorTest;\n\
    //         gl_FragData[2] = colorTest;\n\
    //         gl_FragData[3] = colorTest;\n\
    //     #endif\n\
    //     return;\n\
    // }\n\
    \n\
    // Sampling far to near.***\n\
    bool normalLC_calculated = true;\n\
    for(int i=0; i<30; i++)\n\
    {\n\
        \n\
        // Note : for each smple, must depth check with the scene depthTexure.***\n\
        vec3 samplePosLC = firstPosLC + samplingDirLC * increLength * float(i);\n\
\n\
        //vec3 samplePosCC = firstPosLC + samplingDirCC * increLength * float(i);\n\
        //if(abs(samplePosCC.z) > distToCam)\n\
        //{\n\
        //    break;\n\
        //}\n\
\n\
        contaminationSample = 0.0;\n\
        vec3 sampleTexCoord3d = vec3((samplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (samplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (samplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
        checkTexCoord3DRange(sampleTexCoord3d);\n\
\n\
        if(get_pollution_fromTexture3d_triLinearInterpolation(sampleTexCoord3d, samplePosLC, contaminationSample))\n\
        {\n\
            vec3 currNormalLC;\n\
            //if(!normalLC(sampleTexCoord3d, samplePosLC, currNormalLC))\n\
            //{\n\
           //     normalLC_calculated = false;\n\
            //    continue;\n\
            //}\n\
\n\
            vec4 currColor4 = transfer_fnc(contaminationSample);\n\
            currColor4 = getRainbowColor_byHeight(contaminationSample, u_minMaxPollutionValues.x, u_minMaxPollutionValues.y * 0.3, false);\n\
            //vec3 normalizedVelocityLC = normalize(velocityLC);\n\
            //vec4 velocityWC = u_simulBoxTMat * vec4(velocityLC, 1.0);\n\
            //vec4 velocityDirCC = modelViewMatrixRelToEye * vec4(velocityWC.xyz, 1.0);\n\
\n\
            // Now, calculate alpha by normalCC.***\n\
            /*\n\
            vec4 currNormalWC = u_simulBoxTMat * vec4(currNormalLC, 1.0);\n\
            vec4 currNormalCC = modelViewMatrixRelToEye * vec4(currNormalWC.xyz, 1.0);\n\
            vec3 normalCC = normalize(currNormalCC.xyz);\n\
            float dotProd = dot(camRay, normalCC);\n\
\n\
            // Now, accumulate the color.***\n\
            if(dotProd < 0.0)\n\
            {\n\
                currColor4.rgb *= abs(dotProd);\n\
            }\n\
            */\n\
            \n\
\n\
            //vec4 vecAux = abs(vec4(currColor4.rgb, 1.0));\n\
            //currColor4.r = sampleTexCoord3d.x;\n\
            //currColor4.g = sampleTexCoord3d.y;\n\
            //currColor4.b = sampleTexCoord3d.z;\n\
 \n\
            //if(length(currNormalLC) > 0.0)\n\
            {\n\
                // https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl\n\
                finalColor4.rgb += (1.0 - finalColor4.a) * currColor4.a * currColor4.rgb; // test. render normal color:\n\
                finalColor4.a += (1.0 - finalColor4.a) * currColor4.a;\n\
            }\n\
            \n\
            smplingCount += 1.0;\n\
\n\
            // Optimization: break out of the loop when the color is near opaque\n\
            if (finalColor4.a >= 0.95) {\n\
                break;\n\
            }\n\
\n\
            contaminationAccum += contaminationSample;\n\
            //finalColor4.rgb += vec3(contaminationSample, 0.0, 0.0);\n\
            //finalColor4.a += contaminationSample;\n\
            \n\
        }\n\
\n\
\n\
        currSamplePosLC += step_vector_LC;\n\
    }\n\
\n\
    if(smplingCount < 1.0)\n\
    {\n\
        //discard;\n\
    }\n\
\n\
    if(smplingCount < 1.0)\n\
    {\n\
        smplingCount = 1.0;\n\
    }\n\
    /*\n\
    if(smplingCount < 10.0)\n\
    {\n\
        color4Aux = vec4(1.0, 0.0, 0.0, 0.7);\n\
    }\n\
    else if(smplingCount < 20.0)\n\
    {\n\
        color4Aux = vec4(0.0, 1.0, 0.0, 0.7);\n\
    }\n\
    else if(smplingCount < 30.0)\n\
    {\n\
        color4Aux = vec4(0.0, 0.0, 1.0, 0.7);\n\
    }\n\
    else if(smplingCount < 40.0)\n\
    {\n\
        color4Aux = vec4(1.0, 1.0, 0.0, 0.7);\n\
    }\n\
    else\n\
    {\n\
        color4Aux = vec4(1.0, 0.0, 1.0, 0.7);\n\
    }\n\
    */\n\
\n\
    //vec4 rainbowColor = getRainbowColor_byHeight(contaminationAccum/smplingCount, u_minMaxPollutionValues.x, u_minMaxPollutionValues.y, false);\n\
\n\
\n\
    //float finalAlpha = finalColor4.a;\n\
    //finalAlpha *= 2.0;\n\
    //if(finalAlpha > 1.0)\n\
    //{\n\
    //    finalAlpha = 1.0;\n\
    //}\n\
    //finalColor4.a = finalAlpha;\n\
    color4Aux = finalColor4;\n\
\n\
    if(!normalLC_calculated)\n\
    {\n\
        //color4Aux = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
\n\
    gl_FragData[0] = color4Aux;\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = color4Aux;\n\
        gl_FragData[2] = color4Aux;\n\
        gl_FragData[3] = color4Aux;\n\
    #endif\n\
}\n\
\n\
/*\n\
uniform sampler3D tex;\n\
uniform sampler3D normals;\n\
uniform sampler2D colorMap;\n\
\n\
uniform mat4 transform;\n\
uniform int depthSampleCount;\n\
uniform float zScale;\n\
\n\
uniform vec3 lightPosition;\n\
\n\
uniform float brightness;\n\
\n\
//uniform vec4 opacitySettings;\n\
// x: minLevel\n\
// y: maxLevel\n\
// z: lowNode\n\
// w: highNode\n\
\n\
in vec2 texCoord;\n\
\n\
//in vec4 origin;\n\
//in vec4 direction;\n\
\n\
out vec4 color;\n\
\n\
vec3 ambientLight = vec3(0.34, 0.32, 0.32);\n\
vec3 directionalLight = vec3(0.5, 0.5, 0.5);\n\
vec3 lightVector = normalize(vec3(-1.0, -1.0, 1.0));\n\
vec3 specularColor = vec3(0.5, 0.5, 0.5);\n\
\n\
vec3 aabb[2] = vec3[2](\n\
	vec3(0.0, 0.0, 0.0),\n\
	vec3(1.0, 1.0, 1.0)\n\
);\n\
\n\
struct Ray {\n\
    vec3 origin;\n\
    vec3 direction;\n\
    vec3 inv_direction;\n\
    int sign[3];\n\
};\n\
\n\
Ray makeRay(vec3 origin, vec3 direction) {\n\
    vec3 inv_direction = vec3(1.0) / direction;\n\
    \n\
    return Ray(\n\
        origin,\n\
        direction,\n\
        inv_direction,\n\
        int[3](\n\
			((inv_direction.x < 0.0) ? 1 : 0),\n\
			((inv_direction.y < 0.0) ? 1 : 0),\n\
			((inv_direction.z < 0.0) ? 1 : 0)\n\
		)\n\
    );\n\
}\n\
\n\
/*\n\
	From: https://github.com/hpicgs/cgsee/wiki/Ray-Box-Intersection-on-the-GPU\n\
void intersect(\n\
    in Ray ray, in vec3 aabb[2],\n\
    out float tmin, out float tmax\n\
){\n\
    float tymin, tymax, tzmin, tzmax;\n\
    tmin = (aabb[ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;\n\
    tmax = (aabb[1-ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;\n\
    tymin = (aabb[ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;\n\
    tymax = (aabb[1-ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;\n\
    tzmin = (aabb[ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;\n\
    tzmax = (aabb[1-ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;\n\
    tmin = max(max(tmin, tymin), tzmin);\n\
    tmax = min(min(tmax, tymax), tzmax);\n\
}\n\
*/\n\
\n\
\n\
/*\n\
\n\
void main(){\n\
	\n\
	//transform = inverse(transform);\n\
	\n\
	vec4 origin = vec4(0.0, 0.0, 2.0, 1.0);\n\
	origin = transform * origin;\n\
	origin = origin / origin.w;\n\
	origin.z = origin.z / zScale;\n\
	origin = origin + 0.5;\n\
\n\
	vec4 image = vec4(texCoord, 4.0, 1.0);\n\
	image = transform * image;\n\
	//image = image / image.w;\n\
	image.z = image.z / zScale;\n\
	image = image + 0.5;\n\
	//vec4 direction = vec4(0.0, 0.0, 1.0, 0.0);\n\
	vec4 direction = normalize(origin-image);\n\
	//direction = transform * direction;\n\
\n\
	Ray ray = makeRay(origin.xyz, direction.xyz);\n\
	float tmin = 0.0;\n\
	float tmax = 0.0;\n\
	intersect(ray, aabb, tmin, tmax);\n\
\n\
	vec4 value = vec4(0.0, 0.0, 0.0, 0.0);\n\
,\n\
	if(tmin > tmax){\n\
		color = value;\n\
		discard;\n\
	}\n\
\n\
	vec3 start = origin.xyz + tmin*direction.xyz;\n\
	vec3 end = origin.xyz + tmax*direction.xyz;\n\
	\n\
	float length = distance(end, start);\n\
	int sampleCount = int(float(depthSampleCount)*length);\n\
	//vec3 increment = (end-start)/float(sampleCount);\n\
	//vec3 originOffset = mod((start-origin.xyz), increment);\n\
\n\
	float s = 0.0;\n\
	float px = 0.0;\n\
	vec4 pxColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
	vec3 texCo = vec3(0.0, 0.0, 0.0);\n\
	vec3 normal = vec3(0.0, 0.0, 0.0);\n\
	vec4 zero = vec4(0.0);\n\
	\n\
	for(int count = 0; count < sampleCount; count++){\n\
\n\
		texCo = mix(start, end, float(count)/float(sampleCount));// - originOffset;\n\
\n\
		//texCo = start + increment*float(count);\n\
		px = texture(tex, texCo).r;\n\
\n\
		\n\
		//px = length(texture(normals, texCo).xyz - 0.5);\n\
		//px = px * 1.5;\n\
		\n\
		pxColor = texture(colorMap, vec2(px, 0.0));\n\
		\n\
		normal = normalize(texture(normals, texCo).xyz - 0.5);\n\
		float directional = clamp(dot(normal, lightVector), 0.0, 1.0);\n\
\n\
		//vec3 R = -reflect(lightDirection, surfaceNormal);\n\
		//return pow(max(0.0, dot(viewDirection, R)), shininess);\n\
\n\
		float specular = max(dot(direction.xyz, reflect(lightVector, normal)), 0.0);\n\
		specular = pow(specular, 3.0);\n\
\n\
		pxColor.rgb = ambientLight*pxColor.rgb + directionalLight*directional*pxColor.rgb + pxColor.a*specular*specularColor;\n\
			\n\
		\n\
		//value = mix(value, pxColor, px);\n\
		//value = (1.0-value.a)*pxColor + value;\n\
		//value = mix(pxColor, zero, value.a) + value;\n\
		\n\
		value = value + pxColor - pxColor*value.a;\n\
		\n\
		if(value.a >= 0.95){\n\
			break;\n\
		}\n\
	}\n\
	color = value*brightness;\n\
}\n\
*/\n\
";
ShaderSource.AnimatedIconFS = "precision highp float;\n\
\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
varying vec2 v_texcoord;\n\
uniform bool textureFlipYAxis;\n\
uniform sampler2D u_texture;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform vec4 oneColor4;\n\
\n\
uniform vec2 imageSize;\n\
uniform int uFrustumIdx;\n\
\n\
\n\
varying vec2 imageSizeInPixels;\n\
varying float vDepth;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void make_kernel(inout vec4 n[9], vec2 coord)\n\
{\n\
	float w = 1.0 / imageSize.x;\n\
	float h = 1.0 / imageSize.y;\n\
\n\
	n[0] = texture2D(u_texture, coord + vec2( -w, -h));\n\
	n[1] = texture2D(u_texture, coord + vec2(0.0, -h));\n\
	n[2] = texture2D(u_texture, coord + vec2(  w, -h));\n\
	n[3] = texture2D(u_texture, coord + vec2( -w, 0.0));\n\
	n[4] = texture2D(u_texture, coord);\n\
	n[5] = texture2D(u_texture, coord + vec2(  w, 0.0));\n\
	n[6] = texture2D(u_texture, coord + vec2( -w, h));\n\
	n[7] = texture2D(u_texture, coord + vec2(0.0, h));\n\
	n[8] = texture2D(u_texture, coord + vec2(  w, h));\n\
}\n\
\n\
void main()\n\
{\n\
    vec4 textureColor;\n\
	vec2 finalTexCoord = v_texcoord;\n\
\n\
	// 1rst, check if the texture.w != 0.\n\
	if(textureFlipYAxis)\n\
	{\n\
		finalTexCoord = vec2(v_texcoord.s, 1.0 - v_texcoord.t);\n\
	}\n\
	\n\
	textureColor = texture2D(u_texture, finalTexCoord);\n\
\n\
	if(textureColor.w == 0.0)\n\
	{\n\
		discard;\n\
	}\n\
\n\
	// now, check neibourgh pixels to determine a silhouette.***\n\
	//if(textureColor.a == 0.0)\n\
	//{\n\
	//	vec4 n[9];\n\
	//	make_kernel(n, finalTexCoord);\n\
	//\n\
	//	for(int i=0; i<9; i++)\n\
	//	{\n\
	//		// check if exist one or more neibourgh pixel with alpha != 0.0.***\n\
	//		if(n[i].a > 0.0)\n\
	//		{\n\
	//			textureColor = vec4(1.0, 1.0, 1.0, 0.5);\n\
	//			break;\n\
	//		}\n\
	//	}\n\
	//}\n\
	\n\
\n\
\n\
	if(colorType == 2)\n\
	{\n\
		// do nothing.\n\
	}\n\
	else if( colorType == 0)\n\
	{\n\
		textureColor = oneColor4;\n\
	}\n\
\n\
    //gl_FragColor = textureColor;\n\
	gl_FragData[0] = textureColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		gl_FragData[1] = packDepth(0.0);\n\
		//gl_FragData[1] = packDepth(vDepth);\n\
		\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.005; // frustum zero.\n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = textureColor; \n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	//}\n\
	#endif\n\
}";
ShaderSource.AnimatedIconVS = "attribute vec4 position;\n\
attribute vec2 texCoord;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 modelViewMatrixRelToEye;  \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;  \n\
uniform mat4 projectionMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec2 scale2d;\n\
uniform vec2 size2d;\n\
uniform vec3 aditionalOffset;\n\
uniform vec2 imageSize;\n\
uniform float screenWidth;    \n\
uniform float screenHeight;\n\
uniform bool bUseOriginalImageSize;\n\
\n\
uniform int uMosaicSize[2];\n\
uniform int uSubImageIdx; // mosaicTex = numCols * numRows = subImagesArray.***\n\
\n\
varying vec2 v_texcoord;\n\
varying vec2 imageSizeInPixels;\n\
\n\
void main()\n\
{\n\
    vec4 position2 = vec4(position.xyz, 1.0);\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	//imageSizeInPixels = vec2(imageSize.x, imageSize.y);\n\
	\n\
	float order_w = position.w;\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
	\n\
	vec4 projected = ModelViewProjectionMatrixRelToEye * pos4;\n\
	//vec4 projected2 = modelViewMatrixRelToEye * pos4;\n\
\n\
	// Now, calculate the pixelSize in the plane of the projected point.\n\
	float pixelWidthRatio = 2. / ((screenWidth));// * projectionMatrix[0][0]);\n\
	// alternative : float pixelWidthRatio = 2. / (screenHeight * projectionMatrix[1][1]);\n\
	float pixelWidth = projected.w * pixelWidthRatio;\n\
\n\
	//float pixelHeightRatio = pixelWidthRatio * (screenHeight/screenWidth); // no works correctly.\n\
	float pixelHeightRatio = 2. / ((screenHeight));\n\
	float pixelHeight = projected.w * pixelHeightRatio;\n\
	\n\
	if(projected.w < 5.0)\n\
		pixelWidth = 5.0 * pixelWidthRatio;\n\
\n\
	//pixelHeight = pixelWidth;\n\
	\n\
	vec4 offset;\n\
	float offsetX;\n\
	float offsetY;\n\
	if(bUseOriginalImageSize)\n\
	{\n\
		offsetX = pixelWidth*imageSize.x/2.0;\n\
		offsetY = pixelHeight*imageSize.y/2.0;\n\
	}\n\
	else{\n\
		offsetX = pixelWidth*size2d.x/2.0;\n\
		offsetY = pixelHeight*size2d.y/2.0;\n\
	}\n\
	\n\
	// Offset our position along the normal\n\
	if(orderInt == 1)\n\
	{\n\
		offset = vec4(-offsetX*scale2d.x, 0.0, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == -1)\n\
	{\n\
		offset = vec4(offsetX*scale2d.x, 0.0, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == 2)\n\
	{\n\
		offset = vec4(-offsetX*scale2d.x, offsetY*2.0*scale2d.y, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == -2)\n\
	{\n\
		offset = vec4(offsetX*scale2d.x, offsetY*2.0*scale2d.y, 0.0, 1.0);\n\
	}\n\
\n\
	gl_Position = projected + offset + vec4(aditionalOffset.x*pixelWidth, aditionalOffset.y*pixelWidth, aditionalOffset.z*pixelWidth, 0.0); \n\
\n\
	// Now, calculate the texCoords.***\n\
	// uMosaicSize = colsCount, rowsCount.***\n\
	float colsCount = float(uMosaicSize[0]);\n\
	float rowsCount = float(uMosaicSize[1]);\n\
\n\
	// var idx = col + row * numCols;\n\
	// row = floor(idx / numCols).\n\
	// col = idx - row * numCols.\n\
\n\
	float row = floor((float(uSubImageIdx) + 0.1 )/ colsCount);\n\
	float col = float(uSubImageIdx) - row * colsCount;\n\
\n\
	vec2 subTexCoordSize = vec2(1.0 / colsCount, 1.0 / rowsCount);\n\
\n\
	v_texcoord = vec2(subTexCoordSize.x * col + texCoord.x * subTexCoordSize.x, \n\
						subTexCoordSize.y * row + texCoord.y * subTexCoordSize.y);\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.atmosphereFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
varying vec4 vcolor4;\n\
\n\
void main()\n\
{  \n\
	gl_FragData[0] = vcolor4; \n\
}";
ShaderSource.atmosphereVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec4 color4;\n\
attribute vec2 texCoord;\n\
\n\
uniform sampler2D diffuseTex;\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 ModelViewProjectionMatrix;\n\
uniform mat4 normalMatrix4;\n\
uniform mat4 buildingRotMatrix;  \n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
uniform vec4 oneColor4;\n\
uniform bool bUse1Color;\n\
uniform bool hasTexture;\n\
uniform bool bIsMakingDepth;\n\
uniform float near;\n\
uniform float far;\n\
\n\
varying vec3 vNormal;\n\
varying vec3 v3Pos;\n\
varying vec2 vTexCoord;   \n\
varying vec3 uAmbientColor;\n\
varying vec3 vLightWeighting;\n\
varying vec4 vcolor4;\n\
varying vec3 vertexPos;\n\
varying float depthValue;\n\
varying vec3 camPos;\n\
\n\
const float equatorialRadius = 6378137.0;\n\
const float polarRadius = 6356752.3142;\n\
const float PI = 3.1415926535897932384626433832795;\n\
const float PI_2 = 1.57079632679489661923; \n\
const float PI_4 = 0.785398163397448309616;\n\
\n\
void main()\n\
{	\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	vNormal = (normalMatrix4 * vec4(normal, 1.0)).xyz;\n\
\n\
	if(bIsMakingDepth)\n\
	{\n\
		depthValue = (modelViewMatrixRelToEye * pos4).z/far;\n\
	}\n\
	else\n\
	{\n\
		vTexCoord = texCoord;\n\
	}\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	camPos = encodedCameraPositionMCHigh.xyz + encodedCameraPositionMCLow.xyz;\n\
	v3Pos = vec3((modelViewMatrixRelToEye * pos4).xyz);\n\
\n\
	// Calculate color.\n\
	float distToCam = length(vec3(v3Pos));\n\
	vec3 camDir = normalize(vec3(v3Pos.x, v3Pos.y, v3Pos.z));\n\
	vec3 normal = vNormal;\n\
	float angRad = acos(dot(camDir, normal));\n\
	float angDeg = angRad*180.0/PI;\n\
	/*\n\
	if(angDeg > 130.0)\n\
		textureColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
	else if(angDeg > 120.0)\n\
		textureColor = vec4(0.0, 1.0, 0.0, 1.0);\n\
	else if(angDeg > 110.0)\n\
		textureColor = vec4(0.0, 0.0, 1.0, 1.0);\n\
	else if(angDeg > 100.0)\n\
		textureColor = vec4(1.0, 1.0, 0.0, 1.0);\n\
	else if(angDeg > 90.0)\n\
		textureColor = vec4(1.0, 0.0, 1.0, 1.0);\n\
		*/\n\
		\n\
	//textureColor = vec4(vNormal, 1.0);\n\
\n\
	//float maxAngDeg = 100.5;\n\
	float maxAngDeg = 101.2;\n\
	float minAngDeg = 90.0;\n\
\n\
	float A = 1.0/(maxAngDeg-minAngDeg);\n\
	float B = -A*minAngDeg;\n\
	float alphaReal = A*angDeg+B;\n\
	float alpha2 = alphaReal*alphaReal;\n\
	float alpha = alpha2*alpha2;\n\
	if(alpha < 0.0 )\n\
	alpha = 0.0;\n\
	else if(alpha > 2.0 )\n\
	alpha = 2.0;\n\
	\n\
	float alphaPlusPerDist = 4.0*(distToCam/equatorialRadius);\n\
	if(alphaPlusPerDist > 1.0)\n\
	alphaPlusPerDist = 1.0;\n\
\n\
	float extra = (1.0-alpha);\n\
	if(extra < 0.0)\n\
	extra = 0.0;\n\
\n\
	float extraPerDist = (1.0-alphaPlusPerDist); // near -> more blue.\n\
\n\
	alpha *= alphaPlusPerDist;\n\
	vcolor4 = vec4(alpha*0.75, alpha*0.88 + extra*0.4 + extraPerDist*0.1, alpha + extra*2.5 + extraPerDist*0.8, alpha);\n\
}";
ShaderSource.BoxSsaoFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
  \n\
varying vec4 vcolor4;   \n\
  \n\
\n\
void main()\n\
{ \n\
	vec4 textureColor;\n\
	textureColor = vcolor4;  \n\
	/*\n\
	if(bUseNormal)\n\
    {\n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
		float linearDepth = getDepth(screenPos);          \n\
		vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
		vec3 normal2 = vNormal;   \n\
				\n\
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
		vec3 bitangent = cross(normal2, tangent);\n\
		mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
		\n\
		float occlusion = 0.0;\n\
		for(int i = 0; i < kernelSize; ++i)\n\
		{    	 \n\
			vec3 sample = origin + (tbn * kernel[i]) * radius;\n\
			vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
			offset.xy /= offset.w;\n\
			offset.xy = offset.xy * 0.5 + 0.5;        \n\
			float sampleDepth = -sample.z/far;\n\
			float depthBufferValue = getDepth(offset.xy);				              \n\
			float range_check = abs(linearDepth - depthBufferValue)+radius*0.998;\n\
			if (range_check < radius*1.001 && depthBufferValue <= sampleDepth)\n\
			{\n\
				occlusion +=  1.0;\n\
			}\n\
			\n\
		}   \n\
			\n\
		occlusion = 1.0 - occlusion / float(kernelSize);\n\
									\n\
		vec3 lightPos = vec3(10.0, 10.0, 10.0);\n\
		vec3 L = normalize(lightPos);\n\
		float DiffuseFactor = dot(normal2, L);\n\
		float NdotL = abs(DiffuseFactor);\n\
		vec3 diffuse = vec3(NdotL);\n\
		vec3 ambient = vec3(1.0);\n\
		gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); \n\
		gl_FragColor.a = 1.0; \n\
	}\n\
	else\n\
	{\n\
		gl_FragColor.rgb = vec3(textureColor.xyz); \n\
		gl_FragColor.a = 1.0; \n\
	}	\n\
	*/\n\
	gl_FragData[0] = vec4(textureColor.xyz, 1.0);\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	gl_FragData[3] = vec4(textureColor.xyz, 1.0);\n\
	#endif\n\
}\n\
";
ShaderSource.BoxSsaoVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
uniform mat4 buildingRotMatrix;  \n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
uniform vec4 oneColor4;\n\
uniform bool bUse1Color;\n\
uniform bool bUseNormal;\n\
uniform vec3 scale;\n\
uniform bool bScale;\n\
\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;  \n\
varying vec3 uAmbientColor;\n\
varying vec3 vLightWeighting;\n\
varying vec4 vcolor4;\n\
\n\
void main()\n\
{	\n\
    vec4 position2 = vec4(position.xyz, 1.0);\n\
    if(bScale)\n\
    {\n\
        position2.x *= scale.x;\n\
        position2.y *= scale.y;\n\
        position2.z *= scale.z;\n\
    }\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz + aditionalPosition.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    if(bUseNormal)\n\
    {\n\
		vec4 rotatedNormal = buildingRotMatrix * vec4(normal.xyz, 1.0);\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8, 0.8, 0.8);\n\
		vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);\n\
		vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
	}\n\
    if(bUse1Color)\n\
    {\n\
        vcolor4 = oneColor4;\n\
    }\n\
    else\n\
    {\n\
        vcolor4 = color4;\n\
    }\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.chemicalAccident2DFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D texture_0; \n\
uniform sampler2D texture_1;\n\
\n\
uniform bool textureFlipYAxis;\n\
\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
//uniform float screenWidth;    \n\
//uniform float screenHeight;     \n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform float externalAlpha; // used by effects.\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
uniform int uFrustumIdx;\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
uniform float uInterpolationFactor;\n\
uniform vec2 uMinMaxQuantizedValues_tex0;\n\
uniform vec2 uMinMaxQuantizedValues_tex1;\n\
uniform vec2 uMinMaxValues;\n\
uniform vec2 uMinMaxValuesToRender;\n\
\n\
uniform int uRenderBorder;\n\
uniform int uRenderingColorType; // 0= rainbow, 1= monotone.\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
\n\
varying float vDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec4 packDepth( float v ) {\n\
	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	enc = fract(enc);\n\
	enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
	return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depthAux = dot(rgba_depth, bit_shift);\n\
    return depthAux;\n\
}  \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
/*\n\
// unpack depth used for shadow on screen.***\n\
float unpackDepth_A(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
*/\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );\n\
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);\n\
}             \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
\n\
\n\
/*\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/screenWidth;\n\
    float pixelSizeY = 1.0/screenHeight;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<1.0; i++)\n\
	{\n\
		depthA += getDepth(texCoord + offset1*(1.0+i));\n\
		depthB += getDepth(texCoord + offset2*(1.0+i));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
mat3 sx = mat3( \n\
    1.0, 2.0, 1.0, \n\
    0.0, 0.0, 0.0, \n\
    -1.0, -2.0, -1.0 \n\
);\n\
mat3 sy = mat3( \n\
    1.0, 0.0, -1.0, \n\
    2.0, 0.0, -2.0, \n\
    1.0, 0.0, -1.0 \n\
);\n\
\n\
bool isEdge()\n\
{\n\
	vec3 I[3];\n\
	vec2 screenPos = vec2((gl_FragCoord.x) / screenWidth, (gl_FragCoord.y) / screenHeight);\n\
	float linearDepth = getDepth(screenPos);\n\
	vec3 normal = normal_from_depth(linearDepth, screenPos);\n\
\n\
    for (int i=0; i<3; i++) {\n\
        //vec3 norm1 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,-1), 0 ).rgb * 2.0f - 1.0f;\n\
        //vec3 norm2 =  texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,0), 0 ).rgb * 2.0f - 1.0f;\n\
        //vec3 norm3 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,1), 0 ).rgb * 2.0f - 1.0f;\n\
		vec2 screenPos1 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-1.0) / screenHeight);\n\
		float linearDepth1 = getDepth(screenPos1);  \n\
\n\
		vec2 screenPos2 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-0.0) / screenHeight);\n\
		float linearDepth2 = getDepth(screenPos2);  \n\
\n\
		vec2 screenPos3 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y+1.0) / screenHeight);\n\
		float linearDepth3 = getDepth(screenPos1);  \n\
\n\
		vec3 norm1 = normal_from_depth(linearDepth1, screenPos1);\n\
        vec3 norm2 =  normal_from_depth(linearDepth2, screenPos2);\n\
        vec3 norm3 = normal_from_depth(linearDepth3, screenPos3);\n\
        float sampleValLeft  = dot(normal, norm1);\n\
        float sampleValMiddle  = dot(normal, norm2);\n\
        float sampleValRight  = dot(normal, norm3);\n\
        I[i] = vec3(sampleValLeft, sampleValMiddle, sampleValRight);\n\
    }\n\
\n\
    float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); \n\
    float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);\n\
\n\
    if((gx < 0.0 && gy < 0.0) || (gy < 0.0 && gx < 0.0) ) \n\
        return false;\n\
	float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));\n\
\n\
    if(g > 0.2) {\n\
        return true;\n\
    } \n\
	return false;\n\
}\n\
*/\n\
\n\
float unQuantize(float quantizedValue, float minVal, float maxVal)\n\
{\n\
	float unquantizedValue = quantizedValue * (maxVal - minVal) + minVal;\n\
	return unquantizedValue;\n\
}\n\
\n\
vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)\n\
{\n\
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 0.9999; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
\n\
    float value = gray * 3.99;\n\
    float h = floor(value);\n\
    float f = fract(value);\n\
\n\
    vec4 resultColor = vec4(0.0, 0.0, 0.0, gray);\n\
\n\
    if(hotToCold)\n\
    {\n\
        // HOT to COLD.***\n\
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix red & yellow.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(red, yellow, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix yellow & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, green, f);\n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & cyan.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(green, cyan, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix cyan & blue.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, blue, f);\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // COLD to HOT.***\n\
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix blue & cyan.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(blue, cyan, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix cyan & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, green, f);  \n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & yellow.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(green, yellow, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix yellow & red.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, red, f);\n\
        }\n\
    }\n\
\n\
    return resultColor;\n\
}\n\
\n\
void main()\n\
{\n\
	vec4 textureColor;\n\
	vec4 textureColor_0;\n\
	vec4 textureColor_1;\n\
\n\
	float realPollutionVal_0 = 0.0;\n\
	float realPollutionVal_1 = 0.0;\n\
\n\
    float quantized_0 = 0.0;\n\
    float quantized_1 = 0.0;\n\
\n\
	vec2 finalTexCoord = vTexCoord;\n\
	if(textureFlipYAxis)\n\
	{\n\
		finalTexCoord = vec2(vTexCoord.s, 1.0 - vTexCoord.t);\n\
	}\n\
\n\
    if(uRenderBorder == 1)\n\
    {\n\
        float minTexCoordVal = 0.005;\n\
        if(finalTexCoord.x < minTexCoordVal || finalTexCoord.x > 1.0 - minTexCoordVal || finalTexCoord.y < minTexCoordVal || finalTexCoord.y > 1.0 - minTexCoordVal) \n\
        {\n\
            gl_FragData[0] = vec4(0.0, 0.0, 0.5, 1.0);\n\
\n\
            #ifdef USE_MULTI_RENDER_TARGET\n\
            {\n\
                // save depth, normal, albedo.\n\
                float depthAux = vDepth;\n\
                gl_FragData[1] = packDepth(depthAux); \n\
\n\
                // When render with cull_face disabled, must correct the faces normal.\n\
                float frustumIdx = 1.0;\n\
                if(uFrustumIdx == 0)\n\
                frustumIdx = 0.005;\n\
                else if(uFrustumIdx == 1)\n\
                frustumIdx = 0.015;\n\
                else if(uFrustumIdx == 2)\n\
                frustumIdx = 0.025;\n\
                else if(uFrustumIdx == 3)\n\
                frustumIdx = 0.035;\n\
\n\
                vec3 normal = vNormal;\n\
\n\
                vec3 encodedNormal = encodeNormal(normal);\n\
                gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
                // albedo.\n\
                gl_FragData[3] = vec4(0.0, 0.0, 0.5, 1.0);\n\
\n\
                // selColor4 (if necessary).\n\
                gl_FragData[4] = uSelColor4; \n\
            }\n\
            #endif\n\
            \n\
            return;\n\
        }\n\
    }\n\
\n\
    if(colorType == 2)\n\
    {\n\
        textureColor_0 = texture2D(texture_0, finalTexCoord);\n\
        textureColor_1 = texture2D(texture_1, finalTexCoord);\n\
\n\
        quantized_0 = UnpackDepth32(textureColor_0);\n\
        quantized_1 = UnpackDepth32(textureColor_1);\n\
\n\
        realPollutionVal_0 = unQuantize(quantized_0, uMinMaxQuantizedValues_tex0.x, uMinMaxQuantizedValues_tex0.y);\n\
        realPollutionVal_1 = unQuantize(quantized_1, uMinMaxQuantizedValues_tex1.x, uMinMaxQuantizedValues_tex1.y);\n\
    }\n\
    else if(colorType == 0)\n\
	{\n\
        textureColor = oneColor4;\n\
    }\n\
	else if(colorType == 1)\n\
	{\n\
        textureColor = vColor4;\n\
    }\n\
	\n\
    vec4 finalColor;\n\
	float realPollutionValue = mix(realPollutionVal_0, realPollutionVal_1, uInterpolationFactor);\n\
\n\
    if(uRenderingColorType == 0)\n\
    {\n\
        float realPollutionQuantized = (realPollutionValue - uMinMaxValuesToRender.x) / (uMinMaxValuesToRender.y - uMinMaxValuesToRender.x);\n\
        if(realPollutionQuantized > 1.0){ realPollutionQuantized = 0.9999; }\n\
        else if(realPollutionQuantized < 0.0){ realPollutionQuantized = 0.0; }\n\
\n\
        bool hotToCold = false;\n\
	    //finalColor = getRainbowColor_byHeight(realPollutionQuantized, uMinMaxValues.x, uMinMaxValues.y, hotToCold);\n\
        finalColor = getRainbowColor_byHeight(realPollutionQuantized, 0.0, 1.0, hotToCold);\n\
    }\n\
    else if(uRenderingColorType == 1)\n\
    {\n\
        // monotone.***\n\
        float realPollutionQuantizedMonotone = (realPollutionValue - uMinMaxValuesToRender.x) / (uMinMaxValuesToRender.y - uMinMaxValuesToRender.x);\n\
        float gray = realPollutionQuantizedMonotone;\n\
        if (gray > 1.0){ gray = 0.9999; }\n\
        else if (gray<0.0){ gray = 0.0; }\n\
\n\
        finalColor = vec4(gray, 0.0, 0.0, gray);\n\
    }\n\
	\n\
	// //vec4 intensity4 = vec4(1.0 - pollutionValue, 1.0 - pollutionValue, 1.0 - pollutionValue, pollutionValue * 10.0);\n\
	// vec4 intensity4 = vec4(pollutionValue, 1.0 - pollutionValue, pollutionValue, pollutionValue * 10.0);\n\
	// //vec4 pollutionColor = vec4(0.5, 1.0, 0.1, 1.0); // original green.***\n\
	// vec4 pollutionColor = vec4(rainbowColor4.rgb, 1.0);\n\
	// finalColor = mix(intensity4, pollutionColor, pollutionValue);\n\
\n\
    // // test.***\n\
    // finalColor = vec4(rainbowColor4.rgb, rainbowColor4.a * 15.0);\n\
\n\
    // if(finalTexCoord.x < 0.005 || finalTexCoord.x > 0.995 || finalTexCoord.y < 0.005 || finalTexCoord.y > 0.995) \n\
    // {\n\
    //     finalColor = vec4(0.25, 0.5, 0.99, 0.6);\n\
    // }\n\
\n\
    gl_FragData[0] = finalColor; // test.***\n\
\n\
\n\
	vec4 albedo4 = finalColor;\n\
\n\
    \n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	{\n\
		// save depth, normal, albedo.\n\
		float depthAux = vDepth;\n\
		gl_FragData[1] = packDepth(depthAux); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.chemicalAccident2DVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying vec3 vertexPosLC;\n\
	varying vec4 vColor4; // color from attributes\n\
	varying vec3 vLightDir; \n\
	varying vec3 vNormalWC; \n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	varying float vDepth;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
		currentTMat = mat3(buildingRotMatrix);\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		\n\
		\n\
		uAmbientColor = vec3(1.0);\n\
		vNormalWC = rotatedNormal;\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
		vLightDir = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		float directionalLightWeighting = 1.0;\n\
\n\
\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
		\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		vDepth = -orthoPos.z/far;\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
\n\
		gl_PointSize = 5.0;\n\
	}";
ShaderSource.chemicalAccidentVolumRenderFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    //precision lowp float;\n\
    //precision lowp int;\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
// https://draemm.li/various/volumeRendering/webgl2/\n\
\n\
    //*********************************************************\n\
    // R= right, F= front, U= up, L= left, B= back, D= down.\n\
    // RFU = x, y, z.\n\
    // LBD = -x, -y, -z.\n\
    //*********************************************************\n\
\n\
    //      +-----------------+\n\
	//      |                 |          \n\
	//      |   screen size   |  \n\
	//      |                 | \n\
	//      +-----------------+\n\
	//      +-----------------+----------------+\n\
	//      |                 |                | \n\
	//      |   front depth   |   rear depth   |\n\
	//      |                 |                |\n\
	//      +-----------------+----------------+\n\
	\n\
uniform sampler2D simulationBoxDoubleDepthTex;\n\
uniform sampler2D simulationBoxDoubleNormalTex; // used to calculate the current frustum idx.***\n\
uniform sampler2D pollutionMosaicTex; // pollutionTex. (from chemical accident).***\n\
uniform sampler2D sceneDepthTex; // scene depth texture.***\n\
uniform sampler2D sceneNormalTex; // scene normal texture.***\n\
uniform sampler2D cuttingPlaneDepthTex;\n\
uniform sampler2D cuttingPlaneNormalTex;\n\
\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform vec3 u_voxelSizeMeters;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform vec2 u_minMaxPollutionValues;\n\
uniform vec2 u_minMaxPollutionValuesToRender;\n\
uniform float u_airEnvirontmentPressure;\n\
uniform vec2 u_screenSize;\n\
uniform vec2 uNearFarArray[4];\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
uniform vec2 uMinMaxAltitudeSlices[32]; // limited to 32 slices.***\n\
uniform int u_cuttingPlaneIdx;\n\
uniform int u_useMinMaxValuesToRender;\n\
uniform vec4 u_cuttingPlanePosLC;\n\
\n\
uniform mat4 u_simulBoxTMat;\n\
uniform mat4 u_simulBoxTMatInv;\n\
uniform vec3 u_simulBoxPosHigh;\n\
uniform vec3 u_simulBoxPosLow;\n\
uniform vec3 u_simulBoxMinPosLC;\n\
uniform vec3 u_simulBoxMaxPosLC;\n\
\n\
\n\
\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
	//	// flogz = 1.0 + gl_Position.z*0.0001;\n\
    //    float Fcoef_half = uFCoef_logDepth/2.0;\n\
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
	//	float z = (flogzAux - 1.0);\n\
	//	linearDepth = z/(far);\n\
	//	return linearDepth;\n\
	//}\n\
	//else{\n\
		return unpackDepth(texture2D(sceneDepthTex, coord.xy));\n\
	//}\n\
}\n\
\n\
float getDepth_simulationBox(vec2 coord)\n\
{\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
	//	// flogz = 1.0 + gl_Position.z*0.0001;\n\
    //    float Fcoef_half = uFCoef_logDepth/2.0;\n\
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
	//	float z = (flogzAux - 1.0);\n\
	//	linearDepth = z/(far);\n\
	//	return linearDepth;\n\
	//}\n\
	//else{\n\
		return unpackDepth(texture2D(simulationBoxDoubleDepthTex, coord.xy));\n\
	//}\n\
}\n\
\n\
float getDepth_cuttingPlane(vec2 coord)\n\
{\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
	//	// flogz = 1.0 + gl_Position.z*0.0001;\n\
    //    float Fcoef_half = uFCoef_logDepth/2.0;\n\
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
	//	float z = (flogzAux - 1.0);\n\
	//	linearDepth = z/(far);\n\
	//	return linearDepth;\n\
	//}\n\
	//else{\n\
		return unpackDepth(texture2D(cuttingPlaneDepthTex, coord.xy));\n\
	//}\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(sceneNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
\n\
vec4 getNormal_simulationBox(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
vec4 getNormal_cuttingPlane(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(cuttingPlaneNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
void get_FrontAndRear_depthTexCoords(in vec2 texCoord, inout vec2 frontTexCoord, inout vec2 rearTexCoord)\n\
{\n\
    //      +-----------------+\n\
	//      |                 |          \n\
	//      |   screen size   |  \n\
	//      |                 | \n\
	//      +-----------------+\n\
	//      +-----------------+----------------+\n\
	//      |                 |                | \n\
	//      |   front depth   |   rear depth   |\n\
	//      |                 |                |\n\
	//      +-----------------+----------------+\n\
    vec2 normalTexSize = vec2(u_screenSize.x * 2.0, u_screenSize.y); // the normal tex width is double of the screen size width.***\n\
    //vec2 frontNormalFragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);\n\
    //vec2 rearNormalFragCoord = vec2(gl_FragCoord.x + u_screenSize.x, gl_FragCoord.y);\n\
    float windows_x = texCoord.x * u_screenSize.x;\n\
    float windows_y = texCoord.y * u_screenSize.y;\n\
    vec2 frontNormalFragCoord = vec2(windows_x, windows_y);\n\
    vec2 rearNormalFragCoord = vec2(windows_x + u_screenSize.x, windows_y);\n\
\n\
    frontTexCoord = vec2(frontNormalFragCoord.x / normalTexSize.x, frontNormalFragCoord.y / normalTexSize.y);\n\
    rearTexCoord = vec2(rearNormalFragCoord.x / normalTexSize.x, rearNormalFragCoord.y / normalTexSize.y);\n\
}\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
void get_FrontAndRear_posCC(in vec2 screenPos, in float currFar_rear, in float currFar_front, inout vec3 frontPosCC, inout vec3 rearPosCC)\n\
{\n\
    vec2 frontTexCoord;\n\
    vec2 rearTexCoord;\n\
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);\n\
\n\
    // If the linear depth is 1, then, take the camPos as the position, so, pos = (0.0, 0.0, 0.0).***\n\
    //vec4 depthColor4 = texture2D(simulationBoxDoubleDepthTex, screenPos);\n\
    //float depthColLength = length(depthColor4);\n\
\n\
    // Front posCC.***\n\
    float frontLinearDepth = getDepth_simulationBox(frontTexCoord);\n\
    if(frontLinearDepth < 1e-8)\n\
    {\n\
        frontPosCC = vec3(0.0);\n\
    }\n\
    else\n\
    {\n\
        float front_zDist = frontLinearDepth * currFar_front; \n\
        frontPosCC = getViewRay(screenPos, front_zDist);\n\
    }\n\
\n\
    // Rear posCC.***\n\
    float rearLinearDepth = getDepth_simulationBox(rearTexCoord);\n\
    if(rearLinearDepth < 1e-8)\n\
    {\n\
        rearPosCC = vec3(0.0);\n\
    }\n\
    else\n\
    {\n\
        float rear_zDist = rearLinearDepth * currFar_rear; \n\
        rearPosCC = getViewRay(screenPos, rear_zDist);\n\
    }\n\
}\n\
\n\
void get_cuttingPlane_posCC(in vec2 screenPos, in float currFar, inout vec3 posCC)\n\
{\n\
\n\
    // posCC.***\n\
    float frontLinearDepth = getDepth_cuttingPlane(screenPos);\n\
    if(frontLinearDepth < 1e-8)\n\
    {\n\
        posCC = vec3(0.0);\n\
    }\n\
    else\n\
    {\n\
        float front_zDist = frontLinearDepth * currFar; \n\
        posCC = getViewRay(screenPos, front_zDist);\n\
    }\n\
}\n\
\n\
void posWCRelToEye_to_posLC(in vec4 posWC_relToEye, in mat4 local_mat4Inv, in vec3 localPosHIGH, in vec3 localPosLOW, inout vec3 posLC)\n\
{\n\
    vec3 highDifferenceSun = -localPosHIGH.xyz + encodedCameraPositionMCHigh;\n\
	vec3 lowDifferenceSun = posWC_relToEye.xyz -localPosLOW.xyz + encodedCameraPositionMCLow;\n\
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
	vec4 vPosRelToLight = local_mat4Inv * pos4Sun;\n\
\n\
	posLC = vPosRelToLight.xyz / vPosRelToLight.w;\n\
}\n\
\n\
void checkTexCoordRange(inout vec2 texCoord)\n\
{\n\
    float error = 0.0;\n\
    if(texCoord.x < 0.0)\n\
    {\n\
        texCoord.x = 0.0 + error;\n\
    }\n\
    else if(texCoord.x > 1.0)\n\
    {\n\
        texCoord.x = 1.0 - error;\n\
    }\n\
\n\
    if(texCoord.y < 0.0)\n\
    {\n\
        texCoord.y = 0.0 + error;\n\
    }\n\
    else if(texCoord.y > 1.0)\n\
    {\n\
        texCoord.y = 1.0 - error;\n\
    }\n\
}\n\
\n\
void checkTexCoord3DRange(inout vec3 texCoord)\n\
{\n\
    float error = 0.0;\n\
    if(texCoord.x < 0.0)\n\
    {\n\
        texCoord.x = 0.0 + error;\n\
    }\n\
    else if(texCoord.x > 1.0)\n\
    {\n\
        texCoord.x = 1.0 - error;\n\
    }\n\
\n\
    if(texCoord.y < 0.0)\n\
    {\n\
        texCoord.y = 0.0 + error;\n\
    }\n\
    else if(texCoord.y > 1.0)\n\
    {\n\
        texCoord.y = 1.0 - error;\n\
    }\n\
\n\
    if(texCoord.z < 0.0)\n\
    {\n\
        texCoord.z = 0.0 + error;\n\
    }\n\
    else if(texCoord.z > 1.0)\n\
    {\n\
        texCoord.z = 1.0 - error;\n\
    }\n\
}\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col_mosaic, in int row_mosaic)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    checkTexCoordRange(subTexCoord);\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    float s = float(col_mosaic) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row_mosaic) * tRange + subTexCoord.y * tRange;\n\
\n\
    // must check if the texCoord_tl is boundary in x & y.***************************************************************************\n\
    float mosaicTexSize_x = float(u_texSize[0] * u_mosaicSize[0]); // for example : 150 pixels * 3 columns = 450 pixels.***\n\
    float mosaicTexSize_y = float(u_texSize[1] * u_mosaicSize[1]); // for example : 150 pixels * 3 rows = 450 pixels.***\n\
\n\
    float currMosaicStart_x = float(col_mosaic * u_texSize[0]);\n\
    float currMosaicStart_y = float(row_mosaic * u_texSize[1]);\n\
    float currMosaicEnd_x = currMosaicStart_x + float(u_texSize[0]);\n\
    float currMosaicEnd_y = currMosaicStart_y + float(u_texSize[1]);\n\
\n\
    float pixel_x = s * mosaicTexSize_x;\n\
    float pixel_y = t * mosaicTexSize_y;\n\
\n\
    if(pixel_x < currMosaicStart_x + 1.0)\n\
    {\n\
        pixel_x = currMosaicStart_x + 1.0;\n\
    }\n\
    else if(pixel_x > currMosaicEnd_x - 1.0)\n\
    {\n\
        pixel_x = currMosaicEnd_x - 1.0;\n\
    }\n\
\n\
    if(pixel_y < currMosaicStart_y + 1.0)\n\
    {\n\
        pixel_y = currMosaicStart_y + 1.0;\n\
    }\n\
    else if(pixel_y > currMosaicEnd_y - 1.0)\n\
    {\n\
        pixel_y = currMosaicEnd_y - 1.0;\n\
    }\n\
\n\
    s = pixel_x / mosaicTexSize_x;\n\
    t = pixel_y / mosaicTexSize_y;\n\
\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
\n\
    return resultTexCoord;\n\
}\n\
\n\
\n\
\n\
float getPollution_inMosaicTexture(in vec2 texCoord)\n\
{\n\
    checkTexCoordRange(texCoord);\n\
    vec4 color4;\n\
    color4 = texture2D(pollutionMosaicTex, texCoord);\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float pollution = decoded * u_minMaxPollutionValues.y;\n\
\n\
    return pollution;\n\
}\n\
\n\
float _getPollution_triLinearInterpolation(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic)\n\
{\n\
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), \n\
    // and the col & row into the mosaic texture, returns a trilinear interpolation of the pressure.***\n\
\n\
    //************************************************************************************\n\
    // u_texSize[3]; // The original texture3D size.***\n\
    // mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    //------------------------------------------------------------------------------------\n\
\n\
    checkTexCoordRange(subTexCoord2d);\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec2 px = 1.0 / sim_res3d.xy;\n\
    vec2 vc = (floor(subTexCoord2d * sim_res3d.xy)) * px;\n\
    vec2 f = fract(subTexCoord2d * sim_res3d.xy);\n\
    vec2 texCoord_tl = vec2(vc);\n\
\n\
    \n\
    \n\
\n\
    vec2 texCoord_tr = vec2(vc + vec2(px.x, 0));\n\
    vec2 texCoord_bl = vec2(vc + vec2(0, px.y));\n\
    vec2 texCoord_br = vec2(vc + vec2(px.x, px.y));\n\
\n\
    checkTexCoordRange(texCoord_tl);\n\
    checkTexCoordRange(texCoord_tr);\n\
    checkTexCoordRange(texCoord_bl);\n\
    checkTexCoordRange(texCoord_br);\n\
    vec2 mosaicTexCoord_tl = subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_tr = subTexCoord_to_texCoord(texCoord_tr, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_bl = subTexCoord_to_texCoord(texCoord_bl, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_br = subTexCoord_to_texCoord(texCoord_br, col_mosaic, row_mosaic);\n\
\n\
    // vec2 mosaicTexCoord_tl = subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic);\n\
    // vec2 mosaicTexCoord_tr = vec2(mosaicTexCoord_tl + vec2(px.x, 0));\n\
    // vec2 mosaicTexCoord_bl = vec2(mosaicTexCoord_tl + vec2(0, px.y));\n\
    // vec2 mosaicTexCoord_br = vec2(mosaicTexCoord_tl + vec2(px.x, px.y));\n\
\n\
\n\
    float ap_tl = getPollution_inMosaicTexture(mosaicTexCoord_tl);\n\
    float ap_tr = getPollution_inMosaicTexture(mosaicTexCoord_tr);\n\
    float ap_bl = getPollution_inMosaicTexture(mosaicTexCoord_bl);\n\
    float ap_br = getPollution_inMosaicTexture(mosaicTexCoord_br);\n\
\n\
    float airPressure = mix(mix(ap_tl, ap_tr, f.x), mix(ap_bl, ap_br, f.x), f.y);\n\
\n\
    return airPressure;\n\
}\n\
\n\
\n\
float _getPollution_nearest(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic)\n\
{\n\
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), \n\
    // and the col & row into the mosaic texture, returns a nearest interpolation of the pressure.***\n\
    checkTexCoordRange(subTexCoord2d);\n\
    vec2 mosaicTexCoord = subTexCoord_to_texCoord(subTexCoord2d, col_mosaic, row_mosaic);\n\
    float ap = getPollution_inMosaicTexture(mosaicTexCoord);\n\
    return ap;\n\
}\n\
\n\
bool getUpDownSlicesIdx(in vec3 posLC, inout int sliceDownIdx, inout int sliceUpIdx, inout float distUp, inout float distDown)\n\
{\n\
    // uMinMaxAltitudeSlices[32]; // limited to 32 slices.***\n\
    // u_texSize[3] =  The original texture3D size.***\n\
    float altitude = posLC.z;\n\
    int currSliceIdx = -1;\n\
    for(int i=0; i<32; i++)\n\
    {\n\
        if(altitude >= uMinMaxAltitudeSlices[i].x && altitude < uMinMaxAltitudeSlices[i].y)\n\
        {\n\
            currSliceIdx = i;\n\
            break;\n\
        }\n\
    }\n\
\n\
    if(currSliceIdx < 0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(currSliceIdx == 0)\n\
    {\n\
        sliceDownIdx = currSliceIdx;\n\
        sliceUpIdx = currSliceIdx;\n\
    }\n\
    else\n\
    {\n\
        sliceDownIdx = currSliceIdx-1;\n\
        sliceUpIdx = currSliceIdx;\n\
    }\n\
\n\
    if(sliceUpIdx > u_texSize[2] - 1)\n\
    {\n\
        sliceUpIdx = u_texSize[2] - 1;\n\
    }\n\
\n\
    // +------------------------------+ <- sliceUp\n\
    //                 |\n\
    //                 |\n\
    //                 |  distUp\n\
    //                 |\n\
    //                 * <- posL.z\n\
    //                 |\n\
    //                 |  distDown\n\
    // +------------------------------+ <- sliceDown\n\
    float sliceUpAltitude = 0.0;\n\
    float sliceDownAltitude = 0.0;\n\
    for(int i=0; i<32; i++)\n\
    {\n\
        if(sliceUpIdx == i)\n\
        {\n\
            sliceUpAltitude = uMinMaxAltitudeSlices[i].y;\n\
            sliceDownAltitude = uMinMaxAltitudeSlices[i].x;\n\
            break;\n\
        }\n\
    }\n\
\n\
    distUp = abs(sliceUpAltitude - altitude);\n\
    distDown = abs(altitude - sliceDownAltitude);\n\
\n\
    return true;\n\
}\n\
\n\
bool getUpDownSlicesIdx_FAST(in vec3 posLC, inout int sliceDownIdx, inout int sliceUpIdx)\n\
{\n\
    // uMinMaxAltitudeSlices[32]; // limited to 32 slices.***\n\
    // u_texSize[3] =  The original texture3D size.***\n\
    float altitude = posLC.z;\n\
    int currSliceIdx = -1;\n\
    for(int i=0; i<32; i++)\n\
    {\n\
        if(altitude >= uMinMaxAltitudeSlices[i].x && altitude < uMinMaxAltitudeSlices[i].y)\n\
        {\n\
            currSliceIdx = i;\n\
            break;\n\
        }\n\
    }\n\
\n\
    if(currSliceIdx < 0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(currSliceIdx == 0)\n\
    {\n\
        sliceDownIdx = currSliceIdx;\n\
        sliceUpIdx = currSliceIdx;\n\
    }\n\
    else\n\
    {\n\
        sliceDownIdx = currSliceIdx-1;\n\
        sliceUpIdx = currSliceIdx;\n\
    }\n\
\n\
    if(sliceUpIdx > u_texSize[2] - 1)\n\
    {\n\
        sliceUpIdx = u_texSize[2] - 1;\n\
    }\n\
\n\
    return true;\n\
}\n\
\n\
bool get_pollution_fromTexture3d_triLinearInterpolation_FAST(in vec3 texCoord3d, in vec3 posLC, inout float airPressure)\n\
{\n\
    // Here is not important the pollution value. Only need know if the pollution value is zero or not.***\n\
    // this function is called by \"findFirstSamplePosition\".***\n\
    // tex3d : airPressureMosaicTex\n\
\n\
    // 1rst, determine the sliceIdx.***\n\
    int currSliceIdx_down = -1;\n\
    int currSliceIdx_up = -1;\n\
    float distUp = 0.0;\n\
    float distDown = 0.0;\n\
\n\
    if(!getUpDownSlicesIdx_FAST(posLC, currSliceIdx_down, currSliceIdx_up))\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float distUpAndDown = distUp + distDown;\n\
    float distUpRatio = distUp / distUpAndDown;\n\
    float distDownRatio = distDown / distUpAndDown;\n\
\n\
    // Down slice.************************************************************\n\
    int col_down, row_down;\n\
    //if(currSliceIdx_down <= u_mosaicSize[0])\n\
    //{\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
    //    row_down = 0;\n\
    //    col_down = currSliceIdx_down;\n\
    //}\n\
    //else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_down = int(colAux);\n\
        row_down = int(rowAux);\n\
    }\n\
\n\
    float airPressure_down = _getPollution_nearest(texCoord3d.xy, col_down, row_down);\n\
\n\
    if(airPressure_down > 0.0)\n\
    {\n\
        airPressure = airPressure_down;\n\
        return true;\n\
    }\n\
\n\
    // up slice.************************************************************\n\
    int col_up, row_up;\n\
    if(currSliceIdx_up <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row_up = 0;\n\
        col_up = currSliceIdx_up;\n\
    }\n\
    else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_up = int(colAux);\n\
        row_up = int(rowAux);\n\
    }\n\
\n\
    // test.***\n\
    col_up = col_down + 1;\n\
    row_up = row_down;\n\
    if(col_up >= u_mosaicSize[0])\n\
    {\n\
        col_up = 0;\n\
        row_up = row_down + 1;\n\
    }\n\
\n\
    if(row_up >= u_mosaicSize[1])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float airPressure_up = _getPollution_nearest(texCoord3d.xy, col_up, row_up);\n\
    if(airPressure_up > 0.0)\n\
    {\n\
        airPressure = airPressure_up;\n\
        return true;\n\
    }\n\
\n\
\n\
    return false;\n\
}\n\
\n\
bool get_pollution_fromTexture3d_triLinearInterpolation(in vec3 texCoord3d, in vec3 posLC, inout float airPressure)\n\
{\n\
    // tex3d : airPressureMosaicTex\n\
    // 1rst, check texCoord3d boundary limits.***\n\
    float error = 0.001;\n\
    // if(texCoord3d.x < 0.0 + error || texCoord3d.x > 1.0 - error)\n\
    // {\n\
    //     return false;\n\
    // }\n\
\n\
    // if(texCoord3d.y < 0.0 + error || texCoord3d.y > 1.0 - error)\n\
    // {\n\
    //     return false;\n\
    // }\n\
\n\
    // if(texCoord3d.z < 0.0 + error || texCoord3d.z > 1.0 - error)\n\
    // {\n\
    //     return false;\n\
    // }\n\
    // 1rst, determine the sliceIdx.***\n\
    int currSliceIdx_down = -1;\n\
    int currSliceIdx_up = -1;\n\
    float distUp = 0.0;\n\
    float distDown = 0.0;\n\
\n\
    if(!getUpDownSlicesIdx(posLC, currSliceIdx_down, currSliceIdx_up, distUp, distDown))\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float distUpAndDown = distUp + distDown;\n\
    float distUpRatio = distUp / distUpAndDown;\n\
    float distDownRatio = distDown / distUpAndDown;\n\
\n\
    // Down slice.************************************************************\n\
    int col_down, row_down;\n\
    //if(currSliceIdx_down <= u_mosaicSize[0])\n\
    //{\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
    //    row_down = 0;\n\
    //    col_down = currSliceIdx_down;\n\
    //}\n\
    //else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_down = int(colAux);\n\
        row_down = int(rowAux);\n\
    }\n\
\n\
    float airPressure_down = _getPollution_triLinearInterpolation(texCoord3d.xy, col_down, row_down);\n\
\n\
    // up slice.************************************************************\n\
    int col_up, row_up;\n\
    if(currSliceIdx_up <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row_up = 0;\n\
        col_up = currSliceIdx_up;\n\
    }\n\
    else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_up = int(colAux);\n\
        row_up = int(rowAux);\n\
    }\n\
\n\
    // test.***\n\
    col_up = col_down + 1;\n\
    row_up = row_down;\n\
    if(col_up >= u_mosaicSize[0])\n\
    {\n\
        col_up = 0;\n\
        row_up = row_down + 1;\n\
    }\n\
\n\
    if(row_up >= u_mosaicSize[1])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float airPressure_up = _getPollution_triLinearInterpolation(texCoord3d.xy, col_up, row_up);\n\
\n\
    airPressure = mix(airPressure_down, airPressure_up, distDownRatio);\n\
    //airPressure = mix(airPressure_down, airPressure_up, 0.5);\n\
\n\
    return true;\n\
}\n\
\n\
bool get_pollution_fromTexture3d_triLinearInterpolation_original(in vec3 texCoord3d, inout float airPressure)\n\
{\n\
    // This function is used if all slices of the texture3d has same altitude differences.***\n\
    //---------------------------------------------------------------------------------------\n\
    // tex3d : airPressureMosaicTex\n\
    // 1rst, check texCoord3d boundary limits.***\n\
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
    // 1rst, determine the sliceIdx.***\n\
    // u_texSize[3]; // The original texture3D size.***\n\
    int slicesCount = u_texSize[2];\n\
\n\
    float currSliceIdx_float = texCoord3d.z * float(slicesCount - 1);\n\
    int currSliceIdx_down = int(floor(currSliceIdx_float));\n\
    int currSliceIdx_up = currSliceIdx_down + 1;\n\
\n\
    if(currSliceIdx_up >= u_texSize[2])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    // now, calculate the mod.***\n\
    //float remain = currSliceIdx_float -  floor(currSliceIdx_float);\n\
    float remain = fract(currSliceIdx_float);\n\
\n\
    // Now, calculate the \"col\" & \"row\" in the mosaic texture3d.***\n\
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
\n\
    // Down slice.************************************************************\n\
    int col_down, row_down;\n\
    //if(currSliceIdx_down <= u_mosaicSize[0])\n\
    //{\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
    //    row_down = 0;\n\
    //    col_down = currSliceIdx_down;\n\
   // }\n\
    //else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_down = int(colAux);\n\
        row_down = int(rowAux);\n\
    }\n\
\n\
    // now, must calculate the mosaicTexCoord.***\n\
    vec2 mosaicTexCoord_down = subTexCoord_to_texCoord(texCoord3d.xy, col_down, row_down);\n\
    \n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec2 px = 1.0 / sim_res3d.xy;\n\
    vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;\n\
    vec3 f = fract(texCoord3d * sim_res3d);\n\
\n\
    float airPressure_down = _getPollution_triLinearInterpolation(texCoord3d.xy, col_down, row_down);\n\
\n\
    // up slice.************************************************************\n\
    int col_up, row_up;\n\
    if(currSliceIdx_up <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row_up = 0;\n\
        col_up = currSliceIdx_up;\n\
    }\n\
    else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_up = int(colAux);\n\
        row_up = int(rowAux);\n\
    }\n\
\n\
    // test.***\n\
    col_up = col_down + 1;\n\
    row_up = row_down;\n\
    if(col_up >= u_mosaicSize[0])\n\
    {\n\
        col_up = 0;\n\
        row_up = row_down + 1;\n\
    }\n\
\n\
    if(row_up >= u_mosaicSize[1])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    float airPressure_up = _getPollution_triLinearInterpolation(texCoord3d.xy, col_up, row_up);\n\
\n\
    airPressure = mix(airPressure_down, airPressure_up, f.z);\n\
    //airPressure = airPressure_down; // test delete.***\n\
    return true;\n\
}\n\
\n\
bool get_pollution_fromTexture3d_nearest(in vec3 texCoord3d, inout float airPressure)\n\
{\n\
    // tex3d : airPressureMosaicTex\n\
    // 1rst, check texCoord3d boundary limits.***\n\
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
    // 1rst, determine the sliceIdx.***\n\
    int slicesCount = u_texSize[2];\n\
\n\
    float currSliceIdx_float = texCoord3d.z * float(slicesCount -  1);\n\
    int currSliceIdx_down = int(floor(currSliceIdx_float));\n\
    int currSliceIdx_up = currSliceIdx_down + 1;\n\
    int currSliceIdx = currSliceIdx_down;\n\
\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    //vec2 px = 1.0 / sim_res3d.xy;\n\
    //vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;\n\
    vec3 f = fract(texCoord3d * sim_res3d);\n\
\n\
    if(f.z > 0.5)\n\
    {\n\
        currSliceIdx = currSliceIdx_up;\n\
    }\n\
\n\
    if(currSliceIdx >= u_texSize[2])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    // ************************************************************\n\
    int col, row;\n\
    //if(currSliceIdx <= u_mosaicSize[0])\n\
    //{\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
    //    row = 0;\n\
   //     col = currSliceIdx;\n\
   /// }\n\
    //else\n\
    {\n\
        float mosaicSize_x = float(u_mosaicSize[0]);\n\
        float rowAux = floor(float(currSliceIdx) / mosaicSize_x);\n\
        float colAux = float(currSliceIdx) - (rowAux * mosaicSize_x);\n\
\n\
        col = int(colAux);\n\
        row = int(rowAux);\n\
    }\n\
\n\
    // now, must calculate the mosaicTexCoord.***\n\
\n\
    airPressure = _getPollution_nearest(texCoord3d.xy, col, row);\n\
\n\
    return true;\n\
}\n\
\n\
vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)\n\
{\n\
    \n\
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
\n\
    float value = gray * 3.99;\n\
    float h = floor(value);\n\
    float f = fract(value);\n\
\n\
    // test.***\n\
    if(gray > 0.0000001)\n\
    {\n\
        //gray = 0.95;\n\
    }\n\
\n\
    vec4 resultColor = vec4(0.0, 0.0, 0.0, (gray));\n\
\n\
    if(hotToCold)\n\
    {\n\
        // HOT to COLD.***\n\
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix red & yellow.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(red, yellow, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix yellow & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, green, f);\n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & cyan.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(green, cyan, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix cyan & blue.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, blue, f);\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // COLD to HOT.***\n\
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix blue & cyan.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(blue, cyan, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix cyan & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, green, f);  \n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & yellow.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(green, yellow, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix yellow & red.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, red, f);\n\
        }\n\
    }\n\
\n\
    return resultColor;\n\
}\n\
\n\
\n\
// https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl\n\
// The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. \n\
//--------------------------------------------------------------------------------------------------------------------------\n\
\n\
// https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques\n\
//--------------------------------------------------------------------------------------------------------------------------\n\
\n\
/*\n\
// https://martinopilia.com/posts/2018/09/17/volume-raycasting.html\n\
// Estimate the normal from a finite difference approximation of the gradient\n\
vec3 normal(vec3 position, float intensity)\n\
{\n\
    float d = step_length;\n\
    float dx = texture(volume, position + vec3(d,0,0)).r - intensity;\n\
    float dy = texture(volume, position + vec3(0,d,0)).r - intensity;\n\
    float dz = texture(volume, position + vec3(0,0,d)).r - intensity;\n\
    return -normalize(NormalMatrix * vec3(dx, dy, dz));\n\
}*/\n\
\n\
bool normalLC(vec3 texCoord3d, in vec3 posLC, inout vec3 result_normal)\n\
{\n\
    // Estimate the normal from a finite difference approximation of the gradient\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec3 pix = 1.0 / sim_res3d;\n\
\n\
    checkTexCoord3DRange(texCoord3d);\n\
\n\
    vec3 vc = texCoord3d;\n\
\n\
    // dx.*************************************************\n\
    float airPressure_dx = 0.0;\n\
    vec3 velocity_dx;\n\
    vec3 texCoord3d_dx = vec3(vc + vec3(pix.x, 0.0, 0.0));\n\
    bool succes_dx =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dx, posLC, airPressure_dx);\n\
    if(!succes_dx)return false;\n\
\n\
    float airPressure_dx_neg = 0.0;\n\
    vec3 velocity_dx_neg;\n\
    vec3 texCoord3d_dx_neg = vec3(vc - vec3(pix.x, 0.0, 0.0));\n\
    bool succes_dx_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dx_neg, posLC, airPressure_dx_neg);\n\
    if(!succes_dx_neg)return false;\n\
\n\
    // dy.*************************************************\n\
    float airPressure_dy = 0.0;\n\
    vec3 velocity_dy;\n\
    vec3 texCoord3d_dy = vec3(vc + vec3(0.0, pix.y, 0.0));\n\
    bool succes_dy =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dy, posLC, airPressure_dy);\n\
    if(!succes_dy)return false;\n\
\n\
    float airPressure_dy_neg = 0.0;\n\
    vec3 velocity_dy_neg;\n\
    vec3 texCoord3d_dy_neg = vec3(vc - vec3(0.0, pix.y, 0.0));\n\
    bool succes_dy_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dy_neg, posLC, airPressure_dy_neg);\n\
    if(!succes_dy_neg)return false;\n\
\n\
    // dz.*************************************************\n\
    float airPressure_dz = 0.0;\n\
    vec3 velocity_dz;\n\
    vec3 texCoord3d_dz = vec3(vc + vec3(0.0, 0.0, pix.z));\n\
    bool succes_dz =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dz, posLC, airPressure_dz);\n\
    if(!succes_dz)return false;\n\
\n\
    float airPressure_dz_neg = 0.0;\n\
    vec3 velocity_dz_neg;\n\
    vec3 texCoord3d_dz_neg = vec3(vc - vec3(0.0, 0.0, pix.z));\n\
    bool succes_dz_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dz_neg, posLC, airPressure_dz_neg);\n\
    if(!succes_dz_neg)return false;\n\
\n\
    //result_normal = normalize(vec3(airPressure_dx - pressure, airPressure_dy - pressure, airPressure_dz - pressure));\n\
    result_normal = normalize(vec3(airPressure_dx - airPressure_dx_neg, airPressure_dy - airPressure_dy_neg, airPressure_dz - airPressure_dz_neg));\n\
\n\
    if(abs(result_normal.x) > 0.0 || abs(result_normal.y) > 0.0 || abs(result_normal.z) > 0.0 )\n\
    {\n\
        return true;\n\
    }\n\
    else return false;\n\
\n\
    return true;\n\
}\n\
\n\
vec4 transfer_fnc(in float pressure)\n\
{\n\
    // The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. \n\
    //float maxPressureRef = 1.05;\n\
    //float minPressureRef = u_airEnvirontmentPressure;\n\
    float maxPressureRef = u_minMaxPollutionValues.y; // test.***\n\
    float minPressureRef = u_minMaxPollutionValues.x; // test.***\n\
    bool bHotToCold = false; // we want coldToHot (blue = min to red = max).***\n\
    vec4 rainbowCol3 = getRainbowColor_byHeight(pressure, minPressureRef, maxPressureRef, bHotToCold);\n\
\n\
    return rainbowCol3;\n\
}\n\
\n\
bool isSimulationBoxEdge(vec2 screenPos)\n\
{\n\
    // This function is used to render the simulation box edges.***\n\
    // check the normals.***\n\
    vec2 frontTexCoord;\n\
    vec2 rearTexCoord;\n\
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);\n\
    float pixelSize_x = 1.0 / (u_screenSize.x * 2.0);\n\
    float pixelSize_y = 1.0 / u_screenSize.y;\n\
    \n\
    // check front.***\n\
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);\n\
    vec4 normal4front_up = getNormal_simulationBox(vec2(frontTexCoord.x, frontTexCoord.y + pixelSize_y));\n\
\n\
    if(dot(normal4front.xyz, normal4front_up.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4front_left = getNormal_simulationBox(vec2(frontTexCoord.x - pixelSize_x, frontTexCoord.y));    \n\
    if(dot(normal4front.xyz, normal4front_left.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4front_down = getNormal_simulationBox(vec2(frontTexCoord.x, frontTexCoord.y - pixelSize_y));    \n\
    if(dot(normal4front.xyz, normal4front_down.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4front_rigth = getNormal_simulationBox(vec2(frontTexCoord.x + pixelSize_x, frontTexCoord.y));    \n\
    if(dot(normal4front.xyz, normal4front_rigth.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    // now, check the rear normals.***\n\
    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);\n\
    vec4 normal4rear_up = getNormal_simulationBox(vec2(rearTexCoord.x, rearTexCoord.y + pixelSize_y));\n\
\n\
    if(dot(normal4rear.xyz, normal4rear_up.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4rear_left = getNormal_simulationBox(vec2(rearTexCoord.x - pixelSize_x, rearTexCoord.y));    \n\
    if(dot(normal4rear.xyz, normal4rear_left.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4rear_down = getNormal_simulationBox(vec2(rearTexCoord.x, rearTexCoord.y - pixelSize_y));    \n\
    if(dot(normal4rear.xyz, normal4rear_down.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    vec4 normal4rear_rigth = getNormal_simulationBox(vec2(rearTexCoord.x + pixelSize_x, rearTexCoord.y));    \n\
    if(dot(normal4rear.xyz, normal4rear_rigth.xyz) < 0.95)\n\
    {\n\
        return true; // is edge.***\n\
    }\n\
\n\
    return false;\n\
}\n\
\n\
bool findFirstSamplePosition(in vec3 frontPosLC, in vec3 rearPosLC, in vec3 samplingDirLC, in float increLength, in vec3 simulBoxRange, inout vec3 result_samplePos, inout int iteration)\n\
{\n\
    // This function finds the first sample position.***\n\
    // Here is not important the pollution value. Only need know if the pollution value is zero or not.***\n\
    float contaminationSample = 0.0;\n\
    vec3 samplePosLC;\n\
    vec3 samplePosLC_prev;\n\
    float minValToConsidereSample = u_minMaxPollutionValues[0]; // original.***\n\
    //float minValToConsidereSample = (u_minMaxPollutionValues[1] - u_minMaxPollutionValues[0]) * 0.0001;\n\
    for(int i=0; i<30; i++)\n\
    {\n\
        // Note : for each smple, must depth check with the scene depthTexure.***\n\
        float dist = float(i) * increLength;\n\
        samplePosLC = frontPosLC + samplingDirLC * dist;\n\
        iteration = i;\n\
\n\
        if(i == 0)\n\
        {\n\
            samplePosLC_prev = samplePosLC;\n\
        }\n\
\n\
        contaminationSample = 0.0;\n\
        vec3 sampleTexCoord3d = vec3((samplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (samplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (samplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
        checkTexCoord3DRange(sampleTexCoord3d);\n\
\n\
        if(get_pollution_fromTexture3d_triLinearInterpolation_FAST(sampleTexCoord3d, samplePosLC, contaminationSample))\n\
        {\n\
            if(contaminationSample > minValToConsidereSample)\n\
            {\n\
                if(i > 0)\n\
                {\n\
                    // check the prev semiPos.***\n\
                    vec3 samplePosLC_semiPrev = samplePosLC - samplingDirLC * increLength * 0.5;\n\
                    if(get_pollution_fromTexture3d_triLinearInterpolation_FAST(sampleTexCoord3d, samplePosLC_semiPrev, contaminationSample))\n\
                    {\n\
                        if(contaminationSample > minValToConsidereSample)\n\
                        {\n\
                            result_samplePos = samplePosLC_prev;\n\
                            return true;\n\
                        }\n\
                        else\n\
                        {\n\
                            //result_samplePos = (samplePosLC + samplePosLC_prev) * 0.5;\n\
                            result_samplePos = samplePosLC_semiPrev;\n\
                            return true;\n\
                        }\n\
                    }\n\
                }\n\
\n\
                //result_samplePos = (samplePosLC + samplePosLC_prev) * 0.5;\n\
                result_samplePos = samplePosLC_prev;\n\
                return true;\n\
            }\n\
        }\n\
        //currSamplePosLC += step_vector_LC;\n\
        samplePosLC_prev = samplePosLC;\n\
    }\n\
\n\
    return false;\n\
}\n\
\n\
void main(){\n\
\n\
    // 1rst, read front depth & rear depth and check if exist rear depth.***\n\
    // If no exist rear depth, then discard.***\n\
    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y); // \n\
    vec2 screenPos = v_tex_pos;\n\
\n\
    if(isSimulationBoxEdge(screenPos))\n\
    {\n\
        vec4 edgeColor = vec4(0.25, 0.5, 0.99, 1.0);\n\
        gl_FragData[0] = edgeColor;\n\
\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
            gl_FragData[1] = edgeColor;\n\
            gl_FragData[2] = edgeColor;\n\
            gl_FragData[3] = edgeColor;\n\
        #endif\n\
        return;\n\
    }\n\
\n\
    // read normal in rear depth. If no exist normal, then, discard.***\n\
    // calculate the texCoord for rear normal:\n\
    vec2 frontTexCoord;\n\
    vec2 rearTexCoord;\n\
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);\n\
\n\
    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, frontTexCoord);\n\
	if(length(encodedNormal.xyz) < 0.1)\n\
    {\n\
        vec4 encodedNormal_rear = texture2D(simulationBoxDoubleNormalTex, rearTexCoord);\n\
        if(length(encodedNormal_rear.xyz) < 0.1)\n\
        {\n\
            discard;\n\
        }\n\
        //discard;\n\
    }\n\
\n\
    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);\n\
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);\n\
	//vec3 normal = normal4front.xyz;\n\
\n\
    // 1rst, know the scene depth.***\n\
    vec4 normal4scene = getNormal(v_tex_pos);\n\
    int estimatedFrustumIdx = int(floor(normal4scene.w * 100.0));\n\
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_scene = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	//float currNear_scene = nearFar_scene.x; // no used in this shader.***\n\
	float currFar_scene = nearFar_scene.y;\n\
    float sceneLinearDepth = getDepth(v_tex_pos);\n\
    float distToCam = sceneLinearDepth * currFar_scene;\n\
    //vec3 sceneDepthPosCC = getViewRay(v_tex_pos, distToCam - 1.0);\n\
\n\
\n\
    // Now, calculate the positions with the simulation box, front & rear.***\n\
    // rear.***\n\
	estimatedFrustumIdx = int(floor(normal4rear.w * 100.0));\n\
	dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_rear = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	//float currNear_rear = nearFar_rear.x; // no used in this shader.***\n\
	float currFar_rear = nearFar_rear.y;\n\
\n\
    // front.***\n\
    estimatedFrustumIdx = int(floor(normal4front.w * 100.0));\n\
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_front = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	//float currNear_front = nearFar_front.x; // no used in this shader.***\n\
	float currFar_front = nearFar_front.y;\n\
\n\
    // Now, calculate the rearPosCC & frontPosCC.***\n\
    vec3 frontPosCC;\n\
    vec3 rearPosCC;\n\
    get_FrontAndRear_posCC(screenPos, currFar_rear, currFar_front, frontPosCC, rearPosCC);\n\
\n\
    // Now check cutting plane if exist.***\n\
    // u_cuttingPlanePosLC\n\
    // uniform mat4 modelViewMatrixRelToEyeInv;\n\
    // uniform vec3 encodedCameraPositionMCHigh;\n\
    // uniform vec3 encodedCameraPositionMCLow;\n\
    // u_simulBoxTMatInv\n\
    vec4 camPosRelToSimBox;\n\
    vec3 cuttingPosCC;\n\
    vec3 frontPosLCKeep;\n\
    if(u_cuttingPlaneIdx == 0 || u_cuttingPlaneIdx == 1 || u_cuttingPlaneIdx == 2)\n\
    {\n\
        vec4 encodedNormal4cuttingPlane = texture2D(cuttingPlaneNormalTex, v_tex_pos);\n\
        if(length(encodedNormal4cuttingPlane.xyz) > 0.1)\n\
        {\n\
            vec4 normal4cuttingPlane = getNormal_cuttingPlane(v_tex_pos);\n\
            estimatedFrustumIdx = int(floor(normal4cuttingPlane.w * 100.0));\n\
            currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
            vec2 nearFar_cuttingPlane = getNearFar_byFrustumIdx(currFrustumIdx);\n\
            float currFar_cuttingPlane = nearFar_cuttingPlane.y;\n\
            \n\
            get_cuttingPlane_posCC(screenPos, currFar_cuttingPlane, cuttingPosCC);\n\
\n\
            // before to change the frontPosCC, must calculate the camPosRelToSimBox.***\n\
            vec4 frontPosWCRelToEyeKeep = modelViewMatrixRelToEyeInv * vec4(frontPosCC.xyz, 1.0);\n\
            posWCRelToEye_to_posLC(frontPosWCRelToEyeKeep, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, frontPosLCKeep);\n\
\n\
            // now change the frontPosCC.***\n\
            frontPosCC = cuttingPosCC;\n\
\n\
            if(cuttingPosCC.z < rearPosCC.z)\n\
            {\n\
                // if cutting plane moves entirely inside of the simulBox, then never enter here.***\n\
                discard;\n\
            }\n\
        }\n\
\n\
        // now, calculate camPosRelToSimBox.***\n\
        vec3 highDiff = encodedCameraPositionMCHigh - u_simulBoxPosHigh;\n\
        vec3 lowDiff = encodedCameraPositionMCLow - u_simulBoxPosLow;\n\
        vec3 camPosWC = highDiff + lowDiff;\n\
        camPosRelToSimBox = u_simulBoxTMatInv * vec4(camPosWC, 1.0);\n\
    }\n\
\n\
    // Now, calculate frontPosWC & rearPosWC.***\n\
    vec4 frontPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(frontPosCC.xyz, 1.0);\n\
    vec4 rearPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(rearPosCC.xyz, 1.0);\n\
\n\
    // Now, calculate frontPosLC & rearPosLC.***\n\
    vec3 frontPosLC;\n\
    vec3 rearPosLC;\n\
    posWCRelToEye_to_posLC(frontPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, frontPosLC);\n\
    posWCRelToEye_to_posLC(rearPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, rearPosLC);\n\
\n\
    if(u_cuttingPlaneIdx == 0) // x-axis\n\
    {\n\
        float error = 10.0;\n\
        if(camPosRelToSimBox.x >= u_cuttingPlanePosLC.x)\n\
        {\n\
            if(frontPosLC.x - error > u_cuttingPlanePosLC.x)// || rearPosLC.y > u_cuttingPlanePosLC.y)\n\
            {\n\
                discard;\n\
            }\n\
        }\n\
        else\n\
        {\n\
            if(frontPosLC.x + error < u_cuttingPlanePosLC.x)// || rearPosLC.y < u_cuttingPlanePosLC.y)\n\
            {\n\
                discard;\n\
            }\n\
        }\n\
    }\n\
    else if(u_cuttingPlaneIdx == 1) // y-axis\n\
    {\n\
        float error = 10.0;\n\
        if(camPosRelToSimBox.y >= u_cuttingPlanePosLC.y)\n\
        {\n\
            if(frontPosLC.y - error > u_cuttingPlanePosLC.y)// || rearPosLC.y > u_cuttingPlanePosLC.y)\n\
            {\n\
                discard;\n\
            }\n\
        }\n\
        else\n\
        {\n\
            if(frontPosLC.y + error < u_cuttingPlanePosLC.y)// || rearPosLC.y < u_cuttingPlanePosLC.y)\n\
            {\n\
                discard;\n\
            }\n\
        }\n\
    }\n\
    else if(u_cuttingPlaneIdx == 2) // z-axis\n\
    {\n\
        float error = 10.0;\n\
        if(camPosRelToSimBox.z >= u_cuttingPlanePosLC.z)\n\
        {\n\
            if(frontPosLC.z - error > u_cuttingPlanePosLC.z)// || rearPosLC.y > u_cuttingPlanePosLC.y)\n\
            {\n\
                // vec4 colorDiscard = vec4(1.0, 0.3, 0.3, 1.0);\n\
                // gl_FragData[0] = colorDiscard;\n\
                // #ifdef USE_MULTI_RENDER_TARGET\n\
                //     gl_FragData[1] = colorDiscard;\n\
                //     gl_FragData[2] = colorDiscard;\n\
                //     gl_FragData[3] = colorDiscard;\n\
                // #endif\n\
                // return;\n\
                discard;\n\
            }\n\
        }\n\
        else\n\
        {\n\
            if(frontPosLC.z + error < u_cuttingPlanePosLC.z)// || rearPosLC.y < u_cuttingPlanePosLC.y)\n\
            {\n\
                // vec4 colorDiscard = vec4(0.3, 1.0, 0.3, 1.0);\n\
                // gl_FragData[0] = colorDiscard;\n\
                // #ifdef USE_MULTI_RENDER_TARGET\n\
                //     gl_FragData[1] = colorDiscard;\n\
                //     gl_FragData[2] = colorDiscard;\n\
                //     gl_FragData[3] = colorDiscard;\n\
                // #endif\n\
                // return;\n\
                discard;\n\
            }\n\
        }\n\
    }\n\
\n\
    // Now, with \"frontPosLC\" & \"rearPosLC\", calculate the frontTexCoord3d & rearTexCoord3d.***\n\
    vec3 simulBoxRange = vec3(u_simulBoxMaxPosLC.x - u_simulBoxMinPosLC.x, u_simulBoxMaxPosLC.y - u_simulBoxMinPosLC.y, u_simulBoxMaxPosLC.z - u_simulBoxMinPosLC.z);\n\
\n\
    float contaminationSample = 0.0;\n\
    float smplingCount = 0.0;\n\
    float segmentLength = distance(rearPosLC, frontPosLC);\n\
    vec3 samplingDirLC = normalize(rearPosLC - frontPosLC);\n\
    //vec3 samplingDirCC = normalize(rearPosCC - frontPosCC);\n\
    float samplingsCount = 30.0;\n\
    float increLength = segmentLength / samplingsCount;\n\
    if(increLength < u_voxelSizeMeters.x)\n\
    {\n\
        //increLength = u_voxelSizeMeters.x;\n\
    }\n\
\n\
    vec4 color4Aux = vec4(0.0, 0.0, 0.0, 0.0);\n\
\n\
    vec4 finalColor4 = vec4(0.0);\n\
    float contaminationAccum = 0.0;\n\
    // u_minMaxPollutionValues\n\
\n\
    vec3 firstPosLC = vec3(frontPosLC);\n\
    int iteration = 0;\n\
    if(!findFirstSamplePosition(frontPosLC, rearPosLC, samplingDirLC, increLength, simulBoxRange, firstPosLC, iteration))\n\
    {\n\
        // vec4 colorDiscard = vec4(0.3, 0.3, 0.3, 1.0);\n\
        // gl_FragData[0] = colorDiscard;\n\
        // #ifdef USE_MULTI_RENDER_TARGET\n\
        //     gl_FragData[1] = colorDiscard;\n\
        //     gl_FragData[2] = colorDiscard;\n\
        //     gl_FragData[3] = colorDiscard;\n\
        // #endif\n\
        \n\
        return;\n\
    }\n\
    \n\
    // recalculate segmentLength & increLength.***\n\
    samplingsCount = 30.0;\n\
    segmentLength = distance(rearPosLC, firstPosLC);\n\
    increLength = segmentLength / samplingsCount;\n\
\n\
    vec4 colorTest = vec4(0.0, 0.0, 0.5, 1.0);\n\
    colorTest = vec4(firstPosLC.x /u_voxelSizeMeters.x, firstPosLC.y /u_voxelSizeMeters.y, firstPosLC.z /u_voxelSizeMeters.z , 1.0);\n\
    \n\
    // Sampling far to near.***\n\
    bool normalLC_calculated = true;\n\
\n\
    float contaminationSamples[30];\n\
    int samplesCount = 0;\n\
    for(int i=0; i<30; i++)\n\
    {\n\
        // Note : for each smple, must depth check with the scene depthTexure.***\n\
        vec3 samplePosLC = firstPosLC + samplingDirLC * increLength * float(i);\n\
\n\
        //vec3 samplePosCC = firstPosLC + samplingDirCC * increLength * float(i);\n\
        //if(abs(samplePosCC.z) > distToCam)\n\
        //{\n\
        //    break;\n\
        //}\n\
\n\
        contaminationSample = 0.0;\n\
        vec3 sampleTexCoord3d = vec3((samplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (samplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (samplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
        checkTexCoord3DRange(sampleTexCoord3d);\n\
\n\
        if(get_pollution_fromTexture3d_triLinearInterpolation(sampleTexCoord3d, samplePosLC, contaminationSample))\n\
        {\n\
            contaminationSamples[i] = contaminationSample;\n\
            samplesCount += 1;\n\
            // vec3 currNormalLC;\n\
            // // if(!normalLC(sampleTexCoord3d, samplePosLC, currNormalLC))\n\
            // // {\n\
            // //    normalLC_calculated = false;\n\
            // //    continue;\n\
            // // }\n\
\n\
            // //vec4 currColor4 = transfer_fnc(contaminationSample);\n\
            // vec4 currColor4 = getRainbowColor_byHeight(contaminationSample, u_minMaxPollutionValues.x, u_minMaxPollutionValues.y * 0.3, false);\n\
            // //float unitaryContaminationSample = (contaminationSample - u_minMaxPollutionValues.x) / (u_minMaxPollutionValues.y - u_minMaxPollutionValues.x);\n\
 \n\
            // //if(length(currNormalLC) > 0.0)\n\
            // {\n\
            //     // https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl\n\
            //     finalColor4.rgb += (1.0 - finalColor4.a) * currColor4.a * currColor4.rgb; \n\
            //     finalColor4.a += (1.0 - finalColor4.a) * currColor4.a;\n\
            // }\n\
\n\
            // smplingCount += 1.0;\n\
\n\
            // // Optimization: break out of the loop when the color is near opaque\n\
            // if (finalColor4.a >= 0.95) {\n\
            //     break;\n\
            // }\n\
\n\
            // contaminationAccum += contaminationSample;\n\
            \n\
        }\n\
        else{\n\
            contaminationSamples[i] = 0.0;\n\
        }\n\
    }\n\
\n\
    int samplesCount2 = 0;\n\
    for(int i=0; i<30; i++)\n\
    {\n\
        contaminationSample = contaminationSamples[i];\n\
        if(contaminationSample > 0.0)\n\
        {\n\
            vec4 currColor4 = getRainbowColor_byHeight(contaminationSample, u_minMaxPollutionValues.x, u_minMaxPollutionValues.y * 0.3, false);\n\
\n\
            if(u_useMinMaxValuesToRender == 1)\n\
            {\n\
                float targetValue = u_minMaxPollutionValuesToRender.y;\n\
                \n\
                //targetValue = u_minMaxPollutionValues.y;\n\
                //currColor4.a = contaminationSample / targetValue;\n\
                if(currColor4.a > 1.0)\n\
                {\n\
                    currColor4.a = 1.0;\n\
                }\n\
\n\
                //currColor4.a *= smoothstep(0.0, targetValue, contaminationSample);\n\
                currColor4.a = smoothstep(0.0, targetValue, contaminationSample);\n\
            }\n\
\n\
            // https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl\n\
            finalColor4.rgb += (1.0 - finalColor4.a) * currColor4.a * currColor4.rgb; \n\
            finalColor4.a += (1.0 - finalColor4.a) * currColor4.a;\n\
            samplesCount2 += 1;\n\
\n\
            contaminationAccum += contaminationSample;\n\
        }\n\
\n\
        // Optimization: break out of the loop when the color is near opaque\n\
        if (finalColor4.a >= 0.95) {\n\
            break;\n\
        }\n\
\n\
        // if(samplesCount2 >= samplesCount)\n\
        // {\n\
        //     break;\n\
        // }\n\
    }\n\
\n\
    // contaminationAccum /= float(samplesCount2);\n\
    // finalColor4 = getRainbowColor_byHeight(contaminationAccum, u_minMaxPollutionValues.x, u_minMaxPollutionValues.y * 0.3, false);\n\
    // finalColor4.a *= 10.0;\n\
\n\
    if(smplingCount < 1.0)\n\
    {\n\
        //discard;\n\
    }\n\
\n\
    if(smplingCount < 1.0)\n\
    {\n\
        smplingCount = 1.0;\n\
    }\n\
\n\
    color4Aux = finalColor4;\n\
\n\
    if(!normalLC_calculated)\n\
    {\n\
        //color4Aux = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
\n\
    gl_FragData[0] = color4Aux;\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = color4Aux;\n\
        gl_FragData[2] = color4Aux;\n\
        gl_FragData[3] = color4Aux;\n\
    #endif\n\
}\n\
";
ShaderSource.depthBufferUtils = "\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} ";
ShaderSource.depthTexturesMergerFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D depthTexture_0;  \n\
uniform sampler2D normalTexture_0;\n\
uniform sampler2D depthTexture_1;  \n\
uniform sampler2D normalTexture_1;\n\
uniform sampler2D depthTexture_2;  \n\
uniform sampler2D normalTexture_2;\n\
uniform sampler2D depthTexture_3;  \n\
uniform sampler2D normalTexture_3;\n\
\n\
uniform int uNumFrustums;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
float getMinValue(float a, float b, float c)\n\
{\n\
    float x = min(a, b);\n\
    return min(x, c);\n\
}\n\
\n\
float getMaxValue(float a, float b, float c)\n\
{\n\
    float x = max(a, b);\n\
    return max(x, c);\n\
}\n\
\n\
bool isNan(float val)\n\
{\n\
  return (val <= 0.0 || 0.0 <= val) ? false : true;\n\
}\n\
\n\
vec4 getDepth(in int frustumIdx, in vec2 texCoord)\n\
{\n\
    vec4 color4;\n\
\n\
    if(frustumIdx == 0)\n\
    {\n\
        color4 = texture2D(depthTexture_0, texCoord);\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        color4 = texture2D(depthTexture_1, texCoord);\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        color4 = texture2D(depthTexture_2, texCoord);\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        color4 = texture2D(depthTexture_3, texCoord);\n\
    }\n\
\n\
    return color4;\n\
}\n\
\n\
vec4 getNormal(in int frustumIdx, in vec2 texCoord)\n\
{\n\
    vec4 color4;\n\
\n\
    if(frustumIdx == 0)\n\
    {\n\
        color4 = texture2D(normalTexture_0, texCoord);\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        color4 = texture2D(normalTexture_1, texCoord);\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        color4 = texture2D(normalTexture_2, texCoord);\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        color4 = texture2D(normalTexture_3, texCoord);\n\
    }\n\
\n\
    return color4;\n\
}\n\
\n\
void main()\n\
{           \n\
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);\n\
\n\
    // Take the base color.\n\
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
    vec4 normalColor = vec4(0.0, 0.0, 0.0, 1.0);\n\
    bool isValid = false;\n\
\n\
    for(int i=0; i<4; i++)\n\
    {\n\
        if(i < uNumFrustums)\n\
        {\n\
            vec4 normal4 = getNormal(i, texCoord);\n\
            \n\
            // check the depth value.***\n\
            if((abs(normal4.x) + abs(normal4.y) + abs(normal4.z)) > 0.1)\n\
            {\n\
                // is valid depth value.***\n\
                vec4 depthColor4 = getDepth(i, texCoord);\n\
\n\
                textureColor = depthColor4;\n\
                normalColor = normal4;\n\
                isValid = true;\n\
                break;\n\
            }\n\
        }\n\
    }\n\
\n\
    if(!isValid)\n\
    {\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(0.0, 0.0, 0.0, 1.0);\n\
        #endif\n\
        return;\n\
    }\n\
    //discard;\n\
\n\
    \n\
    gl_FragData[0] = textureColor;\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
    gl_FragData[1] = normalColor;\n\
    #endif\n\
	\n\
}";
ShaderSource.draw_frag = "precision mediump float;\n\
\n\
uniform sampler2D u_wind;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform bool u_colorScale;\n\
\n\
varying vec2 v_particle_pos;\n\
\n\
void main() {\n\
	vec2 windMapTexCoord = v_particle_pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, windMapTexCoord).rg);\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
	\n\
	if(u_colorScale)\n\
	{\n\
		speed_t *= 1.5;\n\
		if(speed_t > 1.0)speed_t = 1.0;\n\
		float b = 1.0 - speed_t;\n\
		float g;\n\
		if(speed_t > 0.5)\n\
		{\n\
			g = 2.0-2.0*speed_t;\n\
		}\n\
		else{\n\
			g = 2.0*speed_t;\n\
		}\n\
		float r = speed_t;\n\
		gl_FragColor = vec4(r,g,b,1.0);\n\
	}\n\
	else{\n\
		float intensity = speed_t*3.0;\n\
		if(intensity > 1.0)\n\
			intensity = 1.0;\n\
		gl_FragColor = vec4(intensity,intensity,intensity,1.0);\n\
	}\n\
}\n\
";
ShaderSource.draw_frag3D = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D u_wind;\n\
uniform sampler2D u_depthTex;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform bool u_colorScale;\n\
uniform float u_tailAlpha;\n\
uniform float u_externAlpha;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
uniform int uFrustumIdx;\n\
varying float vDepth;\n\
\n\
varying vec2 v_particle_pos;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec3 getRainbowColor_byHeight(float height)\n\
{\n\
	float minHeight_rainbow = 0.0;\n\
	float maxHeight_rainbow = 1.0;\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
vec3 getWhiteToBlueColor_byHeight(float height, float minHeight, float maxHeight)\n\
{\n\
    // White to Blue in 32 steps.\n\
    float gray = (height - minHeight)/(maxHeight - minHeight);\n\
    gray = 1.0 - gray; // invert gray value (white to blue).\n\
    // calculate r, g, b values by gray.\n\
\n\
    float r, g, b;\n\
\n\
    // Red.\n\
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.\n\
    {\n\
        float minGray = 0.0;\n\
        float maxGray = 0.15625;\n\
        //float maxR = 0.859375; // 220/256.\n\
        float maxR = 1.0;\n\
        float minR = 0.3515625; // 90/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        r = maxR - relativeGray*(maxR - minR);\n\
    }\n\
    else if(gray >= 0.15625 && gray < 0.40625) // [6, 13] from 32 divisions.\n\
    {\n\
        float minGray = 0.15625;\n\
        float maxGray = 0.40625;\n\
        float maxR = 0.3515625; // 90/256.\n\
        float minR = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        r = maxR - relativeGray*(maxR - minR);\n\
    }\n\
    else  // [14, 32] from 32 divisions.\n\
    {\n\
        r = 0.0;\n\
    }\n\
\n\
    // Green.\n\
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.\n\
    {\n\
        g = 1.0; // 256.\n\
    }\n\
    else if(gray >= 0.15625 && gray < 0.5625) // [6, 18] from 32 divisions.\n\
    {\n\
        float minGray = 0.15625;\n\
        float maxGray = 0.5625;\n\
        float maxG = 1.0; // 256/256.\n\
        float minG = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        g = maxG - relativeGray*(maxG - minG);\n\
    }\n\
    else  // [18, 32] from 32 divisions.\n\
    {\n\
        g = 0.0;\n\
    }\n\
\n\
    // Blue.\n\
    if(gray < 0.5625)\n\
    {\n\
        b = 1.0;\n\
    }\n\
    else // gray >= 0.5625 && gray <= 1.0\n\
    {\n\
        float minGray = 0.5625;\n\
        float maxGray = 1.0;\n\
        float maxB = 1.0; // 256/256.\n\
        float minB = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        b = maxB - relativeGray*(maxB - minB);\n\
    }\n\
\n\
    return vec3(r, g, b);\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
void main() {\n\
	vec2 pt = gl_PointCoord - vec2(0.5);\n\
	float r = pt.x*pt.x+pt.y*pt.y;\n\
	if(r > 0.25)\n\
		discard;\n\
\n\
	\n\
\n\
	vec2 windMapTexCoord = v_particle_pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, windMapTexCoord).rg);\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
	vec4 albedo4;\n\
	if(u_colorScale)\n\
	{\n\
		speed_t *= 1.5;\n\
		if(speed_t > 1.0)speed_t = 1.0;\n\
		float b = 1.0 - speed_t;\n\
		float g;\n\
		if(speed_t > 0.5)\n\
		{\n\
			g = 2.0-2.0*speed_t;\n\
		}\n\
		else{\n\
			g = 2.0*speed_t;\n\
		}\n\
		vec3 col3 = getRainbowColor_byHeight(speed_t);\n\
		//vec3 col3 = getWhiteToBlueColor_byHeight(speed_t, 0.0, 1.0);\n\
		float r = speed_t;\n\
		albedo4 = vec4(col3.x, col3.y, col3.z ,u_tailAlpha*u_externAlpha);\n\
	}\n\
	else{\n\
		float intensity = speed_t*3.0;\n\
		if(intensity > 1.0)\n\
			intensity = 1.0;\n\
		albedo4 = vec4(intensity,intensity,intensity,u_tailAlpha*u_externAlpha);\n\
	}\n\
\n\
	gl_FragData[0] = albedo4;\n\
	\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		// save depth, normal, albedo.\n\
		gl_FragData[1] = packDepth(vDepth); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vec3(0.0, 0.0, 1.0);\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
	#endif\n\
	\n\
\n\
	//if(r > 0.16)\n\
	//gl_FragData[0] = vec4(1.0, 1.0, 1.0, u_tailAlpha*u_externAlpha);\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.draw_vert = "precision mediump float;\n\
\n\
attribute float a_index;\n\
\n\
uniform sampler2D u_particles;\n\
uniform float u_particles_res;\n\
\n\
varying vec2 v_particle_pos;\n\
\n\
void main() {\n\
    vec4 color = texture2D(u_particles, vec2(\n\
        fract(a_index / u_particles_res),\n\
        floor(a_index / u_particles_res) / u_particles_res));\n\
\n\
    // decode current particle position from the pixel's RGBA value\n\
    v_particle_pos = vec2(\n\
        color.r / 255.0 + color.b,\n\
        color.g / 255.0 + color.a);\n\
\n\
    gl_PointSize = 1.0;\n\
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);\n\
}\n\
";
ShaderSource.draw_vert3D = "precision highp float;\n\
\n\
// This shader draws windParticles in 3d directly from positions on u_particles image.***\n\
attribute float a_index;\n\
\n\
uniform sampler2D u_particles; // channel-1.***\n\
uniform sampler2D u_particles_next; // channel-2.***\n\
uniform float u_particles_res;\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 ModelViewProjectionMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 u_camPosWC;\n\
uniform vec3 u_geoCoordRadiansMax;\n\
uniform vec3 u_geoCoordRadiansMin;\n\
uniform float pendentPointSize;\n\
uniform float u_tailAlpha;\n\
uniform float u_layerAltitude;\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
uniform float far;\n\
\n\
varying vec2 v_particle_pos;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
vec2 splitValue(float value)\n\
{\n\
	float doubleHigh;\n\
	vec2 resultSplitValue;\n\
	if (value >= 0.0) \n\
	{\n\
		doubleHigh = floor(value / 65536.0) * 65536.0; //unsigned short max\n\
		resultSplitValue.x = doubleHigh;\n\
		resultSplitValue.y = value - doubleHigh;\n\
	}\n\
	else \n\
	{\n\
		doubleHigh = floor(-value / 65536.0) * 65536.0;\n\
		resultSplitValue.x = -doubleHigh;\n\
		resultSplitValue.y = value + doubleHigh;\n\
	}\n\
	\n\
	return resultSplitValue;\n\
}\n\
	\n\
vec3 geographicToWorldCoord(float lonRad, float latRad, float alt)\n\
{\n\
	// NO USED.\n\
	// defined in the LINZ standard LINZS25000 (Standard for New Zealand Geodetic Datum 2000)\n\
	// https://www.linz.govt.nz/data/geodetic-system/coordinate-conversion/geodetic-datum-conversions/equations-used-datum\n\
	// a = semi-major axis.\n\
	// e2 = firstEccentricitySquared.\n\
	// v = a / sqrt(1 - e2 * sin2(lat)).\n\
	// x = (v+h)*cos(lat)*cos(lon).\n\
	// y = (v+h)*cos(lat)*sin(lon).\n\
	// z = [v*(1-e2)+h]*sin(lat).\n\
	float equatorialRadius = 6378137.0; // meters.\n\
	float firstEccentricitySquared = 6.69437999014E-3;\n\
	float cosLon = cos(lonRad);\n\
	float cosLat = cos(latRad);\n\
	float sinLon = sin(lonRad);\n\
	float sinLat = sin(latRad);\n\
	float a = equatorialRadius;\n\
	float e2 = firstEccentricitySquared;\n\
	float v = a/sqrt(1.0 - e2 * sinLat * sinLat);\n\
	float h = alt;\n\
	\n\
	float x = (v+h)*cosLat*cosLon;\n\
	float y = (v+h)*cosLat*sinLon;\n\
	float z = (v*(1.0-e2)+h)*sinLat;\n\
\n\
	vec3 resultCartesian = vec3(x, y, z);\n\
	\n\
	return resultCartesian;\n\
}\n\
\n\
vec2 getOffset(vec2 particlePos, float radius)\n\
{\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
\n\
	float distortion = cos((minLatRad + particlePos.y * latRadRange ));\n\
	float xOffset = (particlePos.x - 0.5)*distortion * lonRadRange * radius;\n\
	float yOffset = (0.5 - particlePos.y) * latRadRange * radius;\n\
\n\
	return vec2(xOffset, yOffset);\n\
}\n\
\n\
void main() {\n\
	vec2 texCoord = vec2(fract(a_index / u_particles_res), floor(a_index / u_particles_res) / u_particles_res);\n\
\n\
	vec4 color_curr = texture2D(u_particles, texCoord);\n\
    //vec2 particle_pos_curr = vec2(color_curr.r / 255.0 + color_curr.b, color_curr.g / 255.0 + color_curr.a);\n\
\n\
	//vec4 color_next = texture2D(u_particles_next, texCoord);\n\
    //vec2 particle_pos_next = vec2(color_next.r / 255.0 + color_next.b, color_next.g / 255.0 + color_next.a);\n\
	//v_particle_pos = mix(particle_pos_curr, particle_pos_next, 0.0);\n\
\n\
    //vec4 color = texture2D(u_particles, texCoord);\n\
    // decode current particle position from the pixel's RGBA value\n\
    v_particle_pos = vec2(color_curr.r / 255.0 + color_curr.b,color_curr.g / 255.0 + color_curr.a); // original.***\n\
\n\
	// calculate the offset at the earth radius.***\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	vec2 offset = getOffset(v_particle_pos, radius);\n\
\n\
	float xOffset = offset.x;\n\
	float yOffset = offset.y;\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);\n\
	\n\
	//vec4 posWC = vec4((rotatedPos.xyz + buildingPosLOW) + ( buildingPosHIGH ), 1.0);\n\
	vec4 posCC = vec4((rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow) + ( buildingPosHIGH - encodedCameraPositionMCHigh), 1.0);\n\
	\n\
	// Now calculate the position on camCoord.***\n\
	//gl_Position = ModelViewProjectionMatrix * posWC;\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * posCC;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * posCC;\n\
	vDepth = (-orthoPos.z)/(far); // the correct value.\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
	\n\
	// Now calculate the point size.\n\
	//float dist = distance(vec4(u_camPosWC.xyz, 1.0), vec4(posWC.xyz, 1.0));\n\
	float dist = length(posCC.xyz);\n\
	gl_PointSize = (1.0 + pendentPointSize/(dist))*u_tailAlpha; \n\
	//gl_PointSize = 3.0*u_tailAlpha; \n\
	float maxPointSize = 4.0;\n\
\n\
	if(gl_PointSize > maxPointSize)\n\
	gl_PointSize = maxPointSize;\n\
	else if(gl_PointSize < 2.0)\n\
	gl_PointSize = 2.0;\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.dustParticleFS = "precision lowp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D smokeTex;\n\
uniform vec4 uStrokeColor;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
uniform int uPointAppereance; // square, circle, romboide,...\n\
uniform int uStrokeSize;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform int uFrustumIdx;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vDustConcent;\n\
varying float vDustConcentRel;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
// pseudo-random generator\n\
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
// https://community.khronos.org/t/random-values/75728\n\
float rand(const vec2 co) {\n\
    float t = dot(rand_constants.xy, co);\n\
    return fract(sin(t) * (rand_constants.z + t));\n\
}\n\
\n\
void main()\n\
{\n\
	vec4 textureColor = texture2D(smokeTex, gl_PointCoord);\n\
	if(textureColor.a < 0.1)\n\
	discard;\n\
\n\
	vec4 finalColor = vColor;\n\
	float alpha = textureColor.a * 2.0;\n\
	float green = 1.0;\n\
\n\
	finalColor = vec4(green * 0.5, green, 0.1, alpha);\n\
	//finalColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
\n\
	gl_FragData[0] = finalColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		gl_FragData[1] = packDepth(vDepth);\n\
		\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = finalColor; \n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.dustParticleVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform float uDustConcentration;\n\
uniform vec2 uDustConcentMinMax;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float vDepth;\n\
\n\
uniform float uFCoef_logDepth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDustConcent;\n\
varying float vDustConcentRel;\n\
\n\
void main()\n\
{\n\
	vec4 rotatedPos;\n\
	rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor = oneColor4;\n\
	}\n\
	else\n\
		vColor = color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	vDepth = -(modelViewMatrixRelToEye * pos).z/far; // original.***\n\
\n\
	float minPointSize = 2.0;\n\
	float maxPointSize = 60.0;\n\
	float pendentPointSize = 2000.0 * uDustConcentration;\n\
	float z_b = gl_Position.z/gl_Position.w;\n\
	float z_n = 2.0 * z_b - 1.0;\n\
	float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
	gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
	//if(gl_PointSize > maxPointSize)\n\
	//	gl_PointSize = maxPointSize;\n\
	//if(gl_PointSize < 2.0)\n\
	//	gl_PointSize = 2.0;\n\
\n\
	vDustConcentRel = uDustConcentration/uDustConcentMinMax[1];\n\
	vDustConcent = uDustConcentration;\n\
	//gl_PointSize *= uDustConcentration;\n\
	glPointSize = gl_PointSize;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}";
ShaderSource.dustTextureModeFS = "precision lowp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texUp;\n\
uniform sampler2D texDown;\n\
uniform vec2 u_tex_res;\n\
\n\
varying vec4 vColor;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform int uFrustumIdx;\n\
uniform vec2 uDustConcentMinMax_up;\n\
uniform vec2 uDustConcentMinMax_down;\n\
uniform float uZFactor;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying vec2 vTexCoord;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
// pseudo-random generator\n\
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
// https://community.khronos.org/t/random-values/75728\n\
float rand(const vec2 co) {\n\
    float t = dot(rand_constants.xy, co);\n\
    return fract(sin(t) * (rand_constants.z + t));\n\
}\n\
\n\
vec3 getRainbowColor_byHeight(float height)\n\
{\n\
	//float gray = (height - uDustConcentMinMax[0])/(uDustConcentMinMax[1] - uDustConcentMinMax[0]);\n\
	float gray = height;\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
}   \n\
\n\
float round(in float value)\n\
{\n\
	return floor(value + 0.5);\n\
}\n\
\n\
float calculateIndex(in float rawConcentration)\n\
{\n\
	//Index index1 = new Index(0, 50, 1);    // 좋음\n\
	//Index index2 = new Index(51, 100, 2);  // 보통\n\
	//Index index3 = new Index(101, 250, 3); // 나쁨\n\
	//Index index4 = new Index(251, 500, 4); // 매우나쁨\n\
\n\
	//pm25.addIndexStep(new IndexStep(index1,  0.0,  15.0));\n\
	//pm25.addIndexStep(new IndexStep(index2, 16.0,  35.0));\n\
	//pm25.addIndexStep(new IndexStep(index3, 36.0,  75.0));\n\
	//pm25.addIndexStep(new IndexStep(index4, 76.0, 500.0));\n\
\n\
	// 1rst, calculate index:\n\
	int indexStep;\n\
	float valueAux = rawConcentration;\n\
	if(valueAux >= 0.0 && valueAux <= 15.0)\n\
	{\n\
		indexStep = 1;\n\
	}\n\
	else if(valueAux > 15.0 && valueAux <= 35.0)\n\
	{\n\
		indexStep = 2;\n\
	}\n\
	else if(valueAux > 35.0 && valueAux <= 75.0)\n\
	{\n\
		indexStep = 3;\n\
	}\n\
	else if(valueAux > 75.0 && valueAux <= 500.0)\n\
	{\n\
		indexStep = 4;\n\
	}\n\
	else\n\
	{\n\
		indexStep = -1;\n\
	}\n\
\n\
	float iLow, iHigh;\n\
	float cLow, cHigh;\n\
\n\
	int idx = indexStep;\n\
\n\
	if(idx == 1)\n\
	{\n\
		iLow = 0.0;\n\
		iHigh = 50.0;\n\
		cLow = 0.0;\n\
		cHigh = 15.0;\n\
	}\n\
	else if(idx == 2)\n\
	{\n\
		iLow = 51.0;\n\
		iHigh = 100.0;\n\
		cLow = 16.0;\n\
		cHigh = 35.0;\n\
	}\n\
	else if(idx == 3)\n\
	{\n\
		iLow = 101.0;\n\
		iHigh = 250.0;\n\
		cLow = 36.0;\n\
		cHigh = 75.0;\n\
	}\n\
	else if(idx == 4)\n\
	{\n\
		iLow = 251.0;\n\
		iHigh = 500.0;\n\
		cLow = 76.0;\n\
		cHigh = 500.0;\n\
	}\n\
\n\
	float rawIndex = (iHigh - iLow) / (cHigh - cLow) * (rawConcentration - cLow) + iLow;\n\
	//return int(round(rawIndex));\n\
	return rawIndex;\n\
}\n\
\n\
vec3 getBBCAndYeonHwa_colorCoded(float index)\n\
{\n\
	// 0 = rgb(0.16796875, 0.51171875, 0.7265625)\n\
	// 50 = rgb(0.66796875, 0.86328125, 0.640625)\n\
	// 100 = rgb(0.99609375, 0.99609375, 0.74609375)\n\
	// 250 = rgb(0.98828125, 0.6796875, 0.37890625)\n\
	// 500 = rgb(0.83984375, 0.09765625, 0.109375)\n\
\n\
	vec3 result;\n\
\n\
	if(index < 0.0)\n\
	{\n\
		return vec3(0.0, 0.0, 0.0);\n\
	}\n\
\n\
	if(index >= 0.0 && index < 50.0)\n\
	{\n\
		vec3 colorTop = vec3(0.16796875, 0.51171875, 0.7265625);\n\
		vec3 colorDown = vec3(0.66796875, 0.86328125, 0.640625);\n\
		float indexFactor = (index - 0.0)/(50.0 - 0.0);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(1.0, 0.0, 0.0);\n\
	}\n\
	else if(index >= 50.0 && index < 100.0)\n\
	{\n\
		vec3 colorTop = vec3(0.66796875, 0.86328125, 0.640625);\n\
		vec3 colorDown = vec3(0.99609375, 0.99609375, 0.74609375);\n\
		float indexFactor = (index - 50.0)/(100.0 - 50.0);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(0.0, 1.0, 0.0);\n\
	}\n\
	else if(index >= 100.0 && index < 250.0)\n\
	{\n\
		vec3 colorTop = vec3(0.99609375, 0.99609375, 0.74609375);\n\
		vec3 colorDown = vec3(0.98828125, 0.6796875, 0.37890625);\n\
		float indexFactor = (index - 100.0)/(250.0 - 100.0);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(0.0, 0.0, 1.0);\n\
	}\n\
	else if(index >= 250.0 && index < 500.0)\n\
	{\n\
		vec3 colorTop = vec3(0.98828125, 0.6796875, 0.37890625);\n\
		vec3 colorDown = vec3(0.83984375, 0.09765625, 0.109375);\n\
		float indexFactor = (index - 250.0)/(500.0 - 250.0);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(1.0, 1.0, 0.0);\n\
	}\n\
	else\n\
	{\n\
		return vec3(1.0, 0.0, 1.0);\n\
	}\n\
\n\
	return result;\n\
}\n\
\n\
vec3 getBBCAndYeonHwa_colorCoded_tight(float rawConcent)\n\
{\n\
	// 0 = rgb(0.16796875, 0.51171875, 0.7265625)\n\
	// 50 = rgb(0.66796875, 0.86328125, 0.640625)\n\
	// 100 = rgb(0.99609375, 0.99609375, 0.74609375)\n\
	// 250 = rgb(0.98828125, 0.6796875, 0.37890625)\n\
	// 500 = rgb(0.83984375, 0.09765625, 0.109375)\n\
\n\
	// Try to exagere index.***\n\
	//uDustConcentMinMax[1] - uDustConcentMinMax[0]\n\
	float maxConcent = uDustConcentMinMax_down[1];\n\
	float minConcent = uDustConcentMinMax_down[0];\n\
	float increConcent = maxConcent/4.0;\n\
\n\
	vec3 result;\n\
\n\
	if(rawConcent < 0.0)\n\
	{\n\
		return vec3(0.0, 0.0, 0.0);\n\
	}\n\
\n\
	if(rawConcent >= minConcent && rawConcent < minConcent + increConcent * 1.0)\n\
	{\n\
		vec3 colorTop = vec3(0.16796875, 0.51171875, 0.7265625);\n\
		vec3 colorDown = vec3(0.66796875, 0.86328125, 0.640625);\n\
		float minValue = minConcent;\n\
		float maxValue = minConcent + increConcent * 1.0;\n\
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);\n\
		indexFactor = indexFactor - floor(indexFactor); \n\
		//result = mix(colorDown, colorTop, indexFactor);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(1.0, 0.0, 0.0);\n\
	}\n\
	else if(rawConcent >= minConcent + increConcent * 1.0 && rawConcent < minConcent + increConcent * 2.0)\n\
	{\n\
		vec3 colorTop = vec3(0.66796875, 0.86328125, 0.640625);\n\
		vec3 colorDown = vec3(0.99609375, 0.99609375, 0.74609375);\n\
		float minValue = minConcent + increConcent * 1.0;\n\
		float maxValue = minConcent + increConcent * 2.0;\n\
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);\n\
		indexFactor = indexFactor - floor(indexFactor); \n\
		//result = mix(colorDown, colorTop, indexFactor);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(0.0, 1.0, 0.0);\n\
	}\n\
	else if(rawConcent >= minConcent + increConcent * 2.0 && rawConcent < minConcent + increConcent * 3.0)\n\
	{\n\
		vec3 colorTop = vec3(0.99609375, 0.99609375, 0.74609375);\n\
		vec3 colorDown = vec3(0.98828125, 0.6796875, 0.37890625);\n\
		float minValue = minConcent + increConcent * 2.0;\n\
		float maxValue = minConcent + increConcent * 3.0;\n\
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);\n\
		indexFactor = indexFactor - floor(indexFactor); \n\
		//result = mix(colorDown, colorTop, indexFactor);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(0.0, 0.0, 1.0);\n\
	}\n\
	else if(rawConcent >= minConcent + increConcent * 3.0 && rawConcent < minConcent + increConcent * 4.0)\n\
	{\n\
		vec3 colorTop = vec3(0.98828125, 0.6796875, 0.37890625);\n\
		vec3 colorDown = vec3(0.83984375, 0.09765625, 0.109375);\n\
		float minValue = minConcent + increConcent * 3.0;\n\
		float maxValue = minConcent + increConcent * 4.0;\n\
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);\n\
		indexFactor = indexFactor - floor(indexFactor); \n\
		//result = mix(colorDown, colorTop, indexFactor);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(1.0, 1.0, 0.0);\n\
	}\n\
	else\n\
	{\n\
		return vec3(1.0, 0.0, 1.0);\n\
	}\n\
\n\
	return result;\n\
}\n\
\n\
void main()\n\
{\n\
	vec4 colorUp = texture2D(texUp, vTexCoord);\n\
	vec4 colorDown = texture2D(texDown, vTexCoord);\n\
\n\
	// now, calculate realConcent_up & realConcent_down.***\n\
	float realConcent_up = colorUp.r * (uDustConcentMinMax_up[1] - uDustConcentMinMax_up[0]) + uDustConcentMinMax_up[0];\n\
	float realConcent_down = colorDown.r * (uDustConcentMinMax_down[1] - uDustConcentMinMax_down[0]) + uDustConcentMinMax_down[0];\n\
	float realConcent = mix(realConcent_down, realConcent_up, uZFactor);\n\
	float concentMin = mix(uDustConcentMinMax_down[0], uDustConcentMinMax_up[0], uZFactor);\n\
	float concentMax = mix(uDustConcentMinMax_down[1], uDustConcentMinMax_up[1], uZFactor);\n\
	vec4 textureColor = mix(colorDown, colorUp, uZFactor);\n\
	//vec4 textureColor = texture2D(texDown, vTexCoord);\n\
\n\
	vec4 finalColor = vColor;\n\
	float alpha = textureColor.a;\n\
	float concent = textureColor.g;\n\
	vec3 rainbowCol = getRainbowColor_byHeight(concent);\n\
\n\
	// BBC & YeonHwa color system.********************************************************************************\n\
	// BBC & YeonHwa color system.********************************************************************************\n\
	//float realConcent = concent * (uDustConcentMinMax_down[1] - uDustConcentMinMax_down[0]) + uDustConcentMinMax_down[0];\n\
	float indexMin = calculateIndex(concentMin);\n\
	float indexMax = calculateIndex(concentMax);\n\
	float index = calculateIndex(realConcent);\n\
\n\
	float scaledIndex = (index - indexMin)/(indexMax - indexMin);\n\
	scaledIndex *= 500.0;\n\
	//vec3 colorAux = getBBCAndYeonHwa_colorCoded(scaledIndex);\n\
	vec3 colorAux = getBBCAndYeonHwa_colorCoded_tight(realConcent);\n\
	//-------------------------------------------------------------------------------------------------------------\n\
	//-------------------------------------------------------------------------------------------------------------\n\
\n\
	//finalColor = vec4(rainbowCol, alpha);\n\
	\n\
	if(concent < 0.00001)\n\
	{\n\
		finalColor = vec4(colorAux, 0.0);\n\
	}\n\
	else{\n\
		finalColor = vec4(colorAux, 0.7);\n\
	}\n\
	\n\
\n\
\n\
	gl_FragData[0] = finalColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		gl_FragData[1] = packDepth(vDepth);\n\
		\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = finalColor; \n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.dustTextureModeVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform float uDustConcentration;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float vDepth;\n\
\n\
uniform float uFCoef_logDepth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying vec2 vTexCoord;\n\
\n\
void main()\n\
{\n\
	vec4 rotatedPos;\n\
	rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor = oneColor4;\n\
	}\n\
	else\n\
		vColor = color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	vDepth = -(modelViewMatrixRelToEye * pos).z/far; // original.***\n\
	vTexCoord = texCoord;\n\
/*\n\
	if(bUseFixPointSize)\n\
	{\n\
		gl_PointSize = fixPointSize;\n\
	}\n\
	else{\n\
		float z_b = gl_Position.z/gl_Position.w;\n\
		float z_n = 2.0 * z_b - 1.0;\n\
		float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
		gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
		if(gl_PointSize > maxPointSize)\n\
			gl_PointSize = maxPointSize;\n\
		if(gl_PointSize < 2.0)\n\
			gl_PointSize = 2.0;\n\
	}\n\
	*/\n\
	/*\n\
	float minPointSize = 2.0;\n\
	float maxPointSize = 60.0;\n\
	float pendentPointSize = 2000.0 * uDustConcentration;\n\
	float z_b = gl_Position.z/gl_Position.w;\n\
	float z_n = 2.0 * z_b - 1.0;\n\
	float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
	gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
	//if(gl_PointSize > maxPointSize)\n\
	//	gl_PointSize = maxPointSize;\n\
	//if(gl_PointSize < 2.0)\n\
	//	gl_PointSize = 2.0;\n\
\n\
	//vDustConcentRel = uDustConcentration/uDustConcentMinMax[1];\n\
	//glPointSize = gl_PointSize;\n\
	*/\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}";
ShaderSource.ElectroMagnetismSurfaceFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D texture_0; \n\
uniform sampler2D texture_1;\n\
\n\
uniform bool textureFlipYAxis;\n\
\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
//uniform float screenWidth;    \n\
//uniform float screenHeight;     \n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform float externalAlpha; // used by effects.\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
uniform int uFrustumIdx;\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
uniform float uInterpolationFactor;\n\
uniform float uMinMaxValue[2];\n\
\n\
// Legend colors.***\n\
uniform vec4 uLegendColors[16];\n\
uniform float uLegendValues[16];\n\
\n\
// base color.***\n\
uniform vec4 uBaseColor4;\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
\n\
varying float vDepth;\n\
varying float vSoundValue;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec4 packDepth( float v ) {\n\
	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	enc = fract(enc);\n\
	enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
	return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depthAux = dot(rgba_depth, bit_shift);\n\
    return depthAux;\n\
}  \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
/*\n\
// unpack depth used for shadow on screen.***\n\
float unpackDepth_A(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
*/\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );\n\
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);\n\
}             \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
\n\
\n\
vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)\n\
{\n\
    \n\
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
\n\
    float value = gray * 4.0;\n\
    value = gray;\n\
    float h = floor(value);\n\
    float f = fract(value);\n\
\n\
    vec4 resultColor = vec4(0.0, 0.0, 0.0, gray);\n\
\n\
    if(hotToCold)\n\
    {\n\
        // HOT to COLD.***\n\
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix red & yellow.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(red, yellow, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix yellow & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, green, f);\n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & cyan.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(green, cyan, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix cyan & blue.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, blue, f);\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // COLD to HOT.***\n\
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix blue & cyan.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(blue, cyan, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix cyan & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, green, f);  \n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & yellow.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(green, yellow, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix yellow & red.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, red, f);\n\
        }\n\
    }\n\
\n\
    return resultColor;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
	//bool testBool = false;\n\
	//float occlusion = 1.0; // ambient occlusion.***\n\
	//vec3 normal2 = vNormal;	\n\
	//float scalarProd = 1.0;\n\
	\n\
	//vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
	//float linearDepth = getDepth(screenPos);   \n\
	//vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	//occlusion = 1.0;\n\
	vec4 textureColor;\n\
	vec4 textureColor_0;\n\
	vec4 textureColor_1;\n\
\n\
    if(colorType == 2)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor_0 = texture2D(texture_0, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
			textureColor_1 = texture2D(texture_1, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor_0 = texture2D(texture_0, vec2(vTexCoord.s, vTexCoord.t));\n\
			textureColor_1 = texture2D(texture_1, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
\n\
		textureColor = mix(textureColor_0, textureColor_1, uInterpolationFactor);\n\
    }\n\
    else if(colorType == 0)\n\
	{\n\
        textureColor = oneColor4;\n\
    }\n\
	else if(colorType == 1)\n\
	{\n\
        textureColor = vColor4;\n\
    }\n\
	else if(colorType == 3)\n\
	{\n\
		bool hotToCold = false;\n\
		float height = vSoundValue;\n\
\n\
        textureColor = getRainbowColor_byHeight(height, uMinMaxValue[0], uMinMaxValue[1], hotToCold);\n\
\n\
		textureColor = vec4(textureColor.a, textureColor.a, textureColor.a, textureColor.a);\n\
    }\n\
	else if(colorType == 4)\n\
	{\n\
		float height = vSoundValue;\n\
		float q = (height - uMinMaxValue[0]) / (uMinMaxValue[1] - uMinMaxValue[0]);\n\
\n\
		textureColor = vec4(q,q*0.25,q*0.5,q);\n\
    }\n\
	else if(colorType == 5)\n\
	{\n\
		// use an external legend.***\n\
		//vec4 colorAux = vec4(0.3, 0.3, 0.3, 0.4);\n\
        vec4 colorAux = uBaseColor4;\n\
\n\
		// find legendIdx.***\n\
		for(int i=0; i<15; i++)\n\
		{\n\
			if(vSoundValue > uLegendValues[i] && vSoundValue <= uLegendValues[i + 1])\n\
			{\n\
				colorAux = uLegendColors[i];\n\
				break;\n\
			}\n\
		}\n\
\n\
        if(colorAux.a == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
\n\
		textureColor = colorAux;\n\
    }\n\
	\n\
    vec4 finalColor;\n\
	finalColor = textureColor;\n\
\n\
	vec4 albedo4 = finalColor;\n\
\n\
	\n\
    gl_FragData[0] = finalColor; \n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	{\n\
		// save depth, normal, albedo.\n\
		float depthAux = vDepth;\n\
		gl_FragData[1] = packDepth(depthAux); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.ElectroMagnetismSurfaceVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	attribute float value;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying vec3 vertexPosLC;\n\
	varying vec4 vColor4; // color from attributes\n\
	varying vec3 vLightDir; \n\
	varying vec3 vNormalWC; \n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	varying float vDepth;\n\
	varying float vSoundValue;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
		currentTMat = mat3(buildingRotMatrix);\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		\n\
		\n\
		uAmbientColor = vec3(1.0);\n\
		vNormalWC = rotatedNormal;\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
		vLightDir = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		float directionalLightWeighting = 1.0;\n\
\n\
\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
		\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		vDepth = -orthoPos.z/far;\n\
\n\
		vSoundValue = value;\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
\n\
		gl_PointSize = 5.0;\n\
	}";
ShaderSource.GBufferFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
 \n\
uniform sampler2D diffuseTex;\n\
uniform bool textureFlipYAxis;  \n\
uniform vec4 oneColor4;\n\
\n\
//uniform bool bApplyScpecularLighting;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
\n\
uniform mat4 modelViewMatrixRelToEye;\n\
\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
// clipping planes.***\n\
uniform bool bApplyClippingPlanes; // old. deprecated.***\n\
uniform int clippingType; // 0= no clipping. 1= clipping by planes. 2= clipping by localCoord polyline. 3= clip by heights, 4= clip by (2, 3)\n\
uniform int clippingPlanesCount;\n\
uniform vec3 clippingBoxSplittedPos[2]; // Box position. posHIGH.xyz & posLOW.xyz.***\n\
uniform vec3 clippingBoxPlanesPosLC[6]; // planes local position (relative to box).***\n\
uniform vec3 clippingBoxPlanesNorLC[6]; // planes local normals (relative to box).***\n\
uniform mat4 clippingBoxRotMatrix;\n\
uniform vec4 clippingPlanes[6]; // old.\n\
uniform vec2 clippingPolygon2dPoints[64];\n\
uniform int clippingConvexPolygon2dPointsIndices[64];\n\
uniform vec4 limitationInfringedColor4;\n\
uniform vec2 limitationHeights;\n\
\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
\n\
varying vec3 vertexPos; // this is the orthoPos.***\n\
varying vec3 vertexPosLC;\n\
\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float depth;\n\
\n\
\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}            \n\
\n\
\n\
float clipVertexByPlane(in vec3 planePos, in vec3 planeNor, in vec3 point)\n\
{\n\
	float coef_d = -planeNor.x * planePos.x - planeNor.y * planePos.y - planeNor.z * planePos.z;\n\
	float dist = planeNor.x * point.x + planeNor.y * point.y + planeNor.z * point.z + coef_d;\n\
	return dist;\n\
	//if(dist < 0.0)\n\
	//return true;\n\
	//else return false;\n\
}\n\
\n\
vec2 getDirection2d(in vec2 startPoint, in vec2 endPoint)\n\
{\n\
	//vec2 vector = endPoint - startPoint;\n\
	//float length = length( vector);\n\
	//vec2 dir = vec2(vector.x/length, vector.y/length);\n\
	vec2 dir = normalize(endPoint - startPoint);\n\
	return dir;\n\
}\n\
\n\
bool intersectionLineToLine(in vec2 line_1_pos, in vec2 line_1_dir,in vec2 line_2_pos, in vec2 line_2_dir, out vec2 intersectionPoint2d)\n\
{\n\
	bool bIntersection = false;\n\
\n\
	float zero = 10E-8;\n\
	float intersectX;\n\
	float intersectY;\n\
\n\
	// check if 2 lines are parallel.***\n\
	float dotProd = abs(dot(line_1_dir, line_2_dir));\n\
	if(abs(dotProd-1.0) < zero)\n\
	return false;\n\
\n\
	if (abs(line_1_dir.x) < zero)\n\
	{\n\
		// this is a vertical line.\n\
		float slope = line_2_dir.y / line_2_dir.x;\n\
		float b = line_2_pos.y - slope * line_2_pos.x;\n\
		\n\
		intersectX = line_1_pos.x;\n\
		intersectY = slope * line_1_pos.x + b;\n\
		bIntersection = true;\n\
	}\n\
	else if (abs(line_1_dir.y) < zero)\n\
	{\n\
		// this is a horizontal line.\n\
		// must check if the \"line\" is vertical.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			intersectX = line_2_pos.x;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (line_1_pos.y - b)/slope;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}	\n\
	}\n\
	else \n\
	{\n\
		// this is oblique.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			intersectX = line_2_pos.x;\n\
			intersectY = intersectX * mySlope + myB;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (myB - b)/ (slope - mySlope);\n\
			intersectY = slope * intersectX + b;\n\
			bIntersection = true;\n\
		}\n\
	}\n\
\n\
	intersectionPoint2d.x = intersectX;\n\
	intersectionPoint2d.y = intersectY;\n\
\n\
	return bIntersection;\n\
}\n\
\n\
vec2 getProjectedPoint2dToLine(in vec2 line_point, in vec2 line_dir, in vec2 point)\n\
{\n\
	bool intersection = false;\n\
\n\
	// create a perpendicular left line.***\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
	vec2 lineLeft_point = vec2(point.x, point.y);\n\
	vec2 projectedPoint = vec2(0);\n\
	intersection = intersectionLineToLine(line_point, line_dir, lineLeft_point, lineLeft_dir, projectedPoint);\n\
\n\
	return projectedPoint;\n\
}\n\
\n\
int getRelativePositionOfPointToLine(in vec2 line_pos, in vec2 line_dir, vec2 point)\n\
{\n\
	// 0 = coincident. 1= left side. 2= right side.***\n\
	int relPos = -1;\n\
\n\
	vec2 projectedPoint = getProjectedPoint2dToLine(line_pos, line_dir, point );\n\
	float dist = length(point - projectedPoint);\n\
\n\
	if(dist < 1E-8)\n\
	{\n\
		relPos = 0; // the point is coincident to line.***\n\
		return relPos;\n\
	}\n\
\n\
	vec2 myVector = normalize(point - projectedPoint);\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
\n\
	float dotProd = dot(lineLeft_dir, myVector);\n\
\n\
	if(dotProd > 0.0)\n\
	{\n\
		relPos = 1; // is in left side of the line.***\n\
	}\n\
	else\n\
	{\n\
		relPos = 2; // is in right side of the line.***\n\
	}\n\
\n\
	return relPos;\n\
}\n\
\n\
bool isPointInsideLimitationConvexPolygon(in vec2 point2d)\n\
{\n\
	bool isInside = true;\n\
\n\
	// Check polygons.***\n\
	int startIdx = -1;\n\
	int endIdx = -1;\n\
	for(int i=0; i<32; i++)\n\
	{\n\
		startIdx = clippingConvexPolygon2dPointsIndices[2*i];  // 0\n\
		endIdx = clippingConvexPolygon2dPointsIndices[2*i+1];	 // 3\n\
\n\
		if(startIdx < 0 || endIdx < 0)\n\
		break;\n\
\n\
		isInside  = true;\n\
		\n\
		isInside = true;\n\
		vec2 pointStart = clippingPolygon2dPoints[0];\n\
		for(int j=0; j<32; j++)\n\
		{\n\
			if(j > endIdx)\n\
			break;\n\
\n\
			if(j == startIdx)\n\
				pointStart = clippingPolygon2dPoints[j];\n\
\n\
			if(j >= startIdx && j<endIdx)\n\
			{\n\
				vec2 point0;\n\
				vec2 point1;\n\
				\n\
				if(j == endIdx)\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = pointStart;\n\
				}\n\
				else\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = clippingPolygon2dPoints[j+1];\n\
				}\n\
\n\
				// create the line of the segment.***\n\
				vec2 dir = getDirection2d(point0, point1);\n\
\n\
				// now, check the relative position of the point with the edge line.***\n\
				int relPos = getRelativePositionOfPointToLine(point0, dir, point2d);\n\
				if(relPos == 2)\n\
				{\n\
					// the point is in the right side of the edge line, so is out of the polygon.***\n\
					isInside = false;\n\
					break;\n\
				}\n\
			}\n\
\n\
		}\n\
		\n\
\n\
		if(isInside)\n\
		return true;\n\
\n\
	}\n\
\n\
	return isInside;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
	if(clippingType == 2)\n\
	{\n\
		// clip by limitationPolygon.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 3)\n\
	{\n\
		// check limitation heights.***\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 4)\n\
	{\n\
		// clip by limitationPolygon & heights.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
\n\
	// Check if clipping.********************************************\n\
	bool discardFrag = false;\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		// check gl_FrontFacing. todo.\n\
		discardFrag = true;\n\
\n\
		vec3 boxPosHIGH = clippingBoxSplittedPos[0];\n\
		vec3 boxPosLOW = clippingBoxSplittedPos[1];\n\
\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
\n\
			//vec4 plane = clippingPlanes[i]; // old. delete this.\n\
			vec3 planePosLC = clippingBoxPlanesPosLC[i];\n\
			vec3 planeNorLC = clippingBoxPlanesNorLC[i];\n\
\n\
			// 1rst, rotate the posLC.***\n\
			vec3 rotatedPos = (clippingBoxRotMatrix * vec4(planePosLC, 1.0)).xyz;\n\
			vec3 planePosHIGH = boxPosHIGH;\n\
			vec3 planePosLOW = boxPosLOW + rotatedPos;\n\
			vec3 highDifference = planePosHIGH.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = planePosLOW.xyz - encodedCameraPositionMCLow.xyz;\n\
\n\
			vec3 planePosWC = highDifference.xyz + lowDifference.xyz;\n\
			vec4 planePosCC = modelViewMatrixRelToEye * vec4(planePosWC, 1.0);\n\
\n\
			mat3 rotMat = mat3(clippingBoxRotMatrix);\n\
			vec3 planeNorWC = rotMat * planeNorLC;\n\
			vec4 planeNorCC = modelViewMatrixRelToEye * vec4(planeNorWC, 1.0);\n\
\n\
			// now check if vertexPos is in front of plane or rear of the plane.\n\
			float dist = clipVertexByPlane(planePosCC.xyz, planeNorCC.xyz, vertexPos);\n\
			if(dist > 0.0)\n\
			{\n\
				discardFrag = false; \n\
				break;\n\
			}\n\
\n\
		}\n\
\n\
		if(discardFrag)\n\
		{\n\
			discard;\n\
		}\n\
	}\n\
	\n\
	//----------------------------------------------------------------\n\
\n\
	vec4 textureColor;\n\
    if(colorType == 2)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
			 \n\
        }\n\
        else{\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
		\n\
        //if(textureColor.w == 0.0)\n\
		if(textureColor.w < 0.01)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else if(colorType == 0)\n\
	{\n\
        textureColor = oneColor4;\n\
    }\n\
	else if(colorType == 1)\n\
	{\n\
        textureColor = vColor4;\n\
    }\n\
	\n\
	float depthAux = depth;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		depthAux = gl_FragDepthEXT; \n\
	}\n\
	#endif\n\
\n\
	vec4 albedo4 = vec4(textureColor.xyz, 1.0);\n\
	gl_FragData[0] = albedo4; // anything.\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		// save depth, normal, albedo.\n\
		gl_FragData[1] = packDepth(depthAux); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
\n\
		// debugTex.***\n\
		//gl_FragData[5] = vec4(0.0, 0.0, depthDebug.z, 1.0); \n\
	}\n\
	#endif\n\
\n\
\n\
	\n\
}";
ShaderSource.GBufferORTFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
 \n\
uniform sampler2D diffuseTex;\n\
uniform bool textureFlipYAxis;  \n\
uniform vec4 oneColor4;\n\
\n\
//uniform bool bApplyScpecularLighting;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
uniform int u_outputTarget; // 0 = depth, 1= normal, 2= albedo, 3= selColor.***\n\
\n\
// clipping planes.***\n\
uniform bool bApplyClippingPlanes; // old. deprecated.***\n\
uniform int clippingType; // 0= no clipping. 1= clipping by planes. 2= clipping by localCoord polyline. 3= clip by heights, 4= clip by (2, 3)\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
uniform vec2 clippingPolygon2dPoints[64];\n\
uniform int clippingConvexPolygon2dPointsIndices[64];\n\
uniform vec4 limitationInfringedColor4;\n\
uniform vec2 limitationHeights;\n\
\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
\n\
varying vec3 vertexPos; // this is the orthoPos.***\n\
varying vec3 vertexPosLC;\n\
\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float depth;\n\
\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}            \n\
\n\
\n\
bool clipVertexByPlane(in vec4 plane, in vec3 point)\n\
{\n\
	float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;\n\
	\n\
	if(dist < 0.0)\n\
	return true;\n\
	else return false;\n\
}\n\
\n\
vec2 getDirection2d(in vec2 startPoint, in vec2 endPoint)\n\
{\n\
	//vec2 vector = endPoint - startPoint;\n\
	//float length = length( vector);\n\
	//vec2 dir = vec2(vector.x/length, vector.y/length);\n\
	vec2 dir = normalize(endPoint - startPoint);\n\
	return dir;\n\
}\n\
\n\
bool intersectionLineToLine(in vec2 line_1_pos, in vec2 line_1_dir,in vec2 line_2_pos, in vec2 line_2_dir, out vec2 intersectionPoint2d)\n\
{\n\
	bool bIntersection = false;\n\
\n\
	float zero = 10E-8;\n\
	float intersectX;\n\
	float intersectY;\n\
\n\
	// check if 2 lines are parallel.***\n\
	float dotProd = abs(dot(line_1_dir, line_2_dir));\n\
	if(abs(dotProd-1.0) < zero)\n\
	return false;\n\
\n\
	if (abs(line_1_dir.x) < zero)\n\
	{\n\
		// this is a vertical line.\n\
		float slope = line_2_dir.y / line_2_dir.x;\n\
		float b = line_2_pos.y - slope * line_2_pos.x;\n\
		\n\
		intersectX = line_1_pos.x;\n\
		intersectY = slope * line_1_pos.x + b;\n\
		bIntersection = true;\n\
	}\n\
	else if (abs(line_1_dir.y) < zero)\n\
	{\n\
		// this is a horizontal line.\n\
		// must check if the \"line\" is vertical.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			intersectX = line_2_pos.x;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (line_1_pos.y - b)/slope;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}	\n\
	}\n\
	else \n\
	{\n\
		// this is oblique.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			intersectX = line_2_pos.x;\n\
			intersectY = intersectX * mySlope + myB;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (myB - b)/ (slope - mySlope);\n\
			intersectY = slope * intersectX + b;\n\
			bIntersection = true;\n\
		}\n\
	}\n\
\n\
	intersectionPoint2d.x = intersectX;\n\
	intersectionPoint2d.y = intersectY;\n\
\n\
	return bIntersection;\n\
}\n\
\n\
vec2 getProjectedPoint2dToLine(in vec2 line_point, in vec2 line_dir, in vec2 point)\n\
{\n\
	bool intersection = false;\n\
\n\
	// create a perpendicular left line.***\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
	vec2 lineLeft_point = vec2(point.x, point.y);\n\
	vec2 projectedPoint = vec2(0);\n\
	intersection = intersectionLineToLine(line_point, line_dir, lineLeft_point, lineLeft_dir, projectedPoint);\n\
\n\
	return projectedPoint;\n\
}\n\
\n\
int getRelativePositionOfPointToLine(in vec2 line_pos, in vec2 line_dir, vec2 point)\n\
{\n\
	// 0 = coincident. 1= left side. 2= right side.***\n\
	int relPos = -1;\n\
\n\
	vec2 projectedPoint = getProjectedPoint2dToLine(line_pos, line_dir, point );\n\
	float dist = length(point - projectedPoint);\n\
\n\
	if(dist < 1E-8)\n\
	{\n\
		relPos = 0; // the point is coincident to line.***\n\
		return relPos;\n\
	}\n\
\n\
	vec2 myVector = normalize(point - projectedPoint);\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
\n\
	float dotProd = dot(lineLeft_dir, myVector);\n\
\n\
	if(dotProd > 0.0)\n\
	{\n\
		relPos = 1; // is in left side of the line.***\n\
	}\n\
	else\n\
	{\n\
		relPos = 2; // is in right side of the line.***\n\
	}\n\
\n\
	return relPos;\n\
}\n\
\n\
bool isPointInsideLimitationConvexPolygon(in vec2 point2d)\n\
{\n\
	bool isInside = true;\n\
\n\
	// Check polygons.***\n\
	int startIdx = -1;\n\
	int endIdx = -1;\n\
	for(int i=0; i<32; i++)\n\
	{\n\
		startIdx = clippingConvexPolygon2dPointsIndices[2*i];  // 0\n\
		endIdx = clippingConvexPolygon2dPointsIndices[2*i+1];	 // 3\n\
\n\
		if(startIdx < 0 || endIdx < 0)\n\
		break;\n\
\n\
		isInside  = true;\n\
		\n\
		isInside = true;\n\
		vec2 pointStart = clippingPolygon2dPoints[0];\n\
		for(int j=0; j<32; j++)\n\
		{\n\
			if(j > endIdx)\n\
			break;\n\
\n\
			if(j == startIdx)\n\
				pointStart = clippingPolygon2dPoints[j];\n\
\n\
			if(j >= startIdx && j<endIdx)\n\
			{\n\
				vec2 point0;\n\
				vec2 point1;\n\
				\n\
				if(j == endIdx)\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = pointStart;\n\
				}\n\
				else\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = clippingPolygon2dPoints[j+1];\n\
				}\n\
\n\
				// create the line of the segment.***\n\
				vec2 dir = getDirection2d(point0, point1);\n\
\n\
				// now, check the relative position of the point with the edge line.***\n\
				int relPos = getRelativePositionOfPointToLine(point0, dir, point2d);\n\
				if(relPos == 2)\n\
				{\n\
					// the point is in the right side of the edge line, so is out of the polygon.***\n\
					isInside = false;\n\
					break;\n\
				}\n\
			}\n\
\n\
		}\n\
		\n\
\n\
		if(isInside)\n\
		return true;\n\
\n\
	}\n\
\n\
	return isInside;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
	if(clippingType == 2)\n\
	{\n\
		// clip by limitationPolygon.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 3)\n\
	{\n\
		// check limitation heights.***\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 4)\n\
	{\n\
		// clip by limitationPolygon & heights.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
\n\
	// Check if clipping.********************************************\n\
	\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		bool discardFrag = false;\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			vec4 plane = clippingPlanes[i];\n\
			\n\
			// calculate any point of the plane.\n\
			if(!clipVertexByPlane(plane, vertexPos))\n\
			{\n\
				discardFrag = false; // false.\n\
				break;\n\
			}\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
		}\n\
		\n\
	}\n\
	\n\
	//----------------------------------------------------------------\n\
	\n\
	float depthAux = depth;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		depthAux = gl_FragDepthEXT; \n\
	}\n\
	#endif\n\
\n\
	//u_outputTarget; // 0 = depth, 1= normal, 2= albedo, 3= selColor.***\n\
	if(u_outputTarget == 0)\n\
	{\n\
		gl_FragData[0] = packDepth(depthAux); \n\
	}\n\
	else if(u_outputTarget == 1)\n\
	{\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[0] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
	}\n\
	else if(u_outputTarget == 2)\n\
	{\n\
		vec4 textureColor;\n\
		if(colorType == 2)\n\
		{\n\
			if(textureFlipYAxis)\n\
			{\n\
				textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
				\n\
			}\n\
			else{\n\
				textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
			}\n\
			\n\
			if(textureColor.w == 0.0)\n\
			{\n\
				discard;\n\
			}\n\
		}\n\
		else if(colorType == 0)\n\
		{\n\
			textureColor = oneColor4;\n\
		}\n\
		else if(colorType == 1)\n\
		{\n\
			textureColor = vColor4;\n\
		}\n\
\n\
		vec4 albedo4 = vec4(textureColor.xyz, 1.0);\n\
		gl_FragData[0] = albedo4; // anything.\n\
	}\n\
	else if(u_outputTarget == 3)\n\
	{\n\
		gl_FragData[0] = uSelColor4; \n\
	}\n\
	\n\
}";
ShaderSource.GBufferVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 vertexPos;\n\
	varying vec3 vertexPosLC;\n\
	varying vec4 vColor4; // color from attributes \n\
	varying float discardFrag;\n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	varying float depth;\n\
	//varying vec3 depthDebug;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		if(refMatrixType == 0) // 0= identity, 1= translate, 2= transform\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 1)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 2)\n\
		{\n\
			rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(RefTransfMatrix);\n\
		}\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		\n\
\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		depth = (-orthoPos.z)/(far); // the correct value.\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			//flogz = 1.0 + gl_Position.w;\n\
			flogz = 1.0 - orthoPos.z;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
\n\
		//if(orthoPos.z < 0.0)\n\
		//aColor4 = vec4(1.0, 0.0, 0.0, 1.0);\n\
		//else\n\
		//aColor4 = vec4(0.0, 1.0, 0.0, 1.0);\n\
		gl_PointSize = 5.0;\n\
	}";
ShaderSource.GroundStencilPrimitivesFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
uniform vec4 oneColor4;\n\
\n\
uniform float near;\n\
uniform float far;\n\
\n\
// clipping planes.***\n\
uniform bool bApplyClippingPlanes;\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying float depth;  \n\
varying vec3 vertexPos;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0); // original.***\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625);  // original.*** \n\
	\n\
    //vec4 res = fract(depth * bit_shift); // Is not precise.\n\
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
\n\
//vec4 PackDepth32( in float depth )\n\
//{\n\
//    depth *= (16777216.0 - 1.0) / (16777216.0);\n\
//    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
//    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;\n\
//}\n\
\n\
bool clipVertexByPlane(in vec4 plane, in vec3 point)\n\
{\n\
	float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;\n\
	\n\
	if(dist < 0.0)\n\
	return true;\n\
	else return false;\n\
}\n\
\n\
void main()\n\
{     \n\
	// 1rst, check if there are clipping planes.\n\
    /*\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		bool discardFrag = true;\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			vec4 plane = clippingPlanes[i];\n\
			if(!clipVertexByPlane(plane, vertexPos))\n\
			{\n\
				discardFrag = false;\n\
				break;\n\
			}\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
		}\n\
		\n\
		if(discardFrag)\n\
		discard;\n\
	}\n\
    */\n\
	//if(!bUseLogarithmicDepth)\n\
    //	gl_FragData[0] = packDepth(-depth);\n\
\n\
gl_FragColor = oneColor4; \n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		//gl_FragData[0] = packDepth(gl_FragDepthEXT);\n\
	}\n\
	#endif\n\
\n\
    \n\
}";
ShaderSource.GroundStencilPrimitivesVS = "attribute vec3 position;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 RefTransfMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 scaleLC;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
varying float depth;\n\
varying vec3 vertexPos;\n\
  \n\
void main()\n\
{	\n\
	vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
	vec4 rotatedPos;\n\
\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    //linear depth in camera space (0..far)\n\
	vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
    depth = orthoPos.z/far; // original.***\n\
\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//-----------------------------------------------------------------------------------\n\
		//float C = 0.0001;\n\
		flogz = 1.0 + gl_Position.w; // use \"z\" instead \"w\" for fast decoding.***\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
\n\
	vertexPos = orthoPos.xyz;\n\
}";
ShaderSource.ImageViewerRectangleShaderFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D diffuseTex;\n\
uniform bool textureFlipYAxis;\n\
varying vec3 vNormal;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 m;\n\
uniform vec2 noiseScale;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform float shininessValue;\n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
varying vec4 aColor4; // color from attributes\n\
uniform bool bApplyScpecularLighting;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
\n\
varying vec3 diffuseColor;\n\
uniform vec3 specularColor;\n\
varying vec3 vertexPos;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform float ambientReflectionCoef;\n\
uniform float diffuseReflectionCoef;  \n\
uniform float specularReflectionCoef; \n\
varying float applySpecLighting;\n\
uniform bool bApplySsao;\n\
uniform float externalAlpha;\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}  \n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
    float depth = dot( pack, 1.0 / vec4(1.0, 256.0, 256.0*256.0, 16777216.0) ); // 256.0*256.0*256.0 = 16777216.0\n\
    return depth * (16777216.0) / (16777216.0 - 1.0);\n\
}              \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return UnpackDepth32(texture2D(depthTex, coord.xy));\n\
}    \n\
\n\
void main()\n\
{\n\
	vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
	float alfa = externalAlpha;\n\
	float depth = UnpackDepth32(textureColor);\n\
	\n\
    vec4 finalColor;\n\
	finalColor = vec4(depth, depth, depth, alfa);\n\
\n\
	//finalColor = vec4(vNormal, 1.0); // test to render normal color coded.***\n\
    gl_FragColor = finalColor; \n\
}";
ShaderSource.ImageViewerRectangleShaderVS = "	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 projectionMatrix;  \n\
	uniform mat4 modelViewMatrix;\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform bool bApplySpecularLighting;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying float applySpecLighting;\n\
	varying vec4 aColor4; // color from attributes\n\
	\n\
	void main()\n\
    {	\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		if(refMatrixType == 0)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 1)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 2)\n\
		{\n\
			rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(RefTransfMatrix);\n\
		}\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
		//vertexPos = vec3(modelViewMatrixRelToEye * pos4);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8);\n\
		vec3 uLightingDirection = vec3(0.6, 0.6, 0.6);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		vTexCoord = texCoord;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		\n\
		if(bApplySpecularLighting)\n\
			applySpecLighting = 1.0;\n\
		else\n\
			applySpecLighting = -1.0;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		\n\
		if(colorType == 1)\n\
			aColor4 = color4;\n\
	}";
ShaderSource.InvertedBoxFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D diffuseTex;\n\
uniform bool hasTexture;\n\
uniform bool textureFlipYAxis;\n\
varying vec3 vNormal;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 m;\n\
uniform vec2 noiseScale;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform float shininessValue;\n\
uniform vec3 kernel[16];   \n\
uniform vec4 vColor4Aux;\n\
\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
\n\
varying vec3 diffuseColor;\n\
uniform vec3 specularColor;\n\
varying vec3 vertexPos;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform float ambientReflectionCoef;\n\
uniform float diffuseReflectionCoef;  \n\
uniform float specularReflectionCoef; \n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}                \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
}    \n\
\n\
void main()\n\
{          \n\
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
    float linearDepth = getDepth(screenPos);          \n\
    vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
\n\
    vec3 normal2 = vNormal;\n\
            \n\
    vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
    vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
    vec3 bitangent = cross(normal2, tangent);\n\
    mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
    \n\
    float occlusion = 0.0;\n\
    for(int i = 0; i < kernelSize; ++i)\n\
    {    	 \n\
        vec3 sample = origin + (tbn * kernel[i]) * radius;\n\
        vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
        offset.xy /= offset.w;\n\
        offset.xy = offset.xy * 0.5 + 0.5;        \n\
        float sampleDepth = -sample.z/far;\n\
		if(sampleDepth > 0.49)\n\
			continue;\n\
        float depthBufferValue = getDepth(offset.xy);				              \n\
        float range_check = abs(linearDepth - depthBufferValue)+radius*0.998;\n\
        if (range_check < radius*1.001 && depthBufferValue <= sampleDepth)\n\
        {\n\
            occlusion +=  1.0;\n\
        }\n\
    }   \n\
        \n\
    occlusion = 1.0 - occlusion / float(kernelSize);\n\
\n\
    vec3 lightPos = vec3(20.0, 60.0, 20.0);\n\
    vec3 L = normalize(lightPos - vertexPos);\n\
    float lambertian = max(dot(normal2, L), 0.0);\n\
    float specular = 0.0;\n\
    if(lambertian > 0.0)\n\
    {\n\
        vec3 R = reflect(-L, normal2);      // Reflected light vector\n\
        vec3 V = normalize(-vertexPos); // Vector to viewer\n\
        \n\
        // Compute the specular term\n\
        float specAngle = max(dot(R, V), 0.0);\n\
        specular = pow(specAngle, shininessValue);\n\
    }\n\
	\n\
	if(lambertian < 0.5)\n\
    {\n\
		lambertian = 0.5;\n\
	}\n\
\n\
    vec4 textureColor;\n\
    if(hasTexture)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
		\n\
        if(textureColor.w == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else{\n\
        textureColor = vColor4Aux;\n\
    }\n\
	\n\
	vec3 ambientColor = vec3(textureColor.x, textureColor.y, textureColor.z);\n\
\n\
    gl_FragColor = vec4((ambientReflectionCoef * ambientColor + diffuseReflectionCoef * lambertian * textureColor.xyz + specularReflectionCoef * specular * specularColor)*vLightWeighting * occlusion, 1.0); \n\
}\n\
";
ShaderSource.InvertedBoxVS = "	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 projectionMatrix;  \n\
	uniform mat4 modelViewMatrix;\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	\n\
	void main()\n\
    {	\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		if(refMatrixType == 0)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 1)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 2)\n\
		{\n\
			rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(RefTransfMatrix);\n\
		}\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
		vertexPos = vec3(modelViewMatrixRelToEye * pos4);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8);\n\
		vec3 uLightingDirection = vec3(0.6, 0.6, 0.6);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		vTexCoord = texCoord;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	}\n\
";
ShaderSource.LBufferFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D normalTex;\n\
uniform samplerCube light_depthCubeMap;\n\
\n\
uniform mat4 projectionMatrixInv;\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform mat4 buildingRotMatrixInv;\n\
\n\
// Light parameters.\n\
uniform float uLightParameters[4]; // 0= lightDist, 1= lightFalloffDist, 2= maxSpotDot, 3= falloffSpotDot.\n\
\n\
uniform float near;\n\
uniform float far;            \n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;     \n\
\n\
uniform vec3 uLightColorAndBrightness;\n\
uniform float uLightIntensity;\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform bool bApplyShadows;\n\
uniform vec2 uNearFarArray[4];\n\
uniform int u_processType; // 1= light pass. 2= lightFog pass.\n\
\n\
varying vec3 vNormal;\n\
varying vec3 vLightDirCC;\n\
varying vec3 vLightPosCC; \n\
varying vec3 vertexPosLC;\n\
varying vec4 vertexPosCC;\n\
varying float vDotProdLight;\n\
varying vec3 vCrossProdLight;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}  \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(normalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}                   \n\
        \n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
		/*\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z*0.0001;\n\
        float Fcoef_half = uFCoef_logDepth/2.0;\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = (flogzAux - 1.0);\n\
		linearDepth = z/(far);\n\
		*/\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
} \n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 getPosCC(in vec2 screenPosition, inout int dataType, inout vec4 normal4)\n\
{\n\
	normal4 = getNormal(screenPosition);\n\
	int estimatedFrustumIdx = int(floor(100.0*normal4.w));\n\
	dataType = 0; // 0= general geometry. 1= tinTerrain. 2= PointsCloud.\n\
\n\
	// Check the type of the data.******************\n\
	// dataType = 0 -> general geometry data.\n\
	// dataType = 1 -> tinTerrain data.\n\
	// dataType = 2 -> points cloud data.\n\
	//----------------------------------------------\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
	vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear = nearFar.x;\n\
	float currFar = nearFar.y;\n\
	float linearDepth = getDepth(screenPosition);\n\
\n\
	// calculate the real pos of origin.\n\
	float origin_zDist = linearDepth * currFar; // original.\n\
	vec3 origin_real = getViewRay(screenPosition, origin_zDist);\n\
\n\
	return origin_real;\n\
}\n\
\n\
int getFaceIdx(in vec3 normalRelToLight, inout vec2 faceTexCoord, inout vec3 faceDir)\n\
{\n\
	int faceIdx = -1;\n\
\n\
	// Note: the \"faceTexCoord\" is 1- to 1 range.\n\
\n\
	float x = normalRelToLight.x;\n\
	float y = normalRelToLight.y;\n\
	float z = normalRelToLight.z;\n\
\n\
	float absX = abs(x);\n\
	float absY = abs(y);\n\
	float absZ = abs(normalRelToLight.z);\n\
\n\
	bool isXPositive = true;\n\
	bool isYPositive = true;\n\
	bool isZPositive = true;\n\
\n\
	if(x < 0.0)\n\
	isXPositive = false;\n\
\n\
	if(y < 0.0)\n\
	isYPositive = false;\n\
\n\
	if(z < 0.0)\n\
	isZPositive = false;\n\
\n\
	// xPositive.\n\
	if(isXPositive && absX >= absY && absX >= absZ)\n\
	{\n\
		faceIdx = 0;\n\
		faceTexCoord = vec2(y, z);\n\
		faceDir = vec3(1.0, 0.0, 0.0);\n\
	}\n\
\n\
	// xNegative.\n\
	else if(!isXPositive && absX >= absY && absX >= absZ)\n\
	{\n\
		faceIdx = 1;\n\
		faceTexCoord = vec2(y, z);\n\
		faceDir = vec3(-1.0, 0.0, 0.0);\n\
	}\n\
\n\
	// yPositive.\n\
	else if(isYPositive && absY >= absX && absY >= absZ)\n\
	{\n\
		faceIdx = 2;\n\
		faceTexCoord = vec2(x, z);\n\
		faceDir = vec3(0.0, 1.0, 0.0);\n\
	}\n\
\n\
	// yNegative.\n\
	else if(!isYPositive && absY >= absX && absY >= absZ)\n\
	{\n\
		faceIdx = 3;\n\
		faceTexCoord = vec2(x, z);\n\
		faceDir = vec3(0.0, -1.0, 0.0);\n\
	}\n\
\n\
	// zPositive.\n\
	else if(isZPositive && absZ >= absX && absZ >= absY)\n\
	{\n\
		faceIdx = 4;\n\
		faceTexCoord = vec2(x, y);\n\
		faceDir = vec3(0.0, 0.0, 1.0);\n\
	}\n\
\n\
	// zNegative.\n\
	else if(!isZPositive && absZ >= absX && absZ >= absY)\n\
	{\n\
		faceIdx = 5;\n\
		faceTexCoord = vec2(x, y);\n\
		faceDir = vec3(0.0, 0.0, -1.0);\n\
	}\n\
\n\
	return faceIdx;\n\
}\n\
\n\
float getDepthFromLight(in vec3 lightDirCC, inout float spotDotAux)\n\
{\n\
	// Note : input must be a direction in cameraCoords.\n\
	// 1rst, transform \"lightDirToPointCC\" to \"lightDirToPointWC\".\n\
	// 2nd, transform \"lightDirToPointWC\" to \"lightDirToPointLC\" ( lightCoord );\n\
	vec4 lightDirToPointWC = modelViewMatrixRelToEyeInv * vec4(lightDirCC, 1.0);\n\
	vec3 lightDirToPointWCNormalized = normalize(lightDirToPointWC.xyz);\n\
	vec4 lightDirToPointLC = buildingRotMatrixInv * vec4(lightDirToPointWCNormalized, 1.0);\n\
	vec3 lightDirToPointLC_norm = normalize(lightDirToPointLC.xyz);\n\
	vec4 depthCube = textureCube(light_depthCubeMap, lightDirToPointLC_norm); // original\n\
\n\
	// Now, try to calculate the zone of the our pixel.\n\
	vec2 faceTexCoord;\n\
	vec3 faceDir;\n\
	getFaceIdx(lightDirToPointLC_norm, faceTexCoord, faceDir);\n\
	spotDotAux = dot(lightDirToPointLC_norm, faceDir);\n\
	float depthFromLight = unpackDepth(depthCube);\n\
\n\
	return depthFromLight;\n\
}\n\
\n\
void main()\n\
{\n\
	//#ifdef USE_LOGARITHMIC_DEPTH\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	//}\n\
	//#endif\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		if(u_processType == 1) // light pass.\n\
		{\n\
			// Diffuse lighting.\n\
			int dataType = 0;\n\
			vec4 normal4;\n\
			vec3 posCC = getPosCC(screenPos, dataType, normal4);\n\
\n\
			// vector light-point.\n\
			vec3 vecLightToPointCC = posCC - vLightPosCC;\n\
			vec3 lightDirToPointCC = normalize(posCC - vLightPosCC);\n\
			float distToLight = length(vecLightToPointCC);\n\
\n\
			float lightHotDistance = uLightParameters[0];\n\
			float lightFalloffLightDist = uLightParameters[1];\n\
			float factorByDist = 1.0;\n\
\n\
			// Calculate the lightFog intensity (case spotLight).***************************************************************************************************************************\n\
			float lightFogIntensity = 0.0;\n\
			\n\
			// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of \"vertexPosLC\" to \"vLightDirCC\".\n\
			vec3 vectorToVertexCC = vertexPosCC.xyz - vLightPosCC;\n\
			float dist_vertexCC_toLight = length(vectorToVertexCC);\n\
\n\
			vec3 dir_camToLight = normalize(vLightPosCC);\n\
			float dot_dirCamToLight_lightDir = dot(dir_camToLight, vLightDirCC);\n\
\n\
\n\
			float factorByDist2 = 1.0 - dist_vertexCC_toLight/(lightFalloffLightDist);\n\
			lightFogIntensity = factorByDist2 * factorByDist2 * abs(dot_dirCamToLight_lightDir * dot_dirCamToLight_lightDir);\n\
			lightFogIntensity *= 0.8;\n\
\n\
			// DepthTest.\n\
			if(-vertexPosCC.z > -posCC.z)\n\
			{\n\
				if(posCC.z < 0.0) // in sky, posCC.z > 0.0\n\
				lightFogIntensity = 0.0;\n\
			}\n\
\n\
			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
			// End fog calculating.------------------------------------------------------------------------------------------------------------------------------------------------------------\n\
			\n\
			if(distToLight > lightFalloffLightDist)\n\
			{\n\
				// Apply only lightFog.***\n\
				// in final screenQuadPass, use posLC to determine the light-fog.\n\
				return;\n\
			}\n\
			else if(distToLight > lightHotDistance)\n\
			{\n\
				factorByDist = 1.0 - (distToLight - lightHotDistance)/(lightFalloffLightDist - lightHotDistance);\n\
			}\n\
\n\
			vec3 normal3 = normal4.xyz;\n\
			float diffuseDot = dot(-lightDirToPointCC, vec3(normal3));\n\
\n\
			if(diffuseDot < 0.0)\n\
			{\n\
				return;\n\
			}\n\
\n\
			// Check SPOT ANGLES.*****************************************************************************************************************************************\n\
			float hotSpotDot = uLightParameters[2];\n\
			float falloffSpotDot = uLightParameters[3];\n\
\n\
			float spotDot = dot(vLightDirCC, lightDirToPointCC);\n\
			float factorBySpot = 1.0;\n\
			if(spotDot < falloffSpotDot) \n\
			{\n\
				return;\n\
			}\n\
			else if(spotDot < hotSpotDot)\n\
			{\n\
				factorBySpot = 1.0 - (hotSpotDot - spotDot)/(hotSpotDot - falloffSpotDot);\n\
			}\n\
\n\
			if(bApplyShadows)\n\
			{\n\
\n\
				// Now, try to calculate the zone of the our pixel.\n\
				float spotDotAux;\n\
				float depthFromLight = getDepthFromLight(lightDirToPointCC, spotDotAux);\n\
				depthFromLight *= lightFalloffLightDist/spotDotAux;\n\
\n\
				float depthTolerance = 0.06;\n\
				if(distToLight > depthFromLight + depthTolerance)\n\
				{\n\
					// we are in shadow, so do not lighting.\n\
					gl_FragData[2] = vec4(0.0); // save fog.***\n\
					return;\n\
				}\n\
			}\n\
			\n\
\n\
			//float fogIntensity = length(vertexPosLC)/lightHotDistance;\n\
			float atenuation = 0.4; // intern variable to adjust light intensity.\n\
			diffuseDot *= factorByDist;\n\
			spotDot *= factorBySpot;\n\
			float finalFactor = uLightIntensity * diffuseDot * spotDot * atenuation;\n\
			gl_FragData[0] = vec4(uLightColorAndBrightness.x * finalFactor, \n\
								uLightColorAndBrightness.y * finalFactor, \n\
								uLightColorAndBrightness.z * finalFactor, 1.0); \n\
\n\
			// Specular lighting.\n\
			gl_FragData[1] = vec4(0.0, 0.0, 0.0, 1.0); // save specular.***\n\
\n\
			//// Light fog.\n\
			////gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
\n\
		}\n\
		else if(u_processType == 2) // lightFog pass.\n\
		{\n\
			// Diffuse lighting.\n\
			int dataType = 0;\n\
			vec4 normal4;\n\
			vec3 posCC = getPosCC(screenPos, dataType, normal4);\n\
\n\
			float lightHotDistance = uLightParameters[0];\n\
			float lightFalloffLightDist = uLightParameters[1];\n\
\n\
			// Calculate the lightFog intensity (case spotLight).***************************************************************************************************************************\n\
			float lightFogIntensity = 0.0;\n\
			vec3 dir_camToVertex = normalize(vertexPosCC.xyz);\n\
			vec3 dir_camToLight = normalize(vLightPosCC);\n\
			float dist_camToLight = length(vLightPosCC);\n\
			vec3 vertexPP = dir_camToVertex * dist_camToLight;\n\
			float dist_vertexPP_toLight = length(vertexPP - vLightPosCC);\n\
\n\
			// calculate light-to-vertexPP direction.\n\
			vec3 dir_light_toVertexPP = normalize(vertexPP - vLightPosCC);\n\
\n\
			// calculate dotProd of lightDir & dir_light_toVertexPP. If dot is negative, means that the vertex is rear of light.\n\
			float dot_lightDir_lightToVertexPPDir = dot(vLightDirCC, dir_light_toVertexPP);\n\
			float dot_dirCamToLight_lightDir = dot(dir_camToLight, vLightDirCC);\n\
\n\
			// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of \"vertexPosLC\" to \"vLightDirCC\".\n\
			vec3 vectorLightToVertexCC = vertexPosCC.xyz - vLightPosCC;\n\
			vec3 dirLightToVertexCC = normalize(vectorLightToVertexCC);\n\
			float dist_vertexCC_toLight = length(vectorLightToVertexCC);\n\
			vec3 crossProd = cross( dirLightToVertexCC, vLightDirCC );\n\
			vec3 camToVertexCC = normalize(vertexPosCC.xyz);\n\
			float dotLightDir = dot(normalize(crossProd), camToVertexCC); // indicates how centered is the point to lightDir.\n\
\n\
			// Calculate fog by dist to light & try to eliminate the rear-light fog.\n\
			float factorByDistFog = 1.0 - dist_vertexPP_toLight / (lightFalloffLightDist * 1.1);\n\
			factorByDistFog *= abs(dot_lightDir_lightToVertexPPDir);\n\
\n\
			if(dot_lightDir_lightToVertexPPDir < 0.1)\n\
			{\n\
				// we are rear of the light.\n\
				float factorByRearLight = 1.0 + dot_lightDir_lightToVertexPPDir; \n\
				factorByDistFog *= (factorByRearLight * factorByRearLight);\n\
			}\n\
\n\
			float intensityFactor = 1.0 - abs(dotLightDir);\n\
			lightFogIntensity = intensityFactor * factorByDistFog * 0.5;\n\
\n\
			float camDir_lightDir_factor = dot_dirCamToLight_lightDir * (1.0 - dist_vertexPP_toLight/(lightFalloffLightDist));\n\
			lightFogIntensity += camDir_lightDir_factor * camDir_lightDir_factor * 0.5; // when look with the same direction that lightDir, add aureola.\n\
			// End calculate the lightFog intensity (case spotLight).-----------------------------------------------------------------------------------------------------------------------\n\
\n\
			// DepthTest.\n\
			if(-vertexPosCC.z > -posCC.z)\n\
			{\n\
				if(posCC.z < 0.0) // in sky, posCC.z > 0.0\n\
				lightFogIntensity = 0.0;\n\
				gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
				return;\n\
			}\n\
\n\
			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
\n\
			if(bApplyShadows)\n\
			{\n\
				// Now, try to calculate the zone of the our pixel.\n\
				float spotDotAux;\n\
				float depthTolerance = 1.5; // high tolerance.\n\
				float depthFromLight2 = getDepthFromLight(dirLightToVertexCC, spotDotAux);\n\
				depthFromLight2 *= lightFalloffLightDist/spotDotAux;\n\
\n\
				if(dist_vertexCC_toLight > depthFromLight2 + depthTolerance)\n\
				{\n\
					// we are in shadow, so do not lighting.\n\
					gl_FragData[2] = vec4(0.0);\n\
					return;\n\
				}\n\
			}\n\
			\n\
			// Light fog.\n\
			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
		}\n\
\n\
	}\n\
	#endif\n\
\n\
\n\
	\n\
}";
ShaderSource.LBufferVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord; // delete this. lights has no texCoords.\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 projectionMatrix;\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
\n\
	// Light position & direction.\n\
	uniform vec3 buildingPosHIGH; // this is the lightPosition high.\n\
	uniform vec3 buildingPosLOW; // this is the lightPosition low.\n\
	uniform vec3 lightDirWC; // this is the lightDirection (in case of the spotLight type).\n\
\n\
	uniform vec3 scaleLC;\n\
\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform bool bApplySpecularLighting;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 vertexPosLC;\n\
	varying vec4 vertexPosCC;\n\
	varying float applySpecLighting;\n\
	varying vec4 vColor4; // color from attributes\n\
\n\
	varying vec3 vLightDirCC; \n\
	varying vec3 vLightPosCC; \n\
	varying float vDotProdLight;\n\
	varying vec3 vCrossProdLight;\n\
\n\
  \n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		if(refMatrixType == 0)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 1)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 2)\n\
		{\n\
			rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(RefTransfMatrix);\n\
		}\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
\n\
		// calculate the light position CC.*****************************************\n\
		vec3 lightPosHighDiff = buildingPosHIGH - encodedCameraPositionMCHigh;\n\
		vec3 lightPosLowDiff = buildingPosLOW - encodedCameraPositionMCLow;\n\
		vec4 lightPosWC = vec4(lightPosHighDiff + lightPosLowDiff, 1.0);\n\
		vec4 lightPosCC_aux = modelViewMatrixRelToEye * lightPosWC;\n\
		vLightPosCC = lightPosCC_aux.xyz;\n\
		//--------------------------------------------------------------------------\n\
\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
\n\
		// calculate lightDirection in cameraCoord.\n\
		vLightDirCC = normalize((normalMatrix4 * vec4(lightDirWC, 1.0)).xyz); // original.***\n\
\n\
		\n\
		if(bApplySpecularLighting)\n\
			applySpecLighting = 1.0;\n\
		else\n\
			applySpecLighting = -1.0;\n\
\n\
		vec4 posPP = ModelViewProjectionMatrixRelToEye * pos4;\n\
        gl_Position = posPP; // posProjected.\n\
		vertexPosCC = modelViewMatrixRelToEye * pos4;\n\
		\n\
		// Calculate the lightFog intensity (case spotLight).*****************************************\n\
		/*\n\
		vec3 vectorToVertexCC = vertexPosCC.xyz - vLightPosCC;\n\
		vec3 dirToVertexCCProjected = normalize(vectorToVertexCC);\n\
		dirToVertexCCProjected.z = 0.0;\n\
		vec3 lightDirCCProjected = vec3(vLightDirCC.x, vLightDirCC.y, 0.0);\n\
		vDotProdLight = dot(dirToVertexCCProjected, lightDirCCProjected);\n\
		// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of \"vertexPosLC\" to \"vLightDirCC\".\n\
		vCrossProdLight = cross( dirToVertexCCProjected, lightDirCCProjected );\n\
		*/\n\
\n\
		// End calculate the lightFog intensity (case spotLight).-------------------------------------\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			//flogz = 1.0 + gl_Position.w;\n\
			vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
			flogz = 1.0 - orthoPos.z;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
	}";
ShaderSource.ModelRefSsaoFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D depthTex; \n\
uniform sampler2D diffuseTex;\n\
uniform sampler2D shadowMapTex;\n\
uniform sampler2D shadowMapTex2;\n\
uniform sampler2D ssaoFromDepthTex;\n\
uniform bool textureFlipYAxis;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 projectionMatrixInv;\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform mat4 m;\n\
uniform vec2 noiseScale;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;   \n\
uniform float shadowMapWidth;    \n\
uniform float shadowMapHeight; \n\
uniform float shininessValue;\n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
\n\
uniform bool bApplyScpecularLighting;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform vec3 specularColor;\n\
uniform vec3 ambientColor;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform float ambientReflectionCoef;\n\
uniform float diffuseReflectionCoef;  \n\
uniform float specularReflectionCoef; \n\
uniform bool bApplySsao;\n\
uniform bool bApplyShadow;\n\
uniform float externalAlpha; // used by effects.\n\
uniform float uModelOpacity; // this is model's alpha.\n\
uniform vec4 colorMultiplier;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
// clipping planes.***\n\
uniform mat4 clippingPlanesRotMatrix; \n\
uniform vec3 clippingPlanesPosHIGH;\n\
uniform vec3 clippingPlanesPosLOW;\n\
uniform bool bApplyClippingPlanes; // old. deprecated.***\n\
uniform int clippingType; // 0= no clipping. 1= clipping by planes. 2= clipping by localCoord polyline. 3= clip by heights, 4= clip by (2, 3)\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
uniform vec2 clippingPolygon2dPoints[64];\n\
uniform int clippingConvexPolygon2dPointsIndices[64];\n\
uniform vec4 limitationInfringedColor4;\n\
uniform vec2 limitationHeights;\n\
\n\
uniform int uFrustumIdx;\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
varying vec3 diffuseColor;\n\
varying vec3 vertexPos; // this is the orthoPos.***\n\
varying vec3 vertexPosLC;\n\
varying float applySpecLighting;\n\
varying vec4 vPosRelToLight; \n\
varying vec3 vLightDir; \n\
varying vec3 vNormalWC;\n\
varying float currSunIdx; \n\
varying float vDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depthAux = dot(rgba_depth, bit_shift);\n\
    return depthAux;\n\
}  \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
/*\n\
// unpack depth used for shadow on screen.***\n\
float unpackDepth_A(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
*/\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );\n\
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);\n\
}             \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
float getDepthShadowMap(vec2 coord)\n\
{\n\
	// currSunIdx\n\
	if(currSunIdx > 0.0 && currSunIdx < 1.0)\n\
	{\n\
		return UnpackDepth32(texture2D(shadowMapTex, coord.xy));\n\
	}\n\
    else if(currSunIdx > 1.0 && currSunIdx < 2.0)\n\
	{\n\
		return UnpackDepth32(texture2D(shadowMapTex2, coord.xy));\n\
	}\n\
	else\n\
		return -1.0;\n\
}  \n\
\n\
bool clipVertexByPlane(in vec4 plane, in vec3 point)\n\
{\n\
	float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;\n\
	\n\
	if(dist < 0.0)\n\
	return true;\n\
	else return false;\n\
}\n\
\n\
vec2 getDirection2d(in vec2 startPoint, in vec2 endPoint)\n\
{\n\
	//vec2 vector = endPoint - startPoint;\n\
	//float length = length( vector);\n\
	//vec2 dir = vec2(vector.x/length, vector.y/length);\n\
	vec2 dir = normalize(endPoint - startPoint);\n\
	return dir;\n\
}\n\
\n\
bool intersectionLineToLine(in vec2 line_1_pos, in vec2 line_1_dir,in vec2 line_2_pos, in vec2 line_2_dir, out vec2 intersectionPoint2d)\n\
{\n\
	bool bIntersection = false;\n\
\n\
	float zero = 10E-8;\n\
	float intersectX;\n\
	float intersectY;\n\
\n\
	// check if 2 lines are parallel.***\n\
	float dotProd = abs(dot(line_1_dir, line_2_dir));\n\
	if(abs(dotProd-1.0) < zero)\n\
	return false;\n\
\n\
	if (abs(line_1_dir.x) < zero)\n\
	{\n\
		// this is a vertical line.\n\
		float slope = line_2_dir.y / line_2_dir.x;\n\
		float b = line_2_pos.y - slope * line_2_pos.x;\n\
		\n\
		intersectX = line_1_pos.x;\n\
		intersectY = slope * line_1_pos.x + b;\n\
		bIntersection = true;\n\
	}\n\
	else if (abs(line_1_dir.y) < zero)\n\
	{\n\
		// this is a horizontal line.\n\
		// must check if the \"line\" is vertical.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			intersectX = line_2_pos.x;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (line_1_pos.y - b)/slope;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}	\n\
	}\n\
	else \n\
	{\n\
		// this is oblique.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			intersectX = line_2_pos.x;\n\
			intersectY = intersectX * mySlope + myB;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (myB - b)/ (slope - mySlope);\n\
			intersectY = slope * intersectX + b;\n\
			bIntersection = true;\n\
		}\n\
	}\n\
\n\
	intersectionPoint2d.x = intersectX;\n\
	intersectionPoint2d.y = intersectY;\n\
\n\
	return bIntersection;\n\
}\n\
\n\
vec2 getProjectedPoint2dToLine(in vec2 line_point, in vec2 line_dir, in vec2 point)\n\
{\n\
	bool intersection = false;\n\
\n\
	// create a perpendicular left line.***\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
	vec2 lineLeft_point = vec2(point.x, point.y);\n\
	vec2 projectedPoint = vec2(0);\n\
	intersection = intersectionLineToLine(line_point, line_dir, lineLeft_point, lineLeft_dir, projectedPoint);\n\
\n\
	return projectedPoint;\n\
}\n\
\n\
int getRelativePositionOfPointToLine(in vec2 line_pos, in vec2 line_dir, vec2 point)\n\
{\n\
	// 0 = coincident. 1= left side. 2= right side.***\n\
	int relPos = -1;\n\
\n\
	vec2 projectedPoint = getProjectedPoint2dToLine(line_pos, line_dir, point );\n\
	float dist = length(point - projectedPoint);\n\
\n\
	if(dist < 1E-8)\n\
	{\n\
		relPos = 0; // the point is coincident to line.***\n\
		return relPos;\n\
	}\n\
\n\
	vec2 myVector = normalize(point - projectedPoint);\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
\n\
	float dotProd = dot(lineLeft_dir, myVector);\n\
\n\
	if(dotProd > 0.0)\n\
	{\n\
		relPos = 1; // is in left side of the line.***\n\
	}\n\
	else\n\
	{\n\
		relPos = 2; // is in right side of the line.***\n\
	}\n\
\n\
	return relPos;\n\
}\n\
\n\
bool isPointInsideLimitationConvexPolygon(in vec2 point2d)\n\
{\n\
	bool isInside = true;\n\
\n\
	// Check polygons.***\n\
	int startIdx = -1;\n\
	int endIdx = -1;\n\
	for(int i=0; i<32; i++)\n\
	{\n\
		startIdx = clippingConvexPolygon2dPointsIndices[2*i];  // 0\n\
		endIdx = clippingConvexPolygon2dPointsIndices[2*i+1];	 // 3\n\
\n\
		if(startIdx < 0 || endIdx < 0)\n\
		break;\n\
\n\
		isInside  = true;\n\
		\n\
		isInside = true;\n\
		vec2 pointStart = clippingPolygon2dPoints[0];\n\
		for(int j=0; j<32; j++)\n\
		{\n\
			if(j > endIdx)\n\
			break;\n\
\n\
			if(j == startIdx)\n\
				pointStart = clippingPolygon2dPoints[j];\n\
\n\
			if(j >= startIdx && j<endIdx)\n\
			{\n\
				vec2 point0;\n\
				vec2 point1;\n\
				\n\
				if(j == endIdx)\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = pointStart;\n\
				}\n\
				else\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = clippingPolygon2dPoints[j+1];\n\
				}\n\
\n\
				// create the line of the segment.***\n\
				vec2 dir = getDirection2d(point0, point1);\n\
\n\
				// now, check the relative position of the point with the edge line.***\n\
				int relPos = getRelativePositionOfPointToLine(point0, dir, point2d);\n\
				if(relPos == 2)\n\
				{\n\
					// the point is in the right side of the edge line, so is out of the polygon.***\n\
					isInside = false;\n\
					break;\n\
				}\n\
			}\n\
\n\
		}\n\
		\n\
\n\
		if(isInside)\n\
		return true;\n\
\n\
	}\n\
\n\
	return isInside;\n\
}\n\
\n\
\n\
\n\
/*\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/screenWidth;\n\
    float pixelSizeY = 1.0/screenHeight;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<1.0; i++)\n\
	{\n\
		depthA += getDepth(texCoord + offset1*(1.0+i));\n\
		depthB += getDepth(texCoord + offset2*(1.0+i));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
mat3 sx = mat3( \n\
    1.0, 2.0, 1.0, \n\
    0.0, 0.0, 0.0, \n\
    -1.0, -2.0, -1.0 \n\
);\n\
mat3 sy = mat3( \n\
    1.0, 0.0, -1.0, \n\
    2.0, 0.0, -2.0, \n\
    1.0, 0.0, -1.0 \n\
);\n\
\n\
bool isEdge()\n\
{\n\
	vec3 I[3];\n\
	vec2 screenPos = vec2((gl_FragCoord.x) / screenWidth, (gl_FragCoord.y) / screenHeight);\n\
	float linearDepth = getDepth(screenPos);\n\
	vec3 normal = normal_from_depth(linearDepth, screenPos);\n\
\n\
    for (int i=0; i<3; i++) {\n\
        //vec3 norm1 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,-1), 0 ).rgb * 2.0f - 1.0f;\n\
        //vec3 norm2 =  texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,0), 0 ).rgb * 2.0f - 1.0f;\n\
        //vec3 norm3 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,1), 0 ).rgb * 2.0f - 1.0f;\n\
		vec2 screenPos1 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-1.0) / screenHeight);\n\
		float linearDepth1 = getDepth(screenPos1);  \n\
\n\
		vec2 screenPos2 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-0.0) / screenHeight);\n\
		float linearDepth2 = getDepth(screenPos2);  \n\
\n\
		vec2 screenPos3 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y+1.0) / screenHeight);\n\
		float linearDepth3 = getDepth(screenPos1);  \n\
\n\
		vec3 norm1 = normal_from_depth(linearDepth1, screenPos1);\n\
        vec3 norm2 =  normal_from_depth(linearDepth2, screenPos2);\n\
        vec3 norm3 = normal_from_depth(linearDepth3, screenPos3);\n\
        float sampleValLeft  = dot(normal, norm1);\n\
        float sampleValMiddle  = dot(normal, norm2);\n\
        float sampleValRight  = dot(normal, norm3);\n\
        I[i] = vec3(sampleValLeft, sampleValMiddle, sampleValRight);\n\
    }\n\
\n\
    float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); \n\
    float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);\n\
\n\
    if((gx < 0.0 && gy < 0.0) || (gy < 0.0 && gx < 0.0) ) \n\
        return false;\n\
	float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));\n\
\n\
    if(g > 0.2) {\n\
        return true;\n\
    } \n\
	return false;\n\
}\n\
*/\n\
\n\
\n\
void main()\n\
{\n\
	//gl_FragData = vColor4; \n\
	//return;\n\
\n\
	if(clippingType == 2)\n\
	{\n\
		// clip by limitationPolygon.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 3)\n\
	{\n\
		// check limitation heights.***\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 4)\n\
	{\n\
		// clip by limitationPolygon & heights.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
\n\
	// Check if clipping.********************************************\n\
	\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		bool discardFrag = false;\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			vec4 plane = clippingPlanes[i];\n\
			\n\
			// calculate any point of the plane.\n\
			if(!clipVertexByPlane(plane, vertexPos))\n\
			{\n\
				discardFrag = false; // false.\n\
				break;\n\
			}\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
		}\n\
		\n\
	}\n\
	\n\
	//----------------------------------------------------------------\n\
\n\
	//bool testBool = false;\n\
	float occlusion = 1.0; // ambient occlusion.***\n\
	float shadow_occlusion = 1.0;\n\
	vec3 normal2 = vNormal;	\n\
	float scalarProd = 1.0;\n\
	\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
	//float linearDepth = getDepth(screenPos);   \n\
	vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	scalarProd = abs(dot(normal2, normalize(-ray)));\n\
	//scalarProd *= scalarProd;\n\
	scalarProd *= 0.6;\n\
	scalarProd += 0.4;\n\
\n\
	occlusion = 1.0;\n\
\n\
	vec4 textureColor;\n\
    if(colorType == 2)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
		\n\
        if(textureColor.w == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else if(colorType == 0)\n\
	{\n\
        textureColor = oneColor4;\n\
    }\n\
	else if(colorType == 1)\n\
	{\n\
        textureColor = vColor4;\n\
    }\n\
	\n\
    // Do specular lighting.***\n\
	float lambertian = 1.0;\n\
	float specular = 0.0;\n\
\n\
	//if((textureColor.r < 0.5 && textureColor.b > 0.5) || textureColor.a < 1.0)\n\
\n\
	lambertian = 1.0;\n\
	\n\
	if(bApplyShadow)\n\
	{\n\
		if(currSunIdx > 0.0)\n\
		{\n\
			float ligthAngle = dot(vLightDir, vNormalWC);\n\
			if(ligthAngle > 0.0)\n\
			{\n\
				// The angle between the light direction & face normal is less than 90 degree, so, the face is in shadow.***\n\
				shadow_occlusion = 0.5;\n\
			}\n\
			else\n\
			{\n\
				vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;\n\
				float tolerance = 0.9963;\n\
				posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range\n\
				if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)\n\
				{\n\
					if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)\n\
					{\n\
						float depthRelToLight = getDepthShadowMap(posRelToLight.xy);\n\
						if(posRelToLight.z > depthRelToLight*tolerance )\n\
						{\n\
							shadow_occlusion = 0.5;\n\
						}\n\
					}\n\
				}\n\
\n\
				// test. Calculate the zone inside the pixel.************************************\n\
				//https://docs.microsoft.com/ko-kr/windows/win32/dxtecharts/cascaded-shadow-maps\n\
			}\n\
		}\n\
	}\n\
\n\
	\n\
	// New lighting.***********************************************************************************************\n\
	vec3 ambientColor = vec3(0.6);\n\
	vec3 directionalLightColor = vec3(0.9, 0.9, 0.9);\n\
	vec3 lightingDirection = normalize(vec3(0.6, 0.6, 0.6));\n\
	float directionalLightWeighting = max(dot(vNormal, lightingDirection), 0.0);\n\
	vec3 lightWeighting = ambientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
	// End lighting.-------------------------------------------------------------------------------------------------\n\
	\n\
	\n\
	float alfa = textureColor.w * externalAlpha * uModelOpacity;\n\
    vec4 finalColor;\n\
	finalColor = vec4(textureColor.r, textureColor.g, textureColor.b, alfa);\n\
	finalColor *= vec4(lightWeighting, 1.0) ;\n\
	finalColor *= colorMultiplier;\n\
\n\
	vec4 albedo4 = finalColor;\n\
    gl_FragData[0] = finalColor; \n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	{\n\
		// save depth, normal, albedo.\n\
		float depthAux = vDepth;\n\
		gl_FragData[1] = packDepth(depthAux); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.ModelRefSsaoVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 projectionMatrix;  \n\
	uniform mat4 modelViewMatrix;\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform mat4 sunMatrix[2]; \n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 sunPosHIGH[2];\n\
	uniform vec3 sunPosLOW[2];\n\
	uniform int sunIdx;\n\
	uniform vec3 sunDirWC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform bool bApplySpecularLighting;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bApplyShadow;\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying vec3 vertexPosLC;\n\
	varying float applySpecLighting;\n\
	varying vec4 vColor4; // color from attributes\n\
	varying vec4 vPosRelToLight; // sun lighting.\n\
	varying vec3 vLightDir; \n\
	varying vec3 vNormalWC; \n\
	varying float currSunIdx;  \n\
	varying float discardFrag;\n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	varying float vDepth;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		if(refMatrixType == 0)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 1)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 2)\n\
		{\n\
			rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(RefTransfMatrix);\n\
		}\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		\n\
		\n\
		\n\
		vec3 uLightingDirection = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496); \n\
		uAmbientColor = vec3(1.0);\n\
		vNormalWC = rotatedNormal;\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
		vLightDir = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		float directionalLightWeighting = 1.0;\n\
		\n\
		currSunIdx = -1.0; // initially no apply shadow.\n\
		if(bApplyShadow)\n\
		{\n\
			//vLightDir = normalize(vec3(normalMatrix4 * vec4(sunDirWC.xyz, 1.0)).xyz); // test.***\n\
			vLightDir = sunDirWC;\n\
			vNormalWC = rotatedNormal;\n\
						\n\
			// the sun lights count are 2.\n\
			\n\
			vec3 currSunPosLOW;\n\
			vec3 currSunPosHIGH;\n\
			mat4 currSunMatrix;\n\
			if(sunIdx == 0)\n\
			{\n\
				currSunPosLOW = sunPosLOW[0];\n\
				currSunPosHIGH = sunPosHIGH[0];\n\
				currSunMatrix = sunMatrix[0];\n\
				currSunIdx = 0.5;\n\
			}\n\
			else if(sunIdx == 1)\n\
			{\n\
				currSunPosLOW = sunPosLOW[1];\n\
				currSunPosHIGH = sunPosHIGH[1];\n\
				currSunMatrix = sunMatrix[1];\n\
				currSunIdx = 1.5;\n\
			}\n\
			\n\
			// Calculate the vertex relative to light.***\n\
			vec3 highDifferenceSun = objPosHigh.xyz - currSunPosHIGH.xyz;\n\
			vec3 lowDifferenceSun = objPosLow.xyz - currSunPosLOW.xyz;\n\
			vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
			vPosRelToLight = currSunMatrix * pos4Sun;\n\
			\n\
			uLightingDirection = sunDirWC; \n\
			//directionalLightColor = vec3(0.9, 0.9, 0.9);\n\
			directionalLightWeighting = max(dot(rotatedNormal, -sunDirWC), 0.0);\n\
		}\n\
		else\n\
		{\n\
			uAmbientColor = vec3(0.8);\n\
			uLightingDirection = normalize(vec3(0.6, 0.6, 0.6));\n\
			//uLightingDirection = normalize(vec3(0.2, 0.6, 1.0));\n\
			directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		}\n\
\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
		\n\
		if(bApplySpecularLighting)\n\
			applySpecLighting = 1.0;\n\
		else\n\
			applySpecLighting = -1.0;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		vDepth = -orthoPos.z/far;\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
\n\
		//if(orthoPos.z < 0.0)\n\
		//aColor4 = vec4(1.0, 0.0, 0.0, 1.0);\n\
		//else\n\
		//aColor4 = vec4(0.0, 1.0, 0.0, 1.0);\n\
		gl_PointSize = 5.0;\n\
	}";
ShaderSource.OrthogonalDepthShaderFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
uniform sampler2D diffuseTex;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform bool textureFlipYAxis;  \n\
\n\
varying float depth;\n\
varying vec2 vTexCoord;  \n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    //vec4 res = fract(depth * bit_shift); // Is not precise.\n\
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
vec4 PackDepth32( in float depth )\n\
{\n\
    depth *= (16777216.0 - 1.0) / (16777216.0);\n\
    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;\n\
}\n\
\n\
void main()\n\
{     \n\
    if(colorType == 2)\n\
    {\n\
        vec4 textureColor;\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
		\n\
        if(textureColor.w == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    gl_FragData[0] = PackDepth32(depth);\n\
	//gl_FragData[0] = packDepth(-depth);\n\
}";
ShaderSource.OrthogonalDepthShaderVS = "attribute vec3 position;\n\
attribute vec2 texCoord;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 RefTransfMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
\n\
varying float depth;\n\
varying vec2 vTexCoord;\n\
  \n\
void main()\n\
{	\n\
	vec4 rotatedPos;\n\
\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    //linear depth in camera space (0..far)\n\
    //depth = (modelViewMatrixRelToEye * pos4).z/far; // original.***\n\
\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	depth = gl_Position.z*0.5+0.5;\n\
	vTexCoord = texCoord;\n\
}\n\
";
ShaderSource.OrthogonalVoxelizationShaderFS_MRT = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D currDEMTex;\n\
\n\
uniform vec2 u_heightMap_MinMax; // terrain min max heights. \n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec3 u_quantizedVolume_MinMax[2]; // the minimum is [0,0,0], and the maximum is [1,1,1].***\n\
uniform int u_terrainHeightEncodingBytes;\n\
\n\
\n\
varying float vDepth;\n\
varying float vAltitude;\n\
varying vec3 vNormal3;\n\
varying vec4 glPos;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
\n\
\n\
void main()\n\
{     \n\
    //vec2 screenPos = vec2(gl_FragCoord.x / u_simulationTextureSize.x, gl_FragCoord.y / u_simulationTextureSize.y);\n\
\n\
    // Check if the current fragment is inside of the u_quantizedVolume_MinMax.***\n\
    vec3 quantizedVolumeMin = u_quantizedVolume_MinMax[0];\n\
    vec3 quantizedVolumeMax = u_quantizedVolume_MinMax[1];\n\
    vec3 quantizedPos = glPos.xyz * 0.5 + 0.5;\n\
    \n\
    if(quantizedPos.x < quantizedVolumeMin.x || quantizedPos.x > quantizedVolumeMax.x)\n\
    {\n\
        discard;\n\
    }\n\
    else if(quantizedPos.y < quantizedVolumeMin.y || quantizedPos.y > quantizedVolumeMax.y)\n\
    {\n\
        discard;\n\
    }\n\
    else if(quantizedPos.z < quantizedVolumeMin.z || quantizedPos.z > quantizedVolumeMax.z)\n\
    {\n\
        discard;\n\
    }\n\
\n\
    // Calculate the zDepth ranges for each MRT texture.***\n\
    // Note : consider that there are 8 output textures.***\n\
    float zDepthRangeTotal = quantizedVolumeMax.z - quantizedVolumeMin.z;\n\
    float zDepthOneSlice = zDepthRangeTotal / 8.0;\n\
    vec4 zeroColor4 = vec4(0.0); // original.***\n\
    vec4 solidColor4 = vec4(1.0, 1.0, 1.0, 1.0);\n\
\n\
    float qPosZ = quantizedPos.z;\n\
    solidColor4 = vec4(qPosZ, qPosZ, qPosZ, 1.0);\n\
\n\
    float factor = 0.6; // original.***\n\
\n\
    // Now, for each output texture, calculate if intersects the quantizedPos.***\n\
    // gl_FragData[0] - is the nearest slice.***\n\
    gl_FragData[0] = zeroColor4;\n\
    float slice_minZ = quantizedVolumeMin.z;\n\
    float slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice;\n\
    slice_minZ -= zDepthOneSlice * factor;\n\
    slice_maxZ += zDepthOneSlice * factor;\n\
    if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)\n\
    {\n\
        // the current fragment intersects.***\n\
        gl_FragData[0] = solidColor4;\n\
    }\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        // gl_FragData[1] - is the 2nd nearest slice.***\n\
        gl_FragData[1] = zeroColor4; \n\
        \n\
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice;\n\
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice * 2.0;\n\
        slice_minZ -= zDepthOneSlice * factor;\n\
        slice_maxZ += zDepthOneSlice * factor;\n\
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)\n\
        {\n\
            // the current fragment intersects.***\n\
            gl_FragData[1] = solidColor4;\n\
        }\n\
\n\
        // gl_FragData[2].***\n\
        gl_FragData[2] = zeroColor4; \n\
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*2.0;\n\
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*3.0;\n\
        slice_minZ -= zDepthOneSlice * factor;\n\
        slice_maxZ += zDepthOneSlice * factor;\n\
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)\n\
        {\n\
            // the current fragment intersects.***\n\
            gl_FragData[2] = solidColor4;\n\
        }\n\
\n\
        // gl_FragData[3].***\n\
        gl_FragData[3] = zeroColor4; \n\
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*3.0;\n\
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*4.0;\n\
        slice_minZ -= zDepthOneSlice * factor;\n\
        slice_maxZ += zDepthOneSlice * factor;\n\
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)\n\
        {\n\
            // the current fragment intersects.***\n\
            gl_FragData[3] = solidColor4;\n\
        }\n\
\n\
        // gl_FragData[4].***\n\
        gl_FragData[4] = zeroColor4; \n\
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*4.0;\n\
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*5.0;\n\
        slice_minZ -= zDepthOneSlice * factor;\n\
        slice_maxZ += zDepthOneSlice * factor;\n\
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)\n\
        {\n\
            // the current fragment intersects.***\n\
            gl_FragData[4] = solidColor4;\n\
        }\n\
\n\
        // gl_FragData[5].***\n\
        gl_FragData[5] = zeroColor4; \n\
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*5.0;\n\
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*6.0;\n\
        slice_minZ -= zDepthOneSlice * factor;\n\
        slice_maxZ += zDepthOneSlice * factor;\n\
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)\n\
        {\n\
            // the current fragment intersects.***\n\
            gl_FragData[5] = solidColor4;\n\
        }\n\
\n\
        // gl_FragData[6].***\n\
        gl_FragData[6] = zeroColor4; \n\
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*6.0;\n\
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*7.0;\n\
        slice_minZ -= zDepthOneSlice * factor;\n\
        slice_maxZ += zDepthOneSlice * factor;\n\
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)\n\
        {\n\
            // the current fragment intersects.***\n\
            gl_FragData[6] = solidColor4;\n\
        }\n\
\n\
        // gl_FragData[7] - is the farest slice.***\n\
        gl_FragData[7] = zeroColor4; \n\
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*7.0;\n\
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*8.0;\n\
        slice_minZ -= zDepthOneSlice * factor;\n\
        slice_maxZ += zDepthOneSlice * factor;\n\
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)\n\
        {\n\
            // the current fragment intersects.***\n\
            gl_FragData[7] = solidColor4;\n\
        }\n\
\n\
 \n\
    #endif\n\
}";
ShaderSource.OrthogonalVoxelizationShaderVS_MRT = "precision highp float;\n\
\n\
attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
\n\
uniform mat4 buildingRotMatrix;  \n\
uniform mat4 RefTransfMatrix;\n\
uniform mat4 modelViewProjectionMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
\n\
uniform vec4 u_color4;\n\
varying float vDepth;\n\
varying float vAltitude;\n\
varying vec4 vColor4;\n\
varying vec3 vNormal3;\n\
varying vec4 glPos;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
float cbrt(in float val)\n\
{\n\
	if (val < 0.0) {\n\
 \n\
        return -pow(-val, 1.0 / 3.0);\n\
    }\n\
 \n\
    else {\n\
 \n\
        return pow(val, 1.0 / 3.0);\n\
    }\n\
}\n\
\n\
float atanHP_getConstant(in int j) \n\
{\n\
	float constant = 0.0;\n\
\n\
	// https://studylib.net/doc/18241330/high-precision-calculation-of-arcsin-x--arceos-x--and-arctan\n\
	// The constants tan(j*PI/24), (j = 1, 2, • • • , 11) and PI/2 are:\n\
	// j = 1 -> tan(PI/24) =     0.13165 24975 87395 85347 2\n\
	// j = 2 -> tan(PI/12) =     0.26794 91924 31122 70647 3\n\
	// j = 3 -> tan(PI/8) =      0.41421 35623 73095 04880 2\n\
	// j = 4 -> tan(PI/6) =      0.57735 02691 89625 76450 9\n\
	// j = 5 -> tan(5*PI/24) =   0.76732 69879 78960 34292 3\n\
	// j = 6 -> tan(PI/4) =      1.00000 00000 00000 00000 0\n\
	// j = 7 -> tan(7*PI/24) =   1.30322 53728 41205 75586 8\n\
	// j = 8 -> tan(PI/3) =      1.73205 08075 68877 29352 7\n\
	// j = 9 -> tan(3*PI/8) =    2.41421 35623 73095 04880 2\n\
	// j = 10 -> tan(5*PI/12) =  3.73205 08075 68877 29352 7\n\
	// j = 11 -> tan(11*PI/24) = 7.59575 41127 25150 44052 6\n\
	// PI/2 =                    1.57079 63267 94896 61923 1\n\
\n\
	if(j == 1)\n\
	{\n\
		constant = 0.131652497587395853472;\n\
	}\n\
	else if(j == 2)\n\
	{\n\
		constant = 0.267949192431122706473;\n\
	}\n\
	else if(j == 3)\n\
	{\n\
		constant = 0.414213562373095048802;\n\
	}\n\
	else if(j == 4)\n\
	{\n\
		constant = 0.577350269189625764509;\n\
	}\n\
	else if(j == 5)\n\
	{\n\
		constant = 0.767326987978960342923;\n\
	}\n\
	else if(j == 6)\n\
	{\n\
		constant = 1.000000000000000000000;\n\
	}\n\
	else if(j == 7)\n\
	{\n\
		constant = 1.303225372841205755868;\n\
	}\n\
	else if(j == 8)\n\
	{\n\
		constant = 1.732050807568877293527;\n\
	}\n\
	else if(j == 9)\n\
	{\n\
		constant = 2.414213562373095048802;\n\
	}\n\
	else if(j == 10)\n\
	{\n\
		constant = 3.732050807568877293527;\n\
	}\n\
	else if(j == 11)\n\
	{\n\
		constant = 7.595754112725150440526;\n\
	}\n\
	else if(j == 12)\n\
	{\n\
		constant = 1.570796326794896619231;\n\
	}\n\
\n\
	return constant;\n\
}\n\
\n\
int atanHP_getInterval(in float x) \n\
{\n\
	// Subdivide the interval (0, infinite ) into seven intervals as follows:\n\
	// 0 <= u < tan(PI/24)\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(11PI/24) <= u < infinite.\n\
	//------------------------------------------------------------------------\n\
	float u = abs(x);\n\
	int interval = -1;\n\
\n\
	// check if is interval = 0.******************************************************************\n\
	// 0 <= u < tan(PI/24)\n\
	float tan_PIdiv24 = atanHP_getConstant(1);\n\
	if(u < tan_PIdiv24)\n\
	{\n\
		return 0;\n\
	}\n\
\n\
	// check if is interval = 1: (j = interval + 1), so j = 2.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(PI/24) <= u < tan(PI/8)\n\
	float min = atanHP_getConstant(1);\n\
	float max = atanHP_getConstant(3);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 1;\n\
	}\n\
	\n\
	// check if is interval = 2: (j = interval + 1), so j = 3.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(PI/8) <= u < tan(5*PI/24)\n\
	min = atanHP_getConstant(3);\n\
	max = atanHP_getConstant(5);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 2;\n\
	}\n\
\n\
	// check if is interval = 3: (j = interval + 1), so j = 4.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(5*PI/24) <= u < tan(7*PI/24)\n\
	min = atanHP_getConstant(5);\n\
	max = atanHP_getConstant(7);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 3;\n\
	}\n\
\n\
	// check if is interval = 4: (j = interval + 1), so j = 5.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(7*PI/24) <= u < tan(3*PI/8)\n\
	min = atanHP_getConstant(7);\n\
	max = atanHP_getConstant(9);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 4;\n\
	}\n\
\n\
	// check if is interval = 5: (j = interval + 1), so j = 6.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(3*PI/8) <= u < tan(11*PI/24)\n\
	min = atanHP_getConstant(9);\n\
	max = atanHP_getConstant(11);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 5;\n\
	}\n\
\n\
	// check if is interval = 6: (j = interval + 1), so j = 6.***********************************\n\
	// tan(11PI/24) <= u < infinite.\n\
	min = atanHP_getConstant(11);\n\
	if(u >= min)\n\
	{\n\
		return 6;\n\
	}\n\
\n\
\n\
	return interval;\n\
}\n\
\n\
float atanHP_polynomialApproximation(in float x) \n\
{\n\
	// P(x) = a1*x + a3*pow(x, 3) + ... + a17*pow(x, 17)\n\
	float result_atan = -1.0;\n\
\n\
	float a1 = 1.0;\n\
	float a3 = -0.333333333333333331607;\n\
	float a5 = 0.199999999999998244448;\n\
	float a7 = -0.142857142856331306529;\n\
	float a9 = 0.111111110907793967393;\n\
	float a11 = -0.0909090609633677637073;\n\
	float a13 = 0.0769204073249154081320;\n\
	float a15 = -0.0665248229413108277905;\n\
	float a17 = 0.0546721009395938806941;\n\
\n\
	result_atan = a1*x + a3*pow(x, 3.0) + a5*pow(x, 5.0) +  a7*pow(x, 7.0) +  a9*pow(x, 9.0) +  a11*pow(x, 11.0) +  a13*pow(x, 13.0) +  a15*pow(x, 15.0) +  a17*pow(x, 17.0);\n\
\n\
	return result_atan;\n\
}\n\
\n\
float atanHP(in float x) // atan High Precision.\n\
{\n\
	// https://studylib.net/doc/18241330/high-precision-calculation-of-arcsin-x--arceos-x--and-arctan\n\
	//-----------------------------------------------------------------------------------------------\n\
\n\
	// Obtain the interval.\n\
	int interval = atanHP_getInterval(x);\n\
\n\
	if(interval == 0)\n\
	{\n\
		// use polynomial approximation.\n\
		return atanHP_polynomialApproximation(x);\n\
	}\n\
	else if(interval >= 1 && interval <6)\n\
	{\n\
		// use Arctan|x| = (j*PI/12) + Arctan(tj),\n\
		// where tj = A / B, where\n\
		// A = |x| - tan(j*PI/12)\n\
		// B = 1 + |x| * tan(j*PI/12).\n\
		float tan_jPIdiv12;\n\
		float j = float(interval);\n\
		if(interval == 1)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(2);\n\
		}\n\
		else if(interval == 2)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(4);\n\
		}\n\
		else if(interval == 3)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(6);\n\
		}\n\
		else if(interval == 4)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(8);\n\
		}\n\
		else if(interval == 5)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(10);\n\
		}\n\
\n\
		float A = abs(x) - tan_jPIdiv12;\n\
		float B = 1.0 + abs(x) * tan_jPIdiv12;\n\
		float tj = A/B;\n\
		float arctan_tj = atanHP_polynomialApproximation(tj);\n\
		float arctan = (j*M_PI/12.0) + arctan_tj;\n\
		return arctan;\n\
	}\n\
	else\n\
	{\n\
		// the interval = 6 (the last interval).\n\
		// In this case,\n\
		// Arctan|x| = PI/2 - Arctan(1/|x|).\n\
		float pi_div2 = atanHP_getConstant(12);\n\
		float arctan = pi_div2 - atan(1.0/abs(x));\n\
		return arctan;\n\
	}\n\
\n\
	return -1.0;\n\
}\n\
\n\
float atan2(in float y, in float x) \n\
{\n\
	if (x > 0.0)\n\
	{\n\
		return atanHP(y/x);\n\
	}\n\
	else if (x < 0.0)\n\
	{\n\
		if (y >= 0.0)\n\
		{\n\
			return atanHP(y/x) + M_PI;\n\
		}\n\
		else \n\
		{\n\
			return atanHP(y/x) - M_PI;\n\
		}\n\
	}\n\
	else if (x == 0.0)\n\
	{\n\
		if (y>0.0)\n\
		{\n\
			return M_PI/2.0;\n\
		}\n\
		else if (y<0.0)\n\
		{\n\
			return -M_PI/2.0;\n\
		}\n\
		else \n\
		{\n\
			return 0.0; // return undefined.\n\
		}\n\
	}\n\
}\n\
\n\
vec3 CartesianToGeographicWgs84(vec3 posWC, inout float inoutAux)\n\
{\n\
	vec3 geoCoord;\n\
\n\
	// From WebWorldWind.\n\
	// According to H. Vermeille, \"An analytical method to transform geocentric into geodetic coordinates\"\n\
	// http://www.springerlink.com/content/3t6837t27t351227/fulltext.pdf\n\
	// Journal of Geodesy, accepted 10/2010, not yet published\n\
	\n\
	\n\
	//// equatorialRadius = 6378137.0; // meters.\n\
	//// polarRadius = 6356752.3142; // meters.\n\
	//// firstEccentricitySquared = 6.69437999014E-3;\n\
	//// secondEccentricitySquared = 6.73949674228E-3;\n\
	//// degToRadFactor = Math.PI/180.0;\n\
	\n\
	float firstEccentricitySquared = 6.69437999014E-3;\n\
	float equatorialRadius = 6378137.0;\n\
\n\
	float X = posWC.x;\n\
	float Y = posWC.y;\n\
	float Z = posWC.z;\n\
\n\
	float XXpYY = X * X + Y * Y;\n\
	float sqrtXXpYY = sqrt(XXpYY);\n\
	float a = equatorialRadius;\n\
	float ra2 = 1.0 / (a * a);\n\
	float e2 = firstEccentricitySquared;\n\
	float e4 = e2 * e2;\n\
	float p = XXpYY * ra2;\n\
	float q = Z * Z * (1.0 - e2) * ra2;\n\
	float r = (p + q - e4) / 6.0;\n\
	float h;\n\
	float phi;\n\
	float u;\n\
	float evoluteBorderTest = 8.0 * r * r * r + e4 * p * q;\n\
	float rad1;\n\
	float rad2;\n\
	float rad3;\n\
	float atan_son;\n\
	float v;\n\
	float w;\n\
	float k;\n\
	float D;\n\
	float sqrtDDpZZ;\n\
	float e;\n\
	float lambda;\n\
	float s2;\n\
\n\
	\n\
\n\
	if (evoluteBorderTest > 0.0 || q != 0.0) \n\
	{\n\
		if (evoluteBorderTest > 0.0) \n\
		{\n\
			// Step 2: general case\n\
			rad1 = sqrt(evoluteBorderTest);\n\
			rad2 = sqrt(e4 * p * q);\n\
\n\
			// 10*e2 is my arbitrary decision of what Vermeille means by \"near... the cusps of the evolute\".\n\
			if (evoluteBorderTest > 10.0 * e2) \n\
			{\n\
				rad3 = cbrt((rad1 + rad2) * (rad1 + rad2));\n\
				u = r + 0.5 * rad3 + 2.0 * r * r / rad3;\n\
			}\n\
			else \n\
			{\n\
				u = r + 0.5 * cbrt((rad1 + rad2) * (rad1 + rad2))\n\
					+ 0.5 * cbrt((rad1 - rad2) * (rad1 - rad2));\n\
			}\n\
		}\n\
		else \n\
		{\n\
			// Step 3: near evolute\n\
			rad1 = sqrt(-evoluteBorderTest);\n\
			rad2 = sqrt(-8.0 * r * r * r);\n\
			rad3 = sqrt(e4 * p * q);\n\
			atan_son = 2.0 * atan2(rad3, rad1 + rad2) / 3.0;\n\
\n\
			u = -4.0 * r * sin(atan_son) * cos(M_PI / 6.0 + atan_son);\n\
		}\n\
\n\
		v = sqrt(u * u + e4 * q);\n\
		w = e2 * (u + v - q) / (2.0 * v);\n\
		k = (u + v) / (sqrt(w * w + u + v) + w);\n\
		D = k * sqrtXXpYY / (k + e2);\n\
		float D_scaled = D/10000.0;\n\
		float Z_scaled = Z/10000.0;\n\
		sqrtDDpZZ = sqrt(D_scaled * D_scaled + Z_scaled * Z_scaled) * 10000.0; // more precision.\n\
		//sqrtDDpZZ = sqrt(D * D + Z * Z);\n\
\n\
		h = (k + e2 - 1.0) * sqrtDDpZZ / k;\n\
		phi = 2.0 * atan2(Z, (sqrtDDpZZ + D));\n\
		\n\
	}\n\
	else \n\
	{\n\
		// Step 4: singular disk\n\
		rad1 = sqrt(1.0 - e2);\n\
		rad2 = sqrt(e2 - p);\n\
		e = sqrt(e2);\n\
\n\
		h = -a * rad1 * rad2 / e;\n\
		phi = rad2 / (e * rad2 + rad1 * sqrt(p));\n\
	}\n\
\n\
\n\
	// Compute lambda\n\
	s2 = sqrt(2.0);\n\
	if ((s2 - 1.0) * Y < sqrtXXpYY + X) \n\
	{\n\
		// case 1 - -135deg < lambda < 135deg\n\
		lambda = 2.0 * atan2(Y, sqrtXXpYY + X);\n\
	}\n\
	else if (sqrtXXpYY + Y < (s2 + 1.0) * X) \n\
	{\n\
		// case 2 - -225deg < lambda < 45deg\n\
		lambda = -M_PI * 0.5 + 2.0 * atan2(X, sqrtXXpYY - Y);\n\
	}\n\
	else \n\
	{\n\
		// if (sqrtXXpYY-Y<(s2=1)*X) {  // is the test, if needed, but it's not\n\
		// case 3: - -45deg < lambda < 225deg\n\
		lambda = M_PI * 0.5 - 2.0 * atan2(X, sqrtXXpYY + Y);\n\
	}\n\
\n\
	float factor = 180.0 / M_PI;\n\
	geoCoord = vec3(factor * lambda, factor * phi, h);\n\
\n\
	return geoCoord;\n\
}\n\
\n\
float rand(vec2 co){\n\
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n\
}\n\
\n\
bool aproxEqual(float valA, float valB, float error)\n\
{\n\
	bool areEquals = false;\n\
\n\
	if(abs(valA - valB) < error)\n\
	{\n\
		areEquals = true;\n\
	}\n\
	else{\n\
		areEquals = false;\n\
	}\n\
\n\
	return areEquals;\n\
}\n\
  \n\
void main()\n\
{	\n\
	// Function for overWrite waterSystem DEM texture.\n\
	vec4 rotatedPos;\n\
\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz; // - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz; // - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0); // world position.\n\
\n\
	float inoutAux = 0.0;\n\
	vec3 geoCoord = CartesianToGeographicWgs84(pos4.xyz, inoutAux);\n\
\n\
	////gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	gl_Position = modelViewProjectionMatrix * vec4(geoCoord, 1.0);\n\
	gl_PointSize = 2.0;\n\
\n\
	vDepth = gl_Position.z * 0.5 + 0.5;\n\
	glPos = gl_Position;\n\
	vAltitude = geoCoord.z;\n\
	vColor4 = u_color4; // used for \"waterCalculateHeightContaminationFS\".***\n\
\n\
}\n\
";
ShaderSource.PngImageFS = "precision highp float;\n\
\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
varying vec2 v_texcoord;\n\
uniform bool textureFlipYAxis;\n\
uniform sampler2D u_texture;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform vec4 oneColor4;\n\
\n\
\n\
varying vec2 imageSizeInPixels;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void main()\n\
{\n\
    vec4 textureColor;\n\
\n\
	// 1rst, check if the texture.w != 0.\n\
	if(textureFlipYAxis)\n\
	{\n\
		textureColor = texture2D(u_texture, vec2(v_texcoord.s, 1.0 - v_texcoord.t));\n\
	}\n\
	else\n\
	{\n\
		textureColor = texture2D(u_texture, v_texcoord);\n\
	}\n\
	\n\
	if(textureColor.w < 0.5)\n\
	{\n\
		//discard;\n\
	}\n\
\n\
\n\
	if(colorType == 2)\n\
	{\n\
		// do nothing.\n\
	}\n\
	else if( colorType == 0)\n\
	{\n\
		textureColor = oneColor4;\n\
	}\n\
\n\
    //gl_FragColor = textureColor;\n\
	gl_FragData[0] = textureColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		//gl_FragData[1] = packDepth(vDepth);\n\
		gl_FragData[1] = packDepth(0.0);\n\
		\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.005; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		//if(uFrustumIdx == 0)\n\
		//frustumIdx = 0.005; // frustumIdx = 20.***\n\
		//else if(uFrustumIdx == 1)\n\
		//frustumIdx = 0.015; // frustumIdx = 21.***\n\
		//else if(uFrustumIdx == 2)\n\
		//frustumIdx = 0.025; // frustumIdx = 22.***\n\
		//else if(uFrustumIdx == 3)\n\
		//frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = textureColor; \n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	//}\n\
	#endif\n\
}";
ShaderSource.PngImageVS = "attribute vec4 position;\n\
attribute vec2 texCoord;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 modelViewMatrixRelToEye;  \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;  \n\
uniform mat4 projectionMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec2 scale2d;\n\
uniform vec2 size2d;\n\
uniform vec3 aditionalOffset;\n\
uniform vec2 imageSize;\n\
uniform float screenWidth;    \n\
uniform float screenHeight;\n\
uniform bool bUseOriginalImageSize;\n\
varying vec2 v_texcoord;\n\
varying vec2 imageSizeInPixels;\n\
\n\
void main()\n\
{\n\
    vec4 position2 = vec4(position.xyz, 1.0);\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	//imageSizeInPixels = vec2(imageSize.x, imageSize.y);\n\
	\n\
	float order_w = position.w;\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
	\n\
    v_texcoord = texCoord;\n\
	vec4 projected = ModelViewProjectionMatrixRelToEye * pos4;\n\
	//vec4 projected2 = modelViewMatrixRelToEye * pos4;\n\
\n\
	// Now, calculate the pixelSize in the plane of the projected point.\n\
	float pixelWidthRatio = 2. / ((screenWidth));// * projectionMatrix[0][0]);\n\
	// alternative : float pixelWidthRatio = 2. / (screenHeight * projectionMatrix[1][1]);\n\
	float pixelWidth = projected.w * pixelWidthRatio;\n\
\n\
	//float pixelHeightRatio = pixelWidthRatio * (screenHeight/screenWidth); // no works correctly.\n\
	float pixelHeightRatio = 2. / ((screenHeight));\n\
	float pixelHeight = projected.w * pixelHeightRatio;\n\
	\n\
	if(projected.w < 5.0)\n\
		pixelWidth = 5.0 * pixelWidthRatio;\n\
\n\
	//pixelHeight = pixelWidth;\n\
	\n\
	vec4 offset;\n\
	float offsetX;\n\
	float offsetY;\n\
	if(bUseOriginalImageSize)\n\
	{\n\
		offsetX = pixelWidth*imageSize.x/2.0;\n\
		offsetY = pixelHeight*imageSize.y/2.0;\n\
	}\n\
	else{\n\
		offsetX = pixelWidth*size2d.x/2.0;\n\
		offsetY = pixelHeight*size2d.y/2.0;\n\
	}\n\
	\n\
	// Offset our position along the normal\n\
	if(orderInt == 1)\n\
	{\n\
		offset = vec4(-offsetX*scale2d.x, 0.0, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == -1)\n\
	{\n\
		offset = vec4(offsetX*scale2d.x, 0.0, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == 2)\n\
	{\n\
		offset = vec4(-offsetX*scale2d.x, offsetY*2.0*scale2d.y, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == -2)\n\
	{\n\
		offset = vec4(offsetX*scale2d.x, offsetY*2.0*scale2d.y, 0.0, 1.0);\n\
	}\n\
\n\
	gl_Position = projected + offset + vec4(aditionalOffset.x*pixelWidth, aditionalOffset.y*pixelWidth, aditionalOffset.z*pixelWidth, 0.0); \n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.PointCloudFS = "precision lowp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
uniform vec4 uStrokeColor;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
uniform int uPointAppereance; // square, circle, romboide,...\n\
uniform int uStrokeSize;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
void main()\n\
{\n\
	vec2 pt = gl_PointCoord - vec2(0.5);\n\
	float distSquared = pt.x*pt.x+pt.y*pt.y;\n\
	if(distSquared > 0.25)\n\
		discard;\n\
\n\
	vec4 finalColor = vColor;\n\
	float strokeDist = 0.1;\n\
	if(glPointSize > 10.0)\n\
	strokeDist = 0.15;\n\
\n\
	if(uStrokeSize > 0)\n\
	{\n\
		if(distSquared >= strokeDist)\n\
		{\n\
			finalColor = uStrokeColor;\n\
		}\n\
	}\n\
	gl_FragData[0] = finalColor;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.PointCloudSsaoFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D normalTex;\n\
uniform mat4 projectionMatrix;\n\
uniform float tangentOfHalfFovy;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
varying vec4 aColor4; // color from attributes\n\
\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform bool bApplySsao;\n\
uniform float externalAlpha;\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform vec2 uNearFarArray[4];\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float depth;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void main()\n\
{\n\
	vec2 pt = gl_PointCoord - vec2(0.5);\n\
	if(pt.x*pt.x+pt.y*pt.y > 0.25)\n\
	{\n\
		discard;\n\
	}\n\
	\n\
	float occlusion = 1.0;\n\
	float lighting = 0.0;\n\
	bool testBool = false;\n\
	vec4 colorAux = vec4(1.0, 1.0, 1.0, 1.0);\n\
\n\
	if(lighting < 0.5)\n\
	lighting = 0.0;\n\
\n\
	//vec3 fogColor = vec3(1.0, 1.0, 1.0);\n\
	vec3 fogColor = vec3(0.0, 0.0, 0.0);\n\
	vec3 finalFogColor = mix(vColor.xyz, fogColor, 0.0);\n\
\n\
    vec4 finalColor;\n\
	finalColor = vec4(finalFogColor * occlusion, externalAlpha);\n\
\n\
    gl_FragData[0] = finalColor; // original.***\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		//if(!bUseLogarithmicDepth)\n\
		//{\n\
			gl_FragData[1] = packDepth(depth);\n\
		//}\n\
\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.205; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.215; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.225; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.235; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = vColor; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
\n\
}";
ShaderSource.PointCloudSsaoFS_rainbow = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform mat4 projectionMatrix;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
uniform bool bUseColorCodingByHeight;\n\
uniform float minHeight_rainbow;   \n\
uniform float maxHeight_rainbow;  \n\
varying vec4 aColor4; // color from attributes\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float realHeigh;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform bool bApplySsao;\n\
uniform float externalAlpha;\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}                \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
}  \n\
\n\
vec3 getRainbowColor_byHeight(float height)\n\
{\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
}   \n\
\n\
void main()\n\
{\n\
	float occlusion = 0.0;\n\
	if(bApplySsao)\n\
	{          \n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
		float linearDepth = getDepth(screenPos);\n\
		vec3 origin = getViewRay(screenPos) * linearDepth;\n\
		float radiusAux = glPointSize/1.9;\n\
		radiusAux = 1.5;\n\
		vec2 screenPosAdjacent;\n\
		\n\
		for(int j = 0; j < 1; ++j)\n\
		{\n\
			radiusAux = 1.5 *(float(j)+1.0);\n\
			for(int i = 0; i < 8; ++i)\n\
			{    	 \n\
				if(i == 0)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 1)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 2)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 3)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);\n\
				else if(i == 4)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 5)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 6)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 7)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);\n\
				float depthBufferValue = getDepth(screenPosAdjacent);\n\
				float range_check = abs(linearDepth - depthBufferValue)*far;\n\
				if (range_check > 1.5 && depthBufferValue > linearDepth)\n\
				{\n\
					if (range_check < 20.0)\n\
						occlusion +=  1.0;\n\
				}\n\
			}   \n\
		}   \n\
			\n\
		if(occlusion > 6.0)\n\
			occlusion = 8.0;\n\
		//else occlusion = 0.0;\n\
		occlusion = 1.0 - occlusion / 8.0;\n\
	}\n\
	else{\n\
		occlusion = 1.0;\n\
	}\n\
\n\
    vec4 finalColor;\n\
	if(bUseColorCodingByHeight)\n\
	{\n\
		float rainbow = 0.5;\n\
		float texCol = 0.5;\n\
		vec3 rainbowColor3 = getRainbowColor_byHeight(realHeigh);\n\
		vec3 blendedColor3 = vec3(vColor.x * texCol + rainbowColor3.r * rainbow, vColor.y * texCol + rainbowColor3.g * rainbow, vColor.z * texCol + rainbowColor3.b * rainbow);\n\
		finalColor = vec4(blendedColor3 * occlusion, externalAlpha);\n\
	}\n\
	else\n\
		finalColor = vec4((vColor.xyz) * occlusion, externalAlpha);\n\
	//finalColor = vec4(vec3(0.8, 0.8, 0.8) * occlusion, externalAlpha);\n\
    gl_FragColor = finalColor; \n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.PointCloudVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bPositionCompressed;\n\
uniform vec3 minPosition;\n\
uniform vec3 bboxSize;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform float fixPointSize;\n\
uniform float maxPointSize;\n\
uniform float minPointSize;\n\
uniform float pendentPointSize;\n\
uniform bool bUseFixPointSize;\n\
uniform bool bUseColorCodingByHeight;\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float depth;\n\
\n\
uniform float uFCoef_logDepth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
void main()\n\
{\n\
	vec3 realPos;\n\
	vec4 rotatedPos;\n\
	if(bPositionCompressed)\n\
	{\n\
		//float maxShort = 65535.0;\n\
		//maxShort = 1.0;\n\
		//realPos = vec3(float(position.x)/maxShort*bboxSize.x + minPosition.x, float(position.y)/maxShort*bboxSize.y + minPosition.y, float(position.z)/maxShort*bboxSize.z + minPosition.z);\n\
		realPos = vec3(position.x * bboxSize.x + minPosition.x, position.y * bboxSize.y + minPosition.y, position.z * bboxSize.z + minPosition.z);\n\
	}\n\
	else\n\
	{\n\
		realPos = position;\n\
	}\n\
	rotatedPos = buildingRotMatrix * vec4(realPos.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor = oneColor4;\n\
	}\n\
	else\n\
		vColor = color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	depth = -(modelViewMatrixRelToEye * pos).z/far; // original.***\n\
\n\
	if(bUseFixPointSize)\n\
	{\n\
		gl_PointSize = fixPointSize;\n\
	}\n\
	else{\n\
		float z_b = gl_Position.z/gl_Position.w;\n\
		float z_n = 2.0 * z_b - 1.0;\n\
		float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
		gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
		if(gl_PointSize > maxPointSize)\n\
			gl_PointSize = maxPointSize;\n\
		if(gl_PointSize < 2.0)\n\
			gl_PointSize = 2.0;\n\
	}\n\
	glPointSize = gl_PointSize;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}";
ShaderSource.PointCloudVS_rainbow = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bPositionCompressed;\n\
uniform vec3 minPosition;\n\
uniform vec3 bboxSize;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform float fixPointSize;\n\
uniform float maxPointSize;\n\
uniform float minPointSize;\n\
uniform float pendentPointSize;\n\
uniform bool bUseFixPointSize;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float realHeigh;\n\
\n\
void main()\n\
{\n\
	vec3 realPos;\n\
	vec4 rotatedPos;\n\
	if(bPositionCompressed)\n\
	{\n\
		//float maxShort = 65535.0;\n\
		//maxShort = 1.0;\n\
		//realPos = vec3(float(position.x)/maxShort*bboxSize.x + minPosition.x, float(position.y)/maxShort*bboxSize.y + minPosition.y, float(position.z)/maxShort*bboxSize.z + minPosition.z);\n\
		realPos = vec3(position.x * bboxSize.x + minPosition.x, position.y * bboxSize.y + minPosition.y, position.z * bboxSize.z + minPosition.z);\n\
	}\n\
	else\n\
	{\n\
		realPos = position;\n\
	}\n\
	realHeigh = realPos.z;\n\
	rotatedPos = buildingRotMatrix * vec4(realPos.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor=oneColor4;\n\
	}\n\
	else\n\
		vColor=color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	float z_b = gl_Position.z/gl_Position.w;\n\
	float z_n = 2.0 * z_b - 1.0;\n\
    float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
    gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
    if(gl_PointSize > maxPointSize)\n\
        gl_PointSize = maxPointSize;\n\
    if(gl_PointSize < 2.0)\n\
        gl_PointSize = 2.0;\n\
        \n\
    glPointSize = gl_PointSize;\n\
}\n\
";
ShaderSource.PollutionFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D texture_0; \n\
uniform sampler2D texture_1;\n\
\n\
uniform bool textureFlipYAxis;\n\
\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
//uniform float screenWidth;    \n\
//uniform float screenHeight;     \n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform float externalAlpha; // used by effects.\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
uniform int uFrustumIdx;\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
uniform float uInterpolationFactor;\n\
uniform vec2 uMinMaxQuantizedValues_tex0;\n\
uniform vec2 uMinMaxQuantizedValues_tex1;\n\
uniform vec2 uMinMaxValues;\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
\n\
varying float vDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec4 packDepth( float v ) {\n\
	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	enc = fract(enc);\n\
	enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
	return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depthAux = dot(rgba_depth, bit_shift);\n\
    return depthAux;\n\
}  \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
/*\n\
// unpack depth used for shadow on screen.***\n\
float unpackDepth_A(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
*/\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );\n\
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);\n\
}             \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
\n\
\n\
/*\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/screenWidth;\n\
    float pixelSizeY = 1.0/screenHeight;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<1.0; i++)\n\
	{\n\
		depthA += getDepth(texCoord + offset1*(1.0+i));\n\
		depthB += getDepth(texCoord + offset2*(1.0+i));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
mat3 sx = mat3( \n\
    1.0, 2.0, 1.0, \n\
    0.0, 0.0, 0.0, \n\
    -1.0, -2.0, -1.0 \n\
);\n\
mat3 sy = mat3( \n\
    1.0, 0.0, -1.0, \n\
    2.0, 0.0, -2.0, \n\
    1.0, 0.0, -1.0 \n\
);\n\
\n\
bool isEdge()\n\
{\n\
	vec3 I[3];\n\
	vec2 screenPos = vec2((gl_FragCoord.x) / screenWidth, (gl_FragCoord.y) / screenHeight);\n\
	float linearDepth = getDepth(screenPos);\n\
	vec3 normal = normal_from_depth(linearDepth, screenPos);\n\
\n\
    for (int i=0; i<3; i++) {\n\
        //vec3 norm1 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,-1), 0 ).rgb * 2.0f - 1.0f;\n\
        //vec3 norm2 =  texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,0), 0 ).rgb * 2.0f - 1.0f;\n\
        //vec3 norm3 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,1), 0 ).rgb * 2.0f - 1.0f;\n\
		vec2 screenPos1 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-1.0) / screenHeight);\n\
		float linearDepth1 = getDepth(screenPos1);  \n\
\n\
		vec2 screenPos2 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-0.0) / screenHeight);\n\
		float linearDepth2 = getDepth(screenPos2);  \n\
\n\
		vec2 screenPos3 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y+1.0) / screenHeight);\n\
		float linearDepth3 = getDepth(screenPos1);  \n\
\n\
		vec3 norm1 = normal_from_depth(linearDepth1, screenPos1);\n\
        vec3 norm2 =  normal_from_depth(linearDepth2, screenPos2);\n\
        vec3 norm3 = normal_from_depth(linearDepth3, screenPos3);\n\
        float sampleValLeft  = dot(normal, norm1);\n\
        float sampleValMiddle  = dot(normal, norm2);\n\
        float sampleValRight  = dot(normal, norm3);\n\
        I[i] = vec3(sampleValLeft, sampleValMiddle, sampleValRight);\n\
    }\n\
\n\
    float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); \n\
    float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);\n\
\n\
    if((gx < 0.0 && gy < 0.0) || (gy < 0.0 && gx < 0.0) ) \n\
        return false;\n\
	float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));\n\
\n\
    if(g > 0.2) {\n\
        return true;\n\
    } \n\
	return false;\n\
}\n\
*/\n\
\n\
float unQuantize(float quantizedValue, float minVal, float maxVal)\n\
{\n\
	float unquantizedValue = quantizedValue * (maxVal - minVal) + minVal;\n\
	return unquantizedValue;\n\
}\n\
\n\
vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)\n\
{\n\
    \n\
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 0.9999; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
\n\
    float value = gray * 4.0;\n\
    float h = floor(value);\n\
    float f = fract(value);\n\
\n\
    vec4 resultColor = vec4(0.0, 0.0, 0.0, gray);\n\
\n\
    if(hotToCold)\n\
    {\n\
        // HOT to COLD.***\n\
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix red & yellow.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(red, yellow, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix yellow & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, green, f);\n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & cyan.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(green, cyan, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix cyan & blue.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, blue, f);\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // COLD to HOT.***\n\
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix blue & cyan.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(blue, cyan, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix cyan & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, green, f);  \n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & yellow.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(green, yellow, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix yellow & red.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, red, f);\n\
        }\n\
    }\n\
\n\
    return resultColor;\n\
}\n\
\n\
void main()\n\
{\n\
	//bool testBool = false;\n\
	//float occlusion = 1.0; // ambient occlusion.***\n\
	//vec3 normal2 = vNormal;	\n\
	//float scalarProd = 1.0;\n\
	\n\
	//vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
	//float linearDepth = getDepth(screenPos);   \n\
	//vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	//occlusion = 1.0;\n\
	vec4 textureColor;\n\
	vec4 textureColor_0;\n\
	vec4 textureColor_1;\n\
\n\
	float realPollutionVal_0 = 0.0;\n\
	float realPollutionVal_1 = 0.0;\n\
\n\
	vec2 finalTexCoord = vTexCoord;\n\
	if(textureFlipYAxis)\n\
	{\n\
		finalTexCoord = vec2(vTexCoord.s, 1.0 - vTexCoord.t);\n\
	}\n\
\n\
    if(colorType == 2)\n\
    {\n\
        textureColor_0 = texture2D(texture_0, finalTexCoord);\n\
		textureColor_1 = texture2D(texture_1, finalTexCoord);\n\
\n\
		float quantized_0 = UnpackDepth32(textureColor_0);\n\
		float quantized_1 = UnpackDepth32(textureColor_1);\n\
\n\
		realPollutionVal_0 = unQuantize(quantized_0, uMinMaxQuantizedValues_tex0.x, uMinMaxQuantizedValues_tex0.y);\n\
		realPollutionVal_1 = unQuantize(quantized_1, uMinMaxQuantizedValues_tex1.x, uMinMaxQuantizedValues_tex1.y);\n\
\n\
		//textureColor = mix(textureColor_0, textureColor_1, uInterpolationFactor); // no.***\n\
    }\n\
    else if(colorType == 0)\n\
	{\n\
        textureColor = oneColor4;\n\
    }\n\
	else if(colorType == 1)\n\
	{\n\
        textureColor = vColor4;\n\
    }\n\
	\n\
    vec4 finalColor;\n\
	float realPollutionValue = mix(realPollutionVal_0, realPollutionVal_1, uInterpolationFactor);\n\
	float realPollutionQuantized = (realPollutionValue - uMinMaxValues.x) / (uMinMaxValues.y - uMinMaxValues.x);\n\
	float pollutionValue = realPollutionQuantized;\n\
\n\
	bool hotToCold = false;\n\
	vec4 rainbowColor4 = getRainbowColor_byHeight(realPollutionQuantized, 0.0, 1.0, hotToCold);\n\
	\n\
	//vec4 intensity4 = vec4(1.0 - pollutionValue, 1.0 - pollutionValue, 1.0 - pollutionValue, pollutionValue * 10.0);\n\
	vec4 intensity4 = vec4(pollutionValue, 1.0 - pollutionValue, pollutionValue, pollutionValue * 10.0);\n\
	//vec4 pollutionColor = vec4(0.5, 1.0, 0.1, 1.0); // original green.***\n\
	vec4 pollutionColor = vec4(rainbowColor4.rgb, 1.0);\n\
	finalColor = mix(intensity4, pollutionColor, pollutionValue);\n\
\n\
    // test.***\n\
    finalColor = vec4(rainbowColor4.rgb, rainbowColor4.a * 15.0);\n\
\n\
    if(finalTexCoord.x < 0.005 || finalTexCoord.x > 0.995 || finalTexCoord.y < 0.005 || finalTexCoord.y > 0.995) \n\
    {\n\
        finalColor = vec4(0.25, 0.5, 0.99, 0.6);\n\
    }\n\
\n\
    gl_FragData[0] = finalColor; \n\
\n\
	vec4 albedo4 = finalColor;\n\
\n\
    \n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	{\n\
		// save depth, normal, albedo.\n\
		float depthAux = vDepth;\n\
		gl_FragData[1] = packDepth(depthAux); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.PollutionVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying vec3 vertexPosLC;\n\
	varying vec4 vColor4; // color from attributes\n\
	varying vec3 vLightDir; \n\
	varying vec3 vNormalWC; \n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	varying float vDepth;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
		currentTMat = mat3(buildingRotMatrix);\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		\n\
		\n\
		uAmbientColor = vec3(1.0);\n\
		vNormalWC = rotatedNormal;\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
		vLightDir = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		float directionalLightWeighting = 1.0;\n\
\n\
\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
		\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		vDepth = -orthoPos.z/far;\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
\n\
		gl_PointSize = 5.0;\n\
	}";
ShaderSource.quadVertTexCoordVS = "//precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
attribute vec2 a_texcoord;\n\
\n\
varying vec2 vTexCoord;\n\
\n\
void main() {\n\
    vTexCoord = a_texcoord;\n\
    gl_Position = vec4(-1.0 + 2.0 * a_pos, 0.0, 1.0);\n\
}";
ShaderSource.quad_vert = "precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    v_tex_pos = a_pos;\n\
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n\
}\n\
";
ShaderSource.rectangleScreenFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D texture_0;  \n\
uniform samplerCube texture_cube;\n\
\n\
uniform int uTextureType;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 v_normal; // use for cubeMap.\n\
\n\
int faceIndex(in vec2 texCoord)\n\
{\n\
    int faceIndex = -1;\n\
\n\
    float tx = texCoord.x;\n\
    float ty = texCoord.y;\n\
\n\
    if(tx >= 0.0 && tx < 0.25)\n\
    {\n\
        if(ty >= 0.0 && ty < 1.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)\n\
        {\n\
            faceIndex = 1;\n\
        }\n\
        else if(ty >= 2.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
    }\n\
    else if(tx >= 0.25 && tx < 0.5)\n\
    {\n\
        if(ty >= 0.0 && ty < 1.0/3.0)\n\
        {\n\
            faceIndex = 3;\n\
        }\n\
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)\n\
        {\n\
            faceIndex = 4;\n\
        }\n\
        else if(ty >= 2.0/3.0)\n\
        {\n\
            faceIndex = 2;\n\
        }\n\
    }\n\
    else if(tx >= 0.5 && tx < 0.75)\n\
    {\n\
        if(ty >= 0.0 && ty < 1.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)\n\
        {\n\
            faceIndex = 0;\n\
        }\n\
        else if(ty >= 2.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
    }\n\
    else if(tx >= 0.75)\n\
    {\n\
        if(ty >= 0.0 && ty < 1.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)\n\
        {\n\
            faceIndex = 5;\n\
        }\n\
        else if(ty >= 2.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
    }\n\
\n\
    return faceIndex;\n\
}\n\
\n\
bool cubeMapNormal(in vec2 texCoord, inout vec3 normal)\n\
{\n\
    int faceIdx = faceIndex(texCoord);\n\
\n\
    if(faceIdx == -1)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    bool isCubeMapZone = true;\n\
\n\
    // convert range 0 to 1 to -1 to 1\n\
    float uc = 2.0 * texCoord.x - 1.0;\n\
    float vc = 2.0 * texCoord.y - 1.0;\n\
    float x, y, z;\n\
\n\
    if(faceIdx == 0)\n\
    { \n\
        x =  1.0; \n\
        y =   vc; \n\
        z =  -uc; // POSITIVE X\n\
    }\n\
    else if(faceIdx == 1)\n\
    {\n\
        x = -1.0; \n\
        y =   vc; \n\
        z =   uc; // NEGATIVE X\n\
    }\n\
    else if(faceIdx == 2)\n\
    {\n\
        x =   uc; \n\
        y =  1.0; \n\
        z =  -vc; // POSITIVE Y\n\
    }\n\
    else if(faceIdx == 3)\n\
    {\n\
        x =   uc; \n\
        y = -1.0; \n\
        z =   vc; // NEGATIVE Y\n\
    }\n\
    else if(faceIdx == 4)\n\
    {\n\
        x =   uc; \n\
        y =   vc; \n\
        z =  1.0; // POSITIVE Z\n\
    }\n\
    else if(faceIdx == 5)\n\
    {\n\
        x =  -uc; \n\
        y =   vc; \n\
        z = -1.0; // NEGATIVE Z\n\
    }\n\
    \n\
    normal = vec3(x, y, z);\n\
    return isCubeMapZone;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
vec3 decodeVelocity(in vec3 encodedVel)\n\
{\n\
	return vec3(encodedVel * 2.0 - 1.0);\n\
}\n\
\n\
void main()\n\
{           \n\
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y); // original.\n\
\n\
    // Take the base color.\n\
    vec4 textureColor = vec4(1.0,1.0,1.0, 0.0);\n\
    if(uTextureType == 0)\n\
    {\n\
        textureColor = texture2D(texture_0, texCoord);\n\
\n\
        // Test debug:\n\
        //if(textureColor.r > 0.0 || textureColor.g > 0.0)\n\
        //{\n\
        //    textureColor = vec4(1.0, 1.0, 0.5, 1.0);\n\
        //}\n\
    }\n\
    else if(uTextureType == 1)\n\
    {\n\
        // CUBE_TEXTURE.***\n\
        // To see the value of 4byte encoded color4.***\n\
        textureColor = textureCube(texture_cube, v_normal);\n\
        float linearDepth = unpackDepth(textureColor); // original.\n\
        textureColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);\n\
    }\n\
    else if(uTextureType == 2)\n\
    {\n\
        // To see only alpha component.***\n\
        vec4 textureColorAux = texture2D(texture_0, texCoord);\n\
        textureColor = vec4(textureColorAux.a, 0.0, 0.0, textureColorAux.a);\n\
    }\n\
    else if(uTextureType == 3)\n\
    {\n\
        // Test debug:\n\
        vec4 textureColorAux = texture2D(texture_0, texCoord);\n\
        if(textureColorAux.r + textureColorAux.g + textureColorAux.b > 0.0)\n\
        {\n\
            textureColor = vec4(0.2, 0.5, 1.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            textureColor = textureColorAux;\n\
        }\n\
    }\n\
    else if(uTextureType == 4)\n\
    {\n\
        // To see the value of 4byte encoded color4.***\n\
        textureColor = texture2D(texture_0, texCoord);\n\
        float linearDepth = unpackDepth(textureColor); // original.\n\
        textureColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);\n\
    }\n\
    else if(uTextureType == 5)\n\
    {\n\
        // To see velocity.***\n\
        textureColor = texture2D(texture_0, texCoord);\n\
        vec3 vel = decodeVelocity(textureColor.rgb);\n\
        vec3 normalizedVel = normalize(vel);\n\
        textureColor = vec4(normalizedVel.rgb, 1.0);\n\
    }\n\
    \n\
    gl_FragColor = textureColor;\n\
	\n\
}";
ShaderSource.rectangleScreenMosaicFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D texture_0;  // HIGH_A\n\
uniform sampler2D texture_1;  // LOW_A\n\
uniform sampler2D texture_2;  // HIGH_B\n\
uniform sampler2D texture_3;  // LOW_B\n\
\n\
uniform int uTextureType;\n\
uniform int uSliceIdx; // the slice idx that to be render.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform float u_maxFlux;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 v_normal; // use for cubeMap.\n\
\n\
\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
vec3 decodeVelocity(in vec3 encodedVel)\n\
{\n\
	return vec3(encodedVel * 2.0 - 1.0);\n\
}\n\
\n\
vec2 getColRow_ofSliceIdx(in int sliceIdx, in int mosaicColsCount)\n\
{\n\
    // Given a sliceIdx, mosaicColumnsCount & mosaicRowsCount, this function returns the column & row of the sliceIdx.***\n\
    float row = floor(float(sliceIdx)/float(mosaicColsCount));\n\
    //float col = mod(float(sliceIdx), float(mosaicColsCount)); // mod = float(sliceIdx) - float(mosaicColsCount) * row;\n\
    float col = float(sliceIdx) - float(mosaicColsCount) * row;\n\
    vec2 colRow = vec2(col, row);\n\
    return colRow;\n\
}\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row, in int mosaicNumCols, in int mosaicNumRows)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(mosaicNumCols);\n\
    float tRange = 1.0 / float(mosaicNumRows);\n\
\n\
    float s = float(col) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row) * tRange + subTexCoord.y * tRange;\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
    return resultTexCoord;\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
void getFlux(in vec2 texCoord, inout vec3 flux_RFU, inout vec3 flux_LBD)\n\
{\n\
    // This function returns Outing flux.***\n\
    vec4 color4_RFU_HIGH = texture2D(texture_0, texCoord);\n\
    vec4 color4_RFU_LOW = texture2D(texture_1, texCoord);\n\
    vec4 color4_LBD_HIGH = texture2D(texture_2, texCoord);\n\
    vec4 color4_LBD_LOW = texture2D(texture_3, texCoord);\n\
\n\
    // now, decode all fluxes.***\n\
    flux_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.\n\
    flux_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.\n\
    flux_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.\n\
\n\
    flux_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.\n\
    flux_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.\n\
    flux_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.\n\
}\n\
\n\
void main()\n\
{           \n\
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y); // original.\n\
\n\
    // now, find the col & row of the mosaic.***\n\
    vec2 colRow = getColRow_ofSliceIdx(uSliceIdx, u_mosaicSize[0]);\n\
    int col = int(colRow.x);\n\
    int row = int(colRow.y);\n\
\n\
\n\
    // now, calculate the texCoord of the mosaic.***\n\
    vec2 texCoordMosaic = subTexCoord_to_texCoord(texCoord, col, row, u_mosaicSize[0], u_mosaicSize[1]);\n\
\n\
    // reassign the texCoord.***\n\
    texCoord = vec2(texCoordMosaic.x, texCoordMosaic.y);\n\
\n\
    // Take the base color.\n\
    vec4 textureColor = vec4(1.0, 1.0, 1.0, 0.0);\n\
    if(uTextureType == 0)\n\
    {\n\
        textureColor = texture2D(texture_0, texCoord);\n\
    }\n\
    else if(uTextureType == 1)\n\
    {\n\
        // Encoded in 2 textures.***\n\
        vec3 flux_RFU;\n\
        vec3 flux_LBD;\n\
        getFlux(texCoord, flux_RFU, flux_LBD);\n\
\n\
        // Now, calculate the total flux for each axis.***\n\
        //textureColor = vec4(flux_RFU.x - flux_LBD.x, flux_RFU.y - flux_LBD.y, flux_RFU.z - flux_LBD.z, 1.0);\n\
        //textureColor = vec4(flux_RFU, 1.0);\n\
        textureColor = vec4(flux_LBD, 1.0);\n\
\n\
    }\n\
    else if(uTextureType == 2)\n\
    {\n\
        // To see only alpha component.***\n\
        vec4 textureColorAux = texture2D(texture_0, texCoord);\n\
        textureColor = vec4(textureColorAux.a, 0.0, 0.0, textureColorAux.a);\n\
    }\n\
    else if(uTextureType == 3)\n\
    {\n\
        // Test debug:\n\
        vec4 textureColorAux = texture2D(texture_0, texCoord);\n\
        if(textureColorAux.r + textureColorAux.g + textureColorAux.b > 0.0)\n\
        {\n\
            textureColor = vec4(0.2, 0.5, 1.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            textureColor = textureColorAux;\n\
        }\n\
    }\n\
    else if(uTextureType == 4)\n\
    {\n\
        // To see the value of 4byte encoded color4.***\n\
        textureColor = texture2D(texture_0, texCoord);\n\
        float linearDepth = unpackDepth(textureColor); // original.\n\
        textureColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);\n\
    }\n\
    else if(uTextureType == 5)\n\
    {\n\
        // To see velocity.***\n\
        textureColor = texture2D(texture_0, texCoord);\n\
        vec3 vel = decodeVelocity(textureColor.rgb);\n\
        //float speed = length(vel); // test\n\
        vec3 normalizedVel = normalize(vel.rgb);\n\
        textureColor = vec4(normalizedVel.rgb, 1.0);\n\
        //textureColor = vec4(speed, speed, speed, 1.0); // test\n\
    }\n\
    else if(uTextureType == 6)\n\
    {\n\
        // To see normalized.***\n\
        textureColor = texture2D(texture_0, texCoord);\n\
        vec3 normalizedVel = normalize(textureColor.rgb);\n\
        textureColor = vec4(normalizedVel.rgb, 1.0);\n\
    }\n\
    \n\
    gl_FragColor = textureColor;\n\
	\n\
}";
ShaderSource.rectangleScreenVS = "precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
attribute vec3 a_nor;\n\
attribute vec2 a_tex;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 v_normal;\n\
\n\
void main() {\n\
    v_tex_pos = a_tex;\n\
    v_normal = a_nor;\n\
    \n\
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n\
}";
ShaderSource.RenderShowDepthFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D diffuseTex; // used only if texture is PNG, that has pixels with alpha = 0.0.***\n\
uniform bool bHasTexture; // indicates if texture is PNG, that has pixels with alpha = 0.0.***\n\
varying vec2 vTexCoord; // used only if texture is PNG, that has pixels with alpha = 0.0.***\n\
uniform bool textureFlipYAxis;\n\
\n\
uniform float near;\n\
uniform float far;\n\
\n\
// clipping planes.***\n\
uniform bool bApplyClippingPlanes;\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
\n\
varying float depth;  \n\
varying vec3 vertexPos;\n\
varying vec3 vNormal;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vFrustumIdx;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
bool clipVertexByPlane(in vec4 plane, in vec3 point)\n\
{\n\
	float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;\n\
	\n\
	if(dist < 0.0)\n\
	return true;\n\
	else return false;\n\
}\n\
\n\
void main()\n\
{     \n\
	// 1rst, check if there are clipping planes.\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		bool discardFrag = true;\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			vec4 plane = clippingPlanes[i];\n\
			if(!clipVertexByPlane(plane, vertexPos))\n\
			{\n\
				discardFrag = false;\n\
				break;\n\
			}\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
		}\n\
		\n\
		if(discardFrag)\n\
		discard;\n\
	}\n\
\n\
	// check if is a pixel with alpha zero.***\n\
	if(bHasTexture)\n\
	{\n\
		vec4 textureColor;\n\
		if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
		if(textureColor.a < 0.4)\n\
		discard;\n\
	}\n\
	\n\
\n\
	if(!bUseLogarithmicDepth)\n\
	{\n\
		gl_FragData[0] = packDepth(depth); \n\
	}\n\
\n\
	float frustumIdx = 1.0;\n\
	if(uFrustumIdx == 0)\n\
	frustumIdx = 0.005;\n\
	else if(uFrustumIdx == 1)\n\
	frustumIdx = 0.015;\n\
	else if(uFrustumIdx == 2)\n\
	frustumIdx = 0.025;\n\
	else if(uFrustumIdx == 3)\n\
	frustumIdx = 0.035;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		vec3 normal = vNormal;\n\
		if(normal.z < 0.0)\n\
		normal *= -1.0;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
	}\n\
	#endif\n\
	\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		gl_FragData[0] = packDepth(gl_FragDepthEXT);\n\
	}\n\
	#endif\n\
}";
ShaderSource.RenderShowDepthVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
//uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 RefTransfMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 scaleLC;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
uniform bool bHasTexture; // indicates if texture is PNG, that has pixels with alpha = 0.0.***\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
varying float depth;\n\
varying vec3 vertexPos;\n\
varying vec2 vTexCoord; // used only if texture is PNG, that has pixels with alpha = 0.0.***\n\
varying vec3 vNormal;\n\
  \n\
void main()\n\
{	\n\
	vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
	vec4 rotatedPos;\n\
\n\
	mat3 currentTMat;\n\
\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
		currentTMat = mat3(buildingRotMatrix);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
		currentTMat = mat3(buildingRotMatrix);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
		currentTMat = mat3(RefTransfMatrix);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    //linear depth in camera space (0..far)\n\
	vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
	depth = (-orthoPos.z)/(far); // the correct value.\n\
	\n\
	// Calculate normalCC.***\n\
	vec3 rotatedNormal = currentTMat * normal;\n\
	vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
\n\
	// When render with cull_face disabled, must correct the faces normal.\n\
	//if(vNormal.z < 0.0) // but, do this in fragment shader.\n\
	//vNormal *= -1.0; // but, do this in fragment shader.\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//-----------------------------------------------------------------------------------\n\
		//float C = 0.0001;\n\
		flogz = 1.0 + gl_Position.z; // use \"z\" instead \"w\" for fast decoding.***\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
\n\
	vertexPos = orthoPos.xyz;\n\
\n\
	if(bHasTexture)\n\
	{\n\
		vTexCoord = texCoord;\n\
	}\n\
}";
ShaderSource.ScreenCopyQuadFS = "\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
#define %USE_GL_EXT_FRAGDEPTH%\n\
#ifdef USE_GL_EXT_FRAGDEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
//#ifdef GL_ES\n\
    precision highp float;\n\
//#endif\n\
\n\
uniform sampler2D depthTex; // 0\n\
uniform sampler2D normalTex; // 1\n\
uniform sampler2D albedoTex; // 2\n\
\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform mat4 projectionMatrixInv;\n\
uniform mat4 normalMatrix4;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float near;\n\
uniform float far; \n\
\n\
uniform float screenWidth;    \n\
uniform float screenHeight;  \n\
uniform int uFrustumIdx;\n\
\n\
// This shader is used only to copy depth, normal  or albedo of Cesium.***\n\
// A uniform to use if is NO MRT.***************************************************\n\
// If we are in NO MRT, then, must choose what type of texture we are going to copy:\n\
uniform int u_textureTypeToCopy; // 0 = depth. 1 = normal. 2 = color.\n\
//----------------------------------------------------------------------------------\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
} \n\
\n\
float getDepthFrom_ZWindow(float zWindow, vec2 screenPos, inout vec4 posWC)\n\
{\n\
	float depth = 0.0;\n\
\n\
	// https://stackoverflow.com/questions/11277501/how-to-recover-view-space-position-given-view-space-depth-value-and-ndc-xy\n\
	float depthRange_near = 0.0;\n\
	float depthRange_far = 1.0;\n\
	float x_ndc = 2.0 * screenPos.x - 1.0;\n\
	float y_ndc = 2.0 * screenPos.y - 1.0;\n\
	float z_ndc = (2.0 * zWindow - depthRange_near - depthRange_far) / (depthRange_far - depthRange_near);\n\
	// Note: NDC range = (-1,-1,-1) to (1,1,1).***\n\
	\n\
	vec4 viewPosH = projectionMatrixInv * vec4(x_ndc, y_ndc, z_ndc, 1.0);\n\
	vec3 posCC = viewPosH.xyz/viewPosH.w;\n\
	posWC = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0) + vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 1.0);\n\
	//------------------------------------------------------------------------------------------------------------------------------\n\
\n\
	depth = -posCC.z/far;\n\
\n\
	return depth;\n\
}\n\
\n\
void main()\n\
{\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
\n\
		vec4 albedo = texture2D(albedoTex, screenPos.xy);\n\
\n\
		// in this case, do not other process.\n\
		// 1rst, calculate the pixelPosWC.\n\
		vec4 depthColor4 = texture2D(depthTex, screenPos.xy);\n\
		float z_window  = unpackDepth(depthColor4); // z_window  is [-1.0, 1.0] range depth, but only uses [0.0, 1.0] range.***\n\
\n\
		vec4 posWC;\n\
		float depth = getDepthFrom_ZWindow(z_window, screenPos, posWC);\n\
\n\
		//if(z_window >= 1.0) {\n\
		//	discard;\n\
		//}\n\
\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.105;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.115;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.125;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.135;\n\
\n\
		bool bDiscard = false;\n\
\n\
		//************************\n\
		// z_window = 1.0 -> near\n\
		// z_window = 0.0 -> far\n\
		//------------------------\n\
\n\
		if(z_window <= 0.0 && uFrustumIdx < 2) {\n\
			// frustum =2 & 3 -> renders sky, so dont discard.\n\
			discard;\n\
		}\n\
\n\
		gl_FragData[0] = packDepth(depth); // depth.\n\
					\n\
\n\
		//#ifdef USE_GL_EXT_FRAGDEPTH\n\
			//gl_FragDepthEXT = z_window;\n\
		//#endif\n\
		\n\
\n\
		if(z_window > 0.0)\n\
		{\n\
			vec4 normal4WC = vec4(normalize(posWC.xyz), 1.0);\n\
			vec4 normal4 = normalMatrix4 * normal4WC;\n\
			vec3 encodedNormal = encodeNormal(normal4.xyz);\n\
			gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
		}\n\
		else\n\
		{\n\
			vec3 encodedNormal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
			gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
		}\n\
\n\
		// Now, save the albedo.\n\
		gl_FragData[2] = albedo; // copy albedo.\n\
		\n\
\n\
	\n\
	#else\n\
		// We are in ORT (one rendering target).\n\
		if(u_textureTypeToCopy == 0)\n\
		{\n\
			// Depth.***\n\
			vec4 depthColor4 = texture2D(depthTex, screenPos.xy);\n\
			float z_window  = unpackDepth(depthColor4); // z_window  is [-1.0, 1.0] range depth.\n\
\n\
			if(z_window >= 1.0) {\n\
				discard;\n\
			}\n\
\n\
			if(z_window <= 0.0 && uFrustumIdx < 2) {\n\
				// frustum =2 & 3 -> renders sky, so dont discard.\n\
				discard;\n\
			}\n\
\n\
			vec4 posWC;\n\
			float depth = getDepthFrom_ZWindow(z_window, screenPos, posWC);\n\
			gl_FragData[0] = packDepth(depth); // depth.\n\
		}\n\
		else if ( u_textureTypeToCopy == 1)\n\
		{\n\
			vec4 depthColor4 = texture2D(depthTex, screenPos.xy);\n\
			float z_window  = unpackDepth(depthColor4); // z_window  is [-1.0, 1.0] range depth.\n\
\n\
			if(z_window >= 1.0) {\n\
				discard;\n\
			}\n\
\n\
			if(z_window <= 0.0 && uFrustumIdx < 2) {\n\
				// frustum =2 & 3 -> renders sky, so dont discard.\n\
				discard;\n\
			}\n\
\n\
			vec4 posWC;\n\
			float depth = getDepthFrom_ZWindow(z_window, screenPos, posWC);\n\
			\n\
			// Normal.***\n\
			float frustumIdx = 1.0;\n\
			if(uFrustumIdx == 0)\n\
			frustumIdx = 0.105;\n\
			else if(uFrustumIdx == 1)\n\
			frustumIdx = 0.115;\n\
			else if(uFrustumIdx == 2)\n\
			frustumIdx = 0.125;\n\
			else if(uFrustumIdx == 3)\n\
			frustumIdx = 0.135;\n\
\n\
			if(z_window > 0.0)\n\
			{\n\
				vec4 normal4WC = vec4(normalize(posWC.xyz), 1.0);\n\
				vec4 normal4 = normalMatrix4 * normal4WC;\n\
				vec3 encodedNormal = encodeNormal(normal4.xyz);\n\
				gl_FragData[0] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
			}\n\
			else\n\
			{\n\
				vec3 encodedNormal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
				gl_FragData[0] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
			}\n\
		}\n\
		else if(u_textureTypeToCopy == 2)\n\
		{\n\
			// Albedo.***\n\
			vec4 albedo = texture2D(albedoTex, screenPos.xy);\n\
			gl_FragData[0] = albedo;\n\
		}\n\
		\n\
	#endif\n\
\n\
	return;\n\
\n\
}";
ShaderSource.ScreenQuad2FS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
uniform sampler2D depthTex; // 0\n\
uniform sampler2D normalTex; // 1\n\
uniform sampler2D lightFogTex; // 2\n\
uniform sampler2D screenSpaceObjectsTex; // 3\n\
uniform sampler2D shadedColorTex; // 4\n\
uniform sampler2D brightColorTex; // 5\n\
uniform sampler2D volumetricTex; // 6\n\
\n\
uniform float near;\n\
uniform float far; \n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
\n\
uniform float screenWidth;    \n\
uniform float screenHeight;  \n\
uniform vec2 uNearFarArray[4];\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
uniform float uSceneDayNightLightingFactor; // day -> 1.0; night -> 0.0\n\
\n\
uniform vec3 uAmbientLight;\n\
\n\
uniform bool u_activeTex[8];\n\
\n\
#ifndef FXAA_REDUCE_MIN\n\
    #define FXAA_REDUCE_MIN   (1.0/ 128.0)\n\
#endif\n\
#ifndef FXAA_REDUCE_MUL\n\
    #define FXAA_REDUCE_MUL   (1.0 / 8.0)\n\
#endif\n\
#ifndef FXAA_SPAN_MAX\n\
    #define FXAA_SPAN_MAX     8.0\n\
#endif\n\
\n\
// Tutorial for bloom effect : https://learnopengl.com/Advanced-Lighting/Bloom\n\
\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
	\n\
    return ray;                      \n\
} \n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(normalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
bool isEdge(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y, inout float edgeRatio)\n\
{\n\
	bool bIsEdge = false;\n\
\n\
	// 1rst, check by normals.***\n\
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;\n\
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;\n\
	vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;\n\
	vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;\n\
\n\
	float minDot = 0.3;\n\
    edgeRatio = 0.0;\n\
\n\
	if(dot(normal, normal_up) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_right) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_down) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_left) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	// Now, check by depth.***\n\
    if(edgeRatio > 0.0)\n\
    bIsEdge = true;\n\
\n\
    edgeRatio /= 4.0;\n\
\n\
	return bIsEdge;\n\
}\n\
\n\
bool isEdge_3x3(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y, inout float edgeRatio)\n\
{\n\
	bool bIsEdge = false;\n\
\n\
	// 1rst, check by normals.***\n\
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;\n\
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;\n\
	vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;\n\
	vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;\n\
\n\
    vec3 normal_upRight = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y)).xyz;\n\
	vec3 normal_upLeft = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y + pixelSize_y)).xyz;\n\
	vec3 normal_downRight = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y - pixelSize_y)).xyz;\n\
	vec3 normal_downLeft = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y - pixelSize_y)).xyz;\n\
\n\
	float minDot = 0.3;\n\
    edgeRatio = 0.0;\n\
\n\
	if(dot(normal, normal_up) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_right) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_down) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_left) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
    if(dot(normal, normal_upRight) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_upLeft) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_downRight) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_downLeft) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	// Now, check by depth.***\n\
    if(edgeRatio > 0.0)\n\
    bIsEdge = true;\n\
\n\
    edgeRatio /= 8.0;\n\
\n\
	return bIsEdge;\n\
}\n\
\n\
bool isEdge_original(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y, inout float edgeRatio)\n\
{\n\
	bool bIsEdge = false;\n\
\n\
	// 1rst, check by normals.***\n\
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y*1.0)).xyz;\n\
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x*1.0, screenPos.y)).xyz;\n\
	vec3 normal_upRight = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y)).xyz;\n\
\n\
	float minDot = 0.3;\n\
    edgeRatio = 0.0;\n\
\n\
	if(dot(normal, normal_up) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_right) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	if(dot(normal, normal_upRight) < minDot)\n\
	{ edgeRatio += 1.0; }\n\
\n\
	// Now, check by depth.***\n\
    if(edgeRatio > 0.0)\n\
    bIsEdge = true;\n\
\n\
    edgeRatio /= 3.0;\n\
\n\
	return bIsEdge;\n\
}\n\
\n\
vec4 getShadedAlbedo(vec2 screenPos)\n\
{\n\
	return texture2D(shadedColorTex, screenPos);\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z*0.0001;\n\
        float Fcoef_half = uFCoef_logDepth/2.0;\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = (flogzAux - 1.0);\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
float getRealDepth(in vec2 coord, in vec2 nearFar)\n\
{\n\
	return getDepth(coord) * nearFar.y;\n\
}\n\
\n\
float getZDist(in vec2 coord)\n\
{\n\
	// This function is equivalent to \"getRealDepth\", but this is used when unknown the \"far\".***\n\
	vec4 normal4 = getNormal(coord);\n\
	int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
	vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	//float currFar = nearFar.y;\n\
	return getRealDepth(coord, nearFar);\n\
}\n\
\n\
bool _isEdge_byDepth(in float curZDist, vec2 screenPos)\n\
{\n\
    float minDist = 1.0;\n\
    float adjacentZDist = getZDist(screenPos);\n\
	float diff = abs(curZDist - adjacentZDist);\n\
	if(diff / curZDist > 0.01 && diff > minDist)\n\
	{ return true; }\n\
    else{\n\
        return false;\n\
    }\n\
}\n\
\n\
bool isEdge_byDepth(vec2 screenPos, float pixelSize_x, float pixelSize_y)\n\
{\n\
	float curZDist = getZDist(screenPos);\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x, screenPos.y + pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y - pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x, screenPos.y - pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y - pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y + pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    return false;\n\
}\n\
\n\
void make_kernel(inout vec4 n[9], vec2 coord)\n\
{\n\
	float w = 1.0 / screenWidth;\n\
	float h = 1.0 / screenHeight;\n\
\n\
	n[0] = texture2D(normalTex, coord + vec2( -w, -h));\n\
	n[1] = texture2D(normalTex, coord + vec2(0.0, -h));\n\
	n[2] = texture2D(normalTex, coord + vec2(  w, -h));\n\
	n[3] = texture2D(normalTex, coord + vec2( -w, 0.0));\n\
	n[4] = texture2D(normalTex, coord);\n\
	n[5] = texture2D(normalTex, coord + vec2(  w, 0.0));\n\
	n[6] = texture2D(normalTex, coord + vec2( -w, h));\n\
	n[7] = texture2D(normalTex, coord + vec2(0.0, h));\n\
	n[8] = texture2D(normalTex, coord + vec2(  w, h));\n\
}\n\
\n\
vec4 fxaa(vec2 fragCoord, vec2 resolution,\n\
            vec2 v_rgbNW, vec2 v_rgbNE, \n\
            vec2 v_rgbSW, vec2 v_rgbSE, \n\
            vec2 v_rgbM) {\n\
    vec4 color;\n\
    mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);\n\
    vec3 rgbNW = texture2D(shadedColorTex, v_rgbNW).xyz;\n\
    vec3 rgbNE = texture2D(shadedColorTex, v_rgbNE).xyz;\n\
    vec3 rgbSW = texture2D(shadedColorTex, v_rgbSW).xyz;\n\
    vec3 rgbSE = texture2D(shadedColorTex, v_rgbSE).xyz;\n\
    vec4 texColor = texture2D(shadedColorTex, v_rgbM);\n\
    vec3 rgbM  = texColor.xyz;\n\
    vec3 luma = vec3(0.299, 0.587, 0.114);\n\
    float lumaNW = dot(rgbNW, luma);\n\
    float lumaNE = dot(rgbNE, luma);\n\
    float lumaSW = dot(rgbSW, luma);\n\
    float lumaSE = dot(rgbSE, luma);\n\
    float lumaM  = dot(rgbM,  luma);\n\
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n\
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n\
    \n\
    mediump vec2 dir;\n\
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n\
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n\
    \n\
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *\n\
                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n\
    \n\
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n\
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\n\
              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n\
              dir * rcpDirMin)) * inverseVP;\n\
    \n\
    vec3 rgbA = 0.5 * (\n\
        texture2D(shadedColorTex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +\n\
        texture2D(shadedColorTex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);\n\
    vec3 rgbB = rgbA * 0.5 + 0.25 * (\n\
        texture2D(shadedColorTex, fragCoord * inverseVP + dir * -0.5).xyz +\n\
        texture2D(shadedColorTex, fragCoord * inverseVP + dir * 0.5).xyz);\n\
\n\
    float lumaB = dot(rgbB, luma);\n\
    if ((lumaB < lumaMin) || (lumaB > lumaMax))\n\
        color = vec4(rgbA, texColor.a);\n\
    else\n\
        color = vec4(rgbB, texColor.a);\n\
    return color;\n\
}\n\
\n\
void main()\n\
{\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
    float pixelSize_x = 1.0/screenWidth;\n\
	float pixelSize_y = 1.0/screenHeight;\n\
\n\
    // check for \"screenSpaceObjectsTex\".\n\
    vec4 screenSpaceColor4;\n\
    if(u_activeTex[1])\n\
    {\n\
        screenSpaceColor4 = texture2D(screenSpaceObjectsTex, screenPos);\n\
        gl_FragColor = screenSpaceColor4;\n\
\n\
        //if(screenSpaceColor4.a > 0.0)\n\
        //return;\n\
    }\n\
\n\
	vec4 shadedColor = texture2D(shadedColorTex, screenPos);\n\
\n\
    // Calculate if isEdge by sobel.***\n\
	bool bIsEdge = false;\n\
\n\
	vec4 n[9];\n\
    make_kernel(n, screenPos);\n\
    vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);\n\
	vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);\n\
	vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));\n\
	float sobelModul = length(sobel.rgb);\n\
	\n\
	if(sobelModul > 0.001)\n\
	{\n\
		bIsEdge = true;\n\
	}\n\
    else\n\
    {\n\
        // check if edge by depth range.***\n\
        bIsEdge = isEdge_byDepth(screenPos, pixelSize_x, pixelSize_y);\n\
    }\n\
\n\
	if(bIsEdge)\n\
	{\n\
		// fxaa.*********************************************************************************************************\n\
		// https://www.programmersought.com/article/75321121466/\n\
		vec2 uv_nw = vec2(screenPos.x - pixelSize_x, screenPos.y + pixelSize_y);\n\
		vec2 uv_ne = vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y);\n\
		vec2 uv_sw = vec2(screenPos.x - pixelSize_x, screenPos.y - pixelSize_y);\n\
		vec2 uv_se = vec2(screenPos.x + pixelSize_x, screenPos.y - pixelSize_y);\n\
		vec4 colorFxaa = fxaa(gl_FragCoord.xy, vec2(screenWidth, screenHeight), uv_nw, uv_ne, uv_sw, uv_se, screenPos);\n\
		shadedColor = colorFxaa;\n\
		//---------------------------------------------------------------------------------------------------------------\n\
	}\n\
\n\
    // Do bloom effect if exist.************************************\n\
    // https://www.nutty.ca/?page_id=352&link=glow\n\
    int BlendMode = 1;\n\
    vec4 brightColor = texture2D(brightColorTex, screenPos);\n\
    vec4 src = vec4(brightColor.rgba);\n\
    vec4 dst = vec4(shadedColor.rgba);\n\
    if ( BlendMode == 0 )\n\
	{\n\
		// Additive blending (strong result, high overexposure)\n\
		shadedColor = min(src + dst, 1.0);\n\
	}\n\
	else if ( BlendMode == 1 )\n\
	{\n\
		// Screen blending (mild result, medium overexposure)\n\
		shadedColor = clamp((src + dst) - (src * dst), 0.0, 1.0);\n\
		shadedColor.w = 1.0;\n\
	}\n\
	else if ( BlendMode == 2 )\n\
	{\n\
		// Softlight blending (light result, no overexposure)\n\
		// Due to the nature of soft lighting, we need to bump the black region of the glowmap\n\
		// to 0.5, otherwise the blended result will be dark (black soft lighting will darken\n\
		// the image).\n\
		src = (src * 0.5) + 0.5;\n\
		\n\
		shadedColor.xyz = vec3((src.x <= 0.5) ? (dst.x - (1.0 - 2.0 * src.x) * dst.x * (1.0 - dst.x)) : (((src.x > 0.5) && (dst.x <= 0.25)) ? (dst.x + (2.0 * src.x - 1.0) * (4.0 * dst.x * (4.0 * dst.x + 1.0) * (dst.x - 1.0) + 7.0 * dst.x)) : (dst.x + (2.0 * src.x - 1.0) * (sqrt(dst.x) - dst.x))),\n\
					(src.y <= 0.5) ? (dst.y - (1.0 - 2.0 * src.y) * dst.y * (1.0 - dst.y)) : (((src.y > 0.5) && (dst.y <= 0.25)) ? (dst.y + (2.0 * src.y - 1.0) * (4.0 * dst.y * (4.0 * dst.y + 1.0) * (dst.y - 1.0) + 7.0 * dst.y)) : (dst.y + (2.0 * src.y - 1.0) * (sqrt(dst.y) - dst.y))),\n\
					(src.z <= 0.5) ? (dst.z - (1.0 - 2.0 * src.z) * dst.z * (1.0 - dst.z)) : (((src.z > 0.5) && (dst.z <= 0.25)) ? (dst.z + (2.0 * src.z - 1.0) * (4.0 * dst.z * (4.0 * dst.z + 1.0) * (dst.z - 1.0) + 7.0 * dst.z)) : (dst.z + (2.0 * src.z - 1.0) * (sqrt(dst.z) - dst.z))));\n\
		shadedColor.w = 1.0;\n\
	}\n\
	else\n\
	{\n\
		// Show just the glow map\n\
		shadedColor = src;\n\
	}\n\
    // End bloom effect.--------------------------------------------\n\
\n\
    vec4 finalColor = shadedColor;\n\
\n\
    // Check for light fog.\n\
    if(u_activeTex[0])\n\
    {\n\
        vec4 lightFog4 = texture2D(lightFogTex, screenPos);\n\
        float alpha = lightFog4.w;\n\
        if(alpha > 0.6)\n\
        alpha = 0.6;\n\
        finalColor = mix(shadedColor, lightFog4, alpha);\n\
    }\n\
\n\
    // Check for volumetricTex.***\n\
    if(u_activeTex[6])\n\
    {\n\
        vec4 volumCol4 = texture2D(volumetricTex, screenPos);\n\
        float alpha = volumCol4.w;\n\
        //if(alpha > 0.6)\n\
        //alpha = 0.6;\n\
        finalColor = mix(shadedColor, volumCol4, alpha);\n\
    }\n\
    \n\
    gl_FragColor = finalColor; // original.***\n\
}";
ShaderSource.ScreenQuadBlurFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D image; // 0\n\
uniform vec2 uImageSize;\n\
\n\
void main()\n\
{\n\
    vec2 TexCoords = vec2(gl_FragCoord.x / uImageSize.x, gl_FragCoord.y / uImageSize.y);\n\
    vec2 texelSize = 1.0 / uImageSize;\n\
    vec4 result = vec4(0.0);\n\
    for (int x = -2; x < 2; ++x) \n\
    {\n\
        for (int y = -2; y < 2; ++y) \n\
        {\n\
            vec2 offset = vec2(float(x), float(y)) * texelSize;\n\
            result += texture2D(image, TexCoords + offset);\n\
        }\n\
    }\n\
    gl_FragData[0] = result / (4.0 * 4.0);\n\
}";
ShaderSource.ScreenQuadFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
uniform sampler2D depthTex; // 0\n\
uniform sampler2D normalTex; // 1\n\
uniform sampler2D albedoTex; // 2\n\
uniform sampler2D shadowMapTex; // 3\n\
uniform sampler2D shadowMapTex2; // 4\n\
uniform sampler2D ssaoTex; // 5\n\
uniform sampler2D diffuseLightTex; // 6\n\
uniform sampler2D specularLightTex; // 7\n\
\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform mat4 projectionMatrixInv;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float near;\n\
uniform float far; \n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
\n\
uniform bool bApplyShadow; // sun shadows on cesium terrain.\n\
uniform bool bApplyMagoShadow;\n\
uniform bool bSilhouette;\n\
uniform bool bFxaa;\n\
uniform bool bApplySsao;\n\
\n\
uniform mat4 sunMatrix[2]; \n\
uniform vec3 sunPosHIGH[2];\n\
uniform vec3 sunPosLOW[2];\n\
uniform vec3 sunDirCC;\n\
uniform vec3 sunDirWC;\n\
uniform float screenWidth;    \n\
uniform float screenHeight;  \n\
uniform vec2 ussaoTexSize;\n\
uniform vec2 uNearFarArray[4];\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
uniform float uSceneDayNightLightingFactor; // day -> 1.0; night -> 0.0\n\
uniform vec3 uBrightnessContrastSaturation;\n\
uniform int uBrightnessContrastType; // 0= only f4d, 1= f4d & terrain.\n\
\n\
uniform vec3 uAmbientLight;\n\
\n\
const float Epsilon = 1e-10;\n\
\n\
// https://ndotl.wordpress.com/2018/08/29/baking-artifact-free-lightmaps/\n\
// voxel ilum : https://publications.lib.chalmers.se/records/fulltext/256137/256137.pdf\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(normalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
	\n\
    return ray;                      \n\
} \n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
bool isInShadow(vec4 pointCC, int currSunIdx, inout bool isUnderSun)\n\
{\n\
	bool inShadow = false;\n\
	vec3 currSunPosLOW;\n\
	vec3 currSunPosHIGH;\n\
	mat4 currSunMatrix;\n\
	if(currSunIdx == 0)\n\
	{\n\
		currSunPosLOW = sunPosLOW[0];\n\
		currSunPosHIGH = sunPosHIGH[0];\n\
		currSunMatrix = sunMatrix[0];\n\
	}\n\
	else if(currSunIdx == 1)\n\
	{\n\
		currSunPosLOW = sunPosLOW[1];\n\
		currSunPosHIGH = sunPosHIGH[1];\n\
		currSunMatrix = sunMatrix[1];\n\
	}\n\
	else\n\
	return false;\n\
\n\
	\n\
	vec3 highDifferenceSun = -currSunPosHIGH.xyz + encodedCameraPositionMCHigh;\n\
	vec3 lowDifferenceSun = pointCC.xyz -currSunPosLOW.xyz + encodedCameraPositionMCLow;\n\
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
	vec4 vPosRelToLight = currSunMatrix * pos4Sun;\n\
\n\
	vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;\n\
	float tolerance = 0.9963;\n\
	tolerance = 0.9967; // test.\n\
	posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range\n\
	if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)\n\
	{\n\
		if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)\n\
		{\n\
			float depthRelToLight;\n\
			if(currSunIdx == 0)\n\
			{\n\
				depthRelToLight = unpackDepth(texture2D(shadowMapTex, posRelToLight.xy));\n\
			}\n\
			else if(currSunIdx == 1)\n\
			{\n\
				depthRelToLight = unpackDepth(texture2D(shadowMapTex2, posRelToLight.xy));\n\
			}\n\
\n\
			//if(depthRelToLight < 0.1)\n\
			//return false;\n\
\n\
			if(posRelToLight.z > depthRelToLight*tolerance )\n\
			{\n\
				inShadow = true;\n\
			}\n\
\n\
			isUnderSun = true;\n\
		}\n\
	}\n\
	\n\
	return inShadow;\n\
}\n\
\n\
/*\n\
void make_kernel(inout vec4 n[9], vec2 coord)\n\
{\n\
	// We cannot use depthTex bcos there are multiple frustums.***\n\
	//------------------------------------------------------------\n\
	float w = 1.0 / screenWidth;\n\
	float h = 1.0 / screenHeight;\n\
\n\
	n[0] = texture2D(depthTex, coord + vec2( -w, -h));\n\
	n[1] = texture2D(depthTex, coord + vec2(0.0, -h));\n\
	n[2] = texture2D(depthTex, coord + vec2(  w, -h));\n\
	n[3] = texture2D(depthTex, coord + vec2( -w, 0.0));\n\
	n[4] = texture2D(depthTex, coord);\n\
	n[5] = texture2D(depthTex, coord + vec2(  w, 0.0));\n\
	n[6] = texture2D(depthTex, coord + vec2( -w, h));\n\
	n[7] = texture2D(depthTex, coord + vec2(0.0, h));\n\
	n[8] = texture2D(depthTex, coord + vec2(  w, h));\n\
}\n\
*/\n\
\n\
void make_kernel(inout vec4 n[9], vec2 coord)\n\
{\n\
	float w = 1.0 / screenWidth;\n\
	float h = 1.0 / screenHeight;\n\
\n\
	n[0] = texture2D(normalTex, coord + vec2( -w, -h));\n\
	n[1] = texture2D(normalTex, coord + vec2(0.0, -h));\n\
	n[2] = texture2D(normalTex, coord + vec2(  w, -h));\n\
	n[3] = texture2D(normalTex, coord + vec2( -w, 0.0));\n\
	n[4] = texture2D(normalTex, coord);\n\
	n[5] = texture2D(normalTex, coord + vec2(  w, 0.0));\n\
	n[6] = texture2D(normalTex, coord + vec2( -w, h));\n\
	n[7] = texture2D(normalTex, coord + vec2(0.0, h));\n\
	n[8] = texture2D(normalTex, coord + vec2(  w, h));\n\
}\n\
\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
    if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z*0.0001;\n\
        float Fcoef_half = uFCoef_logDepth/2.0;\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = (flogzAux - 1.0);\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
float getRealDepth(in vec2 coord, in vec2 nearFar)\n\
{\n\
	return getDepth(coord) * (nearFar.y);\n\
}\n\
\n\
float getZDist(in vec2 coord)\n\
{\n\
	// This function is equivalent to \"getRealDepth\", but this is used when unknown the \"far\".***\n\
	vec4 normal4 = getNormal(coord);\n\
	int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
	vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	//float currFar = nearFar.y;\n\
	return getRealDepth(coord, nearFar);\n\
}\n\
\n\
bool isEdge(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y)\n\
{\n\
	bool bIsEdge = false;\n\
\n\
	// 1rst, check by normals.***\n\
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y*1.0)).xyz;\n\
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x*1.0, screenPos.y)).xyz;\n\
	vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;\n\
	vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;\n\
\n\
	float minDot = 0.3;\n\
\n\
	if(dot(normal, normal_up) < minDot)\n\
	{ return true; }\n\
\n\
	if(dot(normal, normal_right) < minDot)\n\
	{ return true; }\n\
\n\
	if(dot(normal, normal_down) < minDot)\n\
	{ return true; }\n\
\n\
	if(dot(normal, normal_left) < minDot)\n\
	{ return true; }\n\
\n\
	// Now, check by depth.***\n\
\n\
\n\
	return bIsEdge;\n\
}\n\
\n\
bool isEdge_byNormals(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y)\n\
{\n\
	bool bIsEdge = false;\n\
\n\
	float minDot = 0.3;\n\
\n\
	// 1rst, check by normals.***\n\
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y*1.0)).xyz;\n\
	if(dot(normal, normal_up) < minDot)\n\
	{ return true; }\n\
\n\
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x*1.0, screenPos.y)).xyz;\n\
	if(dot(normal, normal_right) < minDot)\n\
	{ return true; }\n\
\n\
	vec3 normal_upRight = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y)).xyz;\n\
	if(dot(normal, normal_upRight) < minDot)\n\
	{ return true; }\n\
\n\
	return bIsEdge;\n\
}\n\
\n\
bool _isEdge_byDepth(in float curZDist, vec2 screenPos)\n\
{\n\
	float minDist = 1.0;\n\
    float adjacentZDist = getZDist(screenPos);\n\
	float diff = abs(curZDist - adjacentZDist);\n\
	if(diff / curZDist > 0.01 && diff > minDist)\n\
	{ return true; }\n\
    else{\n\
        return false;\n\
    }\n\
}\n\
\n\
bool isEdge_byDepth(vec2 screenPos, float pixelSize_x, float pixelSize_y)\n\
{\n\
	float curZDist = getZDist(screenPos);\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x, screenPos.y + pixelSize_y*1.0))) // up.\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y*1.0))) // up-right.\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y))) // right.\n\
    { return true; }\n\
	/*\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y - pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x, screenPos.y - pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y - pixelSize_y*1.0)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y)))\n\
    { return true; }\n\
\n\
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y + pixelSize_y*1.0)))\n\
    { return true; }\n\
	*/\n\
    return false;\n\
}\n\
\n\
vec4 getShadedAlbedo(vec2 screenPos, vec3 lightingDirection, vec3 ambientColor, vec3 directionalLightColor)\n\
{\n\
	vec4 albedo = texture2D(albedoTex, screenPos);\n\
	//vec4 diffuseLight = texture2D(diffuseLightTex, screenPos) + vec4(uSceneDayNightLightingFactor);\n\
	vec4 normal = getNormal(screenPos);\n\
\n\
	float directionalLightWeighting = max(dot(normal.xyz, lightingDirection), 0.0);\n\
	\n\
	vec3 lightWeighting = ambientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
	vec4 shadedAlbedo = albedo * vec4(lightWeighting, 1.0);\n\
\n\
	return shadedAlbedo;\n\
}\n\
\n\
vec3 RGBtoHSV(in vec3 RGB)\n\
{\n\
    vec4  P   = (RGB.g < RGB.b) ? vec4(RGB.bg, -1.0, 2.0/3.0) : vec4(RGB.gb, 0.0, -1.0/3.0);\n\
    vec4  Q   = (RGB.r < P.x) ? vec4(P.xyw, RGB.r) : vec4(RGB.r, P.yzx);\n\
    float C   = Q.x - min(Q.w, Q.y);\n\
    float H   = abs((Q.w - Q.y) / (6.0 * C + Epsilon) + Q.z);\n\
    vec3  HCV = vec3(H, C, Q.x);\n\
    float S   = HCV.y / (HCV.z + Epsilon);\n\
    return vec3(HCV.x, S, HCV.z);\n\
}\n\
\n\
vec3 HSVtoRGB(in vec3 HSV)\n\
{\n\
    float H   = HSV.x;\n\
    float R   = abs(H * 6.0 - 3.0) - 1.0;\n\
    float G   = 2.0 - abs(H * 6.0 - 2.0);\n\
    float B   = 2.0 - abs(H * 6.0 - 4.0);\n\
    vec3  RGB = clamp( vec3(R,G,B), 0.0, 1.0 );\n\
    return ((RGB - 1.0) * HSV.y + 1.0) * HSV.z;\n\
}\n\
\n\
\n\
vec4 HueSatBright_color(vec4 color4, float saturation)\n\
{\n\
	// https://stackoverflow.com/questions/53879537/increase-the-intensity-of-texture-in-shader-code-opengl\n\
	vec4 color = color4;\n\
	vec3 hsv = RGBtoHSV(color.rgb);\n\
\n\
	// saturation range : -1.0 to 1.0\n\
	/*\n\
	saturation is a value in the range [0.0, 1.0]. 0.5 means that the image is kept as it is. \n\
	It saturation is greater 0.5 the image is saturated and if it is less than 0.5 the image is bleached\n\
	*/\n\
	float sat = saturation + 0.5;\n\
	hsv.y *= (sat * 2.0);\n\
\n\
	color.rgb = HSVtoRGB(hsv);\n\
\n\
    // Save the result\n\
    return color;\n\
}\n\
\n\
vec3 brightnessContrast(vec3 value, float brightness, float contrast)\n\
{\n\
	// contrast range : -1.0 to 1.0\n\
	// brightness range : -1.0 to 1.0\n\
	float internContrast = contrast + 1.0;\n\
    return (value - 0.5) * internContrast + 0.5 + brightness;\n\
}\n\
\n\
vec3 Gamma(vec3 value, float param)\n\
{\n\
    return vec3(pow(abs(value.r), param),pow(abs(value.g), param),pow(abs(value.b), param));\n\
}\n\
\n\
void getNormal_dataType_andFar(in vec2 coord, inout vec3 normal, inout int dataType, inout vec2 nearFar)\n\
{\n\
	vec4 normal4 = getNormal(coord);\n\
	normal = normal4.xyz;\n\
	int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
	dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
	nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
}\n\
\n\
\n\
void main()\n\
{\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
\n\
	// 1rst, check if this is silhouette rendering.\n\
	if(bSilhouette)\n\
	{\n\
		// Check the adjacent pixels to decide if this is silhouette.\n\
		// Analize a 5x5 rectangle of the depthTexture: if there are objectDepth & backgroundDepth => is silhouette.\n\
		float pixelSizeW = 1.0/screenWidth;\n\
		float pixelSizeH = 1.0/screenHeight;\n\
		int objectDepthCount = 0;\n\
		int backgroundDepthCount = 0;\n\
		float tolerance = 0.9963;\n\
		tolerance = 0.9963;\n\
\n\
		float origin_z_window  = unpackDepth(texture2D(depthTex, screenPos.xy)); // z_window  is [0.0, 1.0] range depth.\n\
		if(origin_z_window > tolerance)\n\
		{\n\
		\n\
			vec2 screenPos_LD = vec2(screenPos.x - pixelSizeW*2.5, screenPos.y - pixelSizeH*2.5); // left-down corner.\n\
			\n\
			for(int w = -10; w<15; w+= 4)\n\
			{\n\
				for(int h=-10; h<15; h+= 4)\n\
				{\n\
					vec2 screenPosAux = vec2(screenPos_LD.x + pixelSizeW*float(w), screenPos_LD.y + pixelSizeH*float(h));\n\
					float z_window  = unpackDepth(texture2D(depthTex, screenPosAux.xy)); // z_window  is [0.0, 1.0] range depth.\n\
\n\
					if(z_window > tolerance)\n\
					{\n\
						// is background.\n\
						backgroundDepthCount += 1;\n\
					}\n\
					else\n\
					{\n\
						// is object.\n\
						objectDepthCount += 1;\n\
					}\n\
\n\
					//if(backgroundDepthCount > 0 && objectDepthCount > 0)\n\
					//{\n\
						// is silhouette.\n\
						//gl_FragData[0] = vec4(0.2, 1.0, 0.3, 1.0);\n\
						//return;\n\
					//}\n\
					\n\
				}\n\
			}\n\
\n\
			if(backgroundDepthCount > 0 && objectDepthCount > 0)\n\
			{\n\
				// is silhouette.\n\
				float countsDif = abs(float(objectDepthCount)/16.0);\n\
				//gl_FragData[0] = vec4(0.2, 1.0, 0.3, countsDif);\n\
				vec3 silhouetteCol3 = vec3(51.0/255.0, 206.0/255.0, 255.0/255.0);\n\
				gl_FragData[0] = vec4(silhouetteCol3, countsDif);\n\
				return;\n\
			}\n\
		}\n\
\n\
		// New:\n\
		// Try to use a xCross pixels sampling data. TODO:\n\
		return;\n\
	}\n\
	\n\
	float shadow_occlusion = 1.0;\n\
	float alpha = 0.0;\n\
	vec4 finalColor;\n\
	finalColor = vec4(0.2, 0.2, 0.2, 0.8);\n\
\n\
	vec4 normal4 = getNormal(screenPos);\n\
	vec3 normal = normal4.xyz;\n\
	if(length(normal) < 0.1)\n\
	discard;\n\
\n\
\n\
	int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
	vec2 nearFar_origin = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear_origin = nearFar_origin.x;\n\
	float currFar_origin = nearFar_origin.y;\n\
	\n\
	vec3 ambientColor = vec3(0.0);\n\
	vec3 directionalLightColor = vec3(0.9, 0.9, 0.9);\n\
	float directionalLightWeighting = 1.0;\n\
\n\
	// sunShadow vars.***\n\
	bool pointIsinShadow = false;\n\
	bool isUnderSun = false;\n\
	bool sunInAntipodas = false;\n\
	if(bApplyMagoShadow)\n\
	{\n\
		// 1rst, check normal vs sunDirCC.\n\
		float dotAux = dot(sunDirCC, normal);\n\
		if(dotAux > -0.1)\n\
		{\n\
			sunInAntipodas = true;\n\
			shadow_occlusion = 0.5;\n\
		}\n\
\n\
		if(!sunInAntipodas)\n\
		{\n\
			float linearDepth = getDepth(screenPos);\n\
			// calculate the real pos of origin.\n\
			float origin_zDist = linearDepth * currFar_origin; // original.\n\
			vec3 posCC = getViewRay(screenPos, origin_zDist);\n\
			vec4 posWCRelToEye = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0);\n\
			//posWC += vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 0.0);\n\
			//------------------------------------------------------------------------------------------------------------------------------\n\
			// 2nd, calculate the vertex relative to light.***\n\
			// 1rst, try with the closest sun. sunIdx = 0.\n\
			\n\
			pointIsinShadow = isInShadow(posWCRelToEye, 0, isUnderSun);\n\
			if(!isUnderSun)\n\
			{\n\
				pointIsinShadow = isInShadow(posWCRelToEye, 1, isUnderSun);\n\
			}\n\
\n\
			if(isUnderSun)\n\
			{\n\
				if(pointIsinShadow)\n\
				{\n\
					shadow_occlusion = 0.5;\n\
					alpha = 0.5;\n\
				}\n\
			}\n\
		}\n\
		\n\
		// calculate sunDirCC.\n\
		//vec4 sunDirCC = modelViewMatrixRelToEyeInv * vec4(sunDirWC, 1.0);\n\
		//directionalLightWeighting = max(dot(normal, -sunDirCC.xyz), 0.0);\n\
	}\n\
	\n\
	ambientColor = uAmbientLight;\n\
	// https://learnopengl.com/Lighting/Basic-Lighting\n\
	vec3 lightingDirection = normalize(vec3(0.6, 0.6, 0.6));\n\
	//vec3 lightingDirection = normalize(vec3(0.0, 0.0, 1.0)); // lightDir = camDir.***\n\
	directionalLightWeighting = max(dot(normal, lightingDirection), 0.0);\n\
	\n\
	// 1rst, take the albedo.\n\
	vec4 albedo = texture2D(albedoTex, screenPos);\n\
\n\
	// Color correction.**********************************************************************************\n\
	if(uBrightnessContrastType == 0) // apply brightness & contrast for f4d objects.\n\
	{\n\
		if(dataType == 0)\n\
		{\n\
			float brightness = uBrightnessContrastSaturation.x; // range [0.0, 1.0].\n\
			float contrast = uBrightnessContrastSaturation.y; // range [0.0, 1.0].\n\
			float saturation = uBrightnessContrastSaturation.z; // range [0.0, 1.0].\n\
			albedo.rgb = brightnessContrast(albedo.rgb, brightness, contrast);\n\
			albedo = HueSatBright_color(albedo, saturation);\n\
\n\
			//albedo.rgb = Gamma(albedo.rgb, 1.1);\n\
		}\n\
	}\n\
	else if(uBrightnessContrastType == 1) // apply brightness & contrast for f4d objects and terrain\n\
	{\n\
		float brightness = uBrightnessContrastSaturation.x; // range [0.0, 1.0].\n\
		float contrast = uBrightnessContrastSaturation.y; // range [0.0, 1.0].\n\
		float saturation = uBrightnessContrastSaturation.z; // range [0.0, 1.0].\n\
		albedo.rgb = brightnessContrast(albedo.rgb, brightness, contrast);\n\
		albedo = HueSatBright_color(albedo, saturation);\n\
\n\
		//albedo.rgb = Gamma(albedo.rgb, 1.1);\n\
	}\n\
	// End color correction.---------------------------------------------------------------------------\n\
\n\
	vec4 diffuseLight = texture2D(diffuseLightTex, screenPos);\n\
	float diffuseLightModul = length(diffuseLight.xyz);\n\
\n\
	//vec3 ray = getViewRay(screenPos, 1.0); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	//float scalarProd = abs(dot(normal, normalize(-ray)));\n\
\n\
	\n\
	vec3 lightWeighting = ambientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
\n\
	//lightWeighting += diffuseLight.xyz;\n\
	if(dataType != 1)\n\
	{\n\
		albedo *= vec4(lightWeighting, 1.0) ;\n\
	}\n\
	else\n\
	{\n\
		// This is terrain. provisionally do nothing.\n\
		//albedo *= vec4(lightWeighting, 1.0);\n\
	}\n\
\n\
	finalColor = albedo;\n\
	\n\
	if(bApplySsao)\n\
	{\n\
		// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
\n\
		//ssaoFromDepthTex\n\
		float pixelSize_x = 1.0/screenWidth;\n\
		float pixelSize_y = 1.0/screenHeight;\n\
		float pixelSizeSsaoTex_x = 1.0/ussaoTexSize.x;\n\
		float pixelSizeSsaoTex_y = 1.0/ussaoTexSize.y;\n\
		vec4 occlFromDepth = vec4(0.0);\n\
		\n\
		for(int i=0; i<4; i++)\n\
		{\n\
			for(int j=0; j<4; j++)\n\
			{\n\
				vec2 texCoord = vec2(screenPos.x + pixelSizeSsaoTex_x*float(i-2), screenPos.y + pixelSizeSsaoTex_y*float(j-2)); \n\
				vec4 color = texture2D(ssaoTex, texCoord);\n\
				occlFromDepth += color;\n\
			}\n\
		}\n\
		occlFromDepth /= 16.0;\n\
		\n\
\n\
		float attenuation = 0.45;\n\
		//vec4 color = texture2D(ssaoTex, screenPos);\n\
		//occlFromDepth = color;\n\
\n\
		// Aditive methode.***************************\n\
		//occlFromDepth *= attenuation; // attenuation.\n\
		//float occlusionInverseAdd = (1.0 - occlFromDepth.r) + (1.0 -  occlFromDepth.g) + (1.0 - occlFromDepth.b) + (1.0 - occlFromDepth.a); // original.***\n\
\n\
		// Multiplicative methode.********************\n\
		attenuation = 0.6;\n\
		occlFromDepth *= attenuation; // attenuation.\n\
		float occlusionInverseMult = (1.0 - occlFromDepth.r) * (1.0 -  occlFromDepth.g) * (1.0 - occlFromDepth.b) * (1.0 - occlFromDepth.a); // original.***\n\
\n\
		float occlInv = occlusionInverseMult;\n\
\n\
		//float lightFactorAux = uSceneDayNightLightingFactor + diffuseLightModul;\n\
		vec3 diffuseLight3 = diffuseLight.xyz + vec3(uSceneDayNightLightingFactor);\n\
\n\
		// Light factor.***\n\
		shadow_occlusion += diffuseLightModul * 0.3;\n\
		if(shadow_occlusion > 1.0)\n\
		shadow_occlusion = 1.0;\n\
\n\
		occlInv *= (shadow_occlusion);\n\
		bool isTransparentObject = false;\n\
		if(albedo.a < 1.0)\n\
		{\n\
			// This is transparent object (rendered in transparent pass), so atenuate occInv.\n\
			isTransparentObject = true;\n\
			occlInv *= 3.0;\n\
			if(occlInv > 1.0)\n\
			occlInv = 1.0;\n\
		}\n\
\n\
		if(bApplyMagoShadow && !pointIsinShadow && !sunInAntipodas)\n\
		{\n\
			if(occlInv < 1.0)\n\
			{\n\
				occlInv = min(occlInv * 1.5, 1.0);\n\
			}\n\
			\n\
		}\n\
\n\
		finalColor = vec4(albedo.r * occlInv * diffuseLight3.x, \n\
							albedo.g * occlInv * diffuseLight3.y, \n\
							albedo.b * occlInv * diffuseLight3.z, albedo.a);\n\
\n\
		gl_FragData[0] = finalColor;\n\
\n\
		// EDGES.****************************************************************\n\
		if(dataType == 0 || dataType == 1)// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
		{\n\
			\n\
			bool bIsEdge = isEdge_byNormals(screenPos, normal, pixelSize_x, pixelSize_y); // original.***\n\
\n\
			if(!bIsEdge && dataType == 0)\n\
			{\n\
				// Check if is edge by depth range.***\n\
				bIsEdge = isEdge_byDepth(screenPos, pixelSize_x, pixelSize_y);\n\
			}\n\
			\n\
			if(bIsEdge)\n\
			{				\n\
				vec4 edgeColor = finalColor * 0.7;\n\
				if(isTransparentObject)\n\
					edgeColor *= 1.5;\n\
\n\
				finalColor = vec4(edgeColor.rgb, 1.0);\n\
\n\
				gl_FragData[0] = finalColor;\n\
				\n\
			}\n\
\n\
			// shade terrain : TODO.***\n\
			if(dataType == 1)\n\
			{\n\
				// TODO :\n\
				// Calculate normal by depth texture.***\n\
				//vec4 normal4 = getNormal(screenPos);\n\
				//vec3 normal = normal4.xyz;\n\
				//int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
				//int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
				//int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
				//vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
				//float currNear = nearFar.x;\n\
				//float currFar = nearFar.y;\n\
				//float realDepth = getRealDepth(screenPos, currFar);\n\
				//---------------------------------------------------------\n\
				\n\
			}\n\
			\n\
		}\n\
		else if(dataType == 2)// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
		{\n\
			// this is pointCloud data.\n\
			// Check depth values around the pixel to find a silhouette.\n\
			float pixelSize_x = 1.0/screenWidth;\n\
			float pixelSize_y = 1.0/screenHeight;\n\
			float myLinearDepth = getDepth(screenPos);\n\
\n\
			float myDepth = myLinearDepth * currFar_origin;\n\
			float log2Deoth = log2(myDepth);\n\
			// Apply Eye-Dom-Lighting (EDL).***\n\
			\n\
			float coordScale = 1.5;\n\
\n\
			// top.***\n\
			vec2 texCoord_top = vec2(screenPos.x, screenPos.y + pixelSize_y*coordScale);\n\
			vec3 normal_top;\n\
			int dataType_top;\n\
			vec2 nearfar_top;\n\
			getNormal_dataType_andFar(texCoord_top, normal_top, dataType_top, nearfar_top);\n\
			float realDepth_top = getRealDepth(texCoord_top, nearfar_top);\n\
\n\
			// left.***\n\
			vec2 texCoord_left = vec2(screenPos.x - pixelSize_x * coordScale, screenPos.y);\n\
			vec3 normal_left;\n\
			int dataType_left;\n\
			vec2 nearfar_left;\n\
			getNormal_dataType_andFar(texCoord_left, normal_left, dataType_left, nearfar_left);\n\
			float realDepth_left = getRealDepth(texCoord_left, nearfar_left);\n\
\n\
			// bottom.***\n\
			vec2 texCoord_bottom = vec2(screenPos.x, screenPos.y - pixelSize_y*coordScale);\n\
			vec3 normal_bottom;\n\
			int dataType_bottom;\n\
			vec2 nearfar_bottom;\n\
			getNormal_dataType_andFar(texCoord_bottom, normal_bottom, dataType_bottom, nearfar_bottom);\n\
			float realDepth_bottom = getRealDepth(texCoord_bottom, nearfar_bottom);\n\
\n\
			// right.***\n\
			vec2 texCoord_right = vec2(screenPos.x + pixelSize_x * coordScale, screenPos.y);\n\
			vec3 normal_right;\n\
			int dataType_right;\n\
			vec2 nearfar_right;\n\
			getNormal_dataType_andFar(texCoord_right, normal_right, dataType_right, nearfar_right);\n\
			float realDepth_right = getRealDepth(texCoord_right, nearfar_right);\n\
\n\
			float response = (max(0.0, log2Deoth - log2(realDepth_top)) + max(0.0, log2Deoth - log2(realDepth_left)) + max(0.0, log2Deoth - log2(realDepth_bottom)) + max(0.0, log2Deoth - log2(realDepth_right))) / 4.0;\n\
			float edlStrength = 2.0;\n\
			float shade = exp(-response * 300.0 * edlStrength);\n\
\n\
			vec4 finalColorPC = vec4(albedo.rgb * shade, albedo.a);\n\
			//finalColorPC = vec4(1.0, 0.0, 0.0, albedo.a);\n\
\n\
			gl_FragData[0] = finalColorPC;\n\
\n\
		}\n\
		\n\
	}\n\
\n\
	// fog.*****************************************************************\n\
	//bool bApplyFog = true;\n\
	//if(bApplyFog)\n\
	//{\n\
	//	float zDist = getZDist(screenPos);\n\
	//	float fogFactor = min(zDist / 2000.0, 0.4);\n\
	//	vec4 finalColor2 = mix(finalColor, vec4(1.0, 1.0, 1.0, 1.0), fogFactor);\n\
	//	gl_FragData[0] = vec4(finalColor2);\n\
	//}\n\
	\n\
	// End fog.---------------------------------------------------------------\n\
\n\
	// Finally check for brightColor (for bloom effect, if exist).***\n\
	float brightness = dot(finalColor.rgb, vec3(0.2126, 0.7152, 0.0722));\n\
	vec4 brightColor;\n\
	if(brightness > 1.0)\n\
        brightColor = vec4(finalColor.rgb, 1.0);\n\
    else\n\
        brightColor = vec4(0.0, 0.0, 0.0, 1.0);\n\
	gl_FragData[1] = brightColor;\n\
\n\
	// debugTex.***\n\
	//float pixelSize_x_ = 1.0/screenWidth;\n\
	//float pixelSize_y_ = 1.0/screenHeight;\n\
	//float zDist = getZDist(screenPos);// - nearFar_origin.x);\n\
	//bool isEdgeTest = _isEdge_byDepth(zDist, screenPos);\n\
	//float zDist_top = getZDist(vec2(screenPos.x, screenPos.y + pixelSize_y_));// - nearFar_origin.x);\n\
	//if(isEdgeTest)\n\
	//{\n\
	//	gl_FragData[2] = vec4(1.0, 0.0, 0.0, 1.0);\n\
	//}\n\
	//else gl_FragData[2] = vec4(zDist/1200.0, zDist/1200.0, zDist/1200.0, 1.0);\n\
}";
ShaderSource.ScreenQuadGaussianBlurFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D image; // 0\n\
\n\
uniform bool u_bHorizontal;\n\
uniform vec2 uImageSize;\n\
\n\
\n\
// Tutorial for bloom effect : https://learnopengl.com/Advanced-Lighting/Bloom\n\
\n\
void main()\n\
{\n\
    //float weight[5] = float[5] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);   \n\
    float weight[5];   \n\
    weight[0] = 0.227027;\n\
    weight[1] = 0.1945946;\n\
    weight[2] = 0.1216216;\n\
    weight[3] = 0.054054;\n\
    weight[4] = 0.016216;\n\
\n\
    vec2 TexCoords = vec2(gl_FragCoord.x / uImageSize.x, gl_FragCoord.y / uImageSize.y);\n\
    float pixelSize_x = 1.0/uImageSize.x;\n\
	float pixelSize_y = 1.0/uImageSize.y;\n\
\n\
    vec4 result = texture2D(image, TexCoords) * weight[0]; // current fragment's contribution\n\
    if(u_bHorizontal)\n\
    {\n\
        for(int i = 1; i < 4; ++i)\n\
        {\n\
            result += texture2D(image, TexCoords + vec2(pixelSize_x * float(i), 0.0)) * weight[i];\n\
            result += texture2D(image, TexCoords - vec2(pixelSize_x * float(i), 0.0)) * weight[i];\n\
        }\n\
    }\n\
    else\n\
    {\n\
        for(int i = 1; i < 4; ++i)\n\
        {\n\
            result += texture2D(image, TexCoords + vec2(0.0, pixelSize_y * float(i))) * weight[i];\n\
            result += texture2D(image, TexCoords - vec2(0.0, pixelSize_y * float(i))) * weight[i];\n\
        }\n\
    }\n\
    gl_FragData[0] = result;\n\
}";
ShaderSource.ScreenQuadVS = "//precision mediump float;\n\
\n\
attribute vec2 position;\n\
varying vec4 vColor; \n\
varying vec2 vTexCoord;\n\
\n\
void main() {\n\
	vColor = vec4(0.2, 0.2, 0.2, 0.5);\n\
    gl_Position = vec4(1.0 - 2.0 * position, 0.0, 1.0);\n\
    vTexCoord = gl_Position.xy;\n\
}";
ShaderSource.screen_frag = "precision mediump float;\n\
\n\
uniform sampler2D u_screen;\n\
uniform float u_opacity;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);\n\
    // a hack to guarantee opacity fade out even with a value close to 1.0\n\
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);\n\
}\n\
";
ShaderSource.SilhouetteFS = "precision highp float;\n\
uniform vec4 vColor4Aux;\n\
\n\
void main()\n\
{          \n\
    gl_FragColor = vColor4Aux;\n\
}";
ShaderSource.SilhouetteVS = "attribute vec3 position;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 ModelViewMatrixRelToEye;\n\
uniform mat4 ProjectionMatrix;\n\
uniform mat4 RefTransfMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
uniform vec2 camSpacePixelTranslation;\n\
uniform vec2 screenSize;   \n\
varying vec2 camSpaceTranslation;\n\
\n\
void main()\n\
{    \n\
    vec4 rotatedPos;\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    vec4 camSpacePos = ModelViewMatrixRelToEye * pos4;\n\
    vec4 translationVec = ProjectionMatrix * vec4(camSpacePixelTranslation.x*(-camSpacePos.z), camSpacePixelTranslation.y*(-camSpacePos.z), 0.0, 1.0);\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
    gl_Position += translationVec;  \n\
}";
ShaderSource.soundCalculateFluxFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
    //*********************************************************\n\
    // R= right, F= front, U= up, L= left, B= back, D= down.\n\
    // RFU = x, y, z.\n\
    // LBD = -x, -y, -z.\n\
    //*********************************************************\n\
\n\
uniform sampler2D airPressureMosaicTex;\n\
uniform sampler2D flux_RFU_MosaicTex_HIGH; // Inside here, there are the voxelization of the scene (in alpha channel).***\n\
uniform sampler2D flux_RFU_MosaicTex_LOW;\n\
uniform sampler2D flux_LBD_MosaicTex_HIGH;\n\
uniform sampler2D flux_LBD_MosaicTex_LOW;\n\
uniform sampler2D auxMosaicTex; // here, contains :\n\
	// tex_0 = prev airPressureTex\n\
	// tex_1 = next airPressureTex\n\
	// tex_2 = prev flux_RFU_HIGH\n\
	// tex_3 = next flux_RFU_HIGH\n\
	// tex_4 = prev flux_RFU_LOW\n\
	// tex_5 = next flux_RFU_LOW\n\
	// tex_6 = prev flux_LBD_HIGH\n\
	// tex_7 = next flux_LBD_HIGH\n\
	// tex_8 = prev flux_LBD_LOW\n\
	// tex_9 = next flux_LBD_LOW\n\
\n\
	//  \n\
	//      +-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |     \n\
	//      |   tex_8   |   tex_9   |  nothing  |  nothing  |\n\
	//      |           |           |           |           | \n\
	//      +-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           | \n\
	//      |   tex_4   |   tex_5   |   tex_6   |   tex_7   |\n\
	//      |           |           |           |           |\n\
	//      +-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |    \n\
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   | \n\
	//      |           |           |           |           |\n\
	//      +-----------+-----------+-----------+-----------+\n\
\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
uniform int u_mosaicTexSize[3]; // The mosaic texture size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_lowestMosaicSliceIndex;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
uniform float u_timestep;\n\
\n\
//uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec3 u_voxelSizeMeters;\n\
uniform float u_airMaxPressure;\n\
uniform float u_maxFlux;\n\
uniform float u_airEnvirontmentPressure;\n\
//uniform vec2 u_heightMap_MinMax;\n\
\n\
//uniform vec2 u_simulationTextureSize;\n\
//uniform vec2 u_terrainTextureSize;\n\
//uniform int u_terrainHeightEncodingBytes;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    float s = float(col) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row) * tRange + subTexCoord.y * tRange;\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
    return resultTexCoord;\n\
}\n\
\n\
vec2 getColRow_and_subTexCoord(in vec2 texCoord, inout vec2 subTexCoord)\n\
{\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    // Determine the [col, row] of the mosaic.***\n\
    vec2 resultColRow = vec2(floor(texCoord.x / sRange), floor(texCoord.y / tRange));\n\
\n\
    // determine the subTexCoord.***\n\
    float col_mod = texCoord.x - resultColRow.x * sRange;\n\
    float row_mod = texCoord.y - resultColRow.y * tRange;\n\
    float s = col_mod / sRange;\n\
    float t = row_mod / tRange;\n\
    subTexCoord = vec2(s, t);\n\
\n\
    return resultColRow;\n\
}\n\
\n\
float getAirPressure_inMosaicTexture(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(airPressureMosaicTex, texCoord);\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float airPressure = decoded * u_airMaxPressure;\n\
\n\
    return airPressure;\n\
}\n\
\n\
float getAirPressure_inAuxMosaicTexture(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(auxMosaicTex, texCoord);\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float airPressure = decoded * u_airMaxPressure;\n\
\n\
    return airPressure;\n\
}\n\
\n\
bool getPrevSubTextureColRow(in int col, in int row, inout int prev_col, inout int prev_row)\n\
{\n\
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    prev_row = row;\n\
    if(col == 0)\n\
    {\n\
        prev_col = u_mosaicSize[0] - 1;\n\
        prev_row = row - 1;\n\
\n\
        // now, check if the prev_row is inside of the boundary.***\n\
        if(prev_row < 0)\n\
        {\n\
            // we are outside of the tex3d boundary.***\n\
            return false;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        prev_col = col - 1;\n\
    }\n\
    return true;\n\
}\n\
\n\
bool getNextSubTextureColRow(in int col, in int row, inout int next_col, inout int next_row)\n\
{\n\
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    next_row = row;\n\
    if(col == u_mosaicSize[0] - 1)\n\
    {\n\
        next_col = 0;\n\
        next_row = row + 1;\n\
\n\
        // now, check if the next_row is inside of the boundary.***\n\
        if(next_row > u_mosaicSize[1] - 1)\n\
        {\n\
            // we are outside of the tex3d boundary.***\n\
            return false;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        next_col = col + 1;\n\
    }\n\
\n\
    // Must check : some times, no all textures of the last row is used.***\n\
    int sliceIdx = next_row * u_mosaicSize[0] + next_col;\n\
    if(sliceIdx > u_texSize[2]-1)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    return true;\n\
}\n\
\n\
float getAirPressure(in vec2 texCoord, inout vec3 airPressure_RFU, inout vec3 airPressure_LBD, inout vec3 voxelSpaceType_RFU, inout vec3 voxelSpaceType_LBD)\n\
{\n\
    // **********************************************************************\n\
    // Note : this function returns the airPressure of all 6 Neighbor too.***\n\
    // **********************************************************************\n\
    vec2 subTexCoord;\n\
    vec2 colRow = getColRow_and_subTexCoord(texCoord, subTexCoord);\n\
\n\
    float col = colRow.x;\n\
    float row = colRow.y;\n\
    int col_int = int(col);\n\
    int row_int = int(row);\n\
\n\
    float divSubX = 1.0 / float(u_texSize[0]); // divX for subTexture.***\n\
    float divSubY = 1.0 / float(u_texSize[1]); // divX for subTexture.***\n\
\n\
    // airPressure_curr.*********************************************************************\n\
    float airPressure_curr = getAirPressure_inMosaicTexture(texCoord);\n\
\n\
    // airPressure_R.************************************************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_R = subTexCoord + vec2(divSubX, 0.0);\n\
    if(subTexCoord_R.x > 1.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        airPressure_RFU.x = u_airEnvirontmentPressure;\n\
\n\
        // the voxelSpaceType is 0 (void).***\n\
        voxelSpaceType_RFU.x = 0.0;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_R:\n\
        vec2 mosaicTexCoord_R = subTexCoord_to_texCoord(subTexCoord_R, col_int, row_int);\n\
        airPressure_RFU.x = getAirPressure_inMosaicTexture(mosaicTexCoord_R);\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_R);\n\
        voxelSpaceType_RFU.x = color4_RFU_HIGH.a;\n\
    }\n\
\n\
    // airPressure_F.************************************************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_F = subTexCoord + vec2(0.0, divSubY);\n\
    if(subTexCoord_F.y > 1.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        airPressure_RFU.y = u_airEnvirontmentPressure;\n\
\n\
        // the voxelSpaceType is 0 (void).***\n\
        voxelSpaceType_RFU.y = 0.0;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_F:\n\
        vec2 mosaicTexCoord_F = subTexCoord_to_texCoord(subTexCoord_F, col_int, row_int);\n\
        airPressure_RFU.y = getAirPressure_inMosaicTexture(mosaicTexCoord_F);\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_F);\n\
        voxelSpaceType_RFU.y = color4_RFU_HIGH.a;\n\
    }\n\
\n\
    // airPressure_U.************************************************************************\n\
    // To calculate the airPressure_U, must know the UP_subTexrure (NEXT subTexure).***\n\
    // But, if the current subTexture is in right_up_corner, then must use the \"auxMosaicTex\".***\n\
    // use the next subTexture.***\n\
    int next_col;\n\
    int next_row;\n\
    if(getNextSubTextureColRow(col_int, row_int, next_col, next_row))\n\
    {\n\
        // must recalcuate the mosaicTexCoord.***\n\
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, next_col, next_row);\n\
        airPressure_RFU.z = getAirPressure_inMosaicTexture(newMosaicTexCoord); \n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, newMosaicTexCoord);\n\
        voxelSpaceType_RFU.z = color4_RFU_HIGH.a;\n\
    }\n\
    else\n\
    {\n\
        // Is out of this slice.***\n\
        // Must use the \"auxMosaicTex\". This is a [4, 3] mosaic texture.***\n\
        // tex_1 = next airPressureTex. this in [col 1, row 0] into \"auxMosaicTex\".***\n\
        // Must calculate the texCoords of auxMosaicTex.***\n\
\n\
        float sRange_aux = 1.0 / 4.0;\n\
        float tRange_aux = 1.0 / 3.0;\n\
\n\
        float col_aux = 1.0;\n\
        float row_aux = 0.0;\n\
\n\
        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        vec2 texCoord_auxMosaicTex = vec2(s, t);\n\
        //airPressure_RFU.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);\n\
        airPressure_RFU.z = u_airEnvirontmentPressure; // test delete.***\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord_auxMosaicTex); // error! Cannot use \"texCoord_auxMosaicTex\" in \"flux_RFU_MosaicTex_HIGH\" texture!!!\n\
        //voxelSpaceType_RFU.z = color4_RFU_HIGH.a;\n\
        voxelSpaceType_RFU.z = 0.0;\n\
        \n\
    }\n\
    //--------------------------------------------------------------------------------------------------------------\n\
    //--------------------------------------------------------------------------------------------------------------\n\
\n\
    // airPressure_L.************************************************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_L = subTexCoord + vec2(-divSubX, 0.0);\n\
    if(subTexCoord_L.x < 0.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        airPressure_LBD.x = u_airEnvirontmentPressure;\n\
\n\
        // the voxelSpaceType is 0 (void).***\n\
        voxelSpaceType_LBD.x = 0.0;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_L:\n\
        vec2 mosaicTexCoord_L = subTexCoord_to_texCoord(subTexCoord_L, col_int, row_int);\n\
        airPressure_LBD.x = getAirPressure_inMosaicTexture(mosaicTexCoord_L);\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_L);\n\
        voxelSpaceType_LBD.x = color4_RFU_HIGH.a;\n\
    }\n\
\n\
    // airPressure_B.************************************************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_B = subTexCoord + vec2(0.0, -divSubY);\n\
    if(subTexCoord_B.y < 0.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        airPressure_LBD.y = u_airEnvirontmentPressure;\n\
\n\
        // the voxelSpaceType is 0 (void).***\n\
        voxelSpaceType_LBD.y = 0.0;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_B:\n\
        vec2 mosaicTexCoord_B = subTexCoord_to_texCoord(subTexCoord_B, col_int, row_int);\n\
        airPressure_LBD.y = getAirPressure_inMosaicTexture(mosaicTexCoord_B);\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_B);\n\
        voxelSpaceType_LBD.y = color4_RFU_HIGH.a;\n\
    }\n\
\n\
    // airPressure_D.************************************************************************\n\
    // To calculate the airPressure_D, must know the UP_subTexrure (PREV subTexure).***\n\
    // But, if the current subTexture is in left_down_corner, then must use the \"auxMosaicTex\".***\n\
    // use the next subTexture.***\n\
    int prev_col;\n\
    int prev_row;\n\
    if(getPrevSubTextureColRow(col_int, row_int, prev_col, prev_row))\n\
    {\n\
        // must recalcuate the mosaicTexCoord.***\n\
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, prev_col, prev_row);\n\
        airPressure_LBD.z = getAirPressure_inMosaicTexture(newMosaicTexCoord); \n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, newMosaicTexCoord);\n\
        voxelSpaceType_LBD.z = color4_RFU_HIGH.a;\n\
    }\n\
    else\n\
    {\n\
        // Is out of simulation boundary.***\n\
        // Must use the \"auxMosaicTex\". This is a [4, 3] mosaic texture.***\n\
        // tex_1 = next airPressureTex. this in [col 0, row 0] into \"auxMosaicTex\".***\n\
        // Must calculate the texCoords of auxMosaicTex.***\n\
\n\
        float sRange_aux = 1.0 / 4.0;\n\
        float tRange_aux = 1.0 / 3.0;\n\
\n\
        float col_aux = 0.0;\n\
        float row_aux = 0.0;\n\
\n\
        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        vec2 texCoord_auxMosaicTex = vec2(s, t);\n\
        //airPressure_LBD.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);\n\
        airPressure_LBD.z = u_airEnvirontmentPressure; // test delete.***\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        //vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord_auxMosaicTex); // error! Cannot use \"texCoord_auxMosaicTex\" in \"flux_RFU_MosaicTex_HIGH\" texture!!!\n\
        //voxelSpaceType_LBD.z = color4_RFU_HIGH.a;\n\
        voxelSpaceType_LBD.z = 0.0;\n\
        \n\
    }\n\
    //--------------------------------------------------------------------------------------------------------------\n\
    //--------------------------------------------------------------------------------------------------------------\n\
\n\
    return airPressure_curr;\n\
}\n\
\n\
void encodeFlux(in vec3 flux, inout vec3 flux_HIGH, inout vec3 flux_LOW)\n\
{\n\
    vec2 encoded_a_flux = encodeRG(flux.x);\n\
    vec2 encoded_b_flux = encodeRG(flux.y);\n\
    vec2 encoded_c_flux = encodeRG(flux.z);\n\
\n\
    flux_HIGH = vec3(encoded_a_flux.x, encoded_b_flux.x, encoded_c_flux.x);\n\
    flux_LOW = vec3(encoded_a_flux.y, encoded_b_flux.y, encoded_c_flux.y);\n\
}\n\
\n\
void getFlux(in vec2 texCoord, inout vec3 flux_RFU, inout vec3 flux_LBD)\n\
{\n\
    // This function returns Outing flux.***\n\
    vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord);\n\
    vec4 color4_RFU_LOW = texture2D(flux_RFU_MosaicTex_LOW, texCoord);\n\
    vec4 color4_LBD_HIGH = texture2D(flux_LBD_MosaicTex_HIGH, texCoord);\n\
    vec4 color4_LBD_LOW = texture2D(flux_LBD_MosaicTex_LOW, texCoord);\n\
\n\
    // now, decode all fluxes.***\n\
    flux_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.\n\
    flux_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.\n\
    flux_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.\n\
\n\
    flux_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.\n\
    flux_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.\n\
    flux_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.\n\
}\n\
\n\
float getVoxelSpaceValue(in vec2 texCoord)\n\
{\n\
    // The scene voxelMatrix is into flux_RFU_MosaicTex_HIGH, in alpha channel.***\n\
    vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord);\n\
    return color4_RFU_HIGH.a;\n\
}\n\
\n\
float getAirMass_kg(in float P_Atm, in float V_m3, in float T_Kelvin)\n\
{\n\
    // Remembering.*************************************************************************************************************************\n\
    // \"ecuacion propagacion sonido\" => https://openstax.org/books/f%C3%ADsica-universitaria-volumen-1/pages/17-2-velocidad-del-sonido\n\
    // https://en.wikipedia.org/wiki/Density_of_air#:~:text=At%20101.325%20kPa%20(abs)%20and,International%20Standard%20Atmosphere%20(ISA).\n\
    // P1 * V1 = P2 * V2.***\n\
    // airDensity ro = ρ = 1.225 [kg/m3]\n\
    // airMolarMass = 0.02897 [Kg/mol]\n\
    // universalGasConstant R = 8.31446261815324 [J/(K*mol)], [m3*Pa/(K*mol)], [Kg*m2/(s2*K*mol)]\n\
    // airPressure at sea level = 101325 Pa = 101.325 kPa = 1013.25 hPa ≈ 1 bar\n\
    // Standard temperature at sea level is T = 288.15K\n\
    // Number of Avogadro n = 6.022 * 10E23\n\
    // Masa molar air = 29kg/kmol\n\
    // -------------------------------------------------------------------------------------------------------------------------------------\n\
\n\
    // P = pressure(Atm), V = volume (m3), T = temperature (K).***\n\
    float atmToPa = 101325.0;// 1 atm = 101325 Pa.***\n\
    float P_Pa = P_Atm * atmToPa; \n\
    float R = 8.31446261815324;\n\
    float n = P_Pa * V_m3 / (R * T_Kelvin); // number of air mols.***\n\
    float molarMassAir = 29.0; // kg/kmol.\n\
    float airMass = n/1000.0 * molarMassAir; // kg.***\n\
    return airMass;\n\
}\n\
\n\
\n\
\n\
void main()\n\
{\n\
    // The objective is to determine the outFlux of the current fragment.***\n\
    // There are 6 directions outFluxing (R, F, U, L, B, D) = (x, y, z, -x, -y, -z) = (Right, Front, Up, Left, Back, Down)\n\
    //-----------------------------------------------------------------------\n\
    float voxelSpaceValue = getVoxelSpaceValue(v_tex_pos);\n\
    if(voxelSpaceValue > 0.0)\n\
    {\n\
        // This is a solid space, so, do nothing. All values are zero.***\n\
        // Do NOT discard bcos must write the voxelSpaceValue.***\n\
        /*\n\
        vec3 outFlux_RFU = vec3(0.0);\n\
        vec3 outFlux_LBD = vec3(0.0);\n\
\n\
        vec3 encodedOutFlux_RFU_HIGH;\n\
        vec3 encodedOutFlux_RFU_LOW;\n\
        vec3 encodedOutFlux_LBD_HIGH;\n\
        vec3 encodedOutFlux_LBD_LOW;\n\
        encodeFlux(outFlux_RFU, encodedOutFlux_RFU_HIGH, encodedOutFlux_RFU_LOW);\n\
        encodeFlux(outFlux_LBD, encodedOutFlux_LBD_HIGH, encodedOutFlux_LBD_LOW);\n\
        */\n\
        vec3 zerovec = vec3(0.0);\n\
        gl_FragData[0] = vec4(zerovec, voxelSpaceValue);  // RFU flux high.\n\
\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
            gl_FragData[1] = vec4(zerovec, voxelSpaceValue); // RFU flux low.\n\
            gl_FragData[2] = vec4(zerovec, voxelSpaceValue);  // LBD flux high.\n\
            gl_FragData[3] = vec4(zerovec, voxelSpaceValue);  // LBD flux low.\n\
            gl_FragData[4] = vec4(0.0, 1.0, 0.0, 1.0);  // shader log.\n\
        #endif\n\
        return;\n\
        \n\
    }\n\
\n\
    // Determine the airPressure of the 6 fragment that is around of current fragment.***\n\
    // pressure unit [Atm].***\n\
    vec3 airPressure_RFU;\n\
    vec3 airPressure_LBD;\n\
    vec3 voxelSpaceType_RFU;\n\
    vec3 voxelSpaceType_LBD;\n\
    float airPressure_curr = getAirPressure(v_tex_pos, airPressure_RFU, airPressure_LBD, voxelSpaceType_RFU, voxelSpaceType_LBD); // pressure unit [Atm].***\n\
\n\
    vec3 currFlux_RFU;\n\
    vec3 currFlux_LBD;\n\
    getFlux(v_tex_pos, currFlux_RFU, currFlux_LBD);\n\
\n\
    // Calculate deltaPressure.***\n\
    // Check the pressure difference with the neighbor voxels.***\n\
    float R_out = airPressure_curr - airPressure_RFU.x;\n\
    float F_out = airPressure_curr - airPressure_RFU.y;\n\
    float U_out = airPressure_curr - airPressure_RFU.z;\n\
    float L_out = airPressure_curr - airPressure_LBD.x;\n\
    float B_out = airPressure_curr - airPressure_LBD.y;\n\
    float D_out = airPressure_curr - airPressure_LBD.z;\n\
    \n\
    if(voxelSpaceType_RFU.x > 0.0)\n\
    {\n\
        R_out = 0.0;\n\
        currFlux_RFU.x = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_RFU.y > 0.0)\n\
    {\n\
        F_out = 0.0;\n\
        currFlux_RFU.y = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_RFU.z > 0.0)\n\
    {\n\
        U_out = 0.0;\n\
        currFlux_RFU.z = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_LBD.x > 0.0)\n\
    {\n\
        L_out = 0.0;\n\
        currFlux_LBD.x = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_LBD.y > 0.0)\n\
    {\n\
        B_out = 0.0;\n\
        currFlux_LBD.y = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_LBD.z > 0.0)\n\
    {\n\
        D_out = 0.0;\n\
        currFlux_LBD.z = 0.0;\n\
    }\n\
    \n\
\n\
    vec3 deltaP_RFU = vec3(R_out, F_out, U_out);\n\
    vec3 deltaP_LBD = vec3(L_out, B_out, D_out);\n\
\n\
    // At 101.325 kPa (abs) and 15 °C, air has a density of approximately 1.225 kg/m3\n\
\n\
    //vec3 airAccel_RFU = vec3(R_out / (airDensity * u_voxelSizeMeters.x), F_out / (airDensity * u_voxelSizeMeters.y), U_out / (airDensity * u_voxelSizeMeters.z)); // original.***\n\
    //vec3 airAccel_LBD = vec3(L_out / (airDensity * u_voxelSizeMeters.x), B_out / (airDensity * u_voxelSizeMeters.y), D_out / (airDensity * u_voxelSizeMeters.z)); // original.***\n\
\n\
    // calculate the new flux (m3/s).***\n\
    float timeStep = u_timestep;\n\
\n\
    //float pipeArea = 2.0 * u_voxelSizeMeters.x * u_voxelSizeMeters.y * u_voxelSizeMeters.z;\n\
    float pipeArea = u_voxelSizeMeters.x * u_voxelSizeMeters.y;\n\
    float cellVolume = u_voxelSizeMeters.x * u_voxelSizeMeters.y * u_voxelSizeMeters.z ;\n\
\n\
    // Now, calculate acceleration.***\n\
    // Example in \"x\" direction : \n\
    // m = ρ*V = ρ*dx*dy*dz\n\
    // m*a = -dp*dy*dz\n\
    // a = -(dp*dy*dz)/m = -(dp*dy*dz)/(ρ*dx*dy*dz) = -dp/(ρ*dx)\n\
    // -------------------------------------------------------------\n\
\n\
    // Calculate the air density.\n\
    float T = 288.15; // Kelvins.***\n\
    float P_Atm = airPressure_curr;\n\
    float curr_airMass_kg = getAirMass_kg(P_Atm, cellVolume, T);\n\
\n\
    float atmToPa = 101325.0;// 1 atm = 101325 Pa.***\n\
\n\
    float ro = curr_airMass_kg / cellVolume; // air density.***\n\
    vec3 airAccel_RFU = deltaP_RFU * atmToPa / (ro * u_voxelSizeMeters); // m/s2. \n\
    vec3 airAccel_LBD = deltaP_LBD * atmToPa / (ro * u_voxelSizeMeters); // m/s2.\n\
\n\
\n\
    ////vec3 airAccel_RFU = deltaP_RFU / (ro * u_voxelSizeMeters); // m/s2. \n\
    ////vec3 airAccel_LBD = deltaP_LBD / (ro * u_voxelSizeMeters); // m/s2.\n\
\n\
    vec3 newFlux_RFU = timeStep * pipeArea * airAccel_RFU; // m3/s\n\
    vec3 newFlux_LBD = timeStep * pipeArea * airAccel_LBD; // m3/s\n\
\n\
    // Now, calculate massFlux.***\n\
    //vec3 currMassFlux_RFU = currFlux_RFU * ro; // kg/s\n\
    //vec3 currMassFlux_LBD = currFlux_LBD * ro; // kg/s\n\
\n\
    // total outFlux.\n\
    float cushionFactor = 0.9999; // esmorteiment.\n\
    float output_R = max(0.0, currFlux_RFU.x + newFlux_RFU.x) * cushionFactor;\n\
    float output_F = max(0.0, currFlux_RFU.y + newFlux_RFU.y) * cushionFactor;\n\
    float output_U = max(0.0, currFlux_RFU.z + newFlux_RFU.z) * cushionFactor;\n\
\n\
    float output_L = max(0.0, currFlux_LBD.x + newFlux_LBD.x) * cushionFactor;\n\
    float output_B = max(0.0, currFlux_LBD.y + newFlux_LBD.y) * cushionFactor;\n\
    float output_D = max(0.0, currFlux_LBD.z + newFlux_LBD.z) * cushionFactor;\n\
\n\
    // calculate vOut & currVolum.\n\
    float vOut = timeStep * (output_R + output_F + output_U + output_L + output_B + output_D); \n\
    float massOut = vOut * ro;\n\
\n\
    float currAirVol = cellVolume; \n\
    float currMass = currAirVol * ro;\n\
\n\
    vec4 shaderLog = vec4(0.0);\n\
    if(vOut > currAirVol)\n\
    //if(massOut > currMass)\n\
    {\n\
        //rescale outflow readFlux so that outflow don't exceed current water volume\n\
        float factor = (currAirVol / vOut);\n\
        //float factor = (currMass / massOut);\n\
        output_R *= factor;\n\
        output_F *= factor;\n\
        output_U *= factor;\n\
\n\
        output_L *= factor;\n\
        output_B *= factor;\n\
        output_D *= factor;\n\
        shaderLog = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
\n\
    // Test debug:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::\n\
    if(output_R > u_maxFlux || output_F > u_maxFlux || output_U > u_maxFlux || output_L > u_maxFlux || output_B > u_maxFlux || output_D > u_maxFlux )\n\
    {\n\
        shaderLog = vec4(0.0, 0.0, 1.0, 1.0);\n\
    }\n\
    //shaderLog = vec4(1.0, 0.0, 0.0, 1.0);\n\
\n\
    //shaderLog = vec4(voxelSpaceValue*100.0, voxelSpaceValue*100.0, voxelSpaceValue*100.0, 1.0);\n\
\n\
    //shaderLog = vec4(normalize(newFlux_LBD), 1.0);\n\
\n\
    \n\
    \n\
    // End test debug.-------------------------------------------------------------------------------------------------------------------------------------------\n\
\n\
    vec3 outFlux_RFU = vec3(output_R, output_F, output_U) / u_maxFlux;\n\
    vec3 outFlux_LBD = vec3(output_L, output_B, output_D) / u_maxFlux;\n\
\n\
    vec3 encodedOutFlux_RFU_HIGH;\n\
    vec3 encodedOutFlux_RFU_LOW;\n\
    vec3 encodedOutFlux_LBD_HIGH;\n\
    vec3 encodedOutFlux_LBD_LOW;\n\
    encodeFlux(outFlux_RFU, encodedOutFlux_RFU_HIGH, encodedOutFlux_RFU_LOW);\n\
    encodeFlux(outFlux_LBD, encodedOutFlux_LBD_HIGH, encodedOutFlux_LBD_LOW);\n\
\n\
    // shaderLog:\n\
    //shaderLog = vec4((outFlux_RFU.x + outFlux_LBD.x)*2.0, (outFlux_RFU.y + outFlux_LBD.y)*2.0, (outFlux_RFU.z + outFlux_LBD.z)*2.0, 1.0);\n\
    float valueAux = newFlux_RFU.x;\n\
    if(valueAux < 0.5)\n\
    {\n\
        shaderLog = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
    else if(valueAux > 0.5 && valueAux < 1.0)\n\
    {\n\
        shaderLog = vec4(0.0, 1.0, 0.0, 1.0);\n\
    }\n\
    else if(valueAux > 1.0 && valueAux < 1.5)\n\
    {\n\
        shaderLog = vec4(0.0, 0.0, 1.0, 1.0);\n\
    }\n\
    else if(valueAux > 1.5)// && ro < 1.5)\n\
    {\n\
        shaderLog = vec4(1.0, 1.0, 0.0, 1.0);\n\
    }\n\
    else\n\
    {\n\
        shaderLog = vec4(1.0, 0.0, 1.0, 1.0);\n\
    }\n\
\n\
\n\
    gl_FragData[0] = vec4(encodedOutFlux_RFU_HIGH, voxelSpaceValue);  // RFU flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(encodedOutFlux_RFU_LOW, voxelSpaceValue); // RFU flux low.\n\
        gl_FragData[2] = vec4(encodedOutFlux_LBD_HIGH, voxelSpaceValue);  // LBD flux high.\n\
        gl_FragData[3] = vec4(encodedOutFlux_LBD_LOW, voxelSpaceValue);  // LBD flux low.\n\
        gl_FragData[4] = shaderLog;  // shader log.\n\
    #endif\n\
\n\
}";
ShaderSource.soundCalculatePressureFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D soundSourceTex_0;\n\
uniform sampler2D soundSourceTex_1;\n\
uniform sampler2D soundSourceTex_2;\n\
uniform sampler2D soundSourceTex_3;\n\
uniform sampler2D currAirPressureTex_0;\n\
uniform sampler2D currAirPressureTex_1;\n\
uniform sampler2D currAirPressureTex_2;\n\
uniform sampler2D currAirPressureTex_3;\n\
\n\
uniform float u_airMaxPressure;\n\
uniform float u_airEnvirontmentPressure;\n\
uniform float u_airPressureAlternative;\n\
uniform int u_processType; // 0= pressure from pressure soyrce. 1= setting air environtment pressure.***\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
vec4 packDepth( float v ) {\n\
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
    enc = fract(enc);\n\
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
    return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
vec4 getFinalAirPressureEncoded(vec4 encodedCurrAirPressure, vec4 encodedSoundSource)\n\
{\n\
    float decodedCurrAirPressure = unpackDepth(encodedCurrAirPressure) * u_airMaxPressure;\n\
    float decodedSourceAirPressure = unpackDepth(encodedSoundSource) * u_airMaxPressure;\n\
    float finalAirPressure = decodedSourceAirPressure; // init value.***\n\
    if(finalAirPressure < decodedCurrAirPressure)\n\
    {\n\
        finalAirPressure = decodedCurrAirPressure;\n\
    }\n\
    vec4 finalAirPressureEncoded = packDepth(finalAirPressure / u_airMaxPressure);\n\
\n\
    return finalAirPressureEncoded;\n\
}\n\
\n\
vec4 getFinalAirPressureEncoded_test(vec4 encodedCurrAirPressure, vec4 encodedSoundSource)\n\
{\n\
    float decodedCurrAirPressure = unpackDepth(encodedCurrAirPressure) * u_airMaxPressure;\n\
    float decodedSourceAirPressure = unpackDepth(encodedSoundSource) * u_airMaxPressure;\n\
    float finalAirPressure = decodedCurrAirPressure; // init value.***\n\
    if(decodedCurrAirPressure < u_airEnvirontmentPressure)\n\
    {\n\
        finalAirPressure = decodedSourceAirPressure;\n\
    }\n\
    vec4 finalAirPressureEncoded = packDepth(finalAirPressure / u_airMaxPressure);\n\
\n\
    return finalAirPressureEncoded;\n\
}\n\
\n\
void main()\n\
{\n\
    // 1rst, take the water source.\n\
    // u_processType == 0= pressure from pressure soyrce. \n\
    // u_processType == 1= setting air environtment pressure.***\n\
    if(u_processType == 0)\n\
    {\n\
        vec4 currAirPressure = texture2D(currAirPressureTex_0, v_tex_pos);\n\
        vec4 soundSource = texture2D(soundSourceTex_0, v_tex_pos);\n\
        gl_FragData[0] = getFinalAirPressureEncoded(currAirPressure, soundSource);\n\
\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
            currAirPressure = texture2D(currAirPressureTex_1, v_tex_pos);\n\
            soundSource = texture2D(soundSourceTex_1, v_tex_pos);\n\
            gl_FragData[1] = getFinalAirPressureEncoded(currAirPressure, soundSource);\n\
\n\
            currAirPressure = texture2D(currAirPressureTex_2, v_tex_pos);\n\
            soundSource = texture2D(soundSourceTex_2, v_tex_pos);\n\
            gl_FragData[2] = getFinalAirPressureEncoded(currAirPressure, soundSource);\n\
\n\
            currAirPressure = texture2D(currAirPressureTex_3, v_tex_pos);\n\
            soundSource = texture2D(soundSourceTex_3, v_tex_pos);\n\
            gl_FragData[3] = getFinalAirPressureEncoded(currAirPressure, soundSource);\n\
        #endif\n\
    }\n\
    if(u_processType == 1)\n\
    {\n\
        vec4 finalAirPressureEncoded = packDepth(u_airEnvirontmentPressure / u_airMaxPressure);\n\
        gl_FragData[0] = finalAirPressureEncoded;\n\
\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
            gl_FragData[1] = finalAirPressureEncoded;\n\
            gl_FragData[2] = finalAirPressureEncoded;\n\
            gl_FragData[3] = finalAirPressureEncoded;\n\
        #endif\n\
    }\n\
    if(u_processType == 2)\n\
    {\n\
        vec4 currAirPressure = texture2D(currAirPressureTex_0, v_tex_pos);\n\
        vec4 soundSource = texture2D(soundSourceTex_0, v_tex_pos);\n\
\n\
        float decodedCurrAirPressure = unpackDepth(currAirPressure) * u_airMaxPressure;\n\
        float finalAirPressure = decodedCurrAirPressure;\n\
        if(soundSource.r > 0.0 || soundSource.g > 0.0 || soundSource.b > 0.0 || soundSource.a > 0.0)\n\
        {\n\
            finalAirPressure = u_airPressureAlternative;\n\
        }\n\
\n\
        vec4 finalAirPressureEncoded = packDepth(finalAirPressure / u_airMaxPressure);\n\
        gl_FragData[0] = finalAirPressureEncoded;\n\
\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
            gl_FragData[1] = finalAirPressureEncoded;\n\
            gl_FragData[2] = finalAirPressureEncoded;\n\
            gl_FragData[3] = finalAirPressureEncoded;\n\
        #endif\n\
    }\n\
    \n\
}";
ShaderSource.soundCalculateVelocityFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D airPressureMosaicTex;\n\
uniform sampler2D flux_RFU_MosaicTex_HIGH; // Inside here, there are the voxelization of the scene (in alpha channel).***\n\
uniform sampler2D flux_RFU_MosaicTex_LOW;\n\
uniform sampler2D flux_LBD_MosaicTex_HIGH;\n\
uniform sampler2D flux_LBD_MosaicTex_LOW;\n\
uniform sampler2D auxMosaicTex; // here, contains :\n\
	// tex_0 = prev airPressureTex\n\
	// tex_1 = next airPressureTex\n\
	// tex_2 = prev flux_RFU_HIGH\n\
	// tex_3 = next flux_RFU_HIGH\n\
	// tex_4 = prev flux_RFU_LOW\n\
	// tex_5 = next flux_RFU_LOW\n\
	// tex_6 = prev flux_LBD_HIGH\n\
	// tex_7 = next flux_LBD_HIGH\n\
	// tex_8 = prev flux_LBD_LOW\n\
	// tex_9 = next flux_LBD_LOW\n\
\n\
	//  \n\
	//      +-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |     \n\
	//      |   tex_8   |   tex_9   |  nothing  |  nothing  |\n\
	//      |           |           |           |           | \n\
	//      +-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           | \n\
	//      |   tex_4   |   tex_5   |   tex_6   |   tex_7   |\n\
	//      |           |           |           |           |\n\
	//      +-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |    \n\
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   | \n\
	//      |           |           |           |           |\n\
	//      +-----------+-----------+-----------+-----------+\n\
uniform sampler2D maxPressureMosaicTex;\n\
\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
uniform int u_mosaicTexSize[3]; // The mosaic texture size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_lowestMosaicSliceIndex;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
uniform float u_timestep;\n\
\n\
//uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec3 u_voxelSizeMeters;\n\
uniform float u_airMaxPressure;\n\
uniform float u_airEnvirontmentPressure;\n\
uniform float u_maxFlux;\n\
uniform float u_maxVelocity;\n\
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////\n\
\n\
\n\
vec3 encodeVelocity(in vec3 vel)\n\
{\n\
	return vel*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeVelocity(in vec3 encodedVel)\n\
{\n\
	return vec3(encodedVel * 2.0 - 1.0);\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    float s = float(col) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row) * tRange + subTexCoord.y * tRange;\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
    return resultTexCoord;\n\
}\n\
\n\
vec2 getColRow_and_subTexCoord(in vec2 texCoord, inout vec2 subTexCoord)\n\
{\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    // Determine the [col, row] of the mosaic.***\n\
    vec2 resultColRow = vec2(floor(texCoord.x / sRange), floor(texCoord.y / tRange));\n\
\n\
    // determine the subTexCoord.***\n\
    float col_mod = texCoord.x - resultColRow.x * sRange;\n\
    float row_mod = texCoord.y - resultColRow.y * tRange;\n\
    float s = col_mod / sRange;\n\
    float t = row_mod / tRange;\n\
    subTexCoord = vec2(s, t);\n\
\n\
    return resultColRow;\n\
}\n\
\n\
float getAirPressure_inMosaicTexture(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(airPressureMosaicTex, texCoord);\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float airPressure = decoded * u_airMaxPressure;\n\
\n\
    return airPressure;\n\
}\n\
\n\
float getAirPressure_inMaxPressureMosaicTexture(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(maxPressureMosaicTex, texCoord);\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float airPressure = decoded * u_airMaxPressure;\n\
\n\
    return airPressure;\n\
}\n\
\n\
float getAirPressure_inAuxMosaicTexture(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(auxMosaicTex, texCoord);\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float airPressure = decoded * u_airMaxPressure;\n\
\n\
    return airPressure;\n\
}\n\
\n\
bool getPrevSubTextureColRow(in int col, in int row, inout int prev_col, inout int prev_row)\n\
{\n\
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    prev_row = row;\n\
    if(col == 0)\n\
    {\n\
        prev_col = u_mosaicSize[0] - 1;\n\
        prev_row = row - 1;\n\
\n\
        // now, check if the prev_row is inside of the boundary.***\n\
        if(prev_row < 0)\n\
        {\n\
            // we are outside of the tex3d boundary.***\n\
            return false;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        prev_col = col - 1;\n\
    }\n\
    return true;\n\
}\n\
\n\
bool getNextSubTextureColRow(in int col, in int row, inout int next_col, inout int next_row)\n\
{\n\
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    next_row = row;\n\
    if(col == u_mosaicSize[0] - 1) // is last column.***\n\
    {\n\
        next_col = 0;\n\
        next_row = row + 1;\n\
\n\
        // now, check if the next_row is inside of the boundary.***\n\
        if(next_row > u_mosaicSize[1] - 1) // is greater than last row.***\n\
        {\n\
            // we are outside of the tex3d boundary.***\n\
            return false;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        next_col = col + 1;\n\
    }\n\
\n\
    // Must check : some times, no all textures of the last row is used.***\n\
    int sliceIdx = next_row * u_mosaicSize[0] + next_col;\n\
    if(sliceIdx > u_texSize[2]-1)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    return true;\n\
}\n\
\n\
float getAirPressure(in vec2 texCoord, inout vec3 airPressure_RFU, inout vec3 airPressure_LBD, inout vec3 voxelSpaceType_RFU, inout vec3 voxelSpaceType_LBD)\n\
{\n\
    // **********************************************************************\n\
    // Note : this function returns the airPressure of all 6 Neighbor too.***\n\
    // **********************************************************************\n\
    vec2 subTexCoord;\n\
    vec2 colRow = getColRow_and_subTexCoord(texCoord, subTexCoord);\n\
\n\
    float col = colRow.x;\n\
    float row = colRow.y;\n\
    int col_int = int(col);\n\
    int row_int = int(row);\n\
\n\
    float divSubX = 1.0 / float(u_texSize[0]); // divX for subTexture.***\n\
    float divSubY = 1.0 / float(u_texSize[1]); // divX for subTexture.***\n\
\n\
    // airPressure_curr.*********************************************************************\n\
    float airPressure_curr = getAirPressure_inMosaicTexture(texCoord);\n\
\n\
    // airPressure_R.************************************************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_R = subTexCoord + vec2(divSubX, 0.0);\n\
    if(subTexCoord_R.x > 1.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        airPressure_RFU.x = u_airEnvirontmentPressure;\n\
\n\
        // the voxelSpaceType is 0 (void).***\n\
        voxelSpaceType_RFU.x = 0.0;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_R:\n\
        vec2 mosaicTexCoord_R = subTexCoord_to_texCoord(subTexCoord_R, col_int, row_int);\n\
        airPressure_RFU.x = getAirPressure_inMosaicTexture(mosaicTexCoord_R);\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_R);\n\
        voxelSpaceType_RFU.x = color4_RFU_HIGH.a;\n\
    }\n\
\n\
    // airPressure_F.************************************************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_F = subTexCoord + vec2(0.0, divSubY);\n\
    if(subTexCoord_F.y > 1.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        airPressure_RFU.y = u_airEnvirontmentPressure;\n\
\n\
        // the voxelSpaceType is 0 (void).***\n\
        voxelSpaceType_RFU.y = 0.0;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_F:\n\
        vec2 mosaicTexCoord_F = subTexCoord_to_texCoord(subTexCoord_F, col_int, row_int);\n\
        airPressure_RFU.y = getAirPressure_inMosaicTexture(mosaicTexCoord_F);\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_F);\n\
        voxelSpaceType_RFU.y = color4_RFU_HIGH.a;\n\
    }\n\
\n\
    // airPressure_U.************************************************************************\n\
    // To calculate the airPressure_U, must know the UP_subTexrure (NEXT subTexure).***\n\
    // But, if the current subTexture is in right_up_corner, then must use the \"auxMosaicTex\".***\n\
    // use the next subTexture.***\n\
    int next_col;\n\
    int next_row;\n\
    if(getNextSubTextureColRow(col_int, row_int, next_col, next_row))\n\
    {\n\
        // must recalcuate the mosaicTexCoord.***\n\
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, next_col, next_row);\n\
        airPressure_RFU.z = getAirPressure_inMosaicTexture(newMosaicTexCoord); \n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, newMosaicTexCoord);\n\
        voxelSpaceType_RFU.z = color4_RFU_HIGH.a;\n\
    }\n\
    else\n\
    {\n\
        // Is out of this slice.***\n\
        // Must use the \"auxMosaicTex\". This is a [4, 3] mosaic texture.***\n\
        // tex_1 = next airPressureTex. this in [col 1, row 0] into \"auxMosaicTex\".***\n\
        // Must calculate the texCoords of auxMosaicTex.***\n\
\n\
        float sRange_aux = 1.0 / 4.0;\n\
        float tRange_aux = 1.0 / 3.0;\n\
\n\
        float col_aux = 1.0;\n\
        float row_aux = 0.0;\n\
\n\
        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        vec2 texCoord_auxMosaicTex = vec2(s, t);\n\
        //airPressure_RFU.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);\n\
        airPressure_RFU.z = u_airEnvirontmentPressure; // test delete.***\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        //vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord_auxMosaicTex); // error! Cannot use \"texCoord_auxMosaicTex\" in \"flux_RFU_MosaicTex_HIGH\" texture!!!\n\
        //voxelSpaceType_RFU.z = color4_RFU_HIGH.a;\n\
        voxelSpaceType_RFU.z = 0.0;\n\
        \n\
    }\n\
    //--------------------------------------------------------------------------------------------------------------\n\
    //--------------------------------------------------------------------------------------------------------------\n\
\n\
    // airPressure_L.************************************************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_L = subTexCoord + vec2(-divSubX, 0.0);\n\
    if(subTexCoord_L.x < 0.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        airPressure_LBD.x = u_airEnvirontmentPressure;\n\
\n\
        // the voxelSpaceType is 0 (void).***\n\
        voxelSpaceType_LBD.x = 0.0;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_L:\n\
        vec2 mosaicTexCoord_L = subTexCoord_to_texCoord(subTexCoord_L, col_int, row_int);\n\
        airPressure_LBD.x = getAirPressure_inMosaicTexture(mosaicTexCoord_L);\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_L);\n\
        voxelSpaceType_LBD.x = color4_RFU_HIGH.a;\n\
    }\n\
\n\
    // airPressure_B.************************************************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_B = subTexCoord + vec2(0.0, -divSubY);\n\
    if(subTexCoord_B.y < 0.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        airPressure_LBD.y = u_airEnvirontmentPressure;\n\
\n\
        // the voxelSpaceType is 0 (void).***\n\
        voxelSpaceType_LBD.y = 0.0;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_B:\n\
        vec2 mosaicTexCoord_B = subTexCoord_to_texCoord(subTexCoord_B, col_int, row_int);\n\
        airPressure_LBD.y = getAirPressure_inMosaicTexture(mosaicTexCoord_B);\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_B);\n\
        voxelSpaceType_LBD.y = color4_RFU_HIGH.a;\n\
    }\n\
\n\
    // airPressure_D.************************************************************************\n\
    // To calculate the airPressure_D, must know the UP_subTexrure (PREV subTexure).***\n\
    // But, if the current subTexture is in left_down_corner, then must use the \"auxMosaicTex\".***\n\
    // use the next subTexture.***\n\
    int prev_col;\n\
    int prev_row;\n\
    if(getPrevSubTextureColRow(col_int, row_int, prev_col, prev_row))\n\
    {\n\
        // must recalcuate the mosaicTexCoord.***\n\
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, prev_col, prev_row);\n\
        airPressure_LBD.z = getAirPressure_inMosaicTexture(newMosaicTexCoord); \n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, newMosaicTexCoord);\n\
        voxelSpaceType_LBD.z = color4_RFU_HIGH.a;\n\
    }\n\
    else\n\
    {\n\
        // Is out of simulation boundary.***\n\
        // Must use the \"auxMosaicTex\". This is a [4, 3] mosaic texture.***\n\
        // tex_1 = next airPressureTex. this in [col 0, row 0] into \"auxMosaicTex\".***\n\
        // Must calculate the texCoords of auxMosaicTex.***\n\
\n\
        float sRange_aux = 1.0 / 4.0;\n\
        float tRange_aux = 1.0 / 3.0;\n\
\n\
        float col_aux = 0.0;\n\
        float row_aux = 0.0;\n\
\n\
        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        vec2 texCoord_auxMosaicTex = vec2(s, t);\n\
        //airPressure_LBD.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);\n\
        airPressure_LBD.z = u_airEnvirontmentPressure; // test delete.***\n\
\n\
        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***\n\
        //vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord_auxMosaicTex); // error! Cannot use \"texCoord_auxMosaicTex\" in \"flux_RFU_MosaicTex_HIGH\" texture!!!\n\
        //voxelSpaceType_LBD.z = color4_RFU_HIGH.a;\n\
        voxelSpaceType_LBD.z = 0.0;\n\
        \n\
    }\n\
    //--------------------------------------------------------------------------------------------------------------\n\
    //--------------------------------------------------------------------------------------------------------------\n\
\n\
    return airPressure_curr;\n\
}\n\
\n\
\n\
void encodeFlux(in vec3 flux, inout vec3 flux_HIGH, inout vec3 flux_LOW)\n\
{\n\
    vec2 encoded_a_flux = encodeRG(flux.x);\n\
    vec2 encoded_b_flux = encodeRG(flux.y);\n\
    vec2 encoded_c_flux = encodeRG(flux.z);\n\
\n\
    flux_HIGH = vec3(encoded_a_flux.x, encoded_b_flux.x, encoded_c_flux.x);\n\
    flux_LOW = vec3(encoded_a_flux.y, encoded_b_flux.y, encoded_c_flux.y);\n\
}\n\
\n\
void getFlux(in vec2 texCoord, inout vec3 flux_RFU, inout vec3 flux_LBD)\n\
{\n\
    // This function returns Outing flux.***\n\
    vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord);\n\
    vec4 color4_RFU_LOW = texture2D(flux_RFU_MosaicTex_LOW, texCoord);\n\
    vec4 color4_LBD_HIGH = texture2D(flux_LBD_MosaicTex_HIGH, texCoord);\n\
    vec4 color4_LBD_LOW = texture2D(flux_LBD_MosaicTex_LOW, texCoord);\n\
\n\
    // now, decode all fluxes.***\n\
    flux_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.\n\
    flux_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.\n\
    flux_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.\n\
\n\
    flux_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.\n\
    flux_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.\n\
    flux_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.\n\
}\n\
\n\
void getFlux_ofAll6Neighbor(in vec2 texCoord, inout vec3 flux_neighbor_R_RFU, inout vec3 flux_neighbor_R_LBD, \n\
                                                inout vec3 flux_neighbor_F_RFU, inout vec3 flux_neighbor_F_LBD, \n\
                                                inout vec3 flux_neighbor_U_RFU, inout vec3 flux_neighbor_U_LBD,\n\
\n\
                                                inout vec3 flux_neighbor_L_RFU, inout vec3 flux_neighbor_L_LBD, \n\
                                                inout vec3 flux_neighbor_B_RFU, inout vec3 flux_neighbor_B_LBD, \n\
                                                inout vec3 flux_neighbor_D_RFU, inout vec3 flux_neighbor_D_LBD)\n\
{\n\
    // this function returns the flux of all 6 neighbor pixels.****\n\
    vec2 subTexCoord;\n\
    vec2 colRow = getColRow_and_subTexCoord(texCoord, subTexCoord);\n\
\n\
    float col = colRow.x;\n\
    float row = colRow.y;\n\
    int col_int = int(col);\n\
    int row_int = int(row);\n\
\n\
    float divSubX = 1.0 / float(u_texSize[0]); // divX for subTexture.***\n\
    float divSubY = 1.0 / float(u_texSize[1]); // divX for subTexture.***\n\
    //----------------------------------------------------------------------------------\n\
\n\
    vec3 colorZero = vec3(0.0); // original.***\n\
\n\
    // flux_R. This is the flux of the right pixel.***********************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_R = subTexCoord + vec2(divSubX, 0.0);\n\
    if(subTexCoord_R.x > 1.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        flux_neighbor_R_RFU = colorZero;\n\
        flux_neighbor_R_LBD = colorZero;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_R:\n\
        vec2 mosaicTexCoord_R = subTexCoord_to_texCoord(subTexCoord_R, col_int, row_int);\n\
        getFlux(mosaicTexCoord_R, flux_neighbor_R_RFU, flux_neighbor_R_LBD);\n\
    }\n\
\n\
    // flux_F. This is the flux of the front pixel.************************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_F = subTexCoord + vec2(0.0, divSubY);\n\
    if(subTexCoord_F.y > 1.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        flux_neighbor_F_RFU = colorZero;\n\
        flux_neighbor_F_LBD = colorZero;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_F:\n\
        vec2 mosaicTexCoord_F = subTexCoord_to_texCoord(subTexCoord_F, col_int, row_int);\n\
        getFlux(mosaicTexCoord_F, flux_neighbor_F_RFU, flux_neighbor_F_LBD);\n\
    }\n\
\n\
    // flux_U. This is the flux of the up pixel.****************************************\n\
    // To calculate the flux_U, must know the UP_subTexrure (NEXT subTexure).***\n\
    // But, if the current subTexture is in right_up_corner, then must use the \"auxMosaicTex\".***\n\
    // use the next subTexture.***\n\
    int next_col;\n\
    int next_row;\n\
    if(getNextSubTextureColRow(col_int, row_int, next_col, next_row))\n\
    {\n\
        // must recalcuate the mosaicTexCoord.***\n\
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, next_col, next_row);\n\
        getFlux(newMosaicTexCoord, flux_neighbor_U_RFU, flux_neighbor_U_LBD);\n\
    }\n\
    else\n\
    {\n\
        	// tex_0 = prev airPressureTex\n\
            // tex_1 = next airPressureTex\n\
            // tex_2 = prev flux_RFU_HIGH\n\
            // tex_3 = next flux_RFU_HIGH\n\
            // tex_4 = prev flux_RFU_LOW\n\
            // tex_5 = next flux_RFU_LOW\n\
            // tex_6 = prev flux_LBD_HIGH\n\
            // tex_7 = next flux_LBD_HIGH\n\
            // tex_8 = prev flux_LBD_LOW\n\
            // tex_9 = next flux_LBD_LOW\n\
\n\
            //  \n\
            //      +-----------+-----------+-----------+-----------+\n\
            //      |           |           |           |           |     \n\
            //      |   tex_8   |   tex_9   |  nothing  |  nothing  |\n\
            //      |           |           |           |           | \n\
            //      +-----------+-----------+-----------+-----------+\n\
            //      |           |           |           |           | \n\
            //      |   tex_4   |   tex_5   |   tex_6   |   tex_7   |\n\
            //      |           |           |           |           |\n\
            //      +-----------+-----------+-----------+-----------+\n\
            //      |           |           |           |           |    \n\
            //      |   tex_0   |   tex_1   |   tex_2   |   tex_3   | \n\
            //      |           |           |           |           |\n\
            //      +-----------+-----------+-----------+-----------+\n\
\n\
        // Is out of simulation boundary.***\n\
        // Must use the \"auxMosaicTex\". This is a [4, 3] mosaic texture.***\n\
        // tex_3 = next flux_RFU_HIGH. this in [col 3, row 0] into \"auxMosaicTex\".***\n\
        // tex_5 = next flux_RFU_LOW. this in [col 1, row 1] into \"auxMosaicTex\".***\n\
        // tex_7 = next flux_LBD_HIGH. this in [col 3, row 1] into \"auxMosaicTex\".***\n\
        // tex_9 = next flux_LBD_LOW. this in [col 1, row 2] into \"auxMosaicTex\".***\n\
        // Must calculate the texCoords of auxMosaicTex.***\n\
\n\
        float sRange_aux = 1.0 / 4.0;\n\
        float tRange_aux = 1.0 / 3.0;\n\
\n\
        // tex_3 = next flux_RFU_HIGH.***\n\
        float col_aux = 3.0;\n\
        float row_aux = 0.0;\n\
\n\
        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        vec2 texCoord_auxMosaicTex = vec2(s, t);\n\
        vec4 color4_RFU_HIGH = texture2D(auxMosaicTex, texCoord_auxMosaicTex);\n\
\n\
        // tex_5 = next flux_RFU_LOW.***\n\
        col_aux = 1.0;\n\
        row_aux = 1.0;\n\
\n\
        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        texCoord_auxMosaicTex = vec2(s, t);\n\
        vec4 color4_RFU_LOW = texture2D(auxMosaicTex, texCoord_auxMosaicTex);\n\
        \n\
        // tex_7 = next flux_LBD_HIGH.***\n\
        col_aux = 3.0;\n\
        row_aux = 1.0;\n\
\n\
        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        texCoord_auxMosaicTex = vec2(s, t);\n\
        vec4 color4_LBD_HIGH = texture2D(auxMosaicTex, texCoord_auxMosaicTex);\n\
\n\
        // tex_9 = next flux_LBD_LOW.***\n\
        col_aux = 1.0;\n\
        row_aux = 2.0;\n\
\n\
        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        texCoord_auxMosaicTex = vec2(s, t);\n\
        vec4 color4_LBD_LOW = texture2D(auxMosaicTex, texCoord_auxMosaicTex);\n\
\n\
        // Now, with the 4 color4, decode the flux.***\n\
        flux_neighbor_U_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.\n\
        flux_neighbor_U_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.\n\
        flux_neighbor_U_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.\n\
\n\
        flux_neighbor_U_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.\n\
        flux_neighbor_U_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.\n\
        flux_neighbor_U_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.\n\
\n\
        ////flux_neighbor_U_RFU.r = 0.0; // flux_R.\n\
        ////flux_neighbor_U_RFU.g = 0.0; // flux_F.\n\
        ////flux_neighbor_U_RFU.b = 0.0; // flux_U.\n\
\n\
        ////flux_neighbor_U_LBD.r = 0.0; // flux_L.\n\
        ////flux_neighbor_U_LBD.g = 0.0; // flux_B.\n\
        ////flux_neighbor_U_LBD.b = 0.0; // flux_D.\n\
    }\n\
    //--------------------------------------------------------------------------------------------------------------\n\
    //--------------------------------------------------------------------------------------------------------------\n\
\n\
    // flux_L. This is the flux of the left pixel**********************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_L = subTexCoord + vec2(-divSubX, 0.0);\n\
    if(subTexCoord_L.x < 0.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        flux_neighbor_L_RFU = colorZero;\n\
        flux_neighbor_L_LBD = colorZero;\n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_L:\n\
        vec2 mosaicTexCoord_L = subTexCoord_to_texCoord(subTexCoord_L, col_int, row_int);\n\
        getFlux(mosaicTexCoord_L, flux_neighbor_L_RFU, flux_neighbor_L_LBD);\n\
    }\n\
\n\
    // flux_B. This is the flux of the back pixel.********************************\n\
    // calculate the subTexCoord to check boundary conditions.***\n\
    vec2 subTexCoord_B = subTexCoord + vec2(0.0, -divSubY);\n\
    if(subTexCoord_B.y < 0.0)\n\
    {\n\
        // is out of simulation boundary.***\n\
        flux_neighbor_B_RFU = colorZero;\n\
        flux_neighbor_B_LBD = colorZero;\n\
        \n\
    }\n\
    else\n\
    {\n\
        // calculate the mosaicTexCoord of the subTexCoord_B:\n\
        vec2 mosaicTexCoord_B = subTexCoord_to_texCoord(subTexCoord_B, col_int, row_int);\n\
        getFlux(mosaicTexCoord_B, flux_neighbor_B_RFU, flux_neighbor_B_LBD);\n\
    }\n\
\n\
    // flux_D. This is the flux of the down pixel.*************************************\n\
    // To calculate the flux_D, must know the UP_subTexrure (PREV subTexure).***\n\
    // But, if the current subTexture is in left_down_corner, then must use the \"auxMosaicTex\".***\n\
    // use the next subTexture.***\n\
    int prev_col;\n\
    int prev_row;\n\
    if(getPrevSubTextureColRow(col_int, row_int, prev_col, prev_row))\n\
    {\n\
        // must recalcuate the mosaicTexCoord.***\n\
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, prev_col, prev_row);\n\
        getFlux(newMosaicTexCoord, flux_neighbor_D_RFU, flux_neighbor_D_LBD);\n\
    }\n\
    else\n\
    {\n\
        // tex_0 = prev airPressureTex\n\
        // tex_1 = next airPressureTex\n\
        // tex_2 = prev flux_RFU_HIGH\n\
        // tex_3 = next flux_RFU_HIGH\n\
        // tex_4 = prev flux_RFU_LOW\n\
        // tex_5 = next flux_RFU_LOW\n\
        // tex_6 = prev flux_LBD_HIGH\n\
        // tex_7 = next flux_LBD_HIGH\n\
        // tex_8 = prev flux_LBD_LOW\n\
        // tex_9 = next flux_LBD_LOW\n\
\n\
        //  \n\
        //      +-----------+-----------+-----------+-----------+\n\
        //      |           |           |           |           |     \n\
        //      |   tex_8   |   tex_9   |  nothing  |  nothing  |\n\
        //      |           |           |           |           | \n\
        //      +-----------+-----------+-----------+-----------+\n\
        //      |           |           |           |           | \n\
        //      |   tex_4   |   tex_5   |   tex_6   |   tex_7   |\n\
        //      |           |           |           |           |\n\
        //      +-----------+-----------+-----------+-----------+\n\
        //      |           |           |           |           |    \n\
        //      |   tex_0   |   tex_1   |   tex_2   |   tex_3   | \n\
        //      |           |           |           |           |\n\
        //      +-----------+-----------+-----------+-----------+\n\
\n\
        // Is out of simulation boundary.***\n\
        // Must use the \"auxMosaicTex\". This is a [4, 3] mosaic texture.***\n\
        // tex_2 = prev flux_RFU_HIGH. this in [col 2, row 0] into \"auxMosaicTex\".***\n\
        // tex_4 = prev flux_RFU_LOW. this in [col 0, row 1] into \"auxMosaicTex\".***\n\
        // tex_6 = prev flux_LBD_HIGH. this in [col 2, row 1] into \"auxMosaicTex\".***\n\
        // tex_8 = prev flux_LBD_LOW. this in [col 0, row 2] into \"auxMosaicTex\".***\n\
        // Must calculate the texCoords of auxMosaicTex.***\n\
\n\
        float sRange_aux = 1.0 / 4.0;\n\
        float tRange_aux = 1.0 / 3.0;\n\
\n\
        // tex_2 = prev flux_RFU_HIGH.***\n\
        float col_aux = 2.0;\n\
        float row_aux = 0.0;\n\
\n\
        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        vec2 texCoord_auxMosaicTex = vec2(s, t);\n\
        vec4 color4_RFU_HIGH = texture2D(auxMosaicTex, texCoord_auxMosaicTex);\n\
\n\
        // tex_4 = prev flux_RFU_LOW.***\n\
        col_aux = 0.0;\n\
        row_aux = 1.0;\n\
\n\
        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        texCoord_auxMosaicTex = vec2(s, t);\n\
        vec4 color4_RFU_LOW = texture2D(auxMosaicTex, texCoord_auxMosaicTex);\n\
        \n\
        // tex_6 = prev flux_LBD_HIGH.***\n\
        col_aux = 2.0;\n\
        row_aux = 1.0;\n\
\n\
        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        texCoord_auxMosaicTex = vec2(s, t);\n\
        vec4 color4_LBD_HIGH = texture2D(auxMosaicTex, texCoord_auxMosaicTex);\n\
\n\
        // tex_8 = prev flux_LBD_LOW.***\n\
        col_aux = 0.0;\n\
        row_aux = 2.0;\n\
\n\
        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;\n\
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;\n\
\n\
        texCoord_auxMosaicTex = vec2(s, t);\n\
        vec4 color4_LBD_LOW = texture2D(auxMosaicTex, texCoord_auxMosaicTex);\n\
\n\
        // Now, with the 4 color4, decode the flux.***\n\
        flux_neighbor_D_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.\n\
        flux_neighbor_D_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.\n\
        flux_neighbor_D_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.\n\
\n\
        flux_neighbor_D_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.\n\
        flux_neighbor_D_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.\n\
        flux_neighbor_D_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.\n\
\n\
        ////flux_neighbor_D_RFU.r = 0.0; // flux_R.\n\
        ////flux_neighbor_D_RFU.g = 0.0; // flux_F.\n\
        ////flux_neighbor_D_RFU.b = 0.0; // flux_U.\n\
\n\
        ////flux_neighbor_D_LBD.r = 0.0; // flux_L.\n\
        ////flux_neighbor_D_LBD.g = 0.0; // flux_B.\n\
        ////flux_neighbor_D_LBD.b = 0.0; // flux_D.\n\
    }\n\
    //--------------------------------------------------------------------------------------------------------------\n\
    //--------------------------------------------------------------------------------------------------------------\n\
}\n\
\n\
void getInputFlux(in vec2 texCoord, inout vec3 input_flux_RFU, inout vec3 input_flux_LBD)\n\
{\n\
    // 1rst, must find all 6 neighbor fluxes.***\n\
    vec3 flux_neighbor_R_RFU, flux_neighbor_R_LBD;\n\
    vec3 flux_neighbor_F_RFU, flux_neighbor_F_LBD; \n\
    vec3 flux_neighbor_U_RFU, flux_neighbor_U_LBD;\n\
\n\
    vec3 flux_neighbor_L_RFU, flux_neighbor_L_LBD; \n\
    vec3 flux_neighbor_B_RFU, flux_neighbor_B_LBD; \n\
    vec3 flux_neighbor_D_RFU, flux_neighbor_D_LBD;\n\
\n\
    getFlux_ofAll6Neighbor(texCoord, flux_neighbor_R_RFU, flux_neighbor_R_LBD, \n\
                                    flux_neighbor_F_RFU, flux_neighbor_F_LBD, \n\
                                    flux_neighbor_U_RFU, flux_neighbor_U_LBD,\n\
\n\
                                    flux_neighbor_L_RFU, flux_neighbor_L_LBD, \n\
                                    flux_neighbor_B_RFU, flux_neighbor_B_LBD, \n\
                                    flux_neighbor_D_RFU, flux_neighbor_D_LBD);\n\
\n\
    // Now, for each flux, take only the flux that incomes to me.***\n\
    input_flux_LBD.x = flux_neighbor_L_RFU.x;\n\
    input_flux_LBD.y = flux_neighbor_B_RFU.y;\n\
    input_flux_LBD.z = flux_neighbor_D_RFU.z;\n\
\n\
    input_flux_RFU.x = flux_neighbor_R_LBD.x;\n\
    input_flux_RFU.y = flux_neighbor_F_LBD.y;\n\
    input_flux_RFU.z = flux_neighbor_U_LBD.z;\n\
\n\
}\n\
\n\
float getVoxelSpaceValue(in vec2 texCoord)\n\
{\n\
    // The scene voxelMatrix is into flux_RFU_MosaicTex_HIGH, in alpha channel.***\n\
    vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord);\n\
    return color4_RFU_HIGH.a;\n\
}\n\
\n\
float getAirMass_kg(in float P_Atm, in float V_m3, in float T_Kelvin)\n\
{\n\
    // Remembering.*************************************************************************************************************************\n\
    // \"ecuacion propagacion sonido\" => https://openstax.org/books/f%C3%ADsica-universitaria-volumen-1/pages/17-2-velocidad-del-sonido\n\
    // https://en.wikipedia.org/wiki/Density_of_air#:~:text=At%20101.325%20kPa%20(abs)%20and,International%20Standard%20Atmosphere%20(ISA).\n\
    // P1 * V1 = P2 * V2.***\n\
    // airDensity ro = ρ = 1.225 [kg/m3]\n\
    // airMolarMass = 0.02897 [Kg/mol]\n\
    // universalGasConstant R = 8.31446261815324 [J/(K*mol)], [m3*Pa/(K*mol)], [Kg*m2/(s2*K*mol)]\n\
    // airPressure at sea level = 101325 Pa = 101.325 kPa = 1013.25 hPa ≈ 1 bar\n\
    // Standard temperature at sea level is T = 288.15K\n\
    // Number of Avogadro n = 6.022 * 10E23\n\
    // Masa molar air = 29kg/kmol\n\
    // -------------------------------------------------------------------------------------------------------------------------------------\n\
\n\
    // P = pressure(Atm), V = volume (m3), T = temperature (K).***\n\
    float atmToPa = 101325.0;// 1 atm = 101325 Pa.***\n\
    float P_Pa = P_Atm * atmToPa; \n\
    float R = 8.31446261815324;\n\
    float n = P_Pa * V_m3 / (R * T_Kelvin); // number of air mols.***\n\
    float molarMassAir = 29.0; // kg/kmol.\n\
    float airMass = n/1000.0 * molarMassAir; // kg.***\n\
    return airMass;\n\
}\n\
\n\
//float getAirPressure_Atm(in float airDensity_kgm3, in float V_m3, in float T_Kelvin)\n\
//{\n\
\n\
//}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
\n\
    // check if this is solid voxel.***\n\
    float voxelSpaceValue = getVoxelSpaceValue(v_tex_pos);\n\
    if(voxelSpaceValue > 0.0)\n\
    {\n\
        // This is solid voxel.***\n\
        gl_FragData[0] = vec4(0.0);  // air pressure. Original.***\n\
\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
            gl_FragData[1] = vec4(0.0); // velocity\n\
            gl_FragData[2] = vec4(0.0);  // shader log.\n\
        #endif\n\
        return;\n\
    }\n\
\n\
    // Determine the airPressure of the 6 fragment that is around of current fragment.***\n\
    vec3 voxelSpaceType_RFU;\n\
    vec3 voxelSpaceType_LBD;\n\
    vec3 airPressure_RFU;\n\
    vec3 airPressure_LBD;\n\
    float airPressure_curr = getAirPressure(v_tex_pos, airPressure_RFU, airPressure_LBD, voxelSpaceType_RFU, voxelSpaceType_LBD);\n\
\n\
    vec3 currFlux_RFU;\n\
    vec3 currFlux_LBD;\n\
    getFlux(v_tex_pos, currFlux_RFU, currFlux_LBD); // this is output flux.***\n\
\n\
    // calculate the input flux.***\n\
    vec3 input_flux_RFU, input_flux_LBD;\n\
    getInputFlux(v_tex_pos, input_flux_RFU, input_flux_LBD);\n\
\n\
    if(voxelSpaceType_RFU.x > 0.0)\n\
    {\n\
        input_flux_RFU.x = 0.0;\n\
        currFlux_RFU.x = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_RFU.y > 0.0)\n\
    {\n\
        input_flux_RFU.y = 0.0;\n\
        currFlux_RFU.y = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_RFU.z > 0.0)\n\
    {\n\
        input_flux_RFU.z = 0.0;\n\
        currFlux_RFU.z = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_LBD.x > 0.0)\n\
    {\n\
        input_flux_LBD.x = 0.0;\n\
        currFlux_LBD.x = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_LBD.y > 0.0)\n\
    {\n\
        input_flux_LBD.y = 0.0;\n\
        currFlux_LBD.y = 0.0;\n\
    }\n\
\n\
    if(voxelSpaceType_LBD.z > 0.0)\n\
    {\n\
        input_flux_LBD.z = 0.0;\n\
        currFlux_LBD.z = 0.0;\n\
    }\n\
\n\
    // Now, calculate the input pressure.***\n\
    float voxelFaceArea = u_voxelSizeMeters.x * u_voxelSizeMeters.y;\n\
    float cellVolume = u_voxelSizeMeters.x * u_voxelSizeMeters.y * u_voxelSizeMeters.z ;\n\
    float timeStep_divCellArea = u_timestep / voxelFaceArea;\n\
\n\
    // calculate the curr density & RFULBD densities, then calculate the delta_air_kg & then can calculate the new air pressure.***\n\
    float T = 288.15; // Kelvins.***\n\
    float P_Atm = airPressure_curr;\n\
    float curr_airMass_kg = getAirMass_kg(P_Atm, cellVolume, T);\n\
    float curr_ro = curr_airMass_kg / cellVolume;\n\
\n\
    float P_Atm_R = airPressure_RFU.x;\n\
    float airMass_kg_R = getAirMass_kg(P_Atm_R, cellVolume, T);\n\
    float ro_R = airMass_kg_R / cellVolume;\n\
\n\
    float P_Atm_F = airPressure_RFU.y;\n\
    float airMass_kg_F = getAirMass_kg(P_Atm_F, cellVolume, T);\n\
    float ro_F = airMass_kg_F / cellVolume;\n\
\n\
    float P_Atm_U = airPressure_RFU.z;\n\
    float airMass_kg_U = getAirMass_kg(P_Atm_U, cellVolume, T);\n\
    float ro_U = airMass_kg_U / cellVolume;\n\
\n\
    float P_Atm_L = airPressure_LBD.x;\n\
    float airMass_kg_L = getAirMass_kg(P_Atm_L, cellVolume, T);\n\
    float ro_L = airMass_kg_L / cellVolume;\n\
\n\
    float P_Atm_B = airPressure_LBD.y;\n\
    float airMass_kg_B = getAirMass_kg(P_Atm_B, cellVolume, T);\n\
    float ro_B = airMass_kg_B / cellVolume;\n\
\n\
    float P_Atm_D = airPressure_LBD.z;\n\
    float airMass_kg_D = getAirMass_kg(P_Atm_D, cellVolume, T);\n\
    float ro_D = airMass_kg_D / cellVolume;\n\
\n\
    ////vec3 input_air_RFU = input_flux_RFU * timeStep_divCellArea;\n\
    ////vec3 input_air_LBD = input_flux_LBD * timeStep_divCellArea;\n\
    ////vec3 output_air_RFU = currFlux_RFU * timeStep_divCellArea;\n\
    ////vec3 output_air_LBD = currFlux_LBD * timeStep_divCellArea;\n\
\n\
    vec3 input_air_RFU = input_flux_RFU * u_timestep; // [m3]\n\
    vec3 input_air_LBD = input_flux_LBD * u_timestep; // [m3]\n\
    vec3 output_air_RFU = currFlux_RFU * u_timestep; // [m3]\n\
    vec3 output_air_LBD = currFlux_LBD * u_timestep; // [m3]\n\
    \n\
\n\
    // calculate inputTotal & outputTotal [m3].***\n\
    float outputTotal_air = (output_air_RFU.x + output_air_RFU.y + output_air_RFU.z + output_air_LBD.x + output_air_LBD.y + output_air_LBD.z) * curr_ro;\n\
    float inputTotal_air = input_air_RFU.x * ro_R + input_air_RFU.y * ro_F + input_air_RFU.z * ro_U + input_air_LBD.x * ro_L + input_air_LBD.y * ro_B + input_air_LBD.z * ro_D;\n\
\n\
    // calculate delta_air.***\n\
    float delta_air = inputTotal_air - outputTotal_air; // [kg]\n\
\n\
    // Now, add delta_air to current air_mass.***\n\
    float total_air_mass = curr_airMass_kg + delta_air;\n\
\n\
    // Now, calculate the number of Avogadro.***\n\
    // Masa molar air = 29kg/kmol\n\
    float air_molar_mass = 29.0; // kg/kmol\n\
    float n = total_air_mass / air_molar_mass; // kmol.\n\
    float R = 8.31446261815324;\n\
    float newPressure_Pa = n * 1000.0 * R * T / cellVolume; // Pa.\n\
    float atmToPa = 101325.0;// 1 atm = 101325 Pa.***\n\
    float newPressure_Atm = newPressure_Pa / atmToPa;\n\
\n\
    // calculate velocity.*****************************************************************************************************************************\n\
    // velocity = sqrt(dp/dρ).\n\
    \n\
    float d1 = airPressure_curr;\n\
    //float d2 = d1 + delta_air;\n\
    float d2 = newPressure_Atm;\n\
    float da = (d1 + d2)/2.0;\n\
\n\
    vec4 shaderLog = vec4(0.0);\n\
\n\
    float vel_x = currFlux_RFU.x - currFlux_LBD.x + input_flux_LBD.x - input_flux_RFU.x;\n\
    float vel_y = currFlux_RFU.y - currFlux_LBD.y + input_flux_LBD.y - input_flux_RFU.y;\n\
    float vel_z = currFlux_RFU.z - currFlux_LBD.z + input_flux_LBD.z - input_flux_RFU.z;\n\
\n\
    //vec3 velocity = vec3(vel_x, vel_y, vel_z)/2.0;\n\
    vec3 velocity = vec3(vel_x, vel_y, vel_z);\n\
\n\
    if(da <= 1e-8) //\n\
    {\n\
        velocity = vec3(0.0);\n\
    }\n\
    else\n\
    {\n\
        ////veloci = veloci/(da * u_PipeLen);\n\
        ////veloci = veloci/(da * vec2(cellSize_y, cellSize_x)); // original.***\n\
        velocity = velocity / (da * u_voxelSizeMeters);\n\
        \n\
    }\n\
    // End calculating velocity.-------------------------------------------------------------------------------------------------------------------------\n\
    //float unitaryDeltaAir  = delta_air / u_airMaxPressure * 1000.0;\n\
    //shaderLog = vec4(unitaryDeltaAir, unitaryDeltaAir, unitaryDeltaAir, 1.0);\n\
\n\
    vec3 encodedVelocity = encodeVelocity(velocity/u_maxVelocity);\n\
    vec4 writeVel = vec4(encodedVelocity, 1.0);\n\
\n\
    //float airPressure = max(airPressure_curr + delta_air, 0.0); // old.***\n\
    float airPressure = max(newPressure_Atm, 0.0);\n\
    vec4 encodedAirPressure = packDepth(airPressure / u_airMaxPressure);\n\
\n\
    gl_FragData[0] = encodedAirPressure;  // air pressure. Original.***\n\
\n\
    // Now, register the max pressure.***\n\
    float currMaxPressure = getAirPressure_inMaxPressureMosaicTexture(v_tex_pos);\n\
    float maxPressure = currMaxPressure;\n\
    if(airPressure > currMaxPressure)\n\
    {\n\
        maxPressure = airPressure;\n\
    }\n\
    vec4 encodedMaxAirPressure = packDepth(maxPressure / u_airMaxPressure);\n\
\n\
    // shaderLog.***\n\
    if(velocity.x > u_maxVelocity || velocity.y > u_maxVelocity || velocity.z > u_maxVelocity)\n\
    {\n\
        shaderLog = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
    else{\n\
        shaderLog = vec4(0.0, 1.0, 0.0, 1.0);\n\
    }\n\
\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = writeVel; // velocity\n\
        gl_FragData[2] = encodedMaxAirPressure;  // max pressure record.\n\
        gl_FragData[3] = shaderLog;  // shader log.\n\
    #endif\n\
\n\
    \n\
\n\
}";
ShaderSource.soundCopyFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texToCopy;\n\
uniform bool u_textureFlipYAxis;\n\
varying vec2 vTexCoord;\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(vTexCoord.x, 1.0 - vTexCoord.y));\n\
    }\n\
    else\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(vTexCoord.x, vTexCoord.y));\n\
    }\n\
    \n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = finalCol4; // depth\n\
        gl_FragData[2] = finalCol4; // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = finalCol4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.soundCopyPartiallyFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texToCopy_0;\n\
uniform sampler2D texToCopy_1;\n\
uniform sampler2D texToCopy_2;\n\
uniform sampler2D texToCopy_3;\n\
uniform sampler2D texToCopy_4;\n\
uniform sampler2D texToCopy_5;\n\
uniform sampler2D texToCopy_6;\n\
uniform sampler2D texToCopy_7;\n\
\n\
uniform bool u_textureFlipYAxis;\n\
varying vec2 vTexCoord;\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4;\n\
    vec2 finalTexCoord = vTexCoord;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        finalTexCoord = vec2(vTexCoord.x, 1.0 - vTexCoord.y);\n\
    }\n\
\n\
    finalCol4 = texture2D(texToCopy_0, finalTexCoord);\n\
    gl_FragData[0] = finalCol4;  \n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        finalCol4 = texture2D(texToCopy_1, finalTexCoord);\n\
        gl_FragData[1] = finalCol4; \n\
\n\
        finalCol4 = texture2D(texToCopy_2, finalTexCoord);\n\
        gl_FragData[2] = finalCol4; \n\
\n\
        finalCol4 = texture2D(texToCopy_3, finalTexCoord);\n\
        gl_FragData[3] = finalCol4; \n\
\n\
        finalCol4 = texture2D(texToCopy_4, finalTexCoord);\n\
        gl_FragData[4] = finalCol4; \n\
\n\
        finalCol4 = texture2D(texToCopy_5, finalTexCoord);\n\
        gl_FragData[5] = finalCol4; \n\
\n\
        finalCol4 = texture2D(texToCopy_6, finalTexCoord);\n\
        gl_FragData[6] = finalCol4; \n\
\n\
        finalCol4 = texture2D(texToCopy_7, finalTexCoord);\n\
        gl_FragData[7] = finalCol4; \n\
\n\
    #endif\n\
\n\
}";
ShaderSource.SoundSurfaceFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D texture_0; \n\
uniform sampler2D texture_1;\n\
\n\
uniform bool textureFlipYAxis;\n\
\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
//uniform float screenWidth;    \n\
//uniform float screenHeight;     \n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform float externalAlpha; // used by effects.\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
uniform int uFrustumIdx;\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
uniform float uInterpolationFactor;\n\
uniform float uMinMaxValue[2];\n\
\n\
// Legend colors.***\n\
uniform vec4 uLegendColors[16];\n\
uniform float uLegendValues[16];\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
\n\
varying float vDepth;\n\
varying float vSoundValue;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec4 packDepth( float v ) {\n\
	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	enc = fract(enc);\n\
	enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
	return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depthAux = dot(rgba_depth, bit_shift);\n\
    return depthAux;\n\
}  \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
/*\n\
// unpack depth used for shadow on screen.***\n\
float unpackDepth_A(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
*/\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );\n\
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);\n\
}             \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
\n\
\n\
vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)\n\
{\n\
    \n\
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
\n\
    float value = gray * 4.0;\n\
    float h = floor(value);\n\
    float f = fract(value);\n\
\n\
    vec4 resultColor = vec4(0.0, 0.0, 0.0, gray);\n\
\n\
    if(hotToCold)\n\
    {\n\
        // HOT to COLD.***\n\
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix red & yellow.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(red, yellow, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix yellow & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, green, f);\n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & cyan.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(green, cyan, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix cyan & blue.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, blue, f);\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // COLD to HOT.***\n\
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix blue & cyan.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(blue, cyan, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix cyan & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, green, f);  \n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & yellow.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(green, yellow, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix yellow & red.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, red, f);\n\
        }\n\
    }\n\
\n\
    return resultColor;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
	//bool testBool = false;\n\
	//float occlusion = 1.0; // ambient occlusion.***\n\
	//vec3 normal2 = vNormal;	\n\
	//float scalarProd = 1.0;\n\
	\n\
	//vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
	//float linearDepth = getDepth(screenPos);   \n\
	//vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	//occlusion = 1.0;\n\
	vec4 textureColor;\n\
	vec4 textureColor_0;\n\
	vec4 textureColor_1;\n\
\n\
    if(colorType == 2)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor_0 = texture2D(texture_0, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
			textureColor_1 = texture2D(texture_1, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor_0 = texture2D(texture_0, vec2(vTexCoord.s, vTexCoord.t));\n\
			textureColor_1 = texture2D(texture_1, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
\n\
		textureColor = mix(textureColor_0, textureColor_1, uInterpolationFactor);\n\
    }\n\
    else if(colorType == 0)\n\
	{\n\
        textureColor = oneColor4;\n\
    }\n\
	else if(colorType == 1)\n\
	{\n\
        textureColor = vColor4;\n\
    }\n\
	else if(colorType == 3)\n\
	{\n\
		bool hotToCold = false;\n\
		float height = vSoundValue;\n\
\n\
        textureColor = getRainbowColor_byHeight(height, uMinMaxValue[0], uMinMaxValue[1], hotToCold);\n\
\n\
		textureColor = vec4(textureColor.a, textureColor.a, textureColor.a, textureColor.a);\n\
    }\n\
	else if(colorType == 4)\n\
	{\n\
		float height = vSoundValue;\n\
		float q = (height - uMinMaxValue[0]) / (uMinMaxValue[1] - uMinMaxValue[0]);\n\
\n\
		textureColor = vec4(q,q*0.25,q*0.5,q);\n\
    }\n\
	else if(colorType == 5)\n\
	{\n\
		// use an external legend.***\n\
		vec4 colorAux = vec4(0.3, 0.3, 0.3, 0.4);\n\
\n\
		// find legendIdx.***\n\
		for(int i=0; i<15; i++)\n\
		{\n\
			if(vSoundValue > uLegendValues[i] && vSoundValue <= uLegendValues[i + 1])\n\
			{\n\
				colorAux = uLegendColors[i];\n\
				break;\n\
			}\n\
		}\n\
\n\
        if(colorAux.a == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
\n\
		textureColor = colorAux;\n\
    }\n\
	\n\
    vec4 finalColor;\n\
	finalColor = textureColor;\n\
\n\
	vec4 albedo4 = finalColor;\n\
\n\
	\n\
    gl_FragData[0] = finalColor; \n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	{\n\
		// save depth, normal, albedo.\n\
		float depthAux = vDepth;\n\
		gl_FragData[1] = packDepth(depthAux); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.SoundSurfaceVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	attribute float value;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying vec3 vertexPosLC;\n\
	varying vec4 vColor4; // color from attributes\n\
	varying vec3 vLightDir; \n\
	varying vec3 vNormalWC; \n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	varying float vDepth;\n\
	varying float vSoundValue;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
		currentTMat = mat3(buildingRotMatrix);\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		\n\
		\n\
		uAmbientColor = vec3(1.0);\n\
		vNormalWC = rotatedNormal;\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
		vLightDir = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		float directionalLightWeighting = 1.0;\n\
\n\
\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
		\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		vDepth = -orthoPos.z/far;\n\
\n\
		vSoundValue = value;\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
\n\
		gl_PointSize = 5.0;\n\
	}";
ShaderSource.soundVolumetricFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    //precision lowp float;\n\
    //precision lowp int;\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
// https://draemm.li/various/volumeRendering/webgl2/\n\
\n\
    //*********************************************************\n\
    // R= right, F= front, U= up, L= left, B= back, D= down.\n\
    // RFU = x, y, z.\n\
    // LBD = -x, -y, -z.\n\
    //*********************************************************\n\
\n\
    //      +-----------------+\n\
	//      |                 |          \n\
	//      |   screen size   |  \n\
	//      |                 | \n\
	//      +-----------------+\n\
	//      +-----------------+----------------+\n\
	//      |                 |                | \n\
	//      |   front depth   |   rear depth   |\n\
	//      |                 |                |\n\
	//      +-----------------+----------------+\n\
	\n\
uniform sampler2D simulationBoxDoubleDepthTex;\n\
uniform sampler2D simulationBoxDoubleNormalTex; // used to calculate the current frustum idx.***\n\
uniform sampler2D airPressureMosaicTex;\n\
uniform sampler2D sceneDepthTex; // scene depth texture.***\n\
uniform sampler2D sceneNormalTex; // scene depth texture.***\n\
uniform sampler2D airVelocityTex; \n\
uniform sampler2D maxPressureMosaicTex;\n\
\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform vec3 u_voxelSizeMeters;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float u_airMaxPressure;\n\
uniform float u_airEnvirontmentPressure;\n\
uniform float u_maxVelocity;\n\
uniform vec2 u_screenSize;\n\
uniform vec2 uNearFarArray[4];\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
\n\
uniform mat4 u_simulBoxTMat;\n\
uniform mat4 u_simulBoxTMatInv;\n\
uniform vec3 u_simulBoxPosHigh;\n\
uniform vec3 u_simulBoxPosLow;\n\
uniform vec3 u_simulBoxMinPosLC;\n\
uniform vec3 u_simulBoxMaxPosLC;\n\
\n\
uniform int u_renderType; // 0 = volumetric (generic), 1 = isosurface.\n\
\n\
\n\
\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
	//	// flogz = 1.0 + gl_Position.z*0.0001;\n\
    //    float Fcoef_half = uFCoef_logDepth/2.0;\n\
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
	//	float z = (flogzAux - 1.0);\n\
	//	linearDepth = z/(far);\n\
	//	return linearDepth;\n\
	//}\n\
	//else{\n\
		return unpackDepth(texture2D(sceneDepthTex, coord.xy));\n\
	//}\n\
}\n\
\n\
float getDepth_simulationBox(vec2 coord)\n\
{\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
	//	// flogz = 1.0 + gl_Position.z*0.0001;\n\
    //    float Fcoef_half = uFCoef_logDepth/2.0;\n\
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
	//	float z = (flogzAux - 1.0);\n\
	//	linearDepth = z/(far);\n\
	//	return linearDepth;\n\
	//}\n\
	//else{\n\
		return unpackDepth(texture2D(simulationBoxDoubleDepthTex, coord.xy));\n\
	//}\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(sceneNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
vec3 encodeVelocity(in vec3 vel)\n\
{\n\
	return vel*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeVelocity(in vec3 encodedVel)\n\
{\n\
	return vec3(encodedVel * 2.0 - 1.0);\n\
}\n\
\n\
vec3 getVelocity(in vec2 texCoord)\n\
{\n\
    vec4 encodedVel = texture2D(airVelocityTex, texCoord);\n\
    return decodeVelocity(encodedVel.xyz)*u_maxVelocity;\n\
}\n\
\n\
vec4 getNormal_simulationBox(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
void get_FrontAndRear_depthTexCoords(in vec2 texCoord, inout vec2 frontTexCoord, inout vec2 rearTexCoord)\n\
{\n\
    //      +-----------------+\n\
	//      |                 |          \n\
	//      |   screen size   |  \n\
	//      |                 | \n\
	//      +-----------------+\n\
	//      +-----------------+----------------+\n\
	//      |                 |                | \n\
	//      |   front depth   |   rear depth   |\n\
	//      |                 |                |\n\
	//      +-----------------+----------------+\n\
    vec2 normalTexSize = vec2(u_screenSize.x * 2.0, u_screenSize.y); // the normal tex width is double of the screen size width.***\n\
    //vec2 frontNormalFragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);\n\
    //vec2 rearNormalFragCoord = vec2(gl_FragCoord.x + u_screenSize.x, gl_FragCoord.y);\n\
    float windows_x = texCoord.x * u_screenSize.x;\n\
    float windows_y = texCoord.y * u_screenSize.y;\n\
    vec2 frontNormalFragCoord = vec2(windows_x, windows_y);\n\
    vec2 rearNormalFragCoord = vec2(windows_x + u_screenSize.x, windows_y);\n\
\n\
    frontTexCoord = vec2(frontNormalFragCoord.x / normalTexSize.x, frontNormalFragCoord.y / normalTexSize.y);\n\
    rearTexCoord = vec2(rearNormalFragCoord.x / normalTexSize.x, rearNormalFragCoord.y / normalTexSize.y);\n\
}\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
void get_FrontAndRear_posCC(in vec2 screenPos, in float currFar_rear, in float currFar_front, inout vec3 frontPosCC, inout vec3 rearPosCC)\n\
{\n\
    vec2 frontTexCoord;\n\
    vec2 rearTexCoord;\n\
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);\n\
\n\
    // If the linear depth is 1, then, take the camPos as the position, so, pos = (0.0, 0.0, 0.0).***\n\
    //vec4 depthColor4 = texture2D(simulationBoxDoubleDepthTex, screenPos);\n\
    //float depthColLength = length(depthColor4);\n\
\n\
    // Front posCC.***\n\
    float frontLinearDepth = getDepth_simulationBox(frontTexCoord);\n\
    if(frontLinearDepth < 1e-8)\n\
    {\n\
        frontPosCC = vec3(0.0);\n\
    }\n\
    else\n\
    {\n\
        float front_zDist = frontLinearDepth * currFar_front; \n\
        frontPosCC = getViewRay(screenPos, front_zDist);\n\
    }\n\
    \n\
\n\
    // Rear posCC.***\n\
    float rearLinearDepth = getDepth_simulationBox(rearTexCoord);\n\
    if(rearLinearDepth < 1e-8)\n\
    {\n\
        rearPosCC = vec3(0.0);\n\
    }\n\
    else\n\
    {\n\
        float rear_zDist = rearLinearDepth * currFar_rear; \n\
        rearPosCC = getViewRay(screenPos, rear_zDist);\n\
    }\n\
    \n\
\n\
}\n\
\n\
void posWCRelToEye_to_posLC(in vec4 posWC_relToEye, in mat4 local_mat4Inv, in vec3 localPosHIGH, in vec3 localPosLOW, inout vec3 posLC)\n\
{\n\
    vec3 highDifferenceSun = -localPosHIGH.xyz + encodedCameraPositionMCHigh;\n\
	vec3 lowDifferenceSun = posWC_relToEye.xyz -localPosLOW.xyz + encodedCameraPositionMCLow;\n\
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
	vec4 vPosRelToLight = local_mat4Inv * pos4Sun;\n\
\n\
	posLC = vPosRelToLight.xyz / vPosRelToLight.w;\n\
}\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    float s = float(col) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row) * tRange + subTexCoord.y * tRange;\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
    return resultTexCoord;\n\
}\n\
\n\
float getAirPressure_inMosaicTexture(in vec2 texCoord, in int pressureType)\n\
{\n\
    vec4 color4;\n\
    if(pressureType == 0)\n\
    {\n\
        color4 = texture2D(airPressureMosaicTex, texCoord);\n\
    }\n\
    else if(pressureType == 1)\n\
    {\n\
        color4 = texture2D(maxPressureMosaicTex, texCoord);\n\
    } \n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float airPressure = decoded * u_airMaxPressure;\n\
\n\
    return airPressure;\n\
}\n\
\n\
float _getAirPressure_triLinearInterpolation(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic, in int pressureType)\n\
{\n\
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), \n\
    // and the col & row into the mosaic texture, returns a trilinear interpolation of the pressure.***\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec2 px = 1.0 / sim_res3d.xy;\n\
    vec2 vc = (floor(subTexCoord2d * sim_res3d.xy)) * px;\n\
    vec2 f = fract(subTexCoord2d * sim_res3d.xy);\n\
    vec2 texCoord_tl = vec2(vc);\n\
    vec2 texCoord_tr = vec2(vc + vec2(px.x, 0));\n\
    vec2 texCoord_bl = vec2(vc + vec2(0, px.y));\n\
    vec2 texCoord_br = vec2(vc + px);\n\
    vec2 mosaicTexCoord_tl = subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_tr = subTexCoord_to_texCoord(texCoord_tr, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_bl = subTexCoord_to_texCoord(texCoord_bl, col_mosaic, row_mosaic);\n\
    vec2 mosaicTexCoord_br = subTexCoord_to_texCoord(texCoord_br, col_mosaic, row_mosaic);\n\
\n\
    float ap_tl = getAirPressure_inMosaicTexture(mosaicTexCoord_tl, pressureType);\n\
    float ap_tr = getAirPressure_inMosaicTexture(mosaicTexCoord_tr, pressureType);\n\
    float ap_bl = getAirPressure_inMosaicTexture(mosaicTexCoord_bl, pressureType);\n\
    float ap_br = getAirPressure_inMosaicTexture(mosaicTexCoord_br, pressureType);\n\
\n\
    float airPressure = mix(mix(ap_tl, ap_tr, f.x), mix(ap_bl, ap_br, f.x), f.y);\n\
\n\
    return airPressure;\n\
}\n\
\n\
float _getAirPressure_nearest(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic, in int pressureType)\n\
{\n\
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), \n\
    // and the col & row into the mosaic texture, returns a nearest interpolation of the pressure.***\n\
    vec2 mosaicTexCoord = subTexCoord_to_texCoord(subTexCoord2d, col_mosaic, row_mosaic);\n\
    float ap = getAirPressure_inMosaicTexture(mosaicTexCoord, pressureType);\n\
    return ap;\n\
}\n\
\n\
bool get_airPressure_fromTexture3d_triLinearInterpolation(in vec3 texCoord3d, inout float airPressure, inout vec3 velocity, in int pressureType)\n\
{\n\
    // tex3d : airPressureMosaicTex\n\
    // 1rst, check texCoord3d boundary limits.***\n\
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
    // 1rst, determine the sliceIdx.***\n\
    // u_texSize[3]; // The original texture3D size.***\n\
    int originalTexWidth = u_texSize[0];\n\
    int originalTexHeight = u_texSize[1];\n\
    int slicesCount = u_texSize[2];\n\
\n\
    //float currSliceIdx_float = texCoord3d.z * float(slicesCount); // original.***\n\
    float currSliceIdx_float = texCoord3d.z * float(slicesCount - 1); // new, debugging with chemAccident volRender.***\n\
    int currSliceIdx_down = int(floor(currSliceIdx_float));\n\
    int currSliceIdx_up = currSliceIdx_down + 1;\n\
\n\
    if(currSliceIdx_up >= u_texSize[2])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    // now, calculate the mod.***\n\
    //float remain = currSliceIdx_float -  floor(currSliceIdx_float);\n\
    float remain = fract(currSliceIdx_float);\n\
\n\
    // Now, calculate the \"col\" & \"row\" in the mosaic texture3d.***\n\
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
\n\
    // Down slice.************************************************************\n\
    int col_down, row_down;\n\
    if(currSliceIdx_down <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row_down = 0;\n\
        col_down = currSliceIdx_down;\n\
    }\n\
    else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_down = int(colAux);\n\
        row_down = int(rowAux);\n\
    }\n\
\n\
    // now, must calculate the mosaicTexCoord.***\n\
    vec2 mosaicTexCoord_down = subTexCoord_to_texCoord(texCoord3d.xy, col_down, row_down);\n\
    \n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec2 px = 1.0 / sim_res3d.xy;\n\
    vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;\n\
    vec3 f = fract(texCoord3d * sim_res3d);\n\
\n\
    float airPressure_down = _getAirPressure_triLinearInterpolation(texCoord3d.xy, col_down, row_down, pressureType);\n\
\n\
    vec3 vel_down = getVelocity(mosaicTexCoord_down);\n\
\n\
    // up slice.************************************************************\n\
    int col_up, row_up;\n\
    if(currSliceIdx_up <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row_up = 0;\n\
        col_up = currSliceIdx_up;\n\
    }\n\
    else\n\
    {\n\
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));\n\
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));\n\
\n\
        col_up = int(colAux);\n\
        row_up = int(rowAux);\n\
    }\n\
\n\
    // now, must calculate the mosaicTexCoord.***\n\
    vec2 mosaicTexCoord_up = subTexCoord_to_texCoord(texCoord3d.xy, col_up, row_up);\n\
\n\
    float airPressure_up = _getAirPressure_triLinearInterpolation(texCoord3d.xy, col_up, row_up, pressureType);\n\
\n\
    vec3 vel_up = getVelocity(mosaicTexCoord_up);\n\
\n\
    velocity = mix(vel_down, vel_up, remain);\n\
\n\
\n\
    airPressure = mix(airPressure_down, airPressure_up, f.z);\n\
    //airPressure = airPressure_down; // test delete.***\n\
    return true;\n\
}\n\
\n\
bool get_airPressure_fromTexture3d_nearest(in vec3 texCoord3d, inout float airPressure, inout vec3 velocity, in int pressureType)\n\
{\n\
    // tex3d : airPressureMosaicTex\n\
    // 1rst, check texCoord3d boundary limits.***\n\
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)\n\
    {\n\
        return false;\n\
    }\n\
    // 1rst, determine the sliceIdx.***\n\
    int slicesCount = u_texSize[2];\n\
\n\
    float currSliceIdx_float = texCoord3d.z * float(slicesCount);\n\
    int currSliceIdx_down = int(floor(currSliceIdx_float));\n\
    int currSliceIdx_up = currSliceIdx_down + 1;\n\
    int currSliceIdx = currSliceIdx_down;\n\
\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    //vec2 px = 1.0 / sim_res3d.xy;\n\
    //vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;\n\
    vec3 f = fract(texCoord3d * sim_res3d);\n\
\n\
    if(f.z > 0.5)\n\
    {\n\
        currSliceIdx = currSliceIdx_up;\n\
    }\n\
\n\
    if(currSliceIdx >= u_texSize[2])\n\
    {\n\
        return false;\n\
    }\n\
\n\
    // ************************************************************\n\
    int col, row;\n\
    if(currSliceIdx <= u_mosaicSize[0])\n\
    {\n\
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:\n\
        // in this case, the row = 0.***\n\
        row = 0;\n\
        col = currSliceIdx;\n\
    }\n\
    else\n\
    {\n\
        float mosaicSize_x = float(u_mosaicSize[0]);\n\
        float rowAux = floor(float(currSliceIdx) / mosaicSize_x);\n\
        float colAux = float(currSliceIdx) - (rowAux * mosaicSize_x);\n\
\n\
        col = int(colAux);\n\
        row = int(rowAux);\n\
    }\n\
\n\
    // now, must calculate the mosaicTexCoord.***\n\
    vec2 mosaicTexCoord = subTexCoord_to_texCoord(texCoord3d.xy, col, row);\n\
\n\
    airPressure = _getAirPressure_nearest(texCoord3d.xy, col, row, pressureType);\n\
    velocity = getVelocity(mosaicTexCoord);\n\
\n\
    return true;\n\
}\n\
\n\
vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)\n\
{\n\
    \n\
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
\n\
    float value = gray * 4.0;\n\
    float h = floor(value);\n\
    float f = fract(value);\n\
\n\
    vec4 resultColor = vec4(0.0, 0.0, 0.0, gray);\n\
\n\
    if(hotToCold)\n\
    {\n\
        // HOT to COLD.***\n\
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix red & yellow.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(red, yellow, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix yellow & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, green, f);\n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & cyan.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(green, cyan, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix cyan & blue.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, blue, f);\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // COLD to HOT.***\n\
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init\n\
        if(h >= 0.0 && h < 1.0)\n\
        {\n\
            // mix blue & cyan.***\n\
            vec3 blue = vec3(0.0, 0.0, 1.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(blue, cyan, f);\n\
        }\n\
        else if(h >= 1.0 && h < 2.0)\n\
        {\n\
            // mix cyan & green.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 cyan = vec3(0.0, 1.0, 1.0);\n\
            resultColor.rgb = mix(cyan, green, f);  \n\
        }\n\
        else if(h >= 2.0 && h < 3.0)\n\
        {\n\
            // mix green & yellow.***\n\
            vec3 green = vec3(0.0, 1.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(green, yellow, f);\n\
        }\n\
        else if(h >= 3.0)\n\
        {\n\
            // mix yellow & red.***\n\
            vec3 red = vec3(1.0, 0.0, 0.0);\n\
            vec3 yellow = vec3(1.0, 1.0, 0.0);\n\
            resultColor.rgb = mix(yellow, red, f);\n\
        }\n\
    }\n\
\n\
    return resultColor;\n\
}\n\
\n\
vec3 getRainbowColor_byHeight_original(in float height, in float minHeight_rainbow, in float maxHeight_rainbow)\n\
{\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
// https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl\n\
// The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. \n\
//--------------------------------------------------------------------------------------------------------------------------\n\
\n\
// https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques\n\
//--------------------------------------------------------------------------------------------------------------------------\n\
\n\
/*\n\
// https://martinopilia.com/posts/2018/09/17/volume-raycasting.html\n\
// Estimate the normal from a finite difference approximation of the gradient\n\
vec3 normal(vec3 position, float intensity)\n\
{\n\
    float d = step_length;\n\
    float dx = texture(volume, position + vec3(d,0,0)).r - intensity;\n\
    float dy = texture(volume, position + vec3(0,d,0)).r - intensity;\n\
    float dz = texture(volume, position + vec3(0,0,d)).r - intensity;\n\
    return -normalize(NormalMatrix * vec3(dx, dy, dz));\n\
}*/\n\
\n\
bool normalLC(vec3 texCoord3d, in float pressure, in float step_length, inout vec3 result_normal)\n\
{\n\
    // Estimate the normal from a finite difference approximation of the gradient\n\
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);\n\
    vec3 pix = 1.0 / sim_res3d;\n\
\n\
    vec3 vc = texCoord3d;\n\
    int pressureType = 0;\n\
\n\
    // dx.*************************************************\n\
    float airPressure_dx = u_airEnvirontmentPressure;\n\
    vec3 velocity_dx;\n\
    vec3 texCoord3d_dx = vec3(vc + vec3(pix.x, 0.0, 0.0));\n\
    bool succes_dx =  get_airPressure_fromTexture3d_nearest(texCoord3d_dx, airPressure_dx, velocity_dx, pressureType);\n\
    if(!succes_dx)return false;\n\
\n\
    float airPressure_dx_neg = u_airEnvirontmentPressure;\n\
    vec3 velocity_dx_neg;\n\
    vec3 texCoord3d_dx_neg = vec3(vc - vec3(pix.x, 0.0, 0.0));\n\
    bool succes_dx_neg =  get_airPressure_fromTexture3d_nearest(texCoord3d_dx_neg, airPressure_dx_neg, velocity_dx_neg, pressureType);\n\
    if(!succes_dx_neg)return false;\n\
\n\
    // dy.*************************************************\n\
    float airPressure_dy = u_airEnvirontmentPressure;\n\
    vec3 velocity_dy;\n\
    vec3 texCoord3d_dy = vec3(vc + vec3(0.0, pix.y, 0.0));\n\
    bool succes_dy =  get_airPressure_fromTexture3d_nearest(texCoord3d_dy, airPressure_dy, velocity_dy, pressureType);\n\
    if(!succes_dy)return false;\n\
\n\
    float airPressure_dy_neg = u_airEnvirontmentPressure;\n\
    vec3 velocity_dy_neg;\n\
    vec3 texCoord3d_dy_neg = vec3(vc - vec3(0.0, pix.y, 0.0));\n\
    bool succes_dy_neg =  get_airPressure_fromTexture3d_nearest(texCoord3d_dy_neg, airPressure_dy_neg, velocity_dy_neg, pressureType);\n\
    if(!succes_dy_neg)return false;\n\
\n\
    // dz.*************************************************\n\
    float airPressure_dz = u_airEnvirontmentPressure;\n\
    vec3 velocity_dz;\n\
    vec3 texCoord3d_dz = vec3(vc + vec3(0.0, 0.0, pix.z));\n\
    bool succes_dz =  get_airPressure_fromTexture3d_nearest(texCoord3d_dz, airPressure_dz, velocity_dz, pressureType);\n\
    if(!succes_dz)return false;\n\
\n\
    float airPressure_dz_neg = u_airEnvirontmentPressure;\n\
    vec3 velocity_dz_neg;\n\
    vec3 texCoord3d_dz_neg = vec3(vc - vec3(0.0, 0.0, pix.z));\n\
    bool succes_dz_neg =  get_airPressure_fromTexture3d_nearest(texCoord3d_dz_neg, airPressure_dz_neg, velocity_dz_neg, pressureType);\n\
    if(!succes_dz_neg)return false;\n\
\n\
    //result_normal = normalize(vec3(airPressure_dx - pressure, airPressure_dy - pressure, airPressure_dz - pressure));\n\
    result_normal = normalize(vec3(airPressure_dx - airPressure_dx_neg, airPressure_dy - airPressure_dy_neg, airPressure_dz - airPressure_dz_neg));\n\
\n\
    if(abs(result_normal.x) > 0.0 || abs(result_normal.y) > 0.0 || abs(result_normal.z) > 0.0 )\n\
    {\n\
        return true;\n\
    }\n\
    else return false;\n\
\n\
    return true;\n\
}\n\
\n\
vec4 transfer_fnc(in float pressure)\n\
{\n\
    // The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. \n\
    float maxPressureRef = 1.05;\n\
    float minPressureRef = u_airEnvirontmentPressure;\n\
    maxPressureRef = 1.005; // test.***\n\
    minPressureRef = 1.0; // test.***\n\
    bool bHotToCold = false; // we want coldToHot (blue = min to red = max).***\n\
    vec4 rainbowCol3 = getRainbowColor_byHeight(pressure, minPressureRef, maxPressureRef, bHotToCold);\n\
\n\
    return rainbowCol3;\n\
}\n\
\n\
void main(){\n\
\n\
    // 1rst, read front depth & rear depth and check if exist rear depth.***\n\
    // If no exist rear depth, then discard.***\n\
    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y); // \n\
    vec2 screenPos = v_tex_pos;\n\
\n\
    // read normal in rear depth. If no exist normal, then, discard.***\n\
    // calculate the texCoord for rear normal:\n\
    vec2 frontTexCoord;\n\
    vec2 rearTexCoord;\n\
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);\n\
\n\
\n\
    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);\n\
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);\n\
	vec3 normal = normal4rear.xyz;\n\
    \n\
	vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, frontTexCoord);\n\
	if(length(encodedNormal.xyz) < 0.1)\n\
    {\n\
        discard;\n\
    }\n\
\n\
    // 1rst, know the scene depth.***\n\
    vec4 normal4scene = getNormal(v_tex_pos);\n\
    int estimatedFrustumIdx = int(floor(normal4scene.w * 100.0));\n\
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_scene = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear_scene = nearFar_scene.x; // no used in this shader.***\n\
	float currFar_scene = nearFar_scene.y;\n\
    float sceneLinearDepth = getDepth(v_tex_pos);\n\
    float distToCam = sceneLinearDepth * currFar_scene;\n\
    vec3 sceneDepthPosCC = getViewRay(v_tex_pos, distToCam - 1.0);\n\
\n\
    // Now, calculate the positions with the simulation box, front & rear.***\n\
    // rear.***\n\
	estimatedFrustumIdx = int(floor(normal4rear.w * 100.0));\n\
	dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_rear = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear_rear = nearFar_rear.x; // no used in this shader.***\n\
	float currFar_rear = nearFar_rear.y;\n\
\n\
    // front.***\n\
    estimatedFrustumIdx = int(floor(normal4front.w * 100.0));\n\
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : \"dataType\" no used in this shader.***\n\
	vec2 nearFar_front = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear_front = nearFar_front.x; // no used in this shader.***\n\
	float currFar_front = nearFar_front.y;\n\
\n\
    // Now, calculate the rearPosCC & frontPosCC.***\n\
    vec3 frontPosCC;\n\
    vec3 rearPosCC;\n\
    get_FrontAndRear_posCC(screenPos, currFar_rear, currFar_front, frontPosCC, rearPosCC);\n\
    \n\
\n\
    // Now, calculate frontPosWC & rearPosWC.***\n\
    vec4 frontPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(frontPosCC.xyz, 1.0);\n\
    vec4 rearPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(rearPosCC.xyz, 1.0);\n\
    //vec4 scenePosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(sceneDepthPosCC.xyz, 1.0);\n\
\n\
    // Now, calculate frontPosLC & rearPosLC.***\n\
    vec3 frontPosLC;\n\
    vec3 rearPosLC;\n\
    //vec3 scenePosLC;\n\
    posWCRelToEye_to_posLC(frontPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, frontPosLC);\n\
    posWCRelToEye_to_posLC(rearPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, rearPosLC);\n\
    //posWCRelToEye_to_posLC(scenePosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, scenePosLC);\n\
\n\
    // Now, with \"frontPosLC\" & \"rearPosLC\", calculate the frontTexCoord3d & rearTexCoord3d.***\n\
    vec3 simulBoxRange = vec3(u_simulBoxMaxPosLC.x - u_simulBoxMinPosLC.x, u_simulBoxMaxPosLC.y - u_simulBoxMinPosLC.y, u_simulBoxMaxPosLC.z - u_simulBoxMinPosLC.z);\n\
    //vec3 frontTexCoord3d = vec3((frontPosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (frontPosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (frontPosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
    //vec3 rearTexCoord3d = vec3((rearPosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (rearPosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (rearPosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
    //vec3 scenePosTexCoord3d = vec3((scenePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (scenePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (scenePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
\n\
    \n\
    //bool testBool = false;\n\
\n\
    //float totalAirPressure = 0.0;\n\
    vec3 totalVelocityLC = vec3(0.0);\n\
    //float totalDotProdInv = 0.0;\n\
    float airPressure = 0.0;\n\
    float smplingCount = 0.0;\n\
    //float currMaxPressure = 0.0;\n\
    float segmentLength = length(rearPosLC - frontPosLC);\n\
    //vec3 samplingDir = normalize(rearTexCoord3d - frontTexCoord3d); // original.***\n\
    vec3 samplingDirLC = normalize(rearPosLC - frontPosLC);\n\
    vec3 samplingDirCC = normalize(rearPosCC - frontPosCC);\n\
    //float increLength = 0.02; // original.***\n\
    float samplingsCount = 50.0;\n\
    float increLength = segmentLength / samplingsCount;\n\
    if(increLength < u_voxelSizeMeters.x)\n\
    {\n\
        increLength = u_voxelSizeMeters.x;\n\
    }\n\
\n\
    vec3 velocityLC;\n\
\n\
    //vec3 camRay = normalize(getViewRay(v_tex_pos, 1.0));\n\
    vec3 camRay = normalize(sceneDepthPosCC);\n\
    //float dotProdAccum = 0.0;\n\
    vec4 color4Aux = vec4(0.0, 0.0, 0.0, 0.0);\n\
    //float dotProdFactor = 1.0;\n\
    int pressureType = 0;\n\
    vec3 scenePosTexCoord3d_candidate = vec3(-1.0);\n\
    vec3 currSamplePosLC = vec3(frontPosLC);\n\
    vec3 step_vector_LC = samplingDirLC * increLength;\n\
    vec4 finalColor4 = vec4(0.0);\n\
    \n\
    // Sampling far to near.***\n\
    for(int i=0; i<50; i++)\n\
    {\n\
        \n\
        // Note : for each smple, must depth check with the scene depthTexure.***\n\
        vec3 samplePosLC = frontPosLC + samplingDirLC * increLength * float(i);\n\
\n\
        //if(samplePosLC.z > 20.0)\n\
        //{\n\
        //    continue;\n\
        //}\n\
\n\
        vec3 samplePosCC = frontPosCC + samplingDirCC * increLength * float(i);\n\
        if(abs(samplePosCC.z) > distToCam)\n\
        {\n\
            break;\n\
        }\n\
\n\
        airPressure = 0.0;\n\
        vec3 sampleTexCoord3d = vec3((samplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (samplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (samplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
        //vec3 sampleTexCoord3d = vec3((currSamplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (currSamplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (currSamplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);\n\
        scenePosTexCoord3d_candidate = vec3(sampleTexCoord3d);\n\
        \n\
\n\
        if(get_airPressure_fromTexture3d_triLinearInterpolation(sampleTexCoord3d, airPressure, velocityLC, pressureType))\n\
        {\n\
            // normalLC(vec3 texCoord3d, in float pressure, in float step_length)\n\
            vec3 currNormalLC;\n\
            if(!normalLC(sampleTexCoord3d, airPressure, increLength, currNormalLC))\n\
            {\n\
                continue;\n\
            }\n\
\n\
            // test iso surface:\n\
            //float pressureWanted = 1.02;\n\
            //float diffAux = abs(pressureWanted - airPressure);\n\
            //if(diffAux > 0.01)\n\
            //{\n\
            //    continue;\n\
            //}\n\
\n\
            vec4 currColor4 = transfer_fnc(airPressure);\n\
            //vec3 normalizedVelocityLC = normalize(velocityLC);\n\
            //vec4 velocityWC = u_simulBoxTMat * vec4(velocityLC, 1.0);\n\
            //vec4 velocityDirCC = modelViewMatrixRelToEye * vec4(velocityWC.xyz, 1.0);\n\
\n\
            // Now, calculate alpha by normalCC.***\n\
            vec4 currNormalWC = u_simulBoxTMat * vec4(currNormalLC, 1.0);\n\
            vec4 currNormalCC = modelViewMatrixRelToEye * vec4(currNormalWC.xyz, 1.0);\n\
            vec3 normalCC = normalize(currNormalCC.xyz);\n\
            float dotProd = dot(camRay, normalCC);\n\
\n\
            // Now, accumulate the color.***\n\
            currColor4.rgb *= abs(dotProd);\n\
\n\
            vec4 vecAux = abs(vec4(currColor4.rgb, 1.0));\n\
 \n\
            //if(length(currNormalLC) > 0.0)\n\
            {\n\
                finalColor4.rgb += (1.0 - finalColor4.a) * currColor4.a * vecAux.rgb; // test. render normal color:\n\
                finalColor4.a += (1.0 - finalColor4.a) * currColor4.a;\n\
            }\n\
            \n\
            totalVelocityLC += velocityLC;\n\
            smplingCount += 1.0;\n\
\n\
            // Optimization: break out of the loop when the color is near opaque\n\
            if (finalColor4.a >= 0.95) {\n\
                break;\n\
            }\n\
            \n\
            \n\
        }\n\
\n\
        currSamplePosLC += step_vector_LC;\n\
    }\n\
\n\
    if(smplingCount < 1.0)\n\
    {\n\
        smplingCount = 1.0;\n\
    }\n\
    \n\
    //float averageAirPressure = totalAirPressure / smplingCount;\n\
    //vec3 averageVelocityLC = totalVelocityLC / smplingCount;\n\
    //float averageDotProd = dotProdAccum / smplingCount;\n\
    //float averageDotProdInv = totalDotProdInv / smplingCount;\n\
    //averageDotProdInv /= dotProdFactor;\n\
\n\
    \n\
    //float f = 1.0;\n\
    //float deltaP = averageAirPressure - u_airEnvirontmentPressure;\n\
    //float maxPressure_reference = u_airMaxPressure;\n\
    //vec4 rainbowCol3 = getRainbowColor_byHeight(averageAirPressure * f, u_airEnvirontmentPressure, 1.05, false);//\n\
\n\
    //float alpha;\n\
    //if(deltaP > 0.0)\n\
    //if(deltaP > 0.00005)\n\
    {\n\
        // Test with velocity:\n\
        //vec4 velocityWC = u_simulBoxTMat * vec4(averageVelocityLC, 1.0);\n\
        //vec4 velocityDirCC = modelViewMatrixRelToEye * vec4(velocityWC.xyz, 1.0);\n\
\n\
        //vec3 lightDirLC = normalize(vec3(0.1, 0.1, -0.9));\n\
\n\
        //vec4 lightDirWC = u_simulBoxTMat * vec4(lightDirLC, 1.0);\n\
        //vec4 lightDirCC = modelViewMatrixRelToEye * vec4(lightDirWC.xyz, 1.0);\n\
        //float lightDotProd = abs(dot(normalize(lightDirCC.xyz), normalize(velocityDirCC.xyz)));\n\
        //float lightDotProd = -(dot(normalize(lightDirLC.xyz), normalize(averageVelocityLC.xyz)));\n\
\n\
        //float dotProd = abs(dot(camRay, normalize(velocityDirCC.xyz)));\n\
        //float dotProdInv = 1.0 - abs(dotProd);\n\
        //finalColor4.rgb *= lightDotProd;\n\
\n\
        //float alphaByP = deltaP * 10000.0 / u_airMaxPressure;\n\
        //alpha = min(averageDotProdInv, alphaByP);\n\
        //alpha = averageDotProdInv;// * 5.0;\n\
        //float alpha_final = min(alphaByP, alpha);\n\
        //color4Aux = vec4(rainbowCol3.rgb * averageDotProd, alphaByP);\n\
\n\
        color4Aux = finalColor4;\n\
    }\n\
\n\
    \n\
\n\
    // Now, check the max pressure record.***\n\
    // Must check the \"scenePosTexCoord3d\".***\n\
    /*\n\
    pressureType = 1; // maxPressureRecord.***\n\
    float sceneAirPressure;\n\
    vec3 sceneVelocityLC;\n\
    vec4 color_maxPressure = vec4(0.0);\n\
\n\
    if(get_airPressure_fromTexture3d_triLinearInterpolation(scenePosTexCoord3d_candidate, sceneAirPressure, sceneVelocityLC, pressureType))//\n\
    {\n\
        if(sceneAirPressure > u_airEnvirontmentPressure + 0.01)\n\
        {\n\
            maxPressure_reference = 1.6;\n\
            //vec3 sceneColor = getRainbowColor_byHeight(sceneAirPressure, 0.8, maxPressure_reference, false);//\n\
            color4Aux.rgb = getRainbowColor_byHeight(sceneAirPressure, 0.8, maxPressure_reference, false);//\n\
            color4Aux.a = 0.8;\n\
        }\n\
    }\n\
    */\n\
\n\
    gl_FragData[0] = color4Aux;\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = color4Aux;\n\
        gl_FragData[2] = color4Aux;\n\
        gl_FragData[3] = color4Aux;\n\
    #endif\n\
}\n\
\n\
/*\n\
uniform sampler3D tex;\n\
uniform sampler3D normals;\n\
uniform sampler2D colorMap;\n\
\n\
uniform mat4 transform;\n\
uniform int depthSampleCount;\n\
uniform float zScale;\n\
\n\
uniform vec3 lightPosition;\n\
\n\
uniform float brightness;\n\
\n\
//uniform vec4 opacitySettings;\n\
// x: minLevel\n\
// y: maxLevel\n\
// z: lowNode\n\
// w: highNode\n\
\n\
in vec2 texCoord;\n\
\n\
//in vec4 origin;\n\
//in vec4 direction;\n\
\n\
out vec4 color;\n\
\n\
vec3 ambientLight = vec3(0.34, 0.32, 0.32);\n\
vec3 directionalLight = vec3(0.5, 0.5, 0.5);\n\
vec3 lightVector = normalize(vec3(-1.0, -1.0, 1.0));\n\
vec3 specularColor = vec3(0.5, 0.5, 0.5);\n\
\n\
vec3 aabb[2] = vec3[2](\n\
	vec3(0.0, 0.0, 0.0),\n\
	vec3(1.0, 1.0, 1.0)\n\
);\n\
\n\
struct Ray {\n\
    vec3 origin;\n\
    vec3 direction;\n\
    vec3 inv_direction;\n\
    int sign[3];\n\
};\n\
\n\
Ray makeRay(vec3 origin, vec3 direction) {\n\
    vec3 inv_direction = vec3(1.0) / direction;\n\
    \n\
    return Ray(\n\
        origin,\n\
        direction,\n\
        inv_direction,\n\
        int[3](\n\
			((inv_direction.x < 0.0) ? 1 : 0),\n\
			((inv_direction.y < 0.0) ? 1 : 0),\n\
			((inv_direction.z < 0.0) ? 1 : 0)\n\
		)\n\
    );\n\
}\n\
\n\
/*\n\
	From: https://github.com/hpicgs/cgsee/wiki/Ray-Box-Intersection-on-the-GPU\n\
void intersect(\n\
    in Ray ray, in vec3 aabb[2],\n\
    out float tmin, out float tmax\n\
){\n\
    float tymin, tymax, tzmin, tzmax;\n\
    tmin = (aabb[ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;\n\
    tmax = (aabb[1-ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;\n\
    tymin = (aabb[ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;\n\
    tymax = (aabb[1-ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;\n\
    tzmin = (aabb[ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;\n\
    tzmax = (aabb[1-ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;\n\
    tmin = max(max(tmin, tymin), tzmin);\n\
    tmax = min(min(tmax, tymax), tzmax);\n\
}\n\
*/\n\
\n\
\n\
/*\n\
\n\
void main(){\n\
	\n\
	//transform = inverse(transform);\n\
	\n\
	vec4 origin = vec4(0.0, 0.0, 2.0, 1.0);\n\
	origin = transform * origin;\n\
	origin = origin / origin.w;\n\
	origin.z = origin.z / zScale;\n\
	origin = origin + 0.5;\n\
\n\
	vec4 image = vec4(texCoord, 4.0, 1.0);\n\
	image = transform * image;\n\
	//image = image / image.w;\n\
	image.z = image.z / zScale;\n\
	image = image + 0.5;\n\
	//vec4 direction = vec4(0.0, 0.0, 1.0, 0.0);\n\
	vec4 direction = normalize(origin-image);\n\
	//direction = transform * direction;\n\
\n\
	Ray ray = makeRay(origin.xyz, direction.xyz);\n\
	float tmin = 0.0;\n\
	float tmax = 0.0;\n\
	intersect(ray, aabb, tmin, tmax);\n\
\n\
	vec4 value = vec4(0.0, 0.0, 0.0, 0.0);\n\
,\n\
	if(tmin > tmax){\n\
		color = value;\n\
		discard;\n\
	}\n\
\n\
	vec3 start = origin.xyz + tmin*direction.xyz;\n\
	vec3 end = origin.xyz + tmax*direction.xyz;\n\
	\n\
	float length = distance(end, start);\n\
	int sampleCount = int(float(depthSampleCount)*length);\n\
	//vec3 increment = (end-start)/float(sampleCount);\n\
	//vec3 originOffset = mod((start-origin.xyz), increment);\n\
\n\
	float s = 0.0;\n\
	float px = 0.0;\n\
	vec4 pxColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
	vec3 texCo = vec3(0.0, 0.0, 0.0);\n\
	vec3 normal = vec3(0.0, 0.0, 0.0);\n\
	vec4 zero = vec4(0.0);\n\
	\n\
	for(int count = 0; count < sampleCount; count++){\n\
\n\
		texCo = mix(start, end, float(count)/float(sampleCount));// - originOffset;\n\
\n\
		//texCo = start + increment*float(count);\n\
		px = texture(tex, texCo).r;\n\
\n\
		\n\
		//px = length(texture(normals, texCo).xyz - 0.5);\n\
		//px = px * 1.5;\n\
		\n\
		pxColor = texture(colorMap, vec2(px, 0.0));\n\
		\n\
		normal = normalize(texture(normals, texCo).xyz - 0.5);\n\
		float directional = clamp(dot(normal, lightVector), 0.0, 1.0);\n\
\n\
		//vec3 R = -reflect(lightDirection, surfaceNormal);\n\
		//return pow(max(0.0, dot(viewDirection, R)), shininess);\n\
\n\
		float specular = max(dot(direction.xyz, reflect(lightVector, normal)), 0.0);\n\
		specular = pow(specular, 3.0);\n\
\n\
		pxColor.rgb = ambientLight*pxColor.rgb + directionalLight*directional*pxColor.rgb + pxColor.a*specular*specularColor;\n\
			\n\
		\n\
		//value = mix(value, pxColor, px);\n\
		//value = (1.0-value.a)*pxColor + value;\n\
		//value = mix(pxColor, zero, value.a) + value;\n\
		\n\
		value = value + pxColor - pxColor*value.a;\n\
		\n\
		if(value.a >= 0.95){\n\
			break;\n\
		}\n\
	}\n\
	color = value*brightness;\n\
}\n\
*/\n\
";
ShaderSource.ssaoFromDepthFS = "\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D normalTex;\n\
\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 projectionMatrixInv;\n\
\n\
uniform float near;\n\
uniform float far;         \n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight; \n\
uniform vec2 noiseScale;\n\
uniform vec2 uNearFarArray[4];\n\
\n\
\n\
uniform bool bApplySsao;\n\
uniform vec3 kernel[16]; \n\
\n\
const int kernelSize = 16; \n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
\n\
/*\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    // mago unpackDepth.***\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}  \n\
*/\n\
\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(normalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
            \n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}         \n\
            \n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z*0.0001;\n\
        float Fcoef_half = uFCoef_logDepth/2.0;\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = (flogzAux - 1.0);\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord, inout bool isValid) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/screenWidth;\n\
    float pixelSizeY = 1.0/screenHeight;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<2.0; i++)\n\
	{\n\
        float depthAux = getDepth(texCoord + offset1*(1.0+i));\n\
        if(depthAux > 0.996)\n\
        {\n\
            depthAux = depth;\n\
            isValid = false;\n\
        }\n\
		depthA += depthAux;\n\
\n\
        depthAux = getDepth(texCoord + offset2*(1.0+i));\n\
        if(depthAux > 0.996)\n\
        {\n\
            depthAux = depth;\n\
            isValid = false;\n\
        }\n\
		depthB += depth;\n\
	}\n\
    \n\
	//vec3 posA = reconstructPosition(texCoord + offset1*2.0, depthA/2.0);\n\
	//vec3 posB = reconstructPosition(texCoord + offset2*2.0, depthB/2.0);\n\
    //vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    \n\
    vec3 posA = getViewRay(texCoord + offset1*2.0, far)* depthA/2.0;\n\
	vec3 posB = getViewRay(texCoord + offset2*2.0, far)* depthB/2.0;\n\
    vec3 pos0 = getViewRay(texCoord, far)* depth;\n\
\n\
    posA.z *= -1.0;\n\
    posB.z *= -1.0;\n\
    pos0.z *= -1.0;\n\
    \n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
    isValid = true;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
float getOcclusion(vec3 origin, vec3 rotatedKernel, float radius, int originFrustumIdx)\n\
{\n\
    float result_occlusion = 0.0;\n\
    vec3 sample = origin + rotatedKernel * radius;\n\
    vec4 offset = projectionMatrix * vec4(sample, 1.0);	// from view to clip-space\n\
    vec3 offsetCoord = vec3(offset.xyz);				\n\
    offsetCoord.xyz /= offset.w; // perspective divide\n\
    offsetCoord.xyz = offsetCoord.xyz * 0.5 + 0.5;  // transform to range 0.0 - 1.0  	\n\
\n\
    if(abs(offsetCoord.x) > 1.0 || abs(offsetCoord.y) > 1.0)\n\
    {\n\
        return result_occlusion;\n\
    }\n\
    vec4 normalRGBA = getNormal(offsetCoord.xy);\n\
    int estimatedFrustumIdx = int(floor(100.0*normalRGBA.w));\n\
    //int dataType = 0;\n\
    //int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
    vec2 nearFar = getNearFar_byFrustumIdx(estimatedFrustumIdx);\n\
    float currNear = nearFar.x;\n\
    float currFar = nearFar.y;\n\
    float depthBufferValue = getDepth(offsetCoord.xy);\n\
    //--------------------------------------------------------\n\
    // Objective : to compare \"sampleZ\" with \"bufferZ\".***\n\
    //--------------------------------------------------------\n\
    float sampleZ = -sample.z;\n\
    float bufferZ = depthBufferValue * currFar;\n\
    float zDiff = abs(bufferZ - sampleZ);\n\
    if(zDiff < radius)\n\
    {\n\
        //float rangeCheck = smoothstep(0.0, 1.0, radius/zDiff);\n\
        if (bufferZ < sampleZ)//-tolerance*1.0)\n\
        {\n\
            result_occlusion = 1.0;// * rangeCheck;\n\
        }\n\
    }\n\
    return result_occlusion;\n\
}\n\
\n\
float getFactorByDist(in float radius, in float realDist)\n\
{\n\
    float factorByDist = 1.0;\n\
    if(realDist < radius*5.0)\n\
    {\n\
        factorByDist = smoothstep(0.0, 1.0, realDist/(radius*5.0));\n\
    }\n\
    return factorByDist;\n\
}\n\
\n\
\n\
\n\
float getOcclusion_pointsCloud(vec2 screenPosAdjacent)\n\
{\n\
    float result_occlusion = 0.0;\n\
\n\
    vec4 normalRGBA_adjacent = getNormal(screenPosAdjacent);\n\
    int estimatedFrustumIdx = int(floor(100.0*normalRGBA_adjacent.w));\n\
\n\
    // check the data type of the pixel.\n\
    int dataType = -1;\n\
    int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
    vec2 nearFar_adjacent = getNearFar_byFrustumIdx(currFrustumIdx);\n\
    float currNear_adjacent = nearFar_adjacent.x;\n\
    float currFar_adjacent = nearFar_adjacent.y;\n\
\n\
    float depthBufferValue = getDepth(screenPosAdjacent);\n\
    //float zDist = currNear_adjacent + depthBufferValue * currFar_adjacent; // correct.\n\
    float zDist = depthBufferValue * currFar_adjacent;\n\
\n\
\n\
\n\
    return result_occlusion;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
    float occlusion_A = 0.0;\n\
    float occlusion_B = 0.0;\n\
    float occlusion_C = 0.0;\n\
    float occlusion_D = 0.0;\n\
\n\
    vec3 normal = vec3(0.0);\n\
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
    vec4 normalRGBA = getNormal(screenPos);\n\
    vec3 normal2 = normalRGBA.xyz; // original.***\n\
\n\
    // test check.\n\
    int estimatedFrustumIdx = int(floor(100.0*normalRGBA.w));\n\
    int dataType = 0; // 0= general geometry. 1= tinTerrain. 2= PointsCloud.\n\
\n\
    // Check the type of the data.******************\n\
    // dataType = 0 -> general geometry data.\n\
    // dataType = 1 -> tinTerrain data.\n\
    // dataType = 2 -> points cloud data.\n\
    //----------------------------------------------\n\
    int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
    // If the data is no generalGeomtry or pointsCloud, then discard.\n\
    //if(dataType != 0 && dataType != 2)\n\
    //discard;\n\
\n\
    vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx); \n\
    float currNear = nearFar.x;\n\
    float currFar = nearFar.y;\n\
    float linearDepth = getDepth(screenPos);\n\
\n\
    // calculate the real pos of origin.\n\
    float origin_zDist = linearDepth * currFar;\n\
    vec3 origin_real = getViewRay(screenPos, origin_zDist);\n\
\n\
    float radius_A = 0.5;\n\
    float radius_B = 5.0;\n\
    float radius_C = 12.0;\n\
    float radius_D = 20.0;\n\
\n\
    float factorByDist = 1.0;\n\
    float realDist = -origin_real.z;\n\
\n\
    float aux = 30.0;\n\
    if(realDist < aux)\n\
    {\n\
        factorByDist = smoothstep(0.0, 1.0, realDist/(aux));\n\
    }\n\
\n\
    // Test. Variate the radius in function of \"origin_zDist\".***\n\
    //radius_A *= factorByDist;\n\
    //radius_B *= factorByDist;\n\
    //radius_C *= factorByDist;\n\
    //radius_D *= factorByDist;\n\
    // End test.-------------------------------------------------\n\
\n\
    // Now, factorByFarDist. When object are in far, no apply ssao.\n\
    float factorByFarDist = 1.0;\n\
    factorByFarDist = 1000.0/realDist;\n\
    if(factorByFarDist > 1.0)\n\
    factorByFarDist = 1.0;\n\
\n\
    factorByDist *= factorByFarDist;\n\
\n\
    if(factorByDist < 0.01)\n\
    discard;\n\
\n\
    // General data type.*************************************************************************************\n\
    if(dataType != 2 && bApplySsao)\n\
	{        \n\
        vec3 origin = origin_real;\n\
        //vec3 origin = reconstructPosition(screenPos, linearDepth); // used when there are no normal-texture.\n\
        bool isValid = true;\n\
        \n\
        if(length(normal2) < 0.1)\n\
        isValid = false;\n\
        if(!isValid)\n\
        {\n\
            //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
            //return;\n\
            discard;\n\
        }\n\
        normal = normal2;\n\
        \n\
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
		vec3 bitangent = cross(normal2, tangent);\n\
		mat3 tbn = mat3(tangent, bitangent, normal2);   \n\
\n\
		for(int i = 0; i < kernelSize; ++i)\n\
		{    	\n\
            vec3 rotatedKernel = tbn * vec3(kernel[i].x*1.0, kernel[i].y*1.0, kernel[i].z);\n\
\n\
            occlusion_A += getOcclusion(origin, rotatedKernel, radius_A, currFrustumIdx);\n\
            occlusion_B += getOcclusion(origin, rotatedKernel, radius_B, currFrustumIdx);\n\
            occlusion_C += getOcclusion(origin, rotatedKernel, radius_C, currFrustumIdx);\n\
            occlusion_D += getOcclusion(origin, rotatedKernel, radius_D, currFrustumIdx);\n\
		} \n\
\n\
        occlusion_A *= factorByDist;\n\
        occlusion_B *= factorByDist;\n\
        occlusion_C *= factorByDist;\n\
        occlusion_D *= factorByDist;\n\
\n\
        float fKernelSize = float(kernelSize);\n\
\n\
		occlusion_C = occlusion_C / fKernelSize;	\n\
        if(occlusion_C < 0.0)\n\
        occlusion_C = 0.0;\n\
        else if(occlusion_C > 1.0)\n\
        occlusion_C = 1.0;\n\
\n\
        occlusion_B = occlusion_B / fKernelSize;	\n\
        if(occlusion_B < 0.0)\n\
        occlusion_B = 0.0;\n\
        else if(occlusion_B > 1.0)\n\
        occlusion_B = 1.0;\n\
\n\
        occlusion_A = occlusion_A / fKernelSize;	\n\
        if(occlusion_A < 0.0)\n\
        occlusion_A = 0.0;\n\
        else if(occlusion_A > 1.0)\n\
        occlusion_A = 1.0;\n\
\n\
        occlusion_D = occlusion_D / fKernelSize;	\n\
        if(occlusion_D < 0.0)\n\
        occlusion_D = 0.0;\n\
        else if(occlusion_D > 1.0)\n\
        occlusion_D = 1.0;\n\
\n\
	}\n\
\n\
    // Points cloud data type.**************************************************************************************\n\
    /*\n\
    if(dataType == 2 && bApplySsao)\n\
	{        \n\
		float linearDepth = getDepth(screenPos);\n\
		//vec3 origin = getViewRay(screenPos) * linearDepth;\n\
\n\
\n\
		vec4 normalRGBA = getNormal(screenPos);\n\
		int currFrustumIdx = int(floor(100.0*normalRGBA.w));\n\
\n\
		if(currFrustumIdx >= 10)\n\
		currFrustumIdx -= 20;\n\
\n\
		vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
		float currNear = nearFar.x;\n\
		float currFar = nearFar.y;\n\
\n\
\n\
		float myZDist = currNear + linearDepth * currFar;\n\
\n\
		float radiusAux = glPointSize/1.9; // radius in pixels.\n\
		float radiusFog = glPointSize*3.0; // radius in pixels.\n\
		vec2 screenPosAdjacent;\n\
\n\
\n\
\n\
		// calculate the pixelSize in the screenPos.***\n\
		float h = 2.0 * tangentOfHalfFovy * currFar * linearDepth; // height in meters of the screen in the current pixelDepth\n\
    	float w = h * aspectRatio;     							   // width in meters of the screen in the current pixelDepth\n\
		// vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);   \n\
\n\
		float pixelSize_x = w/screenWidth; // the pixelSize in meters in the x axis.\n\
		float pixelSize_y = h/screenHeight;  // the pixelSize in meters in the y axis.\n\
		\n\
		float radiusInMeters = 0.20;\n\
		radiusAux = radiusInMeters / pixelSize_x;\n\
		float radiusFogInMeters = 1.0;\n\
		radiusFog = radiusFogInMeters / pixelSize_x;\n\
\n\
		//radiusAux = 6.0;\n\
		float farFactor = 0.1*sqrt(myZDist);\n\
		\n\
\n\
        //radiusAux = 1.5 *(float(j)+1.0);\n\
        for(int i = 0; i < 8; ++i)\n\
        {  \n\
            // Find occlussion.***  	 \n\
            if(i == 0)\n\
                screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
            else if(i == 1)\n\
                screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
            else if(i == 2)\n\
                screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
            else if(i == 3)\n\
                screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);\n\
            else if(i == 4)\n\
                screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
            else if(i == 5)\n\
                screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
            else if(i == 6)\n\
                screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
            else if(i == 7)\n\
                screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);\n\
\n\
            vec4 normalRGBA_adjacent = getNormal(screenPosAdjacent);\n\
            int adjacentFrustumIdx = int(floor(100.0*normalRGBA_adjacent.w));\n\
\n\
            if(adjacentFrustumIdx >= 10)\n\
            adjacentFrustumIdx -= 20;\n\
\n\
            vec2 nearFar_adjacent = getNearFar_byFrustumIdx(adjacentFrustumIdx);\n\
            float currNear_adjacent = nearFar_adjacent.x;\n\
            float currFar_adjacent = nearFar_adjacent.y;\n\
\n\
            float depthBufferValue = getDepth(screenPosAdjacent);\n\
            float zDist = currNear_adjacent + depthBufferValue * currFar_adjacent;\n\
            float zDistDiff = abs(myZDist - zDist);\n\
\n\
            \n\
            \n\
            if(myZDist > zDist)\n\
            {\n\
                // My pixel is rear\n\
                if(zDistDiff > farFactor  &&  zDistDiff < 100.0)\n\
                occlusion +=  1.0;\n\
            }\n\
        }\n\
\n\
        float fKernelSize = float(kernelSize);\n\
\n\
		occlusion_C = occlusion_C / fKernelSize;	\n\
        if(occlusion_C < 0.0)\n\
        occlusion_C = 0.0;\n\
        else if(occlusion_C > 1.0)\n\
        occlusion_C = 1.0;\n\
\n\
        occlusion_B = occlusion_B / fKernelSize;	\n\
        if(occlusion_B < 0.0)\n\
        occlusion_B = 0.0;\n\
        else if(occlusion_B > 1.0)\n\
        occlusion_B = 1.0;\n\
\n\
        occlusion_A = occlusion_A / fKernelSize;	\n\
        if(occlusion_A < 0.0)\n\
        occlusion_A = 0.0;\n\
        else if(occlusion_A > 1.0)\n\
        occlusion_A = 1.0;\n\
\n\
        occlusion_D = occlusion_D / fKernelSize;	\n\
        if(occlusion_D < 0.0)\n\
        occlusion_D = 0.0;\n\
        else if(occlusion_D > 1.0)\n\
        occlusion_D = 1.0;\n\
	}\n\
    */\n\
\n\
    \n\
    // Do lighting.***\n\
    //float scalarProd = max(0.01, dot(normal, normalize(-ray)));\n\
   // scalarProd /= 3.0;\n\
	//scalarProd += 0.666;\n\
    //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - scalarProd);\n\
\n\
	gl_FragColor = vec4(occlusion_A, occlusion_B, occlusion_C, occlusion_D);\n\
    //gl_FragColor = vec4(normal.xyz, 1.0);\n\
}";
ShaderSource.Test_QuadFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
 \n\
uniform sampler2D diffuseTex;  \n\
varying vec2 vTexCoord; \n\
void main()\n\
{          \n\
    vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
    gl_FragColor = textureColor; \n\
}\n\
";
ShaderSource.Test_QuadVS = "attribute vec3 position;\n\
attribute vec2 texCoord;\n\
\n\
uniform sampler2D diffuseTex;\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
uniform mat4 buildingRotMatrix;  \n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;   \n\
\n\
void main()\n\
{	\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    vTexCoord = texCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.textureCopyFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texToCopy;\n\
uniform bool u_textureFlipXAxis;\n\
uniform bool u_textureFlipYAxis;\n\
varying vec2 v_tex_pos;\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4;\n\
    float texCoordX, texCoordY;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        texCoordY =  1.0 - v_tex_pos.y;\n\
    }\n\
    else\n\
    {\n\
        texCoordY =  v_tex_pos.y;\n\
    }\n\
\n\
    if(u_textureFlipXAxis)\n\
    {\n\
        texCoordX =  1.0 - v_tex_pos.x;\n\
    }\n\
    else\n\
    {\n\
        texCoordX =  v_tex_pos.x;\n\
    }\n\
    \n\
    finalCol4 = texture2D(texToCopy, vec2(texCoordX, texCoordY));\n\
\n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = finalCol4; // depth\n\
        gl_FragData[2] = finalCol4; // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = finalCol4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.textureCopyVS = "//precision mediump float;\n\
\n\
attribute vec2 position;\n\
varying vec4 vColor; \n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
	vColor = vec4(0.2, 0.2, 0.2, 0.5);\n\
    gl_Position = vec4(1.0 - 2.0 * position, 0.0, 1.0);\n\
    v_tex_pos = position;\n\
}";
ShaderSource.TextureFS = "precision mediump float;\n\
varying vec4 vColor;\n\
varying vec2 vTextureCoord;\n\
uniform sampler2D uSampler;\n\
\n\
void main()\n\
{\n\
    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
}";
ShaderSource.texturesMergerFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D texture_0;  \n\
uniform sampler2D texture_1;\n\
uniform sampler2D texture_2;\n\
uniform sampler2D texture_3;\n\
uniform sampler2D texture_4;\n\
uniform sampler2D texture_5;\n\
uniform sampler2D texture_6;\n\
uniform sampler2D texture_7;\n\
\n\
uniform float externalAlphasArray[8];\n\
uniform int uActiveTextures[8];\n\
uniform vec4 uExternalTexCoordsArray[8]; // vec4 (minS, minT, maxS, maxT).\n\
uniform vec2 uMinMaxAltitudes; // used for altitudes textures as bathymetry.\n\
//uniform vec2 uMinMaxAltitudesBathymetryToGradient; // used for altitudes textures as bathymetry.\n\
\n\
// gradient white-blue vars.***\n\
uniform float uGradientSteps[16];\n\
uniform int uGradientStepsCount;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
float getMinValue(float a, float b, float c)\n\
{\n\
    float x = min(a, b);\n\
    return min(x, c);\n\
}\n\
\n\
float getMaxValue(float a, float b, float c)\n\
{\n\
    float x = max(a, b);\n\
    return max(x, c);\n\
}\n\
\n\
bool isNan(float val)\n\
{\n\
  return (val <= 0.0 || 0.0 <= val) ? false : true;\n\
}\n\
\n\
vec3 RGBtoHSV(vec3 color)\n\
{\n\
    // https://stackoverflow.com/questions/13806483/increase-or-decrease-color-saturation\n\
    float r,g,b,h,s,v;\n\
    r= color.r;\n\
    g= color.g;\n\
    b= color.b;\n\
    float minVal = getMinValue( r, g, b );\n\
    float maxVal = getMaxValue( r, g, b );\n\
\n\
    v = maxVal;\n\
    float delta = maxVal - minVal;\n\
    if( maxVal != 0.0 )\n\
        s = delta / maxVal;        // s\n\
    else {\n\
        // r = g = b = 0        // s = 0, v is undefined\n\
        s = 0.0;\n\
        h = -1.0;\n\
        return vec3(h, s, 0.0);\n\
    }\n\
    if( r == maxVal )\n\
        h = ( g - b ) / delta;      // between yellow & magenta\n\
    else if( g == maxVal )\n\
        h = 2.0 + ( b - r ) / delta;  // between cyan & yellow\n\
    else\n\
        h = 4.0 + ( r - g ) / delta;  // between magenta & cyan\n\
    h *= 60.0;                // degrees\n\
    if( h < 0.0 )\n\
        h += 360.0;\n\
    if ( isNan(h) )\n\
        h = 0.0;\n\
    return vec3(h,s,v);\n\
}\n\
\n\
vec3 HSVtoRGB(vec3 color)\n\
{\n\
    int i;\n\
    float h,s,v,r,g,b;\n\
    h= color.r;\n\
    s= color.g;\n\
    v= color.b;\n\
    if(s == 0.0 ) {\n\
        // achromatic (grey)\n\
        r = g = b = v;\n\
        return vec3(r,g,b);\n\
    }\n\
    h /= 60.0;            // sector 0 to 5\n\
    i = int(floor( h ));\n\
    float f = h - float(i);          // factorial part of h\n\
    float p = v * ( 1.0 - s );\n\
    float q = v * ( 1.0 - s * f );\n\
    float t = v * ( 1.0 - s * ( 1.0 - f ) );\n\
    if( i == 0 ) \n\
    {\n\
        r = v;\n\
        g = t;\n\
        b = p;\n\
    }\n\
    else if(i == 1)\n\
    {\n\
        r = q;\n\
        g = v;\n\
        b = p;\n\
    }\n\
    else if(i == 2)\n\
    {\n\
        r = p;\n\
        g = v;\n\
        b = t;\n\
    }\n\
    else if(i == 3)\n\
    {\n\
        r = p;\n\
        g = q;\n\
        b = v;\n\
    }\n\
    else if(i == 4)\n\
    {\n\
        r = t;\n\
        g = p;\n\
        b = v;\n\
    }\n\
    else\n\
    {       // case 5:\n\
        r = v;\n\
        g = p;\n\
        b = q;\n\
    }\n\
    return vec3(r,g,b);\n\
}\n\
\n\
vec3 getSaturatedColor(vec3 color, float saturation)\n\
{\n\
    vec3 hsv = RGBtoHSV(color);\n\
    hsv.y *= saturation;\n\
    return HSVtoRGB(hsv);\n\
}\n\
\n\
vec3 getRainbowColor_byHeight(float height, float minHeight, float maxHeight)\n\
{\n\
	float minHeight_rainbow = minHeight;\n\
	float maxHeight_rainbow = maxHeight;\n\
	\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
vec3 getWhiteToBlueColor_byHeight(float height)//, float minHeight, float maxHeight)\n\
{\n\
    // White to Blue in 32 steps.\n\
    float gray = 1.0;\n\
    //gray = 1.0 - gray; // invert gray value (white to blue).\n\
    // calculate r, g, b values by gray.\n\
\n\
    // Test to quadratic gray scale.***\n\
    float stepGray = 1.0;\n\
\n\
    for(int i=0; i<16-1; i++)\n\
    {\n\
        if(i >= uGradientStepsCount-1)\n\
        break;\n\
\n\
        float stepValue = uGradientSteps[i];\n\
        float stepValue2 = uGradientSteps[i+1];\n\
\n\
        // check if is frontier.***\n\
        if(height >= uGradientSteps[0])\n\
        {\n\
            stepGray = 0.0;\n\
            break;\n\
        }\n\
\n\
        if(height <= stepValue && height > stepValue2)\n\
        {\n\
            // calculate decimal.***\n\
            //float decimal = (height - stepValue)/(stepValue2-stepValue);\n\
            float decimal = (stepValue - height)/(stepValue-stepValue2);\n\
            float unit = float (i);\n\
            float value = unit + decimal;\n\
            stepGray = value/float(uGradientStepsCount-1);\n\
            break;\n\
        }\n\
    }\n\
    gray = stepGray;\n\
\n\
\n\
    float r, g, b;\n\
\n\
    // Red.\n\
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.\n\
    {\n\
        float minGray = 0.0;\n\
        float maxGray = 0.15625;\n\
        float maxR = 1.0;\n\
        float minR = 0.3515625; // 90/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        r = maxR - relativeGray*(maxR - minR);\n\
    }\n\
    else if(gray >= 0.15625 && gray < 0.40625) // [6, 13] from 32 divisions.\n\
    {\n\
        float minGray = 0.15625;\n\
        float maxGray = 0.40625;\n\
        float maxR = 0.3515625; // 90/256.\n\
        float minR = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        r = maxR - relativeGray*(maxR - minR);\n\
    }\n\
    else  // [14, 32] from 32 divisions.\n\
    {\n\
        r = 0.0;\n\
    }\n\
\n\
    // Green.\n\
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.\n\
    {\n\
        g = 1.0; // 256.\n\
    }\n\
    else if(gray >= 0.15625 && gray < 0.5625) // [6, 18] from 32 divisions.\n\
    {\n\
        float minGray = 0.15625;\n\
        float maxGray = 0.5625;\n\
        float maxG = 1.0; // 256/256.\n\
        float minG = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        g = maxG - relativeGray*(maxG - minG);\n\
    }\n\
    else  // [18, 32] from 32 divisions.\n\
    {\n\
        g = 0.0;\n\
    }\n\
\n\
    // Blue.\n\
    if(gray < 0.5625)\n\
    {\n\
        b = 1.0;\n\
    }\n\
    else // gray >= 0.5625 && gray <= 1.0\n\
    {\n\
        float minGray = 0.5625;\n\
        float maxGray = 1.0;\n\
        float maxB = 1.0; // 256/256.\n\
        float minB = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        b = maxB - relativeGray*(maxB - minB);\n\
    }\n\
\n\
    return vec3(r, g, b);\n\
}\n\
\n\
//vec4 mixColor(sampler2D tex)\n\
bool intersects(vec2 texCoord, vec4 extension)\n\
{\n\
    bool bIntersects = true;\n\
    float minS = extension.x;\n\
    float minT = extension.y;\n\
    float maxS = extension.z;\n\
    float maxT = extension.w;\n\
\n\
    if(texCoord.x < minS || texCoord.x > maxS)\n\
    return false;\n\
    else if(texCoord.y < minT || texCoord.y > maxT)\n\
    return false;\n\
\n\
    return bIntersects;\n\
}\n\
\n\
void getTextureColor(in int activeNumber, in vec4 currColor4, in vec2 texCoord,  inout bool victory, in float externalAlpha, in vec4 externalTexCoords, inout vec4 resultTextureColor)\n\
{\n\
    if(activeNumber == 1 || activeNumber == 2)\n\
    {\n\
        if(currColor4.w > 0.0 && externalAlpha > 0.0)\n\
        {\n\
            if(victory)\n\
            {\n\
                resultTextureColor = mix(resultTextureColor, currColor4, currColor4.w*externalAlpha);\n\
            }\n\
            else{\n\
                currColor4.w *= externalAlpha;\n\
                resultTextureColor = currColor4;\n\
            }\n\
            \n\
            victory = true;\n\
\n\
            // debug.\n\
            //resultTextureColor = mix(resultTextureColor, vec4(1.0, 1.0, 1.0, 1.0), 0.4);\n\
        }\n\
    }\n\
    else if(activeNumber == 10)\n\
    {\n\
        // Bathymetry texture.\n\
        float altitude = 1000000.0;\n\
        if(currColor4.w > 0.0)\n\
        {\n\
            // decode the grayScale.***\n\
\n\
            float r = currColor4.r * 256.0;\n\
            float g = currColor4.g;\n\
            float b = currColor4.b;\n\
\n\
            float height = currColor4.r;\n\
            float maxHeight;\n\
            float minHeight;\n\
            float numDivs;\n\
            float increHeight;\n\
				\n\
				if(r < 0.0001)\n\
				{\n\
					// considering r=0.\n\
					minHeight = -2796.0;\n\
					maxHeight = -1000.0;\n\
					numDivs = 2.0;\n\
                    increHeight = (maxHeight - minHeight)/(numDivs);\n\
                    height = (256.0*g + b)/(128.0);\n\
\n\
                    //resultTextureColor.r = 1.0;\n\
                    //resultTextureColor.g = 0.0;\n\
                    //resultTextureColor.b = 0.0;\n\
                    //return;\n\
				}\n\
				else if(r > 0.5 && r < 1.5)\n\
				{\n\
					// considering r=1.\n\
					minHeight = -1000.0;\n\
					maxHeight = -200.0;\n\
					numDivs = 2.0;\n\
                    increHeight = (maxHeight - minHeight)/(numDivs);\n\
                    height = (256.0*g + b)/(128.0);\n\
\n\
                    //resultTextureColor.r = 0.0;\n\
                    //resultTextureColor.g = 1.0;\n\
                    //resultTextureColor.b = 0.0;\n\
                    //return;\n\
				}\n\
				else if(r > 1.5 && r < 2.5)\n\
				{\n\
					// considering r=2.\n\
					minHeight = -200.0;\n\
					maxHeight = 1.0;\n\
					numDivs = 123.0;\n\
                    increHeight = (maxHeight - minHeight)/(numDivs);\n\
                    height = (256.0*g + b)/(128.0);\n\
				}\n\
\n\
\n\
\n\
				//height = (256.0*g + b)/(128.0);\n\
                height = (256.0*g + b)/(numDivs);\n\
               // height = (256.0*g*increHeight + b*increHeight)- minHeight;\n\
            \n\
            //altitude = uMinMaxAltitudes.x + height * (uMinMaxAltitudes.y - uMinMaxAltitudes.x);\n\
		    altitude = minHeight + height * (maxHeight -minHeight);\n\
            //altitude = height;\n\
            if(altitude < 0.0)\n\
            {\n\
                /*\n\
                float minHeight_rainbow = uMinMaxAltitudes.x;\n\
                float maxHeight_rainbow = 0.0;\n\
                float gray = (altitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
                vec4 seaColor;\n\
\n\
                float red = gray + 0.1;//float red = gray + 0.2;\n\
                float green = gray + 0.5;//float green = gray + 0.6;\n\
                float blue = gray*2.0 + 2.0;\n\
                seaColor = vec4(red, green, blue, 1.0);\n\
                */\n\
\n\
                vec3 seaColorRGB = getWhiteToBlueColor_byHeight(altitude);\n\
                vec4 seaColor = vec4(seaColorRGB, 1.0);\n\
\n\
                resultTextureColor = mix(resultTextureColor, seaColor, 0.99); \n\
            }\n\
\n\
        }\n\
    }\n\
}\n\
\n\
void main()\n\
{           \n\
    // Debug.\n\
    /*\n\
    if((v_tex_pos.x < 0.006 || v_tex_pos.x > 0.994) || (v_tex_pos.y < 0.006 || v_tex_pos.y > 0.994))\n\
    {\n\
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
        return;\n\
    }\n\
    */\n\
\n\
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);\n\
\n\
    // Take the base color.\n\
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
    bool victory = false;\n\
\n\
    if(uActiveTextures[0] > 0)\n\
    {\n\
        if(uActiveTextures[0] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[0];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[0], texture2D(texture_0, texCoord), texCoord,  victory, externalAlphasArray[0], uExternalTexCoordsArray[0], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[0], texture2D(texture_0, texCoord), texCoord,  victory, externalAlphasArray[0], uExternalTexCoordsArray[0], textureColor);\n\
        \n\
    }\n\
    if(uActiveTextures[1] > 0)\n\
    {\n\
        if(uActiveTextures[1] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[1];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[1], texture2D(texture_1, texCoord), texCoord,  victory, externalAlphasArray[1], uExternalTexCoordsArray[1], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[1], texture2D(texture_1, texCoord), texCoord,  victory, externalAlphasArray[1], uExternalTexCoordsArray[1], textureColor);\n\
    }\n\
    if(uActiveTextures[2] > 0)\n\
    {\n\
        if(uActiveTextures[2] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[2];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[2], texture2D(texture_2, texCoord), texCoord,  victory, externalAlphasArray[2], uExternalTexCoordsArray[2], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[2], texture2D(texture_2, texCoord), texCoord,  victory, externalAlphasArray[2], uExternalTexCoordsArray[2], textureColor);\n\
    }\n\
    if(uActiveTextures[3] > 0)\n\
    {\n\
        if(uActiveTextures[3] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[3];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[3], texture2D(texture_3, texCoord), texCoord,  victory, externalAlphasArray[3], uExternalTexCoordsArray[3], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[3], texture2D(texture_3, texCoord), texCoord,  victory, externalAlphasArray[3], uExternalTexCoordsArray[3], textureColor);\n\
    }\n\
    if(uActiveTextures[4] > 0)\n\
    {\n\
        if(uActiveTextures[4] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[4];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[4], texture2D(texture_4, texCoord), texCoord,  victory, externalAlphasArray[4], uExternalTexCoordsArray[4], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[4], texture2D(texture_4, texCoord), texCoord,  victory, externalAlphasArray[4], uExternalTexCoordsArray[4], textureColor);\n\
    }\n\
    if(uActiveTextures[5] > 0)\n\
    {\n\
        if(uActiveTextures[5] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[5];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[5], texture2D(texture_5, texCoord), texCoord,  victory, externalAlphasArray[5], uExternalTexCoordsArray[5], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[5], texture2D(texture_5, texCoord), texCoord,  victory, externalAlphasArray[5], uExternalTexCoordsArray[5], textureColor);\n\
    }\n\
    if(uActiveTextures[6] > 0)\n\
    {\n\
        if(uActiveTextures[6] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[6];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[6], texture2D(texture_6, texCoord), texCoord,  victory, externalAlphasArray[6], uExternalTexCoordsArray[6], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[6], texture2D(texture_6, texCoord), texCoord,  victory, externalAlphasArray[6], uExternalTexCoordsArray[6], textureColor);\n\
    }\n\
    if(uActiveTextures[7] > 0)\n\
    {\n\
        if(uActiveTextures[7] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[7];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[7], texture2D(texture_7, texCoord), texCoord,  victory, externalAlphasArray[7], uExternalTexCoordsArray[7], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[7], texture2D(texture_7, texCoord), texCoord,  victory, externalAlphasArray[7], uExternalTexCoordsArray[7], textureColor);\n\
    }\n\
    \n\
    if(!victory)\n\
    discard;\n\
    \n\
    gl_FragColor = textureColor;\n\
	\n\
}";
ShaderSource.texturesMergerVS = "precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    v_tex_pos = a_pos;\n\
    //vec2 pos = a_pos*0.5;\n\
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n\
}";
ShaderSource.TextureVS = "attribute vec3 position;\n\
attribute vec4 aVertexColor;\n\
attribute vec2 aTextureCoord;\n\
uniform mat4 Mmatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
varying vec4 vColor;\n\
varying vec2 vTextureCoord;\n\
\n\
void main()\n\
{\n\
    vec4 rotatedPos = Mmatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
    vColor=aVertexColor;\n\
    vTextureCoord = aTextureCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
    \n\
}";
ShaderSource.thickLineExtrudedVS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
uniform float uExtrudeHeight;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
//                                   Bottom                                      Top\n\
//       \n\
//                        (1)                    (2)                  (3)                    (4)\n\
//                         +-----------------------+                   +-----------------------+ \n\
//                         |                       |                   |                       |\n\
//                         |                       |                   |                       |\n\
//                         *---------------------->*                   *---------------------->*\n\
//                         |                       |                   |                       |\n\
//                         |                       |                   |                       |\n\
//                         +-----------------------+                   +-----------------------+\n\
//                         (-1)                    (-2)                (-3)                    (-4)\n\
\n\
\n\
vec2 project(vec4 p){\n\
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;\n\
}\n\
\n\
bool isEqual(float value, float valueToCompare)\n\
{\n\
	if(value + error > valueToCompare && value - error < valueToCompare)\n\
	return true;\n\
	\n\
	return false;\n\
}\n\
\n\
vec4 getPointWC(in vec3 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	return vec4(objPosHigh.xyz + objPosLow.xyz, 1.0);\n\
}\n\
\n\
vec4 getPointRelToEye(in vec4 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
}\n\
\n\
void main()\n\
{\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
\n\
    float currW = current.w;\n\
    float prevW = prev.w;\n\
    float nextW = next.w;\n\
\n\
    vec4 rotatedCurr = buildingRotMatrix * vec4(current.xyz, 1.0);\n\
    vec4 rotatedPrev = buildingRotMatrix * vec4(prev.xyz, 1.0);\n\
    vec4 rotatedNext = buildingRotMatrix * vec4(next.xyz, 1.0);\n\
\n\
	float sense = 1.0;\n\
	int orderInt = int(floor(currW + 0.1));\n\
    int orderIntPrev = int(floor(prevW + 0.1));\n\
    int orderIntNext = int(floor(nextW + 0.1));\n\
\n\
    float absOrderCurr = currW > 0.0? currW : currW*-1.0;\n\
    float absOrderPrev = prevW > 0.0? prevW : prevW*-1.0;\n\
    float absOrderNext = nextW > 0.0? nextW : nextW*-1.0;\n\
\n\
    float provisionalExtrudeHeght = 500.0; // provisional for debug.\n\
\n\
\n\
\n\
    // calculate the triangle's normal. To do it, calculate prevDir & currDir.\n\
    vec3 rotatedUp = normalize(vec3(( rotatedCurr.xyz + buildingPosLOW ) + buildingPosHIGH)); \n\
    vec3 rotatedPrevDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));\n\
    vec3 rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
\n\
    // check if any dir is vertical.\n\
    //float dotPrev = abs(dot(rotatedUp, rotatedPrevDir));\n\
    //float dotCurr = abs(dot(rotatedUp, rotatedNextDir));\n\
    vec3 rotatedDir;\n\
    vec3 rotatedLeft;\n\
\n\
    \n\
    int faceType = 0; // 0= bottom, 1= rear, 2= top, 3= front, 4= left, 5= right.\n\
    int faceTypeNext = 0;\n\
\n\
    if(orderInt == 1)\n\
    {\n\
        //rotatedDir\n\
    }\n\
    else if(orderInt == -1)\n\
    {\n\
\n\
    }\n\
    else if(orderInt == 2)\n\
    {\n\
        \n\
    }\n\
    else if(orderInt == -2)\n\
    {\n\
        \n\
    }\n\
\n\
\n\
\n\
    vec4 rotatedOffSet;\n\
\n\
    \n\
    //////////////////////////////////////////////////////////////////////////////////////////////////\n\
	//float aspect = viewport.x / viewport.y;\n\
	//vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
\n\
    vec4 rotatedPos = vec4(rotatedCurr.xyz + rotatedOffSet.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	vec4 posCC =  vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    vec4 finalPosProjected = ModelViewProjectionMatrixRelToEye * posCC;\n\
	gl_Position = finalPosProjected; \n\
\n\
    vec4 orthoPos = modelViewMatrixRelToEye * posCC;\n\
	vDepth = -orthoPos.z/far;\n\
\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			float Fcoef = 2.0 / log2(far + 1.0);\n\
			gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
	\n\
	if(colorType == 0)\n\
		vColor = oneColor4;\n\
	else if(colorType == 1)\n\
		vColor = color4; //vec4(color4.r+0.8, color4.g+0.8, color4.b+0.8, color4.a+0.8);\n\
	else\n\
		vColor = oneColor4;\n\
\n\
     // test.***\n\
    if(orderInt == 1 || orderInt == 11 || orderInt == 21 || orderInt == 31)\n\
    {\n\
        vColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
    else if(orderInt == -1 || orderInt == -11 || orderInt == -21 || orderInt == -31)\n\
    {\n\
        vColor = vec4(0.0, 1.0, 0.0, 1.0);\n\
    }\n\
    else if(orderInt == 2 || orderInt == 12 || orderInt == 22 || orderInt == 32)\n\
    {\n\
        vColor = vec4(0.0, 1.0, 1.0, 1.0);\n\
    }\n\
    else if(orderInt == -2 || orderInt == -12 || orderInt == -22 || orderInt == -32)\n\
    {\n\
        vColor = vec4(1.0, 1.0, 0.0, 1.0);\n\
    }\n\
\n\
    //if(isRear )\n\
    //{\n\
    //    vColor = vec4(1.0, 0.0, 1.0, 1.0);\n\
    //}\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.thickLineExtrudedVS__original = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
uniform float uExtrudeHeight;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
//                                   Bottom                                      Top\n\
//       \n\
//                        (1)                    (2)                  (3)                    (4)\n\
//                         +-----------------------+                   +-----------------------+ \n\
//                         |                       |                   |                       |\n\
//                         |                       |                   |                       |\n\
//                         *---------------------->*                   *---------------------->*\n\
//                         |                       |                   |                       |\n\
//                         |                       |                   |                       |\n\
//                         +-----------------------+                   +-----------------------+\n\
//                         (-1)                    (-2)                (-3)                    (-4)\n\
\n\
\n\
vec2 project(vec4 p){\n\
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;\n\
}\n\
\n\
bool isEqual(float value, float valueToCompare)\n\
{\n\
	if(value + error > valueToCompare && value - error < valueToCompare)\n\
	return true;\n\
	\n\
	return false;\n\
}\n\
\n\
vec4 getPointWC(in vec3 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	return vec4(objPosHigh.xyz + objPosLow.xyz, 1.0);\n\
}\n\
\n\
vec4 getPointRelToEye(in vec4 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
}\n\
\n\
void main()\n\
{\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
\n\
    float currW = current.w;\n\
    float prevW = prev.w;\n\
    float nextW = next.w;\n\
\n\
    vec4 rotatedCurr = buildingRotMatrix * vec4(current.xyz, 1.0);\n\
    vec4 rotatedPrev = buildingRotMatrix * vec4(prev.xyz, 1.0);\n\
    vec4 rotatedNext = buildingRotMatrix * vec4(next.xyz, 1.0);\n\
\n\
	float sense = 1.0;\n\
	int orderInt = int(floor(currW + 0.1));\n\
    int orderIntPrev = int(floor(prevW + 0.1));\n\
    int orderIntNext = int(floor(nextW + 0.1));\n\
\n\
    float absOrderCurr = currW > 0.0? currW : currW*-1.0;\n\
    float absOrderPrev = prevW > 0.0? prevW : prevW*-1.0;\n\
    float absOrderNext = nextW > 0.0? nextW : nextW*-1.0;\n\
\n\
    float provisionalExtrudeHeght = 500.0; // provisional for debug.\n\
\n\
\n\
\n\
    // calculate the triangle's normal. To do it, calculate prevDir & currDir.\n\
    vec3 rotatedUp = normalize(vec3(( rotatedCurr.xyz + buildingPosLOW ) + buildingPosHIGH)); \n\
    vec3 rotatedPrevDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));\n\
    vec3 rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
\n\
    // check if any dir is vertical.\n\
    //float dotPrev = abs(dot(rotatedUp, rotatedPrevDir));\n\
    //float dotCurr = abs(dot(rotatedUp, rotatedNextDir));\n\
    vec3 rotatedDir;\n\
    vec3 rotatedLeft;\n\
\n\
    \n\
    int faceType = 0; // 0= bottom, 1= rear, 2= top, 3= front, 4= left, 5= right.\n\
    int faceTypeNext = 0;\n\
\n\
    // Check current faceType.************************************************************\n\
    if(absOrderCurr > 10.0 && absOrderCurr < 20.0)\n\
    {\n\
        faceType = 1; // rear.\n\
\n\
        // so, add height to nextPoint.\n\
        rotatedCurr += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
    }\n\
    else if(absOrderCurr > 20.0 && absOrderCurr < 30.0)\n\
    {\n\
        faceType = 2; // top.\n\
\n\
        // so, add height to nextPoint.\n\
        rotatedCurr += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
    }\n\
    else if(absOrderCurr > 30.0 && absOrderCurr < 40.0)\n\
    {\n\
        faceType = 3; // front.\n\
\n\
        // so, add height to nextPoint.\n\
        //rotatedCurr += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
    }\n\
    else if(absOrderCurr > 40.0 && absOrderCurr < 50.0)\n\
    {\n\
        faceType = 4; // left.\n\
\n\
        // in this case, must check the orderType to decide add height value into upDirection.\n\
        if(orderInt == 41)\n\
        {\n\
            // is bottom point.\n\
        }\n\
        else if(orderInt == -41)\n\
        {\n\
            // is top point.\n\
\n\
        }\n\
    }\n\
\n\
    // Check next faceType.***************************************************************\n\
    if(absOrderNext > 10.0 && absOrderNext < 20.0)\n\
    {\n\
        faceTypeNext = 1;// rear.\n\
\n\
        // so, add height to nextPoint.\n\
        rotatedNext += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
        rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
    }\n\
    else if(absOrderNext > 20.0 && absOrderNext < 30.0)\n\
    {\n\
        faceTypeNext = 2;// top.\n\
\n\
        // so, add height to nextPoint.\n\
        rotatedNext += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
        rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
    }\n\
    else if(absOrderNext > 30.0 && absOrderNext < 40.0)\n\
    {\n\
        faceTypeNext = 3;// front.\n\
\n\
        // so, add height to nextPoint.\n\
        //rotatedNext += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
        //rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
    }\n\
    else if(absOrderNext > 40.0 && absOrderNext < 50.0)\n\
    {\n\
        faceTypeNext = 4;// left.\n\
\n\
        // so, add height to nextPoint.\n\
        //rotatedNext += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
        //rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
    }\n\
\n\
    vec4 rotatedOffSet;\n\
\n\
    if(faceType == 0)\n\
    {\n\
        // bottom.\n\
        if(orderInt == 1 || orderInt == -1)\n\
        {\n\
            rotatedDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
        else // currOrderInt = 2 || currOrderInt = -2\n\
        {\n\
            // check if nextPoint is vertical.\n\
            if(faceTypeNext == 1)\n\
            {\n\
                // next face is rear, so is vertical.\n\
                //rotatedDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
                rotatedDir = normalize(vec3(rotatedNext.xyz - rotatedPrev.xyz)); // in this case use prevDir.\n\
                rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            }\n\
            else\n\
            {\n\
                rotatedDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
                rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            }\n\
        }\n\
\n\
        if(orderInt > 0)\n\
        {\n\
            // do left.\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            // do right.\n\
            rotatedOffSet = vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        \n\
    }\n\
    else if(faceType == 1)\n\
    {\n\
        // rear.\n\
        if(orderInt == 11 || orderInt == -11)\n\
        {\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
        else // orderInt == 12 || -12\n\
        {\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
\n\
        if(orderInt > 0)\n\
        {\n\
            // do left.\n\
            rotatedOffSet = vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            // do right.\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
    }\n\
    else if(faceType == 2)\n\
    {\n\
        // top.\n\
        if(orderInt == 21 || orderInt == -21)\n\
        {\n\
            rotatedDir = rotatedPrevDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
        else // orderInt == 22 || -22\n\
        {\n\
            // check if nextPoint is vertical.\n\
            if(faceTypeNext == 3) // front.\n\
            {\n\
                // next face is front, so is vertical.\n\
                rotatedDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz)); // in this case use prevDir.\n\
                rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            }\n\
            else\n\
            {\n\
                rotatedDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
                rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            }\n\
            //rotatedDir = rotatedNextDir;\n\
            //rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
\n\
        if(orderInt > 0)\n\
        {\n\
            // do left.\n\
            rotatedOffSet = vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            // do right.\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
    }\n\
    else if(faceType == 3)\n\
    {\n\
        // front.\n\
        if(orderInt == 31 || orderInt == -31)\n\
        {\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));\n\
            //rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedNextDir));\n\
        }\n\
        else // orderInt == 32 || -32\n\
        {\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
\n\
        if(orderInt > 0)\n\
        {\n\
            // do left.\n\
            rotatedOffSet = vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            // do right.\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
    }\n\
    else if(faceType == 4)\n\
    {\n\
        // left.\n\
        if(orderInt == 41 || orderInt == -41)\n\
        {\n\
            rotatedDir = rotatedPrevDir;\n\
            //rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedNextDir));\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else \n\
        {\n\
            //rotatedDir = rotatedPrevDir;\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
\n\
        \n\
\n\
        if(orderInt < 0)\n\
        {\n\
            // add height.\n\
            rotatedOffSet += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
            //rotatedOffSet += vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
\n\
    }\n\
\n\
    \n\
    //////////////////////////////////////////////////////////////////////////////////////////////////\n\
	//float aspect = viewport.x / viewport.y;\n\
	//vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
\n\
    vec4 rotatedPos = vec4(rotatedCurr.xyz + rotatedOffSet.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	vec4 posCC =  vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    vec4 finalPosProjected = ModelViewProjectionMatrixRelToEye * posCC;\n\
	gl_Position = finalPosProjected; \n\
\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			float Fcoef = 2.0 / log2(far + 1.0);\n\
			gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
	\n\
	if(colorType == 0)\n\
		vColor = oneColor4;\n\
	else if(colorType == 1)\n\
		vColor = color4; //vec4(color4.r+0.8, color4.g+0.8, color4.b+0.8, color4.a+0.8);\n\
	else\n\
		vColor = oneColor4;\n\
\n\
     // test.***\n\
    if(orderInt == 1 || orderInt == 11 || orderInt == 21 || orderInt == 31)\n\
    {\n\
        vColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
    else if(orderInt == -1 || orderInt == -11 || orderInt == -21 || orderInt == -31)\n\
    {\n\
        vColor = vec4(0.0, 1.0, 0.0, 1.0);\n\
    }\n\
    else if(orderInt == 2 || orderInt == 12 || orderInt == 22 || orderInt == 32)\n\
    {\n\
        vColor = vec4(0.0, 1.0, 1.0, 1.0);\n\
    }\n\
    else if(orderInt == -2 || orderInt == -12 || orderInt == -22 || orderInt == -32)\n\
    {\n\
        vColor = vec4(1.0, 1.0, 0.0, 1.0);\n\
    }\n\
\n\
    //if(isRear )\n\
    //{\n\
    //    vColor = vec4(1.0, 0.0, 1.0, 1.0);\n\
    //}\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.thickLineFS = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform bool bUseOutline;\n\
uniform int uFrustumIdx;\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vOrder;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void main() {\n\
	vec4 finalCol4 = vColor;\n\
	\n\
	if(vOrder <= 0.3 || vOrder >= 0.7)\n\
	{\n\
		float factor = 1.0;\n\
		if(vOrder <= 0.3)\n\
		{\n\
			factor = (0.3 - vOrder) / (0.3);\n\
		}\n\
		else if(vOrder >= 0.7)\n\
		{\n\
			factor = (vOrder - 0.7) / (0.3);\n\
		}\n\
\n\
		if(bUseOutline)\n\
		{\n\
			vec4 outLineCol = vec4(0.0, 0.0, 0.0, 1.0);\n\
			finalCol4 = mix(vColor, outLineCol, factor);\n\
		}\n\
		else\n\
		{\n\
			finalCol4 = vColor;\n\
		}\n\
		\n\
	}\n\
\n\
	gl_FragData[0] = finalCol4;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		gl_FragData[1] = packDepth(vDepth);\n\
\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		// original.***\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = finalCol4; \n\
		\n\
	}\n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.thickLineVS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vOrder;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
vec2 project(vec4 p){\n\
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;\n\
}\n\
\n\
bool isEqual(float value, float valueToCompare)\n\
{\n\
	if(value + error > valueToCompare && value - error < valueToCompare)\n\
	return true;\n\
	\n\
	return false;\n\
}\n\
\n\
vec4 getPointRelToEye(in vec4 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
}\n\
\n\
void main(){\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
	\n\
	float order_w = current.w;\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		// Positive order.***\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		// Negative order.***\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
\n\
	// To render outline : vOrder.********************************************************\n\
	// In the outLine zone, the vOrder is near to zero or near to 1, so in fragment shader\n\
	// use this information to render outline.***\n\
	if(orderInt == 1 || orderInt == 2)\n\
	{\n\
		vOrder = 0.0;\n\
	}\n\
	else if(orderInt == -1 || orderInt == -2)\n\
	{\n\
		vOrder = 1.0;\n\
	}\n\
	//--------------------------------------------------------------------------------------\n\
	\n\
	float aspect = viewport.x / viewport.y;\n\
	vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * vCurrent;\n\
	vDepth = -orthoPos.z/far;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
	// Get 2D screen space with W divide and aspect correction\n\
\n\
	vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;\n\
	vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;\n\
	vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n\
					\n\
	// This helps us handle 90 degree turns correctly\n\
	vec2 normal; \n\
	if(orderInt == 1 || orderInt == -1) // original.***\n\
	{\n\
		vec2 tangentPrev = normalize(currentScreen - previousScreen);\n\
		if(previousProjected.w > 0.0)\n\
		{\n\
			normal = vec2(-tangentPrev.y, tangentPrev.x); // left perpendicular.***\n\
		}\n\
		else\n\
		{\n\
			normal = vec2(tangentPrev.y, -tangentPrev.x); // right perpendicular.***\n\
		}\n\
	}\n\
	else\n\
	{\n\
		vec2 tangentNext = normalize(nextScreen - currentScreen);\n\
		if(nextProjected.w > 0.0)\n\
		{\n\
			normal = vec2(-tangentNext.y, tangentNext.x); // left perpendicular.***\n\
		}\n\
		else\n\
		{\n\
			normal = vec2(tangentNext.y, -tangentNext.x); // right perpendicular.***\n\
		}\n\
	}\n\
	normal *= thickness/2.0;\n\
	normal.x /= aspect;\n\
	float direction = (thickness * sense * projectedDepth) / 1000.0;\n\
\n\
	// Offset our position along the normal\n\
	vec4 offset = vec4(normal * direction, 0.0, 0.0);\n\
	gl_Position = currentProjected + offset; \n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		float Fcoef = 2.0 / log2(far + 1.0);\n\
		gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
	\n\
	if(colorType == 0)\n\
		vColor = oneColor4;\n\
	else if(colorType == 1)\n\
		vColor = color4; \n\
	else\n\
	{\n\
		// use this else to test.***\n\
		vColor = oneColor4;\n\
\n\
		// test debug::::\n\
		if(orderInt == 1)\n\
		{\n\
			vColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
		}\n\
		else if(orderInt == -1)\n\
		{\n\
			vColor = vec4(0.0, 1.0, 0.0, 1.0);\n\
		}\n\
		else if(orderInt == 2)\n\
		{\n\
			vColor = vec4(0.0, 0.0, 1.0, 1.0);\n\
		}\n\
		else if(orderInt == -2)\n\
		{\n\
			vColor = vec4(1.0, 1.0, 0.0, 1.0);\n\
		}\n\
	}\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.TinTerrainAltitudesFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
varying float vAltitude;  \n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    //vec4 res = fract(depth * bit_shift); // Is not precise.\n\
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
vec4 PackDepth32( in float depth )\n\
{\n\
    depth *= (16777216.0 - 1.0) / (16777216.0);\n\
    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;\n\
}\n\
\n\
void main()\n\
{     \n\
    gl_FragData[0] = PackDepth32(vAltitude);\n\
	//gl_FragData[0] = packDepth(-depth);\n\
}";
ShaderSource.TinTerrainAltitudesVS = "attribute vec3 position;\n\
uniform mat4 ModelViewProjectionMatrix;\n\
\n\
varying float vAltitude;\n\
  \n\
void main()\n\
{	\n\
    vec4 pos4 = vec4(position.xyz, 1.0);\n\
	gl_Position = ModelViewProjectionMatrix * pos4;\n\
	vAltitude = position.z;\n\
}\n\
";
ShaderSource.TinTerrainFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
  \n\
uniform sampler2D diffuseTex;  // 2\n\
uniform sampler2D diffuseTex_1;// 3\n\
uniform sampler2D diffuseTex_2;// 4\n\
uniform sampler2D diffuseTex_3;// 5\n\
uniform sampler2D diffuseTex_4;// 6\n\
uniform sampler2D diffuseTex_5;// 7\n\
uniform bool textureFlipYAxis;\n\
uniform bool bIsMakingDepth;\n\
uniform bool bExistAltitudes;\n\
uniform bool bApplyCaustics;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 projectionMatrixInv;\n\
uniform vec2 noiseScale;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;      \n\
uniform int uActiveTextures[8];\n\
uniform float externalAlphasArray[8];\n\
uniform vec2 uMinMaxAltitudes;\n\
\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
varying vec2 vTexCoord;   \n\
\n\
varying vec3 diffuseColor;\n\
uniform vec3 specularColor;\n\
varying float depthValue; // z buffer depth.\n\
    \n\
uniform float uTime;  \n\
\n\
uniform float externalAlpha;\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec3 vNormal;\n\
varying float currSunIdx;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
// Texture's vars.***\n\
varying float vTileDepth;\n\
\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
    float depth = dot( pack, 1.0 / vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return depth * (16777216.0) / (16777216.0 - 1.0);\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
  return enc;\n\
}   \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}\n\
\n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(diffuseTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		// in this shader the depthTex is \"diffuseTex\"\n\
		return unpackDepth(texture2D(diffuseTex, coord.xy));\n\
	}\n\
}\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/screenWidth;\n\
    float pixelSizeY = 1.0/screenHeight;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	vec2 origin = vec2(texCoord.x - pixelSizeX, texCoord.y - pixelSizeY);\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<3.0; i++)\n\
	{\n\
		depthA += getDepth(origin + offset1*(1.0+i*2.0));\n\
		depthB += getDepth(origin + offset2*(1.0+i*2.0));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*2.0, depthA/3.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*2.0, depthB/3.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
\n\
vec3 getRainbowColor_byHeight(float height)\n\
{\n\
	float minHeight_rainbow = -200.0;\n\
	float maxHeight_rainbow = 0.0;\n\
	\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
//#define SHOW_TILING\n\
#define TAU 6.28318530718 // https://www.shadertoy.com/view/4sXfDj\n\
#define MAX_ITER 5 // https://www.shadertoy.com/view/4sXfDj\n\
\n\
// Water Caustics with BCC-Noise :https://www.shadertoy.com/view/wlc3zr\n\
\n\
vec3 causticColor(vec2 texCoord)\n\
{\n\
	// To avoid mosaic repetitions.******************\n\
	float uPlus = texCoord.x - 1.0;\n\
	float vPlus = texCoord.y - 1.0;\n\
	//float timePlus = max(uPlus, vPlus);\n\
	float timePlus = uPlus + vPlus;\n\
	if(timePlus < 0.0)\n\
	timePlus = 0.0;\n\
	// End avoid mosaic repetitions.-------------------------\n\
	\n\
	// Water turbulence effect by joltz0r 2013-07-04, improved 2013-07-07\n\
	float time = (uTime+timePlus) * .5+23.0;\n\
    // uv should be the 0-1 uv of texture...\n\
\n\
	\n\
\n\
	vec2 uv = texCoord;\n\
    \n\
#ifdef SHOW_TILING\n\
	vec2 p = mod(uv*TAU*2.0, TAU)-250.0;\n\
#else\n\
    vec2 p = mod(uv*TAU, TAU)-250.0;\n\
#endif\n\
	vec2 i = vec2(p);\n\
	float c = 1.0;\n\
	float inten = .005;\n\
\n\
	for (int n = 0; n < MAX_ITER; n++) \n\
	{\n\
		float t = time * (1.0 - (3.5 / float(n+1)));\n\
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));\n\
		c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));\n\
	}\n\
	c /= float(MAX_ITER);\n\
	c = 1.17-pow(c, 1.4);\n\
	vec3 colour = vec3(pow(abs(c), 8.0));\n\
    colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);\n\
\n\
	#ifdef SHOW_TILING\n\
	// Flash tile borders...\n\
	vec2 pixel = 2.0 / vec2(screenWidth, screenHeight);//iResolution.xy;\n\
	uv *= 2.0;\n\
\n\
	float f = floor(mod(time*.5, 2.0)); 	// Flash value.\n\
	vec2 first = step(pixel, uv) * f;		   	// Rule out first screen pixels and flash.\n\
	uv  = step(fract(uv), pixel);				// Add one line of pixels per tile.\n\
	colour = mix(colour, vec3(1.0, 1.0, 0.0), (uv.x + uv.y) * first.x * first.y); // Yellow line\n\
	\n\
	#endif\n\
\n\
	return colour;\n\
}\n\
\n\
void getTextureColor(in int activeNumber, in vec4 currColor4, in vec2 texCoord,  inout bool victory, in float externalAlpha, inout vec4 resultTextureColor)\n\
{\n\
    if(activeNumber == 1)\n\
    {\n\
        if(currColor4.w > 0.0 && externalAlpha > 0.0)\n\
        {\n\
            if(victory)\n\
            {\n\
                resultTextureColor = mix(resultTextureColor, currColor4, currColor4.w*externalAlpha);\n\
            }\n\
            else{\n\
                currColor4.w *= externalAlpha;\n\
                resultTextureColor = currColor4;\n\
            }\n\
            \n\
            victory = true;\n\
        }\n\
    }\n\
    else if(activeNumber == 2)\n\
    {\n\
        // custom image.\n\
        // Check uExternalTexCoordsArray.\n\
        \n\
    }\n\
}\n\
\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
void main()\n\
{    \n\
	float depthAux = -depthValue;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half; //flogz = 1.0 + gl_Position.z;\n\
		depthAux = gl_FragDepthEXT;\n\
	}\n\
	#endif\n\
\n\
	vec2 texCoord;\n\
\n\
	vec4 textureColor = vec4(0.0);\n\
\n\
	if(colorType == 2) // texture color.\n\
	{\n\
		// Check if the texture is from a different depth tile texture.***\n\
		vec2 finalTexCoord = vTexCoord;\n\
		\n\
		if(textureFlipYAxis)\n\
		{\n\
			texCoord = vec2(finalTexCoord.s, 1.0 - finalTexCoord.t);\n\
		}\n\
		else{\n\
			texCoord = vec2(finalTexCoord.s, finalTexCoord.t);\n\
		}\n\
\n\
		bool firstColorSetted = false;\n\
\n\
		if(uActiveTextures[2] > 0 && uActiveTextures[2] != 10)\n\
			getTextureColor(uActiveTextures[2], texture2D(diffuseTex, texCoord), texCoord,  firstColorSetted, externalAlphasArray[2], textureColor);\n\
		if(uActiveTextures[3] > 0 && uActiveTextures[3] != 10)\n\
			getTextureColor(uActiveTextures[3], texture2D(diffuseTex_1, texCoord), texCoord,  firstColorSetted, externalAlphasArray[3], textureColor);\n\
		if(uActiveTextures[4] > 0 && uActiveTextures[4] != 10)\n\
			getTextureColor(uActiveTextures[4], texture2D(diffuseTex_2, texCoord), texCoord,  firstColorSetted, externalAlphasArray[4], textureColor);\n\
		if(uActiveTextures[5] > 0 && uActiveTextures[5] != 10)\n\
			getTextureColor(uActiveTextures[5], texture2D(diffuseTex_3, texCoord), texCoord,  firstColorSetted, externalAlphasArray[5], textureColor);\n\
		if(uActiveTextures[6] > 0 && uActiveTextures[6] != 10)\n\
			getTextureColor(uActiveTextures[6], texture2D(diffuseTex_4, texCoord), texCoord,  firstColorSetted, externalAlphasArray[6], textureColor);\n\
		if(uActiveTextures[7] > 0 && uActiveTextures[7] != 10)\n\
			getTextureColor(uActiveTextures[7], texture2D(diffuseTex_5, texCoord), texCoord,  firstColorSetted, externalAlphasArray[7], textureColor);\n\
\n\
		if(textureColor.w == 0.0)\n\
		{\n\
			discard;\n\
			//textureColor = vec4(1.0, 0.0, 1.0, 1.0); // test.\n\
		}\n\
\n\
	}\n\
	else{\n\
		textureColor = oneColor4;\n\
	}\n\
\n\
	textureColor.w = externalAlpha;\n\
	vec4 fogColor = vec4(0.9, 0.9, 0.9, 1.0);\n\
	\n\
	\n\
	// Dem image.***************************************************************************************************************\n\
	float altitude = 1000000.0;\n\
	if(uActiveTextures[5] == 10)\n\
	{\n\
		// Bathymetry.***\n\
		vec4 layersTextureColor = texture2D(diffuseTex_3, texCoord);\n\
		//if(layersTextureColor.w > 0.0)\n\
		{\n\
			// decode the grayScale.***\n\
			float sumAux = layersTextureColor.r;// + layersTextureColor.g + layersTextureColor.b;// + layersTextureColor.w;\n\
\n\
			float r = layersTextureColor.r*256.0;;\n\
			float g = layersTextureColor.g;\n\
			float b = layersTextureColor.b;\n\
\n\
			float maxHeight;\n\
			float minHeight;\n\
			float numDivs;\n\
			float increHeight;\n\
			float height;\n\
			\n\
			if(r < 0.0001)\n\
			{\n\
				// considering r=0.\n\
				minHeight = -2796.0;\n\
				maxHeight = -1000.0;\n\
				numDivs = 2.0;\n\
				increHeight = (maxHeight - minHeight)/(numDivs);\n\
				height = (256.0*g + b)/(128.0);\n\
			}\n\
			else if(r > 0.5 && r < 1.5)\n\
			{\n\
				// considering r=1.\n\
				minHeight = -1000.0;\n\
				maxHeight = -200.0;\n\
				numDivs = 2.0;\n\
				increHeight = (maxHeight - minHeight)/(numDivs);\n\
				height = (256.0*g + b)/(128.0);\n\
			}\n\
			else if(r > 1.5 && r < 2.5)\n\
			{\n\
				// considering r=2.\n\
				minHeight = -200.0;\n\
				maxHeight = 1.0;\n\
				numDivs = 123.0;\n\
				increHeight = (maxHeight - minHeight)/(numDivs);\n\
				height = (256.0*g + b)/(128.0);\n\
			}\n\
\n\
			height = (256.0*g + b)/(numDivs);\n\
			altitude = minHeight + height * (maxHeight -minHeight);\n\
		}\n\
	}\n\
	else if(uActiveTextures[5] == 20)\n\
	{\n\
		// waterMarkByAlpha.***\n\
		// Check only alpha component.\n\
		vec4 layersTextureColor = texture2D(diffuseTex_3, texCoord);\n\
		float alpha = layersTextureColor.a;\n\
		if(alpha > 0.0)\n\
		{\n\
			altitude = -100.0;\n\
		}\n\
		else\n\
		{\n\
			altitude = 100.0;\n\
		}\n\
	}\n\
\n\
	// End Dem image.------------------------------------------------------------------------------------------------------------\n\
	float linearDepthAux = 1.0;\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
\n\
	vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
\n\
	float linearDepth = getDepth(screenPos);  \n\
	linearDepthAux = linearDepth;\n\
\n\
	vec3 normalFromDepth = vec3(0.0, 0.0, 1.0);\n\
	//vec3 normalFromDepth = normal_from_depth(linearDepthAux, screenPos); // normal from depthTex.***\n\
	//vec2 screenPosAux = vec2(0.5, 0.5);\n\
\n\
	//vec3 rayAux = getViewRay(screenPosAux); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	//float scalarProd = dot(normalFromDepth, normalize(-rayAux));\n\
	//scalarProd /= 3.0;\n\
	//scalarProd += 0.666;\n\
\n\
	////scalarProd /= 2.0;\n\
	////scalarProd += 0.5;\n\
\n\
	float scalarProd = 1.0;\n\
	\n\
	if(altitude < 0.0)\n\
	{\n\
		float minHeight_rainbow = -100.0;\n\
		float maxHeight_rainbow = 0.0;\n\
		minHeight_rainbow = uMinMaxAltitudes.x;\n\
		maxHeight_rainbow = uMinMaxAltitudes.y;\n\
		\n\
		float gray = (altitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
		//float gray = (vAltitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
		//vec3 rainbowColor = getRainbowColor_byHeight(altitude);\n\
\n\
		// caustics.*********************\n\
		if(bApplyCaustics)\n\
		{\n\
			int tileDepth = int(floor(vTileDepth + 0.1));\n\
			if(uTime > 0.0 && tileDepth > 6 && gray > 0.0)//&& altitude > -120.0)\n\
			{\n\
				// Active this code if want same size caustic effects for different tileDepths.***\n\
				// Take tileDepth 14 as the unitary tile depth.\n\
				//float tileDethDiff = float(16 - tileDepth);\n\
				//vec2 cauticsTexCoord = texCoord*pow(2.0, tileDethDiff);\n\
				//-----------------------------------------------------------------------\n\
				vec2 cauticsTexCoord = texCoord;\n\
				vec3 causticColor = causticColor(cauticsTexCoord)*gray*0.3;\n\
				textureColor = vec4(textureColor.r+ causticColor.x, textureColor.g+ causticColor.y, textureColor.b+ causticColor.z, 1.0);\n\
			}\n\
		}\n\
		// End caustics.--------------------------\n\
		\n\
		if(gray < 0.05)\n\
		gray = 0.05;\n\
		float red = gray + 0.2;\n\
		float green = gray + 0.6;\n\
		float blue = gray*2.0 + 2.0;\n\
		fogColor = vec4(red, green, blue, 1.0);\n\
\n\
		// Something like to HillShade .*********************************************************************************\n\
		vec3 lightDir = normalize(vec3(1.0, 1.0, 0.0));\n\
		float scalarProd_2d = dot(lightDir, normalFromDepth);\n\
		\n\
		scalarProd_2d /= 2.0;\n\
		scalarProd_2d += 0.8;\n\
\n\
		//scalarProd_2d *= scalarProd_2d;\n\
		textureColor *= vec4(textureColor.r*scalarProd_2d, textureColor.g*scalarProd_2d, textureColor.b, textureColor.a);\n\
		// End Something like to HillShade.---------------------------------------------------------------------------------\n\
		\n\
		// End test drawing grid.---\n\
		//float specularReflectionCoef = 0.6;\n\
		//vec3 specularColor = vec3(0.8, 0.8, 0.8);\n\
		//textureColor = mix(textureColor, fogColor, 0.2); \n\
		//gl_FragData[0] = vec4(finalColor.xyz + specularReflectionCoef * specular * specularColor , 1.0); // with specular.***\n\
		gl_FragData[0] = vec4(textureColor.xyz * scalarProd, 1.0); // original.***\n\
\n\
		return;\n\
	}\n\
	//else{\n\
		\n\
		//if(uSeaOrTerrainType == 1)\n\
		//discard;\n\
	//}\n\
	\n\
	//vec4 finalColor = mix(textureColor, fogColor, vFogAmount); \n\
\n\
	//gl_FragData[0] = vec4(finalColor.xyz * scalarProd, 1.0); // original.***\n\
	//gl_FragData[0] = textureColor; // test.***\n\
	//gl_FragData[0] = vec4(vNormal.xyz, 1.0); // test.***\n\
	gl_FragData[0] = packDepth(depthAux);  // anything.\n\
\n\
	\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		gl_FragData[1] = packDepth(depthAux);  // depth.\n\
		vec3 normal = vNormal;\n\
		if(normal.z < 0.0)\n\
		normal *= -1.0;\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, 0.005); // normal.***\n\
		//gl_FragData[2] = vec4(0.0, 0.0, 1.0, 1.0); // normal.***\n\
		gl_FragData[3] = vec4(textureColor); // albedo.***\n\
	#endif\n\
	\n\
}";
ShaderSource.TinTerrainVS = "\n\
\n\
attribute vec3 position;\n\
attribute vec3 normal;\n\
//attribute vec4 color4;\n\
attribute vec2 texCoord;\n\
attribute float altitude;\n\
\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 sunDirWC;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bApplySpecularLighting;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
// geographic.\n\
uniform int uTileDepth;\n\
uniform vec4 uTileGeoExtent; // (minLon, minLat, maxLon, maxLat).\n\
uniform int uTileDepthOfBindedTextures; // The depth of the tileTexture binded. Normally uTileDepth = uTileDepthOfBindedTextures, but if current tile has no texturesPrepared, then bind ownerTexture and change texCoords.\n\
uniform vec4 uTileGeoExtentOfBindedTextures; // (minLon, minLat, maxLon, maxLat).\n\
\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;   \n\
varying vec3 v3Pos;\n\
varying float depthValue;\n\
varying float vFogAmount;\n\
\n\
varying vec3 vLightDir; \n\
varying float vAltitude;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
// Texture's vars.***\n\
varying float vTileDepth;\n\
varying float vTexTileDepth;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
#define M_E 2.7182818284590452353602875\n\
\n\
float roundCustom(float number)\n\
{\n\
	float numberResult = sign(number)*floor(abs(number)+0.5);\n\
	return numberResult;\n\
}\n\
\n\
float LatitudeRad_fromTexCoordY(float t, float minLatitudeRad, int tileDepth)\n\
{\n\
	// No used. Is not precise.\n\
	float PI_DIV_4 = M_PI/4.0;\n\
	float tileDepthFloat = float(tileDepth);\n\
	float aConst = (1.0/(2.0*M_PI))*pow(2.0, tileDepthFloat);\n\
\n\
	float minT = roundCustom( aConst*(M_PI-log(tan(PI_DIV_4+minLatitudeRad/2.0))) );\n\
	minT = 1.0 - minT;\n\
\n\
	float tAux = t + minT;\n\
	tAux = 1.0 - tAux;\n\
	float latRad = 2.0*(atan(exp(M_PI-tAux/aConst))-PI_DIV_4);\n\
	\n\
	return latRad;\n\
}\n\
\n\
float TexCoordY_fromLatitudeRad(float latitudeRad, float minLatitudeRad, int tileDepth, float aConst)\n\
{\n\
	float PI_DIV_4 = M_PI/4.0;\n\
	float minTTex = roundCustom(aConst*(M_PI-log(tan(PI_DIV_4+minLatitudeRad/2.0))));\n\
	minTTex = 1.0 - minTTex;\n\
\n\
	float newT = aConst*(M_PI-log(tan(PI_DIV_4+latitudeRad/2.0)));\n\
	newT = 1.0 - newT;\n\
	newT -= minTTex;\n\
\n\
	return newT;\n\
}\n\
\n\
void main()\n\
{	\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	vNormal = normalize((normalMatrix4 * vec4(normal.x, normal.y, normal.z, 1.0)).xyz); // original.***\n\
	vLightDir = vec3(normalMatrix4*vec4(sunDirWC.xyz, 1.0)).xyz;\n\
	vAltitude = altitude;\n\
\n\
	vTileDepth = float(uTileDepth);\n\
	vTexTileDepth = float(uTileDepthOfBindedTextures);\n\
	/*\n\
	if(bApplySpecularLighting)\n\
	{\n\
		applySpecLighting = 1.0;\n\
	}\n\
	else{\n\
		applySpecLighting = -1.0;\n\
	}\n\
	*/\n\
	v3Pos = (modelViewMatrixRelToEye * pos4).xyz;\n\
	depthValue = v3Pos.z/far;\n\
\n\
		vTexCoord = texCoord;\n\
\n\
\n\
		// ckeck if the texture is for this tile.\n\
		if(uTileDepth != uTileDepthOfBindedTextures)\n\
		{\n\
			float thisMinLon = uTileGeoExtent.x;\n\
			float thisMinLat = uTileGeoExtent.y;\n\
			float thisMaxLon = uTileGeoExtent.z;\n\
			float thisMaxLat = uTileGeoExtent.w;\n\
			float thisLonRange = (thisMaxLon - thisMinLon);\n\
\n\
			float thisMinLatRad = thisMinLat * M_PI/180.0;\n\
			float thisMaxLatRad = thisMaxLat * M_PI/180.0;\n\
\n\
			float texMinLon = uTileGeoExtentOfBindedTextures.x;\n\
			float texMinLat = uTileGeoExtentOfBindedTextures.y;\n\
			float texMaxLon = uTileGeoExtentOfBindedTextures.z;\n\
\n\
			float texLonRange = (texMaxLon - texMinLon);\n\
			float texMinLatRad = texMinLat * M_PI/180.0;\n\
\n\
\n\
			float currLon = thisMinLon + texCoord.x * thisLonRange;\n\
			float newS = (currLon - texMinLon) / texLonRange; // [0..1] range\n\
\n\
			float aConstTex = (1.0/(2.0*M_PI))*pow(2.0, float(uTileDepthOfBindedTextures));\n\
\n\
			float minT = TexCoordY_fromLatitudeRad(thisMinLatRad, texMinLatRad, uTileDepthOfBindedTextures, aConstTex); // [0..1] range\n\
			float maxT = TexCoordY_fromLatitudeRad(thisMaxLatRad, texMinLatRad, uTileDepthOfBindedTextures, aConstTex); // [0..1] range\n\
			float scaleT = maxT - minT;\n\
			float newT = minT + texCoord.y * scaleT;\n\
\n\
			vTexCoord = vec2(newS, newT);\n\
			\n\
\n\
			/*\n\
			// CRS84.**************************************************\n\
			// need know longitude & latitude of my texCoord.\n\
			float currLon = thisMinLon + texCoord.x * thisLonRange;\n\
			float currLat = thisMinLat + texCoord.y * thisLatRange;\n\
\n\
			// calculate my minLon relative to texture.***\n\
			float s = (currLon - texMinLon) / texLonRange; // [0..1] range\n\
			float t = (currLat - texMinLat) / texLatRange; // [0..1] range\n\
\n\
			vTexCoord = vec2(s, t);\n\
			*/\n\
		}\n\
		\n\
		\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://www.gamasutra.com/blogs/BranoKemen/20090812/85207/Logarithmic_Depth_Buffer.php\n\
		// z = log(C*z + 1) / log(C*Far + 1) * w\n\
		// https://android.developreference.com/article/21119961/Logarithmic+Depth+Buffer+OpenGL\n\
\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//---------------------------------------------------------------------------------\n\
\n\
		flogz = 1.0 - v3Pos.z;\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
\n\
	// calculate fog amount.\n\
	float fogParam = 1.15 * v3Pos.z/(far - 10000.0);\n\
	float fogParam2 = fogParam*fogParam;\n\
	vFogAmount = fogParam2*fogParam2;\n\
\n\
	if(vFogAmount < 0.0)\n\
	vFogAmount = 0.0;\n\
	else if(vFogAmount > 1.0)\n\
	vFogAmount = 1.0;\n\
	//vFogAmount = ((-v3Pos.z))/(far);\n\
}";
ShaderSource.update_frag = "precision highp float;\n\
\n\
uniform sampler2D u_particles;\n\
uniform sampler2D u_wind;\n\
uniform sampler2D u_windGlobeDepthTex;\n\
uniform sampler2D u_windGlobeNormalTex;\n\
\n\
uniform mat4 modelViewMatrixInv;\n\
\n\
uniform vec2 u_wind_res;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform vec3 u_geoCoordRadiansMax;\n\
uniform vec3 u_geoCoordRadiansMin;\n\
uniform float u_rand_seed;\n\
uniform float u_speed_factor;\n\
uniform float u_interpolation;\n\
uniform float u_drop_rate;\n\
uniform float u_drop_rate_bump;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform vec4 u_visibleTilesRanges[16];\n\
uniform int u_visibleTilesRangesCount;\n\
\n\
uniform float tangentOfHalfFovy;\n\
uniform float far;            \n\
uniform float aspectRatio; \n\
\n\
// new uniforms test.\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform mat4 buildingRotMatrixInv;\n\
uniform vec2 uNearFarArray[4];\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
// pseudo-random generator\n\
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
// https://community.khronos.org/t/random-values/75728\n\
float rand(const vec2 co) {\n\
    float t = dot(rand_constants.xy, co);\n\
    return fract(sin(t) * (rand_constants.z + t));\n\
}\n\
\n\
// wind speed lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation\n\
vec2 lookup_wind(const vec2 uv) {\n\
    //return texture2D(u_wind, uv).rg; // lower-res hardware filtering\n\
	\n\
    vec2 px = 1.0 / u_wind_res;\n\
    vec2 vc = (floor(uv * u_wind_res)) * px;\n\
    vec2 f = fract(uv * u_wind_res);\n\
    vec2 tl = texture2D(u_wind, vc).rg;\n\
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;\n\
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;\n\
    vec2 br = texture2D(u_wind, vc + px).rg;\n\
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n\
	\n\
}\n\
\n\
\n\
vec2 getOffset(vec2 particlePos, float radius)\n\
{\n\
	// \"particlePos\" is a unitary position.\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
\n\
	float distortion = cos((minLatRad + particlePos.y * latRadRange ));\n\
	float xOffset = (particlePos.x - 0.5)*distortion * lonRadRange * radius;\n\
	float yOffset = (0.5 - particlePos.y) * latRadRange * radius;\n\
\n\
	return vec2(xOffset, yOffset);\n\
}\n\
/*\n\
vec3 get_NDCCoord(in vec2 pos)\n\
{\n\
	// calculate the offset at the earth radius.***\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	vec2 offset = getOffset(pos, radius);\n\
\n\
	float xOffset = offset.x;\n\
	float yOffset = offset.y;\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);\n\
	\n\
	vec4 position = vec4((rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow) + ( buildingPosHIGH - encodedCameraPositionMCHigh), 1.0);\n\
	\n\
	// Now calculate the position on camCoord.***\n\
	vec4 posCC = ModelViewProjectionMatrixRelToEye * position;\n\
	vec3 ndc_coord = vec3(posCC.xyz/posCC.w);\n\
\n\
	return ndc_coord;\n\
}\n\
*/\n\
\n\
bool is_NDCCoord_InsideOfFrustum(in vec3 ndc_coord)\n\
{\n\
	bool pointIsInside = true;\n\
\n\
	float ndc_x = ndc_coord.x;\n\
	float ndc_y = ndc_coord.y;\n\
\n\
	if(ndc_x < -1.0)\n\
		return false;\n\
	else if(ndc_x > 1.0)\n\
		return false;\n\
	else if(ndc_y < -1.0)\n\
		return false;\n\
	else if(ndc_y > 1.0)\n\
		return false;\n\
	\n\
	return pointIsInside;\n\
}\n\
\n\
bool isPointInsideOfFrustum(in vec2 pos)\n\
{\n\
	bool pointIsInside = true;\n\
	\n\
	// calculate the offset at the earth radius.***\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	vec2 offset = getOffset(pos, radius);\n\
\n\
	float xOffset = offset.x;\n\
	float yOffset = offset.y;\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);\n\
	\n\
	vec4 position = vec4(( rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow ) + ( buildingPosHIGH - encodedCameraPositionMCHigh ), 1.0);\n\
	\n\
	// Now calculate the position on camCoord.***\n\
	vec4 posCC = ModelViewProjectionMatrixRelToEye * position;\n\
	vec3 ndc_pos = vec3(posCC.xyz/posCC.w);\n\
\n\
	return is_NDCCoord_InsideOfFrustum(ndc_pos);\n\
}\n\
\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
    return ray;                      \n\
} \n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(u_windGlobeNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
void main() {\n\
    vec4 color = texture2D(u_particles, v_tex_pos);\n\
    vec2 pos = vec2(\n\
        color.r / 255.0 + color.b,\n\
        color.g / 255.0 + color.a); // decode particle position from pixel RGBA\n\
	vec2 windMapTexCoord = pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(windMapTexCoord));\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
	// Calculate pixelSizes.**************************************************************************************************\n\
	\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
\n\
	float distortion = cos((minLatRad + pos.y * latRadRange ));\n\
\n\
	float meterToLon = 1.0/(radius * distortion);\n\
	float meterToLat = 1.0 / radius;\n\
\n\
	float xSpeedFactor = meterToLon / lonRadRange;\n\
	float ySpeedFactor = meterToLat / latRadRange;\n\
\n\
	xSpeedFactor *= 3.0 * u_speed_factor;\n\
	ySpeedFactor *= 3.0 * u_speed_factor;\n\
\n\
	vec2 offset = vec2(velocity.x / distortion * xSpeedFactor, -velocity.y * ySpeedFactor);\n\
\n\
	// End ******************************************************************************************************************\n\
\n\
	\n\
\n\
    // update particle position, wrapping around the date line\n\
    pos = fract(1.0 + pos + offset);\n\
\n\
\n\
    // drop rate is a chance a particle will restart at random position, to avoid degeneration\n\
	float drop = 0.0;\n\
\n\
	//if(u_interpolation < 0.99) // 0.9\n\
	//{\n\
	//	drop = 0.0;\n\
	//}\n\
	//else\n\
	{\n\
		// a random seed to use for the particle drop\n\
		vec2 seed = (pos + v_tex_pos) * u_rand_seed;\n\
		float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;\n\
		drop = step(1.0 - drop_rate, rand(seed));\n\
	}\n\
	/*\n\
	if(drop > 0.5) // 0.01\n\
	{\n\
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );\n\
		float randomValue = (u_rand_seed);\n\
		int index = int(floor(float(u_visibleTilesRangesCount+1)*(randomValue)));\n\
		for(int i=0; i<32; i++)\n\
		{\n\
			if(i >= u_visibleTilesRangesCount)\n\
			break;\n\
		\n\
			if(i == index)\n\
			{\n\
				vec4 posAux4 = u_visibleTilesRanges[i];\n\
				float width = (posAux4.z-posAux4.x);\n\
				float height = (posAux4.w-posAux4.y);\n\
				float scaledX = posAux4.x + random_pos.x*width;\n\
				float scaledY = posAux4.y + random_pos.y*height;\n\
				random_pos = vec2(scaledX, 1.0-scaledY);\n\
				pos = random_pos;\n\
				break;\n\
			}\n\
		}\n\
	}\n\
	*/\n\
	if(drop > 0.01)\n\
	{\n\
		// Intersection ray with globe mode:\n\
		vec2 random_screenPos = vec2( rand(pos), rand(v_tex_pos) );\n\
		vec4 normal4 = getNormal(random_screenPos);\n\
		vec3 normal = normal4.xyz;\n\
		if(length(normal) < 0.1)\n\
		{\n\
			// do nothing.\n\
		}\n\
		else\n\
		{\n\
			int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
			int dataType = -1;\n\
			int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
			vec2 nearFar_origin = getNearFar_byFrustumIdx(currFrustumIdx);\n\
			float currNear_origin = nearFar_origin.x;\n\
			float currFar_origin = nearFar_origin.y;\n\
\n\
			vec4 depth4 = texture2D(u_windGlobeDepthTex, random_screenPos);\n\
			float linearDepth = unpackDepth(depth4);\n\
			float relativeFar = linearDepth * currFar_origin;\n\
			vec3 posCC = getViewRay(random_screenPos, relativeFar);  \n\
			vec4 posWC = modelViewMatrixInv * vec4(posCC, 1.0);\n\
\n\
			// convert nearP(wc) to local coord.\n\
			posWC.x -= (buildingPosHIGH.x + buildingPosLOW.x);\n\
			posWC.y -= (buildingPosHIGH.y + buildingPosLOW.y);\n\
			posWC.z -= (buildingPosHIGH.z + buildingPosLOW.z);\n\
\n\
			vec4 posLC = buildingRotMatrixInv * vec4(posWC.xyz, 1.0);\n\
\n\
			// now, convert localPos to unitary-offset position.\n\
			float minLonRad = u_geoCoordRadiansMin.x;\n\
			float maxLonRad = u_geoCoordRadiansMax.x;\n\
			float minLatRad = u_geoCoordRadiansMin.y;\n\
			float maxLatRad = u_geoCoordRadiansMax.y;\n\
			float lonRadRange = maxLonRad - minLonRad;\n\
			float latRadRange = maxLatRad - minLatRad;\n\
\n\
			// Calculate the inverse of xOffset & yOffset.****************************************\n\
			// Remember : float xOffset = (particlePos.x - 0.5)*distortion * lonRadRange * radius;\n\
			// Remember : float yOffset = (0.5 - particlePos.y) * latRadRange * radius;\n\
			//------------------------------------------------------------------------------------\n\
			\n\
			float unitaryOffset_y = 0.5 - (posLC.y / (latRadRange * radius));\n\
			float distortion = cos((minLatRad + unitaryOffset_y * latRadRange ));\n\
			float unitaryOffset_x = (posLC.x /(distortion * lonRadRange * radius)) + 0.5;\n\
\n\
			pos = vec2(unitaryOffset_x, unitaryOffset_y);\n\
		}\n\
	}\n\
	\n\
	/*\n\
	if(drop > 0.01)\n\
	{\n\
		// Methode 2:\n\
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );\n\
		\n\
		// New version:\n\
		// try to born inside of the camera's frustum.\n\
\n\
		vec2 posA = vec2(pos);\n\
		vec2 posB = vec2(v_tex_pos);\n\
		bool isInsideOfFrustum = false;\n\
		for(int i=0; i<30; i++)\n\
		{\n\
			if(isPointInsideOfFrustum(random_pos))\n\
			{\n\
				isInsideOfFrustum = true;\n\
				break;\n\
			}\n\
			else\n\
			{\n\
				posA.x = random_pos.y;\n\
				posA.y = random_pos.x;\n\
\n\
				posB.x = random_pos.x;\n\
				posB.y = random_pos.y;\n\
\n\
				random_pos = vec2( rand(posA), rand(posB) );\n\
			}\n\
		}\n\
\n\
		pos = random_pos;\n\
	}\n\
	*/\n\
\n\
    // encode the new particle position back into RGBA\n\
    gl_FragColor = vec4(\n\
        fract(pos * 255.0),\n\
        floor(pos * 255.0) / 255.0);\n\
}";
ShaderSource.vectorMeshClampToTerrainFS = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
void main() {\n\
	gl_FragColor = vColor;\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.vectorMeshClampToTerrainVS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth; // no use.\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
\n\
vec4 getPointRelToEye(in vec4 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
}\n\
\n\
void main(){\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
	\n\
	float order_w = current.w;\n\
	//float order_w = float(order);\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
	\n\
	float aspect = viewport.x / viewport.y;\n\
	vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
	// Get 2D screen space with W divide and aspect correction\n\
	vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;\n\
	vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;\n\
	vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n\
					\n\
	// This helps us handle 90 degree turns correctly\n\
	vec2 tangentNext = normalize(nextScreen - currentScreen);\n\
	vec2 tangentPrev = normalize(currentScreen - previousScreen);\n\
	vec2 normal; \n\
	if(orderInt == 1 || orderInt == -1)\n\
	{\n\
		normal = vec2(-tangentPrev.y, tangentPrev.x);\n\
	}\n\
	else{\n\
		normal = vec2(-tangentNext.y, tangentNext.x);\n\
	}\n\
	normal *= thickness/2.0;\n\
	normal.x /= aspect;\n\
	float direction = (thickness*sense*projectedDepth)/1000.0;\n\
	// Offset our position along the normal\n\
	vec4 offset = vec4(normal * direction, 0.0, 1.0);\n\
	gl_Position = currentProjected + offset; \n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			float Fcoef = 2.0 / log2(far + 1.0);\n\
			//gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
	\n\
	if(colorType == 0)\n\
		vColor = oneColor4;\n\
	else if(colorType == 1)\n\
		vColor = color4; //vec4(color4.r+0.8, color4.g+0.8, color4.b+0.8, color4.a+0.8);\n\
	else\n\
		vColor = oneColor4;\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.waterCalculateContaminationFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D currWaterFluxTex_HIGH;\n\
uniform sampler2D currWaterFluxTex_LOW;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
varying vec2 v_tex_pos; // texCoords.\n\
#define PI 3.1415926\n\
\n\
uniform float u_SimRes;\n\
uniform float u_PipeLen; // pipeLen = cellSizeX = cellSizeY.\n\
uniform float u_timestep;\n\
uniform float u_PipeArea;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_waterMaxFlux;\n\
uniform float u_waterMaxVelocity;\n\
uniform float u_contaminantMaxHeigh;\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
vec2 encodeVelocity(in vec2 vel)\n\
{\n\
	return vel*0.5 + 0.5;\n\
}\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    float decoded = unpackDepth(color4);\n\
    float contaminHeight = decoded * u_contaminantMaxHeigh;\n\
    return contaminHeight;\n\
}\n\
\n\
vec4 getWaterFlux(in vec2 texCoord)\n\
{\n\
    vec4 color4_HIGH = texture2D(currWaterFluxTex_HIGH, texCoord);\n\
    vec4 color4_LOW = texture2D(currWaterFluxTex_LOW, texCoord);\n\
\n\
    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));\n\
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));\n\
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));\n\
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));\n\
\n\
    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_waterMaxFlux;\n\
    return flux; \n\
}\n\
\n\
void encodeWaterFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)\n\
{\n\
    vec2 encoded_top_flux = encodeRG(flux.r);\n\
    vec2 encoded_right_flux = encodeRG(flux.g);\n\
    vec2 encoded_bottom_flux = encodeRG(flux.b);\n\
    vec2 encoded_left_flux = encodeRG(flux.a);\n\
\n\
    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);\n\
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);\n\
    curuv = v_tex_pos;\n\
\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
    float cellArea = cellSize_x * cellSize_y;\n\
\n\
    vec4 topflux = getWaterFlux(curuv + vec2(0.0, divY));\n\
    vec4 rightflux = getWaterFlux(curuv + vec2(divX, 0.0));\n\
    vec4 bottomflux = getWaterFlux(curuv + vec2(0.0, -divY));\n\
    vec4 leftflux = getWaterFlux(curuv + vec2(-divX, 0.0));\n\
    vec4 curflux = getWaterFlux(curuv);\n\
    //vec4 curT = texture2D(terrainHeightTex, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    //curT = u_heightMap_MinMax.x + curT * u_heightMap_MinMax.y;\n\
    float topWH = getWaterHeight(curuv + vec2(0.0, divY));\n\
    float rightWH = getWaterHeight(curuv + vec2(divX, 0.0));\n\
    float bottomWH = getWaterHeight(curuv + vec2(0.0, -divY));\n\
    float leftWH = getWaterHeight(curuv + vec2(-divX, 0.0));\n\
    float currWH = getWaterHeight(curuv);\n\
    \n\
    float topContaminHeight = getContaminantHeight(curuv + vec2(0.0, divY));\n\
    float rightContaminHeight = getContaminantHeight(curuv + vec2(divX, 0.0));\n\
    float bottomContaminHeight = getContaminantHeight(curuv + vec2(0.0, -divY));\n\
    float leftContaminHeight = getContaminantHeight(curuv + vec2(-divX, 0.0));\n\
    float currContaminHeight = getContaminantHeight(curuv);\n\
\n\
    \n\
    \n\
    //out flow flux\n\
    float ftopout = curflux.x;\n\
    float frightout = curflux.y;\n\
    float fbottomout = curflux.z;\n\
    float fleftout = curflux.w;\n\
\n\
    vec4 outputflux = curflux;\n\
    vec4 inputflux = vec4(topflux.z, rightflux.w, bottomflux.x, leftflux.y);\n\
\n\
    float fout = ftopout + frightout + fbottomout + fleftout;\n\
    float fin = inputflux.x + inputflux.y + inputflux.z + inputflux.w;\n\
\n\
    \n\
\n\
    float deltaH = u_timestep * (fin - fout) / cellArea; \n\
    //---------------------------------------------------------------------------------\n\
    // do contaminant flux interchange.\n\
    // Top.***\n\
    float topOutContaminH = (curflux.x * u_timestep / cellArea) * (currContaminHeight / currWH);\n\
    float topInContaminH = (topflux.z * u_timestep / cellArea) * (topContaminHeight / topWH);\n\
    float topContaminDelta = topInContaminH - topOutContaminH;\n\
\n\
    // Right.***\n\
    float rightOutContaminH = (curflux.y * u_timestep / cellArea) * (currContaminHeight / currWH);\n\
    float rightInContaminH = (rightflux.w * u_timestep / cellArea) * (rightContaminHeight / rightWH);\n\
    float rightContaminDelta = rightInContaminH - rightOutContaminH;\n\
\n\
    // Bottom.***\n\
    float bottomOutContaminH = (curflux.z * u_timestep / cellArea) * (currContaminHeight / currWH);\n\
    float bottomInContaminH = (bottomflux.x * u_timestep / cellArea) * (bottomContaminHeight / bottomWH);\n\
    float bottomContaminDelta = bottomInContaminH - bottomOutContaminH;\n\
\n\
    // Left.***\n\
    float leftOutContaminH = (curflux.w * u_timestep / cellArea) * (currContaminHeight / currWH);\n\
    float leftInContaminH = (leftflux.y * u_timestep / cellArea) * (leftContaminHeight / leftWH);\n\
    float leftContaminDelta = leftInContaminH - leftOutContaminH;\n\
\n\
    float newContaminantHeight = max(0.0, topContaminDelta + rightContaminDelta + bottomContaminDelta + leftContaminDelta);\n\
    //----------------------------------------------------------------------------------\n\
\n\
    //float d1 = cur.y + curs.x; // original. (waterH + sedimentH).\n\
    float d1 = currWH;\n\
    float d2 = d1 + deltaH;\n\
    float da = (d1 + d2)/2.0;\n\
\n\
    vec2 veloci = vec2(inputflux.w - outputflux.w + outputflux.y - inputflux.y, inputflux.z - outputflux.z + outputflux.x - inputflux.x) / 2.0;\n\
\n\
    vec4 shaderLogColor4 = vec4(0.0);\n\
\n\
    if(da <= 1e-8) \n\
    {\n\
        veloci = vec2(0.0);\n\
    }\n\
    else\n\
    {\n\
        //veloci = veloci/(da * u_PipeLen);\n\
        veloci = veloci/(da * vec2(cellSize_y, cellSize_x));\n\
    }\n\
\n\
    if(curuv.x <= divX) { deltaH = 0.0; veloci = vec2(0.0); }\n\
    if(curuv.x >= 1.0 - 2.0 * divX) { deltaH = 0.0; veloci = vec2(0.0); }\n\
    if(curuv.y <= divY) { deltaH = 0.0; veloci = vec2(0.0); }\n\
    if(curuv.y >= 1.0 - 2.0 * divY) { deltaH = 0.0; veloci = vec2(0.0); }\n\
\n\
    //  float absx = abs(veloci.x);\n\
    //  float absy = abs(veloci.y);\n\
    //  float maxxy = max(absx, absy);\n\
    //  float minxy = min(absx, absy);\n\
    //  float tantheta = minxy / maxxy;\n\
    //  float scale = cos(45.0 * PI / 180.0 - atan(tantheta));\n\
    //  float divtheta = (1.0/sqrt(2.0)) / scale;\n\
    //  float divs = min(abs(veloci.x), abs(veloci.y))/max(abs(veloci.x), abs(veloci.y));\n\
    //  if((divs) > 20.0){\n\
    //    veloci /= 20.0;\n\
    //  }\n\
\n\
    \n\
\n\
    vec2 encodedVelocity = encodeVelocity(veloci/u_waterMaxVelocity);\n\
    vec4 writeVel = vec4(encodedVelocity, 0.0, 1.0);\n\
    //vec4 writeWaterHeight = vec4(cur.x,max(cur.y+deltavol, 0.0),cur.z,cur.w); // original.***\n\
\n\
    // test debug:\n\
    //if(abs(veloci.x) > 40.0 || abs(veloci.y) > 40.0)\n\
    {\n\
        shaderLogColor4 = vec4(encodedVelocity, 0.0, 1.0);\n\
    }\n\
\n\
    float waterHeight = max(currWH + deltaH, 0.0); // original.***\n\
    waterHeight /= u_waterMaxHeigh; // original.***\n\
\n\
    vec4 encodedWH = packDepth(waterHeight);\n\
    gl_FragData[0] = encodedWH;  // water height.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = writeVel; // velocity\n\
        gl_FragData[2] = shaderLogColor4; // \n\
        gl_FragData[3] = vec4(0.0); // \n\
        gl_FragData[4] = vec4(0.0); // \n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateFluxFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D contaminantHeightTex;\n\
uniform sampler2D currWaterFluxTex_HIGH;\n\
uniform sampler2D currWaterFluxTex_LOW;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_waterMaxFlux;\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform float u_contaminantMaxHeigh; // if \"u_contaminantMaxHeigh\" < 0.0 -> no exist contaminant.\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
uniform int u_terrainHeightEncodingBytes;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_contaminantMaxHeigh;\n\
\n\
    return waterHeight;\n\
}\n\
\n\
vec4 getWaterFlux(in vec2 texCoord)\n\
{\n\
    vec4 color4_HIGH = texture2D(currWaterFluxTex_HIGH, texCoord);\n\
    vec4 color4_LOW = texture2D(currWaterFluxTex_LOW, texCoord);\n\
\n\
    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));\n\
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));\n\
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));\n\
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));\n\
\n\
    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_waterMaxFlux;\n\
    return flux; \n\
}\n\
\n\
void encodeWaterFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)\n\
{\n\
    vec2 encoded_top_flux = encodeRG(flux.r);\n\
    vec2 encoded_right_flux = encodeRG(flux.g);\n\
    vec2 encoded_bottom_flux = encodeRG(flux.b);\n\
    vec2 encoded_left_flux = encodeRG(flux.a);\n\
\n\
    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);\n\
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);\n\
}\n\
\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    if(u_terrainHeightEncodingBytes == 1)\n\
    {\n\
        float terainHeight = texture2D(terrainHeightTex, texCoord).r;\n\
        terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
        return terainHeight;\n\
    }\n\
    else if(u_terrainHeightEncodingBytes == 2)\n\
    {\n\
        // 4byte mode.***\n\
        vec4 terrainEncoded = texture2D(terrainHeightTex, texCoord);\n\
        float terainHeight = decodeRG(terrainEncoded.rg);\n\
        terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
        return terainHeight;\n\
    }\n\
    else if(u_terrainHeightEncodingBytes == 4)\n\
    {\n\
        // 4byte mode.***\n\
        vec4 terrainEncoded = texture2D(terrainHeightTex, texCoord);\n\
        float terainHeight = unpackDepth(terrainEncoded);\n\
        terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
        return terainHeight;\n\
    }\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
\n\
    // Terrain & water heights.**************************************************************************************************\n\
    // read terrain heights.\n\
    float topTH = getTerrainHeight(curuv + vec2(0.0, divY));\n\
    float rightTH = getTerrainHeight(curuv + vec2(divX, 0.0));\n\
    float bottomTH = getTerrainHeight(curuv + vec2(0.0, -divY));\n\
    float leftTH = getTerrainHeight(curuv + vec2(-divX, 0.0));\n\
    float curTH = getTerrainHeight(curuv);\n\
\n\
    // read water heights.\n\
    float topWH = getWaterHeight(curuv + vec2(0.0, divY));\n\
    float rightWH = getWaterHeight(curuv + vec2(divX, 0.0));\n\
    float bottomWH = getWaterHeight(curuv + vec2(0.0, -divY));\n\
    float leftWH = getWaterHeight(curuv + vec2(-divX, 0.0));\n\
    float curWH = getWaterHeight(curuv);\n\
\n\
    float topCH = 0.0;\n\
    float rightCH = 0.0;\n\
    float bottomCH = 0.0;\n\
    float leftCH = 0.0;\n\
    float curCH = 0.0;\n\
\n\
    // Check if exist contaminant.\n\
    if(u_contaminantMaxHeigh > 0.0)\n\
    {\n\
        // exist contaminant.\n\
        topCH = getContaminantHeight(curuv + vec2(0.0, divY));\n\
        rightCH = getContaminantHeight(curuv + vec2(divX, 0.0));\n\
        bottomCH = getContaminantHeight(curuv + vec2(0.0, -divY));\n\
        leftCH = getContaminantHeight(curuv + vec2(-divX, 0.0));\n\
        curCH = getContaminantHeight(curuv);\n\
    }\n\
\n\
    // End terrain & water heights.-----------------------------------------------------------------------------------------------\n\
\n\
    // Calculate deltaPresure: deltaP_ij(x,y) = ro*g* deltaH_ij(x,y).*************************************************************\n\
    // calculate deltaH.***\n\
    // Provisionally considere contaminant density equal to water density.\n\
    float curTotalH = curTH + curWH + curCH;\n\
    float HTopOut = curTotalH - (topTH + topWH + topCH);\n\
    float HRightOut = curTotalH - (rightTH + rightWH + rightCH);\n\
    float HBottomOut = curTotalH - (bottomTH + bottomWH + bottomCH);\n\
    float HLeftOut = curTotalH - (leftTH + leftWH + leftCH);\n\
    float gravity = 9.8;\n\
    float waterDensity = 997.0; // 997kg/m3.\n\
    vec4 deltaP = vec4(waterDensity * gravity * HTopOut, \n\
                        waterDensity * gravity * HRightOut, \n\
                        waterDensity * gravity * HBottomOut, \n\
                        waterDensity * gravity * HLeftOut ); // deltaP = kg/(m*s2) = Pa.\n\
\n\
    // calculate water acceleration.*********************************************************************************************\n\
    vec4 waterAccel = vec4(deltaP.x/(waterDensity * cellSize_x),\n\
                            deltaP.y/(waterDensity * cellSize_y),\n\
                            deltaP.z/(waterDensity * cellSize_x),\n\
                            deltaP.w/(waterDensity * cellSize_y));\n\
\n\
    // read flux.\n\
    vec4 curFlux = getWaterFlux(curuv);\n\
\n\
    // calculate the new flux.\n\
    float pipeArea = cellSize_x * cellSize_y;\n\
    vec4 newFlux = u_timestep * pipeArea * waterAccel;\n\
\n\
    // total outFlux.\n\
    float cushionFactor = 0.9999; // esmorteiment.\n\
    float ftopout = max(0.0, curFlux.x + newFlux.x) * cushionFactor;\n\
    float frightout = max(0.0, curFlux.y + newFlux.y) * cushionFactor;\n\
    float fbottomout = max(0.0, curFlux.z + newFlux.z) * cushionFactor;\n\
    float fleftout = max(0.0, curFlux.w + newFlux.w) * cushionFactor;\n\
\n\
    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.\n\
\n\
    // calculate vOut & currVolum.\n\
    float vOut = u_timestep * (ftopout + frightout + fbottomout + fleftout); \n\
\n\
    float currWaterVol = (curWH + curCH) * pipeArea;\n\
\n\
    if(vOut > currWaterVol)\n\
    {\n\
        //rescale outflow readFlux so that outflow don't exceed current water volume\n\
        float factor = (currWaterVol / vOut);\n\
        ftopout *= factor;\n\
        frightout *= factor;\n\
        fbottomout *= factor;\n\
        fleftout *= factor;\n\
    }\n\
\n\
    \n\
    /*\n\
    //boundary conditions\n\
    if(curuv.x <= div) fleftout = 0.0;\n\
    if(curuv.x >= 1.0 - 2.0 * div) frightout = 0.0;\n\
    if(curuv.y <= div) ftopout = 0.0;\n\
    if(curuv.y >= 1.0 - 2.0 * div) fbottomout = 0.0;\n\
\n\
    if(curuv.x <= div || (curuv.x >= 1.0 - 2.0 * div) || (curuv.y <= div) || (curuv.y >= 1.0 - 2.0 * div) ){\n\
        ftopout = 0.0;\n\
        frightout = 0.0;\n\
        fbottomout = 0.0;\n\
        fleftout = 0.0;\n\
    }\n\
    */\n\
\n\
    vec4 outFlux = vec4(ftopout, frightout, fbottomout, fleftout) / u_waterMaxFlux;\n\
    vec4 flux_high;\n\
    vec4 flux_low;\n\
    encodeWaterFlux(outFlux, flux_high, flux_low);\n\
\n\
    gl_FragData[0] = flux_high;  // water flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = flux_low; // water flux low.\n\
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.\n\
        gl_FragData[3] = shaderLogFluxColor4; // albedo\n\
        gl_FragData[4] = shaderLogFluxColor4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateHeightContaminationFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D waterSourceTex;\n\
uniform sampler2D rainTex; // if exist.\n\
uniform sampler2D currWaterHeightTex;\n\
uniform sampler2D currContaminationHeightTex;\n\
uniform sampler2D contaminantSourceTex;\n\
\n\
uniform bool u_existRain;\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_contaminantMaxHeigh;\n\
uniform float u_fluidMaxHeigh;\n\
uniform float u_fluidHeigh;\n\
uniform float u_timestep;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec4 vColor4;\n\
\n\
vec4 packDepth( float v ) {\n\
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
    enc = fract(enc);\n\
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
    return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
/*\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(currWaterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
*/\n\
\n\
void main()\n\
{\n\
    float unitaryHeight = u_fluidHeigh / u_fluidMaxHeigh;\n\
    vec4 encodedHeight = packDepth(unitaryHeight);\n\
    gl_FragData[0] = encodedHeight;\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0, 0.0, 0.5, 1.0); // water source\n\
        gl_FragData[2] = vec4(1.0, 0.0, 0.5, 1.0); // normal\n\
        gl_FragData[3] = vec4(1.0, 0.0, 0.5, 1.0); // albedo\n\
        gl_FragData[4] = vec4(1.0, 0.0, 0.5, 1.0); // selection color\n\
    #endif\n\
}";
ShaderSource.waterCalculateHeightFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D waterSourceTex;\n\
uniform sampler2D rainTex; // if exist.\n\
uniform sampler2D currWaterHeightTex;\n\
uniform sampler2D currContaminationHeightTex;\n\
uniform sampler2D contaminantSourceTex;\n\
uniform sampler2D waterAditionTex;\n\
\n\
uniform bool u_existRain;\n\
uniform int u_rainType; // 0= rain value (mm/h), 1= rain texture.\n\
uniform float u_rainValue_mmHour;\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_contaminantMaxHeigh;\n\
uniform float u_increTimeSeconds;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
vec4 packDepth( float v ) {\n\
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
    enc = fract(enc);\n\
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
    return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
/*\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(currWaterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
*/\n\
\n\
void main()\n\
{\n\
    // 1rst, take the water source.\n\
    vec4 currWaterHeight = texture2D(currWaterHeightTex, v_tex_pos);\n\
    vec4 waterSource = texture2D(waterSourceTex, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
    //vec4 waterSource = vec4(0.0, 0.0, 0.0, 0.01);\n\
\n\
    float decodedCurrWaterHeight = unpackDepth(currWaterHeight) * u_waterMaxHeigh;\n\
    float decodedSourceWaterHeight = unpackDepth(waterSource) * u_waterMaxHeigh;\n\
\n\
    float finalWaterHeight = decodedSourceWaterHeight; // init value.***\n\
    //finalWaterHeight = 0.0;\n\
\n\
    vec4 shaderLogColor4 = vec4(0.0, 0.0, 0.0, 1.0);\n\
\n\
    if(finalWaterHeight < 0.0)\n\
    {\n\
        shaderLogColor4 = vec4(1.0, 0.0, 1.0, 1.0);\n\
    }\n\
\n\
    if(finalWaterHeight < decodedCurrWaterHeight)\n\
    {\n\
        finalWaterHeight = decodedCurrWaterHeight;\n\
        shaderLogColor4 = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
\n\
\n\
    // add rain.\n\
    if(u_existRain)\n\
    {\n\
        // rain : mm/h.***\n\
        vec4 rain = texture2D(rainTex, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
        float rainHeight = unpackDepth(rain) * u_waterMaxHeigh;\n\
        finalWaterHeight += rainHeight;\n\
    }\n\
\n\
    if(u_rainType == 0)\n\
    {\n\
        float rain_mm = (u_rainValue_mmHour/ 3600.0) * u_increTimeSeconds;\n\
        finalWaterHeight += rain_mm / 1000.0;\n\
    }\n\
\n\
    vec4 waterAdition = texture2D(waterAditionTex, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    float waterAditionHeight = unpackDepth(waterAdition) * u_waterMaxHeigh;\n\
    finalWaterHeight += waterAditionHeight;\n\
\n\
    if(finalWaterHeight > u_waterMaxHeigh)\n\
    {\n\
        shaderLogColor4 = vec4(0.0, 1.0, 0.5, 1.0);\n\
    }\n\
    \n\
\n\
    vec4 finalWaterHeight4 = packDepth(finalWaterHeight / u_waterMaxHeigh);\n\
\n\
    // Contamination Height.********************************************************************************\n\
    vec4 contaminSourceHeight = vec4(0.0);\n\
    if(u_contaminantMaxHeigh > 0.0)\n\
    {\n\
        // check if exist contaminant.\n\
        contaminSourceHeight = texture2D(contaminantSourceTex, v_tex_pos);\n\
        vec4 currContaminHeight = texture2D(currContaminationHeightTex, v_tex_pos);\n\
\n\
        float decodedSourceContaminHeight = unpackDepth(contaminSourceHeight);\n\
        float decodedCurrContaminHeight = unpackDepth(currContaminHeight);\n\
        if(decodedSourceContaminHeight < decodedCurrContaminHeight)\n\
        {\n\
            contaminSourceHeight = currContaminHeight;\n\
        }\n\
    }\n\
\n\
    \n\
    gl_FragData[0] = finalWaterHeight4;  // waterHeight.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = contaminSourceHeight; // contamination\n\
        gl_FragData[2] = shaderLogColor4; // normal\n\
        gl_FragData[3] = vec4(1.0, 0.0, 0.5, 1.0); // albedo\n\
        gl_FragData[4] = vec4(1.0, 0.0, 0.5, 1.0); // selection color\n\
    #endif\n\
}";
ShaderSource.waterCalculateSedimentFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D currWaterFluxTex;\n\
uniform sampler2D sedimentHeightTex;\n\
\n\
varying vec2 v_tex_pos; // texCoords.\n\
#define PI 3.1415926\n\
\n\
uniform float u_SimRes;\n\
uniform float u_PipeLen;\n\
uniform float u_Ks;\n\
uniform float u_Kc;\n\
uniform float u_Kd;\n\
uniform float u_timestep;\n\
\n\
uniform float u_PipeArea;\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform float u_waterMaxHeigh;\n\
\n\
/*\n\
vec3 calnor(vec2 uv){\n\
  float eps = 1.f/u_SimRes;\n\
  vec4 cur = texture(readTerrain,uv);\n\
  vec4 r = texture(readTerrain,uv+vec2(eps,0.f));\n\
  vec4 t = texture(readTerrain,uv+vec2(0.f,eps));\n\
  vec4 b = texture(readTerrain,uv+vec2(0.f,-eps));\n\
  vec4 l = texture(readTerrain,uv+vec2(-eps,0.f));\n\
\n\
  vec3 nor = vec3(l.x - r.x, 2.0, t.x - b.x);\n\
  nor = normalize(nor);\n\
  return nor;\n\
}\n\
*/\n\
\n\
void main()\n\
{\n\
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);\n\
    curuv = v_tex_pos;\n\
\n\
\n\
\n\
    gl_FragData[0] = vec4(0.0);  // water flux.\n\
\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(0.0); // velocity\n\
        gl_FragData[2] = vec4(0.0); // \n\
        gl_FragData[3] = vec4(0.0); // \n\
        gl_FragData[4] = vec4(0.0); // \n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateTerrainFluxFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D terrainMaxSlippageTex;\n\
\n\
varying vec2 v_tex_pos;\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform float u_terrainMaxFlux;\n\
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.\n\
uniform float u_contaminantMaxHeigh; // if \"u_contaminantMaxHeigh\" < 0.0 -> no exist contaminant.\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainHeightTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
float getMaxSlippage(in vec2 texCoord)\n\
{\n\
    // Note : for maxSlippage use \"u_heightMap_MinMax.y\" as quantizer.\n\
    vec4 encoded = texture2D(terrainMaxSlippageTex, texCoord);\n\
    float decoded = unpackDepth(encoded);\n\
    decoded = decoded * u_heightMap_MinMax.y;\n\
    return decoded;\n\
}\n\
\n\
void encodeFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)\n\
{\n\
    vec2 encoded_top_flux = encodeRG(flux.r);\n\
    vec2 encoded_right_flux = encodeRG(flux.g);\n\
    vec2 encoded_bottom_flux = encodeRG(flux.b);\n\
    vec2 encoded_left_flux = encodeRG(flux.a);\n\
\n\
    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);\n\
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.\n\
\n\
    // Terrain heights.**************************************************************************************************\n\
    float topTH = getTerrainHeight(curuv + vec2(0.0, divY));\n\
    float rightTH = getTerrainHeight(curuv + vec2(divX, 0.0));\n\
    float bottomTH = getTerrainHeight(curuv + vec2(0.0, -divY));\n\
    float leftTH = getTerrainHeight(curuv + vec2(-divX, 0.0));\n\
    float curTH = getTerrainHeight(curuv);\n\
    // End terrain heights.-----------------------------------------------------------------------------------------------\n\
\n\
    // MaxSlippges.******************************************************************************************************\n\
    float topSlip = getMaxSlippage(curuv + vec2(0.0, divY));\n\
    float rightSlip = getMaxSlippage(curuv + vec2(divX, 0.0));\n\
    float bottomSlip = getMaxSlippage(curuv + vec2(0.0, -divY));\n\
    float leftSlip = getMaxSlippage(curuv + vec2(-divX, 0.0));\n\
    float curSlip = getMaxSlippage(curuv);\n\
    // End max slippages.-------------------------------------------------------------------------------------------------\n\
\n\
\n\
    vec4 diff;\n\
    diff.x = curTH - topTH - (curSlip + topSlip) * 0.5;\n\
    diff.y = curTH - rightTH - (curSlip + rightSlip) * 0.5;\n\
    diff.z = curTH - bottomTH - (curSlip + bottomSlip) * 0.5;\n\
    diff.w = curTH - leftTH - (curSlip + leftSlip) * 0.5;\n\
\n\
    diff = max(vec4(0.0), diff);\n\
\n\
    //vec4 newFlow = diff * 0.2;\n\
    vec4 newFlow = diff;\n\
\n\
    float outfactor = (newFlow.x + newFlow.y + newFlow.z + newFlow.w)*u_timestep;\n\
\n\
    if(outfactor > 1e-5){\n\
        outfactor = curTH / outfactor;\n\
        if(outfactor > 1.0) outfactor = 1.0;\n\
        newFlow = newFlow * outfactor;\n\
    \n\
        shaderLogFluxColor4 = vec4(1.0, 0.5, 0.25, 1.0);\n\
    }\n\
\n\
    /*\n\
    if(outfactor > curTH){\n\
        float factor = (curTH / outfactor);\n\
        newFlow *= factor;\n\
        shaderLogFluxColor4 = vec4(1.0, 0.5, 0.25, 1.0);\n\
    }\n\
    */\n\
    \n\
\n\
    /*\n\
    if(vOut > currWaterVol)\n\
    {\n\
        //rescale outflow readFlux so that outflow don't exceed current water volume\n\
        float factor = (currWaterVol / vOut);\n\
        ftopout *= factor;\n\
        frightout *= factor;\n\
        fbottomout *= factor;\n\
        fleftout *= factor;\n\
    }\n\
\n\
    \n\
    /*\n\
    //boundary conditions\n\
    if(curuv.x <= div) fleftout = 0.0;\n\
    if(curuv.x >= 1.0 - 2.0 * div) frightout = 0.0;\n\
    if(curuv.y <= div) ftopout = 0.0;\n\
    if(curuv.y >= 1.0 - 2.0 * div) fbottomout = 0.0;\n\
\n\
    if(curuv.x <= div || (curuv.x >= 1.0 - 2.0 * div) || (curuv.y <= div) || (curuv.y >= 1.0 - 2.0 * div) ){\n\
        ftopout = 0.0;\n\
        frightout = 0.0;\n\
        fbottomout = 0.0;\n\
        fleftout = 0.0;\n\
    }\n\
    */\n\
\n\
    vec4 outFlux = newFlow / u_terrainMaxFlux;\n\
    vec4 flux_high;\n\
    vec4 flux_low;\n\
    encodeFlux(outFlux, flux_high, flux_low);\n\
\n\
    shaderLogFluxColor4 = outFlux;\n\
\n\
    gl_FragData[0] = flux_high;  // water flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = flux_low; // water flux low.\n\
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.\n\
        gl_FragData[3] = shaderLogFluxColor4; // albedo\n\
        gl_FragData[4] = shaderLogFluxColor4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateTerrainHeightByFluxFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D terrainFluxTex_HIGH;\n\
uniform sampler2D terrainFluxTex_LOW;\n\
\n\
varying vec2 v_tex_pos;\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.\n\
uniform float u_terrainMaxFlux;\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainHeightTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
vec4 getTerrainFlux(in vec2 texCoord)\n\
{\n\
    vec4 color4_HIGH = texture2D(terrainFluxTex_HIGH, texCoord);\n\
    vec4 color4_LOW = texture2D(terrainFluxTex_LOW, texCoord);\n\
\n\
    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));\n\
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));\n\
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));\n\
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));\n\
\n\
    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_terrainMaxFlux;\n\
    return flux; \n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.\n\
\n\
    // Terrain height.\n\
    float curTH = getTerrainHeight(curuv);\n\
\n\
    // Terrain fluxes.\n\
    vec4 topFlux = getTerrainFlux(curuv + vec2(0.0, divY));\n\
    vec4 rightFlux = getTerrainFlux(curuv + vec2(divX, 0.0));\n\
    vec4 bottomFlux = getTerrainFlux(curuv + vec2(0.0, -divY));\n\
    vec4 leftFlux = getTerrainFlux(curuv + vec2(-divX, 0.0));\n\
\n\
    vec4 outFlux = getTerrainFlux(curuv);\n\
    vec4 inputFlux = vec4(topFlux.z, rightFlux.w, bottomFlux.x, leftFlux.y);\n\
\n\
    float vol = inputFlux.x + inputFlux.y + inputFlux.z + inputFlux.w - outFlux.x - outFlux.y - outFlux.z - outFlux.w;\n\
\n\
    float thermalErosionScale = 2.6;\n\
    thermalErosionScale = 1.0;\n\
    //float tdelta = min(10.0, u_timestep * thermalErosionScale) * vol; // original.\n\
    float tdelta = (u_timestep * thermalErosionScale) * vol;\n\
    float newTerrainHeight = curTH + tdelta;\n\
    newTerrainHeight = (newTerrainHeight - u_heightMap_MinMax.x) / (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    vec4 newTH4 = vec4(newTerrainHeight, newTerrainHeight, newTerrainHeight, 1.0);\n\
\n\
    shaderLogFluxColor4 = outFlux;\n\
\n\
    gl_FragData[0] = newTH4;  // water flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = shaderLogFluxColor4; // water flux low.\n\
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.\n\
        gl_FragData[3] = shaderLogFluxColor4; // albedo\n\
        gl_FragData[4] = shaderLogFluxColor4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateTerrainMaxSlippageFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D terrainHeightTex;\n\
\n\
varying vec2 v_tex_pos;\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainHeightTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    //float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    //float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.\n\
\n\
    // Terrain heights.**************************************************************************************************\n\
    float topTH = getTerrainHeight(curuv + vec2(0.0, divY));\n\
    float rightTH = getTerrainHeight(curuv + vec2(divX, 0.0));\n\
    float bottomTH = getTerrainHeight(curuv + vec2(0.0, -divY));\n\
    float leftTH = getTerrainHeight(curuv + vec2(-divX, 0.0));\n\
    float curTH = getTerrainHeight(curuv);\n\
    // End terrain heights.-----------------------------------------------------------------------------------------------\n\
\n\
    // Calculate maxSlippge.***\n\
    float _maxHeightDiff = 3.0;\n\
    //float maxLocalDiff = _maxHeightDiff * 0.01; // original.**\n\
    float maxLocalDiff = _maxHeightDiff * 0.01;\n\
    float avgDiff = (topTH + rightTH + bottomTH + leftTH) * 0.25 - curTH;\n\
    //avgDiff = 10.0 * max(abs(avgDiff) - maxLocalDiff, 0.0); // original.\n\
    avgDiff = 1.0 * max(abs(avgDiff) - maxLocalDiff, 0.0);\n\
\n\
    float maxSlippage = max(_maxHeightDiff - avgDiff, 0.0);\n\
\n\
    // now, encode the maxSlippage value.\n\
    // Note : for maxSlippage use \"u_heightMap_MinMax.y\" as quantizer.\n\
    maxSlippage = maxSlippage / u_heightMap_MinMax.y;\n\
    //maxSlippage *= 100.0; // test.\n\
    //maxSlippage *= 10.0; // test.\n\
    shaderLogFluxColor4 = vec4(maxSlippage, 0.0, 0.0, 1.0);\n\
\n\
\n\
    vec4 maxslippage4 = packDepth(maxSlippage);\n\
    //vec4 maxslippage4 = vec4(maxSlippage, 0.0, 0.0, 1.0); // test.***\n\
\n\
    gl_FragData[0] = maxslippage4;  // water flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = shaderLogFluxColor4; // water flux low.\n\
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.\n\
        gl_FragData[3] = shaderLogFluxColor4; // albedo\n\
        gl_FragData[4] = shaderLogFluxColor4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateVelocityFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D currWaterFluxTex_HIGH;\n\
uniform sampler2D currWaterFluxTex_LOW;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
varying vec2 v_tex_pos; // texCoords.\n\
#define PI 3.1415926\n\
\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_heightMap_MinMax; // terrain min max heights. no used.\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_waterMaxFlux;\n\
uniform float u_waterMaxVelocity;\n\
uniform float u_contaminantMaxHeigh;\n\
\n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
vec2 encodeVelocity(in vec2 vel)\n\
{\n\
	return vel*0.5 + 0.5;\n\
}\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_contaminantMaxHeigh;\n\
\n\
    return waterHeight;\n\
}\n\
\n\
vec4 getWaterFlux(in vec2 texCoord)\n\
{\n\
    vec4 color4_HIGH = texture2D(currWaterFluxTex_HIGH, texCoord);\n\
    vec4 color4_LOW = texture2D(currWaterFluxTex_LOW, texCoord);\n\
\n\
    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));\n\
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));\n\
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));\n\
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));\n\
\n\
    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_waterMaxFlux;\n\
    return flux; \n\
}\n\
\n\
void encodeWaterFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)\n\
{\n\
    vec2 encoded_top_flux = encodeRG(flux.r);\n\
    vec2 encoded_right_flux = encodeRG(flux.g);\n\
    vec2 encoded_bottom_flux = encodeRG(flux.b);\n\
    vec2 encoded_left_flux = encodeRG(flux.a);\n\
\n\
    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);\n\
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);\n\
    curuv = v_tex_pos;\n\
\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
\n\
    float cellArea = cellSize_x * cellSize_y;\n\
    float timeStep_divCellArea = u_timestep / cellArea;;\n\
\n\
    vec4 topflux = getWaterFlux(curuv + vec2(0.0, divY));\n\
    vec4 rightflux = getWaterFlux(curuv + vec2(divX, 0.0));\n\
    vec4 bottomflux = getWaterFlux(curuv + vec2(0.0, -divY));\n\
    vec4 leftflux = getWaterFlux(curuv + vec2(-divX, 0.0));\n\
    vec4 curflux = getWaterFlux(curuv);\n\
\n\
    //out flow flux\n\
    float ftopout = curflux.x;\n\
    float frightout = curflux.y;\n\
    float fbottomout = curflux.z;\n\
    float fleftout = curflux.w;\n\
\n\
    vec4 outputflux = curflux;\n\
    vec4 inputflux = vec4(topflux.z, rightflux.w, bottomflux.x, leftflux.y);\n\
\n\
    // Now, calculate the contamination trasference.**************************************************\n\
    // read water heights.\n\
\n\
    float topWH = getWaterHeight(curuv + vec2(0.0, divY));\n\
    float rightWH = getWaterHeight(curuv + vec2(divX, 0.0));\n\
    float bottomWH = getWaterHeight(curuv + vec2(0.0, -divY));\n\
    float leftWH = getWaterHeight(curuv + vec2(-divX, 0.0));\n\
    float curWH = getWaterHeight(curuv);\n\
\n\
    float topCH = 0.0;\n\
    float rightCH = 0.0;\n\
    float bottomCH = 0.0;\n\
    float leftCH = 0.0;\n\
    float curCH = 0.0;\n\
\n\
    // Check if exist contaminant.\n\
    if(u_contaminantMaxHeigh > 0.0)\n\
    {\n\
        // exist contaminant.\n\
        topCH = getContaminantHeight(curuv + vec2(0.0, divY));\n\
        rightCH = getContaminantHeight(curuv + vec2(divX, 0.0));\n\
        bottomCH = getContaminantHeight(curuv + vec2(0.0, -divY));\n\
        leftCH = getContaminantHeight(curuv + vec2(-divX, 0.0));\n\
        curCH = getContaminantHeight(curuv);\n\
    }\n\
\n\
    // calculate contaminat ratio.\n\
    float topContaminPerUnit = topCH / (topCH + topWH);\n\
    float rightContaminPerUnit = rightCH / (rightCH + rightWH);\n\
    float bottomContaminPerUnit = bottomCH / (bottomCH + bottomWH);\n\
    float leftContaminPerUnit = leftCH / (leftCH + leftWH);\n\
\n\
    // calculate input waterHeight & contaminHeight.\n\
    float inputTopTotalH = inputflux.x * timeStep_divCellArea;\n\
    float inputRightTotalH = inputflux.y * timeStep_divCellArea;\n\
    float inputBottomTotalH = inputflux.z * timeStep_divCellArea;\n\
    float inputLeftTotalH = inputflux.w * timeStep_divCellArea;\n\
\n\
    float inputTopCH = inputTopTotalH * topContaminPerUnit;\n\
    float inputRightCH = inputRightTotalH * rightContaminPerUnit;\n\
    float inputBottomCH = inputBottomTotalH * bottomContaminPerUnit;\n\
    float inputLeftCH = inputLeftTotalH * leftContaminPerUnit;\n\
\n\
    float inputTopWH = inputTopTotalH - inputTopCH;\n\
    float inputRightWH = inputRightTotalH - inputRightCH;\n\
    float inputBottomWH = inputBottomTotalH - inputBottomCH;\n\
    float inputLeftWH = inputLeftTotalH - inputLeftCH;\n\
\n\
    // Now, calculate outputs.\n\
    float currContaminPerUnit = curCH / (curCH + curWH);\n\
    float outputTotalH = (ftopout + frightout + fbottomout + fleftout) * timeStep_divCellArea;\n\
    float outputCH = outputTotalH * currContaminPerUnit;\n\
    float outputWH = outputTotalH - outputCH;\n\
\n\
    // Now, calculate delt-water-H & delta-contaminant-H.\n\
    float deltaWH = inputTopWH + inputRightWH + inputBottomWH + inputLeftWH - outputWH;\n\
    float deltaCH = inputTopCH + inputRightCH + inputBottomCH + inputLeftCH - outputCH;\n\
    float deltaH = deltaWH + deltaCH;\n\
    //------------------------------------------------------------------------------------------------\n\
\n\
    //vec4 curT = texture2D(terrainHeightTex, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    //curT = u_heightMap_MinMax.x + curT * u_heightMap_MinMax.y;\n\
\n\
    float fout = ftopout + frightout + fbottomout + fleftout;\n\
    float fin = inputflux.x + inputflux.y + inputflux.z + inputflux.w;\n\
\n\
    //float deltaH = u_timestep * (fin - fout) / cellArea; \n\
    //---------------------------------------------------------------------------------\n\
\n\
    \n\
\n\
    //float d1 = cur.y + curs.x; // original. (waterH + sedimentH).\n\
    float d1 = curWH + curCH;\n\
    float d2 = d1 + deltaH;\n\
    float da = (d1 + d2)/2.0;\n\
\n\
    vec2 veloci = vec2(inputflux.w - outputflux.w + outputflux.y - inputflux.y, inputflux.z - outputflux.z + outputflux.x - inputflux.x) / 2.0;\n\
\n\
    vec4 shaderLogColor4 = vec4(0.0);\n\
\n\
    //if(da <= 1e-8) // original.***\n\
    if(da <= 1e-8) //\n\
    {\n\
        veloci = vec2(0.0);\n\
    }\n\
    else\n\
    {\n\
        ////veloci = veloci/(da * u_PipeLen);\n\
        veloci = veloci/(da * vec2(cellSize_y, cellSize_x)); // original.***\n\
    }\n\
\n\
    if(curuv.x <= divX) \n\
    { \n\
        deltaWH = 0.0; \n\
        deltaCH = 0.0; \n\
        veloci = vec2(0.0); \n\
    }\n\
    if(curuv.x >= 1.0 - 2.0 * divX) \n\
    { \n\
        deltaWH = 0.0; \n\
        deltaCH = 0.0; \n\
        veloci = vec2(0.0); \n\
    }\n\
    if(curuv.y <= divY) \n\
    { \n\
        deltaWH = 0.0; \n\
        deltaCH = 0.0; \n\
        veloci = vec2(0.0); \n\
    }\n\
    if(curuv.y >= 1.0 - 2.0 * divY) \n\
    { \n\
        deltaWH = 0.0; \n\
        deltaCH = 0.0; \n\
        veloci = vec2(0.0); \n\
    }\n\
\n\
    //  float absx = abs(veloci.x);\n\
    //  float absy = abs(veloci.y);\n\
    //  float maxxy = max(absx, absy);\n\
    //  float minxy = min(absx, absy);\n\
    //  float tantheta = minxy / maxxy;\n\
    //  float scale = cos(45.0 * PI / 180.0 - atan(tantheta));\n\
    //  float divtheta = (1.0/sqrt(2.0)) / scale;\n\
    //  float divs = min(abs(veloci.x), abs(veloci.y))/max(abs(veloci.x), abs(veloci.y));\n\
    //  if((divs) > 20.0){\n\
    //    veloci /= 20.0;\n\
    //  }\n\
\n\
    \n\
    // test debug::::::::::::::\n\
    //veloci = vec2(0.0); // delete this.***\n\
\n\
    vec2 encodedVelocity = encodeVelocity(veloci/u_waterMaxVelocity);\n\
    vec4 writeVel = vec4(encodedVelocity, 0.0, 1.0);\n\
    //vec4 writeWaterHeight = vec4(cur.x,max(cur.y+deltavol, 0.0),cur.z,cur.w); // original.***\n\
\n\
    // test debug:\n\
    //if(abs(veloci.x) > 40.0 || abs(veloci.y) > 40.0)\n\
    {\n\
        shaderLogColor4 = vec4(encodedVelocity, 0.0, 1.0);\n\
    }\n\
\n\
    float waterHeight = max(curWH + deltaWH, 0.0); // original.***\n\
    vec4 encodedWH = packDepth(waterHeight / u_waterMaxHeigh);\n\
    gl_FragData[0] = encodedWH;  // water height.\n\
\n\
    vec4 encodedCH = vec4(0.0);\n\
    if(u_contaminantMaxHeigh > 0.0)\n\
    {\n\
        float contaminantHeight = max(curCH + deltaCH, 0.0);\n\
        encodedCH = packDepth(contaminantHeight / u_contaminantMaxHeigh);\n\
    }\n\
\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = writeVel; // velocity\n\
        gl_FragData[2] = encodedCH; // contaminatHeight if exist.\n\
        gl_FragData[3] = vec4(0.0); // \n\
        gl_FragData[4] = vec4(0.0); // \n\
    #endif\n\
\n\
    \n\
\n\
}";
ShaderSource.waterCopyFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texToCopy;\n\
uniform bool u_textureFlipYAxis;\n\
varying vec2 v_tex_pos;\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
    }\n\
    else\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    }\n\
    \n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = finalCol4; // depth\n\
        gl_FragData[2] = finalCol4; // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = finalCol4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterDEMTexFromQuantizedMeshFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform vec2 u_minMaxHeights;\n\
uniform int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform vec4 u_oneColor4;\n\
uniform int u_terrainHeightEncodingBytes;\n\
\n\
varying vec3 vPos;\n\
varying vec4 vColor4;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4 = vec4(vPos.z, vPos.z, vPos.z, 1.0); // original.***\n\
    if(u_terrainHeightEncodingBytes == 1)\n\
    {\n\
        finalCol4 = vec4(vPos.z, vPos.z, vPos.z, 1.0); \n\
    }\n\
    else if(u_terrainHeightEncodingBytes == 2)\n\
    {\n\
        finalCol4 = vec4(encodeRG(vPos.z), 0.0, 1.0); // 2byte height.\n\
    }\n\
    else if(u_terrainHeightEncodingBytes == 4)\n\
    {\n\
        finalCol4 = packDepth(vPos.z); \n\
    }\n\
\n\
    if(colorType == 1)\n\
    {\n\
        //finalCol4 = vColor4;\n\
        finalCol4 = u_oneColor4;\n\
    }\n\
\n\
    //-------------------------------------------------------------------------------------------------------------\n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0); // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterDepthRenderFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane\n\
\n\
//in vec3 fs_Pos;\n\
//in vec4 fs_Nor;\n\
//in vec4 fs_Col;\n\
\n\
uniform sampler2D hightmap;\n\
uniform sampler2D normap;\n\
uniform sampler2D sceneDepth;\n\
uniform sampler2D colorReflection;\n\
uniform sampler2D sedimap;\n\
\n\
//in float fs_Sine;\n\
//in vec2 fs_Uv;\n\
//layout (location = 0) out vec4 out_Col; // This is the final output color that you will see on your\n\
//layout (location = 1) out vec4 col_reflect;\n\
                  // screen for the pixel that is currently being processed.\n\
uniform vec3 u_Eye, u_Ref, u_Up;\n\
\n\
\n\
uniform int u_TerrainType;\n\
uniform float u_WaterTransparency;\n\
uniform float u_SimRes;\n\
uniform vec2 u_Dimensions;\n\
uniform vec3 unif_LightPos;\n\
uniform float u_far;\n\
uniform float u_near;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying float vWaterHeight;\n\
varying float depth;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
/*\n\
vec3 calnor(vec2 uv){\n\
    float eps = 1.0/u_SimRes;\n\
    vec4 cur = texture(hightmap,uv);\n\
    vec4 r = texture(hightmap,uv+vec2(eps,0.f));\n\
    vec4 t = texture(hightmap,uv+vec2(0.f,eps));\n\
\n\
    vec3 n1 = normalize(vec3(-1.0, cur.y + cur.x - r.y - r.x, 0.f));\n\
    vec3 n2 = normalize(vec3(-1.0, t.x + t.y - r.y - r.x, 1.0));\n\
\n\
    vec3 nor = -cross(n1,n2);\n\
    nor = normalize(nor);\n\
    return nor;\n\
}\n\
\n\
vec3 sky(in vec3 rd){\n\
    return mix(vec3(0.6,0.6,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));\n\
}\n\
\n\
float linearDepth(float depthSample)\n\
{\n\
    depthSample = 2.0 * depthSample - 1.0;\n\
    float zLinear = 2.0 * u_near * u_far / (u_far + u_near - depthSample * (u_far - u_near));\n\
    return zLinear;\n\
}\n\
*/\n\
void main()\n\
{\n\
    if(vWaterHeight < 0.0001)\n\
    {\n\
        discard;\n\
    }\n\
\n\
    float depthAux = depth;\n\
\n\
    #ifdef USE_LOGARITHMIC_DEPTH\n\
	//if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		depthAux = gl_FragDepthEXT; \n\
	}\n\
	#endif\n\
\n\
    vec4 finalCol4 = vec4(vColorAuxTest);\n\
    \n\
    // save depth, normal, albedo.\n\
    vec4 encodedDepth = packDepth(depthAux); \n\
	gl_FragData[0] = encodedDepth; \n\
\n\
    //gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = encodedDepth; // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = vec4(1.0); // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
    /*\n\
    vec2 uv = vec2(gl_FragCoord.xy/u_Dimensions);\n\
    float terrainDepth = texture(sceneDepth,uv).x;\n\
    float sediment = texture(sedimap,fs_Uv).x;\n\
    float waterDepth = gl_FragCoord.z;\n\
\n\
    terrainDepth = linearDepth(terrainDepth);\n\
    waterDepth = linearDepth(waterDepth);\n\
\n\
    float dpVal = 180.0 * max(0.0,terrainDepth - waterDepth);\n\
    dpVal = clamp(dpVal, 0.0,4.0);\n\
    //dpVal = pow(dpVal, 0.1);\n\
\n\
\n\
    float fbias = 0.2;\n\
    float fscale = 0.2;\n\
    float fpow = 22.0;\n\
    vec3 sundir = unif_LightPos;\n\
\n\
    sundir = normalize(sundir);\n\
\n\
    vec3 nor = -calnor(fs_Uv);\n\
    vec3 viewdir = normalize(u_Eye - fs_Pos);\n\
    vec3 lightdir = normalize(sundir);\n\
    vec3 halfway = normalize(lightdir + viewdir);\n\
    vec3 reflectedSky = sky(halfway);\n\
    float spec = pow(max(dot(nor, halfway), 0.0), 333.0);\n\
\n\
\n\
    float R = max(0.0, min(1.0, fbias + fscale * pow(1.0 + dot(viewdir, -nor), fpow)));\n\
\n\
    //lamb =1.f;\n\
\n\
    float yval = texture(hightmap,fs_Uv).x * 4.0;\n\
    float wval = texture(hightmap,fs_Uv).y;\n\
    wval /= 1.0;\n\
\n\
\n\
\n\
    vec3 watercolor = mix(vec3(0.8,0.0,0.0), vec3(0.0,0.0,0.8), sediment * 2.0);\n\
    vec3 watercolorspec = vec3(1.0);\n\
    watercolorspec *= spec;\n\
\n\
\n\
\n\
    out_Col = vec4(vec3(0.0,0.2,0.5) + R * reflectedSky + watercolorspec  , (.5 + spec) * u_WaterTransparency * dpVal);\n\
    col_reflect = vec4(1.0);\n\
    */\n\
}";
ShaderSource.waterDepthRenderVS = "\n\
//#version 300 es\n\
\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
    \n\
uniform mat4 u_Model;\n\
uniform mat4 u_ModelInvTr;\n\
uniform mat4 u_ViewProj;\n\
uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_contaminantMaxHeigh;\n\
\n\
\n\
varying vec4 vColorAuxTest;\n\
varying float vWaterHeight;\n\
varying float depth;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_contaminantMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainmap, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * u_heightMap_MinMax.y;\n\
    return terainHeight;\n\
}\n\
\n\
void main()\n\
{\n\
	// read the altitude from hightmap.\n\
	float waterHeight = getWaterHeight(vec2(texCoord.x, texCoord.y));\n\
\n\
	float contaminantHeight = 0.0;\n\
	// check if exist contaminat.\n\
	if(u_contaminantMaxHeigh > 0.0)\n\
	{\n\
		// exist contaminant.\n\
		contaminantHeight = getContaminantHeight(texCoord);\n\
	}\n\
\n\
	float terrainHeight = getTerrainHeight(texCoord);\n\
	float height = terrainHeight + waterHeight + contaminantHeight;\n\
\n\
	vWaterHeight = waterHeight + contaminantHeight; // needed to discard if waterHeight is small.\n\
\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	// calculate the up direction:\n\
	vec4 posWC = vec4(objPosLow + objPosHigh, 1.0);\n\
	vec3 upDir = normalize(posWC.xyz);\n\
\n\
	vec4 finalPos4 =  vec4(pos4.x + upDir.x * height, pos4.y + upDir.y * height, pos4.z + upDir.z * height, 1.0);\n\
\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * finalPos4;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * finalPos4;\n\
	depth = (-orthoPos.z)/(far); // the correct value.\n\
	\n\
}\n\
";
ShaderSource.WaterOrthogonalDepthShaderFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D currDEMTex;\n\
\n\
uniform vec2 u_heightMap_MinMax; // terrain min max heights. \n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec3 u_quantizedVolume_MinMax[2]; // the minimum is [0,0,0], and the maximum is [1,1,1].***\n\
uniform int u_terrainHeightEncodingBytes;\n\
\n\
//******************************************\n\
// u_processType = 0 -> overWriteDEM.\n\
// u_processType = 1 -> excavation.\n\
// u_processType = 2 -> overWrite but only partially, limited by \"u_quantizedVolume_MinMax\".\n\
//                      if a fragment is out of \"u_quantizedVolume_MinMax\", then discard.***\n\
//                      This mode is developed to use when render in sound simulation, with camera in yAxis direction.***\n\
uniform int u_processType;\n\
//------------------------------------------\n\
\n\
\n\
varying float vDepth;\n\
varying float vAltitude;\n\
varying vec4 glPos;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(currDEMTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
void main()\n\
{     \n\
    vec2 screenPos = vec2(gl_FragCoord.x / u_simulationTextureSize.x, gl_FragCoord.y / u_simulationTextureSize.y);\n\
\n\
    // read the currentDEM depth.\n\
    float curTerrainHeght = texture2D(currDEMTex, screenPos).r;\n\
    float newTerrainHeght = ((vAltitude - u_heightMap_MinMax.x)/(u_heightMap_MinMax.y - u_heightMap_MinMax.x));\n\
\n\
    //******************************************\n\
    // u_processType = 0 -> overWriteDEM.\n\
    // u_processType = 1 -> excavation.\n\
    //------------------------------------------\n\
\n\
    if(u_processType == 0)\n\
    {\n\
        // if u_processType = 0 -> overWriteDEM.\n\
        if(newTerrainHeght < curTerrainHeght)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else if(u_processType == 1)\n\
    {\n\
        // if u_processType = 1 -> excavation.\n\
        // in this process, the meshses must be rendered in frontFace = CW.***\n\
        if(newTerrainHeght > curTerrainHeght)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else if(u_processType == 2)\n\
    {\n\
        // if u_processType = 1 ->  overWrite but only partially, limited by \"u_quantizedVolume_MinMax\".\n\
        // Check if the current fragment is inside of the u_quantizedVolume_MinMax.***\n\
        vec3 quantizedVolumeMin = u_quantizedVolume_MinMax[0];\n\
        vec3 quantizedVolumeMax = u_quantizedVolume_MinMax[1];\n\
        vec3 quantizedPos = glPos.xyz * 0.5 + 0.5;\n\
\n\
        if(quantizedPos.x < quantizedVolumeMin.x || quantizedPos.x > quantizedVolumeMax.x)\n\
        {\n\
            discard;\n\
        }\n\
        else if(quantizedPos.y < quantizedVolumeMin.y || quantizedPos.y > quantizedVolumeMax.y)\n\
        {\n\
            discard;\n\
        }\n\
        else if(quantizedPos.z < quantizedVolumeMin.z || quantizedPos.z > quantizedVolumeMax.z)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    \n\
    vec4 depthColor4 = vec4(newTerrainHeght, newTerrainHeght, newTerrainHeght, 1.0); // 1byte height.\n\
    if(u_terrainHeightEncodingBytes == 1)\n\
    {\n\
        depthColor4 = vec4(newTerrainHeght, newTerrainHeght, newTerrainHeght, 1.0); // 1byte height.\n\
    }\n\
    else if(u_terrainHeightEncodingBytes == 2)\n\
    {\n\
        depthColor4 = vec4(encodeRG(newTerrainHeght), 0.0, 1.0); // 2byte height.\n\
    }\n\
    else if(u_terrainHeightEncodingBytes == 4)\n\
    {\n\
        depthColor4 = packDepth(newTerrainHeght); // 4byte height.\n\
    }\n\
\n\
    gl_FragData[0] = depthColor4;\n\
\n\
    vec4 shaderLogColor4 = vec4(0.0);\n\
    if(vAltitude < u_heightMap_MinMax.x)\n\
    {\n\
        shaderLogColor4 = vec4(0.0, 1.0, 0.0, 1.0);\n\
    }\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = shaderLogColor4; // depth\n\
        gl_FragData[2] = shaderLogColor4; // normal\n\
        gl_FragData[3] = vec4(1.0); // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
}";
ShaderSource.WaterOrthogonalDepthShaderVS = "precision highp float;\n\
\n\
attribute vec3 position;\n\
attribute vec2 texCoord;\n\
\n\
uniform mat4 buildingRotMatrix;  \n\
uniform mat4 RefTransfMatrix;\n\
uniform mat4 modelViewProjectionMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
\n\
uniform vec4 u_color4;\n\
varying float vDepth;\n\
varying float vAltitude;\n\
varying vec4 vColor4;\n\
varying vec4 glPos;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
float cbrt(in float val)\n\
{\n\
	if (val < 0.0) {\n\
 \n\
        return -pow(-val, 1.0 / 3.0);\n\
    }\n\
 \n\
    else {\n\
 \n\
        return pow(val, 1.0 / 3.0);\n\
    }\n\
}\n\
\n\
float atanHP_getConstant(in int j) \n\
{\n\
	float constant = 0.0;\n\
\n\
	// https://studylib.net/doc/18241330/high-precision-calculation-of-arcsin-x--arceos-x--and-arctan\n\
	// The constants tan(j*PI/24), (j = 1, 2, • • • , 11) and PI/2 are:\n\
	// j = 1 -> tan(PI/24) =     0.13165 24975 87395 85347 2\n\
	// j = 2 -> tan(PI/12) =     0.26794 91924 31122 70647 3\n\
	// j = 3 -> tan(PI/8) =      0.41421 35623 73095 04880 2\n\
	// j = 4 -> tan(PI/6) =      0.57735 02691 89625 76450 9\n\
	// j = 5 -> tan(5*PI/24) =   0.76732 69879 78960 34292 3\n\
	// j = 6 -> tan(PI/4) =      1.00000 00000 00000 00000 0\n\
	// j = 7 -> tan(7*PI/24) =   1.30322 53728 41205 75586 8\n\
	// j = 8 -> tan(PI/3) =      1.73205 08075 68877 29352 7\n\
	// j = 9 -> tan(3*PI/8) =    2.41421 35623 73095 04880 2\n\
	// j = 10 -> tan(5*PI/12) =  3.73205 08075 68877 29352 7\n\
	// j = 11 -> tan(11*PI/24) = 7.59575 41127 25150 44052 6\n\
	// PI/2 =                    1.57079 63267 94896 61923 1\n\
\n\
	if(j == 1)\n\
	{\n\
		constant = 0.131652497587395853472;\n\
	}\n\
	else if(j == 2)\n\
	{\n\
		constant = 0.267949192431122706473;\n\
	}\n\
	else if(j == 3)\n\
	{\n\
		constant = 0.414213562373095048802;\n\
	}\n\
	else if(j == 4)\n\
	{\n\
		constant = 0.577350269189625764509;\n\
	}\n\
	else if(j == 5)\n\
	{\n\
		constant = 0.767326987978960342923;\n\
	}\n\
	else if(j == 6)\n\
	{\n\
		constant = 1.000000000000000000000;\n\
	}\n\
	else if(j == 7)\n\
	{\n\
		constant = 1.303225372841205755868;\n\
	}\n\
	else if(j == 8)\n\
	{\n\
		constant = 1.732050807568877293527;\n\
	}\n\
	else if(j == 9)\n\
	{\n\
		constant = 2.414213562373095048802;\n\
	}\n\
	else if(j == 10)\n\
	{\n\
		constant = 3.732050807568877293527;\n\
	}\n\
	else if(j == 11)\n\
	{\n\
		constant = 7.595754112725150440526;\n\
	}\n\
	else if(j == 12)\n\
	{\n\
		constant = 1.570796326794896619231;\n\
	}\n\
\n\
	return constant;\n\
}\n\
\n\
int atanHP_getInterval(in float x) \n\
{\n\
	// Subdivide the interval (0, infinite ) into seven intervals as follows:\n\
	// 0 <= u < tan(PI/24)\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(11PI/24) <= u < infinite.\n\
	//------------------------------------------------------------------------\n\
	float u = abs(x);\n\
	int interval = -1;\n\
\n\
	// check if is interval = 0.******************************************************************\n\
	// 0 <= u < tan(PI/24)\n\
	float tan_PIdiv24 = atanHP_getConstant(1);\n\
	if(u < tan_PIdiv24)\n\
	{\n\
		return 0;\n\
	}\n\
\n\
	// check if is interval = 1: (j = interval + 1), so j = 2.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(PI/24) <= u < tan(PI/8)\n\
	float min = atanHP_getConstant(1);\n\
	float max = atanHP_getConstant(3);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 1;\n\
	}\n\
	\n\
	// check if is interval = 2: (j = interval + 1), so j = 3.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(PI/8) <= u < tan(5*PI/24)\n\
	min = atanHP_getConstant(3);\n\
	max = atanHP_getConstant(5);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 2;\n\
	}\n\
\n\
	// check if is interval = 3: (j = interval + 1), so j = 4.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(5*PI/24) <= u < tan(7*PI/24)\n\
	min = atanHP_getConstant(5);\n\
	max = atanHP_getConstant(7);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 3;\n\
	}\n\
\n\
	// check if is interval = 4: (j = interval + 1), so j = 5.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(7*PI/24) <= u < tan(3*PI/8)\n\
	min = atanHP_getConstant(7);\n\
	max = atanHP_getConstant(9);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 4;\n\
	}\n\
\n\
	// check if is interval = 5: (j = interval + 1), so j = 6.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(3*PI/8) <= u < tan(11*PI/24)\n\
	min = atanHP_getConstant(9);\n\
	max = atanHP_getConstant(11);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 5;\n\
	}\n\
\n\
	// check if is interval = 6: (j = interval + 1), so j = 6.***********************************\n\
	// tan(11PI/24) <= u < infinite.\n\
	min = atanHP_getConstant(11);\n\
	if(u >= min)\n\
	{\n\
		return 6;\n\
	}\n\
\n\
\n\
	return interval;\n\
}\n\
\n\
float atanHP_polynomialApproximation(in float x) \n\
{\n\
	// P(x) = a1*x + a3*pow(x, 3) + ... + a17*pow(x, 17)\n\
	float result_atan = -1.0;\n\
\n\
	float a1 = 1.0;\n\
	float a3 = -0.333333333333333331607;\n\
	float a5 = 0.199999999999998244448;\n\
	float a7 = -0.142857142856331306529;\n\
	float a9 = 0.111111110907793967393;\n\
	float a11 = -0.0909090609633677637073;\n\
	float a13 = 0.0769204073249154081320;\n\
	float a15 = -0.0665248229413108277905;\n\
	float a17 = 0.0546721009395938806941;\n\
\n\
	result_atan = a1*x + a3*pow(x, 3.0) + a5*pow(x, 5.0) +  a7*pow(x, 7.0) +  a9*pow(x, 9.0) +  a11*pow(x, 11.0) +  a13*pow(x, 13.0) +  a15*pow(x, 15.0) +  a17*pow(x, 17.0);\n\
\n\
	return result_atan;\n\
}\n\
\n\
float atanHP(in float x) // atan High Precision.\n\
{\n\
	// https://studylib.net/doc/18241330/high-precision-calculation-of-arcsin-x--arceos-x--and-arctan\n\
	//-----------------------------------------------------------------------------------------------\n\
\n\
	// Obtain the interval.\n\
	int interval = atanHP_getInterval(x);\n\
\n\
	if(interval == 0)\n\
	{\n\
		// use polynomial approximation.\n\
		return atanHP_polynomialApproximation(x);\n\
	}\n\
	else if(interval >= 1 && interval <6)\n\
	{\n\
		// use Arctan|x| = (j*PI/12) + Arctan(tj),\n\
		// where tj = A / B, where\n\
		// A = |x| - tan(j*PI/12)\n\
		// B = 1 + |x| * tan(j*PI/12).\n\
		float tan_jPIdiv12;\n\
		float j = float(interval);\n\
		if(interval == 1)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(2);\n\
		}\n\
		else if(interval == 2)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(4);\n\
		}\n\
		else if(interval == 3)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(6);\n\
		}\n\
		else if(interval == 4)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(8);\n\
		}\n\
		else if(interval == 5)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(10);\n\
		}\n\
\n\
		float A = abs(x) - tan_jPIdiv12;\n\
		float B = 1.0 + abs(x) * tan_jPIdiv12;\n\
		float tj = A/B;\n\
		float arctan_tj = atanHP_polynomialApproximation(tj);\n\
		float arctan = (j*M_PI/12.0) + arctan_tj;\n\
		return arctan;\n\
	}\n\
	else\n\
	{\n\
		// the interval = 6 (the last interval).\n\
		// In this case,\n\
		// Arctan|x| = PI/2 - Arctan(1/|x|).\n\
		float pi_div2 = atanHP_getConstant(12);\n\
		float arctan = pi_div2 - atan(1.0/abs(x));\n\
		return arctan;\n\
	}\n\
\n\
	return -1.0;\n\
}\n\
\n\
float atan2(in float y, in float x) \n\
{\n\
	if (x > 0.0)\n\
	{\n\
		return atanHP(y/x);\n\
	}\n\
	else if (x < 0.0)\n\
	{\n\
		if (y >= 0.0)\n\
		{\n\
			return atanHP(y/x) + M_PI;\n\
		}\n\
		else \n\
		{\n\
			return atanHP(y/x) - M_PI;\n\
		}\n\
	}\n\
	else if (x == 0.0)\n\
	{\n\
		if (y>0.0)\n\
		{\n\
			return M_PI/2.0;\n\
		}\n\
		else if (y<0.0)\n\
		{\n\
			return -M_PI/2.0;\n\
		}\n\
		else \n\
		{\n\
			return 0.0; // return undefined.\n\
		}\n\
	}\n\
}\n\
\n\
vec3 CartesianToGeographicWgs84(vec3 posWC, inout float inoutAux)\n\
{\n\
	vec3 geoCoord;\n\
\n\
	// From WebWorldWind.\n\
	// According to H. Vermeille, \"An analytical method to transform geocentric into geodetic coordinates\"\n\
	// http://www.springerlink.com/content/3t6837t27t351227/fulltext.pdf\n\
	// Journal of Geodesy, accepted 10/2010, not yet published\n\
	\n\
	\n\
	//// equatorialRadius = 6378137.0; // meters.\n\
	//// polarRadius = 6356752.3142; // meters.\n\
	//// firstEccentricitySquared = 6.69437999014E-3;\n\
	//// secondEccentricitySquared = 6.73949674228E-3;\n\
	//// degToRadFactor = Math.PI/180.0;\n\
	\n\
	float firstEccentricitySquared = 6.69437999014E-3;\n\
	float equatorialRadius = 6378137.0;\n\
\n\
	float X = posWC.x;\n\
	float Y = posWC.y;\n\
	float Z = posWC.z;\n\
\n\
	float XXpYY = X * X + Y * Y;\n\
	float sqrtXXpYY = sqrt(XXpYY);\n\
	float a = equatorialRadius;\n\
	float ra2 = 1.0 / (a * a);\n\
	float e2 = firstEccentricitySquared;\n\
	float e4 = e2 * e2;\n\
	float p = XXpYY * ra2;\n\
	float q = Z * Z * (1.0 - e2) * ra2;\n\
	float r = (p + q - e4) / 6.0;\n\
	float h;\n\
	float phi;\n\
	float u;\n\
	float evoluteBorderTest = 8.0 * r * r * r + e4 * p * q;\n\
	float rad1;\n\
	float rad2;\n\
	float rad3;\n\
	float atan_son;\n\
	float v;\n\
	float w;\n\
	float k;\n\
	float D;\n\
	float sqrtDDpZZ;\n\
	float e;\n\
	float lambda;\n\
	float s2;\n\
\n\
	\n\
\n\
	if (evoluteBorderTest > 0.0 || q != 0.0) \n\
	{\n\
		if (evoluteBorderTest > 0.0) \n\
		{\n\
			// Step 2: general case\n\
			rad1 = sqrt(evoluteBorderTest);\n\
			rad2 = sqrt(e4 * p * q);\n\
\n\
			// 10*e2 is my arbitrary decision of what Vermeille means by \"near... the cusps of the evolute\".\n\
			if (evoluteBorderTest > 10.0 * e2) \n\
			{\n\
				rad3 = cbrt((rad1 + rad2) * (rad1 + rad2));\n\
				u = r + 0.5 * rad3 + 2.0 * r * r / rad3;\n\
			}\n\
			else \n\
			{\n\
				u = r + 0.5 * cbrt((rad1 + rad2) * (rad1 + rad2))\n\
					+ 0.5 * cbrt((rad1 - rad2) * (rad1 - rad2));\n\
			}\n\
		}\n\
		else \n\
		{\n\
			// Step 3: near evolute\n\
			rad1 = sqrt(-evoluteBorderTest);\n\
			rad2 = sqrt(-8.0 * r * r * r);\n\
			rad3 = sqrt(e4 * p * q);\n\
			atan_son = 2.0 * atan2(rad3, rad1 + rad2) / 3.0;\n\
\n\
			u = -4.0 * r * sin(atan_son) * cos(M_PI / 6.0 + atan_son);\n\
		}\n\
\n\
		v = sqrt(u * u + e4 * q);\n\
		w = e2 * (u + v - q) / (2.0 * v);\n\
		k = (u + v) / (sqrt(w * w + u + v) + w);\n\
		D = k * sqrtXXpYY / (k + e2);\n\
		float D_scaled = D/10000.0;\n\
		float Z_scaled = Z/10000.0;\n\
		sqrtDDpZZ = sqrt(D_scaled * D_scaled + Z_scaled * Z_scaled) * 10000.0; // more precision.\n\
		//sqrtDDpZZ = sqrt(D * D + Z * Z);\n\
\n\
		h = (k + e2 - 1.0) * sqrtDDpZZ / k;\n\
		phi = 2.0 * atan2(Z, (sqrtDDpZZ + D));\n\
		\n\
	}\n\
	else \n\
	{\n\
		// Step 4: singular disk\n\
		rad1 = sqrt(1.0 - e2);\n\
		rad2 = sqrt(e2 - p);\n\
		e = sqrt(e2);\n\
\n\
		h = -a * rad1 * rad2 / e;\n\
		phi = rad2 / (e * rad2 + rad1 * sqrt(p));\n\
	}\n\
\n\
\n\
	// Compute lambda\n\
	s2 = sqrt(2.0);\n\
	if ((s2 - 1.0) * Y < sqrtXXpYY + X) \n\
	{\n\
		// case 1 - -135deg < lambda < 135deg\n\
		lambda = 2.0 * atan2(Y, sqrtXXpYY + X);\n\
	}\n\
	else if (sqrtXXpYY + Y < (s2 + 1.0) * X) \n\
	{\n\
		// case 2 - -225deg < lambda < 45deg\n\
		lambda = -M_PI * 0.5 + 2.0 * atan2(X, sqrtXXpYY - Y);\n\
	}\n\
	else \n\
	{\n\
		// if (sqrtXXpYY-Y<(s2=1)*X) {  // is the test, if needed, but it's not\n\
		// case 3: - -45deg < lambda < 225deg\n\
		lambda = M_PI * 0.5 - 2.0 * atan2(X, sqrtXXpYY + Y);\n\
	}\n\
\n\
	float factor = 180.0 / M_PI;\n\
	geoCoord = vec3(factor * lambda, factor * phi, h);\n\
\n\
	return geoCoord;\n\
}\n\
\n\
float rand(vec2 co){\n\
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n\
}\n\
\n\
bool aproxEqual(float valA, float valB, float error)\n\
{\n\
	bool areEquals = false;\n\
\n\
	if(abs(valA - valB) < error)\n\
	{\n\
		areEquals = true;\n\
	}\n\
	else{\n\
		areEquals = false;\n\
	}\n\
\n\
	return areEquals;\n\
}\n\
  \n\
void main()\n\
{	\n\
	// Function for overWrite waterSystem DEM texture.\n\
	vec4 rotatedPos;\n\
\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz; // - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz; // - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0); // world position.\n\
\n\
	float inoutAux = 0.0;\n\
	vec3 geoCoord = CartesianToGeographicWgs84(pos4.xyz, inoutAux);\n\
\n\
	////gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	gl_Position = modelViewProjectionMatrix * vec4(geoCoord, 1.0);\n\
	gl_PointSize = 2.0;\n\
\n\
	vDepth = gl_Position.z * 0.5 + 0.5;\n\
	glPos = gl_Position;\n\
	vAltitude = geoCoord.z;\n\
	vColor4 = u_color4; // used for \"waterCalculateHeightContaminationFS\".***\n\
\n\
}\n\
";
ShaderSource.WaterOrthogonalMagoTexture3DFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D currDEMTex;\n\
\n\
uniform vec2 u_heightMap_MinMax; // terrain min max heights. \n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec2 u_quantizedVolume_MinMax;\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
uniform int u_lowestTex3DSliceIndex;\n\
uniform float u_airMaxPressure; // use if rendering soundSource.***\n\
uniform float u_currAirPressure; // use if rendering soundSource.***\n\
\n\
\n\
varying float vDepth;\n\
varying float vAltitude;\n\
\n\
vec4 packDepth( float v ) {\n\
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
    enc = fract(enc);\n\
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
    return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
void main()\n\
{     \n\
    // Now, must determine in what slice must render.***\n\
    float onePixelSize = 1.0 / float(u_texSize[2]); // here can use u_texSize[0] or u_texSize[1] too.***\n\
    float halfPixelSize = onePixelSize / 2.0 * 1.5;\n\
    //halfPixelSize = onePixelSize;\n\
\n\
    // Now, must invert vDepth, bcos vDepth is up-to-down value (up is zero & down is 1).***\n\
    float vDepthsAbs = 1.0 - abs(vDepth);\n\
    //float vDepthsAbs = vDepth;\n\
\n\
    // slice 0.***\n\
    vec4 color = vec4(0.0);\n\
    float slice_altitude = float(u_lowestTex3DSliceIndex) / float(u_texSize[2]);\n\
    if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)\n\
    {\n\
        color = packDepth(u_currAirPressure/u_airMaxPressure);\n\
    }\n\
\n\
    gl_FragData[0] = color;\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        color = vec4(0.0);\n\
        slice_altitude = float(u_lowestTex3DSliceIndex + 1) / float(u_texSize[2]);\n\
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)\n\
        {\n\
            color = packDepth(u_currAirPressure/u_airMaxPressure);\n\
        }\n\
\n\
        gl_FragData[1] = color; \n\
\n\
         color = vec4(0.0);\n\
        slice_altitude = float(u_lowestTex3DSliceIndex + 2) / float(u_texSize[2]);\n\
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)\n\
        {\n\
            color = packDepth(u_currAirPressure/u_airMaxPressure);\n\
        }\n\
\n\
        gl_FragData[2] = color; \n\
\n\
         color = vec4(0.0);\n\
        slice_altitude = float(u_lowestTex3DSliceIndex + 3) / float(u_texSize[2]);\n\
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)\n\
        {\n\
            color = packDepth(u_currAirPressure/u_airMaxPressure);\n\
        }\n\
\n\
        gl_FragData[3] = color; \n\
\n\
         color = vec4(0.0);\n\
        slice_altitude = float(u_lowestTex3DSliceIndex + 4) / float(u_texSize[2]);\n\
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)\n\
        {\n\
            color = packDepth(u_currAirPressure/u_airMaxPressure);\n\
        }\n\
\n\
        gl_FragData[4] = color; \n\
\n\
         color = vec4(0.0);\n\
        slice_altitude = float(u_lowestTex3DSliceIndex + 5) / float(u_texSize[2]);\n\
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)\n\
        {\n\
            color = packDepth(u_currAirPressure/u_airMaxPressure);\n\
        }\n\
\n\
        gl_FragData[5] = color; \n\
\n\
         color = vec4(0.0);\n\
        slice_altitude = float(u_lowestTex3DSliceIndex + 6) / float(u_texSize[2]);\n\
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)\n\
        {\n\
            color = packDepth(u_currAirPressure/u_airMaxPressure);\n\
        }\n\
\n\
        gl_FragData[6] = color; \n\
\n\
         color = vec4(0.0);\n\
        slice_altitude = float(u_lowestTex3DSliceIndex + 7) / float(u_texSize[2]);\n\
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)\n\
        {\n\
            color = packDepth(u_currAirPressure/u_airMaxPressure);\n\
        }\n\
        gl_FragData[7] = color; \n\
    #endif\n\
}";
ShaderSource.waterParticlesRenderFS = "precision mediump float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D u_wind;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform bool u_colorScale;\n\
\n\
varying vec2 v_particle_pos;\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
}\n\
\n\
void main() {\n\
\n\
	vec2 pt = gl_PointCoord - vec2(0.5);\n\
	if(pt.x*pt.x+pt.y*pt.y > 0.25)\n\
	{\n\
		discard;\n\
	}\n\
	\n\
	vec2 windMapTexCoord = v_particle_pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
	vec2 velociCol = mix(u_wind_min, u_wind_max, decodeVelocity(texture2D(u_wind, windMapTexCoord).rg));\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, windMapTexCoord).rg);\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
	if(length(velociCol) < 0.205) \n\
	{\n\
		discard;\n\
	}\n\
\n\
	if(u_colorScale)\n\
	{\n\
		speed_t *= 1.5;\n\
		if(speed_t > 1.0)speed_t = 1.0;\n\
		float b = 1.0 - speed_t;\n\
		float g;\n\
		if(speed_t > 0.5)\n\
		{\n\
			g = 2.0-2.0*speed_t;\n\
		}\n\
		else{\n\
			g = 2.0*speed_t;\n\
		}\n\
		float r = speed_t;\n\
		gl_FragColor = vec4(r,g,b,1.0);\n\
	}\n\
	else\n\
	{\n\
		float intensity = speed_t*3.0;\n\
		if(intensity > 1.0)\n\
			intensity = 1.0;\n\
		gl_FragColor = vec4(intensity,intensity,intensity,1.0);\n\
	}\n\
	\n\
}\n\
";
ShaderSource.waterParticlesRenderingFadeFS = "precision mediump float;\n\
\n\
uniform sampler2D u_screen;\n\
uniform float u_opacity;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    vec4 color = texture2D(u_screen, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    // a hack to guarantee opacity fade out even with a value close to 1.0\n\
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);\n\
}";
ShaderSource.waterParticlesRenderVS = "precision mediump float;\n\
\n\
attribute float a_index;\n\
\n\
uniform sampler2D u_particles;\n\
uniform float u_particles_res;\n\
\n\
varying vec2 v_particle_pos;\n\
\n\
void main() {\n\
    vec4 color = texture2D(u_particles, vec2(\n\
        fract(a_index / u_particles_res),\n\
        floor(a_index / u_particles_res) / u_particles_res));\n\
\n\
    // decode current particle position from the pixel's RGBA value\n\
    v_particle_pos = vec2(\n\
        color.r / 255.0 + color.b,\n\
        color.g / 255.0 + color.a);\n\
\n\
    gl_PointSize = 1.5;\n\
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);\n\
}\n\
";
ShaderSource.waterQuadVertVS = "//precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    v_tex_pos = a_pos;\n\
    gl_Position = vec4(-1.0 + 2.0 * a_pos, 0.0, 1.0);\n\
}";
ShaderSource.waterQuantizedMeshFS_3D_TEST = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform vec2 u_minMaxHeights;\n\
uniform int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform vec4 u_oneColor4;\n\
\n\
varying vec3 vPos;\n\
varying vec4 vColor4;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4 = vec4(vPos.z, vPos.z, vPos.z, 1.0); // original.***\n\
\n\
    if(colorType == 1)\n\
    {\n\
        //finalCol4 = vColor4;\n\
        finalCol4 = u_oneColor4;\n\
    }\n\
\n\
    finalCol4 = u_oneColor4; // original.***\n\
\n\
    //-------------------------------------------------------------------------------------------------------------\n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0); // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterQuantizedMeshVS = "//precision mediump float;\n\
\n\
attribute vec3 a_pos;\n\
attribute vec4 color4;\n\
\n\
uniform vec3 u_totalMinGeoCoord; // (lon, lat, alt).\n\
uniform vec3 u_totalMaxGeoCoord;\n\
uniform vec3 u_currentMinGeoCoord; // min geoCoord of the current quantizedMesh.***\n\
uniform vec3 u_currentMaxGeoCoord; // max geoCoord of the current quantizedMesh.***\n\
\n\
uniform bool u_flipTexCoordY;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 vPos;\n\
varying vec4 vColor4;\n\
varying float v_altitude;\n\
\n\
void main() {\n\
    // Note: the position attributte is initially (in javascript) unsignedInt16 (0 to 32,767) (quantizedMesh).\n\
    // So, when normalize the data it transforms to (0.0 to 0.5), so must multiply by 2.0.\n\
    vec3 pos = a_pos * 2.0; // quantizedMeshes uses the positive parts of the signed short, so must multiply by 2.\n\
    \n\
    // Now, use totalGeoExtent & currentGeoExtent to scale the mesh.\n\
    // Calculate longitude & latitude.\n\
    float lon = u_currentMinGeoCoord.x + pos.x * (u_currentMaxGeoCoord.x - u_currentMinGeoCoord.x);\n\
    float lat = u_currentMinGeoCoord.y + pos.y * (u_currentMaxGeoCoord.y - u_currentMinGeoCoord.y);\n\
    float alt = u_currentMinGeoCoord.z + pos.z * (u_currentMaxGeoCoord.z - u_currentMinGeoCoord.z);\n\
\n\
    // Now, calculate the coord on total geoExtent.\n\
    float s = (lon - u_totalMinGeoCoord.x) / (u_totalMaxGeoCoord.x - u_totalMinGeoCoord.x);\n\
    float t = (lat - u_totalMinGeoCoord.y) / (u_totalMaxGeoCoord.y - u_totalMinGeoCoord.y);\n\
    float u = (alt - u_totalMinGeoCoord.z) / (u_totalMaxGeoCoord.z - u_totalMinGeoCoord.z);\n\
\n\
    //pos = vec3(pos.x, 1.0 - pos.y, pos.z); // flip y coords. // original.***\n\
    if(u_flipTexCoordY)\n\
    {\n\
        pos = vec3(s, 1.0 - t, u); // flip y coords.\n\
    }\n\
    else{\n\
        pos = vec3(s, t, u);\n\
    }\n\
    \n\
    vPos = pos;\n\
\n\
\n\
    v_tex_pos = pos.xy;\n\
\n\
    gl_Position = vec4(-1.0 + 2.0 * pos, 1.0);\n\
\n\
    vColor4 = color4;\n\
}";
ShaderSource.waterQuantizedMeshVS_3D_TEST = "//precision mediump float;\n\
\n\
attribute vec3 a_pos;\n\
attribute vec4 color4;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform vec3 u_minGeoCoord;\n\
uniform vec3 u_maxGeoCoord;\n\
\n\
uniform vec3 u_totalMinGeoCoord; // (lon, lat, alt).\n\
uniform vec3 u_totalMaxGeoCoord;\n\
uniform vec3 u_currentMinGeoCoord;\n\
uniform vec3 u_currentMaxGeoCoord;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 vPos;\n\
varying vec4 vColor4;\n\
\n\
/*\n\
vec3 geographicToCartesianWgs84 = function(longitude, latitude, altitude)\n\
{\n\
	// a = semi-major axis.\n\
	// e2 = firstEccentricitySquared.\n\
	// v = a / sqrt(1 - e2 * sin2(lat)).\n\
	// x = (v+h)*cos(lat)*cos(lon).\n\
	// y = (v+h)*cos(lat)*sin(lon).\n\
	// z = [v*(1-e2)+h]*sin(lat).\n\
	var degToRadFactor = Math.PI/180.0;\n\
	var equatorialRadius = 6378137.0;\n\
	var firstEccentricitySquared = 6.69437999014E-3;\n\
	var lonRad = longitude * degToRadFactor;\n\
	var latRad = latitude * degToRadFactor;\n\
	var cosLon = Math.cos(lonRad);\n\
	var cosLat = Math.cos(latRad);\n\
	var sinLon = Math.sin(lonRad);\n\
	var sinLat = Math.sin(latRad);\n\
	var a = equatorialRadius;\n\
	var e2 = firstEccentricitySquared;\n\
	var v = a/Math.sqrt(1.0 - e2 * sinLat * sinLat);\n\
	var h = altitude;\n\
	\n\
	if (resultCartesian === undefined)\n\
	{ resultCartesian = []; }\n\
	\n\
	resultCartesian[0]=(v+h)*cosLat*cosLon;\n\
	resultCartesian[1]=(v+h)*cosLat*sinLon;\n\
	resultCartesian[2]=(v*(1.0-e2)+h)*sinLat;\n\
	\n\
	return resultCartesian;\n\
};\n\
*/\n\
\n\
void main() {\n\
    // Note: the position attributte is initially (in javascript) unsignedInt16 (0 to 32,767) (quantizedMesh).\n\
    // So, when normalize the data it transforms to (0.0 to 0.5), so must multiply by 2.0.\n\
    vec3 pos = a_pos * 2.0; // quantizedMeshes uses the positive parts of the signed short, so must multiply by 2.\n\
    \n\
	pos = vec3(pos.xy * 2000.0, pos.z * 500.0 + 500.0);\n\
	//pos = vec3(pos.xy * 20.0, pos.z + 500.0);\n\
    //----------------------------------------------------------------------------------------------------\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(pos.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    //vec3 rotatedNormal = currentTMat * normal;\n\
\n\
    //vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
    //vTexCoord = texCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
\n\
    vColor4 = color4;\n\
}";
ShaderSource.waterRenderFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D waterTex;\n\
uniform sampler2D particlesTex;\n\
\n\
// Textures.********************************\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
\n\
\n\
uniform vec2 u_screenSize;\n\
uniform float near;\n\
uniform float far;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
uniform mat4 projectionMatrixInv;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform int uWaterType; // 0= nothing, 1= flux, 2= velocity\n\
uniform float uMinWaterHeightToRender;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
\n\
\n\
varying vec4 vColorAuxTest;\n\
varying float vWaterHeight;\n\
varying float vContaminantHeight;\n\
varying float vExistContaminant;\n\
varying vec3 vNormal;\n\
varying vec3 vViewRay;\n\
varying vec3 vOrthoPos;\n\
varying vec2 vTexCoord;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/u_screenSize.x;\n\
    float pixelSizeY = 1.0/u_screenSize.y;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<1.0; i++)\n\
	{\n\
		depthA += getDepth(texCoord + offset1*(1.0+i));\n\
		depthB += getDepth(texCoord + offset2*(1.0+i));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
}\n\
\n\
vec3 getRainbowColor_byHeight(float height, in float maxi, in float mini)\n\
{\n\
	float gray = (height - mini)/(maxi - mini);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
\n\
    b= 0.0;\n\
    r = min(gray * 2.0, 1.0);\n\
    g = min(2.0 - gray * 2.0, 1.0);\n\
\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
\n\
\n\
void main()\n\
{\n\
    bool isParticle = false;\n\
    float alpha = vColorAuxTest.a;\n\
    vec4 finalCol4 = vec4(vColorAuxTest);\n\
\n\
    if(uWaterType == 3)\n\
    {\n\
        // particles case: now, decode velocity:\n\
        vec4 velocity4 = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));\n\
        finalCol4 = mix(vColorAuxTest, velocity4, velocity4.a);\n\
        if(alpha < velocity4.a)\n\
        {\n\
            alpha = velocity4.a;\n\
            isParticle = true;\n\
        }\n\
    }\n\
\n\
    if(!isParticle && vWaterHeight + vContaminantHeight < uMinWaterHeightToRender)// original = 0.0001\n\
    {\n\
        discard;\n\
    }\n\
\n\
    float totalH = vWaterHeight + vContaminantHeight;\n\
    \n\
    float whiteWaterMaxHeight = uMinWaterHeightToRender * 1.5;\n\
    float whiteFactor = 0.0;\n\
    if(totalH < whiteWaterMaxHeight)\n\
    {\n\
        alpha = min(totalH/0.1, alpha); // original.***\n\
        //alpha = min(totalH, alpha); // test.***\n\
\n\
        // do water more white.***\n\
        \n\
        whiteFactor = (totalH - uMinWaterHeightToRender) / (whiteWaterMaxHeight - uMinWaterHeightToRender);\n\
        vec4 white = vec4(1.0, 1.0, 1.0, 1.0);\n\
        finalCol4 = mix(white, finalCol4, whiteFactor);\n\
\n\
        alpha = finalCol4.a;\n\
    }\n\
    \n\
\n\
    // calculate contaminationConcentration;\n\
    float contaminConcentration = vContaminantHeight / (totalH);\n\
\n\
    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y);\n\
\n\
    \n\
    float dotProd = dot(vViewRay, vNormal);\n\
    //finalCol4 = vec4(finalCol4.xyz * dotProd, alpha);\n\
    \n\
\n\
    if(uWaterType == 1)\n\
    {\n\
        alpha = 1.0;\n\
\n\
        // flux case:\n\
        vec4 flux = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));\n\
        float fluxLength = length(flux)/sqrt(4.0);\n\
        float value = fluxLength;\n\
        finalCol4 = vec4(value, value, value, alpha);\n\
        \n\
    }\n\
    else if(uWaterType == 2)\n\
    {\n\
        alpha = 1.0;\n\
\n\
        // velocity case: now, decode velocity:\n\
        vec4 velocity4 = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));\n\
        vec2 decodedVelocity = decodeVelocity(velocity4.xy);\n\
        float velocity = length(decodedVelocity.xy)/sqrt(2.0);\n\
        float value = velocity;\n\
        finalCol4 = vec4(value, value, value, alpha);\n\
\n\
    }\n\
    else if(uWaterType == 3)\n\
    {\n\
        // particles case: now, decode velocity:\n\
        vec4 velocity4 = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));\n\
        finalCol4 = mix(finalCol4, velocity4, velocity4.a);\n\
        if(alpha < velocity4.a)\n\
        {\n\
            alpha = velocity4.a;\n\
            isParticle = true;\n\
        }\n\
    }\n\
\n\
    if(vExistContaminant > 0.0 && vContaminantHeight > 0.001)\n\
    {\n\
        float factor = min(contaminConcentration + 0.6, 1.0);\n\
        \n\
        vec4 contaminCol4 = finalCol4;\n\
\n\
        if(!isParticle)\n\
        {\n\
            float maxConc = 0.001;\n\
            float minConc = 0.0;\n\
            contaminCol4 = vec4(getRainbowColor_byHeight(contaminConcentration, maxConc, minConc), 1.0);\n\
            factor = (contaminConcentration - minConc)/(maxConc - minConc);\n\
        }\n\
        finalCol4 = mix(finalCol4, contaminCol4, factor);\n\
    }\n\
\n\
    finalCol4 = vec4(finalCol4.xyz * dotProd, alpha);\n\
\n\
    //*************************************************************************************************************\n\
    // Do specular lighting.***\n\
	float lambertian = 1.0;\n\
	float specular = 0.0;\n\
    float shininessValue = 200.0;\n\
	//if(applySpecLighting> 0.0)\n\
	//{\n\
		vec3 L;\n\
        vec3 lightPos = vec3(0.0, 1.0, -1.0)*length(vOrthoPos);\n\
        L = normalize(lightPos - vOrthoPos);\n\
        lambertian = max(dot(vNormal, L), 0.0);\n\
		\n\
		specular = 0.0;\n\
		//if(lambertian > 0.0)\n\
		{\n\
			vec3 R = reflect(-L, vNormal);      // Reflected light vector\n\
			vec3 V = normalize(-vOrthoPos); // Vector to viewer\n\
			\n\
			// Compute the specular term\n\
			float specAngle = max(dot(R, V), 0.0);\n\
			specular = pow(specAngle, shininessValue);\n\
			\n\
			if(specular > 1.0)\n\
			{\n\
				//specular = 1.0;\n\
			}\n\
		}\n\
		\n\
		if(lambertian < 0.9)\n\
		{\n\
			lambertian = 0.9;\n\
		}\n\
\n\
	//}\n\
    //vec3 specCol = finalCol4.xyz * 3.0;\n\
    vec3 specCol = vec3(0.5, 1.0, 1.0);\n\
\n\
    //finalCol4 = vec4((finalCol4.xyz * lambertian + specCol * specular), alpha);\n\
    //*************************************************************************************************************\n\
    vec3 lightdir = normalize(lightPos - vOrthoPos);\n\
    vec3 halfway = normalize(lightdir + vViewRay);\n\
    float spec = pow(max(dot(vNormal, halfway), 0.0), 333.0);\n\
    finalCol4 = vec4((finalCol4.xyz * lambertian + specCol * spec), alpha);\n\
\n\
    if(!isParticle)\n\
    {\n\
        finalCol4 = vec4(finalCol4.xyz* (1.0 + whiteFactor), alpha);\n\
    }\n\
    \n\
\n\
    //-------------------------------------------------------------------------------------------------------------\n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0); // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
    /*\n\
    vec2 uv = vec2(gl_FragCoord.xy/u_Dimensions);\n\
    float terrainDepth = texture(sceneDepth,uv).x;\n\
    float sediment = texture(sedimap,fs_Uv).x;\n\
    float waterDepth = gl_FragCoord.z;\n\
\n\
    terrainDepth = linearDepth(terrainDepth);\n\
    waterDepth = linearDepth(waterDepth);\n\
\n\
    float dpVal = 180.0 * max(0.0,terrainDepth - waterDepth);\n\
    dpVal = clamp(dpVal, 0.0,4.0);\n\
    //dpVal = pow(dpVal, 0.1);\n\
\n\
\n\
    float fbias = 0.2;\n\
    float fscale = 0.2;\n\
    float fpow = 22.0;\n\
    vec3 sundir = unif_LightPos;\n\
\n\
    sundir = normalize(sundir);\n\
\n\
    vec3 nor = -calnor(fs_Uv);\n\
    vec3 viewdir = normalize(u_Eye - fs_Pos);\n\
    vec3 lightdir = normalize(sundir);\n\
    vec3 halfway = normalize(lightdir + viewdir);\n\
    vec3 reflectedSky = sky(halfway);\n\
    float spec = pow(max(dot(nor, halfway), 0.0), 333.0);\n\
\n\
\n\
    float R = max(0.0, min(1.0, fbias + fscale * pow(1.0 + dot(viewdir, -nor), fpow)));\n\
\n\
    //lamb =1.f;\n\
\n\
    float yval = texture(waterHeightTex,fs_Uv).x * 4.0;\n\
    float wval = texture(waterHeightTex,fs_Uv).y;\n\
    wval /= 1.0;\n\
\n\
    vec3 watercolor = mix(vec3(0.8,0.0,0.0), vec3(0.0,0.0,0.8), sediment * 2.0);\n\
    vec3 watercolorspec = vec3(1.0);\n\
    watercolorspec *= spec;\n\
\n\
    out_Col = vec4(vec3(0.0,0.2,0.5) + R * reflectedSky + watercolorspec  , (.5 + spec) * u_WaterTransparency * dpVal);\n\
    col_reflect = vec4(1.0);\n\
    */\n\
}";
ShaderSource.waterRenderVS = "\n\
//#version 300 es\n\
\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; // use this matrix to calculate normals from highMaps.***\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
    \n\
uniform vec2 u_screenSize;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
uniform mat4 projectionMatrixInv;\n\
\n\
// Textures.********************************\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
uniform vec2 u_heightMap_MinMax; // terrain.\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_contaminantMaxHeigh;\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec2 u_terrainTextureSize; // for example 512 x 512.\n\
uniform float u_waterRenderingHeightOffset; \n\
\n\
uniform sampler2D depthTex;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying float vWaterHeight;\n\
varying float vContaminantHeight;\n\
varying float vExistContaminant;\n\
varying vec3 vNormal;\n\
varying vec3 vViewRay;\n\
varying vec3 vOrthoPos;\n\
varying vec2 vTexCoord;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_contaminantMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    //float terainHeight = texture2D(terrainmap, texCoord).r;\n\
    //terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    //return terainHeight;\n\
\n\
	// 4byte mode.***\n\
    vec4 terrainEncoded = texture2D(terrainmap, texCoord);\n\
    float terainHeight = unpackDepth(terrainEncoded);\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
/*\n\
vec3 calnor(vec2 uv){\n\
    float eps = 1.0/u_SimRes;\n\
    vec4 cur = texture(waterHeightTex,uv);\n\
    vec4 r = texture(waterHeightTex,uv+vec2(eps,0.f));\n\
    vec4 t = texture(waterHeightTex,uv+vec2(0.f,eps));\n\
\n\
    vec3 n1 = normalize(vec3(-1.0, cur.y + cur.x - r.y - r.x, 0.f));\n\
    vec3 n2 = normalize(vec3(-1.0, t.x + t.y - r.y - r.x, 1.0));\n\
\n\
    vec3 nor = -cross(n1,n2);\n\
    nor = normalize(nor);\n\
    return nor;\n\
}\n\
\n\
vec3 sky(in vec3 rd){\n\
    return mix(vec3(0.6,0.6,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));\n\
}\n\
\n\
float linearDepth(float depthSample)\n\
{\n\
    depthSample = 2.0 * depthSample - 1.0;\n\
    float zLinear = 2.0 * u_near * u_far / (u_far + u_near - depthSample * (u_far - u_near));\n\
    return zLinear;\n\
}\n\
*/\n\
\n\
float getTotalHeight(in vec2 texCoord)\n\
{\n\
	float waterHeight = getWaterHeight(texCoord);\n\
	float terrainHeight = getTerrainHeight(texCoord);\n\
	float contaminHeight = 0.0;\n\
	if(u_contaminantMaxHeigh > 0.0)\n\
	{\n\
		// exist contaminant.\n\
		contaminHeight = getContaminantHeight(texCoord);\n\
	}\n\
\n\
	float totalHeight = waterHeight + terrainHeight + contaminHeight;\n\
	return totalHeight;\n\
}\n\
\n\
float getLiquidHeight(in vec2 texCoord)\n\
{\n\
	float waterHeight = getWaterHeight(texCoord);\n\
	float contaminHeight = 0.0;\n\
	if(u_contaminantMaxHeigh > 0.0)\n\
	{\n\
		// exist contaminant.\n\
		contaminHeight = getContaminantHeight(texCoord);\n\
	}\n\
\n\
	float totalHeight = waterHeight + contaminHeight;\n\
	return totalHeight;\n\
}\n\
\n\
vec3 calculateNormalFromHeights(in vec2 texCoord)\n\
{\n\
	vec3 normal;\n\
	float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
	float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
	// curPos = (0, 0, curH).\n\
	// upPos = (0, dy, upH).\n\
	// rightPos = (dz, 0, rightH).\n\
\n\
	vec3 curPos = vec3(0.0, 0.0, getTotalHeight(texCoord));\n\
	vec3 upPos = vec3(0.0, cellSize_y, getTotalHeight(texCoord + vec2(0.0, divY)));\n\
	vec3 rightPos = vec3(cellSize_x, 0.0, getTotalHeight(texCoord + vec2(divX, 0.0)));\n\
\n\
	vec3 rightDir = (rightPos - curPos);\n\
	vec3 upDir = (upPos - curPos);\n\
\n\
	normal = normalize(cross(rightDir, upDir));\n\
\n\
	return normal;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
	// read the altitude from waterHeightTex.\n\
	vTexCoord = texCoord;\n\
	vWaterHeight = getWaterHeight(texCoord);\n\
\n\
	vContaminantHeight = 0.0;\n\
	vExistContaminant = -1.0;\n\
	// check if exist contaminat.\n\
	if(u_contaminantMaxHeigh > 0.0)\n\
	{\n\
		// exist contaminant.\n\
		vContaminantHeight = getContaminantHeight(texCoord);\n\
		vExistContaminant = 1.0;\n\
	}\n\
\n\
	// Test check neighbor(adjacent) waterHeights.**************************\n\
	// If some adjacent waterHeight is zero, then this waterHeight is zero.\n\
	/*\n\
	float extrudeHeight = 0.0;\n\
	float minLiquidHeight = 0.0001;\n\
	bool thisIsBorderWater = false;\n\
	if(vWaterHeight + vContaminantHeight < minLiquidHeight)\n\
	{\n\
		thisIsBorderWater = true;\n\
		extrudeHeight = 0.0;\n\
	}\n\
	*/\n\
	// End test.------------------------------------------------------------\n\
\n\
	float terrainHeight = getTerrainHeight(texCoord);\n\
	//float terrainHeight = getTerrainHeight_interpolated(texCoord);\n\
	float height = terrainHeight + vWaterHeight + vContaminantHeight;\n\
\n\
	// Test debug:\n\
	height += u_waterRenderingHeightOffset;\n\
\n\
	//if(thisIsBorderWater)\n\
	//{\n\
	//	height = extrudeHeight;\n\
	//}\n\
\n\
	//float alpha = max(vWaterHeight/u_waterMaxHeigh*1.5, 0.4); // original.***\n\
	float alpha = max(vWaterHeight/u_waterMaxHeigh*1.5, 0.7);\n\
\n\
	\n\
	vColorAuxTest = vec4(0.1, 0.3, 1.0, alpha);\n\
\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	// calculate the up direction:\n\
	vec4 posWC = vec4(objPosLow + objPosHigh, 1.0);\n\
	vec3 upDir = normalize(posWC.xyz);\n\
\n\
	vec4 finalPos4 =  vec4(pos4.x + upDir.x * height, pos4.y + upDir.y * height, pos4.z + upDir.z * height, 1.0);\n\
\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * finalPos4;\n\
\n\
	vOrthoPos = (modelViewMatrixRelToEye * finalPos4).xyz;\n\
	float depth = (-vOrthoPos.z)/(far); // the correct value.\n\
\n\
	// try to calculate normal here.\n\
	vec3 ndc = gl_Position.xyz / gl_Position.w; //perspective divide/normalize\n\
	vec2 screenPos = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1\n\
\n\
	// Calculate normal.\n\
	vec3 normalLC = calculateNormalFromHeights(texCoord);\n\
	vec4 normalWC = buildingRotMatrix * vec4(normalLC, 1.0);\n\
	vec4 normalCC = normalMatrix4 * normalWC;\n\
\n\
	vNormal = normalCC.xyz;\n\
	vViewRay = normalize(-getViewRay(screenPos, depth)); // original.***\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//---------------------------------------------------------------------------------\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}\n\
";
ShaderSource.waterReQuatizeFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texToCopy;\n\
\n\
uniform vec2 u_original_MinMax;\n\
uniform vec2 u_desired_MinMax;\n\
\n\
uniform bool u_textureFlipYAxis;\n\
varying vec2 v_tex_pos;\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
    }\n\
    else\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    }\n\
    \n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0); // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterSimTerrainRenderFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D diffuseTex;\n\
uniform sampler2D depthTex; \n\
\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D terrainMapToCompare;\n\
\n\
uniform float near;\n\
uniform float far;\n\
uniform mat4 projectionMatrixInv;\n\
uniform bool bUseLogarithmicDepth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
uniform int uFrustumIdx;\n\
uniform int u_TerrainType;\n\
uniform float u_WaterTransparency;\n\
uniform float u_SimRes;\n\
uniform vec2 u_Dimensions;\n\
uniform vec3 unif_LightPos;\n\
uniform float u_far;\n\
uniform float u_near;\n\
\n\
uniform vec2 u_screenSize;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying vec2 vTexCoord;\n\
varying float depth;\n\
varying vec3 vNormal;\n\
varying vec3 vViewRay;\n\
varying float vTerrainSlided;\n\
\n\
vec3 calculateNormal(vec2 uv){\n\
    float eps = 1.0/u_SimRes;\n\
    vec4 cur = texture2D(terrainmap, uv)*50.0;\n\
    vec4 r = texture2D(terrainmap, uv + vec2(eps, 0.0))*50.0;\n\
    vec4 t = texture2D(terrainmap, uv + vec2(0.0, eps))*50.0;\n\
\n\
    vec3 n1 = normalize(vec3(-1.0, cur.x - r.x, 0.0));\n\
    vec3 n2 = normalize(vec3(-1.0, t.x - r.x, 1.0));\n\
\n\
    vec3 nor = -cross(n1,n2);\n\
    nor = normalize(nor);\n\
    return nor;\n\
}\n\
/*\n\
vec3 sky(in vec3 rd){\n\
    return mix(vec3(0.6,0.6,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));\n\
}\n\
\n\
float linearDepth(float depthSample)\n\
{\n\
    depthSample = 2.0 * depthSample - 1.0;\n\
    float zLinear = 2.0 * u_near * u_far / (u_far + u_near - depthSample * (u_far - u_near));\n\
    return zLinear;\n\
}\n\
*/\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
/*\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/u_screenSize.x;\n\
    float pixelSizeY = 1.0/u_screenSize.y;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<1.0; i++)\n\
	{\n\
		depthA += getDepth(texCoord + offset1*(1.0+i));\n\
		depthB += getDepth(texCoord + offset2*(1.0+i));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
*/\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
    //vec3 camDir = normalize(vec3(-gl_FragCoord.x / u_screenSize.x, -gl_FragCoord.y / u_screenSize.y, 1.0));\n\
    //vec3 camDir2 = -1.0 + 2.0 * camDir;\n\
    //vec3 normal = calculateNormal(vec2(vTexCoord.x, 1.0 - vTexCoord.y));\n\
    //float dotProd = dot(camDir2, normal);\n\
    //vec4 finalCol4 = vec4(vColorAuxTest * dotProd);\n\
    //finalCol4 = vec4(normal, 1.0);\n\
    //if(vColorAuxTest.r == vColorAuxTest.g && vColorAuxTest.r == vColorAuxTest.b )\n\
    //{\n\
    //    finalCol4 = vec4(1.0, 0.0, 0.0, 1.0);\n\
    //}\n\
\n\
    \n\
\n\
    float depthAux = depth;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		depthAux = gl_FragDepthEXT; \n\
	}\n\
	#endif\n\
\n\
    // read difusseTex.\n\
    vec4 difusseColor = texture2D(diffuseTex, vec2(vTexCoord.x, 1.0 - vTexCoord.y));\n\
    if(vTerrainSlided > 0.0)\n\
    {\n\
        difusseColor.r *= 0.5;\n\
        difusseColor.g *= 0.5;\n\
        difusseColor.b *= 0.5;\n\
    }\n\
    //float dotProd = dot(vViewRay, vNormal);\n\
    //difusseColor = vec4(difusseColor.xyz * dotProd, 1.0);\n\
    //gl_FragData[2] = vec4(vNormal, 1.0); // normal\n\
    float frustumIdx = 1.0;\n\
    if(uFrustumIdx == 0)\n\
    frustumIdx = 0.005;\n\
    else if(uFrustumIdx == 1)\n\
    frustumIdx = 0.015;\n\
    else if(uFrustumIdx == 2)\n\
    frustumIdx = 0.025;\n\
    else if(uFrustumIdx == 3)\n\
    frustumIdx = 0.035;\n\
\n\
    vec3 encodedNormal = encodeNormal(vNormal);\n\
\n\
\n\
    gl_FragData[0] = difusseColor;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = packDepth(depthAux);  // depth\n\
        gl_FragData[2] = vec4(encodedNormal, frustumIdx); // normal\n\
        gl_FragData[3] = difusseColor; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
    /*\n\
    vec2 uv = vec2(gl_FragCoord.xy/u_Dimensions);\n\
    float terrainDepth = texture(sceneDepth,uv).x;\n\
    float sediment = texture(sedimap,fs_Uv).x;\n\
    float waterDepth = gl_FragCoord.z;\n\
\n\
    terrainDepth = linearDepth(terrainDepth);\n\
    waterDepth = linearDepth(waterDepth);\n\
\n\
    float dpVal = 180.0 * max(0.0,terrainDepth - waterDepth);\n\
    dpVal = clamp(dpVal, 0.0,4.0);\n\
    //dpVal = pow(dpVal, 0.1);\n\
\n\
\n\
    float fbias = 0.2;\n\
    float fscale = 0.2;\n\
    float fpow = 22.0;\n\
    vec3 sundir = unif_LightPos;\n\
\n\
    sundir = normalize(sundir);\n\
\n\
    vec3 nor = -calnor(fs_Uv);\n\
    vec3 viewdir = normalize(u_Eye - fs_Pos);\n\
    vec3 lightdir = normalize(sundir);\n\
    vec3 halfway = normalize(lightdir + viewdir);\n\
    vec3 reflectedSky = sky(halfway);\n\
    float spec = pow(max(dot(nor, halfway), 0.0), 333.0);\n\
\n\
\n\
    float R = max(0.0, min(1.0, fbias + fscale * pow(1.0 + dot(viewdir, -nor), fpow)));\n\
\n\
    //lamb =1.f;\n\
\n\
    float yval = texture(hightmap,fs_Uv).x * 4.0;\n\
    float wval = texture(hightmap,fs_Uv).y;\n\
    wval /= 1.0;\n\
\n\
\n\
\n\
    vec3 watercolor = mix(vec3(0.8,0.0,0.0), vec3(0.0,0.0,0.8), sediment * 2.0);\n\
    vec3 watercolorspec = vec3(1.0);\n\
    watercolorspec *= spec;\n\
\n\
\n\
\n\
    out_Col = vec4(vec3(0.0,0.2,0.5) + R * reflectedSky + watercolorspec  , (.5 + spec) * u_WaterTransparency * dpVal);\n\
    col_reflect = vec4(1.0);\n\
    */\n\
}";
ShaderSource.waterSimTerrainRenderVS = "\n\
attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
\n\
uniform mat4 buildingRotMatrix; // use this to calculate normal from hightMap textures.\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 scaleLC;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D terrainMapToCompare;\n\
\n\
uniform vec2 u_screenSize;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec2 u_terrainTextureSize; // for example 512 x 512.\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying vec2 vTexCoord;\n\
varying float depth;\n\
varying vec3 vNormal;\n\
varying vec3 vViewRay;\n\
varying float vTerrainSlided;\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainmap, texCoord).b;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
float getTerrainToCompareHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainMapToCompare, texCoord).b;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
float getTerrainHeight_interpolated(const vec2 uv) \n\
{\n\
    vec2 px = 1.0 / u_terrainTextureSize;\n\
    vec2 vc = (floor(uv * u_terrainTextureSize)) * px;\n\
    vec2 f = fract(uv * u_terrainTextureSize);\n\
    float tl = texture2D(terrainmap, vc).r;\n\
    float tr = texture2D(terrainmap, vc + vec2(px.x, 0)).r;\n\
    float bl = texture2D(terrainmap, vc + vec2(0, px.y)).r;\n\
    float br = texture2D(terrainmap, vc + px).r;\n\
\n\
    float h =  mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n\
	h = u_heightMap_MinMax.x + h * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
	return h;\n\
}\n\
\n\
vec3 calculateNormalFromHeights(in vec2 texCoord, in float curHeight)\n\
{\n\
	vec3 normal;\n\
	float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
	float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
	vec3 curPos = vec3(0.0, 0.0, curHeight);\n\
	vec3 upPos = vec3(0.0, cellSize_y, getTerrainHeight_interpolated(texCoord + vec2(0.0, divY)));\n\
	vec3 rightPos = vec3(cellSize_x, 0.0, getTerrainHeight_interpolated(texCoord + vec2(divX, 0.0)));\n\
\n\
	vec3 rightDir = (rightPos - curPos);\n\
	vec3 upDir = (upPos - curPos);\n\
\n\
	normal = normalize(cross(rightDir, upDir));\n\
	return normal;\n\
}\n\
\n\
void main()\n\
{\n\
	// read the altitude from hightmap.\n\
	vTexCoord = texCoord; // used for difusseTex.\n\
\n\
	//float terrainHeight = getTerrainHeight_interpolated(texCoord);\n\
	float terrainHeight = getTerrainHeight(texCoord);\n\
	float height = terrainHeight; \n\
	float terrainToCompareHeight = getTerrainToCompareHeight(texCoord);\n\
\n\
	vTerrainSlided = -1.0;\n\
	if(abs(terrainToCompareHeight - terrainHeight) > 0.8)\n\
	{\n\
		vTerrainSlided = 1.0;\n\
	}\n\
\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	// calculate the up direction:\n\
	vec4 posWC = vec4(objPosLow + objPosHigh, 1.0);\n\
	vec3 upDir = normalize(posWC.xyz);\n\
\n\
	vec4 finalPos4 =  vec4(pos4.x + upDir.x * height, pos4.y + upDir.y * height, pos4.z + upDir.z * height, 1.0);\n\
\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * finalPos4;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * finalPos4;\n\
	//vertexPos = orthoPos.xyz;\n\
	depth = (-orthoPos.z)/(far); // the correct value.\n\
\n\
	// Calculate normal.\n\
	// try to calculate normal here.\n\
	////vec3 ndc = gl_Position.xyz / gl_Position.w; //perspective divide/normalize\n\
	////vec2 screenPos = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1\n\
	////vViewRay = normalize(-getViewRay(screenPos, depth));\n\
\n\
	vec3 normalLC = calculateNormalFromHeights(texCoord, terrainHeight);\n\
	vec4 normalWC = buildingRotMatrix * vec4(normalLC, 1.0);\n\
	vec4 normalCC = normalMatrix4 * normalWC;\n\
	vNormal = normalCC.xyz;\n\
	\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//---------------------------------------------------------------------------------\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}\n\
";
ShaderSource.waterUpdateParticlesFS = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D u_particles;\n\
uniform sampler2D u_wind;\n\
uniform sampler2D u_windGlobeDepthTex;\n\
uniform sampler2D u_windGlobeNormalTex;\n\
\n\
uniform mat4 modelViewMatrixInv;\n\
\n\
uniform vec2 u_wind_res;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform vec3 u_geoCoordRadiansMax;\n\
uniform vec3 u_geoCoordRadiansMin;\n\
uniform float u_rand_seed;\n\
uniform float u_speed_factor;\n\
uniform float u_interpolation;\n\
uniform float u_drop_rate;\n\
uniform float u_drop_rate_bump;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform vec4 u_visibleTilesRanges[16];\n\
uniform int u_visibleTilesRangesCount;\n\
\n\
uniform float tangentOfHalfFovy;\n\
uniform float far;            \n\
uniform float aspectRatio; \n\
\n\
// new uniforms test.\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform mat4 buildingRotMatrixInv;\n\
uniform vec2 uNearFarArray[4];\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
// pseudo-random generator\n\
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
// https://community.khronos.org/t/random-values/75728\n\
float rand(const vec2 co) {\n\
    float t = dot(rand_constants.xy, co);\n\
    return fract(sin(t) * (rand_constants.z + t));\n\
}\n\
\n\
vec2 encodeVelocity(in vec2 vel)\n\
{\n\
	return vel*0.5 + 0.5;\n\
}\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
}\n\
\n\
// wind speed lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation\n\
vec2 lookup_wind(const vec2 uv) {\n\
    //return texture2D(u_wind, uv).rg; // lower-res hardware filtering\n\
	\n\
    vec2 px = 1.0 / u_wind_res;\n\
    vec2 vc = (floor(uv * u_wind_res)) * px;\n\
    vec2 f = fract(uv * u_wind_res);\n\
    vec2 tl = texture2D(u_wind, vc).rg;\n\
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;\n\
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;\n\
    vec2 br = texture2D(u_wind, vc + px).rg;\n\
\n\
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n\
}\n\
\n\
float radiusAtLatitudeRad(in float latRad)\n\
{\n\
	// a = equatorialRadius, b = polarRadius.\n\
	// r = a*b / sqrt(a2*sin2(lat) + b2*cos2(lat)).\n\
	//------------------------------------------------------\n\
	float a = 6378137.0; // Globe.equatorialRadius();\n\
	float b = 6356752.3142; // Globe.polarRadius();\n\
	float a2 = 40680631590769.0; // Globe.equatorialRadiusSquared();\n\
	float b2 = 40408299984087.05552164; // Globe.polarRadiusSquared();\n\
	\n\
	float sin = sin(latRad);\n\
	float cos = cos(latRad);\n\
	float sin2 = sin*sin;\n\
	float cos2 = cos*cos;\n\
	\n\
	float radius = (a*b)/(sqrt(a2*sin2 + b2*cos2));\n\
	return radius;\n\
}\n\
\n\
void main() \n\
{\n\
    vec4 color = texture2D(u_particles, v_tex_pos);\n\
    vec2 pos = vec2(\n\
        color.r / 255.0 + color.b,\n\
        color.g / 255.0 + color.a); // decode particle position from pixel RGBA\n\
\n\
	vec2 windMapTexCoord = pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
	// Test debug:::::::::::::::::::::::::::::::::::\n\
	//vec2 velColor = vec2(1.0, 0.0);\n\
	vec2 velColor = lookup_wind(windMapTexCoord);\n\
	vec2 decodedVel = decodeVelocity(velColor);\n\
	// End test.------------------------------------\n\
\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, decodeVelocity(lookup_wind(windMapTexCoord)));\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
	if(abs(decodedVel.x) < 0.004 && abs(decodedVel.y) < 0.004) // 1/255 = 0.0039...\n\
	{\n\
		speed_t = 0.0;\n\
		velocity = vec2(0.0);\n\
	}\n\
\n\
\n\
\n\
    // Calculate pixelSizes.**************************************************************************************************\n\
	//vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	//float radius = length(buildingPos);\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
\n\
    float midLatRad = (maxLatRad + minLatRad) / 2.0;\n\
    float radius = radiusAtLatitudeRad(midLatRad);\n\
\n\
	float distortion = cos((minLatRad + pos.y * latRadRange ));\n\
\n\
	float meterToLon = 1.0/(radius * distortion);\n\
	float meterToLat = 1.0 / radius;\n\
\n\
	float xSpeedFactor = meterToLon / lonRadRange;\n\
	float ySpeedFactor = meterToLat / latRadRange;\n\
\n\
	xSpeedFactor *= 1.0 * u_speed_factor;\n\
	ySpeedFactor *= 1.0 * u_speed_factor;\n\
\n\
	vec2 offset = vec2(velocity.x / distortion * xSpeedFactor, -velocity.y * ySpeedFactor);\n\
\n\
    // update particle position, wrapping around the date line\n\
    pos = fract(1.0 + pos + offset);\n\
	// End ******************************************************************************************************************\n\
\n\
    float drop = 0.0;\n\
\n\
    // a random seed to use for the particle drop\n\
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;\n\
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;\n\
    drop = step(1.0 - drop_rate, rand(seed));\n\
\n\
    //vec4 vel = texture2D(u_wind, v_tex_pos);\n\
\n\
    if(drop > 0.1 || speed_t < 0.0006) // 0.01\n\
	{\n\
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );\n\
		pos = random_pos;\n\
		\n\
		// check the velocity in the new position.***\n\
		decodedVel = decodeVelocity(lookup_wind(random_pos));\n\
		if(abs(decodedVel.x) < 0.004 && abs(decodedVel.y) < 0.004) // 1/255 = 0.0039...\n\
		{\n\
			//pos = vec2( 0.0, 0.0);\n\
\n\
			vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );\n\
			pos = random_pos;\n\
		}\n\
		\n\
		\n\
	}\n\
    \n\
    // encode the new particle position back into RGBA\n\
    gl_FragData[0] = vec4(\n\
        fract(pos * 255.0),\n\
        floor(pos * 255.0) / 255.0);\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(velColor, 0.0, 0.0); //\n\
        gl_FragData[2] = vec4(0.0); // \n\
        gl_FragData[3] = vec4(0.0); // \n\
        gl_FragData[4] = vec4(0.0); // \n\
    #endif\n\
}";
ShaderSource.waterVoxelizeFromDepthTexFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
\n\
uniform bool u_textureFlipYAxis;\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
uniform int u_mosaicTexSize[3]; // The mosaic texture size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_lowestMosaicSliceIndex;\n\
uniform vec2 u_heightMap_MinMax; // dem of terrain (buildings included) min max heights. \n\
uniform vec2 u_realTex3d_minMaxAltitudes; // min max of tex3d slices altitudes.***\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
	//       Sample of a slice of the mosaic texture.***\n\
	//\n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_15  |   tex_16  |   tex_17  |   tex_18  |   tex_19  |      row 3  \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_10  |   tex_11  |   tex_12  |   tex_13  |   tex_14  |      row 2   \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_5   |   tex_6   |   tex_7   |   tex_8   |   tex_9   |      row 1    \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   |   tex_4   |      row 0     \n\
	//      |           |           |           |           |           |  \n\
	//      +-----------+-----------+-----------+-----------+-----------+   \n\
    //\n\
    //          col 0       col 1       col 2       col 3       col 4\n\
int getSliceIdx_ofTexture3D(int col, int row, int currMosaicSliceIdx)\n\
{\n\
    int subTexCount_inAMosaicSlice = u_mosaicSize[0] * u_mosaicSize[1]; // total textures count in a mosaic slice.***\n\
    int currentSlicesAmount = (row * u_mosaicSize[0]) + col; // the textures count under the texture[col, row] in a mosaic slice.***\n\
    int tex3DSliceIdx = subTexCount_inAMosaicSlice * currMosaicSliceIdx + currentSlicesAmount;\n\
\n\
    return tex3DSliceIdx;\n\
}\n\
\n\
float getSliceAltitude_ofTexture3D(int col, int row, int currMosaicSliceIdx)\n\
{\n\
    int sliceIdx = getSliceIdx_ofTexture3D(col, row, currMosaicSliceIdx);\n\
    //float slice_altitude = float(sliceIdx) / float(u_texSize[2]); // original.***\n\
    float unitary_alt = float(sliceIdx) / float(u_texSize[2]);\n\
    float slice_altitude = u_realTex3d_minMaxAltitudes.x + unitary_alt * (u_realTex3d_minMaxAltitudes.y - u_realTex3d_minMaxAltitudes.x);\n\
    return slice_altitude;\n\
}\n\
\n\
vec2 getColRow_and_subTexCoord(in vec2 texCoord, inout vec2 subTexCoord)\n\
{\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    // Determine the [col, row] of the mosaic.***\n\
    vec2 resultColRow = vec2(floor(texCoord.x / sRange), floor(texCoord.y / tRange));\n\
\n\
    // determine the subTexCoord.***\n\
    float col_mod = texCoord.x - resultColRow.x * sRange;\n\
    float row_mod = texCoord.y - resultColRow.y * tRange;\n\
    float s = col_mod / sRange;\n\
    float t = row_mod / tRange;\n\
    subTexCoord = vec2(s, t);\n\
\n\
    return resultColRow;\n\
}\n\
\n\
void main()\n\
{\n\
    // By tex-coord, must know the column & row of the mosaic texture.***\n\
    // Note : The rendering process uses a FBO with (u_mosaicTexSize[0] X u_mosaicTexSize[1]) as screen size.***\n\
    vec2 subTexCoord;\n\
    vec2 colRow = getColRow_and_subTexCoord(v_tex_pos, subTexCoord);\n\
\n\
    vec4 depth;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        depth = texture2D(depthTex, vec2(subTexCoord.x, 1.0 - subTexCoord.y));\n\
    }\n\
    else\n\
    {\n\
        depth = texture2D(depthTex, vec2(subTexCoord.x, subTexCoord.y));\n\
    }\n\
\n\
    // Now, for each slice, must determine if the \"depth\" value is bigger or lower than the slice altitude (the slice altitude in a range [0 to 1]).***\n\
    float col = colRow.x;\n\
    float row = colRow.y;\n\
    int col_int = int(col);\n\
    int row_int = int(row);\n\
    // slice 0.\n\
    // must determine the altitude of the sub-texture[col, row].\n\
    float slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex);\n\
    float r = col / float(u_mosaicSize[0]);\n\
    float g = row / float(u_mosaicSize[1]);\n\
    vec4 slice_color = vec4(0.0);\n\
\n\
    float depthTex_altitude = u_heightMap_MinMax.x + depth.r * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
\n\
    //if(depth.r > slice_altitude)\n\
    if(depthTex_altitude > slice_altitude)\n\
    {\n\
        slice_color = vec4(0.0, 0.0, 0.0, 1.0);\n\
    }\n\
\n\
    gl_FragData[0] = slice_color;  \n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        // slice 1.\n\
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 1);\n\
        slice_color = vec4(0.0);\n\
        if(depthTex_altitude > slice_altitude)\n\
        {\n\
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);\n\
        }\n\
        gl_FragData[1] = slice_color;\n\
\n\
        // slice 2.\n\
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 2);\n\
        slice_color = vec4(0.0);\n\
        if(depthTex_altitude > slice_altitude)\n\
        {\n\
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);\n\
        }\n\
        gl_FragData[2] = slice_color;\n\
\n\
        // slice 3.\n\
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 3);\n\
        slice_color = vec4(0.0);\n\
        if(depthTex_altitude > slice_altitude)\n\
        {\n\
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);\n\
        }\n\
        gl_FragData[3] = slice_color; \n\
\n\
        // slice 4.\n\
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 4);\n\
        slice_color = vec4(0.0);\n\
        if(depthTex_altitude > slice_altitude)\n\
        {\n\
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);\n\
        }\n\
        gl_FragData[4] = slice_color;\n\
\n\
        // slice 5.\n\
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 5);\n\
        slice_color = vec4(0.0);\n\
        if(depthTex_altitude > slice_altitude)\n\
        {\n\
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);\n\
        }\n\
        gl_FragData[5] = slice_color; \n\
\n\
        // slice 6.\n\
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 6);\n\
        slice_color = vec4(0.0);\n\
        if(depthTex_altitude > slice_altitude)\n\
        {\n\
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);\n\
        }\n\
        gl_FragData[6] = slice_color; \n\
\n\
        // slice 7.\n\
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 7);\n\
        slice_color = vec4(0.0);\n\
        if(depthTex_altitude > slice_altitude)\n\
        {\n\
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);\n\
        }\n\
        gl_FragData[7] = slice_color;\n\
    #endif\n\
\n\
}";
ShaderSource.waterVoxelizeFromPartialXDirectionTexture3DFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D currentSceneVoxelizedMosaicTex;\n\
uniform sampler2D partialXDirectionMosaicTex;\n\
\n\
//uniform bool u_textureFlipYAxis;\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
//uniform int u_mosaicTexSize[3]; // The mosaic texture size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_lowestMosaicSliceIndex;\n\
\n\
// vars for partialXDirectionMosaicTex:\n\
uniform int u_lowestXDirMosaicSliceIndex;\n\
uniform int u_xDirMosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_xDirTextureSize[3]; // The real 3D texture size.***\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
	//       Sample of a slice of the mosaic texture.***\n\
	//\n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_15  |   tex_16  |   tex_17  |   tex_18  |   tex_19  |      row 3  \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_10  |   tex_11  |   tex_12  |   tex_13  |   tex_14  |      row 2   \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_5   |   tex_6   |   tex_7   |   tex_8   |   tex_9   |      row 1    \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   |   tex_4   |      row 0     \n\
	//      |           |           |           |           |           |  \n\
	//      +-----------+-----------+-----------+-----------+-----------+   \n\
    //\n\
    //          col 0       col 1       col 2       col 3       col 4\n\
int getSliceIdx_ofTexture3D(int col, int row, int currMosaicSliceIdx)\n\
{\n\
    int subTexCount_inAMosaicSlice = u_mosaicSize[0] * u_mosaicSize[1]; // total textures count in a mosaic slice.***\n\
    int currentSlicesAmount = (row * u_mosaicSize[0]) + col; // the textures count under the texture[col, row] in a mosaic slice.***\n\
    int tex3DSliceIdx = subTexCount_inAMosaicSlice * currMosaicSliceIdx + currentSlicesAmount;\n\
\n\
    return tex3DSliceIdx;\n\
}\n\
\n\
vec2 getColRow_and_subTexCoord(in vec2 texCoord, inout vec2 subTexCoord)\n\
{\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    // Determine the [col, row] of the mosaic.***\n\
    vec2 resultColRow = vec2(floor(texCoord.x / sRange), floor(texCoord.y / tRange));\n\
\n\
    // determine the subTexCoord.***\n\
    float col_mod = texCoord.x - resultColRow.x * sRange;\n\
    float row_mod = texCoord.y - resultColRow.y * tRange;\n\
    float s = col_mod / sRange;\n\
    float t = row_mod / tRange;\n\
    subTexCoord = vec2(s, t);\n\
\n\
    return resultColRow;\n\
}\n\
\n\
vec2 getColRow_ofSliceIdx(in int sliceIdx, in int mosaicColsCount)\n\
{\n\
    // Given a sliceIdx, mosaicColumnsCount & mosaicRowsCount, this function returns the column & row of the sliceIdx.***\n\
    float row = floor(float(sliceIdx)/float(mosaicColsCount));\n\
    //float col = mod(float(sliceIdx), float(mosaicColsCount)); // mod = float(sliceIdx) - float(mosaicColsCount) * row;\n\
    float col = float(sliceIdx) - float(mosaicColsCount) * row;\n\
    vec2 colRow = vec2(col, row);\n\
    return colRow;\n\
}\n\
\n\
 float getVoxelSpaceValue(in vec2 texCoord)\n\
{\n\
    // The scene voxelMatrix is into flux_RFU_MosaicTex_HIGH(here named currentSceneVoxelizedMosaicTex), in alpha channel.***\n\
    vec4 color4_RFU_HIGH = texture2D(currentSceneVoxelizedMosaicTex, texCoord);\n\
    return color4_RFU_HIGH.a;\n\
}\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row, in int mosaicNumCols, in int mosaicNumRows)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(mosaicNumCols);\n\
    float tRange = 1.0 / float(mosaicNumRows);\n\
\n\
    float s = float(col) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row) * tRange + subTexCoord.y * tRange;\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
    return resultTexCoord;\n\
}\n\
\n\
void main()\n\
{\n\
    // Note : this shader only can have one output. Is not possible MRT.***\n\
    //-------------------------------------------------------------------------\n\
\n\
    // 1rst, check if the current voxel is solid or not.\n\
    // If the current voxel is solid, then write \"solid\" and return. No need calculate anything.***\n\
    vec4 color4_RFU_HIGH = texture2D(currentSceneVoxelizedMosaicTex, v_tex_pos); \n\
    if(color4_RFU_HIGH.a > 0.0)\n\
    {\n\
        gl_FragData[0] = color4_RFU_HIGH;  \n\
        return;\n\
    }\n\
\n\
    // By tex-coord, must know the column & row of the mosaic texture.***\n\
    // Note : The rendering process uses a FBO with (u_mosaicTexSize[0] X u_mosaicTexSize[1]) as screen size.***\n\
    vec2 subTexCoord;\n\
    vec2 colRow = getColRow_and_subTexCoord(v_tex_pos, subTexCoord); // here returns the subTexCoords too.***\n\
    float col = colRow.x;\n\
    float row = colRow.y;\n\
    int col_int = int(col);\n\
    int row_int = int(row);\n\
\n\
    // Now, with \"colRow\" & \"u_lowestMosaicSliceIndex\" determine the sliceIdx of the real3dTexture.***\n\
    int sliceIdx = getSliceIdx_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex);\n\
\n\
    // Now, with \"subTexCoord\" & \"sliceIdx\" calculate the textureIdx of \"partialYDirectionMosaicTex\" & the texCoords of it.***\n\
    // With subTexCoord.y we can determine the partialYDirectionMosaicTex_sliceIdx.***\n\
    int xDirSliceIdx = int(subTexCoord.x * float(u_texSize[0])); // the absolute xDirSliceIdx. There are \"u_texSize[1]\" yDirSlices count in total, but we only have 8 yDirSlices in a mosaic.***\n\
\n\
    vec4 finalColor4 = vec4(color4_RFU_HIGH.r, color4_RFU_HIGH.g, color4_RFU_HIGH.b, color4_RFU_HIGH.a);\n\
\n\
    // Now, check if \"xDirSliceIdx\" is inside of the 8 YDirTextures availables.***\n\
    \n\
    if(xDirSliceIdx < u_lowestXDirMosaicSliceIndex || xDirSliceIdx > u_lowestXDirMosaicSliceIndex + 7)\n\
    {\n\
        gl_FragData[0] = color4_RFU_HIGH;    \n\
        return;\n\
    } \n\
\n\
    int currXDirSliceIdx = xDirSliceIdx - u_lowestXDirMosaicSliceIndex;\n\
\n\
\n\
    // Now determine the col & row of the yDirMosaicTexture.***\n\
    vec2 colRow_xDirMosaic = getColRow_ofSliceIdx(currXDirSliceIdx, u_xDirMosaicSize[0]);\n\
\n\
    // Now, calculate the subTexCoordXDir (texCoord in realTex3D).***\n\
    // Note : u_texSize[2] must to be = u_xDirTextureSize[1];\n\
    vec2 subTexCoordXDir = vec2(1.0 - subTexCoord.y, float(sliceIdx)/float(u_xDirTextureSize[1]));\n\
\n\
    // Now, calculate the texCoordXDirMosaic.***\n\
    int col_xDirMosaic = int(colRow_xDirMosaic.x);\n\
    int row_xDirMosaic = int(colRow_xDirMosaic.y);\n\
\n\
    vec2 texCoordXDirMosaic = subTexCoord_to_texCoord(subTexCoordXDir, col_xDirMosaic, row_xDirMosaic, u_xDirMosaicSize[0], u_xDirMosaicSize[1]);\n\
\n\
    // Now, read the value:\n\
    vec4 color4_xDirTex = texture2D(partialXDirectionMosaicTex, texCoordXDirMosaic); \n\
\n\
    if(finalColor4.a < color4_xDirTex.a)\n\
    {\n\
        finalColor4.a = color4_xDirTex.a;\n\
    }\n\
\n\
    gl_FragData[0] = finalColor4;  \n\
\n\
}";
ShaderSource.waterVoxelizeFromPartialYDirectionTexture3DFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D currentSceneVoxelizedMosaicTex;\n\
uniform sampler2D partialYDirectionMosaicTex;\n\
\n\
//uniform bool u_textureFlipYAxis;\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
//uniform int u_mosaicTexSize[3]; // The mosaic texture size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_lowestMosaicSliceIndex;\n\
\n\
// vars for partialYDirectionMosaicTex:\n\
uniform int u_lowestYDirMosaicSliceIndex;\n\
uniform int u_yDirMosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_yDirTextureSize[3]; // The real 3D texture size.***\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
	//       Sample of a slice of the mosaic texture.***\n\
	//\n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_15  |   tex_16  |   tex_17  |   tex_18  |   tex_19  |      row 3  \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_10  |   tex_11  |   tex_12  |   tex_13  |   tex_14  |      row 2   \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_5   |   tex_6   |   tex_7   |   tex_8   |   tex_9   |      row 1    \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   |   tex_4   |      row 0     \n\
	//      |           |           |           |           |           |  \n\
	//      +-----------+-----------+-----------+-----------+-----------+   \n\
    //\n\
    //          col 0       col 1       col 2       col 3       col 4\n\
int getSliceIdx_ofTexture3D(int col, int row, int currMosaicSliceIdx)\n\
{\n\
    int subTexCount_inAMosaicSlice = u_mosaicSize[0] * u_mosaicSize[1]; // total textures count in a mosaic slice.***\n\
    int currentSlicesAmount = (row * u_mosaicSize[0]) + col; // the textures count under the texture[col, row] in a mosaic slice.***\n\
    int tex3DSliceIdx = subTexCount_inAMosaicSlice * currMosaicSliceIdx + currentSlicesAmount;\n\
\n\
    return tex3DSliceIdx;\n\
}\n\
\n\
vec2 getColRow_and_subTexCoord(in vec2 texCoord, inout vec2 subTexCoord)\n\
{\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    // Determine the [col, row] of the mosaic.***\n\
    vec2 resultColRow = vec2(floor(texCoord.x / sRange), floor(texCoord.y / tRange));\n\
\n\
    // determine the subTexCoord.***\n\
    float col_mod = texCoord.x - resultColRow.x * sRange;\n\
    float row_mod = texCoord.y - resultColRow.y * tRange;\n\
    float s = col_mod / sRange;\n\
    float t = row_mod / tRange;\n\
    subTexCoord = vec2(s, t);\n\
\n\
    return resultColRow;\n\
}\n\
\n\
vec2 getColRow_ofSliceIdx(in int sliceIdx, in int mosaicColsCount)\n\
{\n\
    // Given a sliceIdx, mosaicColumnsCount & mosaicRowsCount, this function returns the column & row of the sliceIdx.***\n\
    float row = floor(float(sliceIdx)/float(mosaicColsCount));\n\
    //float col = mod(float(sliceIdx), float(mosaicColsCount)); // mod = float(sliceIdx) - float(mosaicColsCount) * row;\n\
    float col = float(sliceIdx) - float(mosaicColsCount) * row;\n\
    vec2 colRow = vec2(col, row);\n\
    return colRow;\n\
}\n\
\n\
 float getVoxelSpaceValue(in vec2 texCoord)\n\
{\n\
    // The scene voxelMatrix is into flux_RFU_MosaicTex_HIGH(here named currentSceneVoxelizedMosaicTex), in alpha channel.***\n\
    vec4 color4_RFU_HIGH = texture2D(currentSceneVoxelizedMosaicTex, texCoord);\n\
    return color4_RFU_HIGH.a;\n\
}\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row, in int mosaicNumCols, in int mosaicNumRows)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(mosaicNumCols);\n\
    float tRange = 1.0 / float(mosaicNumRows);\n\
\n\
    float s = float(col) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row) * tRange + subTexCoord.y * tRange;\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
    return resultTexCoord;\n\
}\n\
\n\
void main()\n\
{\n\
    // Note : this shader only can have one output. Is not possible MRT.***\n\
    //-------------------------------------------------------------------------\n\
\n\
    // 1rst, check if the current voxel is solid or not.\n\
    // If the current voxel is solid, then write \"solid\" and return. No need calculate anything.***\n\
    vec4 color4_RFU_HIGH = texture2D(currentSceneVoxelizedMosaicTex, v_tex_pos); \n\
    if(color4_RFU_HIGH.a > 0.0)\n\
    {\n\
        gl_FragData[0] = color4_RFU_HIGH;  \n\
        return;\n\
    }\n\
\n\
    // By tex-coord, must know the column & row of the mosaic texture.***\n\
    // Note : The rendering process uses a FBO with (u_mosaicTexSize[0] X u_mosaicTexSize[1]) as screen size.***\n\
    vec2 subTexCoord;\n\
    vec2 colRow = getColRow_and_subTexCoord(v_tex_pos, subTexCoord); // here returns the subTexCoords too.***\n\
    float col = colRow.x;\n\
    float row = colRow.y;\n\
    int col_int = int(col);\n\
    int row_int = int(row);\n\
\n\
    // Now, with \"colRow\" & \"u_lowestMosaicSliceIndex\" determine the sliceIdx of the real3dTexture.***\n\
    int sliceIdx = getSliceIdx_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex);\n\
\n\
    // Now, with \"subTexCoord\" & \"sliceIdx\" calculate the textureIdx of \"partialYDirectionMosaicTex\" & the texCoords of it.***\n\
    // With subTexCoord.y we can determine the partialYDirectionMosaicTex_sliceIdx.***\n\
    int yDirSliceIdx = int(subTexCoord.y * float(u_texSize[1])); // the absolute yDirSliceIdx. There are \"u_texSize[1]\" yDirSlices count in total, but we only have 8 yDirSlices in a mosaic.***\n\
\n\
    vec4 finalColor4 = vec4(color4_RFU_HIGH.r, color4_RFU_HIGH.g, color4_RFU_HIGH.b, color4_RFU_HIGH.a);\n\
\n\
    // Now, check if \"yDirSliceIdx\" is inside of the 8 YDirTextures availables.***\n\
    \n\
    if(yDirSliceIdx < u_lowestYDirMosaicSliceIndex || yDirSliceIdx > u_lowestYDirMosaicSliceIndex + 7)\n\
    {\n\
        gl_FragData[0] = color4_RFU_HIGH;    \n\
        return;\n\
    } \n\
\n\
    int currYDirSliceIdx = yDirSliceIdx - u_lowestYDirMosaicSliceIndex;\n\
\n\
\n\
    // Now determine the col & row of the yDirMosaicTexture.***\n\
    vec2 colRow_yDirMosaic = getColRow_ofSliceIdx(currYDirSliceIdx, u_yDirMosaicSize[0]);\n\
\n\
    // Now, calculate the subTexCoordYDir (texCoord in realTex3D).***\n\
    // Note : u_texSize[2] must to be = u_yDirTextureSize[1];\n\
    vec2 subTexCoordYDir = vec2(subTexCoord.x, float(sliceIdx)/float(u_yDirTextureSize[1]));\n\
\n\
    // Now, calculate the texCoordYDirMosaic.***\n\
    int col_yDirMosaic = int(floor(colRow_yDirMosaic.x));\n\
    int row_yDirMosaic = int(floor(colRow_yDirMosaic.y));\n\
\n\
    vec2 texCoordYDirMosaic = subTexCoord_to_texCoord(subTexCoordYDir, col_yDirMosaic, row_yDirMosaic, u_yDirMosaicSize[0], u_yDirMosaicSize[1]);\n\
\n\
    // Now, read the value:\n\
    vec4 color4_yDirTex = texture2D(partialYDirectionMosaicTex, texCoordYDirMosaic); \n\
\n\
    if(finalColor4.a < color4_yDirTex.a)\n\
    {\n\
        finalColor4.a = color4_yDirTex.a;\n\
    }\n\
\n\
    gl_FragData[0] = finalColor4;  \n\
\n\
}";
ShaderSource.waterVoxelizeFromPartialZDirectionTexture3DFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D currentSceneVoxelizedMosaicTex;\n\
uniform sampler2D partialZDirectionMosaicTex;\n\
\n\
//uniform bool u_textureFlipYAxis;\n\
uniform int u_texSize[3]; // The original texture3D size.***\n\
//uniform int u_mosaicTexSize[3]; // The mosaic texture size.***\n\
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_lowestMosaicSliceIndex;\n\
\n\
// vars for partialZDirectionMosaicTex:\n\
uniform int u_lowestZDirMosaicSliceIndex;\n\
uniform int u_zDirMosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
uniform int u_zDirTextureSize[3]; // The real 3D texture size.***\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
	//       Sample of a slice of the mosaic texture.***\n\
	//\n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_15  |   tex_16  |   tex_17  |   tex_18  |   tex_19  |      row 3  \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_10  |   tex_11  |   tex_12  |   tex_13  |   tex_14  |      row 2   \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_5   |   tex_6   |   tex_7   |   tex_8   |   tex_9   |      row 1    \n\
	//      |           |           |           |           |           |     \n\
	//      +-----------+-----------+-----------+-----------+-----------+\n\
	//      |           |           |           |           |           |           \n\
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   |   tex_4   |      row 0     \n\
	//      |           |           |           |           |           |  \n\
	//      +-----------+-----------+-----------+-----------+-----------+   \n\
    //\n\
    //          col 0       col 1       col 2       col 3       col 4\n\
int getSliceIdx_ofTexture3D(int col, int row, int currMosaicSliceIdx)\n\
{\n\
    int subTexCount_inAMosaicSlice = u_mosaicSize[0] * u_mosaicSize[1]; // total textures count in a mosaic slice.***\n\
    int currentSlicesAmount = (row * u_mosaicSize[0]) + col; // the textures count under the texture[col, row] in a mosaic slice.***\n\
    int tex3DSliceIdx = subTexCount_inAMosaicSlice * currMosaicSliceIdx + currentSlicesAmount;\n\
\n\
    return tex3DSliceIdx;\n\
}\n\
\n\
vec2 getColRow_and_subTexCoord(in vec2 texCoord, inout vec2 subTexCoord)\n\
{\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    float sRange = 1.0 / float(u_mosaicSize[0]);\n\
    float tRange = 1.0 / float(u_mosaicSize[1]);\n\
\n\
    // Determine the [col, row] of the mosaic.***\n\
    vec2 resultColRow = vec2(floor(texCoord.x / sRange), floor(texCoord.y / tRange));\n\
\n\
    // determine the subTexCoord.***\n\
    float col_mod = texCoord.x - resultColRow.x * sRange;\n\
    float row_mod = texCoord.y - resultColRow.y * tRange;\n\
    float s = col_mod / sRange;\n\
    float t = row_mod / tRange;\n\
    subTexCoord = vec2(s, t);\n\
\n\
    return resultColRow;\n\
}\n\
\n\
vec2 getColRow_ofSliceIdx(in int sliceIdx, in int mosaicColsCount)\n\
{\n\
    // Given a sliceIdx, mosaicColumnsCount & mosaicRowsCount, this function returns the column & row of the sliceIdx.***\n\
    float row = floor(float(sliceIdx)/float(mosaicColsCount));\n\
    //float col = mod(float(sliceIdx), float(mosaicColsCount)); // mod = float(sliceIdx) - float(mosaicColsCount) * row;\n\
    float col = float(sliceIdx) - float(mosaicColsCount) * row;\n\
    vec2 colRow = vec2(col, row);\n\
    return colRow;\n\
}\n\
\n\
 float getVoxelSpaceValue(in vec2 texCoord)\n\
{\n\
    // The scene voxelMatrix is into flux_RFU_MosaicTex_HIGH(here named currentSceneVoxelizedMosaicTex), in alpha channel.***\n\
    vec4 color4_RFU_HIGH = texture2D(currentSceneVoxelizedMosaicTex, texCoord);\n\
    return color4_RFU_HIGH.a;\n\
}\n\
\n\
vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row, in int mosaicNumCols, in int mosaicNumRows)\n\
{\n\
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***\n\
    // The \"subTexCoord\" is the texCoord of the subTexture[col, row].***\n\
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***\n\
    float sRange = 1.0 / float(mosaicNumCols);\n\
    float tRange = 1.0 / float(mosaicNumRows);\n\
\n\
    float s = float(col) * sRange + subTexCoord.x * sRange;\n\
    float t = float(row) * tRange + subTexCoord.y * tRange;\n\
\n\
    vec2 resultTexCoord = vec2(s, t);\n\
    return resultTexCoord;\n\
}\n\
\n\
void main()\n\
{\n\
    // Note : this shader only can have one output. Is not possible MRT.***\n\
    //-------------------------------------------------------------------------\n\
\n\
    // 1rst, check if the current voxel is solid or not.\n\
    // If the current voxel is solid, then write \"solid\" and return. No need calculate anything.***\n\
    vec4 color4_RFU_HIGH = texture2D(currentSceneVoxelizedMosaicTex, v_tex_pos); \n\
    if(color4_RFU_HIGH.a > 0.0)\n\
    {\n\
        gl_FragData[0] = color4_RFU_HIGH;  \n\
        return;\n\
    }\n\
\n\
    // By tex-coord, must know the column & row of the mosaic texture.***\n\
    // Note : The rendering process uses a FBO with (u_mosaicTexSize[0] X u_mosaicTexSize[1]) as screen size.***\n\
    vec2 subTexCoord;\n\
    vec2 colRow = getColRow_and_subTexCoord(v_tex_pos, subTexCoord); // here returns the subTexCoords too.***\n\
    float col = colRow.x;\n\
    float row = colRow.y;\n\
    int col_int = int(col);\n\
    int row_int = int(row);\n\
\n\
    // Now, with \"colRow\" & \"u_lowestMosaicSliceIndex\" determine the sliceIdx of the real3dTexture.***\n\
    int sliceIdx = getSliceIdx_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex);\n\
\n\
    // Now, with \"subTexCoord\" & \"sliceIdx\" calculate the textureIdx of \"partialYDirectionMosaicTex\" & the texCoords of it.***\n\
    // With subTexCoord.y we can determine the partialYDirectionMosaicTex_sliceIdx.***\n\
    int zDirSliceIdx = u_texSize[2] - sliceIdx; // the absolute zDirSliceIdx. Is coincident to the simulation mosaic sliceIdx.***\n\
\n\
    vec4 finalColor4 = vec4(color4_RFU_HIGH.r, color4_RFU_HIGH.g, color4_RFU_HIGH.b, color4_RFU_HIGH.a);\n\
\n\
    // Now, check if \"xDirSliceIdx\" is inside of the 8 YDirTextures availables.***\n\
    \n\
    if(zDirSliceIdx < u_lowestZDirMosaicSliceIndex || zDirSliceIdx > u_lowestZDirMosaicSliceIndex + 7)\n\
    {\n\
        gl_FragData[0] = color4_RFU_HIGH;    \n\
        return;\n\
    } \n\
\n\
    int currZDirSliceIdx = zDirSliceIdx - u_lowestZDirMosaicSliceIndex;\n\
\n\
\n\
    // Now determine the col & row of the yDirMosaicTexture.***\n\
    vec2 colRow_zDirMosaic = getColRow_ofSliceIdx(currZDirSliceIdx, u_zDirMosaicSize[0]);\n\
\n\
    // Now, calculate the subTexCoordXDir (texCoord in realTex3D).***\n\
    //vec2 subTexCoordZDir = vec2(1.0 - subTexCoord.y, float(sliceIdx)/float(u_zDirTextureSize[1]));\n\
    vec2 subTexCoordZDir = vec2(subTexCoord.x, subTexCoord.y);\n\
\n\
    // Now, calculate the texCoordXDirMosaic.***\n\
    int col_zDirMosaic = int(colRow_zDirMosaic.x);\n\
    int row_zDirMosaic = int(colRow_zDirMosaic.y);\n\
\n\
    vec2 texCoordZDirMosaic = subTexCoord_to_texCoord(subTexCoordZDir, col_zDirMosaic, row_zDirMosaic, u_zDirMosaicSize[0], u_zDirMosaicSize[1]);\n\
\n\
    // Now, read the value:\n\
    vec4 color4_zDirTex = texture2D(partialZDirectionMosaicTex, texCoordZDirMosaic); \n\
\n\
    if(finalColor4.a < color4_zDirTex.a)\n\
    {\n\
        finalColor4.a = color4_zDirTex.a;\n\
    }\n\
\n\
    gl_FragData[0] = finalColor4;  \n\
\n\
}";
ShaderSource.waterVoxelizeFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D tex_0;\n\
\n\
uniform bool u_textureFlipYAxis;\n\
varying vec2 v_tex_pos;\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
    }\n\
    else\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    }\n\
    \n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = finalCol4; // depth\n\
        gl_FragData[2] = finalCol4; // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = finalCol4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.wgs84_volumFS = "precision mediump float;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
uniform sampler2D volumeTex;\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixInv;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float screenWidth;    \n\
uniform float screenHeight;\n\
uniform float aspectRatio;\n\
uniform float far;\n\
uniform float fovyRad;\n\
uniform float tanHalfFovy;\n\
\n\
// volume tex definition.***\n\
uniform int texNumCols;\n\
uniform int texNumRows;\n\
uniform int texNumSlices;\n\
uniform int numSlicesPerStacks;\n\
uniform int slicesNumCols;\n\
uniform int slicesNumRows;\n\
uniform float maxLon;\n\
uniform float minLon;\n\
uniform float maxLat;\n\
uniform float minLat;\n\
uniform float maxAlt;\n\
uniform float minAlt;\n\
uniform vec4 cuttingPlanes[6];   \n\
uniform int cuttingPlanesCount;\n\
\n\
uniform float maxValue;\n\
uniform float minValue;\n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tanHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
} \n\
\n\
float squaredLength(vec3 point1, vec3 point2)\n\
{\n\
	float a = point1.x - point2.x;\n\
	float b = point1.y - point2.y;\n\
	float c = point1.z - point2.z;\n\
	\n\
	float sqDist = a*a + b*b + c*c;\n\
	return sqDist;\n\
}\n\
\n\
void intersectionLineSphere(float radius, vec3 rayPos, vec3 rayDir, out int intersectType, out vec3 nearIntersectPos, out vec3 farIntersectPos)\n\
{\n\
	// line: (x, y, z) = x1 + t(x2 - x1), y1 + t(y2 - y1), z1 + t(z2 - z1)\n\
	// sphere: (x - x3)^2 + (y - y3)^2 + (z - z3)^2 = r^2, where x3, y3, z3 is the center of the sphere.\n\
	\n\
	// line:\n\
	vec3 p1 = rayPos;\n\
	vec3 lineDir = rayDir;\n\
	float dist = 1000.0;// any value is ok.***\n\
	vec3 p2 = vec3(p1.x + lineDir.x * dist, p1.y + lineDir.y * dist, p1.z + lineDir.z * dist);\n\
	float x1 = p1.x;\n\
	float y1 = p1.y;\n\
	float z1 = p1.z;\n\
	float x2 = p2.x;\n\
	float y2 = p2.y;\n\
	float z2 = p2.z;\n\
\n\
	// sphere:\n\
	float x3 = 0.0;\n\
	float y3 = 0.0;\n\
	float z3 = 0.0;\n\
	float r = radius;\n\
	\n\
	// resolve:\n\
	float x21 = (x2-x1);\n\
	float y21 = (y2-y1);\n\
	float z21 = (z2-z1);\n\
	\n\
	float a = x21*x21 + y21*y21 + z21*z21;\n\
	\n\
	float x13 = (x1-x3);\n\
	float y13 = (y1-y3);\n\
	float z13 = (z1-z3);\n\
	\n\
	float b = 2.0*(x21 * x13 + y21 * y13 + z21 * z13);\n\
	\n\
	float c = x3*x3 + y3*y3 + z3*z3 + x1*x1 + y1*y1 + z1*z1 - 2.0*(x3*x1 + y3*y1+ z3*z1) - r*r;\n\
	\n\
	float discriminant = b*b - 4.0*a*c;\n\
	\n\
	if (discriminant < 0.0)\n\
	{\n\
		// no intersection.***\n\
		intersectType = 0;\n\
	}\n\
	else if (discriminant == 0.0)\n\
	{\n\
		// this is tangent.***\n\
		intersectType = 1;\n\
		\n\
		float t1 = (-b)/(2.0*a);\n\
		nearIntersectPos = vec3(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1, z1 + (z2 - z1)*t1);\n\
	}\n\
	else\n\
	{\n\
		intersectType = 2;\n\
		\n\
		// find the nearest to p1.***\n\
		float sqrtDiscriminant = sqrt(discriminant);\n\
		float t1 = (-b + sqrtDiscriminant)/(2.0*a);\n\
		float t2 = (-b - sqrtDiscriminant)/(2.0*a);\n\
		\n\
		// solution 1.***\n\
		vec3 intersectPoint1 = vec3(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1, z1 + (z2 - z1)*t1);\n\
		vec3 intersectPoint2 = vec3(x1 + (x2 - x1)*t2, y1 + (y2 - y1)*t2, z1 + (z2 - z1)*t2);\n\
		\n\
		float dist1 = squaredLength(p1,intersectPoint1);\n\
		float dist2 = squaredLength(p1,intersectPoint2);\n\
		\n\
		// nearIntersectPos, out vec3 farIntersectPos\n\
		if (dist1 < dist2)\n\
		{\n\
			nearIntersectPos = intersectPoint1;\n\
			farIntersectPos = intersectPoint2;\n\
		}\n\
		else\n\
		{\n\
			nearIntersectPos = intersectPoint2;\n\
			farIntersectPos = intersectPoint1;\n\
		}\n\
	}\n\
}\n\
\n\
float atan2(float y, float x) \n\
{\n\
	if(x > 0.0)\n\
	{\n\
		return atan(y/x);\n\
	}\n\
	else if(x < 0.0)\n\
	{\n\
		if(y >= 0.0)\n\
		{\n\
			return atan(y/x) + M_PI;\n\
		}\n\
		else{\n\
			return atan(y/x) - M_PI;\n\
		}\n\
	}\n\
	else if(x == 0.0)\n\
	{\n\
		if(y>0.0)\n\
		{\n\
			return M_PI/2.0;\n\
		}\n\
		else if(y<0.0)\n\
		{\n\
			return -M_PI/2.0;\n\
		}\n\
		else{\n\
			return 0.0; // return undefined.***\n\
		}\n\
	}\n\
}\n\
\n\
void cartesianToGeographicWgs84(vec3 point, out vec3 result) \n\
{\n\
	// From WebWorldWind.***\n\
	// According to H. Vermeille, An analytical method to transform geocentric into geodetic coordinates\n\
	// http://www.springerlink.com/content/3t6837t27t351227/fulltext.pdf\n\
	\n\
	float firstEccentricitySquared = 6.69437999014E-3;\n\
	float equatorialRadius = 6378137.0;\n\
\n\
	// wwwind coord type.***\n\
	// X = point.z;\n\
	// Y = point.x;\n\
	// Z = point.y;\n\
\n\
	// magoWorld coord type.***\n\
	float X = point.x;\n\
	float Y = point.y;\n\
	float Z = point.z;\n\
	float XXpYY = X * X + Y * Y;\n\
	float sqrtXXpYY = sqrt(XXpYY);\n\
	float a = equatorialRadius;\n\
	float ra2 = 1.0 / (a * a);\n\
	float e2 = firstEccentricitySquared;\n\
	float e4 = e2 * e2;\n\
	float p = XXpYY * ra2;\n\
	float q = Z * Z * (1.0 - e2) * ra2;\n\
	float r = (p + q - e4) / 6.0;\n\
	float h;\n\
	float phi;\n\
	float u;\n\
	float evoluteBorderTest = 8.0 * r * r * r + e4 * p * q;\n\
	float rad1;\n\
	float rad2;\n\
	float rad3;\n\
	float atanAux;\n\
	float v;\n\
	float w;\n\
	float k;\n\
	float D;\n\
	float sqrtDDpZZ;\n\
	float e;\n\
	float lambda;\n\
	float s2;\n\
	float cbrtFac = 1.0/3.0;\n\
\n\
	if (evoluteBorderTest > 0.0 || q != 0.0) \n\
	{\n\
		if (evoluteBorderTest > 0.0) \n\
		{\n\
			// Step 2: general case\n\
			rad1 = sqrt(evoluteBorderTest);\n\
			rad2 = sqrt(e4 * p * q);\n\
\n\
			// 10*e2 is my arbitrary decision of what Vermeille means by near... the cusps of the evolute.\n\
			if (evoluteBorderTest > 10.0 * e2) \n\
			{\n\
				rad3 = pow((rad1 + rad2) * (rad1 + rad2), cbrtFac);\n\
				u = r + 0.5 * rad3 + 2.0 * r * r / rad3;\n\
			}\n\
			else \n\
			{\n\
				u = r + 0.5 * pow((rad1 + rad2) * (rad1 + rad2), cbrtFac)\n\
					+ 0.5 * pow((rad1 - rad2) * (rad1 - rad2), cbrtFac);\n\
			}\n\
		}\n\
		else \n\
		{\n\
			// Step 3: near evolute\n\
			rad1 = sqrt(-evoluteBorderTest);\n\
			rad2 = sqrt(-8.0 * r * r * r);\n\
			rad3 = sqrt(e4 * p * q);\n\
			atanAux = 2.0 * atan2(rad3, rad1 + rad2) / 3.0;\n\
\n\
			u = -4.0 * r * sin(atanAux) * cos(M_PI / 6.0 + atanAux);\n\
		}\n\
\n\
		v = sqrt(u * u + e4 * q);\n\
		w = e2 * (u + v - q) / (2.0 * v);\n\
		k = (u + v) / (sqrt(w * w + u + v) + w);\n\
		D = k * sqrtXXpYY / (k + e2);\n\
		sqrtDDpZZ = sqrt(D * D + Z * Z);\n\
\n\
		h = (k + e2 - 1.0) * sqrtDDpZZ / k;\n\
		phi = 2.0 * atan2(Z, sqrtDDpZZ + D);\n\
	}\n\
	else \n\
	{\n\
		// Step 4: singular disk\n\
		rad1 = sqrt(1.0 - e2);\n\
		rad2 = sqrt(e2 - p);\n\
		e = sqrt(e2);\n\
\n\
		h = -a * rad1 * rad2 / e;\n\
		phi = rad2 / (e * rad2 + rad1 * sqrt(p));\n\
	}\n\
\n\
	// Compute lambda\n\
	s2 = sqrt(2.0);\n\
	if ((s2 - 1.0) * Y < sqrtXXpYY + X) \n\
	{\n\
		// case 1 - -135deg < lambda < 135deg\n\
		lambda = 2.0 * atan2(Y, sqrtXXpYY + X);\n\
	}\n\
	else if (sqrtXXpYY + Y < (s2 + 1.0) * X) \n\
	{\n\
		// case 2 - -225deg < lambda < 45deg\n\
		lambda = -M_PI * 0.5 + 2.0 * atan2(X, sqrtXXpYY - Y);\n\
	}\n\
	else \n\
	{\n\
		// if (sqrtXXpYY-Y<(s2=1)*X) {  // is the test, if needed, but it's not\n\
		// case 3: - -45deg < lambda < 225deg\n\
		lambda = M_PI * 0.5 - 2.0 * atan2(X, sqrtXXpYY + Y);\n\
	}\n\
\n\
	float factor = 180.0 / M_PI;\n\
	result = vec3(factor * lambda, factor * phi, h); // (longitude, latitude, altitude).***\n\
}\n\
\n\
bool isPointRearCamera(vec3 point, vec3 camPos, vec3 camDir)\n\
{\n\
	bool isRear = false;\n\
	float lambdaX = 10.0;\n\
	float lambdaY = 10.0;\n\
	float lambdaZ = 10.0;\n\
	if(abs(camDir.x) > 0.0000001)\n\
	{\n\
		float lambdaX = (point.x - camPos.x)/camDir.x;\n\
	}\n\
	else if(abs(camDir.y) > 0.0000001)\n\
	{\n\
		float lambdaY = (point.y - camPos.y)/camDir.y;\n\
	}\n\
	else if(abs(camDir.z) > 0.0000001)\n\
	{\n\
		float lambdaZ = (point.z - camPos.z)/camDir.z;\n\
	}\n\
	\n\
	if(lambdaZ < 0.0 || lambdaY < 0.0 || lambdaX < 0.0)\n\
			isRear = true;\n\
		else\n\
			isRear = false;\n\
	return isRear;\n\
}\n\
\n\
float distPointToPlane(vec3 point, vec4 plane)\n\
{\n\
	return (point.x*plane.x + point.y*plane.y + point.z*plane.z + plane.w);\n\
}\n\
\n\
bool getValue(vec3 geoLoc, out vec4 value)\n\
{\n\
	// geoLoc = (longitude, latitude, altitude).***\n\
	float lon = geoLoc.x;\n\
	float lat = geoLoc.y;\n\
	float alt = geoLoc.z;\n\
	\n\
	// 1rst, check if geoLoc intersects the volume.***\n\
	// Note: minLon, maxLon, minLat, maxLat, minAlt & maxAlt are uniforms.***\n\
	if(lon < minLon || lon > maxLon)\n\
		return false;\n\
	else if(lat < minLat || lat > maxLat)\n\
		return false;\n\
	else if(alt < minAlt || alt > maxAlt)\n\
		return false;\n\
		\n\
	float lonRange = maxLon - minLon;\n\
	float latRange = maxLat - minLat;\n\
	float altRange = maxAlt - minAlt;\n\
	float col = (lon - minLon)/lonRange * float(slicesNumCols); \n\
	float row = (lat - minLat)/latRange * float(slicesNumRows); \n\
	float slice = (alt - minAlt)/altRange * float(texNumSlices); // slice if texture has only one stack.***\n\
	float sliceDown = floor(slice);\n\
	float sliceUp = ceil(slice);\n\
	float sliceDownDist = slice - sliceDown;\n\
	//slice = 18.0; // test. force slice to nearest to ground.***\n\
	\n\
	float stackDown = floor(sliceDown/float(numSlicesPerStacks));\n\
	float realSliceDown = sliceDown - stackDown * float(numSlicesPerStacks);\n\
	float tx = stackDown * float(slicesNumCols) + col;\n\
	float ty = realSliceDown * float(slicesNumRows) + row;\n\
	vec2 texCoord = vec2(tx/float(texNumCols), ty/float(texNumRows));\n\
	vec4 valueDown = texture2D(volumeTex, texCoord);\n\
	\n\
	if(sliceDown < float(texNumSlices-1))\n\
	{\n\
		float stackUp = floor(sliceUp/float(numSlicesPerStacks));\n\
		float realSliceUp = sliceUp - stackUp * float(numSlicesPerStacks);\n\
		float tx2 = stackUp * float(slicesNumCols) + col;\n\
		float ty2 = realSliceUp * float(slicesNumRows) + row;\n\
		vec2 texCoord2 = vec2(tx2/float(texNumCols), ty2/float(texNumRows));\n\
		vec4 valueUp = texture2D(volumeTex, texCoord2);\n\
		value = valueDown*(1.0-sliceDownDist)+valueUp*(sliceDownDist);\n\
	}\n\
	else{\n\
		value = valueDown;\n\
	}\n\
	//if((value.r * (maxValue - minValue)) > maxValue * 0.3)\n\
	//	return true;\n\
	//else return false;\n\
	return true;\n\
}\n\
\n\
void main() {\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
	float linearDepth = 1.0; // the quad is 1m of dist of the camera.***          \n\
    vec3 rayCamCoord = getViewRay(screenPos) * linearDepth;  \n\
	rayCamCoord = normalize(rayCamCoord);\n\
	\n\
	vec3 camTarget = rayCamCoord * 10000.0;\n\
	vec4 camPosWorld = vec4(encodedCameraPositionMCHigh + encodedCameraPositionMCLow, 1.0);\n\
	vec4 camTargetWorld = modelViewMatrixInv * vec4(camTarget.xyz, 1.0);\n\
	vec3 camDirWorld = camTargetWorld.xyz - camPosWorld.xyz;\n\
	camDirWorld = normalize(camDirWorld);\n\
\n\
	// now, must find sampling points.***\n\
	int intersectType = 0;\n\
	vec3 nearP;\n\
	vec3 farP;\n\
	float radius = 6378137.0 + maxAlt; // equatorial radius.***\n\
	//radius = 6250000.0 + maxAlt; // test radius.***\n\
	\n\
	intersectionLineSphere(radius, camPosWorld.xyz, camDirWorld, intersectType, nearP, farP);\n\
	\n\
	if(intersectType == 0)\n\
	{\n\
		discard;\n\
	}\n\
		\n\
	if(intersectType == 1)\n\
	{\n\
		// provisionally discard.***\n\
		discard;	\n\
	}\n\
	\n\
	// check if nearP is rear of the camera.***\n\
	if(isPointRearCamera(nearP, camPosWorld.xyz, camDirWorld.xyz))\n\
	{\n\
		nearP = vec3(camPosWorld.xyz);\n\
	}\n\
	float dist = distance(nearP, farP);\n\
	float testDist = dist;\n\
	if(dist > 1500000.0)\n\
		testDist = 1500000.0;\n\
	\n\
	// now calculate the geographicCoords of 2 points.***\n\
	// now, depending the dist(nearP, endPoint), determine numSmples.***\n\
	// provisionally take 16 samples.***\n\
	float numSamples = 512.0;\n\
	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);\n\
	float alpha = 0.8/numSamples;\n\
	float tempRange = maxValue - minValue;\n\
	vec4 value;\n\
	float totalValue = 0.0;\n\
	int sampledsCount = 0;\n\
	int intAux = 0;\n\
	float increDist = testDist / numSamples;\n\
	int c = 0;\n\
	bool isPointRearPlane = true;\n\
	for(int i=0; i<512; i++)\n\
	{\n\
		vec3 currGeoLoc;\n\
		vec3 currPosWorld = vec3(nearP.x + camDirWorld.x * increDist*float(c), nearP.y + camDirWorld.y * increDist*float(c), nearP.z + camDirWorld.z * increDist*float(c));\n\
		// Check if the currPosWorld is in front or rear of planes (if exist planes).***\n\
		int planesCounter = 0;\n\
		for(int j=0; j<6; j++)\n\
		{\n\
			if(planesCounter == cuttingPlanesCount)\n\
				break;\n\
			\n\
			vec4 plane = cuttingPlanes[j];\n\
			float dist = distPointToPlane(currPosWorld, plane);\n\
			if(dist > 0.0)\n\
			{\n\
				isPointRearPlane = false;\n\
				break;\n\
			}\n\
			else{\n\
				isPointRearPlane = true;\n\
			}\n\
			planesCounter++;\n\
		}\n\
		\n\
		\n\
		if(isPointRearPlane)\n\
		{\n\
			cartesianToGeographicWgs84(currPosWorld, currGeoLoc);\n\
			if(getValue(currGeoLoc, value))\n\
			{\n\
				float realValue = value.r * tempRange + minValue*255.0;\n\
				totalValue += (value.r);\n\
				sampledsCount += 1;\n\
			}\n\
		}\n\
		if(sampledsCount >= 1)\n\
		{\n\
			break;\n\
		}\n\
		c++;\n\
	}\n\
	if(sampledsCount == 0)\n\
	{\n\
		discard;\n\
	}\n\
	float fValue = totalValue/numSamples;\n\
	fValue = totalValue;\n\
	if(fValue > 1.0)\n\
	{\n\
		gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
		return;\n\
	}\n\
	float b = 1.0 - fValue;\n\
	float g;\n\
	if(fValue > 0.5)\n\
	{\n\
		g = 2.0-2.0*fValue;\n\
	}\n\
	else{\n\
		g = 2.0*fValue;\n\
	}\n\
	float r = fValue;\n\
	color += vec4(r,g,b,0.8);\n\
	gl_FragColor = color;\n\
}";
ShaderSource.wgs84_volumVS = "precision mediump float;\n\
\n\
attribute vec3 position;\n\
uniform mat4 projectionMatrix;\n\
\n\
void main()\n\
{	\n\
	vec4 pos = projectionMatrix * vec4(position.xyz, 1.0);\n\
    gl_Position = pos;\n\
}";
ShaderSource.windStreamThickLineFS = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
uniform int uElemIndex;\n\
uniform int uTotalPointsCount; // total points to draw.\n\
uniform vec2 viewport;\n\
uniform float thickness;\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vCurrentIndex;\n\
\n\
varying float vSense;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void main() {\n\
	// calculate the transparency.\n\
	float alpha = 1.0 - (vCurrentIndex - float(uElemIndex))/float(uTotalPointsCount);\n\
\n\
	// use vSense to calculate aditional transparency in the borders of the thick line.***\n\
	float beta = sin(acos(vSense));\n\
	alpha *= beta;\n\
\n\
	vec4 finalColor =  vec4(vColor.rgb, alpha);\n\
\n\
	gl_FragData[0] = finalColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		gl_FragData[1] = packDepth(vDepth);\n\
		\n\
\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = finalColor;\n\
		\n\
	}\n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.windStreamThickLineRAD_FS = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
uniform int uElemIndex;\n\
uniform int uTotalPointsCount; // total points to draw.\n\
uniform vec2 viewport;\n\
uniform float thickness;\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vCurrentIndex;\n\
\n\
varying float vSense;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void main() {\n\
	// calculate the transparency.\n\
	float alpha = 1.0 - (vCurrentIndex - float(uElemIndex))/float(uTotalPointsCount);\n\
\n\
	// use vSense to calculate aditional transparency in the borders of the thick line.***\n\
	float beta = sin(acos(vSense));\n\
	alpha *= beta;\n\
\n\
	vec4 finalColor =  vec4(vColor.rgb, alpha);\n\
\n\
	gl_FragData[0] = finalColor; // original.***\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		gl_FragData[1] = packDepth(vDepth);\n\
		\n\
\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = finalColor;\n\
		\n\
	}\n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.windStreamThickLineRAD_VS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
attribute float index;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vCurrentIndex;\n\
\n\
varying float vSense;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
vec2 project(vec4 p){\n\
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;\n\
}\n\
\n\
bool isEqual(float value, float valueToCompare)\n\
{\n\
	if(value + error > valueToCompare && value - error < valueToCompare)\n\
	return true;\n\
	\n\
	return false;\n\
}\n\
\n\
vec3 geographicToCartesianWgs84(float lonRad, float latRad, float altitude)\n\
{\n\
	// a = semi-major axis.\n\
	// e2 = firstEccentricitySquared.\n\
	// v = a / sqrt(1 - e2 * sin2(lat)).\n\
	// x = (v+h)*cos(lat)*cos(lon).\n\
	// y = (v+h)*cos(lat)*sin(lon).\n\
	// z = [v*(1-e2)+h]*sin(lat).\n\
	float equatorialRadius = 6378137.0;\n\
	float firstEccentricitySquared = 6.69437999014E-3;\n\
	float cosLon = cos(lonRad);\n\
	float cosLat = cos(latRad);\n\
	float sinLon = sin(lonRad);\n\
	float sinLat = sin(latRad);\n\
	float a = equatorialRadius;\n\
	float e2 = firstEccentricitySquared;\n\
	float v = a/sqrt(1.0 - e2 * sinLat * sinLat);\n\
	//float h = altitude; // original.***\n\
	float h = 2000.0;\n\
	\n\
	vec3 resultCartesian = vec3((v+h)*cosLat*cosLon, (v+h)*cosLat*sinLon, (v*(1.0-e2)+h)*sinLat);\n\
	\n\
	return resultCartesian;\n\
}\n\
\n\
vec4 getPointRelToEye(in vec4 point)\n\
{\n\
	vec3 posWC = geographicToCartesianWgs84(point.x, point.y, point.z);\n\
	vec4 rotatedCurrent = vec4(posWC.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	vec3 highDifference = rotatedCurrent.xyz -encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = vec3(0.0) - encodedCameraPositionMCLow.xyz;\n\
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
}\n\
\n\
void main(){\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
	\n\
	float order_w = current.w;\n\
	//float order_w = float(order);\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
	\n\
	float aspect = viewport.x / viewport.y;\n\
	vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * vCurrent;\n\
	vDepth = -orthoPos.z/far;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
	// Get 2D screen space with W divide and aspect correction\n\
	vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;\n\
	vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;\n\
	vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n\
					\n\
	// This helps us handle 90 degree turns correctly\n\
	vec2 tangentNext = normalize(nextScreen - currentScreen);\n\
	vec2 tangentPrev = normalize(currentScreen - previousScreen);\n\
	vec2 normal; \n\
	if(orderInt == 1 || orderInt == -1)\n\
	{\n\
		normal = vec2(-tangentPrev.y, tangentPrev.x);\n\
	}\n\
	else{\n\
		normal = vec2(-tangentNext.y, tangentNext.x);\n\
	}\n\
	normal *= thickness/2.0;\n\
	normal.x /= aspect;\n\
	float realThickness = (thickness*sense*projectedDepth)/1000.0;\n\
	\n\
	// Offset our position along the normal\n\
	vec4 offset = vec4(normal * realThickness, 0.0, 0.0);\n\
	gl_Position = currentProjected + offset; \n\
	vSense = sense;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		float Fcoef = 2.0 / log2(far + 1.0);\n\
		gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
	\n\
	if(colorType == 0)\n\
		vColor = oneColor4;\n\
	else if(colorType == 1)\n\
		vColor = color4; //vec4(color4.r+0.8, color4.g+0.8, color4.b+0.8, color4.a+0.8);\n\
	else\n\
		vColor = oneColor4;\n\
\n\
	vCurrentIndex = index;\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.windStreamThickLineVS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
attribute float index;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vCurrentIndex;\n\
\n\
varying float vSense;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
vec2 project(vec4 p){\n\
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;\n\
}\n\
\n\
bool isEqual(float value, float valueToCompare)\n\
{\n\
	if(value + error > valueToCompare && value - error < valueToCompare)\n\
	return true;\n\
	\n\
	return false;\n\
}\n\
\n\
vec4 getPointRelToEye(in vec4 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
}\n\
\n\
void main(){\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
	\n\
	float order_w = current.w;\n\
	//float order_w = float(order);\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
	\n\
	float aspect = viewport.x / viewport.y;\n\
	vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * vCurrent;\n\
	vDepth = -orthoPos.z/far;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
	// Get 2D screen space with W divide and aspect correction\n\
	vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;\n\
	vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;\n\
	vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n\
					\n\
	// This helps us handle 90 degree turns correctly\n\
	vec2 tangentNext = normalize(nextScreen - currentScreen);\n\
	vec2 tangentPrev = normalize(currentScreen - previousScreen);\n\
	vec2 normal; \n\
	if(orderInt == 1 || orderInt == -1)\n\
	{\n\
		normal = vec2(-tangentPrev.y, tangentPrev.x);\n\
	}\n\
	else{\n\
		normal = vec2(-tangentNext.y, tangentNext.x);\n\
	}\n\
	normal *= thickness/2.0;\n\
	normal.x /= aspect;\n\
	float realThickness = (thickness*sense*projectedDepth)/1000.0;\n\
	\n\
	// Offset our position along the normal\n\
	vec4 offset = vec4(normal * realThickness, 0.0, 0.0);\n\
	gl_Position = currentProjected + offset; \n\
	vSense = sense;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		float Fcoef = 2.0 / log2(far + 1.0);\n\
		gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
	\n\
	if(colorType == 0)\n\
		vColor = oneColor4;\n\
	else if(colorType == 1)\n\
		vColor = color4; //vec4(color4.r+0.8, color4.g+0.8, color4.b+0.8, color4.a+0.8);\n\
	else\n\
		vColor = oneColor4;\n\
\n\
	vCurrentIndex = index;\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";

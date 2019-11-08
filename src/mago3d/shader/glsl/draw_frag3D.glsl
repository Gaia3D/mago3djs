precision mediump float;

uniform sampler2D u_wind;
uniform vec2 u_wind_min;
uniform vec2 u_wind_max;
uniform bool u_flipTexCoordY_windMap;
uniform bool u_colorScale;
uniform float u_alpha;

varying vec2 v_particle_pos;

vec3 getRainbowColor_byHeight(float height)
{
	float minHeight_rainbow = 0.0;
	float maxHeight_rainbow = 1.0;
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

void main() {
	vec2 windMapTexCoord = v_particle_pos;
	if(u_flipTexCoordY_windMap)
	{
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;
	}
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, windMapTexCoord).rg);
    float speed_t = length(velocity) / length(u_wind_max);

	
	if(u_colorScale)
	{
		speed_t *= 1.5;
		if(speed_t > 1.0)speed_t = 1.0;
		float b = 1.0 - speed_t;
		float g;
		if(speed_t > 0.5)
		{
			g = 2.0-2.0*speed_t;
		}
		else{
			g = 2.0*speed_t;
		}
		vec3 col3 = getRainbowColor_byHeight(speed_t);
		float r = speed_t;
		gl_FragColor = vec4(col3.x, col3.y, col3.z ,u_alpha);
	}
	else{
		float intensity = speed_t*3.0;
		if(intensity > 1.0)
			intensity = 1.0;
		gl_FragColor = vec4(intensity,intensity,intensity,u_alpha);
	}
}
	precision lowp float;
	uniform vec4 uStrokeColor;
	varying vec4 vColor;
	varying float glPointSize;
	uniform int uPointAppereance; // square, circle, romboide,...
	uniform int uStrokeSize;

	void main()
    {
		vec2 pt = gl_PointCoord - vec2(0.5);
		float distSquared = pt.x*pt.x+pt.y*pt.y;
		if(distSquared > 0.25)
			discard;

		vec4 finalColor = vColor;
		float strokeDist = 0.1;
		if(glPointSize > 10.0)
		strokeDist = 0.15;

		if(uStrokeSize > 0)
		{
			if(distSquared >= strokeDist)
			{
				finalColor = uStrokeColor;
			}
		}
		gl_FragColor = finalColor;
	}
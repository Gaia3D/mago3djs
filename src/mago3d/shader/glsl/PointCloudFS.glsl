	precision lowp float;
	varying vec4 vColor;

	void main()
    {
		vec2 pt = gl_PointCoord - vec2(0.5);
		if(pt.x*pt.x+pt.y*pt.y > 0.25)
			discard;
		gl_FragColor = vColor;
	}
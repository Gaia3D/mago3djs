	precision mediump float;
	varying vec4 vColor;
	varying vec2 vTextureCoord;
	uniform sampler2D uSampler;
	varying vec3 vLightWeighting;

	void main()
    {
		vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        
		gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
	}

/* eslint-disable strict */

describe('Camera', function()
{
	var testCamera1, testCamera2;
	var testCameraHeight;	
	var fovyRad, tangentOfHalfFovy, fovRad, aspectRatio, near;

	
	beforeEach(function()
	{
		testCamera1 = new Camera();
		testCamera2 = new Camera();
		testCamera1.position.set(-3020097.867525776, 4064890.1260905396, 3871228.8268635306);
		testCamera1.direction.set(0.4726211428642273, -0.6361227631568909, -0.6098992228507996);
		testCamera1.up.set(0.3637336492538452, -0.48956602811813354, 0.7924789786338806);

		testCameraHeight = 4067.0605428088456;

		fovyRad = new Float32Array([0.8037]); 
		tangentOfHalfFovy = new Float32Array([0.0]);
		fovRad = new Float32Array([1.047]);
		aspectRatio = new Float32Array([1.3584]);
		near = new Float32Array([0.1]);
	});

	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 한다.', function()
	{
		expect(function ()
		{
			return Camera();
		}).not.toThrowError('이 객체는 new 키워드를 사용하여 생성해야 합니다.');
	});

	describe('copyPosDirUpFrom(camera)', function()
	{
		it("매개변수로 전달되는 camera의 position, direction, up 값을 복사한다.", function ()
		{
			testCamera2.copyPosDirUpFrom(testCamera1);
			expect(testCamera2.position).toEqual(testCamera1.position);
			expect(testCamera2.direction).toEqual(testCamera1.direction);
			expect(testCamera2.up).toEqual(testCamera1.up);
		});
	});
	
	describe('getCameraElevation()', function()
	{
		it("결과값 체크", function ()
		{
			var cameraHeight;
			cameraHeight = testCamera1.getCameraElevation();
			expect(cameraHeight).toEqual(testCameraHeight);
		});
	});

	describe('getCameraRight()', function()
	{
		it("결과값 체크", function()
		{
			var right;
			testCamera2.right.set(-0.8026998577157372, -0.5963831905824257, -1.7001973162678041e-9);
			right = testCamera1.getCameraRight();
			expect(right).toEqual(testCamera2.right);
		});
	});

	describe('getFrusteum(idx)', function()
	{
		it("결과 타입 체크", function()
		{
			var frustum;
			frustum = testCamera1.getFrustum(0);
			expect(frustum instanceof Frustum).toBeTruthy();
		});
		it("결과값 체크", function()
		{
			var frustum;
			frustum = testCamera1.getFrustum(0);
			expect(frustum.fovRad).toEqual(fovRad);
			expect(frustum.fovyRad).toEqual(fovyRad);
			expect(frustum.aspectRatio).toEqual(aspectRatio);
			expect(frustum.tangentOfHalfFovy).toEqual(tangentOfHalfFovy);
			expect(frustum.near).toEqual(near);
		});
	});

	
});
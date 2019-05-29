/* eslint-disable strict */

describe('Point3D', function() 
{
	var testPoint;
	var testX = 1.0;
	var testY = 2.0;
	var testZ = 3.0;

	beforeEach(function() 
	{
		testPoint = new Point3D();
	});

	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 한다.', function() 
	{
		expect(function () 
		{
			return Point3D();
		}).toThrowError('이 객체는 new를 사용하여 생성해야 합니다.');
	});
	
	it('객체 생성시 기본값은 0 값을 갖는다.', function() 
	{
		expect(testPoint.x).toEqual(0.0);
		expect(testPoint.y).toEqual(0.0);
		expect(testPoint.z).toEqual(0.0);
	});
	/*
	describe('destroy()', function() 
	{
		it('xyz 값은 null값을 갖는다.', function() 
		{
			testPoint.destroy();
			expect(testPoint.x).toBeNull();
			expect(testPoint.y).toBeNull();
			expect(testPoint.z).toBeNull();
		});
	});
	*/
	describe('set(x, y, z)', function() 
	{
		/*
		it('인자가 빠졌거나 타입이 잘못되면 (0, 0, 0) 값으로 설정 ', function()
		{
			testPoint.set();
			expect(testPoint.x).toEqual(0.0);
			expect(testPoint.y).toEqual(0.0);
			expect(testPoint.z).toEqual(0.0);
		});
		*/

		it('입력된 값으로 설정 ', function()
		{
			testPoint.set(testX, testY, testZ);
			expect(testPoint.x).toEqual(testX);
			expect(testPoint.y).toEqual(testY);
			expect(testPoint.z).toEqual(testZ);
		});
	});

	describe('add(x, y, z)', function() 
	{
		it('입력된 값을 추가한다.', function()
		{
			testPoint.add(testX, testY, testZ);
			expect(testPoint.x).toEqual(testX);
			expect(testPoint.y).toEqual(testY);
			expect(testPoint.z).toEqual(testZ);
		});
	});
	
	describe('getModul()', function() 
	{
		it('해당 포인트의 Modul 값을 구한다.', function()
		{
			testPoint.set(3.0, 4.0, 5.0);
			expect(testPoint.getModul()).toEqual(7.0710678118654755);
		});
	});

	describe('unitary()', function()
	{
		it('해당 포인트를 정규화한다..', function() 
		{
			testPoint.set(3.0, 4.0, 0.0);
			testPoint.unitary();
			expect(testPoint.x).toEqual(0.6);
			expect(testPoint.y).toEqual(0.8);
			expect(testPoint.z).toEqual(0.0);
		});
	});
	
	
	
	describe('crossProduct(point, resultPoint)', function()
	{
		/*
		it('매개변수가 없으면 예외를 던져야 한다.', function() 
		{
			var vX = 3.0;
			var vY = 4.0;
			var vZ = 5.0;

			var vPoint = new Point3D();
			vPoint.set(vX, vY, vZ);
			expect(testPoint.crossProduct(vPoint)).toThrowError('매개변수가 있어야 합니다.');
		});
		*/
		
		it('벡터곱을 구한다.', function() 
		{
			var vX = 3.0;
			var vY = 4.0;
			var vZ = 5.0;

			var vPoint = new Point3D();
			var resultPoint;
			vPoint.set(vX, vY, vZ);
			testPoint.set(testX, testY, testZ);
			resultPoint = testPoint.crossProduct(vPoint, resultPoint);

			expect(resultPoint.x).toEqual(testY*vZ - testZ*vY);
			expect(resultPoint.y).toEqual(testZ*vX - testX*vZ);
			expect(resultPoint.z).toEqual(testX*vY - testY*vX);
		});
	});
	
	describe('squareDistTo(x, y, z)', function()
	{
		it('주어진 점과의 거리의 제곱을 구한다.', function ()
		{
			testPoint.set(3.0, 5.0, 6.0);
			expect(testPoint.squareDistTo(2.0, 3.0, 5.0)).toEqual(6);
		});

		it('주어진 점이 없는 경우에는 좌표 각 성분값의 제곱의 합과 같다', function ()
		{
			var result = testX * testX + testY * testY + testZ * testZ;
			testPoint.set(testX, testY, testZ);

			expect(testPoint.squareDistTo(0, 0, 0)).toEqual(result);
		});
	});
});
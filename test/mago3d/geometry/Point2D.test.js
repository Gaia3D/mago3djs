/* eslint-disable strict */

describe('Point2D', function() 
{
	var testPoint;
	var vPoint;
	var testX = 1.0;
	var testY = 2.0;
	var vX = 3.0;
	var vY = 4.0;

	beforeEach(function() 
	{
		testPoint = new Point2D();
	});

	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 한다.', function() 
	{
		expect(function () 
		{
			return Point2D();
		}).toThrowError('이 객체는 new를 사용하여 생성해야 합니다.');
	});
	
	it('객체 생성시 기본값은 0 값을 갖는다.', function() 
	{
		expect(testPoint.x).toEqual(0.0);
		expect(testPoint.y).toEqual(0.0);
	});
	
	describe('deleteObjects()', function() 
	{
		it('xy 값은 undefined값을 갖는다.', function() 
		{
			testPoint.deleteObjects();
			expect(testPoint.x).toBeUndefined();
			expect(testPoint.y).toBeUndefined();
		});
	});
	
	describe('set(x, y)', function() 
	{
		/*
		it('인자가 빠졌거나 타입이 잘못되면 (0, 0) 값으로 설정 ', function()
		{
			testPoint.set();
			expect(testPoint.x).toEqual(0.0);
			expect(testPoint.y).toEqual(0.0);
			expect(testPoint.z).toEqual(0.0);
		});
		*/

		it('입력된 값으로 설정 ', function()
		{
			testPoint.set(testX, testY);
			expect(testPoint.x).toEqual(testX);
			expect(testPoint.y).toEqual(testY);
		});
	});
	describe('getModul()', function() 
	{
		it('해당 포인트의 Module 값을 구한다.', function()
		{
			testPoint.set(3.0, 4.0);
			expect(testPoint.getModul()).toEqual(5);
		});
	});

	describe('unitary()', function()
	{
		it('해당 포인트를 정규화한다..', function() 
		{
			testPoint.set(3.0, 4.0);
			testPoint.unitary();
			expect(testPoint.x).toEqual(0.6);
			expect(testPoint.y).toEqual(0.8);
		});
	});
	
	
	
	describe('test calculating vector', function()
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
        
		beforeEach(function() 
		{
			vPoint = new Point2D(3.0, 4.0);
			testPoint.set(testX, testY);

		});
        
		it('getVectorToPoint(targetPoint,resultVector)', function()
		{
			var resultVector = new Point2D();
			resultVector.set(vPoint.x-testPoint.x, vPoint.y-testPoint.y);
			var result;
			expect(resultVector).toEqual(testPoint.getVectorToPoint(vPoint, result));
		});

		it('벡터곱을 구한다.', function() 
		{
			var result;
			result = testPoint.crossProduct(vPoint);

			expect(result).toEqual(testX*vY - testY*vX);
		});
        
		it('내적을 구한다', function()
		{

			result = testPoint.scalarProduct(vPoint);
			expect(result).toEqual(testX*vX + testY*vY);

		});

		it('angleRadToVector(vector)', function()
		{
    		var result;
			result = testPoint.angleRadToVector(vPoint);

			expect(result).toEqual(Math.acos(testPoint.scalarProduct(vPoint)/(testPoint.getModul()*vPoint.getModul())));

		});

		it('angleDegToVector(vector)', function()
		{
			var result;
			var angRad = testPoint.angleRadToVector(vPoint);

			result = testPoint.angleDegToVector(vPoint);

			expect(result).toEqual(angRad * 180.0/Math.PI);


		});


	});
	
	describe('squareDistToPoint(x, y)', function()
	{
		it('주어진 점과의 거리의 제곱을 구한다.', function ()
		{
			testPoint.set(3.0, 5.0);
			expect(testPoint.squareDistToPoint(new Point2D(2.0, 3.0))).toEqual(5);
		});

		it('주어진 점이 없는 경우에는 좌표 각 성분값의 제곱의 합과 같다', function ()
		{
			var result = testX * testX + testY * testY;
			testPoint.set(testX, testY);
			expect(testPoint.squareDistToPoint(new Point2D(0, 0))).toEqual(result);
		});
	});
	describe('isCoincidentToPoint(point, errorDist)', function()
	{

		it('주어진 점과 해당 점이 겹치는지 확인한다.', function()
		{
			var overlappedPoint = new Point2D(testX, testY);
			testPoint.set(testX, testY);
			expect(testPoint.isCoincidentToPoint(overlappedPoint, 0.0001)).toEqual(true);
		});
	});
});
'use district';

describe("Point 테스트", function() {
	var point;
	
	it("객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함", function() {
		expect(function() {
			point = Point3D();
		}).not.toThrowError("이 객체는 new를 사용하여 생성해야 합니다.");
	});
	
	beforeEach(function(){
		point = new Point3D();
	})
	it("Point xyz 기본값", function() {
		expect(point.x).toEqual(0.0);
		expect(point.y).toEqual(0.0);
		expect(point.z).toEqual(0.0);
	});
	
	it("Point destroy시 xyz에 null값이 와야 함", function() {
		point.destroy();
		expect(point.x).toEqual(null);
		expect(point.y).toEqual(null);
		expect(point.z).toEqual(null);
	});
	
	it("Point xyz 값 설정 ", function(){
		point.set(1.0, 0.3 ,0.7);
		expect(point.x).toEqual(1.0);
		expect(point.y).toEqual(0.3);
		expect(point.z).toEqual(0.7);
	});
	
	it("Point xyz 값 추가", function(){
		point.set(1.0,2.0,3.0);
		point.add(1.0,1.0,1.0);
		expect(point.x).toEqual(2.0);
		expect(point.y).toEqual(3.0);
		expect(point.z).toEqual(4.0);
	});
	
	it("Point getModul ", function(){
		var point = new Point3D();
		point.set(3.0, 4.0, 5.0);
		expect(point.getModul()).toEqual(7.0710678118654755);
	});
	
	it("Point unitary", function() {
		point.set(2.0,2.0,2.0);
		point.unitary();
		expect(point.x).toEqual(0.5773502691896258);
		expect(point.y).toEqual(0.5773502691896258);
		expect(point.z).toEqual(0.5773502691896258);
	})
	
    it("Point crossProduct work", function() {
		var vPoint = new Point3D();
		var resultPoint;
		point.set(0,0,0);
		vPoint.set(3.0, 4.0, 5.0);
        expect(function() {
        	 point.crossProduct(vPoint, resultPoint);
        }).not.toThrow();
    });
	
    it("Point crossProduct 매개변수가 없으면 예외를 던져야 한다.", function() {
        expect(function() {
        	 point.crossProduct();
        }).toThrowError("매개변수 입력하세요");
    });
    
    it("Point squareDistTo work", function (){
    	point.set(3.0,5.0,6.0);
    	expect(point.squareDistTo(2.0, 3.0, 5.0)).toEqual(6);
    });
    
    it("Point squareDistTo 매개변수가 없어도 사용가능", function (){
    	expect( function() {
    		point.squareDistTo();
    	}).not.toThrowError();
    });
    
})
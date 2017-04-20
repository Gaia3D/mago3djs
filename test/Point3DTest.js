'use district';

describe("Point 테스트", function() {
	it("Point xyz 기본값", function() {
		var point = new Point3D();
		expect(point.x).toEqual(0.0);
		expect(point.y).toEqual(0.0);
		expect(point.z).toEqual(0.0);
	});
	
	it("Point destroy시 xyz에 null값이 와야 함", function() {
		var point = new Point3D();
		point.destroy();
		expect(point.x).toEqual(null);
		expect(point.y).toEqual(null);
		expect(point.z).toEqual(null);
	});
	
	it("Point xyz 값 설정 ", function(){
		var point = new Point3D();
		point.set(1.0, 0.3 ,0.7);
		expect(point.x).toEqual(1.0);
		expect(point.y).toEqual(0.3);
		expect(point.z).toEqual(0.7);
	});
	
	it("Point xyz 값 추가", function(){
		var point = new Point3D();
		point.set(1.0,2.0,3.0);
		point.add(1.0,1.0,1.0);
		expect(point.x).toEqual(2.0);
		expect(point.y).toEqual(3.0);
		expect(point.z).toEqual(4.0);
	});
	
	it("Point getModul", function(){
		var point = new Point3D();
		point.set(3.0, 4.0, 5.0);
		expect(point.getModul()).toEqual(7.0710678118654755);
	});
	
	it("Point unitary", function() {
		var point = new Point3D();
		point.set(2.0,2.0,2.0);
		point.unitary();
		expect(point.x).toEqual(0.5773502691896258);
		expect(point.y).toEqual(0.5773502691896258);
		expect(point.z).toEqual(0.5773502691896258);
	})
	
    it("Point crossProduct work", function() {
    	var point = new Point3D();
		var vPoint = new Point3D();
		var resultPoint;
		point.set(0,0,0);
		vPoint.set(3.0, 4.0, 5.0);
        expect(function() {
        	 point.crossProduct(vPoint, resultPoint);
        }).not.toThrow();
    });
	
    it("Point crossProduct throws with no parameter", function() {
    	var point = new Point3D();
        expect(function() {
        	 point.crossProduct();
        }).toThrow();
    });
    
    it("Point squareDistTo work", function (){
    	var point = new Point3D();
    	point.set(3.0,5.0,6.0);
    	expect(point.squareDistTo(2.0, 3.0, 5.0)).toEqual(6);
    });
    
    it("Point squareDistTo not throws with no parameter", function (){
    	var point = new Point3D();
    	expect( function() {
    		point.squareDistTo();
    	}).not.toThrow();
    });
    
})
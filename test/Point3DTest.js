/**
 * 
 */
describe("Point 테스트", function() {
	var point;
	it("Point xyz 기본값", function() {
		point = new Point3D();
		expect(point.x).toEqual(0.0);
		expect(point.y).toEqual(0.0);
		expect(point.z).toEqual(0.0);
	});
	
	it("Point destroy시 xyz에 null값이 와야 함", function() {
		point = new Point3D();
		point.destroy();
		expect(point.x).toEqual(null);
		expect(point.y).toEqual(null);
		expect(point.z).toEqual(null);
	});
	
	it("Point xyz 값 설정 ", function(){
		point = new Point3D();
		point.set(1.0, 0.3 ,0.7);
		expect(point.x).toEqual(1.0);
		expect(point.y).toEqual(0.3);
		expect(point.z).toEqual(0.7);
	});
	
	it("Point xyz 값 추가", function(){
		point = new Point3D();
		point.set(1.0,2.0,3.0);
		point.add(1.0,1.0,1.0);
		expect(point.x).toEqual(2.0);
		expect(point.y).toEqual(3.0);
		expect(point.z).toEqual(4.0);
	});
	
	it("Point getModul", function(){
		point = new Point3D();
		point.set(2.0,2.0,2.0);
		expect(point.getModul()).toEqual(3.4641016151377544);
	});
	
	it("Point unitary", function() {
		point = new Point3D();
		point.set(2.0,2.0,2.0);
		point.unitary();
		expect(point.x).toEqual(0.5773502691896258);
	})
	
	it("Point crossProduct normal 값이 return", function() {
		point = new Point3D();
		var resultPoint;
		point.set(5.0,1.0,1.0);
		//expect(point.crossProduct(point, resultPoint)).toEqual();
	});
	
})
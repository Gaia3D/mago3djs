/* eslint-disable strict */

describe("Face 테스트", function()
{
	describe('임시 테스트', function()
	{
		var vertexArray;
		var normal;
		var p1;
		var p2;
		var p3;
		beforeEach(function()
		{
			p1 = new Point3D(1, 1, 3);
			p1.pointType = 1;
			p2 = new Point3D(1, 4, 3);
			p2.pointType = 1;
			p3 = new Point3D(4, 1, 3);
			p3.pointType = 1;

			vertexArray = [new Vertex(p1), new Vertex(p2), new Vertex(p3)];
            
			normal = new Point3D();
			Face.calculatePlaneNormal(vertexArray, normal);
		});

		it('calculatePlaneNormal test', function()
		{
			expect(normal instanceof Point3D).toEqual(true);
			expect(normal.isNAN()).not.toEqual(true);
			expect(normal.x).toEqual(0);
			expect(normal.y).toEqual(0);
			expect(normal.z).toEqual(-1);
		});

		it('getProjectedPolygon2D test', function()
		{
			var polygon2d = Face.getProjectedPolygon2D(vertexArray, normal);
			var pointArray = polygon2d.point2dList.pointsArray;
			expect(pointArray.length).toEqual(3);
		});

		it('getTrianglesConvex test', function()
		{
			var face = new Face();
			face.addVertex(new Vertex(p1));
			face.addVertex(new Vertex(p2));

			var triangle = face.getTrianglesConvex();
			expect(triangle.length).toEqual(0);
		});
	});
});
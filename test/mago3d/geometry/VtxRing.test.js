'use district';

describe("VtxRing 테스트", function(){
    describe('임시 테스트', function(){
        var vtxRing;
        beforeEach(function(){
            vtxRing = new VtxRing();
            var p1 = new Point3D(1,2,3);
            p1.pointType = 1;
            var p2 = new Point3D(3,4,5);
            p2.pointType = 1;
            var p3 = new Point3D(5,6,7);
            p3.pointType = 1;
            vtxRing.makeByPoints3DArray([p1,p2,p3]);
        });

        it('index Range test', function(){
            var indexRange0 = vtxRing.getElementIndexRange(0);
            expect(indexRange0.strIdx).toEqual(0);
            expect(indexRange0.endIdx).toEqual(1);

            var indexRange1 = vtxRing.getElementIndexRange(1);
            expect(indexRange1.strIdx).toEqual(1);
            expect(indexRange1.endIdx).toEqual(2);

            var indexRange2 = vtxRing.getElementIndexRange(2);
            expect(indexRange2.strIdx).toEqual(2);
            expect(indexRange2.endIdx).toEqual(0);
        });
    })
});
4
1 프로젝트명
 - maog3djs 

2 디렉토리
 - data 					: f4d 데이터가 저장됨
 - build 					: gulp를 이용해서 project를 build 하면 자동 생성되는 디렉토리.... git ignore
   build/mago3d 			: javascript 파일을 압축 혹은 통합한 min 파일이 저장되는
   build/documentaion 		: jsdoc으로 자동 생성
 - external					: 외부 javascript library를 저장
   external/jasime			: jasmine 테스트 라이브러리
 - sample 					: 우리 프로젝트 사용예제들을 저장
 - node_modules 			: node package......... git ignore
 - src/engine				: cesium
   src/engine/cesium		: cesium customizing source
   src/mago3d				: javascript 소스
   src/mago3d/images		: 이미지 폴더
 - test						: 테스트 소스..... jasmine은 spec 이란 이름을 사용하지만... 범용적으로 테스트라고 함

2 개발환경
 - java8
 - eclipse neon(필수)
 - node
 
 gulp, karma, jasmine(mocha + chai), jsdoc, eslint
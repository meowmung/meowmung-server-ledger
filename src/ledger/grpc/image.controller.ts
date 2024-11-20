// import {Controller, Logger} from "@nestjs/common";
//
// @Controller()
// export class AppController {
//     // gRPC 클라이언트 설정
//     private grpcClient: any;
//
//     constructor() {
//         const PROTO_PATH = __dirname + '/path/to/your/proto/file.proto'; // gRPC 프로토콜 파일 경로
//         const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
//             keepCase: true,
//             longs: String,
//             enums: String,
//             defaults: true,
//             oneofs: true,
//         });
//         const grpcPackage: any = grpc.loadPackageDefinition(packageDefinition);
//         this.grpcClient = new grpcPackage.YourServiceName(
//             'localhost:50051', // gRPC 서버 주소
//             grpc.credentials.createInsecure(),
//         );
//     }
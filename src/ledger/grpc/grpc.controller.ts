import {Controller, Inject, Logger, OnModuleInit} from "@nestjs/common";
import {Result} from "./interface/grpc-result.interface";
import {Observable} from "rxjs";
import {ParamImage} from "./interface/grpc-param.interface";
import {ClientGrpc, GrpcMethod} from "@nestjs/microservices";

interface HeroesService {
    findOne(data: ParamImage): Observable<Result>;
}

@Controller()
export class GrpcController implements OnModuleInit {
    private readonly items: Result[] = [
        // {id: 1, name: 'John'},
        // {id: 2, name: 'Doe'},
    ];
    private heroesService: HeroesService;

    constructor(@Inject('IMAGE_GRPC') private readonly client: ClientGrpc) {
    }

    onModuleInit() {
        this.heroesService = this.client.getService<HeroesService>('HeroesService');
    }

    @GrpcMethod('HeroesService')
    processFile(data: ParamImage): Result {
        // 가정: 서버에서 받은 파일 데이터를 처리하고 결과를 생성
        const {file} = data;
        if (!file) {
            throw new Error('File is required');
        }
        // 예제 결과 데이터
        const processedResult: Result = {
            date: new Date().toISOString(),
            location: "Server Storage",
            items: ["Item1", "Item2", "Item3"], // 실제 처리된 파일에서 데이터를 추출
            total_amount: 150.0,
        };

        return processedResult;
    }
}
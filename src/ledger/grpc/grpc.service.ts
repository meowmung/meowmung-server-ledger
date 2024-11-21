import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';
import {Client, ClientGrpc, Transport} from "@nestjs/microservices";
import {Observable} from "rxjs";
import path from "path";

interface HeroesService {
    findOne(data: { id: number }): Observable<any>;
}

@Injectable()
export class GrpcService implements OnModuleInit {
    @Client({
        transport: Transport.GRPC,
        options: {
            package: 'hero',
            protoPath: path.join(__dirname, '../../../../src/ledger/grpc/image.proto'),
        },
    })
    client: ClientGrpc;

    private heroesService: HeroesService;

    onModuleInit() {
        this.heroesService = this.client.getService<HeroesService>('HeroesService');
    }

    getHero(): Observable<string> {
        return this.heroesService.findOne({ id: 1 });
    }
}

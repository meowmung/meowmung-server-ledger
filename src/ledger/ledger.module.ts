import {Module} from '@nestjs/common';
import {LedgerService} from './ledger.service';
import {LedgerController} from './ledger.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Ledger} from "./entities/ledger.entity";
import {Item} from "./entities/item.entity";
import {HttpModule} from '@nestjs/axios';
import multer from "multer";
import {MulterModule} from "@nestjs/platform-express";
import { S3Module } from './s3/s3.module';


@Module({
    imports: [TypeOrmModule.forFeature([Ledger, Item]),
        HttpModule,
        S3Module,
        MulterModule.register({
            storage: multer.memoryStorage(), // memoryStorage 설정
        }),
        ],
    controllers: [LedgerController],
    providers: [LedgerService],
})
export class LedgerModule {
}

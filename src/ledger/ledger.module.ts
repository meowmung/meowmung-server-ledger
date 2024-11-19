import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Ledger} from "./entities/ledger.entity";
import {Item} from "./entities/item.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Ledger, Item])],
  controllers: [LedgerController],
  providers: [LedgerService],
})
export class LedgerModule {}

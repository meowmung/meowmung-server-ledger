import {Injectable} from '@nestjs/common';
import {CreateLedgerDto} from './dto/create-ledger.dto';
import {UpdateLedgerDto} from './dto/update-ledger.dto';
import {Ledger} from "./entities/ledger.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Item} from "./entities/item.entity";

@Injectable()
export class LedgerService {
    constructor(
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
        @InjectRepository(Item)
        private itemRepository: Repository<Item>,
    ) {
    }

    // private createBaseQueryBuilder(email: string) {
    //     const currentYear: number = new Date().getFullYear();
    //     const currentMonth: number = new Date().getMonth() + 1;
    //
    //     return this.ledgerRepository
    //         .createQueryBuilder('ledger')
    //         .innerJoin('ledger.items', 'item')
    //         .where('YEAR(ledger.date) = :year', {year: currentYear})
    //         .andWhere('MONTH(ledger.date) = :month', {month: currentMonth})
    //         .andWhere('ledger.email = :email', {email});
    // }

    async findAll(email: string, year: number, month: number): Promise<Ledger[]> {
        // const currentYear: number = new Date().getFullYear();
        // const currentMonth: number = new Date().getMonth() + 1;
        return this.ledgerRepository
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.items', 'item')
            .where('YEAR(ledger.date) = :year', {year: year})
            .andWhere('MONTH(ledger.date) = :month', {month: month})
            .andWhere('ledger.email = :email', {email})
            .andWhere('item.id IS NOT NULL')
            .orderBy('ledger.date', 'ASC') // 날짜순으로 정렬
            .getMany();
    }

    async findOne(email: string, year: number, month: number, day:number): Promise<Ledger[]> {
        return this.ledgerRepository
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.items', 'item')
            .where('YEAR(ledger.date) = :year', {year: year})
            .andWhere('MONTH(ledger.date) = :month', {month: month})
            .andWhere('DAY(ledger.date) = :day',{day: day})
            .andWhere('ledger.email = :email', {email})
            .andWhere('item.id IS NOT NULL')
            .orderBy('ledger.date', 'ASC') // 날짜순으로 정렬
            .getMany();
    }

    async findByCategory(email: string):Promise<Ledger[]> {
        const currentYear: number = new Date().getFullYear();
        const currentMonth: number = new Date().getMonth() + 1;

        return this.ledgerRepository
            .createQueryBuilder('ledger')
            .innerJoin('ledger.items', 'item')
            .where('YEAR(ledger.date) = :year', {year: currentYear})
            .andWhere('MONTH(ledger.date) = :month', {month: currentMonth})
            .andWhere('ledger.email = :email', {email})
            .select('item.category', 'category')
            .addSelect('SUM(item.price)', 'totalAmount')
            .groupBy('item.category')
            .getRawMany();
    }

    remove(id: number) {
        return `This action removes a #${id} ledger`;
    }
}

import {Injectable} from '@nestjs/common';
import {CreateLedgerDto} from './dto/create-ledger.dto';
import {UpdateLedgerDto} from './dto/update-ledger.dto';
import {Ledger} from "./entities/ledger.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

@Injectable()
export class LedgerService {
    constructor(
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
    ) {
    }

    create(createLedgerDto: CreateLedgerDto) {
        return 'This action adds a new ledger';
    }

    async findAll(email: string): Promise<Ledger[]> {
        const currentYear: number = new Date().getFullYear();
        const currentMonth: number = new Date().getMonth() + 1; // 월은 0부터 시작하므로 1을 더해야 함.

        const ledgers: Ledger[] = await this.ledgerRepository
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.items', 'item')  // 'ledger'와 'item'을 조인
            .where('YEAR(ledger.date) = :year', {year: currentYear})
            .andWhere('MONTH(ledger.date) = :month', {month: currentMonth})
            .andWhere('ledger.email = :email', {email})
            .getMany();

        return ledgers;
    }

    async findOne(id: number) {
        const ledgerOne: Ledger[] = await this.ledgerRepository
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.items', 'item')
            .where('ledger.id = :id', {id: id})
            .getMany();

        return ledgerOne;
    }

    update(id: number, updateLedgerDto: UpdateLedgerDto) {
        return `This action updates a #${id} ledger`;
    }

    remove(id: number) {
        return `This action removes a #${id} ledger`;
    }
}

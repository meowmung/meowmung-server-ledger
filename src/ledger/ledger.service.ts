import {Injectable} from '@nestjs/common';
import {Ledger} from "./entities/ledger.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Item} from "./entities/item.entity";
import {HttpService} from "@nestjs/axios";
import axios from "axios";
import FormData from 'form-data';
import {UpdateLedgerDto} from "./dto/update-ledger.dto";

@Injectable()
export class LedgerService {
    constructor(
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
        @InjectRepository(Item)
        private itemRepository: Repository<Item>,
        private readonly httpService: HttpService
    ) {
    }

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

    async findOne(email: string, year: number, month: number, day: number): Promise<Ledger[]> {
        return this.ledgerRepository
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.items', 'item')
            .where('YEAR(ledger.date) = :year', {year: year})
            .andWhere('MONTH(ledger.date) = :month', {month: month})
            .andWhere('DAY(ledger.date) = :day', {day: day})
            .andWhere('ledger.email = :email', {email})
            .andWhere('item.id IS NOT NULL')
            .orderBy('ledger.date', 'ASC') // 날짜순으로 정렬
            .getMany();
    }

    async findByCategory(email: string): Promise<Ledger[]> {
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

    async sendImages(files) {
        const form = new FormData();
        // files.forEach(()=>)
        files.forEach((file) => {
            form.append('files', file.buffer, file.originalname); // 'files' 키로 파일 추가
        });
        try {
            const response = await axios.post('http://localhost:8000/ledger_receipt', form, {
                headers: {
                    ...form.getHeaders(),
                    // "Content-Type": 'multipart/form-data'
                },
            });
            // this.logger.log('Response from FastAPI:', response.data);
            return response.data;
        } catch (error) {
            // this.logger.error(`Error sending images: ${error.response?.data || error.message}`);
            throw new Error('Failed to process images');
        }
    }

    async saveResult(email: string, result: any): Promise<Ledger> {
        const ledger = this.ledgerRepository.create({
            email,
            location: result.location,
            date: result.date,
            items: result.items.map((item) =>
                this.itemRepository.create({
                    name: item.name,
                    price: item.price,
                    category: item.category,
                    quantity: item.quantity
                }),
            ),
        });
        // 데이터베이스에 저장 (연관된 Item도 자동 저장됨)
        return await this.ledgerRepository.save(ledger);
    }

    async updateLedger(email: string, updateLedgerDto: UpdateLedgerDto) {
        const {id, location, date, items} = updateLedgerDto;

        // 1. Ledger 가져오기
        const ledger = await this.ledgerRepository.findOne({
            where: {id},
            relations: ['items'], // 기존 Item 관계 로드
        });
        if (!ledger) {
            throw new Error(`Ledger with ID ${id} not found`);
        }

        // 2. Ledger 기본 정보 업데이트
        ledger.location = location;
        ledger.date = new Date(date);

        // 3. 기존 Items를 모두 삭제
        if (ledger.items.length > 0) {
            await this.itemRepository.remove(ledger.items);
        }

        // 4. 새로운 Items를 덮어쓰기
        ledger.items = items.map((itemDto) =>
            this.itemRepository.create({
                name: itemDto.name,
                price: itemDto.price,
                category: itemDto.category,
                ledger, // 관계 설정
            }),
        );

        // 5. 데이터베이스 저장
        await this.itemRepository.save(ledger.items); // Item 저장
        return this.ledgerRepository.save(ledger); // Ledger 저장
    }

    async update(updateLedgerDto: UpdateLedgerDto) {
        const { id, ...newInput } = updateLedgerDto;
        const result = await this.ledgerRepository.update(
            {id: id},
            {...newInput}
        )
        return !!result.affected; //행이 영향을 받았는지 확인
    }
}
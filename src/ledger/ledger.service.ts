import {Injectable} from '@nestjs/common';
import {Ledger} from "./entities/ledger.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Item} from "./entities/item.entity";
import {HttpService} from "@nestjs/axios";
import axios from "axios";
import FormData from 'form-data';
import {UpdateLedgerDto} from "./dto/update-ledger.dto";
import {UploadLedgerDto} from "./dto/upload-ledger.dto";

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

    async findAll(memberId: number, year: number, month: number): Promise<Ledger[]> {
        // const currentYear: number = new Date().getFullYear();
        // const currentMonth: number = new Date().getMonth() + 1;
        return this.ledgerRepository
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.items', 'item')
            .where('YEAR(ledger.date) = :year', {year: year})
            .andWhere('MONTH(ledger.date) = :month', {month: month})
            .andWhere('ledger.memberId = :memberId', {memberId})
            .andWhere('item.id IS NOT NULL')
            .orderBy('ledger.date', 'ASC') // 날짜순으로 정렬
            .getMany();
    }

    async findOne(memberId: number, year: number, month: number, day: number): Promise<Ledger[]> {
        return this.ledgerRepository
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.items', 'item')
            .where('YEAR(ledger.date) = :year', {year: year})
            .andWhere('MONTH(ledger.date) = :month', {month: month})
            .andWhere('DAY(ledger.date) = :day', {day: day})
            .andWhere('ledger.memberId = :memberId', {memberId})
            .andWhere('item.id IS NOT NULL')
            .orderBy('ledger.date', 'ASC') // 날짜순으로 정렬
            .getMany();
    }

    async findByCategory(memberId: number): Promise<Ledger[]> {
        const currentYear: number = new Date().getFullYear();
        const currentMonth: number = new Date().getMonth() + 1;

        return this.ledgerRepository
            .createQueryBuilder('ledger')
            .innerJoin('ledger.items', 'item')
            .where('YEAR(ledger.date) = :year', {year: currentYear})
            .andWhere('MONTH(ledger.date) = :month', {month: currentMonth})
            .andWhere('ledger.memberId = :memberId', {memberId})
            .select('item.category', 'category')
            .addSelect('SUM(item.price)', 'totalAmount')
            .groupBy('item.category')
            .getRawMany();
    }

    async sendImages(files) {
        const form = new FormData();
        files.forEach((file) => {
            form.append('files', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });
        });

        console.log('Sending files:', form);

        try {
            const response = await axios.post('http://localhost:8085/ledger_receipt', form, {
                headers: form.getHeaders(),
            });
            console.log('Response from FastAPI:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending images:', error.response?.data || error.message);
            console.error('Error details:', error.response || error);
            throw new Error('Failed to process images');
        }
    }


    async saveResult(memberId: number, result: any): Promise<Ledger> {
        const ledger = this.ledgerRepository.create({
            memberId: memberId,
            location: result.location,
            date: result.date,
            message: "",
        });

        // Ledger 저장
        const savedLedger = await this.ledgerRepository.save(ledger);

        // Items 생성 및 Ledger와 연관 설정
        const items = result.items.map((item) =>
            this.itemRepository.create({
                name: item.name,
                price: item.price,
                category: item.category,
                quantity: item.count,
                ledger: savedLedger, // Ledger와 관계 설정
            }),
        );

        // Items 저장
        await this.itemRepository.save(items);

        // 저장된 Ledger에 Items를 추가하여 반환
        savedLedger.items = items;
        return savedLedger;
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

    async update(updateLedgerDto: UpdateLedgerDto, memberId: number) {
        const { id, location, message, date, items } = updateLedgerDto;

        // 1. Ledger 가져오기
        const ledger = await this.ledgerRepository.findOne({
            where: { id, memberId },
            relations: ['items'], // 기존 Items와 관계 로드
        });

        if (!ledger) {
            throw new Error(`Ledger with ID ${id} not found for Member ID ${memberId}`);
        }

        // 2. Ledger 기본 정보 업데이트
        ledger.location = location;
        ledger.message = message;
        ledger.date = new Date(date);

        // 3. 기존 Items 삭제
        if (ledger.items.length > 0) {
            await this.itemRepository.remove(ledger.items);
        }

        // 4. 새로운 Items 생성 및 Ledger와 연관 설정
        const newItems = items.map((item) =>
            this.itemRepository.create({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                category: item.category,
                ledger, // Ledger와 관계 설정
            }),
        );

        // 5. Items 저장
        await this.itemRepository.save(newItems);

        // 6. Ledger 저장
        return await this.ledgerRepository.save(ledger);
    }


    async enroll(uploadLedgerDto: UploadLedgerDto, memberId: number): Promise<Ledger> {
        const {location, message, date, items} = uploadLedgerDto;

        // Ledger 객체 생성
        const ledger = this.ledgerRepository.create({
            memberId,
            location,
            message,
            date: new Date(date),
        });

        // Ledger 저장
        const savedLedger = await this.ledgerRepository.save(ledger);

        // Item 객체 생성 및 Ledger와 연관 설정
        if (items && items.length > 0) {
            const itemsToSave = items.map(item => {
                return this.itemRepository.create({
                    ...item,
                    ledger: savedLedger, // Ledger와 연관
                });
            });

            // Item 저장
            await this.itemRepository.save(itemsToSave);
        }

        return savedLedger;
    }

    async findLedgerById(memberId: number, ledgerId: number): Promise<Ledger> {
        return this.ledgerRepository.findOne({
            where: {
                id: ledgerId,
                memberId: memberId,
            },
            relations: ['items'], // Ledger와 연관된 Items도 가져오기
        });
    }
}
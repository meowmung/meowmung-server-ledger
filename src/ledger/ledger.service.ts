import { Injectable } from '@nestjs/common';
import { Ledger } from './entities/ledger.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import FormData from 'form-data';
import { UpdateLedgerDto } from './dto/update-ledger.dto';
import { UploadLedgerDto } from './dto/upload-ledger.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(Ledger)
    private ledgerRepository: Repository<Ledger>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async findAll(
    memberId: number,
    year: number,
    month: number,
  ): Promise<Ledger[]> {
    return this.ledgerRepository
      .createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.items', 'item')
      .where('ledger.date >= :startDate', {
        startDate: new Date(year, month - 1, 1),
      })
      .andWhere('ledger.date < :endDate', { endDate: new Date(year, month, 1) })
      .andWhere('ledger.memberId = :memberId', { memberId })
      .orderBy('ledger.date', 'ASC')
      .getMany();
  }

  async findOne(
    memberId: number,
    year: number,
    month: number,
    day: number,
  ): Promise<Ledger[]> {
    return this.ledgerRepository
      .createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.items', 'item')
      .where('YEAR(ledger.date) = :year', { year })
      .andWhere('MONTH(ledger.date) = :month', { month })
      .andWhere('DAY(ledger.date) = :day', { day })
      .andWhere('ledger.memberId = :memberId', { memberId })
      .andWhere('item.id IS NOT NULL')
      .orderBy('ledger.date', 'ASC') // 날짜순으로 정렬
      .getMany();
  }

  async findByCategory(memberId: number, year: number, month: number) {
    // 날짜 범위 계산
    const startDate = new Date(year, month - 1, 1); // 해당 월 1일
    const endDate = new Date(year, month, 0); // 해당 월 마지막 날

    // QueryBuilder를 사용하여 직접 쿼리 작성
    const result = await this.ledgerRepository
      .createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.items', 'item')
      .where('ledger.memberId = :memberId', { memberId })
      .andWhere('ledger.date >= :startDate', { startDate })
      .andWhere('ledger.date <= :endDate', { endDate })
      .andWhere('item.category IS NOT NULL') // category가 NULL이 아닌 항목만 포함
      .select([
        'item.category',
        'SUM(item.price * item.quantity) AS totalAmount',
      ])
      .groupBy('item.category') // 카테고리별로 그룹화
      .getRawMany(); // 쿼리 실행

    // 결과 가공
    const categoryTotals = result.reduce((acc, item) => {
      acc[item.item_category] = parseFloat(item.totalAmount);
      return acc;
    }, {});

    return categoryTotals;
  }

  async sendImages(uploadedUrls: string[]) {
    // const form = new FormData();
    // files.forEach((file) => {
    //   form.append('files', file.buffer, {
    //     filename: file.originalname,
    //     contentType: file.mimetype,
    //   });
    // });
    const ledgerReceiptUrl =
      this.configService.get<string>('LEDGER_RECEIPT_URL');
    try {
      const response = await axios.post(ledgerReceiptUrl, {
        image_data: uploadedUrls,
      });
      return response.data;
    } catch (error) {
      return false;
      // throw new Error('Failed to process images');
    }
  }

  async saveResult(memberId: number, result: any): Promise<Ledger> {
    const queryRunner =
      this.ledgerRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Ledger 객체 생성
      const ledger = this.ledgerRepository.create({
        memberId,
        location: result.location,
        date: result.date,
        message: '',
      });

      // Ledger 저장
      const savedLedger = await queryRunner.manager.save(Ledger, ledger);

      // Item 객체 생성 및 Ledger와의 관계 설정
      const items = result.items.map((item) =>
        this.itemRepository.create({
          name: item.name,
          price: item.price,
          category: item.category,
          quantity: item.count,
          ledger: savedLedger, // 관계 설정
        }),
      );

      // Items 저장
      await queryRunner.manager.save(Item, items);

      // 트랜잭션 커밋
      await queryRunner.commitTransaction();

      // 저장된 Ledger와 연결된 Items를 반환
      savedLedger.items = items;
      console.log(savedLedger);
      return savedLedger;
    } catch (error) {
      // 트랜잭션 롤백
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // QueryRunner 정리
      await queryRunner.release();
    }
  }

  async updateLedger(email: string, updateLedgerDto: UpdateLedgerDto) {
    const { id, location, date, items } = updateLedgerDto;
    const queryRunner =
      this.ledgerRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const ledger = await this.ledgerRepository.findOne({
        where: { id },
        relations: ['items'],
      });

      if (!ledger) {
        throw new Error(`Ledger with ID ${id} not found`);
      }

      ledger.location = location;
      ledger.date = new Date(date);

      if (ledger.items.length > 0) {
        await queryRunner.manager.remove(ledger.items);
      }

      ledger.items = items.map((itemDto) =>
        this.itemRepository.create({
          name: itemDto.name,
          price: itemDto.price,
          category: itemDto.category,
          ledger,
        }),
      );

      await queryRunner.manager.save(Item, ledger.items);
      await queryRunner.manager.save(Ledger, ledger);

      await queryRunner.commitTransaction();
      return ledger;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(updateLedgerDto: UpdateLedgerDto, memberId: number) {
    const { id, location, message, date, items } = updateLedgerDto;
    const queryRunner =
      this.ledgerRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 기존 Ledger 조회
      const ledger = await this.ledgerRepository.findOne({
        where: { id, memberId },
        relations: ['items'],
      });

      if (!ledger) {
        throw new Error(
          `Ledger with ID ${id} not found for Member ID ${memberId}`,
        );
      }

      // Ledger 업데이트
      ledger.location = location;
      ledger.message = message;
      ledger.date = new Date(date);

      // Item 업데이트
      if (items && items.length > 0) {
        // 기존 Items 업데이트 (아이템 ID를 기준으로 업데이트)
        for (const updatedItem of items) {
          const existingItem = ledger.items.find(
            (item) => item.id === updatedItem.id,
          );
          if (existingItem) {
            existingItem.name = updatedItem.name;
            existingItem.price = updatedItem.price;
            existingItem.quantity = updatedItem.quantity;
            existingItem.category = updatedItem.category;
          } else {
            // 만약 기존 Item에 해당 ID가 없다면, 새로운 Item 추가
            const newItem = this.itemRepository.create({
              ...updatedItem,
              ledger, // 기존 ledger와 연결
            });
            ledger.items.push(newItem);
          }
        }
      }

      // 기존 Items 삭제 (없으면 건너뛰기)
      if (ledger.items.length > 0) {
        await queryRunner.manager.save(Item, ledger.items); // 변경된 Items만 저장
      }

      // Ledger 저장 (변경된 Ledger를 저장)
      await queryRunner.manager.save(Ledger, ledger);

      // 트랜잭션 커밋
      await queryRunner.commitTransaction();

      return ledger;
    } catch (error) {
      // 오류 발생 시 롤백
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 트랜잭션 종료
      await queryRunner.release();
    }
  }

  async enroll(
    uploadLedgerDto: UploadLedgerDto,
    memberId: number,
  ): Promise<Ledger> {
    const { location, message, date, items } = uploadLedgerDto;
    const queryRunner =
      this.ledgerRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const ledger = this.ledgerRepository.create({
        memberId,
        location,
        message,
        date: new Date(date),
      });

      const savedLedger = await queryRunner.manager.save(Ledger, ledger);

      if (items && items.length > 0) {
        const itemsToSave = items.map((item) => {
          return this.itemRepository.create({
            ...item,
            ledger: savedLedger,
          });
        });

        await queryRunner.manager.save(Item, itemsToSave);
      }

      await queryRunner.commitTransaction();
      return savedLedger;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findLedgerById(memberId: number, ledgerId: number): Promise<Ledger> {
    return this.ledgerRepository.findOne({
      where: {
        id: ledgerId,
        memberId: memberId,
      },
      relations: ['items'],
    });
  }

  async deleteItem(
    memberId: number,
    ledgerId: number,
    itemId: number,
  ): Promise<string> {
    // Ledger가 존재하고, 해당 Member ID와 연결되어 있는지 확인
    const ledger = await this.ledgerRepository.findOne({
      where: { id: ledgerId, memberId },
    });

    if (!ledger) {
      throw new Error('Ledger not found or you do not have access.');
    }

    // 해당 Ledger와 연결된 Item이 존재하는지 확인
    const item = await this.itemRepository.findOne({
      where: { id: itemId, ledger: { id: ledgerId } },
    });

    if (!item) {
      throw new Error('Item not found in the specified ledger.');
    }

    // Item 삭제
    await this.itemRepository.delete(itemId);

    return `Item with id ${itemId} has been deleted.`;
  }

  async deleteLedger(memberId: number, ledgerId: number): Promise<string> {
    const ledger = await this.ledgerRepository.findOne({
      where: { id: ledgerId, memberId },
      relations: ['items'],
    });

    if (!ledger) {
      throw new Error('Ledger not found or you do not have access.');
    }

    // Remove related items explicitly if cascade is not enabled
    if (ledger.items.length > 0) {
      const itemIds = ledger.items.map((item) => item.id);
      await this.itemRepository.delete(itemIds);
    }

    await this.ledgerRepository.delete(ledgerId);

    return `Ledger with id ${ledgerId} and all related items have been deleted.`;
  }

  validate(result) {
    if (
      result.total_amount == -1 &&
      result.items.length == 0 &&
      result.location == '읽을 수 없음' &&
      result.date == '읽을 수 없음'
    ) {
      return true;
    }
    return false;
  }
}

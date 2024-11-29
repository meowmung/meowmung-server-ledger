import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Item} from "./item.entity";

@Entity('ledger')
export class Ledger {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    memberId: number;

    @Column()
    location: string;

    @Column({type: 'date'})
    date: Date;

    @Column()
    message: string;

    @OneToMany(type => Item, item => item.ledger)
    items: Item[];
}

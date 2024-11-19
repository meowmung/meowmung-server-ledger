import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Item} from "./item.entity";

@Entity('ledger')
export class Ledger {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'date'})
    date: Date

    @OneToMany(type => Item, item => item.ledger)
    items: Item[];
}

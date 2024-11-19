import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Ledger} from "./ledger.entity";

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    price: number;

    @Column()
    category: string;

    @ManyToOne(type => Ledger, ledger=> ledger.items)
    ledger: Ledger;
}
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('payment_methods')
export class PaymentMethod {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 120, unique: true })
    name!: string;

    @Column({ length: 200 })
    description!: string;

    @Column({ default: true })
    is_active!: boolean;

    @CreateDateColumn({ type: 'timestamp'})
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp'})
    updated_at!: Date;
}

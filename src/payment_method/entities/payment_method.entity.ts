import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethodType } from '../payment-method.constants';

@Entity('payment_methods')
export class PaymentMethod {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 120, unique: true })
    name!: string;

    @Column({ length: 200 })
    description!: string;

    @Column({
        name: 'method_type',
        type: 'varchar',
        length: 30,
        default: PaymentMethodType.OTHER,
    })
    type!: PaymentMethodType;

    @Column({ default: true })
    is_active!: boolean;

    @CreateDateColumn({ type: 'timestamp'})
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp'})
    updated_at!: Date;
}

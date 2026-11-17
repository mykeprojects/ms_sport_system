import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Association class: Fan (n) — (n) PaymentMethod.
 * It stores the payment methods that belong to a specific fan so a bet can
 * only be placed with a method owned by the authenticated fan.
 */
@Entity('fan_payment_methods')
export class FanPaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'fan_id', type: 'int' })
  fanId: number;

  @Column({ name: 'payment_method_id', type: 'int' })
  paymentMethodId: number;

  /** Non sensitive reference shown to the fan (e.g. `****1234`). */
  @Column({ name: 'masked_reference', type: 'varchar', length: 40, default: '***' })
  maskedReference: string;

  @Column({ name: 'holder_name', type: 'varchar', length: 120, nullable: true })
  holderName: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

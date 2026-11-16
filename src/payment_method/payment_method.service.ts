import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentMethodDto } from './dto/create-payment_method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment_method.dto';
import { PaymentMethodResponseDto } from './dto/paymen_method-response.dto';
import { PaymentMethod } from './entities/payment_method.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethodMapper } from './mappers/payment_method.mapper';

@Injectable()
export class PaymentMethodService {

  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    private readonly paymentMethodMapper: PaymentMethodMapper,
  ){}

  async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    const entity = this.paymentMethodMapper.toEntity(createPaymentMethodDto);
    const saved = await this.paymentMethodRepository.save(entity);
    return this.paymentMethodMapper.toResponseDto(saved);
  }

  async findAll(): Promise<PaymentMethodResponseDto[]>{
    const paymentsMethods = await this.paymentMethodRepository.find({
      order: { id: 'ASC'},
    });
    return this.paymentMethodMapper.toResponseDtoList(paymentsMethods);
  }

  async findOne(id: number): Promise<PaymentMethodResponseDto> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: {id},
    })
    if (!paymentMethod){
      throw new NotFoundException(`Payment Method whit id ${id} not found`);
    }
    return this.paymentMethodMapper.toResponseDto(paymentMethod);
  }

  async update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodResponseDto>{
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id },
    });
    if(!paymentMethod){
      throw new NotFoundException(`Payment Method with ${id} not found`);
    }
    const updated = this.paymentMethodMapper.toUpdateEntity(paymentMethod, updatePaymentMethodDto);
    const saved = await this.paymentMethodRepository.save(updated);
    return this.paymentMethodMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const paymentMethod = await this.paymentMethodRepository.findOne({ where: {id} });
    if(!paymentMethod){
      throw new NotFoundException(`Payment Method with ${id} not found`);
    }
    await this.paymentMethodRepository.remove(paymentMethod);
    return { message: `Payment Method #${id} deleted successfully`};
  }
}

import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../entities/payment_method.entity';
import { PaymentMethodResponseDto } from '../dto/paymen_method-response.dto';
import { CreatePaymentMethodDto } from '../dto/create-payment_method.dto';
import { UpdatePaymentMethodDto } from '../dto/update-payment_method.dto';
import { PaymentMethodType } from '../payment-method.constants';

@Injectable()
export class PaymentMethodMapper{
    toEntity(dto: CreatePaymentMethodDto): PaymentMethod {
        const entity = new PaymentMethod();
        entity.name = dto.name.trim();
        entity.description = dto.description.trim();
        entity.type = dto.type ?? PaymentMethodType.OTHER;
        entity.is_active = dto.is_active ?? true;

        return entity;
    }

    toUpdateEntity(entity: PaymentMethod, dto: UpdatePaymentMethodDto): PaymentMethod{
        if (dto.name !== undefined){
            entity.name = dto.name.trim();
        }
        if(dto.description !== undefined){
            entity.description = dto.description.trim();
        }
        if (dto.type !== undefined) {
            entity.type = dto.type;
        }
        if(dto.is_active !== undefined){
            entity.is_active = dto.is_active;
        }
        return entity;
    }

    toResponseDto(entity: PaymentMethod): PaymentMethodResponseDto{
        const dto = new PaymentMethodResponseDto();
        dto.id = entity.id;
        dto.name = entity.name;
        dto.description = entity.description;
        dto.type = entity.type;
        dto.is_active = entity.is_active;
        return dto;
    }

    toResponseDtoList(entities: PaymentMethod[]): PaymentMethodResponseDto[]{
        return entities.map((entity) => this.toResponseDto(entity));
    }
}
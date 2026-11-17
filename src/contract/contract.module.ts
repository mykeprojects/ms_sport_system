import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { ContractMapper } from './mappers/contract.mapper';
import { RosterController, ContractController } from './contract.controller';
import { ContractService } from './contract.service';

@Module({
  imports: [CatalogCoreModule],
  controllers: [RosterController, ContractController],
  providers: [ContractService, ContractMapper],
})
export class ContractModule {}

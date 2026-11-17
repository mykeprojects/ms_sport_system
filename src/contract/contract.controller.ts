import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { UpdateContractDto } from './dto/update-contract.dto';
import { AssignContractDto } from './dto/assign-contract.dto';
import { ReleaseContractDto } from './dto/release-contract.dto';
import { ContractService } from './contract.service';

@Controller('teams')
export class RosterController {
  constructor(private readonly contractService: ContractService) {}

  @Get(':id/roster')
  roster(@Param('id', ParseIntPipe) id: number) {
    return this.contractService.roster(id);
  }

  @Post(':id/players')
  @HttpCode(201)
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignContractDto) {
    return this.contractService.assign(id, dto.playerId, dto.startDate, dto.endDate);
  }
}

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContractDto) {
    return this.contractService.update(id, dto.startDate, dto.endDate);
  }

  @Post(':id/release')
  release(@Param('id', ParseIntPipe) id: number, @Body() dto: ReleaseContractDto) {
    return this.contractService.release(id, dto.reason, dto.detail);
  }
}

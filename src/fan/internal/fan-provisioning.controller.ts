import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { FanMapper } from '../mappers/fan.mapper';
import { FanProvisioningService } from '../provisioning/fan-provisioning.service';
import { ProvisionFanDto } from './dto/provision-fan.dto';

/**
 * Service-to-service fan provisioning used by ms_security during registration.
 * It is not part of the public fan API: the global SecurityGuard is skipped
 * with @Public and the shared-key guard protects the endpoint instead.
 */
@Controller('internal/fans')
@Public()
@UseGuards(InternalApiKeyGuard)
export class FanProvisioningController {
  constructor(
    private readonly fanProvisioningService: FanProvisioningService,
    private readonly mapper: FanMapper,
  ) {}

  @Post()
  @HttpCode(200)
  async provision(@Body() dto: ProvisionFanDto) {
    const fan = await this.fanProvisioningService.provision(dto);
    return this.mapper.toFanResponse(fan);
  }

  @Delete(':externalUserId')
  @HttpCode(204)
  async remove(@Param('externalUserId', ParseIntPipe) externalUserId: number) {
    await this.fanProvisioningService.deleteByExternalUserId(externalUserId);
  }
}

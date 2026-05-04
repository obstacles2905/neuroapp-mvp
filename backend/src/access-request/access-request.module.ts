import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccessRequestController } from './access-request.controller';
import { AccessRequestService } from './access-request.service';

@Module({
  imports: [AuthModule],
  controllers: [AccessRequestController],
  providers: [AccessRequestService],
})
export class AccessRequestModule {}

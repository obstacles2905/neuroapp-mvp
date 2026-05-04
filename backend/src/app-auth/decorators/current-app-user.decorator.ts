import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestAppUser } from '../../common/types/request-app-user.type';

export const CurrentAppUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestAppUser => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestAppUser }>();
    return request.user;
  },
);

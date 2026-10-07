import { BadRequestException, Injectable, ParseUUIDPipe } from '@nestjs/common';

@Injectable()
export class ParseIdPipe extends ParseUUIDPipe {
  constructor() {
    super({
      exceptionFactory: () =>
        new BadRequestException('id deve ser um UUID válido'),
    });
  }
}

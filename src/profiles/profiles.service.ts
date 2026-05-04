import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class ProfilesService {
  private profiles = [
    {
      id: randomUUID(),
      name: 'test',
      description: 'description of test',
    },
  ];
  findAll() {
    return this.profiles;
  }
}

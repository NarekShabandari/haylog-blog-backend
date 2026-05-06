import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateProfileDto } from './dto/create-profile.dto';

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
  findOne(id: string) {
    return this.profiles.find((profile) => profile.id === id);
  }

  create(createProfileDTo: CreateProfileDto) {
    const createProfile = {
      id: randomUUID(),
      ...createProfileDTo,
    };
    this.profiles.push(createProfile);
    return createProfile;
  }
}

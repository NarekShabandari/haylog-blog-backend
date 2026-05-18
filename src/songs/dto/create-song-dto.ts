import {
  isArray,
  isDateString,
  IsMilitaryTime,
  isNotEmpty,
  IsNotEmpty,
  isString,
  IsString,
} from 'class-validator';

export class CreateSongDTO {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @isNotEmpty()
  @isArray()
  @IsString()
  readonly artists: string[];

  @IsNotEmpty()
  @isDateString()
  readonly releasedDate: Date;

  @IsNotEmpty()
  @IsMilitaryTime()
  readonly duration: Date;
}

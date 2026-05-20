import {
  isArray,
  isDateString,
  IsMilitaryTime,
  isNotEmpty,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateSongDTO {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @isNotEmpty()
  @isArray()
  @IsString({ each: true })
  readonly artists: string[];

  @IsNotEmpty()
  @isDateString()
  readonly releasedDate: Date;

  @IsNotEmpty()
  @IsMilitaryTime()
  readonly duration: Date;
}

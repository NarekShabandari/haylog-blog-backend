import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDTO } from './dto/create-song-dto';

@Controller('songs')
export class SongsController {
  constructor(private songsService: SongsService) {}
  @Post()
  create(@Body() createSongDTO: CreateSongDTO) {
    return this.songsService.create(createSongDTO);
  }
  @Get()
  findAll() {
    try {
    } catch (error) {
      console.log('Im in the catch block', error);
    }
    return this.songsService.findAll();
  }
  @Get(':id')
  findOne() {
    return;
  }
  @Put(':id')
  update() {
    return;
  }
  @Delete(':id')
  remove() {
    return;
  }
}

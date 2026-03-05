import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesController } from './profiles.controller';
import { ProfilesConsumer } from './profiles.consumer';
import { ProfilesService } from './profiles.service';
import { Profile } from './entities/profile.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Profile])],
    controllers: [ProfilesController, ProfilesConsumer],
    providers: [ProfilesService],
})
export class ProfilesModule { }

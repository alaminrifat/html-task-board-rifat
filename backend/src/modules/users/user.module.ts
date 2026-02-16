import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserDevice } from './entities/user-device.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { I18nHelper } from '@core/utils/i18n.helper';
import { S3Module } from '@infrastructure/s3/s3.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, UserDevice]), S3Module],
    controllers: [UserController],
    providers: [UserService, UserRepository, I18nHelper],
    exports: [UserService, UserRepository],
})
export class UserModule {}

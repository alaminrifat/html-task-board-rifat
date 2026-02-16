import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationRepository } from './notification.repository';
import { Notification } from './notification.entity';
import { UserModule } from '@modules/users/user.module';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        forwardRef(() => UserModule),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationRepository],
    exports: [NotificationsService],
})
export class NotificationsModule {}

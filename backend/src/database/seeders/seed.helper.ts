import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { UtilsService } from '@infrastructure/utils/utils.service';
import { seedUsers } from './user.seed';
import { seedSystemSettings } from './system-settings.seed';
import { seedDefaultLabels } from './labels.seed';

async function runSeeder() {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);
    const utilsService = app.get(UtilsService);

    // Seed Users (admin + test users)
    await seedUsers(dataSource, utilsService);

    // Seed System Settings (7 default settings)
    await seedSystemSettings(dataSource);

    // Seed Default Labels (5 system-wide labels)
    await seedDefaultLabels(dataSource);

    await app.close();
    console.log('All seeding completed successfully!');
}

runSeeder().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});

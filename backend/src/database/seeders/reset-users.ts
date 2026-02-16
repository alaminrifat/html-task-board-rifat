import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { UtilsService } from '@infrastructure/utils/utils.service';
import { User } from 'src/modules/users/user.entity';
import { UserRole } from '@shared/enums/user-role.enum';
import { UserStatus } from '@shared/enums/user-status.enum';

async function resetUsers() {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);
    const utilsService = app.get(UtilsService);

    const userRepository = dataSource.getRepository(User);

    console.log('Checking existing users...');
    const existingUsers = await userRepository.find();
    console.log(`Found ${existingUsers.length} users:`);
    existingUsers.forEach((user) => {
        console.log(`  - ${user.email} (role: ${user.role})`);
    });

    console.log('\nDeleting all users...');
    await userRepository.clear();
    console.log('All users deleted');

    console.log('\nCreating fresh users with proper password hashing...');

    // Create Admin User
    const hashedAdminPassword = await utilsService.getHash('admin123');
    console.log(
        `Admin password hash: ${hashedAdminPassword.substring(0, 20)}...`,
    );

    const adminUser = userRepository.create({
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: hashedAdminPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
    });
    await userRepository.save(adminUser);
    console.log('Admin user created: admin@example.com / admin123');

    // Verify password immediately
    const testAdmin = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email: 'admin@example.com' })
        .getOne();

    const isAdminPasswordValid = await utilsService.isMatchHash(
        'admin123',
        testAdmin!.password!,
    );
    console.log(
        `   Password verification: ${isAdminPasswordValid ? 'VALID' : 'INVALID'}`,
    );

    // Create Regular User
    const hashedUserPassword = await utilsService.getHash('user123');
    const regularUser = userRepository.create({
        fullName: 'Test User',
        email: 'user@example.com',
        password: hashedUserPassword,
        role: UserRole.TEAM_MEMBER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
    });
    await userRepository.save(regularUser);
    console.log('Regular user created: user@example.com / user123');

    // Verify password immediately
    const testUser = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email: 'user@example.com' })
        .getOne();

    const isUserPasswordValid = await utilsService.isMatchHash(
        'user123',
        testUser!.password!,
    );
    console.log(
        `   Password verification: ${isUserPasswordValid ? 'VALID' : 'INVALID'}`,
    );

    console.log('\nSuccessfully created 2 users with verified passwords');

    await app.close();
    console.log('\nReset completed successfully!');
}

resetUsers().catch((error) => {
    console.error('Reset failed:', error);
    process.exit(1);
});

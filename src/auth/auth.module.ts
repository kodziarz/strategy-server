import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';



@Module({
    imports: [
        UsersModule,
        ConfigModule.forRoot(),
        PassportModule,
        JwtModule.register({
            secret: process.env.APP_SECRET,
            signOptions: { expiresIn: process.env.JWT_EXPIRES }
        })],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    controllers: [],
    exports: [AuthService]
})
export class AuthModule { }

import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import User from 'src/dataClasses/User';
import { JwtService } from '@nestjs/jwt';
import { UserNotFoundException, UsersService } from 'src/users/users.service';
import JwtPayload from 'src/dataClasses/JwtPayload';


@Injectable()
export class AuthService {

    constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) { }

    getTestData(): string {
        return "jakiś losowy string";
    }

    async validateUser(login: string, password: string): Promise<User> {
        return await this.usersService.validateUser(login, password);
    }

    generateToken(user: User) {
        return {
            access_token: this.jwtService.sign({
                sub: user.id,
            } as JwtPayload)
        }
    }

}



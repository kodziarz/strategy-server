import { BadRequestException, forwardRef, Inject, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import JwtPayload from "src/dataClasses/JwtPayload";
import User from "src/dataClasses/User";
import { UserNotFoundException, UsersService } from "src/users/users.service";

export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.APP_SECRET,
        });
    }

    async validate(payload: JwtPayload): Promise<User> {

        return await this.usersService.getUserById(payload.sub);
    }
}
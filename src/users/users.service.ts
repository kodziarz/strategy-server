import { Injectable, Logger } from '@nestjs/common';
import User from 'src/dataClasses/User';
import * as bcrypt from 'bcrypt';

let user = new User("admin", "$2b$10$ZYc/dXp9vBNw6OtDrizXce", bcrypt.hashSync("admin", "$2b$10$ZYc/dXp9vBNw6OtDrizXce"));
let user2 = new User("student", "$2b$10$o.KwpglTIp0RvZjo/useuO", bcrypt.hashSync("hasło", "$2b$10$o.KwpglTIp0RvZjo/useuO"));

const users = [user, user2];

@Injectable()
export class UsersService {

    /**
     * Determines whether the user'a credentials match.
     * @param username Login of checked user.
     * @param password Password of checked user.
     * @returns {@link User} who matches credentials (undefined if none matches)
     * with updated JWT token.
     */
    async validateUser(username: string, password: string): Promise<User | undefined> {

        for (const user of users) {
            if (
                user.name == username
                && user.hash == await bcrypt.hash(password, user.salt)
            )
                return user;
        }
        return undefined;
    }

    /**
     * Finds {@link User by id}.
     * @param userId Id of prosected {@link User}.
     * @returns User with given id.
     * @throws {@link UserNotFoundException}.
     */
    async getUserById(userId: number): Promise<User> {
        for (const user of users) {
            if (user.id == userId) {
                return user;
            }
        }
        throw new UserNotFoundException();
    }
}

export class UserNotFoundException extends Error {
    constructor() {
        super("Such a user does not exist.");
    }
}

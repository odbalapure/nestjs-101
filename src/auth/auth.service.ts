import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) { }

    async signup(dto: AuthDto) {
        try {
            const hash = await argon.hash(dto.password);
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash: hash
                },
                select: {
                    id: true,
                    email: true,
                    createdAt: true
                }
            });

            return this.signToken(user.id, user.email);
        } catch (err) {
            if (err instanceof PrismaClientKnownRequestError) {
                if (err.code === 'P2002') {
                    throw new ForbiddenException('Credentials Taken')
                }
            }

            throw err;
        }
    }

    async signin(dto: AuthDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) {
            throw new ForbiddenException('Credentials incorrect');
        }

        const pwMatches = await argon.verify(user.hash, dto.password);

        if (!pwMatches) {
            throw new ForbiddenException('Credentials incorrect');
        }

        delete user.hash;

        return this.signToken(user.id, user.email);
    }

    async signToken(userId: number, email: string): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            email
        };

        const secret = this.config.get('JWT_SECRET');
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret
        });

        return {
            access_token: token
        };
    }
}

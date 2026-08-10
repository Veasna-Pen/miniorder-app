import { DatabaseService, users } from '@app/database';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthServiceService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
  ) { }

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async register(email: string, password: string) {
    const user = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length > 0) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await this.dbService.db
      .insert(users)
      .values({ email, password: hashedPassword })
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.USER_REGISTERED, {
      userId: newUser.id,
      email: newUser.email,
      timestamp: new Date().toISOString(),
    });

    return { message: 'User registered successfully', user: newUser };
  }

  async login(email: string, password: string) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ userId: user.id, email: user.email });

    this.kafkaClient.emit(KAFKA_TOPICS.USER_LOGGED_IN, {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const [user] = await this.dbService.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}

import { Module } from '@nestjs/common';
import { AuthModule } from './services/auth/auth.module';
import { UserModule } from './services/user/user.module';
import { RateLimiterModule } from 'nestjs-rate-limiter';

@Module({
  imports: [
    AuthModule,
    UserModule,
    RateLimiterModule.register({
      points: 5,
      duration: 10,
      blockDuration: 60 * 15,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

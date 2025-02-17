import { Module } from '@nestjs/common';
import { AuthModule } from './services/auth/auth.module';
import { UserModule } from './services/user/user.module';
import { RateLimiterModule } from 'nestjs-rate-limiter';
import { HelloModule } from './services/hello/hello.module';
import { ProductModule } from './services/product/product.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    HelloModule,
    AuthModule,
    UserModule,
    ProductModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RateLimiterModule.register({
      points: 5,
      duration: 10,
      blockDuration: 60 * 15,
    }),
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

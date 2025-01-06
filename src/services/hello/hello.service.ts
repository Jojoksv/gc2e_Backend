import { Injectable } from '@nestjs/common';

@Injectable()
export class HelloService {
  say() {
    return { message: 'Hello from the backend' };
  }
}

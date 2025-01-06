import { Injectable } from '@nestjs/common';

@Injectable()
export class HelloService {
  say() {
    return { message: 'Hello WWorld from the backend api' };
  }
}

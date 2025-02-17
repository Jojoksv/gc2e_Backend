import { Controller, Get, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    try {
      return await this.userService.findAll();
    } catch (error) {
      throw {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erreur lors de la récupération des utilisateurs',
      };
    }
  }
}

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/types/roles.enum'; // Enumération des rôles (par ex. ADMIN, USER, etc.)

/**
 * Le decorator @Injectable permet à NestJS d'injecter cette classe dans d'autres composants.
 * Ce guard est utilisé pour vérifier les rôles d'un utilisateur avant d'autoriser l'accès.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Le Reflector est utilisé pour lire les métadonnées (comme les rôles) appliquées à un handler.

  /**
   * La méthode principale qui détermine si la requête peut passer ou non.
   * @param context - Le contexte d'exécution de la requête.
   * @returns boolean - True si l'accès est autorisé, False sinon.
   */
  canActivate(context: ExecutionContext): boolean {
    // Récupère les rôles requis définis dans les métadonnées du handler (via @SetMetadata).
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );

    // Si aucun rôle n'est requis, on autorise par défaut l'accès.
    if (!requiredRoles) {
      return true;
    }

    // Récupère l'objet de requête (ex. l'utilisateur connecté) à partir du contexte HTTP.
    const { user } = context.switchToHttp().getRequest();

    // Vérifie si l'utilisateur a au moins un rôle requis.
    return requiredRoles.some((role) => user.role === role);
  }
}

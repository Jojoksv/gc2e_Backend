export type loginDataDTO = { email: string; password: string };
export type UserPayload = { userId: string; role: string };
export type RequestWithUser = { user: UserPayload };
export type CreateUser = { email: string; name: string; password: string };

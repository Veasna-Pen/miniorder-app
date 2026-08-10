export enum EUserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: EUserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthUser extends Pick<IUser, 'id' | 'email'> {
  role: EUserRole;
}

/** Claims carried by the access token issued on login. */
export interface IJwtPayload {
  sub: string;
  email: string;
}

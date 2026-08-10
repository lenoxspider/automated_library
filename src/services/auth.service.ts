import { injectable } from 'tsyringe';
import { UserRepository } from '../repositories/user.repo';

@injectable()
export class AuthService {
  constructor(private userRepo: UserRepository) {}
  
  // Logic for authentication will go here
}

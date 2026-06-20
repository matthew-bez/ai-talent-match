import { CurrentUserPayload } from '../decorators/current-user.interface';

// Augment Passport's `Express.User` so `request.user` is typed across the app.
// Populated by the JWT auth guard / strategies.
declare global {
  namespace Express {
    interface User extends CurrentUserPayload {}
  }
}

export {};

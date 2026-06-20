/**
 * The shape of the authenticated user attached to the request by the JWT auth
 * guard (built in the next phase). Endpoints read it via the @CurrentUser()
 * decorator so they never have to touch the raw request object.
 */
export interface CurrentUserPayload {
  id: string;
  email: string;
}

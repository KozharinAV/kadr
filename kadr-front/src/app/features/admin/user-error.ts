import { HttpErrorResponse } from '@angular/common/http';

export function userErrorKey(error: unknown): string {
  const message = error instanceof HttpErrorResponse ? errorBodyMessage(error.error) : '';
  if (message === 'email_taken') {
    return 'admin.emailTaken';
  }
  if (message === 'last_admin') {
    return 'admin.lastAdmin';
  }
  if (message === 'user_owns_videos') {
    return 'admin.ownsVideos';
  }
  if (message === 'cannot_delete_self') {
    return 'admin.selfDelete';
  }
  return 'admin.saveError';
}

function errorBodyMessage(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message: unknown = body.message;
    return typeof message === 'string' ? message : '';
  }
  return '';
}

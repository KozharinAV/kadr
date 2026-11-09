export class PermanentMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentMediaError';
  }
}

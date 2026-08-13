export class NotFoundError extends Error {
  public override readonly name = 'NotFoundError';

  public constructor(message: string) {
    super(message);
  }
}

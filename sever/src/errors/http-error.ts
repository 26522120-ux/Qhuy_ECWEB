export class HttpError extends Error {
  public readonly code?: string;
  public readonly redirectToLogin?: boolean;

  constructor(
    public readonly statusCode: number,
    message: string,
    options?: { code?: string; redirectToLogin?: boolean },
  ) {
    super(message);
    this.name = "HttpError";
    this.code = options?.code;
    this.redirectToLogin = options?.redirectToLogin;
  }
}

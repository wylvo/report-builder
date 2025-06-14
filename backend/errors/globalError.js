class GlobalError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "failed" : "error";
    this.isTrusted = true;
    this.trustedMessage = message;

    Error.captureStackTrace(this, this.contructor);
  }
}

export default GlobalError;

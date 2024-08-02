import obfuscateLogData from "./obfuscateLogData.js";

// Object or Array sent with res.send()
const formatHTTPResponse = (
  req,
  res,
  responseBody,
  requestStartTime,
  error
) => {
  let requestDuration = ".";

  if (requestStartTime) {
    const endTime = Date.now() - requestStartTime;
    requestDuration = `${endTime / 1000}s`; // ms to s
  }

  return {
    request: {
      method: req?.method,
      host: req?.headers.host,
      baseUrl: req?.baseUrl,
      url: req?.url,
      headers: req?.headers,
      clientIp: req?.headers["x-forwarded-for"] ?? req?.socket.remoteAddress,
      params: req?.params,
      query: req?.query,
      body: obfuscateLogData(req?.body),
      requestDuration,
    },
    response: {
      headers: res?.getHeaders(),
      statusCode: res?.statusCode,
      body: obfuscateLogData(responseBody),
    },
    error: {
      name: error?.name,
      statusCode: error?.statusCode,
      message: error?.message,
      stackTrace: error?.stack,
    },
  };
};

export default formatHTTPResponse;

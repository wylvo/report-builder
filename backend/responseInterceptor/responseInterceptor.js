import { httpLogger } from "../logs/logger.js";
import formatHTTPResponse from "./formatHTTPResponse.js";

// prettier-ignore
const responseInterceptor = (req, res, next) => {
  // used to calculate time between request and the response
  const requestStartTime = Date.now();

  // Save the original response method
  const originalSend = res.send;

  let responseSent = false;

  // Override the response method
  res.send = function (body) {
    if (!responseSent) {
      if (res.statusCode < 400)
        httpLogger.info("", formatHTTPResponse(req, res, body, requestStartTime));
      else httpLogger.error(body.message, formatHTTPResponse(req, res, body, requestStartTime));
      

      responseSent = true;
    }

    // Call the original response method
    return originalSend.call(this, body);
  };

  // Continue processing the request
  next();
};

export default responseInterceptor;

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
  res.send = function (responseBody) {
    if (!responseSent) {
      
      const parsedBody = JSON.parse(responseBody);

      if (res.statusCode < 400)
        httpLogger.info(parsedBody.status, formatHTTPResponse(req, res, responseBody, requestStartTime));
      else
        httpLogger.error(parsedBody.message, formatHTTPResponse(req, res, responseBody, requestStartTime));
      

      responseSent = true;
    }

    // Call the original response method
    return originalSend.call(this, responseBody);
  };

  // Continue processing the request
  next();
};

export default responseInterceptor;

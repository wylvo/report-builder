import validator from "validator";

import { httpLogger } from "../logs/logger.js";
import formatHTTPResponse from "./formatHTTPResponse.js";
import { ActivityLog } from "../api/v1/activityLog/activityLog.model.js";
import { AuthenticationLog } from "../api/v1/authenticationLog/authenticationLog.model.js";

const responseInterceptor = (req, res, next) => {
  // used to calculate time between request and the response
  const requestStartTime = Date.now();

  // Save the original response method
  const originalSend = res.send;

  let responseSent = false;

  // Override the response method
  res.send = function (responseBody) {
    if (!responseSent) {
      let parsedBody;
      if (validator.isJSON(responseBody)) parsedBody = JSON.parse(responseBody);

      if (res.statusCode < 400)
        httpLogger.info(
          parsedBody?.status || responseBody,
          formatHTTPResponse(req, res, responseBody, requestStartTime)
        );
      else
        httpLogger.error(
          parsedBody?.message || responseBody,
          formatHTTPResponse(req, res, responseBody, requestStartTime)
        );

      responseSent = true;
    }

    // Call the original response method
    return originalSend.call(this, responseBody);
  };

  // Continue processing the request
  next();
};

const responseInterceptorAPI = (req, res, next) => {
  // Save the original response method
  const originalSend = res.send;

  let responseSent = false;

  // Override the response method
  res.send = function (responseBody) {
    if (!responseSent) {
      if (req.method === "GET") return originalSend.call(this, responseBody);

      ActivityLog.create(req, res);

      responseSent = true;
    }

    // Call the original response method
    return originalSend.call(this, responseBody);
  };

  // Continue processing the request
  next();
};

const responseInterceptorAuth = (req, res, next) => {
  // Save the original response method
  const originalSend = res.send;

  let responseSent = false;

  // Override the response method
  res.send = function (responseBody) {
    if (!responseSent) {
      let isSuccessful = true;

      if (!req.url.includes("/signin"))
        return originalSend.call(this, responseBody);

      if (res.statusCode < 400) AuthenticationLog.create(req, isSuccessful);
      else AuthenticationLog.create(req, !isSuccessful);

      responseSent = true;
    }

    // Call the original response method
    return originalSend.call(this, responseBody);
  };

  // Continue processing the request
  next();
};

export default {
  all: responseInterceptor,
  api: responseInterceptorAPI,
  auth: responseInterceptorAuth,
};

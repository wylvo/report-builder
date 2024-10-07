/**
 * Entry point file to run iisnode with ES6 modules. Allows iisnode to run the server.js file without syntax errors
 * For more details about iisnode visit: https://github.com/Azure/iisnode
 * For more details how to support es6 with iisnode, read this blog article: https://techcommunity.microsoft.com/t5/apps-on-azure-blog/supporting-es6-import-on-windows-app-service-node-js-iisnode/ba-p/3639037
 *  */
import("./server.js");

import { WebSocket } from "ws";

declare module "ws" {
  interface ExtWebSocket extends WebSocket {
   
  }
}

// import * as express from "express";

// declare global {
//   namespace Express {
//     interface Application {
//       customProperty?: string;
//     }
//   }
// }

import { WebSocket } from "ws";

// declare global {
//   interface WebSocket {
//     isAlive: boolean;
//     id: string | null;
//   }
// }

declare global {
  interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    id: string | null;
    type: string | null;
  }
}

// import {} from "ws";

// declare module "ws" {
//   interface WebSocket {
//     isAlive: boolean;
//     id: string | null;
//     type: string | null;
//   }
// }

export {};

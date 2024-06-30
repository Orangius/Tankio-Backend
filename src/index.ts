import express from "express";
import cors from "cors";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { User } from "./models/UserModels.js";
import { handleIncomingMessage } from "handlers/messages.js";
import {
  alertDashboardOnConnect,
  alertDashboardOnDisconnect,
  returnHardWareStatus,
} from "handlers/status-update.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// server.on("upgrade", function upgrade(request, socket, head) {
//   // wss.handleUpgrade(request, socket, head, function done(ws) {
//   //   wss.emit('connection', ws, request);
//   // });
//   console.log("upgrade required");
//   console.log(request);
// });

let interval: NodeJS.Timeout;

wss.on("connection", (extWs: ExtWebSocket, request) => {
  //const extWs = ws as ExtWebSocket;

  console.log("A new client connected");

  console.log("This is the number of clients: ", wss.clients.size);
  // get the parameters from the request object
  const { searchParams } = new URL(
    request.url!,
    `http://${request.headers.host}`
  );

  //assign the paraeters to the websocket object
  extWs.id = searchParams.get("id");
  extWs.type = searchParams.get("type");
  extWs.isAlive = true;

  // if the connected device is the hardware, alert the dashboard that
  // the hardware is online
  if (extWs.type === "HARDWARE") alertDashboardOnConnect(extWs, wss);

  extWs.on("error", console.error);

  // when a pong is received, set the "isAlive" of the client to true
  extWs.on("pong", () => {
    extWs.isAlive = true;
  });

  extWs.on("message", (message) => {
    let messageObject: WsRequest;

    //parse the message received
    try {
      messageObject = JSON.parse(message.toString());
      if (!messageObject) throw new Error("Invalid message from sender");
      switch (messageObject.headers.type) {
        case "message":
          console.log("communication messsage gotten");
          handleIncomingMessage(messageObject, extWs, wss);
          break;

        case "checkstatus":
          console.log("status message gotten");
          returnHardWareStatus(messageObject, extWs, wss);
          break;

        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  });

  extWs.on("close", () => {
    //
    if (extWs.type === "HARDWARE") alertDashboardOnDisconnect(extWs, wss);
    console.log("A client disconnected!");
    clearInterval(interval);

    // client.terminate();
    // connectedClients = connectedClients.filter((item) => item !== client);

    //console.log("This is the client that disconnected", client);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// async function updateTankLevel(
//   tankMonitorId: string | null,
//   newTankLastLevel: Number
// ) {
//   try {
//     let res = await User.updateOne(
//       { "tankMonitor.tankMonitorId": tankMonitorId },
//       { $set: { "tankMonitor.tankLastLevel": newTankLastLevel } }
//     );
//     return res;
//   } catch (err) {
//     throw new Error();
//   }
// }

//functions
/*
notify the dashboard if the hardware is online and do same when the hardware goes offline
forward a message from the dashboard to hardware  and do same from hardware to dashboard
 */

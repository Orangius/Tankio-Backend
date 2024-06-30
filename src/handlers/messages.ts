import { WebSocketServer } from "ws";

export async function handleIncomingMessage(
  message: WsRequest,
  sender: ExtWebSocket,
  wss: WebSocketServer
) {
  const senderId = message.headers.senderId;
  const receiverType = message.headers.receiverType;
  const messageToForwardType = message.body?.type;
  const messageToForwardValue = message.body?.value;

  const receipient = Array.from(wss.clients).find((client) => {
    const extWs = client as ExtWebSocket;
    return extWs.id === senderId && extWs.type === receiverType;
  });

  const messageToReceiver: WsRequest = {
    headers: {
      type: "message",
      senderId: senderId,
      receiverType: receiverType,
    },
    body: {
      type: messageToForwardType,
      value: messageToForwardValue,
    },
  };

  receipient?.send(JSON.stringify(messageToReceiver));

  const response: WsResponse = {
    headers: {
      type: "acknowledgement",
      ok: true,
    },
  };

  sender.send(JSON.stringify(response));
}

// interface WsRequest {
//   headers: {
//     type: "message" | "checkstatus"; // checkStatus
//     senderId: string;
//     receiverType: string; //assuming its a message to the server
//   };
//   body?: {
//     message: string;
//   };
// }

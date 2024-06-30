declare global {
  interface WsRequest {
    headers: {
      type: "message" | "checkstatus"; // checkStatus
      senderId: string;
      receiverType: string; //assuming its a message to the server
    };
    body?: {
      type: "updatetanklevel" | "togglestate" | undefined;
      value: number | boolean | undefined;
    };
  }

  interface WsResponse {
    headers: {
      type: "acknowledgement" | "update";
      online?: boolean;
      ok?: boolean;
      message?: string;
      error?: string;
    };
  }
}

export {};

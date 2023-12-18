import { produce, enableMapSet } from "immer";
import { useEffect, useState, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import io, { Socket } from "socket.io-client";

enableMapSet();

function App() {
  /**
   * @type [Socket<DefaultEventsMap, DefaultEventsMap>,React.Dispatch<React.SetStateAction<Socket<DefaultEventsMap, DefaultEventsMap>>>]
   *
   */
  const [mySocket, setMySocket] = useState(null);
  const [roomIdToMessageMapping, setRoomIdToMessageMapping] = useState({});
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [message, setMessage] = useState("");

  const [username, setUsername] = useState("");

  const isPromtAlreadyShown = useRef(false);

  const [roomIdToTypingUsernameMapping, setRoomIdToTypingUsernameMapping] =
    useState({});
  const [
    roomIdUsernameToTypingTimerIndicatorTimeoutIdMapping,
    setRoomIdUsernameToTypingTimerIndicatorTimeoutIdMapping,
  ] = useState({});

  useEffect(() => {
    if (isPromtAlreadyShown.current === false) {
      isPromtAlreadyShown.current = true;
      while (true) {
        const validUsername = window.prompt("What is your username?");
        if (validUsername?.trim()) {
          setUsername(validUsername);
          break;
        }
      }
    }
    const socket = io("ws://localhost:3001", {
      transports: ["websocket"],
    });
    setMySocket(socket);

    socket.on("roomMessage", (data) => {
      setRoomIdToMessageMapping(
        produce((state) => {
          state[data.roomId] = state[data.roomId] || [];

          if (
            state[data.roomId].some((obj) => obj.messageId === data.messageId)
          ) {
            // do nothing since messsage is already present
          } else {
            state[data.roomId].push(data);
          }
        })
      );
    });

    socket.on("userTyping", (data) => {
      const { roomId, username } = data;

      setRoomIdToTypingUsernameMapping(
        produce((state) => {
          state[roomId] = state[roomId] || new Set();
          state[roomId].add(username);
        })
      );

      const timeoutId = setTimeout(() => {
        setRoomIdToTypingUsernameMapping(
          produce((state) => {
            state[roomId] = state[roomId] || new Set();
            state[roomId].delete(username);
          })
        );
      }, 5000);
      setRoomIdUsernameToTypingTimerIndicatorTimeoutIdMapping(
        produce((state) => {
          clearTimeout(state[roomId + "-" + username]);
          state[roomId + "-" + username] = timeoutId;
        })
      );
    });

    return () => {
      socket.close();
    };
  }, []);

  const joinRoomExclusively = (roomId) => {
    if (mySocket == null) return null;
    setActiveRoomId(roomId);
    mySocket.emit("joinRoomExclusively", roomId);
  };

  const sendTypingIndicator = () => {
    if (mySocket == null) return null;
    if (typeof activeRoomId !== "number") {
      alert("Not part of any room");
      return;
    }
    mySocket.emit("sendTypingIndicator", { roomId: activeRoomId, username });
  };

  const sendMessage = () => {
    if (mySocket == null) return null;
    if (typeof activeRoomId !== "number") {
      alert("Not part of any room");
      return;
    }
    mySocket.emit("sendMessage", { roomId: activeRoomId, message, username });
    setMessage("");
  };

  if (mySocket == null) return null;

  const messagesOfRoom = roomIdToMessageMapping[activeRoomId] || [];
  const typingUsersInTheRoom =
    roomIdToTypingUsernameMapping[activeRoomId] != null
      ? [...roomIdToTypingUsernameMapping[activeRoomId]]
      : [];

  return (
    <div className="grid grid-cols-12 divide-x divide-gray-300 ">
      <aside className="col-span-3 h-screen overflow-y-auto">
        {Array(50)
          .fill(0)
          .map((_, i) => {
            return (
              <div
                className={
                  "p-2 cursor-pointer " +
                  (activeRoomId === i + 1
                    ? "bg-black text-white"
                    : "hover:bg-gray-200")
                }
                key={i}
                onClick={() => {
                  joinRoomExclusively(i + 1);
                }}
              >
                Room #{i + 1}
              </div>
            );
          })}
      </aside>
      <main className="col-span-9 px-8 h-screen overflow-y-auto flex flex-col">
        <h2>Your username: {username}</h2>
        {typingUsersInTheRoom.length > 0 ? (
          <p>Typing users: {typingUsersInTheRoom.join(", ")}</p>
        ) : null}
        {messagesOfRoom.map((data, index) => {
          return (
            <div key={index} className="w-full px-4 py-4">
              <b>Sent by {data.username}</b>
              <p>{data.message}</p>
            </div>
          );
        })}
        <div className="flex-grow"></div>
        <div className="mb-8 flex justify-center items-center gap-2">
          <textarea
            id="textarea"
            name="textarea"
            rows="2"
            className="mb-8 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 flex-grow"
            value={message}
            onChange={(e) => {
              sendTypingIndicator();
              setMessage(e.target.value);
            }}
          ></textarea>
          <button
            type="button"
            className="flex-shrink-0 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={sendMessage}
          >
            Send Message
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;

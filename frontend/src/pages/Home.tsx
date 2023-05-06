import {
  Chat,
  LoadingIndicator,
  ChannelList,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  ChannelListMessengerProps,
  useChatContext,
} from "stream-chat-react";

import { useLoggedInAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import Queue from "./objects/Queue";
import PowerHourAppBar from "./objects/PowerHourAppBar";
import StatisticCards from "./objects/StatisticCards";

interface Data {
  name: string,
  timestamp: string,
  questionType: string,
  question: string,
  InPersonOnline: string,
  OpenToCollaboration: boolean,
  Editable: boolean
}

function createData(
  name: string,
  timestamp: string,
  questionType: string,
  question: string,
  InPersonOnline: string,
  OpenToCollaboration: boolean,
  Editable: boolean
) : Data {
  return { name, timestamp, questionType, question, InPersonOnline, OpenToCollaboration, Editable };
}

const rowDataTemp = [
  createData('Amanda Ha', "2:55:30", "Conceptual", "Question 5 b", "In Person", true, false),
  createData('Andrea Ha', "2:45:30", "Debugging",  "Question 5 b", "In Person", true, false),
  createData('Wen Qiu', "2:35:20", "Debugging", "Question 5 b", "In Person", true, true),
  createData('Sonia Fereidooni', "2:34:10", "Debugging", "Question 6", "Online", false, false),
  createData('Kevin Feng', "2:25:30", "Debugging",  "Question 5 b", "In Person", true, false),
];

const currentUser = "Wen Qiu"
const isCurrentUser = (row: Data) => row.name == currentUser;


export function Home() {
  const {user, streamChat} = useLoggedInAuth();
  if (streamChat == null) return <LoadingIndicator />;
  return (
  <div>
    <PowerHourAppBar/>
    <div className="flex">
      <div className="w-2/3 m-10">
        <StatisticCards waitTime={rowDataTemp.findIndex(isCurrentUser)*13} studentsAhead={rowDataTemp.findIndex(isCurrentUser)} activeSessions={3}/>
        <div className="mt-10">
          <Queue rowData={rowDataTemp}/>
        </div>
      </div>
      <div className="w-1/3">
        <Chat client={streamChat}>
          <ChannelList
            List={Channels}
            sendChannelsToList
            filters={{members: {$in: [user.id]}}} 
          />
          <Channel>
            <Window>
              <ChannelHeader/>
              <MessageList />
              <MessageInput />
            </Window>
          </Channel>
        </Chat>
      </div>
    </div>
  </div>
  )
}

function Channels({ loadedChannels }: ChannelListMessengerProps) {
  // provide info about chat
  const {setActiveChannel, channel: activeChannel} = useChatContext();
  const navigate = useNavigate();
  const { logout } = useLoggedInAuth();
  return (
    <div className="flex flex-col gap-4 m-3 h-full">
      <Button onClick={() => {navigate("/channel/new")}}>New Conversation</Button>
      <hr className="border-gray-500"/>
      {loadedChannels != null && loadedChannels.length > 0
        ? loadedChannels.map(channel => {
          const isActive = channel === activeChannel;
          const extraClasses = isActive
            ? "bg-blue-500 text-white"
            : "hover:blue-100 bg-gray-100";
          return <button
            onClick={() => {setActiveChannel(channel);}}
            disabled={isActive}
            className={`p-4 rounded-lg flex gap-3 items-center ${extraClasses}`}
            key={channel.id}
            >
              {channel.data?.image
                && <img src={channel.data.image} className="w-10 h-10 rounded-full object-center object-cover"/>}
              <div className="text-elipsis overflow-hidden whitespace-nowrap">
                {channel.data?.name || channel.id}
              </div>
            </button>
        })
        : "No conversations"}
        <hr className="border-gray-500 mt-auto"/>
        <Button onClick={() => logout.mutate()} disabled={logout.isLoading}>Logout</Button>
    </div>
  )
}
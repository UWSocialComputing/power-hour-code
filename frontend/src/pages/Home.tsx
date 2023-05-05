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
  CustomStyles,
  ChannelHeaderProps,
  useTranslationContext,
  useChannelPreviewInfo,
  useChannelStateContext
} from "stream-chat-react";

import { useAuth, useLoggedInAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function Home() {
  const {user, streamChat} = useLoggedInAuth();
  const [hideChat, setHideChat] = useState(true);
  if (streamChat == null) return <LoadingIndicator />;
  return <div className="flex">
    <div className="w-2/3">
      Queue
    </div>
    <div className="w-1/3">
      <Chat client={streamChat}>
          <ChannelList
            List={Channels}
            sendChannelsToList
            filters={{members: {$in: [user.id]}}} />
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
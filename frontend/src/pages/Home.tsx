import {
  Chat,
  LoadingIndicator,
  ChannelList,
  Channel,
  Window,
  MessageList,
  MessageInput,
  ChannelListMessengerProps,
  useChatContext,
  ChannelHeaderProps,
  useChannelPreviewInfo,
  useChannelStateContext,
  useTranslationContext,
} from "stream-chat-react";
import { useLoggedInAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Queue from "./objects/Queue";
import PowerHourAppBar from "./objects/PowerHourAppBar";
import StatisticCards from "./objects/StatisticCards";
import { ArrowBack, Add } from "@mui/icons-material";
import { useContext, useState } from "react";
import { ShowChatContext } from "../context/ShowChatContext";

interface Data {
  name: string,
  timestamp: string,
  questionType: string,
  question: string,
  InPersonOnline: string,
  status: string,
  OpenToCollaboration: boolean,
  Editable: boolean
}

function createData(
  name: string,
  timestamp: string,
  questionType: string,
  question: string,
  InPersonOnline: string,
  status: string,
  OpenToCollaboration: boolean,
  Editable: boolean
) : Data {
  return { name, timestamp, questionType, question, InPersonOnline, status, OpenToCollaboration, Editable };
}

const rowDataTemp = [
  createData('Kevin Feng', "2:25:30", "Debugging",  "Question 5 b", "In Person", "Being helped", true, false),
  createData('Amanda Ha', "2:34:30", "Conceptual", "Question 5 b", "In Person", "Waiting", true, false),
  createData('Andrea Ha', "2:35:30", "Debugging",  "Question 5 b", "In Person", "Waiting", true, false),
  createData('Wen Qiu', "2:36:20", "Debugging", "Question 5 b", "In Person", "Waiting", true, true),
  createData('Sonia Fereidooni', "2:38:10", "Debugging", "Question 6", "Online", "Waiting", false, false),
];

const currentUser = "Wen Qiu"
const isCurrentUser = (row: Data) => row.name == currentUser;

export function Home() {
  const {user, streamChat} = useLoggedInAuth();
  const [showChat, setShowChat] = useState(false);
  if (streamChat == null) return <LoadingIndicator />;
  return (
  <div className="h-full">
    <PowerHourAppBar/>
    <div className="flex h-full">
      <div className="w-2/3 m-10">
        <StatisticCards waitTime={rowDataTemp.findIndex(isCurrentUser)*10} studentsAhead={rowDataTemp.findIndex(isCurrentUser)} activeSessions={1}/>
        <div className="mt-10">
          <Queue rowData={rowDataTemp}/>
        </div>
      </div>
      <ShowChatContext.Provider value={() => setShowChat(!showChat)}>
        <div className="w-1/3 h-full mt-3">
          <Chat client={streamChat}>
            <div className={showChat ? "hidden" : ""}>
              <ChannelList
                List={Channels}
                sendChannelsToList
                filters={{members: {$in: [user.id]}}}
              />
            </div>
            <div className={!showChat ? "hidden" : ""}>
              <Channel>
                <Window>
                  <CustomChannelHeader/>
                  <MessageList />
                  <MessageInput />
                </Window>
              </Channel>
            </div>
          </Chat>
        </div>
      </ShowChatContext.Provider>
    </div>
  </div>
  )
}

function Channels({ loadedChannels }: ChannelListMessengerProps) {
  // provide info about chat
  const {setActiveChannel, channel: activeChannel} = useChatContext();
  const navigate = useNavigate();
  const toggleChatHandler = useContext(ShowChatContext);
  return (
    <div className="flex flex-col gap-1 h-full">
      <div className="flex justify-between str-chat__header-livestream str-chat__channel-header">
        <h1 className="font-semibold">Collaboration Sessions</h1>
        <button onClick={() => {navigate("/channel/new")}}>
          <Add />
        </button>
      </div>
      <div className="m-5">
      {loadedChannels != null && loadedChannels.length > 0
        ? loadedChannels.map(channel => {
          const isActive = channel === activeChannel;
          const extraClasses = isActive
            ? "bg-blue-500 text-white"
            : "hover:blue-100 bg-gray-100";
          return <button
            onClick={() => {
              setActiveChannel(channel);
              toggleChatHandler();
            }}
            className={`p-4 rounded-lg flex gap-2 items-center w-full mb-3 ${extraClasses}`}
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
      </div>
    </div>
  )
}

function CustomChannelHeader(props: ChannelHeaderProps) {
  const {image: overrideImage, live, title: overrideTitle} = props;
  const { channel, watcher_count } = useChannelStateContext('ChannelHeader');
  const { t } = useTranslationContext('ChannelHeader');
  const { displayTitle } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });
  const { member_count, subtitle } = channel?.data || {};
  const toggleChatHandler = useContext(ShowChatContext);
  return (
    <div className='str-chat__header-livestream str-chat__channel-header'>
      <button aria-label='Back' className="mr-5" onClick={toggleChatHandler}>
        <ArrowBack />
      </button>
      <div className='str-chat__header-livestream-left str-chat__channel-header-end'>
        <p className='str-chat__header-livestream-left--title str-chat__channel-header-title'>
          {displayTitle}{' '}
          {live && (
            <span className='str-chat__header-livestream-left--livelabel'>{t<string>('live')}</span>
          )}
        </p>
        {subtitle && <p className='str-chat__header-livestream-left--subtitle'>{subtitle}</p>}
        <p className='str-chat__header-livestream-left--members str-chat__channel-header-info'>
          {!live && !!member_count && member_count > 0 && (
            <>
              {t('{{ memberCount }} members', {
                memberCount: member_count,
              })}
              ,{' '}
            </>
          )}
          {t<string>('{{ watcherCount }} online', { watcherCount: watcher_count })}
        </p>
      </div>
    </div>
  );
}
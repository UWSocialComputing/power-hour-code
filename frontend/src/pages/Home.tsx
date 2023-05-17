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
  getLatestMessagePreview,
} from "stream-chat-react";
import * as React from 'react';
import { useLoggedInAuth } from "../context/AuthContext";
import QueueTable from "./objects/QueueTable";
import PowerHourAppBar from "./objects/PowerHourAppBar";
import StatisticCards from "./objects/StatisticCards";
import { ArrowBack, Add, People } from "@mui/icons-material";
import { useContext, useState } from "react";
import { ShowChatContext } from "../context/ShowChatContext";
import { CreateChatView } from "./objects/CreateChatView";
import Button from "@mui/material/Button";
import QueueForm from './objects/QueueForm';
import { Card, CardContent } from "@mui/material";


function createData(
  id: string,
  name: string,
  timestamp: string,
  questionType: string,
  question: string,
  InPersonOnline: string,
  status: string,
  openToCollaboration: boolean,
) {
  return { id, name, timestamp, questionType, question, InPersonOnline, status, openToCollaboration };
}

const rows = [
  createData('andrea','Andrea Ha', "2:35:30", "Debugging",  "Question 5", "In Person", "In Progress", true),
  createData('luckyqxw', 'luckyqxw', "2:36:10", "Debugging", "Question 6", "Online", "Waiting", false),
  createData('kevin', 'Kevin Feng', "2:37:20", "Debugging", "Question 6", "Online", "Waiting", true),
  createData('wenq','Wen Qiu', "2:38:20", "Debugging", "Question 5", "In Person", "Waiting", true),
];


const currentUser = "Wen Qiu"
const isCurrentUser = (row: any) => row.name == currentUser;

export function Home() {
  const {user, streamChat} = useLoggedInAuth();
  // channels: channel list, chat: chat view, new: create chat view
  const [showChat, setShowChat] = useState("channels");

  const [showForm, setShowForm] = React.useState(false);
  const [isJoined, setIsJoined] = React.useState(false);
  const [members, setMembers] = React.useState<string[]>([]);

  if (streamChat == null) return <LoadingIndicator />;
  return (
  <div className="h-screen">
    <PowerHourAppBar/>
    <div className="flex h-full">
      <div className="w-2/3 mt-3 ml-5 mr-3">
        <StatisticCards
          waitTime={rows.findIndex(isCurrentUser)*10}
          studentsAhead={rows.findIndex(isCurrentUser)}
          activeSessions={1}
        />
        <Button
          disableElevation
          onClick={() => setShowForm(true)}
          variant={isJoined? "outlined" : "contained"}>
          {isJoined? "Edit Information" : "Join Queue"}
        </Button>
        <QueueTable
          showChat={showChat} setShowChat={setShowChat}
          isJoined={isJoined} setIsJoined={setIsJoined}
          members={members} setMembers={setMembers}
          rows={rows}
        />
        <QueueForm
          isJoined={isJoined} setIsJoined={setIsJoined}
          showForm={showForm} setShowForm={setShowForm}
        />
      </div>
      <div className="w-1/3 mt-3 mr-5">
        <ShowChatContext.Provider value={(view) => setShowChat(view)}>
          <>
            <Chat client={streamChat}>
              <div className={showChat === "new" ? "" : "hidden"}>
                <CreateChatView members={members} setMembers={setMembers} />
              </div>
              <div className={showChat === "channels" ? "" : "hidden"}>
                <ChannelList
                  List={Channels}
                  sendChannelsToList
                  filters={{members: {$in: [user.id]}}}
                />
              </div>
              <div className={showChat === "chat" ? "" : "hidden"}>
                <Channel>
                  <Window>
                    <CustomChannelHeader/>
                    <MessageList />
                    <MessageInput />
                  </Window>
                </Channel>
              </div>
            </Chat>
          </>
        </ShowChatContext.Provider>
      </div>
    </div>
  </div>
  )
}

function Channels({ loadedChannels }: ChannelListMessengerProps) {
  // provide info about chat
  const {setActiveChannel, channel: activeChannel} = useChatContext();
  const toggleChatHandler = useContext(ShowChatContext);
  const { t, userLanguage } = useTranslationContext('ChannelPreview');
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between str-chat__header-livestream str-chat__channel-header">
        <h1 className="font-semibold text-lg">Collaboration Sessions</h1>
        <button onClick={() => {toggleChatHandler("new")}}>
          <Add />
        </button>
      </div>
      <div className="pl-10 pr-10 pt-8 light-blue-bg h-full rounded-bottom-corner scroll-on-overflow" >
      {loadedChannels != null && loadedChannels.length > 0
        ? loadedChannels.map(channel => {
          const isActive = channel === activeChannel;
          const extraClasses = isActive
            ? "bg-blue-500 text-white dark-blue-bg"
            : "hover:blue-100 bg-gray-200";
          const messagePrefix = channel.state.messages.length > 0 ? channel.state.messages[channel.state.messages.length - 1].user!.name : "";
          const messagePreview = getLatestMessagePreview(channel, t, userLanguage);
          return <button
            onClick={() => {
              setActiveChannel(channel);
              toggleChatHandler("chat");
            }}
            className={`p-4 rounded-lg gap-2 mb-3 text-left w-full ${extraClasses}`}
            key={channel.id}
            >
              <div>
                <div className="text-elipsis font-semibold overflow-hidden whitespace-nowrap">
                  {channel.data?.name || channel.id}
                </div>
                <div className="preview flex gap-1 text-sm overflow-hidden text-elipsis whitespace-nowrap">
                  {messagePrefix}{messagePrefix && ": "}{messagePreview}
                </div>
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
  const [memberListOpen, setMemberListOpen] = React.useState(false);

  const toggleMemberList = (open: boolean) => {
    setMemberListOpen(open);
  };

  return (
    <div className='str-chat__header-livestream str-chat__channel-header'>
      <button aria-label='Back' className="mr-5" onClick={() => {
        toggleMemberList(false);
        toggleChatHandler("channels");
      }}>
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
                memberCount: member_count - 1, // remove OH bot from count
              })}
              ,{' '}
            </>
          )}
          {t<string>('{{ watcherCount }} online', { watcherCount: watcher_count })}
        </p>
      </div>
      <button onClick={() => toggleMemberList(!memberListOpen)}>
        <People />
      </button>
      <Card className={memberListOpen ? "member-info" : "hidden"}>
        <CardContent>
          <MemberList />
        </CardContent>
      </Card>
    </div>
  );
}

const MemberList = () => {
  const { channel } = useChannelStateContext();
  const [channelUsers, setChannelUsers] = useState<Array<{ name: string; online: boolean }>>([]);

  React.useEffect(() => {
    const updateChannelUsers = () => {
      setChannelUsers(
        Object.values(channel.state.members).map((user) => ({
          name: user.user!.name! ? user.user!.name! : user.user_id!,
          online: !!user.user!.online,
        })),
      );
    };
    updateChannelUsers();
  }, [channel]);
  return (
    <ul className='users-list'>
      {channelUsers.filter((member) => {return member.name !== "OH Bot"}).map((member) => (
        <li key={member.name}>
          {member.name} - {member.online ? 'active' : 'inactive'}
        </li>
      ))}
    </ul>
  );
};
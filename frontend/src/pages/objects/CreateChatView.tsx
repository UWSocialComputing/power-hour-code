import { FormEvent, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoggedInAuth } from "../../context/AuthContext";
import { ShowChatContext } from "../../context/ShowChatContext";
import { ArrowBack } from "@mui/icons-material";
import { FormControl, TextField, Button, InputLabel, Select, SelectChangeEvent, MenuItem, Stack } from "@mui/material";

export function CreateChatView(props: any) {
  const { streamChat, user, sendBotMessage} = useLoggedInAuth();
  const [sessionName, setSessionName] = useState<string>("");
  const toggleChatHandler = useContext(ShowChatContext);
  const [isMissingFields, setIsMissingFields] = useState(true);
  const [newChannelId, setNewChannelId] = useState<string>("");


  useEffect(() => {
    setIsMissingFields(sessionName === "" || props.members.length === 0)
  }, [sessionName, props.members]);


  // useMutation when a call to server will change the state
  const createChannel = useMutation({
    mutationFn: ({name, memberIds}:
      {name: string, memberIds: string[]}) => {
        if (streamChat == null) throw Error("Not connected");
        const newId = crypto.randomUUID();
        setNewChannelId(newId);
        return streamChat.channel("messaging",
          newId,
          {name, members: [user.id, "bot", ...memberIds]} // include OH bot as member automatically
        ).create();
    },
    async onSuccess() {
      setSessionName("");
      props.setMembers([]);
      // send bot message on collaboration policy
      sendBotMessage.mutate(newChannelId);
      setNewChannelId("");
      toggleChatHandler("channels");
    }
  });

  // useQuery when a call is just querying data
  const users = useQuery({
    queryKey: ["stream", "users"],
    queryFn: () =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      streamChat!.queryUsers({id: {$ne: user.id}}, {name: 1}),
    enabled: streamChat != null,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = sessionName;
    const selectOptions = props.members;
    if (name == null || name === "" || selectOptions == null || selectOptions.length === 0) {
      return;
    }

    // Create a channel with the given info
    createChannel.mutate({
      name,
      memberIds: props.members
    });
  }

  const handleSelectChange = (event: SelectChangeEvent<typeof members>) => {
    const {
      target: {value},
    } = event;
    props.setMembers(
      typeof value === 'string' ? value.split(',') : value
    );
  };

  return <div className="str-chat">
      <div className='str-chat__header-livestream'>
        <button aria-label='Back' className="mr-5" onClick={() => {toggleChatHandler("channels"); props.setMembers([]); setSessionName("")}}>
          <ArrowBack />
        </button>
        <h1 className="font-semibold text-lg">New Session</h1>
      </div>
      <div className="pl-10 pr-10 pt-8 light-blue-bg h-full rounded-bottom-corner" >
        <Stack spacing={2}>
          <TextField
            InputProps={{ disableUnderline: true }}
            required
            label="Session name"
            variant="filled"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
          <FormControl size="small" variant="filled">
            <InputLabel id="members">Members</InputLabel>
            <Select
              value={props.members} labelId="members" required multiple
              onChange={handleSelectChange}
            >
              {
                users.data?.users
                  .filter((user) => {return user.id !== "bot"})
                  .map(user => {
                  return <MenuItem
                    key={user.id}
                    value={user.id}
                    >
                      {user.name ? user.name : user.id}
                    </MenuItem>
                })
              }
            </Select>
          </FormControl>
          <Stack justifyContent="end" direction="row">
            <Button disableElevation
              size="small"
              variant={isMissingFields ? "disabled": "contained"}
              onClick={handleSubmit}>
              {createChannel.isLoading ? "Loading..." : "Create Session"}
            </Button>
          </Stack>
        </Stack>
      </div>
   </div>
}
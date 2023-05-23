import { FormEvent, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoggedInAuth } from "../../context/AuthContext";
import { CustomChatContext } from "../../context/CustomChatContext";
import { ArrowBack } from "@mui/icons-material";
import { FormControl, Button, InputLabel, Select, SelectChangeEvent, MenuItem, Stack, FormHelperText, Checkbox } from "@mui/material";

export function EditChatView(props: any) {
  const { streamChat, user} = useLoggedInAuth();
  const [isMissingFields, setIsMissingFields] = useState(true);
  const [members, setMembers] = useState<string[]>([]);
  const toggleChatHandler = useContext(CustomChatContext)["toggleChatHandler"];

  // useMutation when a call to server will change the state
  const addMemberToChannel = useMutation({
    mutationFn: (newMemberIds: string[]) => {
        if (props.activeChannel == null) throw Error("Invalid channel");
        return props.activeChannel.addMembers(newMemberIds);
    },
    async onSuccess() {
      setMembers([]);
      toggleChatHandler("chat");
    }
  });

  useEffect(() => {
    setIsMissingFields(members.length === 0);
  }, [members]);

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
    const selectOptions = members;
    if (selectOptions == null || selectOptions.length === 0) {
      return;
    }

    // Add the new selected members to the channel
    addMemberToChannel.mutate(members);
  }

  const handleSelectChange = (event: SelectChangeEvent<typeof members>) => {
    const {
      target: {value},
    } = event;
    setMembers(
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const isNewUser = (userId: string) => {
    if (props.activeChannel) {
      if (props.activeChannel.state.members[userId]) {
        return false;
      }
    }
    return true;
  };

  return <div className="str-chat">
      <div className='str-chat__header-livestream'>
        <button aria-label='Back' className="mr-5" onClick={() => {toggleChatHandler("chat");}}>
          <ArrowBack />
        </button>
        <h1 className="font-semibold text-lg">Add Members to Session</h1>
      </div>
      <div className="pl-10 pr-10 pt-8 light-blue-bg h-full rounded-bottom-corner" >
        <Stack spacing={2}>
          <FormControl size="small" variant="filled">
            <InputLabel id="members">Select New Members</InputLabel>
            <Select
              value={members}
              labelId="members"
              required
              multiple
              onChange={handleSelectChange}
              renderValue={(selected) => selected.join(', ')}
            >
              {
                users.data?.users
                  .filter((user) => {return isNewUser(user.id)})
                  .map(user => {
                  return <MenuItem
                    key={user.id}
                    value={user.id}
                    >
                      <Checkbox checked={members.indexOf(user.id) > -1} />
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
              {addMemberToChannel.isLoading ? "Loading..." : "Add Members to Session"}
            </Button>
          </Stack>
        </Stack>
      </div>
   </div>
}
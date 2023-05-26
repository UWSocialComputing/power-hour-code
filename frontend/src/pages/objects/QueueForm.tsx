import * as React from 'react';
import { useLoggedInAuth } from "../../context/AuthContext";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';


export default function QueueForm(props: any) {
  const { user, joinQueue, modifyRequest } = useLoggedInAuth();
  const questionTypesArr = ["conceptual", "debugging", "question wording"]

  const [questionType, setQuestionType] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [inPersonOnline, setInPersonOnline] = React.useState("In Person");
  const [openToCollaboration, setOpenToCollaboration] = React.useState(true);
  const [isMissingFields, setIsMissingFields] = React.useState(true);

  React.useEffect(() => {
    setIsMissingFields(questionType === "" || question === "")
  }, [questionType, question, inPersonOnline, openToCollaboration]);

  const clearFormValues = () => {
    setQuestionType("");
    setQuestion("");
    setInPersonOnline("In Person");
    setOpenToCollaboration(true);
    setIsMissingFields(true);
  };

  const handleCancel = () => {
    props.setShowForm(false);
    clearFormValues();
  };

  const handleJoin = () => {
    if (!isMissingFields) {
      joinQueue.mutate({
        inPersonOnline: inPersonOnline,
        id: user.id,
        name: user.name,
        openToCollaboration: openToCollaboration,
        question: question,
        questionType: questionType
      });
      props.setShowForm(false);
      props.setIsJoined(true);
    }
  };

  const handleEdit = () => {
    if (!isMissingFields) {
      modifyRequest.mutate({
        inPersonOnline: inPersonOnline,
        id: user.id,
        name: user.name,
        openToCollaboration: openToCollaboration,
        question: question,
        questionType: questionType
      });
      props.setShowForm(false);
    }
  };

  return (
    <>
      <Modal
        open={props.showForm}
        onClose={() => props.setShowForm(false)}
      >
        <Box className="bg-white w-1/3 p-7 rounded-md translate-y-1/3 translate-x-1/2">
           <Stack spacing={2}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Your Information
            </Typography>

            <FormControl size="small" variant="filled">
              <InputLabel required id="select-question-type-label">
                What type of question do you have?
              </InputLabel>
              <Select
                labelId="select-question-type-label"
                value={questionType}
                label="Question Type"
                disableUnderline
                onChange={(e:any) => setQuestionType(e.target.value)}
              >
              {questionTypesArr.map((questionType, index) => {
                return (
                  <MenuItem key={index} value={questionType}>
                    {questionType}
                  </MenuItem>
                )
              })
              }
              </Select>
            </FormControl>

            <TextField
              InputProps={{ disableUnderline: true }}
              required
              label="What are you working on?"
              multiline
              rows="2"
              variant="filled"
              value={question}
              onChange={(e:any) => setQuestion(e.target.value)}
            />

            <Typography variant="subtitle1">
              Are you currently online or in-person?
            </Typography>

            <Stack direction="row" spacing={1}>
              <Chip
                variant={inPersonOnline === "In Person" ? "filled": "outlined"}
                label="In Person"
                color="primary"
                onClick={() => setInPersonOnline("In Person")}
              />
              <Chip
                variant={inPersonOnline === "Online" ? "filled": "outlined"}
                label="Online"
                color="primary"
                onClick={() => setInPersonOnline("Online")}
              />
            </Stack>

            <Typography variant="subtitle1">
              Are you open to collaborate?
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                variant={openToCollaboration ? "filled": "outlined"}
                label="Yes"
                color="primary"
                onClick={() => setOpenToCollaboration(true)}
              />
              <Chip
                variant={!openToCollaboration ? "filled": "outlined"}
                label="No"
                color="primary"
                onClick={() => setOpenToCollaboration(false)}
              />
            </Stack>
            <Typography variant="caption">
              As a reminder, review the collaboration policy for your class for acceptable form of collaboration.
            </Typography>

            <Stack justifyContent="end" direction="row" spacing={1}>
             {props.isJoined ?
                <Button
                  disableElevation
                  size="small"
                  variant={isMissingFields? "disabled": "contained"}
                  onClick={handleEdit}
                >
                  Edit
                </Button> :

                <Button
                  disableElevation
                  size="small"
                  variant={isMissingFields? "disabled": "contained"}
                  onClick={handleJoin}
                >
                  Join
                </Button>
              }
              <Button
                disableElevation
                size="small"
                variant='outlined'
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </>
  );
}
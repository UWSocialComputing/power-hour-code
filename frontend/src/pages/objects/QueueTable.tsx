import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal'

const currentUser = "Wen Qiu"

export default function QueueTable(props:any) {
  const [showLeaveModal, setShowLeaveModal] = React.useState(false);

  const handleLeaveQueue = () => {
    setShowLeaveModal(false);
    props.setIsJoined(false);
    console.log("delete")
  }

  const handleCollaborate = (collaboratorId: any) => {
    let collaboratorsList = [...props.collaborators, collaboratorId];
    collaboratorsList = collaboratorsList.filter((value, index, array) => array.indexOf(value) === index);
    props.setCollaborators(collaboratorsList)
    props.setShowChat("new")
  }

  return (
    <>
    <TableContainer component={Paper} className="h-4/6 mt-2 scroll-on-overflow">
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead className="sticky top-0 z-50 bg-gray-100">
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Timestamp</TableCell>
            <TableCell>Question Type</TableCell>
            <TableCell>Question</TableCell>
            <TableCell>In Person/Online</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Collaborate</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.rows.map((row: any) => (
            <TableRow
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell>{row.timestamp}</TableCell>
              <TableCell>{row.questionType}</TableCell>
              <TableCell>{row.question}</TableCell>
              <TableCell>{row.InPersonOnline}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>
                <Button 
                  disableElevation
                  onClick={() => handleCollaborate(row.id)}
                  size="small"
                  variant={row.openToCollaboration ? "contained" : "disabled"}>
                  Collaborate
                </Button>
              </TableCell>
              <TableCell align="right"> 
                {row.name == currentUser ?
                  <IconButton onClick={()=> setShowLeaveModal(true)} color="primary" component="label">
                    <RemoveCircleIcon fontSize="small" color="error"/>
                  </IconButton>:
                  <></>
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    <Modal
      open={showLeaveModal}
      onClose={() => setShowLeaveModal(false)}
    >
      <Box className="bg-white w-1/3 p-7 rounded-md translate-y-3/4 translate-x-1/2">
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Leave queue
          </Typography>
          <Typography variant="body1" component="h2">
            Are you sure you want to leave the queue?
          </Typography>
          <Stack justifyContent="end" direction="row" spacing={1}>
            <Button
              disableElevation
              size="small"
              variant="contained"
              onClick={handleLeaveQueue}>
              Leave
            </Button>
            <Button 
              disableElevation size="small"
              variant='outlined'
              onClick={()=> setShowLeaveModal(false)}
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
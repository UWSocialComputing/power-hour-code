import * as React from 'react';
import { useLoggedInAuth } from "../../context/AuthContext";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal'
import CircleIcon from '@mui/icons-material/Circle';

export default function QueueTable(props:any) {
  const { user, leaveQueue } = useLoggedInAuth();

  const [showLeaveModal, setShowLeaveModal] = React.useState(false);
  
  const handleLeaveQueue = () => {
    leaveQueue.mutate(user.id);
    setShowLeaveModal(false);
    props.setIsJoined(false);
  }

  const handleCollaborate = (memberId: any) => {

    let membersList = props.members.indexOf(memberId) > -1 ? 
      props.members.filter((value: any) => value !== memberId):
      [...props.members, memberId]

    props.setMembers(membersList);
    props.setShowChat("new");
  }

  return (
    <>
    <TableContainer component={Box} className="h-[62vh] mt-2 scroll-on-overflow rounded outline outline-gray-100">
      <Table className="table-auto w-full text-sm" sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead className="sticky top-0 z-50 bg-gray-100">
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Timestamp</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Question Type</TableCell>
            <TableCell>Question</TableCell>
            <TableCell>In Person/Online</TableCell>
            <TableCell>Open to Collaboration</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.rows.map((row: any) => (
            <TableRow
              className={row.id == user.id ? "bg-[#eff8ff]": ""}
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell>{row.timestamp}</TableCell>
              <TableCell>
                <Typography
                  noWrap
                  variant="caption"
                  display="block"
                  className={row.status == "Waiting"? "text-amber-600" : "In Progress" ? "text-indigo-500" : "Done" ? "text-emerald-400" : "" }>
                  <CircleIcon className="mr-2 mb-0.5" sx={{width: "10px", height: "10px"}}/>
                  {row.status}
                </Typography>
              </TableCell>
              <TableCell>{row.questionType}</TableCell>
              <TableCell>{row.question}</TableCell>
              <TableCell>{row.inPersonOnline}</TableCell>
              <TableCell>
                <Button
                  color="success"
                  disabled={row.id == user.id || !row.openToCollaboration}
                  onClick={() => handleCollaborate(row.id)}
                  size="small"
                  variant={row.id == user.id || props.members.includes(row.id)? "outlined" : "contained" }>
                  {row.openToCollaboration? "Collaborate" : "Independent"}
                </Button>
              </TableCell>
              <TableCell align="right">
                {row.id == user.id ?
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
import {useState, useEffect} from "react";
import {
  Button,
  IconButton,
  Typography,
  Toolbar,
  Box,
  AppBar,
  Menu,
  MenuItem,
  ListItemText,
  Stack,
  Badge
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ClearIcon from '@mui/icons-material/Clear';
import { useLoggedInAuth } from "../../context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { socket } from "../../socket.js";


export default function PowerHourAppBar() {
  const { user, logout } = useLoggedInAuth();
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const openNotifications = Boolean(anchorElNotifications);
  const [notificationData, setNotificationData] = useState([]);

  const getNotificationData = useMutation({
    mutationFn: () => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/get-notifications`, {"id": user.id})
        .then(res => {
          // token for validation, user object for info display
          return res.data;
        });
    },
    onSuccess(data) {
      setNotificationData(data);
    }
  });

  useEffect(() => {
    getNotificationData.mutate();
  }, []);

  useEffect(() => {
    function onNotification(value: any) {
      console.log(value);
      setNotificationData(value)
    }
    socket.on('notification', onNotification);

    return () => {
      socket.off('notification', onNotification);
    };
  }, []);


  const deleteNotification = useMutation({
    mutationFn: (id: string) => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/delete-notification`, {"user-id": user.id, "notif-id": id})
        .then(res => {
          // token for validation, user object for info display
          return res.data;
        });
    },
    onSuccess(data) {
      setNotificationData(data);
    }
  });

  const handleDeleteNotif = (notifId: string) => {
    deleteNotification.mutate(notifId);
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar elevation={0} position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Power Hour
          </Typography>
          <IconButton size="large" onClick={(e: any) => setAnchorElNotifications(e.currentTarget)}>
            <Badge badgeContent={notificationData.length} color="error">
              <NotificationsIcon className="text-white"/>
            </Badge>
          </IconButton>
          <Button
            className="logout-btn"
            variant="text"
            onClick={() => logout.mutate()}
            disabled={logout.isLoading}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorElNotifications}
        open={openNotifications}
        onClose={() => {setAnchorElNotifications(null)}}
        PaperProps={{style: { maxHeight: 250, width: '42ch'}}}
      >
        <Typography m={1} ml={2}>
          Notifications
        </Typography>

       {notificationData === null ? // data from fetch has not loaded
        <></> :
        Array.isArray(notificationData) && notificationData.length === 0 ?
        <Typography m={1} ml={2} variant="body2">
          No notifications
        </Typography> :
          notificationData.map((notif: any, index: number) => {
            return (
              <MenuItem
                key={index}
                className="list-item"
                sx={{whiteSpace: 'normal', backgroundColor: '#fafafa'}}
              >
                <ListItemText>
                  <Stack sx={{display: 'flex', alignItems: 'center'}} direction="row" justifyContent="space-between" m={0.5}>
                    <Typography>
                      <b>{notif.initiator}</b> added you to new collaboration session <em>{notif.channelName}</em>
                    </Typography>
                    <IconButton onClick={() => handleDeleteNotif(notif.id)}>
                      <ClearIcon fontSize="small"/>
                    </IconButton>
                  </Stack>
                </ListItemText>
              </MenuItem>
            )
          })
        }
      </Menu>
    </Box>
  );
}

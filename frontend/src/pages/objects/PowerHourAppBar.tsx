import * as React from "react";
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

export default function PowerHourAppBar() {
  const { logout } = useLoggedInAuth();
  const [anchorElNotifications, setAnchorElNotifications] = React.useState(null);
  const openNotifications = Boolean(anchorElNotifications);
  let notificationData = [
      {newSession: {
          senderName: "Andrea Ha"
        }
      },
      {newSession: {
          senderName: "luckyqxw"
        },
      },
      {newSession: {
          senderName: "Kevin Feng"
        },
      },
      {newSession: {
          senderName: "Wen Qiu"
        },
      }
  ]

  const handleDeleteNotif = () => {
    console.log("delete")
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
                    <Typography noWrap>
                      <b>{notif.newSession.senderName}</b> added you to collaboration session
                    </Typography>
                    <IconButton onClick={handleDeleteNotif}>
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

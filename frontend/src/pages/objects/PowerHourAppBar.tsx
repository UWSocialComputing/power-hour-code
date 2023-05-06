import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
// import Button from "@mui/material/Button";
// import { useLoggedInAuth } from "../../context/AuthContext";

export default function PowerHourAppBar() {
  // const { logout } = useLoggedInAuth();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Power Hour
          </Typography>
          {/* <Button color="success" onClick={() => logout.mutate()} disabled={logout.isLoading}>Logout</Button> */}
        </Toolbar>
      </AppBar>
    </Box>
  );
}

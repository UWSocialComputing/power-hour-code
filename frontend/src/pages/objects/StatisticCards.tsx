import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function StatisticCards(props:any) {

  let waitTimeCardColor = props.waitTime > 30 ? "#FF8A7A" : props.waitTime > 20 ? "#F8C7A6" : props.waitTime > 10 ? "#F7DD8D": "#D1F5BE" 
  
  return (
    <div className="grid grid-cols-3 gap-4 place-content-stretch">
      
      <Card className="p-2.5 outline outline-slate-200 outline-1" sx={{backgroundColor: waitTimeCardColor}}>
        <CardContent>
          <Typography component="div" variant="h5">
            Estimated Wait
          </Typography>
          <Typography component="div" variant="h3">
            {props.waitTime}<Typography variant="caption">mins</Typography>
          </Typography>
        </CardContent>
      </Card>
      <Card className="p-2.5 outline outline-slate-200 outline-1">
        <CardContent>
          <Typography component="div" variant="h5">
            Students Ahead
          </Typography>
          <Typography component="div" variant="h3">
            {props.studentsAhead}
          </Typography>
        </CardContent>
      </Card>
      <Card className="p-2.5 outline outline-slate-200 outline-1">
        <CardContent>
          <Typography component="div" variant="h5">
            Active Sessions
          </Typography>
          <Typography component="div" variant="h3">
            {props.activeSessions}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

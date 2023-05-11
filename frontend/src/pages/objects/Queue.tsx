import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditIcon from '@mui/icons-material/Edit';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import QueueForm from './QueueForm';

interface Data {
  name: string,
  timestamp: string,
  questionType: string,
  question: string,
  InPersonOnline: string,
  status: string,
  OpenToCollaboration: boolean,
  Editable: boolean
}

interface ColumnData {
  dataKey: keyof Data;
  label: string;
  width: number;
}

const columns: ColumnData[] = [
  {
    width: 120,
    label: 'Name',
    dataKey: 'name',
  },
  {
    width: 120,
    label: 'Timestamp',
    dataKey: 'timestamp',
  },
  {
    width: 120,
    label: 'Question Type',
    dataKey: 'questionType',

  },
  {
    width: 120,
    label: 'Question',
    dataKey: 'question',
  },
  {
    width: 120,
    label: 'In Person/Online',
    dataKey: 'InPersonOnline',
  },
  {
    width: 120,
    label: 'Status',
    dataKey: 'status',
  },
  {
    width: 100,
    label: 'Open To Collaboration',
    dataKey: 'OpenToCollaboration',
  },
  {
    width: 50,
    label: '',
    dataKey: 'Editable',
  },

];

const VirtuosoTableComponents: TableComponents<Data> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
  ),
  TableHead,
  TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

function fixedHeaderContent() {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant="head"
          align={'left'}
          style={{ width: column.width }}
          sx={{
            backgroundColor: 'background.paper',
          }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

function rowContent(_index: number, row: Data) {
  return (
    <React.Fragment>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          align={'left'}
        >
          {
              column.dataKey == "OpenToCollaboration" ?
                row[column.dataKey] ?
                <Chip label="Yes" color="success" />:
                <Chip label="No" />:

              column.dataKey == "Editable" ?
                row[column.dataKey] ?
                <IconButton color="primary" component="label">
                  <EditIcon/>
                </IconButton>:
                <></>:
              row[column.dataKey]
          }
        </TableCell>
      ))}
    </React.Fragment>
  );
}

export default function ReactVirtualizedTable(props: any) {
  const [showForm, setShowForm] = React.useState(false);
  return (
    <>
      <Button onClick={() => setShowForm(true)} variant="contained">Join Queue</Button>
      <Paper style={{ height: "500px", width: '100%', marginTop: "2%" }}>
        <TableVirtuoso
          data={props.rowData}
          components={VirtuosoTableComponents}
          fixedHeaderContent={fixedHeaderContent}
          itemContent={rowContent}
        />
      </Paper>
       <QueueForm setShowForm={setShowForm} showForm={showForm}/>:
    </>
  );
}
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { Classroom } from "../data";

export default function ClassroomItem(props: { classroom: Classroom }) {
  const { classroom } = props;
  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex-grow">
        <Typography variant="h5" component="h2">
          {classroom.name}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" component={Link} to={`/classroom/${classroom.id}`}>
          View
        </Button>
        <Button size="small" component={Link} to={`/gallery/${classroom.id}`}>
          Gallery
        </Button>
      </CardActions>
    </Card>
  );
}

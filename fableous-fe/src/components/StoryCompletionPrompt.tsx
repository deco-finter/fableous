import { Button, Grid, Icon } from "@material-ui/core";
import { Link } from "react-router-dom";
import { proto as pb } from "../proto/message_pb";

export default function StoryCompletionPrompt(props: {
  restartSession: () => void;
  sessionInfo: pb.WSControlMessageData | undefined;
}) {
  const { restartSession, sessionInfo } = props;

  return (
    <>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          endIcon={<Icon fontSize="small">brush</Icon>}
          className="mb-2"
          onClick={() => restartSession()}
        >
          Create another story
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="secondary"
          component={Link}
          endIcon={<Icon fontSize="small">photo</Icon>}
          to={`/gallery/${sessionInfo?.classroomId}/${sessionInfo?.sessionId}`}
          className="mb-2"
        >
          View completed story
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="secondary"
          component={Link}
          endIcon={<Icon fontSize="small">book</Icon>}
          to={`/gallery/${sessionInfo?.classroomId}`}
        >
          View classroom gallery
        </Button>
      </Grid>
    </>
  );
}

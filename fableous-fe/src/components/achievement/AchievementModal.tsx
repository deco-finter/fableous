import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  IconButton,
  Typography,
  makeStyles,
  LinearProgress,
} from "@material-ui/core";
import { useState } from "react";
import { Achievement, AchievementDetail, AchievementType } from "./achievement";

const useStyles = makeStyles(() => ({
  modal: {
    minWidth: "400px",
  },
  closeButton: {
    float: "right",
  },
  achievementItem: {
    marginBottom: 24,
  },
  achievementComplete: {
    color: "#000000",
  },
  achievementIncomplete: {
    color: "#000000",
    opacity: 0.5,
  },
  achievementProgressRoot: {
    height: 18,
    borderRadius: 12,
    marginTop: 4,
  },
  achievementProgressBar: {
    borderRadius: 8,
  },
}));

export default function AchievementModal(props: { achievements: Achievement }) {
  const { achievements } = props;
  const [showing, setShowing] = useState(false);

  const classes = useStyles();

  return (
    <>
      <IconButton onClick={() => setShowing(true)}>
        <Icon>emoji_events</Icon>
      </IconButton>
      <Dialog
        open={showing}
        onClose={() => setShowing(false)}
        classes={{ paper: classes.modal }}
      >
        <DialogTitle disableTypography>
          <Typography variant="h6">
            Achievements
            <IconButton
              size="small"
              className={classes.closeButton}
              onClick={() => setShowing(false)}
            >
              <Icon>close</Icon>
            </IconButton>
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {Object.entries(achievements).map(([type, progress]) => (
              <div key={type} className={classes.achievementItem}>
                <Typography
                  variant="subtitle1"
                  className={
                    progress >= 1
                      ? classes.achievementComplete
                      : classes.achievementIncomplete
                  }
                >
                  {AchievementDetail[type as AchievementType].name}
                </Typography>
                <Typography
                  variant="subtitle2"
                  className={
                    progress >= 1
                      ? classes.achievementComplete
                      : classes.achievementIncomplete
                  }
                >
                  {AchievementDetail[type as AchievementType].description}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  color={progress >= 1 ? "secondary" : "primary"}
                  value={progress * 100}
                  classes={{
                    root: classes.achievementProgressRoot,
                    bar: classes.achievementProgressBar,
                  }}
                />
              </div>
            ))}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
}

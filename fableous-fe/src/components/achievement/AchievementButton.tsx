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
import { useEffect, useRef, useState } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import {
  CreateTypes as ConfettiTypes,
  Options as ConfettiOptions,
} from "canvas-confetti";
import { useSnackbar } from "notistack";
import { Achievement, AchievementDetail, AchievementType } from "./achievement";

const useStyles = makeStyles(() => ({
  button: {
    "&:hover": {
      backgroundColor: "#ffffff",
    },
    backgroundColor: "#ffffff",
    marginRight: 16,
    zIndex: 100,
  },
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
  confetti: {
    pointerEvents: "none",
    position: "absolute",
  },
}));

export default function AchievementButton(props: {
  achievements: Achievement;
  confetti?: boolean;
  notify?: boolean;
}) {
  const { achievements, confetti, notify } = props;
  const prevAchievementsRef = useRef<Achievement>(achievements);
  const { enqueueSnackbar } = useSnackbar();
  const [showing, setShowing] = useState(false);
  const confettiRef = useRef<ConfettiTypes | null>(null);

  const confettiOptions: ConfettiOptions = {
    startVelocity: 12,
    scalar: 0.75,
    gravity: 0.4,
    ticks: 300,
    drift: -0.1,
  };

  const notifyAchievement = (type: AchievementType) => {
    enqueueSnackbar(`${AchievementDetail[type].name} achievement get!`, {
      variant: "success",
    });
  };

  const sparkConfetti = () => {
    if (confettiRef.current) confettiRef.current(confettiOptions);
  };

  useEffect(() => {
    Object.entries(achievements).forEach(([type, progress]) => {
      if (
        prevAchievementsRef.current[type as AchievementType] !== progress &&
        progress >= 1
      ) {
        if (notify) notifyAchievement(type as AchievementType);
        if (confetti) sparkConfetti();
      }
    });
    prevAchievementsRef.current = achievements;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievements, confetti, notify]);

  const classes = useStyles();

  return (
    <>
      <IconButton
        onClick={() => setShowing(true)}
        color="primary"
        className={classes.button}
      >
        <Icon>emoji_events</Icon>
        <ReactCanvasConfetti
          resize
          width={1024}
          height={1024}
          zIndex={101}
          useWorker
          refConfetti={(ref) => {
            confettiRef.current = ref;
          }}
          className={classes.confetti}
        />
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
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Icon fontSize="large" style={{ marginRight: 8 }}>
                    {AchievementDetail[type as AchievementType].icon}
                  </Icon>
                  <div>
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
                  </div>
                </div>

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

AchievementButton.defaultProps = {
  confetti: false,
  notify: true,
};

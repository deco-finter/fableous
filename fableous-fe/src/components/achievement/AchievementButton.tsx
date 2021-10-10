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
  Grid,
  Chip,
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
  modal: {
    maxWidth: "640px",
  },
  closeButton: {
    float: "right",
  },
  achievementDescription: {
    marginTop: -6,
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
    zIndex: 1200,
  },
}));

export default function AchievementButton(props: {
  achievements: Achievement;
  confetti?: boolean;
  notify?: boolean;
  rootId?: string;
}) {
  const { achievements, confetti, notify, rootId } = props;
  const prevAchievementsRef = useRef<Achievement>(achievements);
  const { enqueueSnackbar } = useSnackbar();
  const [showing, setShowing] = useState(false);
  const confettiRef = useRef<ConfettiTypes | null>(null);

  const confettiOptions: ConfettiOptions = {
    startVelocity: 14,
    scalar: 0.8,
    gravity: 0.35,
    ticks: 500,
    drift: 0.1,
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
    <div id={rootId}>
      <Chip
        onClick={() => setShowing(true)}
        color="primary"
        variant="outlined"
        icon={
          <>
            <Icon fontSize="medium">emoji_events</Icon>
            <ReactCanvasConfetti
              resize
              width={1024}
              height={1024}
              useWorker
              refConfetti={(ref) => {
                confettiRef.current = ref;
              }}
              className={`${classes.confetti} fixed`}
            />
          </>
        }
        label="Achievements"
      />
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
          <DialogContentText>
            <Grid container spacing={4}>
              {Object.entries(achievements).map(([type, progress]) => (
                <Grid item xs={12} sm={6} key={type}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Icon
                      fontSize="large"
                      color={progress >= 1 ? "secondary" : "disabled"}
                      style={{ marginRight: 8 }}
                    >
                      {AchievementDetail[type as AchievementType].icon}
                    </Icon>
                    <div>
                      <Typography
                        variant="h6"
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
                        className={`${classes.achievementDescription} ${
                          progress >= 1
                            ? classes.achievementComplete
                            : classes.achievementIncomplete
                        }`}
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
                </Grid>
              ))}
            </Grid>
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
}

AchievementButton.defaultProps = {
  confetti: false,
  notify: true,
  rootId: undefined,
};

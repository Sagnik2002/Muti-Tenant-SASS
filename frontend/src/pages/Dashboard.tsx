import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  useTheme,
  alpha,
  Button,
  Skeleton,
} from "@mui/material";
import {
  FolderOpen as ProjectIcon,
  Assignment as TaskIcon,
  CheckCircleOutline as DoneIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useOrgStore } from "../store/orgStore";
import { useProjectStore } from "../store/projectStore";
import { useAuthStore } from "../store/authStore";
import { tasksApi } from "../api/tasks";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const _theme = useTheme();
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={500}
              sx={{ mb: 1 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{ mb: 0.5, lineHeight: 1 }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              background: alpha(color, 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { currentOrg } = useOrgStore();
  const {
    projects,
    fetchProjects,
    isLoading: projectsLoading,
  } = useProjectStore();
  const [taskStats, setTaskStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (currentOrg) {
      fetchProjects(currentOrg.id);
      // Also load task stats from the dedicated endpoint
      tasksApi
        .getStats(currentOrg.id)
        .then((res) => {
          const stats = res.data?.data || res.data || {};
          setTaskStats(stats);
        })
        .catch(() => {});
    }
  }, [currentOrg, fetchProjects]);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const doneTasks = (taskStats["DONE"] as number) || 0;
  const totalTasks = (
    ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const
  ).reduce((acc, k) => acc + ((taskStats[k] as number) || 0), 0);
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const recentProjects = projects.slice(0, 5);

  const statusColors: Record<string, string> = {
    ACTIVE: theme.palette.success.main,
    ARCHIVED: theme.palette.text.secondary,
    COMPLETED: theme.palette.primary.main,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>
          Good {getGreeting()},{" "}
          <Box
            component="span"
            sx={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {user?.firstName}
          </Box>{" "}
          👋
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {currentOrg
            ? `You're managing ${currentOrg.name}`
            : "Select an organization to get started"}
        </Typography>
      </Box>

      {!currentOrg ? (
        <Card>
          <CardContent sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No organization selected
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create or select an organization to start managing projects
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/profile")}
            >
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {projectsLoading ? (
                <Skeleton
                  variant="rectangular"
                  height={120}
                  sx={{ borderRadius: 4 }}
                />
              ) : (
                <StatCard
                  title="Total Projects"
                  value={projects.length}
                  icon={<ProjectIcon fontSize="medium" />}
                  color={theme.palette.primary.main}
                  subtitle={`${activeProjects} active`}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Total Tasks"
                value={totalTasks}
                icon={<TaskIcon fontSize="medium" />}
                color={theme.palette.warning.main}
                subtitle={`${(taskStats["IN_PROGRESS"] as number) || 0} in progress`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Completed Tasks"
                value={doneTasks}
                icon={<DoneIcon fontSize="medium" />}
                color={theme.palette.success.main}
                subtitle="this sprint"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Completion Rate"
                value={`${completionRate}%`}
                icon={<TrendingIcon fontSize="medium" />}
                color={theme.palette.secondary.main}
                subtitle="task completion"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Recent Projects */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" fontWeight={700}>
                      Recent Projects
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate("/projects")}
                      sx={{ textTransform: "none" }}
                    >
                      View all
                    </Button>
                  </Box>

                  {recentProjects.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography color="text.secondary">
                        No projects yet
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("/projects")}
                        sx={{ mt: 2 }}
                      >
                        Create Project
                      </Button>
                    </Box>
                  ) : (
                    recentProjects.map((project) => (
                      <Box
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          cursor: "pointer",
                          mb: 1,
                          transition: "background 0.15s",
                          "&:hover": {
                            background: alpha(theme.palette.primary.main, 0.06),
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            fontSize: "0.9rem",
                            fontWeight: 700,
                          }}
                        >
                          {project.name[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={600} noWrap>
                            {project.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {project.description || "No description"}
                          </Typography>
                        </Box>
                        <Chip
                          label={project.status}
                          size="small"
                          sx={{
                            bgcolor: alpha(
                              statusColors[project.status] ||
                                theme.palette.primary.main,
                              0.12,
                            ),
                            color:
                              statusColors[project.status] ||
                              theme.palette.primary.main,
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Task Status Breakdown */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                    Task Breakdown
                  </Typography>

                  {[
                    {
                      label: "To Do",
                      key: "TODO",
                      color: theme.palette.text.secondary,
                    },
                    {
                      label: "In Progress",
                      key: "IN_PROGRESS",
                      color: theme.palette.warning.main,
                    },
                    {
                      label: "In Review",
                      key: "REVIEW",
                      color: theme.palette.info?.main || "#06b6d4",
                    },
                    {
                      label: "Done",
                      key: "DONE",
                      color: theme.palette.success.main,
                    },
                  ].map(({ label, key, color }) => {
                    const count = (taskStats[key] as number) || 0;
                    const pct =
                      totalTasks > 0
                        ? Math.round((count / totalTasks) * 100)
                        : 0;
                    return (
                      <Box key={key} sx={{ mb: 2.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.8,
                          }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} ({pct}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(color, 0.12),
                            "& .MuiLinearProgress-bar": {
                              bgcolor: color,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}

                  {totalTasks === 0 && (
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: "center", py: 2 }}
                    >
                      No tasks yet — select a project to view tasks
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

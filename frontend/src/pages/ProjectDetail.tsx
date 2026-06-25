import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  Grid, Avatar, LinearProgress, Skeleton, alpha, useTheme,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Assignment as TaskIcon,
  CheckCircleOutline as DoneIcon,
  CalendarToday as CalIcon,
} from '@mui/icons-material';
import { useOrgStore } from '../store/orgStore';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  ARCHIVED: '#94a3b8',
  COMPLETED: '#6366f1',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentOrg } = useOrgStore();
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks, isLoading } = useTaskStore();
  const [projectLoading, setProjectLoading] = useState(true);

  useEffect(() => {
    if (currentOrg && id) {
      fetchProjects(currentOrg.id).finally(() => setProjectLoading(false));
      fetchTasks(currentOrg.id, id);
    }
  }, [currentOrg, id, fetchProjects, fetchTasks]);

  const project = projects.find((p) => p.id === id);

  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTasks = tasks.length;
  const doneTasks = tasksByStatus['DONE'] || 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (projectLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>Project not found</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/projects')}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Projects
        </Button>
        <Typography color="text.disabled">/</Typography>
        <Typography fontWeight={600}>{project.name}</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Project Info Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {project.name[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Typography variant="h5" fontWeight={800}>{project.name}</Typography>
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(STATUS_COLORS[project.status] || theme.palette.primary.main, 0.15),
                        color: STATUS_COLORS[project.status] || theme.palette.primary.main,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                  <Typography color="text.secondary">
                    {project.description || 'No description provided'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {project.createdBy && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>
                      {project.createdBy.firstName[0]}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {project.createdBy.firstName} {project.createdBy.lastName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Progress</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={completionRate}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      '& .MuiLinearProgress-bar': { borderRadius: 5 },
                    }}
                  />
                </Box>
                <Typography fontWeight={700}>{completionRate}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TaskIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{totalTasks} total</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <DoneIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2" color="success.main">{doneTasks} done</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks List */}
        <Grid size={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>Tasks</Typography>
                <Button size="small" onClick={() => navigate('/tasks')} sx={{ textTransform: 'none' }}>
                  Manage in Board
                </Button>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />)}
                </Box>
              ) : tasks.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No tasks yet. Go to the Tasks board to create some.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {tasks.map((task) => (
                    <Box
                      key={task.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}
                    >
                      <Chip
                        label={task.priority}
                        size="small"
                        sx={{
                          bgcolor: alpha(PRIORITY_COLORS[task.priority] || '#94a3b8', 0.15),
                          color: PRIORITY_COLORS[task.priority] || '#94a3b8',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          minWidth: 60,
                        }}
                      />
                      <Typography fontWeight={500} sx={{ flex: 1 }}>{task.title}</Typography>
                      <Chip
                        label={task.status.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      {task.dueDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

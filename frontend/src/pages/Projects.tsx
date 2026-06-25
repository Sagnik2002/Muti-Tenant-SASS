import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  useTheme,
  alpha,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  FolderOpen as ProjectIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '../store/orgStore';
import { useProjectStore } from '../store/projectStore';
import { useIndexedDB } from '../hooks/useIndexedDB';

interface ProjectFormDraft {
  name: string;
  description: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  ARCHIVED: '#94a3b8',
  COMPLETED: '#6366f1',
};

export default function Projects() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentOrg } = useOrgStore();
  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; projectId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Persist draft in IndexedDB
  const { value: draft, setValue: setDraft, deleteValue: clearDraft } = useIndexedDB<ProjectFormDraft>(
    'project-form-draft',
    { name: '', description: '' },
  );

  useEffect(() => {
    if (currentOrg) fetchProjects(currentOrg.id);
  }, [currentOrg, fetchProjects]);

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !draft.name.trim()) return;
    setSubmitting(true);
    try {
      await createProject(currentOrg.id, { name: draft.name, description: draft.description });
      await clearDraft();
      setDialogOpen(false);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!currentOrg) return;
    setMenuAnchor(null);
    await deleteProject(currentOrg.id, projectId);
  };

  if (!currentOrg) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Select an organization to view projects</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Projects</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} in {currentOrg.name}
          </Typography>
        </Box>
        {(currentOrg.role === 'ADMIN' || currentOrg.role === 'EDITOR') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}
          >
            New Project
          </Button>
        )}
      </Box>

      {/* Projects Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <ProjectIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create your first project to start managing tasks
          </Typography>
          {(currentOrg.role === 'ADMIN' || currentOrg.role === 'EDITOR') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
              Create Project
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid key={project.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea
                  onClick={() => navigate(`/projects/${project.id}`)}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2.5,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.8)})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '1.2rem',
                        }}
                      >
                        {project.name[0].toUpperCase()}
                      </Box>
                      <Box onClick={(e) => e.stopPropagation()}>
                        {currentOrg.role === 'ADMIN' && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuAnchor({ el: e.currentTarget, projectId: project.id });
                            }}
                          >
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      {project.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flex: 1, mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {project.description || 'No description provided'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={project.status}
                        size="small"
                        sx={{
                          bgcolor: alpha(STATUS_COLORS[project.status] || '#6366f1', 0.12),
                          color: STATUS_COLORS[project.status] || '#6366f1',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Project Actions Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { if (menuAnchor) handleDelete(menuAnchor.projectId); }} sx={{ color: 'error.main' }}>
          Delete Project
        </MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create New Project
          {draft.name && (
            <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
              (draft saved)
            </Typography>
          )}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Project Name"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              required
              autoFocus
              sx={{ mb: 2.5 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              helperText="Describe the project's goals and scope"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !draft.name.trim()}
              sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Create Project'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

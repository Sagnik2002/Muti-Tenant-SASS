import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  // Grid,
  CircularProgress,
  useTheme,
  alpha,
  Select,
  MenuItem as MuiMenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Tooltip,
  IconButton,
  Menu,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { useOrgStore } from "../store/orgStore";
import { useProjectStore } from "../store/projectStore";
import { useTaskStore } from "../store/taskStore";
import { useIndexedDB } from "../hooks/useIndexedDB";

const STATUS_COLUMNS = [
  { key: "TODO", label: "To Do", color: "#94a3b8" },
  { key: "IN_PROGRESS", label: "In Progress", color: "#f59e0b" },
  { key: "REVIEW", label: "In Review", color: "#06b6d4" },
  { key: "DONE", label: "Done", color: "#10b981" },
];

interface TaskDraft {
  title: string;
  description: string;
  projectId: string;
  priority: string;
  dueDate: string;
}

export default function Tasks() {
  const theme = useTheme();
  const { currentOrg } = useOrgStore();
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, isLoading } =
    useTaskStore();

  const [selectedProject, setSelectedProject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    taskId: string;
  } | null>(null);

  // Draft persistence
  const {
    value: draft,
    setValue: setDraft,
    deleteValue: clearDraft,
  } = useIndexedDB<TaskDraft>("task-form-draft", {
    title: "",
    description: "",
    projectId: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  useEffect(() => {
    if (currentOrg) {
      fetchProjects(currentOrg.id);
    }
  }, [currentOrg, fetchProjects]);

  useEffect(() => {
    if (currentOrg && selectedProject) {
      fetchTasks(currentOrg.id, selectedProject);
    }
  }, [currentOrg, selectedProject, fetchTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !draft.title.trim() || !draft.projectId) return;
    setSubmitting(true);
    try {
      await createTask(currentOrg.id, {
        title: draft.title,
        description: draft.description,
        projectId: draft.projectId,
        priority: draft.priority as any,
        dueDate: draft.dueDate || undefined,
      });
      await clearDraft();
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: string,
    projectId: string,
  ) => {
    if (!currentOrg) return;
    await updateTask(currentOrg.id, taskId, {
      status: newStatus as any,
      projectId,
    });
    if (selectedProject) fetchTasks(currentOrg.id, selectedProject);
  };

  const handleDelete = async (taskId: string) => {
    if (!currentOrg) return;
    setMenuAnchor(null);
    await deleteTask(currentOrg.id, taskId);
    if (selectedProject) fetchTasks(currentOrg.id, selectedProject);
  };

  const getTasksByStatus = (status: string) =>
    tasks.filter((t) => t.status === status);

  const PRIORITY_COLORS: Record<string, string> = {
    LOW: "#94a3b8",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
    URGENT: "#dc2626",
  };

  if (!currentOrg) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography color="text.secondary">
          Select an organization to view tasks
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Tasks
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Kanban board
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProject}
              label="Select Project"
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projects.map((p) => (
                <MuiMenuItem key={p.id} value={p.id}>
                  {p.name}
                </MuiMenuItem>
              ))}
            </Select>
          </FormControl>
          {(currentOrg.role === "ADMIN" || currentOrg.role === "EDITOR") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              disabled={!selectedProject}
              sx={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}
            >
              Add Task
            </Button>
          )}
        </Box>
      </Box>

      {!selectedProject ? (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">
            Select a project to view its tasks on the Kanban board
          </Typography>
        </Card>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        /* Kanban Board */
        <Box sx={{ display: "flex", gap: 2.5, overflowX: "auto", pb: 2 }}>
          {STATUS_COLUMNS.map((col) => {
            const colTasks = getTasksByStatus(col.key);
            return (
              <Box
                key={col.key}
                sx={{
                  minWidth: 280,
                  flex: 1,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  p: 2,
                }}
              >
                {/* Column Header */}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: col.color,
                    }}
                  />
                  <Typography fontWeight={700} sx={{ flex: 1 }}>
                    {col.label}
                  </Typography>
                  <Chip
                    label={colTasks.length}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: alpha(col.color, 0.12),
                      color: col.color,
                    }}
                  />
                </Box>

                {/* Tasks */}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {colTasks.map((task) => (
                    <Card
                      key={task.id}
                      sx={{
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: `1px solid ${theme.palette.divider}`,
                        "&:hover": {
                          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                          transform: "translateY(-1px)",
                        },
                        cursor: "default",
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Typography
                            fontWeight={600}
                            sx={{ flex: 1, mr: 1, fontSize: "0.9rem" }}
                          >
                            {task.title}
                          </Typography>
                          {currentOrg.role === "ADMIN" && (
                            <IconButton
                              size="small"
                              onClick={(e) =>
                                setMenuAnchor({
                                  el: e.currentTarget,
                                  taskId: task.id,
                                })
                              }
                              sx={{ p: 0.5 }}
                            >
                              <MoreIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>

                        {task.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1.5, mt: 0.5 }}
                          >
                            {task.description.slice(0, 80)}
                            {task.description.length > 80 ? "…" : ""}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 1,
                          }}
                        >
                          <Chip
                            label={task.priority}
                            size="small"
                            sx={{
                              bgcolor: alpha(
                                PRIORITY_COLORS[task.priority] || "#94a3b8",
                                0.12,
                              ),
                              color:
                                PRIORITY_COLORS[task.priority] || "#94a3b8",
                              fontWeight: 600,
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {task.dueDate && (
                              <Tooltip
                                title={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                              >
                                <CalendarIcon
                                  sx={{ fontSize: 14, color: "text.secondary" }}
                                />
                              </Tooltip>
                            )}
                            {task.assignee && (
                              <Tooltip
                                title={`${task.assignee.firstName} ${task.assignee.lastName}`}
                              >
                                <Avatar
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    fontSize: "0.65rem",
                                    bgcolor: theme.palette.primary.main,
                                  }}
                                >
                                  {task.assignee.firstName[0]}
                                </Avatar>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>

                        {/* Status Move Buttons */}
                        {(currentOrg.role === "ADMIN" ||
                          currentOrg.role === "EDITOR") && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              mt: 1.5,
                              flexWrap: "wrap",
                            }}
                          >
                            {STATUS_COLUMNS.filter(
                              (s) => s.key !== col.key,
                            ).map((s) => (
                              <Chip
                                key={s.key}
                                label={`→ ${s.label.split(" ")[0]}`}
                                size="small"
                                onClick={() =>
                                  handleStatusChange(
                                    task.id,
                                    s.key,
                                    task.projectId,
                                  )
                                }
                                sx={{
                                  cursor: "pointer",
                                  fontSize: "0.65rem",
                                  height: 20,
                                  "&:hover": { bgcolor: alpha(s.color, 0.15) },
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {colTasks.length === 0 && (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 3,
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="caption">No tasks</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Task Actions Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MuiMenuItem
          onClick={() => {
            if (menuAnchor) handleDelete(menuAnchor.taskId);
          }}
          sx={{ color: "error.main" }}
        >
          Delete Task
        </MuiMenuItem>
      </Menu>

      {/* Create Task Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          Create New Task
          {draft.title && (
            <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
              (draft saved)
            </Typography>
          )}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              fullWidth
              label="Task Title"
              value={draft.title}
              onChange={(e) =>
                setDraft((p) => ({ ...p, title: e.target.value }))
              }
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Description"
              value={draft.description}
              onChange={(e) =>
                setDraft((p) => ({ ...p, description: e.target.value }))
              }
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={draft.projectId || selectedProject}
                label="Project"
                onChange={(e) =>
                  setDraft((p) => ({ ...p, projectId: e.target.value }))
                }
                required
              >
                {projects.map((p) => (
                  <MuiMenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={draft.priority}
                label="Priority"
                onChange={(e) =>
                  setDraft((p) => ({ ...p, priority: e.target.value }))
                }
              >
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <MuiMenuItem key={p} value={p}>
                    {p}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={draft.dueDate}
              onChange={(e) =>
                setDraft((p) => ({ ...p, dueDate: e.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !draft.title.trim()}
              sx={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

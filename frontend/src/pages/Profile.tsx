import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  // Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  // Business as OrgIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../store/authStore";
import { useOrgStore } from "../store/orgStore";
import apiClient from "../api/client";

export default function Profile() {
  const theme = useTheme();
  const { user, updateUser } = useAuthStore();
  const { organizations, createOrganization, fetchOrganizations } =
    useOrgStore();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [orgDialog, setOrgDialog] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: "", slug: "" });
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgError, setOrgError] = useState("");

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await apiClient.put("/users/profile", form);
      updateUser({
        firstName: form.firstName,
        lastName: form.lastName,
        avatarUrl: form.avatarUrl,
      });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setSaveError(e.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrg = async () => {
    setCreatingOrg(true);
    setOrgError("");
    try {
      await createOrganization(orgForm);
      setOrgDialog(false);
      setOrgForm({ name: "", slug: "" });
    } catch {
      setOrgError("Failed to create organization. Slug may be taken.");
    } finally {
      setCreatingOrg(false);
    }
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 4 }}>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Avatar
                src={user?.avatarUrl || undefined}
                sx={{
                  width: 96,
                  height: 96,
                  mx: "auto",
                  mb: 2,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  fontSize: "2rem",
                  fontWeight: 700,
                  boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                }}
              >
                {!user?.avatarUrl &&
                  `${user?.firstName?.[0]}${user?.lastName?.[0]}`}
              </Avatar>
              <Typography variant="h5" fontWeight={700}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography color="text.secondary">{user?.email}</Typography>

              {saveSuccess && (
                <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                  Profile updated successfully!
                </Alert>
              )}
              {saveError && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  {saveError}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Personal Information
                </Typography>
                {!editing && (
                  <Button
                    startIcon={<EditIcon />}
                    size="small"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </Box>

              <Grid container spacing={2.5}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email || ""}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Avatar URL"
                    value={form.avatarUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, avatarUrl: e.target.value }))
                    }
                    disabled={!editing}
                    helperText="Link to your profile image"
                  />
                </Grid>
              </Grid>

              {editing && (
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Button variant="outlined" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    sx={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    }}
                  >
                    {saving ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Organizations */}
        <Grid size={12}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Organizations
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => setOrgDialog(true)}
                >
                  New Organization
                </Button>
              </Box>

              {organizations.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  You are not part of any organization yet.
                </Typography>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {organizations.map((org) => (
                    <Box
                      key={org.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background:
                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        {org.name[0]}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>{org.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          /{org.slug} · {org.plan}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {(org as any).role}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Org Dialog */}
      <Dialog
        open={orgDialog}
        onClose={() => setOrgDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Create Organization</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}
        >
          {orgError && <Alert severity="error">{orgError}</Alert>}
          <TextField
            fullWidth
            label="Organization Name"
            value={orgForm.name}
            onChange={(e) => {
              const name = e.target.value;
              setOrgForm((p) => ({ ...p, name, slug: generateSlug(name) }));
            }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Slug"
            value={orgForm.slug}
            onChange={(e) =>
              setOrgForm((p) => ({ ...p, slug: e.target.value }))
            }
            helperText="Unique URL-friendly identifier (auto-generated)"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOrgDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateOrg}
            disabled={creatingOrg || !orgForm.name || !orgForm.slug}
            sx={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            {creatingOrg ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

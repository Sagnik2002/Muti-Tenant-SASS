import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import { Add as AddIcon, PersonRemove as RemoveIcon } from '@mui/icons-material';
import { useOrgStore } from '../store/orgStore';
import { organizationsApi } from '../api/organizations';

interface Member {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  joinedAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#6366f1',
  EDITOR: '#f59e0b',
  VIEWER: '#10b981',
};

export default function Members() {
  const theme = useTheme();
  const { currentOrg } = useOrgStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'VIEWER' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMembers = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const res = await organizationsApi.getMembers(currentOrg.id);
      setMembers(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentOrg]);

  const handleAddMember = async () => {
    if (!currentOrg) return;
    setAdding(true);
    setError('');
    try {
      await organizationsApi.addMember(currentOrg.id, form);
      setSuccess(`${form.email} added successfully`);
      setDialogOpen(false);
      setForm({ email: '', role: 'VIEWER' });
      fetchMembers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (membershipId: string) => {
    if (!currentOrg) return;
    try {
      await organizationsApi.removeMember(currentOrg.id, membershipId);
      setMembers((prev) => prev.filter((m) => m.id !== membershipId));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to remove member');
    }
  };

  if (!currentOrg) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Select an organization to manage members</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Members</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {members.length} member{members.length !== 1 ? 's' : ''} in {currentOrg.name}
          </Typography>
        </Box>
        {currentOrg.role === 'ADMIN' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
          >
            Invite Member
          </Button>
        )}
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : members.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No members found</Typography>
            </Box>
          ) : (
            members.map((member, idx) => (
              <Box
                key={member.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 3,
                  py: 2.5,
                  borderBottom: idx < members.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                }}
              >
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    fontWeight: 700,
                  }}
                >
                  {member.firstName[0]}{member.lastName[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={600}>{member.firstName} {member.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{member.email}</Typography>
                </Box>
                <Chip
                  label={member.role}
                  size="small"
                  sx={{
                    bgcolor: alpha(ROLE_COLORS[member.role] || '#6366f1', 0.12),
                    color: ROLE_COLORS[member.role] || '#6366f1',
                    fontWeight: 700,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90, textAlign: 'right' }}>
                  {new Date(member.joinedAt).toLocaleDateString()}
                </Typography>
                {currentOrg.role === 'ADMIN' && (
                  <Tooltip title="Remove member">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemove(member.id)}
                      sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Invite Member</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            autoFocus
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={form.role}
              label="Role"
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <MenuItem value="ADMIN">Admin — Full access</MenuItem>
              <MenuItem value="EDITOR">Editor — Create & edit</MenuItem>
              <MenuItem value="VIEWER">Viewer — Read only</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMember}
            disabled={adding || !form.email}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {adding ? <CircularProgress size={20} color="inherit" /> : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

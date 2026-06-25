import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Payment as PaymentIcon } from '@mui/icons-material';
import { useOrgStore } from '../store/orgStore';
import apiClient from '../api/client';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerRef: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  REFUNDED: '#6366f1',
};

export default function Payments() {
  const theme = useTheme();
  const { currentOrg } = useOrgStore();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', currency: 'USD' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPayments = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/payments', { headers: { 'X-Org-Id': currentOrg.id } });
      setPayments(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [currentOrg]);

  const handleCreate = async () => {
    if (!currentOrg) return;
    setCreating(true);
    setError('');
    try {
      await apiClient.post('/payments', { amount: parseFloat(form.amount), currency: form.currency }, {
        headers: { 'X-Org-Id': currentOrg.id },
      });
      setSuccess('Payment created successfully');
      setDialogOpen(false);
      setForm({ amount: '', currency: 'USD' });
      fetchPayments();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create payment');
    } finally {
      setCreating(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!currentOrg) return;
    try {
      await apiClient.post(`/payments/${id}/verify`, {}, { headers: { 'X-Org-Id': currentOrg.id } });
      fetchPayments();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Verification failed');
    }
  };

  const handleRefund = async (id: string) => {
    if (!currentOrg) return;
    try {
      await apiClient.post(`/payments/${id}/refund`, {}, { headers: { 'X-Org-Id': currentOrg.id } });
      fetchPayments();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Refund failed');
    }
  };

  if (!currentOrg) {
    return <Box sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">Select an organization to view payments</Typography></Box>;
  }

  if (currentOrg.role !== 'ADMIN') {
    return <Box sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">Only admins can view payments</Typography></Box>;
  }

  const totalRevenue = payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Payments</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Billing & payment history</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
        >
          New Payment
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Summary Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Revenue</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>${totalRevenue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Completed</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#10b981' }}>
                {payments.filter((p) => p.status === 'COMPLETED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Transactions</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{payments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payments List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : payments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No payments yet</Typography>
            </Box>
          ) : (
            payments.map((payment, idx) => (
              <Box
                key={payment.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 3,
                  py: 2.5,
                  borderBottom: idx < payments.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                }}
              >
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(STATUS_COLORS[payment.status] || '#6366f1', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: STATUS_COLORS[payment.status] }}>
                  <PaymentIcon fontSize="small" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={600}>
                    {payment.currency} {Number(payment.amount).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {payment.providerRef} · {payment.provider}
                  </Typography>
                </Box>
                <Chip
                  label={payment.status}
                  size="small"
                  sx={{ bgcolor: alpha(STATUS_COLORS[payment.status] || '#6366f1', 0.12), color: STATUS_COLORS[payment.status] || '#6366f1', fontWeight: 700 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100, textAlign: 'right' }}>
                  {new Date(payment.createdAt).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {payment.status === 'PENDING' && (
                    <Button size="small" variant="outlined" onClick={() => handleVerify(payment.id)}>Verify</Button>
                  )}
                  {payment.status === 'COMPLETED' && (
                    <Button size="small" variant="outlined" color="error" onClick={() => handleRefund(payment.id)}>Refund</Button>
                  )}
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Payment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Create Payment</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !form.amount}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Create Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

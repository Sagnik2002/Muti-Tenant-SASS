import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Link,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch {
      // Error handled by store
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%, #020617 100%)'
            : 'radial-gradient(ellipse at top, #ede9fe 0%, #f8fafc 50%, #e0e7ff 100%)',
        p: 2,
      }}
    >
      <Box sx={{ position: 'fixed', top: -200, right: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <Box sx={{ position: 'fixed', bottom: -150, left: -150, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(20px)',
          background: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem' }}>S</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>Create your account</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Join SaaS Workspace today</Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={clearError} sx={{ mb: 3, borderRadius: 2 }}>
              {Array.isArray(error) ? error.join(', ') : error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  required
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              required
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              required
              helperText="Minimum 8 characters"
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ py: 1.5, fontSize: '1rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>

          <Typography sx={{ textAlign: 'center', mt: 3 }} color="text.secondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover" fontWeight={600}>
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

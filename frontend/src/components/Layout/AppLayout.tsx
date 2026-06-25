import { useState, useEffect } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import TopBar from './TopBar';
import { useOrgStore } from '../../store/orgStore';
import { useSocket } from '../../hooks/useSocket';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentOrg, fetchOrganizations } = useOrgStore();

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Connect WebSocket for real-time notifications
  useSocket(currentOrg?.id || null);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar onMenuClick={() => setMobileOpen(!mobileOpen)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

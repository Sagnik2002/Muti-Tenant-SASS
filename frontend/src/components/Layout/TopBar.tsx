import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  alpha,
  Chip,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  SwapHoriz as SwapIcon,
  Close as CloseIcon,
  DoneAll as DoneAllIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { useOrgStore } from "../../store/orgStore";
import { useNotificationStore } from "../../store/notificationStore";
import { DRAWER_WIDTH } from "./Sidebar";

interface TopBarProps {
  onMenuClick: () => void;
}

function formatNotificationTitle(event: string): string {
  const map: Record<string, string> = {
    "project:created": "New project created",
    "project:updated": "Project updated",
    "task:assigned": "Task assigned to you",
    "task:updated": "Task updated",
  };
  return map[event] || event;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const theme = useTheme();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const { currentOrg, organizations, setCurrentOrg } = useOrgStore();
  const { unreadCount, notifications, markAllAsRead, markAsRead } =
    useNotificationStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [orgAnchor, setOrgAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        backdropFilter: "blur(20px)",
        backgroundColor: alpha(theme.palette.background.default, 0.8),
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Org Switcher */}
        {currentOrg && (
          <Chip
            label={currentOrg.name}
            onClick={(e) => setOrgAnchor(e.currentTarget)}
            onDelete={(e) => setOrgAnchor(e.currentTarget as HTMLElement)}
            deleteIcon={<SwapIcon sx={{ fontSize: 16 }} />}
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              "&:hover": {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          />
        )}

        <Menu
          anchorEl={orgAnchor}
          open={Boolean(orgAnchor)}
          onClose={() => setOrgAnchor(null)}
        >
          {organizations.map((org) => (
            <MenuItem
              key={org.id}
              selected={org.id === currentOrg?.id}
              onClick={() => {
                setCurrentOrg(org);
                setOrgAnchor(null);
              }}
            >
              <Box>
                <Typography fontWeight={600}>{org.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {org.role}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        <Box sx={{ flex: 1 }} />

        {/* Theme Toggle */}
        <Tooltip title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}>
          <IconButton
            onClick={toggleTheme}
            sx={{ color: theme.palette.text.secondary }}
          >
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            sx={{ color: theme.palette.text.secondary }}
            onClick={(e) => setNotifAnchor(e.currentTarget)}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Avatar */}
        <Tooltip title="Account">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <MenuItem onClick={logout}>Logout</MenuItem>
        </Menu>

        {/* Notifications Popover */}
        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              width: 360,
              maxHeight: 480,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography fontWeight={700}>Notifications</Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={markAllAsRead}>
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton size="small" onClick={() => setNotifAnchor(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <NotificationsIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                />
                <Typography color="text.secondary" variant="body2">
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {notifications.map((n, i) => (
                  <Box key={n.id}>
                    <ListItem
                      onClick={() => markAsRead(n.id)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: n.read
                          ? "transparent"
                          : alpha(theme.palette.primary.main, 0.05),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        },
                        alignItems: "flex-start",
                        py: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          mr: 1.5,
                          mt: 0.5,
                          color: n.read ? "text.disabled" : "primary.main",
                        }}
                      >
                        <CircleIcon sx={{ fontSize: 8 }} />
                      </Box>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            fontWeight={n.read ? 400 : 600}
                          >
                            {formatNotificationTitle(n.event)}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {n.payload?.name || n.payload?.title || ""} ·{" "}
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {i < notifications.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Box>
        </Popover>
      </Toolbar>
    </AppBar>
  );
}

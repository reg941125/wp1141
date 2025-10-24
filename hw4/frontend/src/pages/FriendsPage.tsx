import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { User, Friendship, Activity } from '../types';
import { friendAPI } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`friends-tabpanel-${index}`}
      aria-labelledby={`friends-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const { } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<{ incoming: Friendship[]; outgoing: Friendship[] }>({ incoming: [], outgoing: [] });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [friendsRes, requestsRes, activitiesRes] = await Promise.all([
        friendAPI.getFriends(),
        friendAPI.getRequests(),
        friendAPI.getActivity(),
      ]);

      if (friendsRes.success) setFriends(friendsRes.data || []);
      if (requestsRes.success) setRequests(requestsRes.data || { incoming: [], outgoing: [] });
      if (activitiesRes.success) setActivities(activitiesRes.data || []);
    } catch (err) {
      setError('載入好友資料時發生錯誤');
      console.error('Error fetching friends data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await friendAPI.searchUsers(searchQuery);
      if (response.success) {
        setSearchResults(response.data || []);
      }
    } catch (err) {
      setError('搜尋用戶時發生錯誤');
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (friendId: number) => {
    try {
      const response = await friendAPI.sendRequest({ friend_id: friendId });
      if (response.success) {
        fetchFriendsData();
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      setError('發送好友請求時發生錯誤');
      console.error('Error sending friend request:', err);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const response = await friendAPI.acceptRequest(requestId);
      if (response.success) {
        fetchFriendsData();
      }
    } catch (err) {
      setError('接受好友請求時發生錯誤');
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      const response = await friendAPI.removeFriend(friendId);
      if (response.success) {
        fetchFriendsData();
      }
    } catch (err) {
      setError('移除好友時發生錯誤');
      console.error('Error removing friend:', err);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => navigate('/')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            👥 好友系統
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => navigate('/')}
          >
            <HomeIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="好友列表" />
            <Tab label="好友請求" />
            <Tab label="好友動態" />
            <Tab label="搜尋用戶" />
          </Tabs>
        </Box>

        {/* 好友列表 */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            我的好友 ({friends.length})
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : friends.length > 0 ? (
            <Grid container spacing={2}>
              {friends.map((friendship) => (
                <Grid item xs={12} sm={6} md={4} key={friendship.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ mr: 2 }}>
                          {friendship.friend?.username?.charAt(0).toUpperCase() || 'F'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6">
                            {friendship.friend?.username || '未知用戶'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {friendship.friend?.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleRemoveFriend(friendship.friend_id)}
                      >
                        移除好友
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                還沒有好友，快去搜尋並添加好友吧！
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* 好友請求 */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            好友請求
          </Typography>
          
          {/* 收到的請求 */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            收到的請求 ({requests.incoming.length})
          </Typography>
          {requests.incoming.length > 0 ? (
            <List>
              {requests.incoming.map((request) => (
                <ListItem key={request.id}>
                  <ListItemAvatar>
                    <Avatar>
                      {request.friend?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={request.friend?.username || '未知用戶'}
                    secondary={request.friend?.email}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<CheckIcon />}
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      接受
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<CloseIcon />}
                    >
                      拒絕
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              沒有收到的好友請求
            </Typography>
          )}

          {/* 發出的請求 */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            發出的請求 ({requests.outgoing.length})
          </Typography>
          {requests.outgoing.length > 0 ? (
            <List>
              {requests.outgoing.map((request) => (
                <ListItem key={request.id}>
                  <ListItemAvatar>
                    <Avatar>
                      {request.friend?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={request.friend?.username || '未知用戶'}
                    secondary={request.friend?.email}
                  />
                  <Chip label="等待回應" color="warning" size="small" />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              沒有發出的好友請求
            </Typography>
          )}
        </TabPanel>

        {/* 好友動態 */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            好友動態
          </Typography>
          {activities.length > 0 ? (
            <List>
              {activities.map((activity, index) => (
                <ListItem key={index} divider>
                  <ListItemAvatar>
                    <Avatar>
                      {activity.type === 'restroom_added' ? '🚽' : '💬'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      activity.type === 'restroom_added' 
                        ? `新增了廁所：${activity.data.name}`
                        : `評論了廁所：${activity.data.restroom_name}`
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(activity.created_at).toLocaleString('zh-TW')}
                        </Typography>
                        {activity.type === 'comment_added' && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            "{activity.data.content}"
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                沒有好友動態
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* 搜尋用戶 */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            搜尋用戶
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              label="搜尋用戶"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="輸入用戶名稱或電子郵件"
            />
            <Button
              variant="contained"
              onClick={handleSearchUsers}
              disabled={loading || !searchQuery.trim()}
              startIcon={<SearchIcon />}
            >
              搜尋
            </Button>
          </Box>
          
          {searchResults.length > 0 ? (
            <List>
              {searchResults.map((user) => (
                <ListItem key={user.id} divider>
                  <ListItemAvatar>
                    <Avatar>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={user.email}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => handleSendFriendRequest(user.id)}
                  >
                    加好友
                  </Button>
                </ListItem>
              ))}
            </List>
          ) : searchQuery && !loading ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                沒有找到用戶
              </Typography>
            </Box>
          ) : !searchQuery ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                輸入用戶名稱或電子郵件來搜尋
              </Typography>
            </Box>
          ) : null}
        </TabPanel>
      </Container>

    </Box>
  );
};

export default FriendsPage;

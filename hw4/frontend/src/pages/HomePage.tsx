import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Map as MapIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🚽 NTU 廁所地圖
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            歡迎，{user?.username}！
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            🚽 NTU 廁所地圖
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            探索台大校園及周邊的廁所
          </Typography>
          <Typography variant="body1" color="text.secondary">
            發現、分享、評價你身邊的廁所，讓每個人都能找到最適合的廁所！
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <MapIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  地圖瀏覽
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  在地圖上查看台大校園及周邊的所有廁所位置
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/map')}
                  startIcon={<MapIcon />}
                >
                  開始探索
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <AddIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  新增廁所
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  發現新的廁所？分享給大家，幫助更多人！
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => navigate('/add-restroom')}
                  startIcon={<AddIcon />}
                >
                  新增廁所
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  好友系統
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  添加好友，查看他們的新發現和評論
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={() => navigate('/friends')}
                  startIcon={<PeopleIcon />}
                >
                  管理好友
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box mt={4} textAlign="center">
          <Typography variant="h6" gutterBottom>
            主要功能
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 🗺️ 地圖瀏覽：查看所有廁所位置<br/>
            • 📍 篩選搜尋：根據需求找到最適合的廁所<br/>
            • ⭐ 評分系統：1-5星評價廁所品質<br/>
            • 💬 評論功能：分享使用心得<br/>
            • 🏷️ 標籤系統：標記廁所特色（免治馬桶、無障礙等）<br/>
            • 👥 好友系統：與朋友分享廁所資訊<br/>
            • 📸 照片分享：上傳廁所照片
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;

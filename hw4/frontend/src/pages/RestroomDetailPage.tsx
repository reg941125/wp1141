import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CardMedia,
  Grid,
  Chip,
  Rating,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Send as SendIcon,
  Star as StarIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Restroom } from '../types';
import { restroomAPI, commentAPI } from '../services/api';

// 標籤類型中英文對照
const getTagTypeLabel = (tagType: string): string => {
  const tagTypeMap: { [key: string]: string } = {
    'bidet': '免治馬桶',
    'lighting': '照明',
    'smell': '氣味',
    'accessibility': '無障礙',
    'tissue_supply': '衛生紙供應',
    '24_hour_open': '24小時開放',
    'cleanliness': '清潔度',
    'privacy': '隱私性',
    'ventilation': '通風',
    'water_pressure': '水壓',
    'soap_supply': '洗手乳供應',
    'hand_dryer': '烘手機',
    'mirror': '鏡子',
    'baby_changing': '嬰兒換尿布台',
    'gender_neutral': '性別友善',
    'free': '免費',
    'paid': '付費'
  };
  
  return tagTypeMap[tagType] || tagType;
};

const RestroomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restroom, setRestroom] = useState<Restroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(0);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRestroom();
    }
  }, [id]);

  const fetchRestroom = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await restroomAPI.getById(parseInt(id!));
      if (response.success && response.data) {
        setRestroom(response.data);
        
        // 檢查用戶是否已經評過分
        if (user && response.data.ratings) {
          const userRatingData = response.data.ratings.find(
            (rating: any) => rating.user_id === user.id
          );
          if (userRatingData) {
            setUserRating(userRatingData.rating);
            setHasUserRated(true);
            setNewRating(userRatingData.rating);
          }
        }
      } else {
        setError('Failed to fetch restroom details');
      }
    } catch (err) {
      setError('Error loading restroom details');
      console.error('Error fetching restroom:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !restroom) return;

    try {
      setSubmitting(true);
      const response = await commentAPI.add(restroom.id, { content: newComment.trim() });
      if (response.success) {
        setNewComment('');
        fetchRestroom(); // Refresh to get new comment
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!newRating || !restroom) return;

    try {
      setSubmitting(true);
      const response = await commentAPI.rate(restroom.id, { rating: newRating });
      if (response.success) {
        setUserRating(newRating);
        setHasUserRated(true);
        fetchRestroom(); // Refresh to get updated rating
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRestroom = async () => {
    if (!restroom) return;

    try {
      setDeleting(true);
      const response = await restroomAPI.delete(restroom.id);
      if (response.success) {
        navigate('/map');
      } else {
        setError('刪除廁所失敗');
      }
    } catch (err) {
      console.error('Error deleting restroom:', err);
      setError('刪除廁所時發生錯誤');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // 檢查是否為廁所創建者
  const isCreator = user && restroom && user.id === restroom.creator_id;

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="back"
              onClick={() => navigate('/map')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🚽 廁所詳情
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => navigate('/')}
            >
              <HomeIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>載入中...</Typography>
        </Box>
      </Box>
    );
  }

  if (error || !restroom) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="back"
              onClick={() => navigate('/map')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🚽 廁所詳情
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => navigate('/')}
            >
              <HomeIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 2 }}>
          <Alert severity="error">{error || '廁所不存在'}</Alert>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/map')}
          >
            返回地圖
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => navigate('/map')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🚽 {restroom.name}
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => navigate('/')}
          >
            <HomeIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Grid container spacing={3}>
          {/* 廁所資訊 */}
          <Grid item xs={12} md={8}>
            <Card>
              {restroom.picture_url && (
                <CardMedia
                  component="img"
                  height="200"
                  image={restroom.picture_url}
                  alt={restroom.name}
                />
              )}
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  {restroom.name}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  📍 {restroom.address}
                </Typography>
                
                {restroom.description && (
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    {restroom.description}
                  </Typography>
                )}

                {/* 標籤 */}
                {restroom.tags && restroom.tags.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      特色標籤
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {restroom.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={`${getTagTypeLabel(tag.tag_type)}: ${tag.tag_value}`}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 評分 */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    評分
                  </Typography>
                  {restroom.average_rating ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={restroom.average_rating} readOnly />
                      <Typography variant="h6">
                        {restroom.average_rating.toFixed(1)} / 5.0
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({restroom.ratings?.length || 0} 個評分)
                      </Typography>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">尚無評分</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* 評論區 */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  評論 ({restroom.comments?.length || 0})
                </Typography>
                
                {/* 新增評論 */}
                {user && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="分享你的使用心得..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submitting}
                    />
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                      sx={{ mt: 1 }}
                    >
                      發表評論
                    </Button>
                  </Box>
                )}

                <Divider sx={{ mb: 2 }} />

                {/* 評論列表 */}
                {restroom.comments && restroom.comments.length > 0 ? (
                  <List>
                    {restroom.comments.map((comment) => (
                      <ListItem key={comment.id} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            {comment.username?.charAt(0).toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={comment.username || '匿名用戶'}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(comment.created_at).toLocaleString('zh-TW')}
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 1 }}>
                                {comment.content}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                    尚無評論，成為第一個評論的人吧！
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 側邊欄 */}
          <Grid item xs={12} md={4}>
            {/* 評分廁所 */}
            {user && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {hasUserRated ? '我的評分' : '評分這個廁所'}
                  </Typography>
                  <Box 
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <Rating
                      value={hasUserRated && !isHovering ? userRating : newRating}
                      onChange={(_, value) => setNewRating(value || 0)}
                      size="large"
                      readOnly={hasUserRated && !isHovering}
                    />
                    {(hasUserRated && !isHovering) ? (
                      <Typography variant="body2" color="text.secondary">
                        {userRating} 星
                      </Typography>
                    ) : newRating > 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {newRating} 星
                      </Typography>
                    ) : null}
                  </Box>
                  {(!hasUserRated || isHovering) && (
                    <Button
                      variant="contained"
                      startIcon={<StarIcon />}
                      onClick={handleSubmitRating}
                      disabled={!newRating || submitting}
                      fullWidth
                    >
                      {hasUserRated ? '更新評分' : '提交評分'}
                    </Button>
                  )}
                  {hasUserRated && !isHovering && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      滑鼠移上來修改評分
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 刪除廁所 */}
            {isCreator && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    管理廁所
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    fullWidth
                  >
                    刪除廁所
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 廁所資訊 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  廁所資訊
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  建立者：{restroom.creator?.username || '未知'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  建立時間：{new Date(restroom.created_at).toLocaleString('zh-TW')}
                </Typography>
                {restroom.distance && (
                  <Typography variant="body2" color="text.secondary">
                    距離：{restroom.distance.toFixed(2)} km
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          確認刪除廁所
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            您確定要刪除「{restroom?.name}」這個廁所嗎？此操作無法復原，所有相關的評論和評分也會被刪除。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            取消
          </Button>
          <Button 
            onClick={handleDeleteRestroom}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? '刪除中...' : '確認刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RestroomDetailPage;

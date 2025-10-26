import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Save as SaveIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { RestroomCreate } from '../types';
import { restroomAPI, uploadAPI } from '../services/api';
import LocationPicker from '../components/Map/LocationPicker';

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

const AddRestroomPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<RestroomCreate>({
    name: '',
    address: '',
    description: '',
    picture_url: '',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  const tagOptions = [
    { type: 'bidet', label: '免治馬桶', values: ['有', '無'] },
    { type: 'smell', label: '氣味', values: ['良好', '普通', '不佳'] },
    { type: 'lighting', label: '光線', values: ['明亮', '昏暗'] },
    { type: 'accessible', label: '無障礙設施', values: ['有', '無'] },
    { type: 'tissue_supply', label: '衛生紙供應', values: ['有', '無'] },
    { type: 'open_24h', label: '24小時開放', values: ['是', '否'] },
  ];

  const handleInputChange = (field: keyof RestroomCreate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    // 這裡可以添加反向地理編碼來獲取地址
    setSelectedAddress(`緯度: ${location.lat.toFixed(6)}, 經度: ${location.lng.toFixed(6)}`);
  };

  const handleTagChange = (tagType: string, value: string) => {
    setFormData(prev => {
      const newTags = prev.tags?.filter(tag => tag.tag_type !== tagType) || [];
      if (value) {
        newTags.push({ tag_type: tagType as any, tag_value: value });
      }
      return { ...prev, tags: newTags };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      
      const response = await uploadAPI.uploadImage(file);
      if (response.success && response.data) {
        const fullUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${response.data.url}`;
        setUploadedImageUrl(fullUrl);
        setFormData(prev => ({ ...prev, picture_url: fullUrl }));
      } else {
        setError('圖片上傳失敗');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('圖片上傳時發生錯誤');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('請填寫廁所名稱');
      return;
    }

    // 根據選擇的方式設定地址
    let finalAddress = '';
    if (tabValue === 0) {
      // 地圖選擇模式
      if (!selectedLocation) {
        setError('請在地圖上點選位置');
        return;
      }
      finalAddress = selectedAddress;
    } else {
      // 手動輸入模式
      if (!formData.address.trim()) {
        setError('請填寫地址');
        return;
      }
      finalAddress = formData.address;
    }

    try {
      setLoading(true);
      setError(null);
      
      const submitData = {
        ...formData,
        address: finalAddress,
        latitude: selectedLocation?.lat,
        longitude: selectedLocation?.lng,
      };
      
      const response = await restroomAPI.create(submitData);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/map');
        }, 2000);
      } else {
        setError(response.error || '新增廁所失敗');
      }
    } catch (err) {
      setError('新增廁所時發生錯誤');
      console.error('Error creating restroom:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
              ➕ 新增廁所
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => navigate('/')}
            >
              <HomeIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            廁所新增成功！正在跳轉到地圖頁面...
          </Alert>
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
            ➕ 新增廁所
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
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              ➕ 新增廁所
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              分享你發現的廁所，幫助更多人找到適合的廁所！
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* 選擇新增方式 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab 
                  icon={<LocationOnIcon />} 
                  label="地圖上選擇位置" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<EditIcon />} 
                  label="手動輸入地址" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* 基本資訊 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    基本資訊
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="廁所名稱 *"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="例如：台大總圖一樓廁所"
                  />
                </Grid>

                {/* 根據選擇的方式顯示不同的地址輸入 */}
                {tabValue === 0 ? (
                  // 地圖選擇模式
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        📍 在地圖上選擇位置
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        點擊地圖上的位置來選擇廁所位置
                      </Typography>
                      {selectedLocation && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          已選擇位置：{selectedAddress}
                        </Alert>
                      )}
                    </Paper>
                    <Box sx={{ height: '400px', mb: 2 }}>
                      <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        selectedLocation={selectedLocation}
                      />
                    </Box>
                  </Grid>
                ) : (
                  // 手動輸入模式
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="地址 *"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                      placeholder="例如：台北市大安區羅斯福路四段1號"
                      helperText="請輸入完整地址，系統會自動轉換為座標"
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="描述"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="分享這個廁所的特色或使用心得..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    廁所照片
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="upload-image"
                    type="file"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="upload-image">
                    <Button
                      variant="outlined"
                      component="span"
                      disabled={uploading}
                      startIcon={uploading ? <CircularProgress size={20} /> : undefined}
                    >
                      {uploading ? '上傳中...' : '上傳圖片'}
                    </Button>
                  </label>
                  {uploadedImageUrl && (
                    <Box sx={{ mt: 2 }}>
                      <img 
                        src={uploadedImageUrl} 
                        alt="預覽" 
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                      />
                    </Box>
                  )}
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    可選：上傳廁所照片 (支援 jpeg, jpg, png, gif, webp，最大 5MB)
                  </Typography>
                </Grid>

                {/* 標籤 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    廁所特色
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    選擇這個廁所的特色標籤
                  </Typography>
                </Grid>

                {tagOptions.map((option) => (
                  <Grid item xs={12} sm={6} key={option.type}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{option.label}</InputLabel>
                      <Select
                        value={formData.tags?.find(tag => tag.tag_type === option.type)?.tag_value || ''}
                        onChange={(e) => handleTagChange(option.type, e.target.value)}
                        label={option.label}
                      >
                        <MenuItem value="">不限</MenuItem>
                        {option.values.map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                ))}

                {/* 已選擇的標籤 */}
                {formData.tags && formData.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      已選擇的標籤：
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={`${getTagTypeLabel(tag.tag_type)}: ${tag.tag_value}`}
                          onDelete={() => handleTagChange(tag.tag_type, '')}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* 提交按鈕 */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/map')}
                      disabled={loading}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={
                        loading || 
                        !formData.name.trim() || 
                        (tabValue === 0 && !selectedLocation) ||
                        (tabValue === 1 && !formData.address.trim())
                      }
                    >
                      {loading ? '新增中...' : '新增廁所'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AddRestroomPage;

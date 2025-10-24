import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Rating,
  Avatar,
  Divider,
} from '@mui/material';
import { Restroom } from '../../types';
import { getMarkerEmoji } from '../../services/googleMaps';

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

interface RestroomPreviewProps {
  restroom: Restroom;
  visible: boolean;
  position: { x: number; y: number };
}

const RestroomPreview: React.FC<RestroomPreviewProps> = ({
  restroom,
  visible,
  position,
}) => {
  if (!visible) return null;

  return (
    <Card
      sx={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        minWidth: 300,
        maxWidth: 350,
        boxShadow: 3,
        borderRadius: 2,
        transform: 'translateY(-100%)',
        pointerEvents: 'none',
        // 添加箭頭指向 marker
        '&::before': {
          content: '""',
          position: 'absolute',
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          border: '10px solid transparent',
          borderRightColor: 'white',
          filter: 'drop-shadow(-2px 0 2px rgba(0,0,0,0.1))',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* 標題區域 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            sx={{ 
              mr: 1, 
              bgcolor: 'primary.main',
              fontSize: (() => {
                const emoji = getMarkerEmoji(restroom.average_rating || 0);
                const emojiLength = emoji.length;
                if (emojiLength <= 1) return '1.5rem'; // 單個 emoji
                if (emojiLength <= 2) return '1.0rem'; // 兩個 emoji
                if (emojiLength <= 3) return '0.8rem'; // 三個 emoji
                return '0.8rem'; // 更多 emoji
              })()
            }}
          >
            {getMarkerEmoji(restroom.average_rating || 0)}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: '1rem',
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {restroom.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {restroom.address}
            </Typography>
          </Box>
        </Box>

        {/* 評分區域 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating
            value={restroom.average_rating || 0}
            precision={0.1}
            size="small"
            readOnly
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({restroom.average_rating?.toFixed(1) || '0.0'})
          </Typography>
        </Box>

        {/* 描述 */}
        {restroom.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {restroom.description}
          </Typography>
        )}

        {/* 照片預覽 */}
        {restroom.picture_url && (
          <Box sx={{ mb: 1 }}>
            <img
              src={restroom.picture_url}
              alt={restroom.name}
              style={{
                width: '100%',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Box>
        )}

        {/* 標籤 */}
        {restroom.tags && restroom.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {restroom.tags.slice(0, 4).map((tag, index) => (
              <Chip
                key={index}
                label={`${getTagTypeLabel(tag.tag_type)}: ${tag.tag_value}`}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ fontSize: '0.7rem', height: '24px' }}
              />
            ))}
            {restroom.tags.length > 4 && (
              <Chip
                label={`+${restroom.tags.length - 4}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '24px' }}
              />
            )}
          </Box>
        )}

        {/* 創建者信息 */}
        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">
          由 {restroom.creator?.username || '未知用戶'} 建立
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RestroomPreview;

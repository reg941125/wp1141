import React, { useState } from 'react';
import {
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Button,
  Box,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { RestroomFilters } from '../../types';

interface FilterPanelProps {
  filters: RestroomFilters;
  onFiltersChange: (filters: RestroomFilters) => void;
  onFindNearest: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onFindNearest,
}) => {
  const [localFilters, setLocalFilters] = useState<RestroomFilters>(filters);

  const handleFilterChange = (key: keyof RestroomFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: RestroomFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  return (
    <Paper sx={{ 
      p: { xs: 1, sm: 2 }, 
      mb: { xs: 1, sm: 2 },
      maxHeight: { xs: '70vh', md: 'none' },
      overflow: 'auto'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: { xs: 1, sm: 2 },
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          篩選條件
        </Typography>
        {getActiveFiltersCount() > 0 && (
          <Chip
            label={`${getActiveFiltersCount()} 個篩選`}
            color="primary"
            size="small"
          />
        )}
      </Box>

      <FormGroup>
        {/* 基本設施 */}
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}>
          基本設施
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: { xs: 0.5, sm: 1 }
        }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.bidet || false}
                onChange={(e) => handleFilterChange('bidet', e.target.checked)}
                size="small"
              />
            }
            label="免治馬桶"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.accessible || false}
                onChange={(e) => handleFilterChange('accessible', e.target.checked)}
                size="small"
              />
            }
            label="無障礙設施"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.tissue_supply || false}
                onChange={(e) => handleFilterChange('tissue_supply', e.target.checked)}
                size="small"
              />
            }
            label="衛生紙供應"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.open_24h || false}
                onChange={(e) => handleFilterChange('open_24h', e.target.checked)}
                size="small"
              />
            }
            label="24小時開放"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          />
        </Box>

        {/* 環境品質 */}
        <Typography variant="subtitle2" gutterBottom sx={{ 
          mt: { xs: 1.5, sm: 2 }, 
          fontSize: { xs: '0.9rem', sm: '0.875rem' } 
        }}>
          環境品質
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: { xs: 1, sm: 1.5 }
        }}>
          <FormControl fullWidth size="small">
            <InputLabel>氣味</InputLabel>
            <Select
              value={localFilters.smell || ''}
              onChange={(e) => handleFilterChange('smell', e.target.value || undefined)}
              label="氣味"
            >
              <MenuItem value="">不限</MenuItem>
              <MenuItem value="good">良好</MenuItem>
              <MenuItem value="neutral">普通</MenuItem>
              <MenuItem value="bad">不佳</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small">
            <InputLabel>光線</InputLabel>
            <Select
              value={localFilters.lighting || ''}
              onChange={(e) => handleFilterChange('lighting', e.target.value || undefined)}
              label="光線"
            >
              <MenuItem value="">不限</MenuItem>
              <MenuItem value="bright">明亮</MenuItem>
              <MenuItem value="dim">昏暗</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 評分 */}
        <Typography variant="subtitle2" gutterBottom sx={{ 
          mt: { xs: 1.5, sm: 2 },
          fontSize: { xs: '0.9rem', sm: '0.875rem' }
        }}>
          最低評分
        </Typography>
        <Box sx={{ px: { xs: 1, sm: 2 } }}>
          <Slider
            value={localFilters.min_rating || 0}
            onChange={(_, value) => handleFilterChange('min_rating', value as number)}
            min={0}
            max={5}
            step={0.5}
            marks={[
              { value: 0, label: '0' },
              { value: 2.5, label: '2.5' },
              { value: 5, label: '5' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value} 星`}
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }
            }}
          />
        </Box>

        {/* 搜尋範圍 */}
        <Typography variant="subtitle2" gutterBottom sx={{ 
          mt: { xs: 1.5, sm: 2 },
          fontSize: { xs: '0.9rem', sm: '0.875rem' }
        }}>
          搜尋範圍
        </Typography>
        <Box sx={{ px: { xs: 1, sm: 2 } }}>
          <Slider
            value={localFilters.radius || 2}
            onChange={(_, value) => handleFilterChange('radius', value as number)}
            min={0.5}
            max={5}
            step={0.5}
            marks={[
              { value: 0.5, label: '0.5km' },
              { value: 2, label: '2km' },
              { value: 5, label: '5km' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}km`}
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }
            }}
          />
        </Box>
      </FormGroup>

      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 0.5, sm: 1 }, 
        mt: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          variant="contained"
          onClick={onFindNearest}
          fullWidth
          sx={{ 
            flex: { xs: 'none', sm: 2 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            py: { xs: 1, sm: 1.5 }
          }}
        >
          找最近的廁所
        </Button>
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          fullWidth
          sx={{ 
            flex: { xs: 'none', sm: 1 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            py: { xs: 1, sm: 1.5 }
          }}
        >
          清除篩選
        </Button>
      </Box>
    </Paper>
  );
};

export default FilterPanel;

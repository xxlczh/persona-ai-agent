<template>
  <div class="score-chart">
    <v-chart
      v-if="!loading"
      :option="chartOption"
      :style="{ width: '100%', height: '280px' }"
      autoresize
    />
    <div v-else class="loading-placeholder">
      <el-skeleton :rows="5" animated />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const props = defineProps({
  type: {
    type: String,
    default: 'bar',
    validator: (value) => ['bar', 'radar'].includes(value)
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 图表配置
const chartOption = computed(() => {
  if (props.type === 'bar') {
    return getBarOption()
  } else if (props.type === 'radar') {
    return getRadarOption()
  }
  return {}
})

// 柱状图配置
const getBarOption = () => {
  const data = props.data || []
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      max: 100
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        barWidth: '50%',
        data: data.map((item, index) => {
          const colors = ['#67c23a', '#409eff', '#e6a23c', '#f56c6c']
          return {
            value: item.value,
            itemStyle: {
              color: colors[index] || '#409eff'
            }
          }
        }),
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
}

// 雷达图配置
const getRadarOption = () => {
  const data = props.data || []
  const indicator = data.map(item => ({
    name: item.name,
    max: 100
  }))
  const values = data.map(item => item.value)

  return {
    tooltip: {},
    radar: {
      indicator: indicator,
      radius: '60%'
    },
    series: [
      {
        name: '维度评分',
        type: 'radar',
        data: [
          {
            value: values,
            name: '维度评分',
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.2)'
            },
            lineStyle: {
              color: '#409eff'
            },
            itemStyle: {
              color: '#409eff'
            }
          }
        ]
      }
    ]
  }
}
</script>

<style scoped>
.score-chart {
  width: 100%;
  height: 280px;
}

.loading-placeholder {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

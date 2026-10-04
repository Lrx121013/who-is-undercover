/**
 * 调色板重映射 —— 「夜桌 / 白桌」双主题
 *
 * 玩法内核是「两张几乎一样的牌」，视觉沿用卡桌语汇：
 *   毡面(felt) + 纸牌(paper) + 牌背红(card-back red) + 铜箔(brass foil)
 *
 * 角色分工（避免语义撞车）：
 *   brass  → 品牌 / 可交互 / 选中态（铜箔）
 *   red    → 危险 / 卧底 / 出局（牌背红）
 *   jade   → 就绪 / 存活 / 胜利
 *   steel  → 信息 / 进行中
 *
 * 直接重映射 Tailwind 内置色名，让全部页面无需改动即可换肤。
 */

/** 铜箔 brass —— 品牌色 */
const brass = {
  50: '#FBF6E7',
  100: '#F5EBC9',
  200: '#EBD79A',
  300: '#DFC06A',
  400: '#D2A93F',
  500: '#C9A227',
  600: '#A8841C',
  700: '#856515',
  800: '#61470E',
  900: '#3F2E08',
}

/** 牌背红 card-back red —— 危险色 */
const cardback = {
  50: '#FBEDEB',
  100: '#F6D9D5',
  200: '#E9ACA5',
  300: '#DA7A71',
  400: '#CB5A50',
  500: '#B93B31',
  600: '#9C2F27',
  700: '#7E251F',
  800: '#5F1B17',
  900: '#43110E',
}

/** 翠玉 jade —— 就绪 / 存活 / 胜利 */
const jade = {
  50: '#EAF6F0',
  100: '#CFEBDF',
  200: '#A2D7C1',
  300: '#6DBE9D',
  400: '#45A47E',
  500: '#2F8B67',
  600: '#256F53',
  700: '#1D5641',
  800: '#163D2F',
  900: '#0F281E',
}

/** 钢蓝 steel —— 信息 / 进行中（压低饱和，融进毡面） */
const steel = {
  50: '#EEF1F3',
  100: '#D8DFE4',
  200: '#B4C1CA',
  300: '#8B9FAC',
  400: '#657D8D',
  500: '#4C6373',
  600: '#3C4F5C',
  700: '#303E48',
  800: '#232D34',
  900: '#161C21',
}

/** 墨 ink —— 所有中性灰阶（替掉 slate / neutral） */
const ink = {
  50: '#F4F4F0',
  100: '#E6E6E0',
  200: '#CFCFC7',
  300: '#ADADA4',
  400: '#86867E',
  500: '#66665F',
  600: '#50504A',
  700: '#3D3D38',
  800: '#282825',
  900: '#191A18',
  950: '#0E1411',
}

/** 琥珀 amber —— 仅用于警告（游客态、难度星等） */
const amber = {
  50: '#FDF4E3',
  100: '#FAE7C0',
  200: '#F3CE84',
  300: '#EAB24C',
  400: '#DD9A2A',
  500: '#C07F17',
  600: '#9C6411',
  700: '#794B0D',
  800: '#573508',
  900: '#3A2205',
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: brass,
        indigo: brass, // 品牌
        violet: brass, // 渐变副色与品牌同族
        amber,
        rose: cardback,
        red: cardback,
        emerald: jade,
        teal: jade,
        green: jade,
        blue: steel,
        sky: steel,
        cyan: steel,
        slate: ink,
        neutral: ink,
        stone: ink,
        // 发丝线用的「黑」替换成墨色，避免冷灰线条
        black: ink,
        ink,
      },
      fontFamily: {
        // 正文：系统中文黑体，桌面/移动都无需下载
        sans: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Hiragino Sans GB"',
          '"Source Han Sans SC"',
          'system-ui',
          'sans-serif',
        ],
        // 展示：衬线，取「印刷记分单」的feel；Web Font 缺失时退回宋体
        display: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"Songti SC"',
          'STSong',
          'SimSun',
          'serif',
        ],
        // 等宽：只用在房号 / 倒计时等需要数字对齐的地方
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        // 明确的字阶，避免随手写 text-[13px]
        micro: ['0.6875rem', { lineHeight: '1.5' }],
        small: ['0.8125rem', { lineHeight: '1.6' }],
        body: ['0.9375rem', { lineHeight: '1.7' }],
        lead: ['1.0625rem', { lineHeight: '1.75' }],
        title: ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        display: ['clamp(1.6rem,3.2vw,2.35rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        hero: ['clamp(2.6rem,7.5vw,5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        card: '0.5rem',
        panel: '0.75rem',
      },
      maxWidth: {
        measure: '68ch',
      },
    },
  },
  plugins: [],
}

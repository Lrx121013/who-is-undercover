/**
 * 线性图标集 —— 24 网格、1.6 描边、currentColor。
 *
 * 之前整套界面用 emoji 当图标（🕵️ 🎭 📚 ⚖️ 🤝 🏆），在不同平台
 * 字形差异大、基线对不齐、还带彩色底。换成 SVG 后可控且安静。
 */

type P = { size?: number; className?: string }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconHome = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
  </svg>
)

export const IconRooms = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="4" width="18" height="13" rx="1.6" />
    <path d="M8 21h8M12 17v4M7.5 8.5h4M7.5 11.5h9" />
  </svg>
)

export const IconFriends = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 14.6c2 .6 3.3 2.3 3.6 4.9" />
  </svg>
)

export const IconBook = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a3 3 0 0 1 3 3v13a2.4 2.4 0 0 0-2.4-2.4H4z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a3 3 0 0 0-3 3v13a2.4 2.4 0 0 1 2.4-2.4H20z" />
  </svg>
)

export const IconTrophy = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 5.5H4.5V7a3 3 0 0 0 3 3M17 5.5h2.5V7a3 3 0 0 1-3 3" />
    <path d="M12 14v3.5M8.5 20.5h7" />
  </svg>
)

export const IconMedal = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="15" r="5" />
    <path d="m12 12.6.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L9.1 15l2-.3z" />
    <path d="m8.5 10.5-2-6.5h3l1.5 3.5M15.5 10.5l2-6.5h-3L13 7.5" />
  </svg>
)

export const IconSettings = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
  </svg>
)

export const IconBell = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5" />
    <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
  </svg>
)

export const IconSearch = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
)

export const IconPlus = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconDoor = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="M14 4 4 6v14l10 2z" />
    <circle cx="12.5" cy="12.5" r=".9" fill="currentColor" stroke="none" />
  </svg>
)

export const IconUsers = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="7.5" r="3.2" />
    <path d="M6 20c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2" />
  </svg>
)

export const IconCheck = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
)

export const IconClose = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const IconChevronRight = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)

export const IconChevronLeft = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m15 5-7 7 7 7" />
  </svg>
)

export const IconArrowLeft = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)

export const IconSun = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </svg>
)

export const IconMoon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" />
  </svg>
)

export const IconShare = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="17.5" cy="5.5" r="2.5" />
    <circle cx="6.5" cy="12" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
    <path d="m8.8 10.7 6.4-3.9M8.8 13.3l6.4 3.9" />
  </svg>
)

export const IconTrash = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4.5 6.5h15M9.5 6.5V4.8a.8.8 0 0 1 .8-.8h3.4a.8.8 0 0 1 .8.8v1.7" />
    <path d="M6.5 6.5 7.4 20a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9l.9-13.5" />
  </svg>
)

export const IconEdit = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 20h4l10-10-4-4L4 16z" />
    <path d="m14.5 5.5 4 4" />
  </svg>
)

export const IconMic = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" />
  </svg>
)

export const IconVote = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 13.5 11 4l4.5 5" />
    <path d="M11 4v9.5H4" />
    <rect x="14" y="13.5" width="6" height="6.5" rx="1" />
    <path d="M15.5 16.8h3M15.5 18.4h2" />
  </svg>
)

export const IconClock = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const IconCopy = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="1.6" />
    <path d="M15 9V5.6A1.6 1.6 0 0 0 13.4 4H5.6A1.6 1.6 0 0 0 4 5.6v7.8A1.6 1.6 0 0 0 5.6 15H9" />
  </svg>
)

export const IconLogout = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M14 7V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2" />
    <path d="M10 12h10M17 9l3 3-3 3" />
  </svg>
)

export const IconEye = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
)

export const IconGhost = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 20V10a7 7 0 0 1 14 0v10l-2.3-1.8L14.4 20 12 18.2 9.6 20l-2.3-1.8z" />
    <circle cx="9.5" cy="10.5" r=".9" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="10.5" r=".9" fill="currentColor" stroke="none" />
  </svg>
)

export const IconCards = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="6" width="10" height="14" rx="1.5" />
    <path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v12" />
  </svg>
)

export const IconSpark = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5 13.9 9l5.6 2-5.6 2-1.9 5.5L10.1 13 4.5 11l5.6-2z" />
  </svg>
)

export const IconLogoutArrow = IconLogout

import './Box3DLoader.css'

interface Props {
  text?: string
}

/** 3D 盒子加载器（by Admin12121）：游戏开始 / 发牌，8 个盒子飞入聚拢 */
export default function Box3DLoader({ text = '正在发牌…' }: Props) {
  return (
    <div className="box-scope flex flex-col items-center justify-center gap-2 py-6">
      <div className="loader">
        <div className="ground">
          <div />
        </div>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className={`box box${i}`}>
            <div />
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold tracking-widest muted">{text}</p>
    </div>
  )
}

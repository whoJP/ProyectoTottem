type TotemLogoProps = {
  size?: number
}

export function TotemLogo({ size = 22 }: TotemLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="TOTEM"
      className="totem-logo-img"
      width={size}
      height={size}
      draggable={false}
    />
  )
}

export function getGradientId(id: string = 'chart-gradients'): {
  primary: string
  success: string
  warning: string
  danger: string
  info: string
  neutral: string
} {
  return {
    primary: `url(#${id}-primary)`,
    success: `url(#${id}-success)`,
    warning: `url(#${id}-warning)`,
    danger: `url(#${id}-danger)`,
    info: `url(#${id}-info)`,
    neutral: `url(#${id}-neutral)`,
  }
}

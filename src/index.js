const themes = ['danger', 'primary', 'success', 'warning', 'info']
const style =
  'font-size:12px;background:#F5F7FA;padding-right:8px;padding-top:3px;padding-bottom:3px;'
export function logtheme(theme = '', ...rest) {
  theme = theme.toString()
  if (!themes.includes(theme)) {
    rest = [theme, ...rest]
  }
  if (typeof window !== 'undefined') {
    switch (theme.toLowerCase()) {
      case 'danger':
        console.log(`%c ${rest}`, `color:#F56C6C;${style}`)
        break
      case 'primary':
        console.log(`%c ${rest}`, `color:#409EFF;${style}`)
        break
      case 'success':
        console.log(`%c ${rest}`, `color:#ffC23A;${style}`)
        break
      case 'warning':
        console.log(`%c ${rest}`, `color:#E6A23C;${style}`)
        break
      case 'info':
        console.log(`%c ${rest}`, `color:#909399;${style}`)
        break
      default:
        console.log(`%c ${rest}`, `color:#606266;${style}`)
    }
  } else {
    // node
    switch (theme.toLowerCase()) {
      case 'danger':
        console.log('\x1B[31m%s\x1B[0m', `${rest}`)
        break
      case 'primary':
        console.log('\x1B[34m%s\x1B[0m', `${rest}`)
        break
      case 'success':
        console.log('\x1B[32m%s\x1B[0m', `${rest}`)
        break
      case 'warning':
        console.log('\x1B[33m%s\x1B[0m', `${rest}`)
        break
      case 'info':
        console.log('\x1B[1m%s\x1B[0m', `${rest}`)
        break
      default:
        console.log(`${rest}`)
    }
  }
}

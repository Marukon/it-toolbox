import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const svgContent = readFileSync(join(publicDir, 'favicon.svg'), 'utf-8')
const sizes = [192, 512]

async function generateIcons() {
  for (const size of sizes) {
    const buffer = await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toBuffer()
    
    writeFileSync(join(publicDir, `pwa-${size}x${size}.png`), buffer)
    console.log(`Generated pwa-${size}x${size}.png`)
  }
  
  const faviconBuffer = await sharp(Buffer.from(svgContent))
    .resize(32, 32)
    .png()
    .toBuffer()
  writeFileSync(join(publicDir, 'favicon-32x32.png'), faviconBuffer)
  console.log('Generated favicon-32x32.png')
  
  const appleTouchBuffer = await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toBuffer()
  writeFileSync(join(publicDir, 'apple-touch-icon.png'), appleTouchBuffer)
  console.log('Generated apple-touch-icon.png')
}

generateIcons().catch(console.error)

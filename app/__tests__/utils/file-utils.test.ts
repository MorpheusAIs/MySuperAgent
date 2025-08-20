import { formatFileSize, getFileExtension, isImageFile } from '@/services/utils/file-utils'

describe('File Utils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1.00 KB')
      expect(formatFileSize(1048576)).toBe('1.00 MB')
      expect(formatFileSize(1073741824)).toBe('1.00 GB')
    })

    it('should handle negative values', () => {
      expect(formatFileSize(-1)).toBe('0 Bytes')
    })
  })

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.txt')).toBe('txt')
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('image.jpeg')).toBe('jpeg')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('should handle files without extensions', () => {
      expect(getFileExtension('README')).toBe('')
      expect(getFileExtension('.gitignore')).toBe('')
    })
  })

  describe('isImageFile', () => {
    it('should identify image files correctly', () => {
      expect(isImageFile('photo.jpg')).toBe(true)
      expect(isImageFile('photo.jpeg')).toBe(true)
      expect(isImageFile('photo.png')).toBe(true)
      expect(isImageFile('photo.gif')).toBe(true)
      expect(isImageFile('photo.webp')).toBe(true)
    })

    it('should reject non-image files', () => {
      expect(isImageFile('document.pdf')).toBe(false)
      expect(isImageFile('video.mp4')).toBe(false)
      expect(isImageFile('script.js')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(isImageFile('photo.JPG')).toBe(true)
      expect(isImageFile('photo.PNG')).toBe(true)
    })
  })
})
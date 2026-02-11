import { useState } from 'react'

interface GpxUploaderProps {
  onFileSelect: (content: string) => void
}

export function GpxUploader({ onFileSelect }: GpxUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.gpx')) {
      alert('Please upload a GPX file')
      return
    }

    const content = await file.text()
    onFileSelect(content)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? '#4CAF50' : '#ccc'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: isDragging ? '#f0f8f0' : '#fafafa',
        cursor: 'pointer'
      }}
    >
      <input
        type="file"
        accept=".gpx"
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="gpx-input"
      />
      <label htmlFor="gpx-input" style={{ cursor: 'pointer' }}>
        <div>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>
            📁 Drop your GPX file here
          </p>
          <p style={{ color: '#666', fontSize: '14px' }}>
            or click to browse
          </p>
        </div>
      </label>
    </div>
  )
}

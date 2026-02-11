import styles from "../App.module.css"

interface GpxUploaderProps {
  onFileSelect: (content: string) => void
}

export function GpxUploader({ onFileSelect }: GpxUploaderProps) {

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
    
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDrop={handleDrop}
      className={styles.upload}
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
            📁 Upload your GPX file here
          </p>
        </div>
      </label>
    </div>
  )
}

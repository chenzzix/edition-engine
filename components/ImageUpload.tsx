'use client'

import React from 'react'
import { useDesignStore } from '../store/designStore'

// 关键点：这里必须有 export default
export default function ImageUpload() {
  const { setImages } = useDesignStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      setImages(newImages)
    }
  }

  return (
    <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
    </div>
  )
}
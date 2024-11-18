import React from 'react'

export function Progress({ value, className, ...props }) {
  return (
    <div className="relative w-full bg-gray-200 rounded-full h-2.5" {...props}>
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
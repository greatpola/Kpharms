import React, { useState } from 'react';
import { DownloadIcon } from '../icons/DownloadIcon';
import { CheckIcon } from '../icons/CheckIcon';

declare global {
    interface Window {
        htmlToImage: any;
    }
}

interface DownloadButtonProps {
  elementRef: React.RefObject<HTMLElement>;
  fileName: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ elementRef, fileName }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!elementRef.current || !window.htmlToImage) {
        console.error("Download failed: element ref or htmlToImage library not found.");
        return;
    }

    setIsDownloading(true);
    try {
      const dataUrl = await window.htmlToImage.toPng(elementRef.current, { 
          cacheBust: true, 
          backgroundColor: '#ffffff', // Explicitly set background to white
          pixelRatio: 2, // for higher resolution
      });
      const link = document.createElement('a');
      link.download = `${fileName.replace(/ /g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image generation failed.', err);
    } finally {
        setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  return (
    <button 
        onClick={handleDownload} 
        disabled={isDownloading}
        title="이미지로 다운로드"
        className="p-2 text-gray-500 hover:text-teal-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-full disabled:opacity-50"
    >
      {isDownloading ? <CheckIcon className="w-5 h-5 text-teal-600" /> : <DownloadIcon className="w-5 h-5" />}
    </button>
  );
};

export default DownloadButton;
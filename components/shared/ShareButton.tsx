import React, { useState } from 'react';
import { ShareIcon } from '../icons/ShareIcon';
import { CheckIcon } from '../icons/CheckIcon';

interface ShareButtonProps {
  shareContent: {
    title: string;
    text: string;
    url?: string;
  };
}

const ShareButton: React.FC<ShareButtonProps> = ({ shareContent }) => {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareContent);
        setShared(true);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(`${shareContent.title}\n${shareContent.text}\n${shareContent.url || ''}`);
      alert('공유 기능이 지원되지 않는 브라우저입니다. 내용이 클립보드에 복사되었습니다.');
    }
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 text-gray-500 hover:text-teal-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-full"
      title="공유하기"
    >
      {shared ? <CheckIcon className="w-5 h-5 text-teal-600" /> : <ShareIcon className="w-5 h-5" />}
    </button>
  );
};

export default ShareButton;

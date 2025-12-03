import html2canvas from 'html2canvas';
import React from 'react';

export const downloadAsPng = async (
  targetRef: React.RefObject<HTMLDivElement | null>, 
  fileName: string
) => {
  if (!targetRef.current) return;

  const element = targetRef.current;
  
  // 폰트 로딩 대기
  try {
    await document.fonts.ready;
  } catch (e) {
    console.log('Font loading check skipped');
  }

  try {
    // html2canvas의 onclone 옵션을 사용하여 클론된 문서에서만 transform 제거
    // 원본 DOM은 건드리지 않아서 화면 깜빡임 없음
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        // 클론된 요소와 모든 부모에서 transform 제거
        let parent = clonedElement.parentElement;
        while (parent) {
          parent.style.transform = 'none';
          parent.style.webkitTransform = 'none';
          parent = parent.parentElement;
        }
        
        // 클론된 요소 스타일 리셋
        clonedElement.style.transform = 'none';
        
        // 문제되는 CSS 속성 제거
        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const style = htmlEl.style;
          if (style) {
            style.backdropFilter = 'none';
            style.webkitBackdropFilter = 'none';
          }
        });
      }
    });

    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Download failed:', err);
    alert('다운로드에 실패했습니다: ' + (err as Error).message);
  }
};

